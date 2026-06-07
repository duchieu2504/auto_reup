import os
import re
import httpx
from datetime import datetime, timedelta, timezone
from celery import shared_task
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.social_account import SocialAccount
from app.models.upload_schedule import UploadSchedule

def fetch_views_from_url(url: str) -> int:
    """Hàm bóc tách lượt xem từ URL TikTok/Douyin (Basic)."""
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        resp = httpx.get(url, headers=headers, timeout=10.0, follow_redirects=True)
        html = resp.text
        
        # Thử tìm play_count hoặc playCount trong JSON data ẩn
        match = re.search(r'"play[C_]ount"\s*:\s*(\d+)', html, re.IGNORECASE)
        if match:
            return int(match.group(1))
            
        match2 = re.search(r'"play_count"\s*:\s*(\d+)', html, re.IGNORECASE)
        if match2:
            return int(match2.group(1))
            
        return 0 # Không bóc được hoặc 0 view
    except Exception as e:
        print(f"Lỗi khi fetch view url {url}: {e}")
        return 0

@shared_task(name="check_all_accounts_health_task", bind=True, max_retries=1)
def check_all_accounts_health_task(self):
    from dotenv import load_dotenv
    env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../data/.env"))
    load_dotenv(env_path, override=True)
    
    # Kiểm tra xem có bật tính năng không
    enable = os.getenv("ENABLE_HEALTH_CHECK", "False").lower() == "true"
    if not enable:
        print("Tính năng Health Check đang tắt.")
        return "Disabled"
        
    db: Session = SessionLocal()
    try:
        interval_hours = int(os.getenv("HEALTH_CHECK_INTERVAL_HOURS", 4))
        # Lấy các tài khoản active
        accounts = db.query(SocialAccount).filter(SocialAccount.status.in_(["active", "shadowbanned"])).all()
        for account in accounts:
            # Kiểm tra thời gian check gần nhất
            if account.health_checked_at:
                hours_since_last_check = (datetime.now(timezone.utc) - account.health_checked_at.replace(tzinfo=timezone.utc)).total_seconds() / 3600
                if hours_since_last_check < interval_hours:
                    continue # Chưa tới lúc check
            
            print(f"Đang kiểm tra sức khỏe tài khoản {account.username}...")
            # Lấy các video up thành công trong vòng 3 ngày qua mà chưa check health (hoặc check ra 0)
            three_days_ago = datetime.now(timezone.utc) - timedelta(days=3)
            recent_uploads = db.query(UploadSchedule).filter(
                UploadSchedule.account_id == account.id,
                UploadSchedule.status == "success",
                UploadSchedule.post_url.isnot(None),
                UploadSchedule.post_url != "",
                UploadSchedule.created_at >= three_days_ago,
                (UploadSchedule.health_status == "unknown") | (UploadSchedule.views_count == 0)
            ).all()
            
            zero_view_count = 0
            for upload in recent_uploads:
                views = fetch_views_from_url(upload.post_url)
                upload.views_count = views
                
                # Check health status
                # Tuổi của video phải > 24h thì mới kết luận shadowban
                if upload.created_at:
                    age_hours = (datetime.now(timezone.utc) - upload.created_at.replace(tzinfo=timezone.utc)).total_seconds() / 3600
                    if age_hours >= 24:
                        if views == 0:
                            upload.health_status = "shadowbanned"
                            zero_view_count += 1
                        else:
                            upload.health_status = "healthy"
                    else:
                        upload.health_status = "pending_24h" # Chưa đủ 24h
            
            # Cập nhật thời gian kiểm tra của account
            account.health_checked_at = datetime.now(timezone.utc)
            
            # Nếu có >= 3 video liên tiếp (hoặc trong 3 ngày) bị 0 view -> Đánh dấu shadowbanned
            if zero_view_count >= 3:
                account.status = "shadowbanned"
                print(f"⚠️ CẢNH BÁO: Tài khoản {account.username} có khả năng bị Shadowban!")
            elif account.status == "shadowbanned" and zero_view_count == 0 and len(recent_uploads) > 0:
                # Đã nhả shadowban
                account.status = "active"
                
        db.commit()
        print("✅ Hoàn tất kiểm tra Health Check.")
        return "Success"
    except Exception as e:
        db.rollback()
        print(f"Lỗi Health Check: {e}")
        raise e
    finally:
        db.close()
