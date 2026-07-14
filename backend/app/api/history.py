import os
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse, Response
from app.core.config import DATA_DIR
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from app.db.session import get_db
from app.models.history import VideoHistory, ProcessStatus, UploadStatus
from app.models.upload_schedule import UploadSchedule
from app.models.social_account import SocialAccount

router = APIRouter()

import subprocess
import hashlib
from fastapi.responses import FileResponse
import imageio_ffmpeg

def pre_generate_thumbnail(path: str, time: int = 3):
    if not path:
        return
    clean_path = path
    if path.startswith("deleted:"):
        clean_path = path.replace("deleted:", "", 1)
        
    if not os.path.exists(clean_path):
        return
        
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../data"))
    temp_dir = os.path.join(base_dir, "temp")
    os.makedirs(temp_dir, exist_ok=True)
    
    file_hash = hashlib.md5(f"{clean_path}_{time}".encode()).hexdigest()
    thumb_path = os.path.join(temp_dir, f"thumb_{file_hash}.jpg")
    
    if not os.path.exists(thumb_path):
        try:
            ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
            hours = time // 3600
            minutes = (time % 3600) // 60
            seconds = time % 60
            time_str = f"{hours:02d}:{minutes:02d}:{seconds:02d}"
            subprocess.run([
                ffmpeg_exe, '-y', '-ss', time_str, '-i', clean_path, '-frames:v', '1', '-update', '1', thumb_path
            ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        except Exception as e:
            print(f"Error pre-generating thumbnail: {e}")

import asyncio

thumbnail_semaphore = asyncio.Semaphore(4)

@router.get("/thumbnail")
async def get_thumbnail(path: str, time: int = 3):
    if not path:
        raise HTTPException(status_code=400, detail="Path is empty")
        
    clean_path = path
    if path.startswith("deleted:"):
        clean_path = path.replace("deleted:", "", 1)
        
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../data"))
    temp_dir = os.path.join(base_dir, "temp")
    os.makedirs(temp_dir, exist_ok=True)
    
    file_hash = hashlib.md5(f"{clean_path}_{time}".encode()).hexdigest()
    thumb_path = os.path.join(temp_dir, f"thumb_{file_hash}.jpg")
    
    if os.path.exists(thumb_path):
        return FileResponse(thumb_path, media_type="image/jpeg", headers={"Cache-Control": "public, max-age=3600"})
        
    if not os.path.exists(clean_path):
        raise HTTPException(status_code=404, detail="File video gốc không tồn tại để sinh thumbnail")
        
    # Format time to HH:MM:SS
    hours = time // 3600
    minutes = (time % 3600) // 60
    seconds = time % 60
    time_str = f"{hours:02d}:{minutes:02d}:{seconds:02d}"
    
    try:
        ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
        async with thumbnail_semaphore:
            def run_ffmpeg():
                import subprocess
                subprocess.run(
                    [ffmpeg_exe, '-y', '-ss', time_str, '-i', clean_path, '-frames:v', '1', '-update', '1', thumb_path],
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL
                )
            await asyncio.to_thread(run_ffmpeg)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
            
    return FileResponse(thumb_path, media_type="image/jpeg", headers={"Cache-Control": "public, max-age=3600"})

class SocialAccountSimple(BaseModel):
    id: int
    platform: str
    username: Optional[str]
    avatar_url: Optional[str]

    class Config:
        from_attributes = True

class ScheduleSimple(BaseModel):
    id: int
    status: str
    post_url: Optional[str]
    account: Optional[SocialAccountSimple]

    class Config:
        from_attributes = True

class VideoHistoryResponse(BaseModel):
    id: int
    original_name: str
    source: str
    status: str
    upload_status: str
    uploaded_platforms: Optional[str]
    upload_history: Optional[str] = "[]"
    uploaded_at: Optional[datetime]
    created_at: datetime
    raw_video_path: Optional[str]
    srt_origin_path: Optional[str]
    srt_translated_path: Optional[str]
    audio_tts_path: Optional[str]
    final_video_path: Optional[str]
    process_config: Optional[str] = "{}"
    error_message: Optional[str] = None
    original_caption: Optional[str] = None
    original_hashtags: Optional[str] = None
    schedules: List[ScheduleSimple] = []

    class Config:
        from_attributes = True

class PaginatedHistoryResponse(BaseModel):
    data: List[VideoHistoryResponse]
    total: int
    page: int
    pages: int
    limit: int

@router.get("/", response_model=PaginatedHistoryResponse)
def get_history(
    db: Session = Depends(get_db),
    search: Optional[str] = None,
    source: Optional[str] = None,
    status: Optional[str] = None,
    date: Optional[str] = None,
    page: int = 1,
    limit: int = 20
):
    from sqlalchemy.orm import selectinload, defer

    query = db.query(VideoHistory)
    if source:
        query = query.filter(VideoHistory.source == source)
    if status:
        query = query.filter(VideoHistory.status == status)
    if date:
        # Lọc theo ngày (YYYY-MM-DD)
        query = query.filter(func.date(VideoHistory.created_at) == date)
    
    if search:
        query = query.filter(VideoHistory.original_name.ilike(f"%{search}%"))
        
    total = query.count()
    pages = (total + limit - 1) // limit
    skip = (page - 1) * limit
    
    # Eager load schedules + account, defer heavy columns not needed for listing
    records = (
        query
        .options(
            selectinload(VideoHistory.schedules).joinedload(UploadSchedule.account),
            defer(VideoHistory.process_config),
        )
        .order_by(VideoHistory.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    
    return {
        "data": records,
        "total": total,
        "page": page,
        "pages": pages,
        "limit": limit
    }

class StatusResponse(BaseModel):
    id: int
    status: str
    error_message: Optional[str] = None

@router.get("/status", response_model=List[StatusResponse])
def get_history_status(
    ids: str = Query(..., description="Comma separated list of IDs"),
    db: Session = Depends(get_db)
):
    id_list = [int(id.strip()) for id in ids.split(",") if id.strip().isdigit()]
    records = db.query(VideoHistory.id, VideoHistory.status, VideoHistory.error_message).filter(VideoHistory.id.in_(id_list)).all()
    return [{"id": r.id, "status": r.status, "error_message": r.error_message} for r in records]
from fastapi.responses import FileResponse
import zipfile
import tempfile

@router.get("/backup")
def backup_data():
    """
    Creates a zip backup of the /data/metadata and /data/accounts directories and returns it.
    """
    from datetime import datetime
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_filename = f"backup_data_{timestamp}.zip"
    
    temp_dir = tempfile.gettempdir()
    zip_path = os.path.join(temp_dir, backup_filename)
    
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        metadata_dir = os.path.join(DATA_DIR, "metadata")
        if os.path.exists(metadata_dir):
            for root, dirs, files in os.walk(metadata_dir):
                for file in files:
                    file_path = os.path.join(root, file)
                    arcname = os.path.relpath(file_path, DATA_DIR)
                    zipf.write(file_path, arcname)
                    
        accounts_dir = os.path.join(DATA_DIR, "accounts")
        if os.path.exists(accounts_dir):
            for root, dirs, files in os.walk(accounts_dir):
                for file in files:
                    file_path = os.path.join(root, file)
                    arcname = os.path.relpath(file_path, DATA_DIR)
                    zipf.write(file_path, arcname)
                    
    return FileResponse(
        path=zip_path,
        filename=backup_filename,
        media_type='application/zip'
    )


@router.post("/{video_id}/delete-files")
def delete_video_files(video_id: int, db: Session = Depends(get_db)):
    record = db.query(VideoHistory).filter(VideoHistory.id == video_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Không tìm thấy lịch sử video")
        
    # 1. Sinh thumbnail sẵn trước khi xóa
    if record.raw_video_path:
        pre_generate_thumbnail(record.raw_video_path)
    if record.final_video_path:
        pre_generate_thumbnail(record.final_video_path)
        
    # 2. Xóa các file video vật lý
    deleted_files = []
    
    # Xử lý raw_video_path
    if record.raw_video_path and not record.raw_video_path.startswith("deleted:"):
        path = record.raw_video_path
        if os.path.exists(path):
            try:
                os.remove(path)
                deleted_files.append(path)
            except Exception as e:
                print(f"Error deleting raw file: {e}")
        record.raw_video_path = f"deleted:{path}"
        
    # Xử lý final_video_path
    if record.final_video_path and not record.final_video_path.startswith("deleted:"):
        path = record.final_video_path
        if os.path.exists(path):
            try:
                os.remove(path)
                deleted_files.append(path)
            except Exception as e:
                print(f"Error deleting final file: {e}")
        record.final_video_path = f"deleted:{path}"
        
    # 3. Remove from SyncManager history
    try:
        from app.services.crawler.sync_manager import SyncManager
        vid_id = record.original_name.split('.')[0]
        SyncManager().remove_from_history(vid_id)
    except Exception as e:
        print(f"Error removing from sync history: {e}")
        
    db.commit()
    return {"status": "success", "deleted_files": deleted_files}


@router.get("/{video_id}", response_model=VideoHistoryResponse)
def get_history_by_id(video_id: int, db: Session = Depends(get_db)):
    record = db.query(VideoHistory).filter(VideoHistory.id == video_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Không tìm thấy lịch sử video")
    return record


class BulkDeleteRequest(BaseModel):
    ids: List[int]

@router.delete("/bulk")
def bulk_delete_history(request: BulkDeleteRequest, db: Session = Depends(get_db)):
    from app.services.crawler.sync_manager import SyncManager
    sync_manager = SyncManager()
    
    records = db.query(VideoHistory).filter(VideoHistory.id.in_(request.ids)).all()
    
    for record in records:
        # Delete physical files
        for path in [
            record.raw_video_path,
            record.srt_origin_path,
            record.srt_translated_path,
            record.audio_tts_path,
            record.final_video_path
        ]:
            if path and not path.startswith("deleted:") and os.path.exists(path):
                try:
                    os.remove(path)
                except Exception as e:
                    print(f"Error deleting file {path}: {e}")
                    
        # Remove from SyncManager history
        try:
            vid_id = record.original_name.split('.')[0]
            sync_manager.remove_from_history(vid_id)
        except Exception as e:
            print(f"Error removing from sync history: {e}")
        
        db.delete(record)
    
    db.commit()
    return {"status": "success", "deleted_count": len(records)}

class UpdateUploadStatusRequest(BaseModel):
    upload_status: str
    uploaded_platforms: Optional[str] = None

@router.put("/{video_id}")
def update_history(video_id: int, request: UpdateUploadStatusRequest, db: Session = Depends(get_db)):
    record = db.query(VideoHistory).filter(VideoHistory.id == video_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Không tìm thấy lịch sử video")
    
    record.upload_status = request.upload_status
    record.uploaded_platforms = request.uploaded_platforms
    record.uploaded_at = func.now()
    
    db.commit()
    db.refresh(record)
    return record

@router.post("/sync")
def sync_data(db: Session = Depends(get_db)):
    import glob
    import os
    import re
    from collections import defaultdict
    from app.utils.metadata import load_video_metadata, METADATA_DIR
    from datetime import datetime

    added_count = 0
    updated_count = 0
    schedules_count = 0
    
    # 1. Khôi phục từ Shadow Metadata (Nguồn chân lý số 1)
    metadata_records = load_video_metadata()
    for vid_id, data in metadata_records.items():
        # Kiểm tra tồn tại
        exists = db.query(VideoHistory).filter(VideoHistory.id == data.get("id")).first()
        if not exists:
            exists = db.query(VideoHistory).filter(VideoHistory.original_name == data.get("original_name")).first()
            
        def parse_date(date_str):
            if not date_str: return None
            try:
                return datetime.fromisoformat(date_str)
            except:
                return None

        def verify_path(path):
            if path and not path.startswith("deleted:") and not os.path.exists(path):
                return f"deleted:{path}"
            return path

        if exists:
            # Update
            import json
            exists.source = data.get("source", exists.source)
            exists.status = data.get("status", exists.status)
            exists.upload_status = data.get("upload_status", exists.upload_status)
            exists.uploaded_platforms = data.get("uploaded_platforms", exists.uploaded_platforms)
            
            uh = data.get("upload_history")
            if uh is not None:
                exists.upload_history = uh if isinstance(uh, str) else json.dumps(uh)
                
            exists.error_message = data.get("error_message", exists.error_message)
            exists.raw_video_path = verify_path(data.get("raw_video_path", exists.raw_video_path))
            exists.final_video_path = verify_path(data.get("final_video_path", exists.final_video_path))
            exists.audio_tts_path = data.get("audio_tts_path", exists.audio_tts_path)
            exists.srt_origin_path = data.get("srt_origin_path", exists.srt_origin_path)
            exists.srt_translated_path = data.get("srt_translated_path", exists.srt_translated_path)
            exists.original_caption = data.get("original_caption", exists.original_caption)
            exists.original_hashtags = data.get("original_hashtags", exists.original_hashtags)
            if parse_date(data.get("uploaded_at")):
                exists.uploaded_at = parse_date(data.get("uploaded_at"))
            updated_count += 1
            record_to_sync_schedules = exists
        else:
            # Insert
            import json
            new_record = VideoHistory(
                original_name=data.get("original_name", f"{vid_id}.mp4"),
                source=data.get("source", "Imported"),
                status=data.get("status", ProcessStatus.PENDING),
                upload_status=data.get("upload_status", UploadStatus.NOT_UPLOADED),
                uploaded_platforms=data.get("uploaded_platforms"),
                upload_history=data.get("upload_history", "[]") if isinstance(data.get("upload_history", "[]"), str) else json.dumps(data.get("upload_history", "[]")),
                error_message=data.get("error_message"),
                raw_video_path=verify_path(data.get("raw_video_path")),
                final_video_path=verify_path(data.get("final_video_path")),
                audio_tts_path=data.get("audio_tts_path"),
                srt_origin_path=data.get("srt_origin_path"),
                srt_translated_path=data.get("srt_translated_path"),
                original_caption=data.get("original_caption"),
                original_hashtags=data.get("original_hashtags"),
                uploaded_at=parse_date(data.get("uploaded_at"))
            )
            db.add(new_record)
            db.flush() # Lấy ID mới
            added_count += 1
            record_to_sync_schedules = new_record
            
        # Sync UploadSchedules
        schedules_data = data.get("schedules", [])
        for sch_data in schedules_data:
            existing_sch = db.query(UploadSchedule).filter(
                UploadSchedule.video_history_id == record_to_sync_schedules.id,
                UploadSchedule.account_id == sch_data.get("account_id")
            ).first()
            
            if existing_sch:
                existing_sch.engine_type = sch_data.get("engine_type", existing_sch.engine_type)
                existing_sch.status = sch_data.get("status", existing_sch.status)
                existing_sch.caption = sch_data.get("caption", existing_sch.caption)
                existing_sch.hashtags = sch_data.get("hashtags", existing_sch.hashtags)
                existing_sch.post_url = sch_data.get("post_url", existing_sch.post_url)
                existing_sch.error_message = sch_data.get("error_message", existing_sch.error_message)
                if parse_date(sch_data.get("scheduled_time")):
                    existing_sch.scheduled_time = parse_date(sch_data.get("scheduled_time"))
            else:
                new_sch = UploadSchedule(
                    video_history_id=record_to_sync_schedules.id,
                    account_id=sch_data.get("account_id"),
                    engine_type=sch_data.get("engine_type", "playwright"),
                    status=sch_data.get("status", "pending"),
                    caption=sch_data.get("caption"),
                    hashtags=sch_data.get("hashtags"),
                    scheduled_time=parse_date(sch_data.get("scheduled_time")),
                    post_url=sch_data.get("post_url"),
                    error_message=sch_data.get("error_message"),
                    created_at=parse_date(sch_data.get("created_at")) or func.now(),
                db.add(new_sch)
            schedules_count += 1
    
    db.commit()

    # 2. Quét file mồ côi (Fallback nếu không có JSON)
    all_mp4 = glob.glob(os.path.join(DATA_DIR, "**", "*.mp4"), recursive=True)
    all_mp3 = glob.glob(os.path.join(DATA_DIR, "**", "*.mp3"), recursive=True)
    all_srt = glob.glob(os.path.join(DATA_DIR, "**", "*.srt"), recursive=True)
    
    grouped = defaultdict(dict)
    
    def extract_id(filepath):
        basename = os.path.basename(filepath)
        match = re.search(r'(\d+)', basename)
        return match.group(1) if match else basename.split('.')[0]
        
    for mp4 in all_mp4:
        mp4_clean = mp4.replace("\\", "/")
        vid_id = extract_id(mp4_clean)
        
        # Nếu đã có metadata JSON thì bỏ qua bước Regex
        if vid_id in metadata_records:
            continue
            
        if "processed" in mp4_clean.lower() or "final" in mp4_clean.lower() or "/processed_videos/" in mp4_clean:
            grouped[vid_id]["final_video_path"] = mp4_clean
        else:
            grouped[vid_id]["raw_video_path"] = mp4_clean
            grouped[vid_id]["original_name"] = os.path.basename(mp4_clean)
            
    # Gắn audio
    for mp3 in all_mp3:
        mp3_clean = mp3.replace("\\", "/")
        vid_id = extract_id(mp3_clean)
        if vid_id in grouped:
            grouped[vid_id]["audio_tts_path"] = mp3_clean
            
    # Gắn sub
    for srt in all_srt:
        srt_clean = srt.replace("\\", "/")
        vid_id = extract_id(srt_clean)
        if vid_id in grouped:
            if "vi" in srt_clean.lower() or "translated" in srt_clean.lower():
                grouped[vid_id]["srt_translated_path"] = srt_clean
            elif "orig" in srt_clean.lower():
                grouped[vid_id]["srt_origin_path"] = srt_clean
            elif "srt_origin_path" not in grouped[vid_id]:
                grouped[vid_id]["srt_origin_path"] = srt_clean # fallback
                
    # Insert hoặc Update file mồ côi vào DB
    for vid_id, data in grouped.items():
        raw_path = data.get("raw_video_path", "")
        final_path = data.get("final_video_path", "")
        
        exists = db.query(VideoHistory).filter(
            ((VideoHistory.raw_video_path == raw_path) & (raw_path != "")) |
            ((VideoHistory.final_video_path == final_path) & (final_path != "")) |
            (VideoHistory.original_name.like(f"%{vid_id}%"))
        ).first()
        
        has_processed = "final_video_path" in data
        status = ProcessStatus.COMPLETED if has_processed else ProcessStatus.PENDING
        
        if exists:
            updated = False
            if has_processed and not exists.final_video_path:
                exists.final_video_path = final_path
                exists.status = status
                updated = True
            
            if "audio_tts_path" in data and not exists.audio_tts_path:
                exists.audio_tts_path = data["audio_tts_path"]
                updated = True
            if "srt_origin_path" in data and not exists.srt_origin_path:
                exists.srt_origin_path = data["srt_origin_path"]
                updated = True
            if "srt_translated_path" in data and not exists.srt_translated_path:
                exists.srt_translated_path = data["srt_translated_path"]
                updated = True
                
            if updated:
                updated_count += 1
            continue
            
        original_name = data.get("original_name", f"{vid_id}.mp4")
        
        new_record = VideoHistory(
            original_name=original_name,
            source="Imported",
            status=status,
            upload_status=UploadStatus.NOT_UPLOADED,
            raw_video_path=data.get("raw_video_path"),
            final_video_path=data.get("final_video_path"),
            audio_tts_path=data.get("audio_tts_path"),
            srt_origin_path=data.get("srt_origin_path"),
            srt_translated_path=data.get("srt_translated_path")
        )
        db.add(new_record)
        added_count += 1
        
    db.commit()
    return {"status": "success", "added_count": added_count, "updated_count": updated_count, "schedules_count": schedules_count}

