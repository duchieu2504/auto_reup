import os
from fastapi import APIRouter, Depends, HTTPException, Query
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
    schedules: List[ScheduleSimple] = []

    class Config:
        from_attributes = True

@router.get("/", response_model=List[VideoHistoryResponse])
def get_history(
    db: Session = Depends(get_db),
    source: Optional[str] = None,
    status: Optional[str] = None,
    date: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
):
    query = db.query(VideoHistory)
    if source:
        query = query.filter(VideoHistory.source == source)
    if status:
        query = query.filter(VideoHistory.status == status)
    if date:
        # Lọc theo ngày (YYYY-MM-DD)
        query = query.filter(func.date(VideoHistory.created_at) == date)
    
    records = query.order_by(VideoHistory.created_at.desc()).offset(skip).limit(limit).all()
    
    for r in records:
        r.schedules = db.query(UploadSchedule).filter(UploadSchedule.video_history_id == r.id).all()
        
    return records

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
        metadata_dir = "/data/metadata"
        if os.path.exists(metadata_dir):
            for root, dirs, files in os.walk(metadata_dir):
                for file in files:
                    file_path = os.path.join(root, file)
                    arcname = os.path.relpath(file_path, "/data")
                    zipf.write(file_path, arcname)
                    
        accounts_dir = "/data/accounts"
        if os.path.exists(accounts_dir):
            for root, dirs, files in os.walk(accounts_dir):
                for file in files:
                    file_path = os.path.join(root, file)
                    arcname = os.path.relpath(file_path, "/data")
                    zipf.write(file_path, arcname)
                    
    return FileResponse(
        path=zip_path,
        filename=backup_filename,
        media_type='application/zip'
    )


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
            if path and os.path.exists(path):
                try:
                    os.remove(path)
                except Exception as e:
                    print(f"Error deleting file {path}: {e}")
        
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
            exists.raw_video_path = data.get("raw_video_path", exists.raw_video_path)
            exists.final_video_path = data.get("final_video_path", exists.final_video_path)
            exists.audio_tts_path = data.get("audio_tts_path", exists.audio_tts_path)
            exists.srt_origin_path = data.get("srt_origin_path", exists.srt_origin_path)
            exists.srt_translated_path = data.get("srt_translated_path", exists.srt_translated_path)
            if parse_date(data.get("uploaded_at")):
                exists.uploaded_at = parse_date(data.get("uploaded_at"))
            updated_count += 1
        else:
            # Insert
            new_record = VideoHistory(
                original_name=data.get("original_name", f"{vid_id}.mp4"),
                source=data.get("source", "Imported"),
                status=data.get("status", ProcessStatus.PENDING),
                upload_status=data.get("upload_status", UploadStatus.NOT_UPLOADED),
                uploaded_platforms=data.get("uploaded_platforms"),
                upload_history=data.get("upload_history", "[]") if isinstance(data.get("upload_history", "[]"), str) else json.dumps(data.get("upload_history", "[]")),
                error_message=data.get("error_message"),
                raw_video_path=data.get("raw_video_path"),
                final_video_path=data.get("final_video_path"),
                audio_tts_path=data.get("audio_tts_path"),
                srt_origin_path=data.get("srt_origin_path"),
                srt_translated_path=data.get("srt_translated_path"),
                uploaded_at=parse_date(data.get("uploaded_at"))
            )
            db.add(new_record)
            added_count += 1
    
    db.commit()

    # 2. Quét file mồ côi (Fallback nếu không có JSON)
    all_mp4 = glob.glob("/data/**/*.mp4", recursive=True)
    all_mp3 = glob.glob("/data/**/*.mp3", recursive=True)
    all_srt = glob.glob("/data/**/*.srt", recursive=True)
    
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
    return {"status": "success", "added_count": added_count, "updated_count": updated_count}
