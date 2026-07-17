import os
import json
from sqlalchemy.orm import Session
from app.models.history import VideoHistory, ProcessStatus
from app.core.logger import get_logger

logger = get_logger(__name__)

def update_processing_config_and_status(db: Session, base_name: str, new_config: dict, data_dir: str):
    """
    Updates the VideoHistory configuration and sets status to TRANSCRIBING.
    If the configuration changes, it deletes outdated processed files to force a re-render.
    """
    record = db.query(VideoHistory).filter(VideoHistory.raw_video_path.like(f"%{base_name}%")).first()
    if not record:
        return None

    old_config = {}
    if record.process_config:
        try:
            old_config = json.loads(record.process_config)
        except Exception:
            pass

    force_render = new_config.get("force_render", False)
    config_changed = (old_config != new_config)
    
    if config_changed or force_render:
        # Delete outdated processed video to force re-render
        out_video_path = os.path.join(data_dir, "processed_videos", f"{base_name}_processed.mp4")
        if os.path.exists(out_video_path):
            try:
                os.remove(out_video_path)
                logger.info(f"Đã xóa video đã xử lý cũ: {out_video_path}")
            except Exception as e:
                pass

        # Delete outdated TTS audio if voice changed or force render
        if force_render or old_config.get("voice_mode") != new_config.get("voice_mode"):
            out_tts_path = os.path.join(data_dir, "audio", f"{base_name}_tts.mp3")
            if os.path.exists(out_tts_path):
                try:
                    os.remove(out_tts_path)
                    logger.info(f"Đã xóa file TTS cũ: {out_tts_path}")
                except Exception as e:
                    pass
                    
            out_srt_path = os.path.join(data_dir, "subtitles", f"{base_name}_vi.srt")
            # If force_render, also delete translated SRT so it translates again
            if force_render and os.path.exists(out_srt_path):
                try:
                    os.remove(out_srt_path)
                except Exception as e:
                    pass

    record.status = ProcessStatus.TRANSCRIBING
    record.process_config = json.dumps(new_config)
    db.commit()
    db.refresh(record)
    return record

def update_status(db: Session, base_name: str, status: ProcessStatus, exclude_statuses: list = None):
    """
    Update only the processing status of a VideoHistory record.
    """
    record = db.query(VideoHistory).filter(VideoHistory.raw_video_path.like(f"%{base_name}%")).first()
    if record:
        if exclude_statuses and record.status in exclude_statuses:
            return record
            
        record.status = status
        db.commit()
        db.refresh(record)
    return record
