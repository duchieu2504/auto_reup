from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.sql import func
from app.db.session import Base

class FollowedAccount(Base):
    __tablename__ = "followed_accounts"

    id = Column(Integer, primary_key=True, index=True)
    sec_uid = Column(String(255), unique=True, index=True, nullable=False)
    nickname = Column(String(255), nullable=True)
    avatar = Column(String(500), nullable=True)
    follower_count = Column(Integer, default=0)
    total_favorited = Column(Integer, default=0)
    video_count = Column(Integer, default=0)
    is_favorite = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
