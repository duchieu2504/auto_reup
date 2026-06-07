from app.core.celery_app import celery_app
from celery.utils.log import get_task_logger
from celery.exceptions import MaxRetriesExceededError
from app.db.session import SessionLocal
from app.models.upload_schedule import UploadSchedule
from datetime import datetime
import pytz
import os

logger = get_task_logger(__name__)

@celery_app.task(name="check_scheduled_uploads")
def check_scheduled_uploads():
    """
    Task định kỳ quét DB để tìm các video đã đến giờ đăng
    """
    logger.info("Đang kiểm tra các lịch đăng bài...")
    db = SessionLocal()
    try:
        now = datetime.now(pytz.timezone('Asia/Ho_Chi_Minh'))
        
        # Lấy các lịch đăng pending có thời gian <= hiện tại, hoặc không hẹn giờ (null)
        pending_schedules = db.query(UploadSchedule).filter(
            UploadSchedule.status == "pending"
        ).all()
        
        for schedule in pending_schedules:
            # Kiểm tra thời gian
            if schedule.scheduled_time and schedule.scheduled_time > now:
                continue # Chưa đến giờ
                
            # Đánh dấu đang xử lý
            schedule.status = "uploading"
            db.commit()
            
            # Gửi vào queue uploader_worker
            execute_upload.delay(schedule.id)
            
    except Exception as e:
        logger.error(f"Lỗi khi check lịch đăng: {e}")
    finally:
        db.close()

@celery_app.task(bind=True, name="execute_upload", max_retries=3)
def execute_upload(self, schedule_id: int):
    """
    Thực thi upload dựa vào engine_type
    """
    logger.info(f"Bắt đầu upload cho schedule_id={schedule_id}")
    db = SessionLocal()
    try:
        schedule = db.query(UploadSchedule).filter(UploadSchedule.id == schedule_id).first()
        if not schedule:
            return
            
        video_history = schedule.history
        account = schedule.account
        
        if not video_history or not account:
            raise Exception("Video hoặc tài khoản không tồn tại.")
            
        # Lấy file path từ history
        video_path = video_history.final_video_path
        if not video_path or not os.path.exists(video_path):
             video_path = video_history.raw_video_path
             
        if not video_path or not os.path.exists(video_path):
             raise Exception(f"Không tìm thấy file video trên hệ thống: {video_path}")

        # Chuẩn bị account data
        import json
        from app.core.security import decrypt_data
        
        proxy_host = account.proxy_host
        proxy_port = account.proxy_port
        proxy_username = account.proxy_username
        proxy_password = account.proxy_password
        
        if account.proxy_id:
            from app.models.proxy import Proxy
            proxy_obj = db.query(Proxy).filter(Proxy.id == account.proxy_id).first()
            if proxy_obj:
                proxy_host = proxy_obj.host
                proxy_port = proxy_obj.port
                proxy_username = proxy_obj.username
                if proxy_obj.password:
                    try:
                        proxy_password = decrypt_data(proxy_obj.password)
                    except:
                        pass
        elif proxy_password:
            try:
                proxy_password = decrypt_data(proxy_password)
            except:
                pass

        account_data = {
            "platform": account.platform,
            "auth_data": decrypt_data(account.auth_data),
            "device_id": account.device_id,
            "proxy_host": proxy_host,
            "proxy_port": proxy_port,
            "proxy_username": proxy_username,
            "proxy_password": proxy_password,
            "connection_type": account.connection_type,
            "user_agent": account.user_agent,
        }
        
        if schedule.engine_type == "playwright":
            from app.services.uploader.playwright_engine import PlaywrightUploader
            uploader = PlaywrightUploader(account_data)
        elif schedule.engine_type == "adb":
            from app.services.uploader.adb_engine import ADBUploader
            uploader = ADBUploader(account_data)
        else:
            raise Exception(f"Engine type {schedule.engine_type} không được hỗ trợ.")
            
        # Thực thi upload
        post_url = uploader.upload(video_path, schedule.caption or "", schedule.hashtags or "")
        
        logger.info(f"Upload thành công schedule_id={schedule_id}")
        schedule.status = "success"
        schedule.post_url = post_url
        db.commit()
        
    except Exception as e:
        error_msg = str(e).lower()
        fatal_keywords = ["không tồn tại", "không được hỗ trợ", "cấm đăng bài", "bị khóa", "bị chết", "xóa khỏi", "bị cấm"]
        is_fatal = any(kw in error_msg for kw in fatal_keywords)

        if is_fatal:
            logger.error(f"Upload thất bại chí mạng (Fatal) schedule_id={schedule_id}: {e}")
            schedule.status = "failed"
            schedule.error_message = str(e)
            db.commit()
        else:
            try:
                # Exponential backoff: 60s, 120s, 300s
                backoff_delays = [60, 120, 300]
                retries = self.request.retries
                delay = backoff_delays[retries] if retries < len(backoff_delays) else 300
                
                logger.warning(f"Lỗi tạm thời khi upload schedule_id={schedule_id}: {e}. Đang thử lại lần {retries + 1} sau {delay} giây...")
                schedule.status = "retrying"
                schedule.error_message = f"Đang thử lại lần {retries + 1}: {e}"
                schedule.retry_count += 1
                db.commit()
                
                raise self.retry(exc=e, countdown=delay)
            except MaxRetriesExceededError:
                logger.error(f"Hết số lần thử lại schedule_id={schedule_id}: {e}")
                schedule.status = "failed"
                schedule.error_message = f"Đã thử lại tối đa 3 lần thất bại: {e}"
                db.commit()
    finally:
        db.close()

@celery_app.task(bind=True, name="tasks.warmup_account", max_retries=3)
def warmup_account_task(self, account_data: dict):
    from app.services.uploader.warmup_engine import WarmupEngineFactory
    from app.db.session import SessionLocal
    from app.models.social_account import SocialAccount
    import logging
    logger = logging.getLogger(__name__)
    
    account_id = account_data.get('id')
    db = SessionLocal()
    
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
                
                logger.warning(f"Lỗi tạm thời khi nuôi tài khoản {account_data.get('username')}: {e}. Đang thử lại sau {delay}s...")
                raise self.retry(exc=e, countdown=delay)
            except MaxRetriesExceededError:
                logger.error(f"Hết lần thử lại nuôi tài khoản {account_data.get('username')}: {e}")
                if account_id:
                    acc = db.query(SocialAccount).filter_by(id=account_id).first()
                    if acc:
                        acc.status = "failed"
                        db.commit()
    finally:
        if account_id and 'acc' in locals() and acc.status not in ["failed", "retrying"]:
            acc = db.query(SocialAccount).filter_by(id=account_id).first()
            if acc and acc.status == "warming_up":
                acc.status = "active"
                db.commit()
        db.close()
