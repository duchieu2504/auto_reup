from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from app.db.session import get_db
from app.models.upload_schedule import UploadSchedule
from app.models.history import VideoHistory
from app.models.social_account import SocialAccount

router = APIRouter()

class UploadScheduleCreate(BaseModel):
    video_history_id: int
    account_id: int
    caption: Optional[str] = None
    hashtags: Optional[str] = None
    scheduled_time: Optional[datetime] = None
    engine_type: Optional[str] = "playwright"

class UploadScheduleResponse(BaseModel):
    id: int
    video_history_id: int
    account_id: int
    caption: Optional[str]
    hashtags: Optional[str]
    scheduled_time: Optional[datetime]
    status: str
    post_url: Optional[str]
    error_message: Optional[str]
    retry_count: int
    engine_type: str
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True

class GenerateContentRequest(BaseModel):
    video_history_id: int


@router.get("/", response_model=List[UploadScheduleResponse])
def get_schedules(db: Session = Depends(get_db)):
    return db.query(UploadSchedule).order_by(UploadSchedule.created_at.desc()).all()

@router.post("/generate-content")
def generate_ai_content(req: GenerateContentRequest, db: Session = Depends(get_db)):
    from app.services.uploader.ai_content import AIContentGenerator
    
    video = db.query(VideoHistory).filter(VideoHistory.id == req.video_history_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video không tồn tại")
        
    # Thử đọc nội dung phụ đề tiếng Việt để cung cấp cho AI nếu có
    translated_text = ""
    if video.srt_translated_path:
        import os
        if os.path.exists(video.srt_translated_path):
            try:
                import pysrt
                subs = pysrt.open(video.srt_translated_path)
                translated_text = " ".join([sub.text for sub in subs])
            except Exception:
                pass
                
    ai_gen = AIContentGenerator()
    try:
        content = ai_gen.generate_viral_content(video_title=video.original_name or "Video", translated_text=translated_text)
        return content
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/", response_model=UploadScheduleResponse)
def create_schedule(schedule: UploadScheduleCreate, db: Session = Depends(get_db)):
    # Check if video exists
    video = db.query(VideoHistory).filter(VideoHistory.id == schedule.video_history_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video không tồn tại")
        
    # Check if account exists
    account = db.query(SocialAccount).filter(SocialAccount.id == schedule.account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Tài khoản MXH không tồn tại")
        
    # Check duplicate (tránh 1 video đăng 2 lần lên 1 account)
    existing = db.query(UploadSchedule).filter(
        UploadSchedule.video_history_id == schedule.video_history_id,
        UploadSchedule.account_id == schedule.account_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Video này đã được lên lịch cho tài khoản này")

    db_schedule = UploadSchedule(**schedule.model_dump())
    db.add(db_schedule)
    db.commit()
    db.refresh(db_schedule)
    
    # Nếu scheduled_time là None (đăng ngay) hoặc đã đến giờ, trigger task celery luôn
    from datetime import timezone
    should_trigger_now = (
        db_schedule.scheduled_time is None or
        db_schedule.scheduled_time <= datetime.now(timezone.utc)
    )
    if should_trigger_now:
        try:
            from app.tasks.uploader_tasks import execute_upload
            db_schedule.status = "uploading"
            db.commit()
            execute_upload.delay(db_schedule.id)
        except Exception as e:
            pass
    return db_schedule

@router.delete("/{schedule_id}")
def delete_schedule(schedule_id: int, db: Session = Depends(get_db)):
    db_schedule = db.query(UploadSchedule).filter(UploadSchedule.id == schedule_id).first()
    if not db_schedule:
        raise HTTPException(status_code=404, detail="Không tìm thấy lịch đăng")
    
    # Nếu đang upload, phải gửi tín hiệu hủy cho Celery worker qua Redis
    if db_schedule.status == "uploading":
        try:
            from app.core.redis_pool import get_sync_redis
            r = get_sync_redis(decode_responses=True)
            r.set(f"task_control:{schedule_id}", "stop", ex=300)
        except Exception:
            pass

    db.delete(db_schedule)
    db.commit()
    return {"status": "success"}

@router.post("/{schedule_id}/retry")
def retry_schedule(schedule_id: int, db: Session = Depends(get_db)):
    db_schedule = db.query(UploadSchedule).filter(UploadSchedule.id == schedule_id).first()
    if not db_schedule:
        raise HTTPException(status_code=404, detail="Không tìm thấy lịch đăng")
    
    if db_schedule.status != "failed":
        raise HTTPException(status_code=400, detail="Chỉ có thể thử lại các lịch đăng đã thất bại")
        
    db_schedule.status = "uploading"  # PHẢI là "uploading" để Celery Beat không quét trùng
    db_schedule.error_message = None
    db_schedule.scheduled_time = None  # Chuyển thành đăng ngay lập tức
    db.commit()
    
    # Gửi luôn vào hàng đợi để chạy
    try:
        from app.tasks.uploader_tasks import execute_upload
        execute_upload.delay(db_schedule.id)
    except Exception as e:
        # Nếu gửi task thất bại, đặt lại status để user có thể retry lần nữa
        db_schedule.status = "failed"
        db_schedule.error_message = f"Không thể gửi task: {e}"
        db.commit()
        
    return {"status": "success"}

@router.post("/{schedule_id}/pause")
def pause_upload(schedule_id: int, db: Session = Depends(get_db)):
    """Tạm dừng tiến trình upload đang chạy."""
    db_schedule = db.query(UploadSchedule).filter(UploadSchedule.id == schedule_id).first()
    if not db_schedule:
        raise HTTPException(status_code=404, detail="Không tìm thấy lịch đăng")
    if db_schedule.status != "uploading":
        raise HTTPException(status_code=400, detail=f"Tiến trình đang ở trạng thái '{db_schedule.status}', không thể tạm dừng")
    
    from app.core.redis_pool import get_sync_redis
    r = get_sync_redis(decode_responses=True)
    r.set(f"task_control:{schedule_id}", "pause", ex=3600)  # TTL 1 hour safety net
    return {"status": "paused"}

@router.post("/{schedule_id}/resume")
def resume_upload(schedule_id: int, db: Session = Depends(get_db)):
    """Tiếp tục tiến trình upload đã tạm dừng."""
    db_schedule = db.query(UploadSchedule).filter(UploadSchedule.id == schedule_id).first()
    if not db_schedule:
        raise HTTPException(status_code=404, detail="Không tìm thấy lịch đăng")
    if db_schedule.status != "uploading":
        raise HTTPException(status_code=400, detail=f"Tiến trình đang ở trạng thái '{db_schedule.status}', không thể tiếp tục")
    
    from app.core.redis_pool import get_sync_redis
    r = get_sync_redis(decode_responses=True)
    r.delete(f"task_control:{schedule_id}")  # Remove the pause signal
    return {"status": "resumed"}

@router.post("/{schedule_id}/stop")
def stop_upload(schedule_id: int, db: Session = Depends(get_db)):
    """Hủy tiến trình upload đang chạy."""
    db_schedule = db.query(UploadSchedule).filter(UploadSchedule.id == schedule_id).first()
    if not db_schedule:
        raise HTTPException(status_code=404, detail="Không tìm thấy lịch đăng")
    if db_schedule.status != "uploading":
        raise HTTPException(status_code=400, detail=f"Tiến trình đang ở trạng thái '{db_schedule.status}', không thể hủy")
    
    from app.core.redis_pool import get_sync_redis
    r = get_sync_redis(decode_responses=True)
    r.set(f"task_control:{schedule_id}", "stop", ex=300)  # TTL 5 min safety net
    return {"status": "stopping"}
