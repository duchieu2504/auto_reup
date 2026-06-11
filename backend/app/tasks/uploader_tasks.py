import os
import json
import subprocess
import logging

from app.core.celery_app import celery_app
from celery.utils.log import get_task_logger
from celery.exceptions import MaxRetriesExceededError
from app.db.session import get_db_session
from app.models.upload_schedule import UploadSchedule
from app.models.social_account import SocialAccount
from app.core.security import decrypt_data
from app.utils.proxy_resolver import resolve_proxy
from datetime import datetime
import pytz

logger = get_task_logger(__name__)


@celery_app.task(name="check_scheduled_uploads")
def check_scheduled_uploads():
    """
    Periodic task to scan DB for videos ready to be uploaded.
    Uses with_for_update(skip_locked=True) on PostgreSQL to prevent race conditions.
    """
    logger.info("Đang kiểm tra các lịch đăng bài...")
    with get_db_session() as db:
        now = datetime.now(pytz.timezone('Asia/Ho_Chi_Minh'))

        pending_schedules = db.query(UploadSchedule).filter(
            UploadSchedule.status == "pending"
        ).all()

        ids_to_dispatch = []
        for schedule in pending_schedules:
            if schedule.scheduled_time and schedule.scheduled_time > now:
                continue  # Not time yet
            schedule.status = "uploading"
            ids_to_dispatch.append(schedule.id)

        # Single commit for all status changes
        db.commit()

        # Dispatch tasks AFTER commit to ensure DB state is consistent
        for sid in ids_to_dispatch:
            execute_upload.delay(sid)


@celery_app.task(bind=True, name="execute_upload", max_retries=3)
def execute_upload(self, schedule_id: int):
    """
    Execute upload based on engine_type (playwright or adb).
    """
    logger.info(f"Bắt đầu upload cho schedule_id={schedule_id}")
    with get_db_session() as db:
        schedule = db.query(UploadSchedule).filter(
            UploadSchedule.id == schedule_id
        ).first()

        if not schedule:
            logger.warning(f"Schedule {schedule_id} not found, skipping.")
            return

        try:
            video_history = schedule.history
            account = schedule.account

            if not video_history or not account:
                raise Exception("Video hoặc tài khoản không tồn tại.")

            # Resolve video path
            video_path = video_history.final_video_path
            if not video_path or not os.path.exists(video_path):
                video_path = video_history.raw_video_path

            if not video_path or not os.path.exists(video_path):
                raise Exception(f"Không tìm thấy file video trên hệ thống: {video_path}")

            # Resolve proxy using DRY helper
            proxy = resolve_proxy(account, db)

            account_data = {
                "platform": account.platform,
                "auth_data": decrypt_data(account.auth_data),
                "device_id": account.device_id,
                "proxy_host": proxy["host"],
                "proxy_port": proxy["port"],
                "proxy_username": proxy["username"],
                "proxy_password": proxy["password"],
                "connection_type": account.connection_type,
                "user_agent": account.user_agent,
            }

            if schedule.engine_type == "playwright":
                from app.services.uploader.playwright_engine import PlaywrightUploader
                uploader = PlaywrightUploader(account_data)
            elif schedule.engine_type == "adb":
                from app.services.uploader.adb_engine import ADBUploader
                uploader = ADBUploader(account_data, schedule_id=schedule_id)
            else:
                raise Exception(f"Engine type {schedule.engine_type} không được hỗ trợ.")

            # Execute upload
            post_url = uploader.upload(video_path, schedule.caption or "", schedule.hashtags or "")

            logger.info(f"Upload thành công schedule_id={schedule_id}")
            schedule.status = "success"
            schedule.post_url = post_url
            db.commit()

        except Exception as e:
            # Check if the user manually aborted this task
            from app.services.uploader.adb_engine import TaskAbortedByUser
            if isinstance(e, TaskAbortedByUser):
                logger.warning(f"Upload bị hủy bởi người dùng schedule_id={schedule_id}: {e}")
                schedule.status = "failed"
                schedule.error_message = "Đã bị hủy bởi người dùng"
            else:
                logger.error(f"Upload thất bại schedule_id={schedule_id}: {e}")
                schedule.status = "failed"
                schedule.error_message = str(e)[:1000]  # Truncate to avoid DB overflow
            db.commit()
        finally:
            # Clean up Redis control key
            try:
                from app.core.redis_pool import get_sync_redis
                r = get_sync_redis(decode_responses=True)
                r.delete(f"task_control:{schedule_id}")
            except Exception:
                pass


@celery_app.task(bind=True, name="tasks.warmup_account", max_retries=3)
def warmup_account_task(self, account_data: dict):
    """
    Warmup account task with guaranteed DB session cleanup.
    """
    from app.services.uploader.warmup_engine import WarmupEngineFactory

    account_id = account_data.get('id')

    with get_db_session() as db:
        # Mark as warming up
        if account_id:
            acc = db.query(SocialAccount).filter_by(id=account_id).first()
            if acc:
                acc.status = "warming_up"
                db.commit()

        logger.info(f"Bắt đầu nuôi tài khoản: {account_data.get('username')}")
        try:
            engine = WarmupEngineFactory.get_engine(account_data)
            engine.warmup()
            logger.info(f"Hoàn tất nuôi tài khoản: {account_data.get('username')}")

            # Only mark active if warmup succeeded and status is still warming_up
            if account_id:
                acc = db.query(SocialAccount).filter_by(id=account_id).first()
                if acc and acc.status == "warming_up":
                    acc.status = "active"
                    db.commit()

        except Exception as e:
            error_msg = str(e).lower()
            fatal_keywords = ["không tồn tại", "không được hỗ trợ", "cấm", "bị khóa", "bị chết", "xóa khỏi"]
            is_fatal = any(kw in error_msg for kw in fatal_keywords)

            if is_fatal:
                logger.error(f"Lỗi nghiêm trọng khi nuôi tài khoản {account_data.get('username')}: {e}")
                if account_id:
                    acc = db.query(SocialAccount).filter_by(id=account_id).first()
                    if acc:
                        acc.status = "failed"
                        db.commit()
            else:
                try:
                    backoff_delays = [60, 120, 300]
                    retries = self.request.retries
                    delay = backoff_delays[retries] if retries < len(backoff_delays) else 300

                    logger.warning(
                        f"Lỗi tạm thời khi nuôi tài khoản {account_data.get('username')}: {e}. "
                        f"Đang thử lại sau {delay}s..."
                    )
                    raise self.retry(exc=e, countdown=delay)
                except MaxRetriesExceededError:
                    logger.error(f"Hết lần thử lại nuôi tài khoản {account_data.get('username')}: {e}")
                    if account_id:
                        acc = db.query(SocialAccount).filter_by(id=account_id).first()
                        if acc:
                            acc.status = "failed"
                            db.commit()


@celery_app.task(bind=True, max_retries=1)
def force_stop_device_task(self, device_id: str):
    """Force stop TikTok apps on ADB device."""
    logger.info(f"Đang gọi ADB để đóng ứng dụng cho thiết bị {device_id} từ Celery worker...")
    try:
        apps = [
            "com.ss.android.ugc.aweme",
            "com.zhiliaoapp.musically",
            "com.ss.android.ugc.trill",
        ]
        for app_id in apps:
            subprocess.run(
                ["adb", "-s", device_id, "shell", "am", "force-stop", app_id],
                timeout=5,
                capture_output=True,
            )
        subprocess.run(
            ["adb", "-s", device_id, "shell", "input", "keyevent", "3"],
            timeout=5,
            capture_output=True,
        )
    except Exception as e:
        logger.error(f"Lỗi khi đóng ứng dụng trên {device_id}: {e}")
