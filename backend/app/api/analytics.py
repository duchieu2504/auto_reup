from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from datetime import datetime, timedelta
import json

from app.db.session import get_db
from app.models.history import VideoHistory, ProcessStatus, UploadStatus
from app.models.social_account import SocialAccount

router = APIRouter()

@router.get("/dashboard-stats")
async def get_dashboard_stats(db: Session = Depends(get_db)):
    # 1. KPIs
    total_videos = db.query(VideoHistory).count()
    processed_videos = db.query(VideoHistory).filter(VideoHistory.status == ProcessStatus.COMPLETED).count()
    uploaded_videos = db.query(VideoHistory).filter(VideoHistory.upload_status == UploadStatus.UPLOADED).count()
    
    total_accounts = db.query(SocialAccount).count()
    active_accounts = db.query(SocialAccount).filter(SocialAccount.status == "active").count()

    # 2. Charts - Activity 7 Days
    # To handle both SQLite and PostgreSQL without raw complex queries, 
    # we'll fetch the last 7 days of records and aggregate them in Python
    # This is safe because 7 days of data is small.
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    recent_videos = db.query(VideoHistory).filter(VideoHistory.created_at >= seven_days_ago).all()
    
    # Initialize dictionary for the last 7 days
    activity_dict = {}
    for i in range(7):
        date_str = (datetime.utcnow() - timedelta(days=6-i)).strftime("%m-%d")
        activity_dict[date_str] = {"date": date_str, "downloaded": 0, "processed": 0, "uploaded": 0}
        
    for video in recent_videos:
        if not video.created_at:
            continue
        date_str = video.created_at.strftime("%m-%d")
        if date_str in activity_dict:
            activity_dict[date_str]["downloaded"] += 1
            if video.status == ProcessStatus.COMPLETED:
                activity_dict[date_str]["processed"] += 1
            if video.upload_status == UploadStatus.UPLOADED:
                activity_dict[date_str]["uploaded"] += 1
                
    activity_7_days = list(activity_dict.values())

    # 3. Charts - Platform Distribution (Download Source)
    source_counts = db.query(VideoHistory.source, func.count(VideoHistory.id)).group_by(VideoHistory.source).all()
    platform_distribution = [{"name": s[0] if s[0] else "Unknown", "value": s[1]} for s in source_counts]

    # 4. Charts - Status Distribution
    status_counts = db.query(VideoHistory.status, func.count(VideoHistory.id)).group_by(VideoHistory.status).all()
    status_map = {
        "pending": "Chờ xử lý",
        "downloading": "Đang tải",
        "transcribing": "Đang bóc băng",
        "translating": "Đang dịch",
        "generating_tts": "Đang tạo giọng nói",
        "rendering": "Đang render",
        "completed": "Hoàn thành",
        "failed": "Lỗi",
        "paused": "Tạm dừng"
    }
    status_distribution = [{"name": status_map.get(s[0], s[0]), "value": s[1]} for s in status_counts]

    # 5. Recent Activity
    latest_videos = db.query(VideoHistory).order_by(desc(VideoHistory.updated_at)).limit(8).all()
    recent_activity = []
    
    for v in latest_videos:
        time_str = v.updated_at.strftime("%H:%M") if v.updated_at else "N/A"
        
        if v.status == ProcessStatus.FAILED:
            recent_activity.append({"time": time_str, "type": "PROCESS", "message": f"Lỗi xử lý video {v.original_name}", "status": "error"})
        elif v.upload_status == UploadStatus.UPLOADED:
            recent_activity.append({"time": time_str, "type": "UPLOAD", "message": f"Đã upload {v.original_name}", "status": "success"})
        elif v.status == ProcessStatus.COMPLETED:
            recent_activity.append({"time": time_str, "type": "PROCESS", "message": f"Render xong {v.original_name}", "status": "success"})
        elif v.status == ProcessStatus.PENDING:
            recent_activity.append({"time": time_str, "type": "SYSTEM", "message": f"Đã thêm video {v.original_name}", "status": "pending"})
        else:
            recent_activity.append({"time": time_str, "type": "PROCESS", "message": f"Đang xử lý {v.original_name} ({v.status})", "status": "pending"})

    return {
        "kpis": {
            "total_videos": total_videos,
            "processed_videos": processed_videos,
            "uploaded_videos": uploaded_videos,
            "active_accounts": active_accounts,
            "total_accounts": total_accounts
        },
        "charts": {
            "activity_7_days": activity_7_days,
            "platform_distribution": platform_distribution,
            "status_distribution": status_distribution
        },
        "recent_activity": recent_activity
    }
