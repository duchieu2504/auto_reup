from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.db.session import get_db
from app.models.live_job import LiveStreamJob
from app.services.crawler.douyin_live import get_douyin_live_stream_url
from app.services.processor.live_engine import LiveEngine

router = APIRouter()
live_engine = LiveEngine()

class StartLiveRequest(BaseModel):
    douyin_url: str
    rtmp_url: str
    stream_key: str
    target_account_name: str = ""
    flip_horizontal: bool = False

@router.post("/start")
def start_live_restream(req: StartLiveRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    try:
        # 1. Trích xuất FLV từ Douyin
        flv_url = get_douyin_live_stream_url(req.douyin_url)
        
        # 2. Tạo bản ghi Job
        job = LiveStreamJob(
            douyin_url=req.douyin_url,
            rtmp_url=req.rtmp_url,
            stream_key=req.stream_key,
            target_account_name=req.target_account_name,
            status="starting"
        )
        db.add(job)
        db.commit()
        db.refresh(job)
        
        # 3. Kích hoạt tiến trình ngầm FFmpeg
        background_tasks.add_task(
            live_engine.start_restream,
            job_id=job.id,
            douyin_flv_url=flv_url,
            rtmp_url=req.rtmp_url,
            stream_key=req.stream_key,
            flip_horizontal=req.flip_horizontal
        )
        
        return {"success": True, "job_id": job.id, "message": "Đang khởi chạy luồng Live Restream."}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/stop/{job_id}")
def stop_live_restream(job_id: int, db: Session = Depends(get_db)):
    job = db.query(LiveStreamJob).filter(LiveStreamJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Không tìm thấy luồng Live")
        
    success = live_engine.stop_restream(job_id)
    if success:
        return {"success": True, "message": "Đã dừng luồng Live."}
    else:
        raise HTTPException(status_code=500, detail="Không thể dừng tiến trình FFmpeg.")

@router.get("/status")
def get_live_status(db: Session = Depends(get_db)):
    jobs = db.query(LiveStreamJob).order_by(LiveStreamJob.id.desc()).limit(10).all()
    return {"jobs": jobs}
