from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from app.db.session import Base

class LiveStreamJob(Base):
    __tablename__ = "live_stream_jobs"

    id = Column(Integer, primary_key=True, index=True)
    douyin_url = Column(String, index=True)
    rtmp_url = Column(String)
    stream_key = Column(String)
    status = Column(String, default="stopped") # 'running', 'stopped', 'failed'
    target_account_name = Column(String, nullable=True)
    pid = Column(Integer, nullable=True)
    error_message = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
