from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from app.db.session import Base

class SocialAccount(Base):
    __tablename__ = "social_accounts"

    id = Column(Integer, primary_key=True, index=True)
    platform = Column(String(50), nullable=False) # tiktok, youtube, instagram, facebook
    username = Column(String(255), nullable=False)
    account_id = Column(String(255), nullable=True) # Optional unique ID on platform
    avatar_url = Column(String(500), nullable=True)
    auth_data = Column(Text, nullable=False) # JSON string format to store cookie/tokens
    proxy_host = Column(String(255), nullable=True)
    proxy_port = Column(String(10), nullable=True)
    proxy_username = Column(String(255), nullable=True)
    proxy_password = Column(String(255), nullable=True)
    status = Column(String(50), default="active") # active, expired, checkpoint
    last_checked_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
