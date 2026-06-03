from sqlalchemy import Column, Integer, String, DateTime, Text, Enum
from sqlalchemy.sql import func
import enum
from app.db.session import Base

class ProcessStatus(str, enum.Enum):
    PENDING = "pending"
    DOWNLOADING = "downloading"
    TRANSCRIBING = "transcribing"
    TRANSLATING = "translating"
    GENERATING_TTS = "generating_tts"
    RENDERING = "rendering"
    COMPLETED = "completed"
    FAILED = "failed"
    PAUSED = "paused"

class UploadStatus(str, enum.Enum):
    NOT_UPLOADED = "not_uploaded"
    UPLOADED = "uploaded"

class VideoHistory(Base):
    __tablename__ = "video_history"

    id = Column(Integer, primary_key=True, index=True)
    original_name = Column(String, index=True)
    source = Column(String, index=True) # Douyin, Xiaohongshu...
    
    # Tiền trình
    status = Column(String, default=ProcessStatus.PENDING)
    error_message = Column(Text, nullable=True)
    
    # Nền tảng đã upload
    upload_status = Column(String, default=UploadStatus.NOT_UPLOADED)
    uploaded_platforms = Column(String, nullable=True) # Cách nhau bằng dấu phẩy
    upload_history = Column(Text, default="[]") # Lưu JSON danh sách tài khoản đã upload (dành cho ADB)
    uploaded_at = Column(DateTime(timezone=True), nullable=True)

    # File Paths
    raw_video_path = Column(String, nullable=True)
    srt_origin_path = Column(String, nullable=True)
    srt_translated_path = Column(String, nullable=True)
    audio_tts_path = Column(String, nullable=True)
    final_video_path = Column(String, nullable=True)
    process_config = Column(Text, default="{}")

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

from sqlalchemy import event

def _save_metadata_listener(mapper, connection, target):
    from app.utils.metadata import save_video_metadata
    try:
        save_video_metadata(target)
    except Exception as e:
        print(f"Error in metadata event listener: {e}")

event.listen(VideoHistory, 'after_insert', _save_metadata_listener)
event.listen(VideoHistory, 'after_update', _save_metadata_listener)

