import asyncio
import os
import sys
from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import redis.asyncio as redis

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
from app.tasks.processor_tasks import process_video_task
from app.core.logger import get_logger

logger = get_logger(__name__)
router = APIRouter()

REDIS_URL = os.environ.get("CELERY_BROKER_URL", "redis://localhost:6379/0")
redis_client = redis.from_url(REDIS_URL, decode_responses=True)

class ProcessRequest(BaseModel):
    video_paths: list[str]
    voice_mode: str = "edge_auto"
    bg_volume: int = 10
    flip_video: bool = False
    opt_zoom: bool = False
    opt_color: bool = False
    opt_noise: bool = False
    opt_pitch: bool = False
    force_render: bool = False
    subtitle_style: str = "black_white"

@router.post("/start")
async def start_processor(request: ProcessRequest):
    cleaned_paths = []
    for vp in request.video_paths:
        vp_clean = vp.replace("\\", "/")
        if "data/raw_videos/" in vp_clean:
            vp_clean = "/data/raw_videos/" + vp_clean.split("data/raw_videos/")[-1]
        cleaned_paths.append(vp_clean)
        
    logger.info(f"Nhận API request xử lý {len(cleaned_paths)} video qua Celery (Flip: {request.flip_video}, Force: {request.force_render})")
    
    # Xóa cờ pause và set trạng thái PENDING ngay lập tức để UI cập nhật
    try:
        from app.db.session import SessionLocal
        from app.models.history import VideoHistory, ProcessStatus
        db = SessionLocal()
        for vp_clean in cleaned_paths:
            base_name = os.path.basename(vp_clean).split('.')[0]
            await redis_client.delete(f"pause_video_{base_name}")
            
            # Cập nhật DB sang PENDING và lưu cấu hình
            record = db.query(VideoHistory).filter(VideoHistory.raw_video_path.like(f"%{base_name}%")).first()
            if record:
                record.status = ProcessStatus.PENDING
                import json
                config_data = {
                    "voice_mode": request.voice_mode,
                    "bg_volume": request.bg_volume,
                    "flip_video": request.flip_video,
                    "subtitle_style": request.subtitle_style,
                    "opt_zoom": request.opt_zoom,
                    "opt_color": request.opt_color,
                    "opt_noise": request.opt_noise,
                    "opt_pitch": request.opt_pitch
                }
                record.process_config = json.dumps(config_data)
        db.commit()
        db.close()
    except Exception as e:
        logger.error(f"Lỗi update DB khi start: {e}")
        
    task = process_video_task.delay(cleaned_paths, request.voice_mode, request.bg_volume, request.flip_video, request.force_render, request.subtitle_style, request.opt_zoom, request.opt_color, request.opt_noise, request.opt_pitch)
    return {"status": "started", "task_id": task.id, "video_count": len(cleaned_paths)}

@router.get("/scan-folder")
async def scan_folder(folder_path: str):
    import glob
    base_raw_dir = "/data/raw_videos"
    target_dir = os.path.join(base_raw_dir, folder_path).replace("\\", "/")
    
    if not os.path.exists(target_dir):
        return {"status": "error", "message": "Thư mục không tồn tại", "files": []}
        
    video_files = []
    for ext in ["*.mp4", "*.mkv", "*.webm", "*.flv"]:
        video_files.extend(glob.glob(os.path.join(target_dir, ext)))
        
    return {"status": "success", "files": [f.replace("\\", "/") for f in video_files]}

class PauseRequest(BaseModel):
    video_path: str

@router.post("/pause")
async def pause_processor(request: PauseRequest):
    vp_clean = request.video_path.replace("\\", "/")
    if "data/raw_videos/" in vp_clean:
        vp_clean = "/data/raw_videos/" + vp_clean.split("data/raw_videos/")[-1]
    
    base_name = os.path.basename(vp_clean).split('.')[0]
    await redis_client.set(f"pause_video_{base_name}", "1")
    logger.info(f"Đã đặt cờ Pause cho video: {base_name}")
    
    # Cũng update luôn DB sang trạng thái PAUSED nếu đang PENDING/TRANSCRIBING...
    # (Thực ra pipeline sẽ tự kiểm tra và update, nhưng update ở đây cho UI hiện ngay lập tức)
    try:
        from app.db.session import SessionLocal
        from app.models.history import VideoHistory, ProcessStatus
        db = SessionLocal()
        record = db.query(VideoHistory).filter(VideoHistory.raw_video_path.like(f"%{base_name}%")).first()
        if record and record.status not in [ProcessStatus.COMPLETED, ProcessStatus.FAILED]:
            record.status = ProcessStatus.PAUSED
            db.commit()
        db.close()
    except Exception as e:
        logger.error(f"Lỗi update DB khi pause: {e}")
        
    return {"status": "success", "message": f"Đã gửi lệnh dừng cho {base_name}"}

@router.get("/stream/{task_id}")
async def stream_logs(task_id: str, request: Request):
    async def event_generator():
        channel = f"task_log_{task_id}"
        last_index = 0
        while True:
            if await request.is_disconnected():
                logger.info("Client ngắt kết nối stream processor.")
                break
                
            messages = await redis_client.lrange(channel, last_index, -1)
            if messages:
                for msg in messages:
                    data = str(msg)
                    for line in data.split('\n'):
                        if line.strip():
                            yield f"data: {line}\n\n"
                            
                    if "[DONE]" in data:
                        await redis_client.expire(channel, 60)
                        return
                last_index += len(messages)
            
            await asyncio.sleep(0.5)
            
    return StreamingResponse(event_generator(), media_type="text/event-stream")
