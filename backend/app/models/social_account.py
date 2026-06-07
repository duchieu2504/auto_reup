from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base
from app.models.proxy import Proxy

class SocialAccount(Base):
    __tablename__ = "social_accounts"

    id = Column(Integer, primary_key=True, index=True)
    platform = Column(String(50), nullable=False) # tiktok, youtube, instagram, facebook
    username = Column(String(255), nullable=False)
    account_id = Column(String(255), nullable=True) # Optional unique ID on platform
    avatar_url = Column(String(500), nullable=True)
    auth_data = Column(Text, nullable=True) # JSON string format to store cookie/tokens
    proxy_host = Column(String(255), nullable=True)
    proxy_port = Column(String(10), nullable=True)
    proxy_username = Column(String(255), nullable=True)
    proxy_password = Column(String(255), nullable=True)
    connection_type = Column(String(50), default="web_playwright") # web_playwright, adb_device
    device_id = Column(String(255), nullable=True) # Optional device id if adb_device
    status = Column(String(50), default="active") # active, expired, checkpoint
    user_agent = Column(String(500), nullable=True) # Để bypass anti-bot
    last_checked_at = Column(DateTime(timezone=True), nullable=True)
    health_checked_at = Column(DateTime(timezone=True), nullable=True) # Check shadowban
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    proxy_id = Column(Integer, ForeignKey("proxies.id", ondelete="SET NULL"), nullable=True)
    proxy = relationship("Proxy", foreign_keys=[proxy_id])

from sqlalchemy import event

def _save_account_metadata_listener(mapper, connection, target):
    from app.utils.account_metadata import save_account_metadata
    try:
        save_account_metadata(target)
    except Exception as e:
        print(f"Error in account metadata save event: {e}")

def _delete_account_metadata_listener(mapper, connection, target):
    from app.utils.account_metadata import delete_account_metadata
    try:
        delete_account_metadata(target)
    except Exception as e:
        print(f"Error in account metadata delete event: {e}")

event.listen(SocialAccount, 'after_insert', _save_account_metadata_listener)
event.listen(SocialAccount, 'after_update', _save_account_metadata_listener)
event.listen(SocialAccount, 'after_delete', _delete_account_metadata_listener)

