from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base
from app.models.history import VideoHistory
from app.models.social_account import SocialAccount

class UploadSchedule(Base):
    __tablename__ = "upload_schedules"

    id = Column(Integer, primary_key=True, index=True)
    video_history_id = Column(Integer, ForeignKey("video_history.id"), nullable=False)
    account_id = Column(Integer, ForeignKey("social_accounts.id"), nullable=False)
    
    # Cấu hình content sinh ra từ AI
    caption = Column(Text, nullable=True)
    hashtags = Column(String(500), nullable=True)
    
    # Cơ chế lập lịch
    scheduled_time = Column(DateTime(timezone=True), nullable=True) # Nếu null -> Đăng ngay
    status = Column(String(50), default="pending") # pending, uploading, success, failed
    
    # Kết quả
    post_url = Column(String(500), nullable=True)
    error_message = Column(Text, nullable=True)
    retry_count = Column(Integer, default=0)
    
    # Account Health Tracking
    views_count = Column(Integer, nullable=True)
    health_status = Column(String(50), default="unknown") # unknown, healthy, shadowbanned
    
    # Phân loại uploader
    engine_type = Column(String(50), default="playwright") # playwright, adb
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Mối quan hệ
    history = relationship("VideoHistory", back_populates="schedules")
    account = relationship("SocialAccount")
