import asyncio
import os
import sys
import json
import time
import uuid
import shutil
from app.core.config import DATA_DIR
from fastapi import APIRouter, Request, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
from app.tasks.processor_tasks import process_video_task
from app.core.logger import get_logger
from app.core.redis_pool import get_async_redis

logger = get_logger(__name__)
router = APIRouter()


class VideoMask(BaseModel):
    id: Optional[int] = None
    x: float
    y: float
    width: float
    height: float
    type: str
    color: str


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
    subtitle_font_family: str = "Liberation Sans"
    subtitle_text_color: str = "#000000"
    subtitle_bg_color: Optional[str] = "#FFFFFF"
    subtitle_font_size: Optional[int] = 8
    subtitle_margin_v: Optional[int] = 40
    subtitle_bg_padding: Optional[int] = 2
    subtitle_bg_opacity: Optional[int] = 100
    watermark_type: str = "none"
    watermark_text: Optional[str] = None
    watermark_image_path: Optional[str] = None
    watermark_x: float = 50.0
    watermark_y: float = 50.0
    watermark_size: float = 20.0
    watermark_color: str = "#FFFFFF"
    watermark_opacity: float = 50.0
    enable_subtitles: bool = True
    mask_enabled: bool = False
    mask_x: float = 10.0
    mask_y: float = 10.0
    mask_width: float = 20.0
    mask_height: float = 15.0
    mask_type: str = "color"
    mask_color: str = "#000000"
    masks: list[VideoMask] = []


@router.post("/upload-logo")
async def upload_logo(file: UploadFile = File(...)):
    # Validate extension
    ext = file.filename.split(".")[-1].lower()
    if ext not in ["png", "jpg", "jpeg"]:
        raise HTTPException(status_code=400, detail="Chỉ hỗ trợ file PNG và JPG.")

    # 5MB limit
    content = await file.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Kích thước file không được vượt quá 5MB.")

    # Save file
    os.makedirs(os.path.join(DATA_DIR, "watermarks"), exist_ok=True)
    filename = f"logo_{uuid.uuid4().hex[:8]}.{ext}"
    filepath = os.path.join(DATA_DIR, "watermarks", filename)

    with open(filepath, "wb") as f:
        f.write(content)

    return {"status": "success", "path": filepath, "url": f"/api/files/watermarks/{filename}"}


@router.post("/upload-video")
async def upload_video(file: UploadFile = File(...)):
    # Validate extension
    ext = file.filename.split(".")[-1].lower()
    if ext not in ["mp4", "mkv", "webm", "avi", "mov", "flv"]:
        raise HTTPException(status_code=400, detail="Chỉ hỗ trợ file video (mp4, mkv, webm, avi, mov, flv).")

    # Save file
    os.makedirs(os.path.join(DATA_DIR, "raw_videos"), exist_ok=True)
    filename = f"upload_{uuid.uuid4().hex[:8]}_{file.filename}"
    filepath = os.path.join(DATA_DIR, "raw_videos", filename)

    try:
        with open(filepath, "wb") as f:
            shutil.copyfileobj(file.file, f)
    except Exception as e:
        logger.error(f"Lỗi lưu file video upload: {e}")
        raise HTTPException(status_code=500, detail=f"Không thể lưu file video: {str(e)}")

    relative_path = f"data/raw_videos/{filename}"
    return {"status": "success", "path": relative_path, "filename": file.filename}



@router.post("/start")
async def start_processor(request: ProcessRequest):
    redis_client = get_async_redis()

    cleaned_paths = []
    for vp in request.video_paths:
        vp_clean = vp.replace("\\", "/")
        if "data/raw_videos/" in vp_clean:
            vp_clean = os.path.join(DATA_DIR, "raw_videos") + "/" + vp_clean.split("data/raw_videos/")[-1]
        cleaned_paths.append(vp_clean)

    logger.info(f"Nhận API request xử lý {len(cleaned_paths)} video qua Celery (Flip: {request.flip_video}, Force: {request.force_render})")

    # Clear pause flags and set PENDING status for immediate UI update
    try:
        from app.db.session import get_db_session
        from app.models.history import VideoHistory, ProcessStatus

        with get_db_session() as db:
            for vp_clean in cleaned_paths:
                base_name = os.path.basename(vp_clean).split('.')[0]
                await redis_client.delete(f"pause_video_{base_name}")

                # Update DB to PENDING and save config
                record = db.query(VideoHistory).filter(VideoHistory.raw_video_path.like(f"%{base_name}%")).first()
                if record:
                    old_config = {}
                    if record.process_config:
                        try:
                            old_config = json.loads(record.process_config)
                        except Exception:
                            pass

                    new_config = {
                        "voice_mode": request.voice_mode,
                        "bg_volume": request.bg_volume,
                        "flip_video": request.flip_video,
                        "subtitle_style": request.subtitle_style,
                        "opt_zoom": request.opt_zoom,
                        "opt_color": request.opt_color,
                        "opt_noise": request.opt_noise,
                        "opt_pitch": request.opt_pitch,
                        "subtitle_font_family": request.subtitle_font_family,
                        "subtitle_text_color": request.subtitle_text_color,
                        "subtitle_bg_color": request.subtitle_bg_color,
                        "subtitle_font_size": request.subtitle_font_size,
                        "subtitle_margin_v": request.subtitle_margin_v,
                        "subtitle_bg_padding": request.subtitle_bg_padding,
                        "enable_subtitles": request.enable_subtitles,
                        "mask_enabled": request.mask_enabled,
                        "mask_x": request.mask_x,
                        "mask_y": request.mask_y,
                        "mask_width": request.mask_width,
                        "mask_height": request.mask_height,
                        "mask_type": request.mask_type,
                        "mask_color": request.mask_color,
                        "masks": [m.dict() for m in request.masks],
                        "watermark_type": request.watermark_type,
                        "watermark_text": request.watermark_text,
                        "watermark_image_path": request.watermark_image_path,
                        "watermark_x": request.watermark_x,
                        "watermark_y": request.watermark_y,
                        "watermark_size": request.watermark_size,
                        "watermark_color": request.watermark_color,
                        "watermark_opacity": request.watermark_opacity,
                    }

                    config_changed = (old_config != new_config)
                    if config_changed:
                        # Delete outdated processed video to force re-render
                        out_video_path = os.path.join(DATA_DIR, "processed_videos", f"{base_name}_processed.mp4")
                        if os.path.exists(out_video_path):
                            try:
                                os.remove(out_video_path)
                                logger.info(f"Cấu hình thay đổi. Đã xóa video đã xử lý cũ: {out_video_path}")
                            except Exception as e:
                                logger.error(f"Lỗi khi xóa video cũ: {e}")

                        # Delete outdated TTS audio if voice changed
                        if old_config.get("voice_mode") != new_config.get("voice_mode"):
                            out_tts_path = os.path.join(DATA_DIR, "audio", f"{base_name}_tts.mp3")
                            if os.path.exists(out_tts_path):
                                try:
                                    os.remove(out_tts_path)
                                    logger.info(f"Thay đổi giọng đọc. Đã xóa file TTS cũ: {out_tts_path}")
                                except Exception as e:
                                    logger.error(f"Lỗi khi xóa file TTS cũ: {e}")

                    record.status = ProcessStatus.PENDING
                    record.process_config = json.dumps(new_config)
            db.commit()
    except Exception as e:
        logger.error(f"Lỗi update DB khi start: {e}")

    task = process_video_task.delay(
        cleaned_paths, request.voice_mode, request.bg_volume, request.flip_video,
        request.force_render, request.subtitle_style, request.opt_zoom, request.opt_color,
        request.opt_noise, request.opt_pitch, request.subtitle_text_color, request.subtitle_bg_color,
        request.subtitle_font_size, request.subtitle_margin_v, request.subtitle_bg_padding,
        request.subtitle_bg_opacity, request.watermark_type, request.watermark_text,
        request.watermark_image_path, request.watermark_x, request.watermark_y,
        request.watermark_size, request.watermark_color, request.watermark_opacity,
        request.subtitle_font_family, request.enable_subtitles, request.mask_enabled,
        request.mask_x, request.mask_y, request.mask_width, request.mask_height,
        request.mask_type, request.mask_color,
        [m.dict() for m in request.masks]
    )
    
    # Map task ID to base names of raw videos to control cancellation for all videos in this task
    try:
        base_names = [os.path.basename(vp).split('.')[0] for vp in cleaned_paths]
        await redis_client.set(f"task_videos_{task.id}", json.dumps(base_names), ex=86400)
    except Exception as e:
        logger.error(f"Lỗi khi lưu task videos mapping vào Redis: {e}")

    return {"status": "started", "task_id": task.id, "video_count": len(cleaned_paths)}


@router.get("/scan-folder")
async def scan_folder(folder_path: str):
    import glob
    base_raw_dir = os.path.join(DATA_DIR, "raw_videos")
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
    redis_client = get_async_redis()

    vp_clean = request.video_path.replace("\\", "/")
    if "data/raw_videos/" in vp_clean:
        vp_clean = os.path.join(DATA_DIR, "raw_videos") + "/" + vp_clean.split("data/raw_videos/")[-1]

    base_name = os.path.basename(vp_clean).split('.')[0]
    await redis_client.set(f"pause_video_{base_name}", "1")
    logger.info(f"Đã đặt cờ Pause cho video: {base_name}")

    # Update DB to PAUSED for immediate UI feedback
    try:
        from app.db.session import get_db_session
        from app.models.history import VideoHistory, ProcessStatus

        with get_db_session() as db:
            record = db.query(VideoHistory).filter(VideoHistory.raw_video_path.like(f"%{base_name}%")).first()
            if record and record.status not in [ProcessStatus.COMPLETED, ProcessStatus.FAILED]:
                record.status = ProcessStatus.PAUSED
                db.commit()
    except Exception as e:
        logger.error(f"Lỗi update DB khi pause: {e}")

    return {"status": "success", "message": f"Đã gửi lệnh dừng cho {base_name}"}


@router.get("/stream/{task_id}")
async def stream_logs(task_id: str, request: Request):
    redis_client = get_async_redis()

    async def event_generator():
        channel = f"task_log_{task_id}"
        last_index = 0
        max_idle_seconds = 600  # Timeout after 10 minutes of no messages
        last_message_time = time.monotonic()

        while True:
            if await request.is_disconnected():
                logger.info("Client ngắt kết nối stream processor.")
                break

            messages = await redis_client.lrange(channel, last_index, -1)
            if messages:
                last_message_time = time.monotonic()
                for msg in messages:
                    data = str(msg)
                    for line in data.split('\n'):
                        if line.strip():
                            yield f"data: {line}\n\n"

                    if "[DONE]" in data:
                        await redis_client.expire(channel, 60)
                        return
                last_index += len(messages)
            elif time.monotonic() - last_message_time > max_idle_seconds:
                yield f'data: {{"log": "[System] Stream timeout sau {max_idle_seconds}s không hoạt động."}}\n\n'
                return

            await asyncio.sleep(0.5)

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@router.post("/stop/{task_id}")
async def stop_processor(task_id: str):
    logger.info(f"Yêu cầu dừng task xử lý video: {task_id}")
    from app.core.celery_app import celery_app
    import json
    try:
        celery_app.control.revoke(task_id, terminate=True)
        
        # Gửi thông điệp hủy tới kênh log stream Redis để đóng kết nối và cập nhật UI phía Client
        redis_client = get_async_redis()
        channel = f"task_log_{task_id}"
        await redis_client.rpush(channel, json.dumps({"log": "[System] Tiến trình xử lý video đã bị hủy bởi người dùng.\n[DONE]\n"}))
        
        # Đặt cờ pause cho toàn bộ video thuộc task_id để dừng nhanh
        task_videos_data = await redis_client.get(f"task_videos_{task_id}")
        if task_videos_data:
            base_names = json.loads(task_videos_data)
            for base_name in base_names:
                await redis_client.set(f"pause_video_{base_name}", "1")
                logger.info(f"Đã đặt cờ Pause cho video {base_name} qua dừng task {task_id}")
                
        return {"status": "stopped", "message": "Đã gửi lệnh hủy tiến trình xử lý."}
    except Exception as e:
        logger.error(f"Lỗi khi hủy tiến trình xử lý: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
