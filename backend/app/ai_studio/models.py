from sqlalchemy import Column, Integer, String, Text, DateTime
from datetime import datetime, timezone
from app.db.session import Base

class AIGeneration(Base):
    __tablename__ = "ai_generations"

    id = Column(Integer, primary_key=True, index=True)
    mode = Column(String(50), nullable=False) # 'faceless', 'fashion_product', 'fashion_model'
    input_media_path = Column(String(255), nullable=True)
    concept_id = Column(String(50), nullable=True)
    prompt_text = Column(Text, nullable=True)
    output_media_path = Column(String(255), nullable=True)
    status = Column(String(50), default="pending") # pending, processing, completed, failed
    task_id_external = Column(String(100), nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
