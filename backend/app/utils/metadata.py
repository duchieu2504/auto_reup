import os
import json
import re
from datetime import datetime

METADATA_DIR = "/data/metadata"

def _extract_id(name):
    if not name:
        return "unknown"
    match = re.search(r'(\d+)', name)
    return match.group(1) if match else name.split('.')[0]

def save_video_metadata(video_record):
    """
    Saves a VideoHistory SQLAlchemy model instance to a JSON file.
    """
    if not os.path.exists(METADATA_DIR):
        os.makedirs(METADATA_DIR, exist_ok=True)
        
    vid_id = _extract_id(video_record.original_name)
    file_path = os.path.join(METADATA_DIR, f"metadata_{vid_id}.json")
    
    # Safe date conversion
    def iso_format(dt):
        return dt.isoformat() if dt else None
        
    data = {
        "video_id": vid_id,
        "original_name": video_record.original_name,
        "source": video_record.source,
        "status": video_record.status,
        "upload_status": video_record.upload_status,
        "uploaded_platforms": video_record.uploaded_platforms,
        "upload_history": video_record.upload_history if hasattr(video_record, 'upload_history') else "[]",
        "error_message": video_record.error_message,
        "raw_video_path": video_record.raw_video_path,
        "final_video_path": video_record.final_video_path,
        "audio_tts_path": video_record.audio_tts_path,
        "srt_origin_path": video_record.srt_origin_path,
        "srt_translated_path": video_record.srt_translated_path,
        "process_config": video_record.process_config if hasattr(video_record, 'process_config') else "{}",
        "created_at": iso_format(video_record.created_at),
        "updated_at": iso_format(video_record.updated_at),
        "uploaded_at": iso_format(video_record.uploaded_at),
    }
    
    try:
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=4)
    except Exception as e:
        print(f"Failed to save metadata for {vid_id}: {e}")

def load_video_metadata():
    """
    Reads all metadata JSON files from the metadata directory.
    Returns a dictionary of vid_id -> dict of data.
    """
    if not os.path.exists(METADATA_DIR):
        return {}
        
    result = {}
    for filename in os.listdir(METADATA_DIR):
        if filename.startswith("metadata_") and filename.endswith(".json"):
            path = os.path.join(METADATA_DIR, filename)
            try:
                with open(path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    result[data.get("video_id")] = data
            except Exception as e:
                print(f"Error loading metadata from {path}: {e}")
    return result
