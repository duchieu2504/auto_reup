from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, case
from datetime import datetime, timedelta, timezone

from app.db.session import get_db
from app.models.history import VideoHistory, ProcessStatus, UploadStatus
from app.models.social_account import SocialAccount

router = APIRouter()


@router.get("/dashboard-stats")
async def get_dashboard_stats(db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)

    # 1. KPIs — consolidated into 2 queries instead of 5 separate COUNT(*)
    video_stats = db.query(
        func.count(VideoHistory.id).label("total"),
        func.count(case((VideoHistory.status == ProcessStatus.COMPLETED, 1))).label("processed"),
        func.count(case((VideoHistory.upload_status == UploadStatus.UPLOADED, 1))).label("uploaded"),
    ).first()

    account_stats = db.query(
        func.count(SocialAccount.id).label("total"),
        func.count(case((SocialAccount.status == "active", 1))).label("active"),
    ).first()

    # 2. Charts - Activity 7 Days
    seven_days_ago = now - timedelta(days=7)
    recent_videos = db.query(VideoHistory).filter(VideoHistory.created_at >= seven_days_ago).all()

    # Initialize dictionary for the last 7 days
    activity_dict = {}
    for i in range(7):
        date_str = (now - timedelta(days=6 - i)).strftime("%m-%d")
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
            "total_videos": video_stats.total,
            "processed_videos": video_stats.processed,
            "uploaded_videos": video_stats.uploaded,
            "active_accounts": account_stats.active,
            "total_accounts": account_stats.total,
        },
        "charts": {
            "activity_7_days": activity_7_days,
            "platform_distribution": platform_distribution,
            "status_distribution": status_distribution,
        },
        "recent_activity": recent_activity,
    }
