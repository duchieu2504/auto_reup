from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base

class TwitterNurtureConfig(Base):
    __tablename__ = "twitter_nurture_configs"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, ForeignKey("social_accounts.id", ondelete="CASCADE"), unique=True, nullable=False)
    is_active = Column(Boolean, default=False)
    mode = Column(String(10), default="A") # A (List), B (Amplify), C (Hybrid)
    list_ids = Column(Text, nullable=True) # JSON list of strings (List Mode)
    hashtags = Column(Text, nullable=True) # JSON list of strings (Amplify Mode)
    ai_provider = Column(String(50), default="deepseek")
    ai_api_key = Column(String(255), nullable=True)
    ai_model = Column(String(100), nullable=True)
    ai_style_prompt = Column(Text, nullable=True)
    comments_per_hour = Column(Integer, default=15)
    last_run_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # relationship
    account = relationship("SocialAccount", foreign_keys=[account_id])
