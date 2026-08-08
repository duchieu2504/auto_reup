from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class AIGenerationBase(BaseModel):
    mode: str
    input_media_path: Optional[str] = None
    concept_id: Optional[str] = None
    prompt_text: Optional[str] = None
    status: Optional[str] = "pending"

class AIGenerationCreate(AIGenerationBase):
    pass

class AIGenerationUpdate(BaseModel):
    output_media_path: Optional[str] = None
    status: Optional[str] = None
    task_id_external: Optional[str] = None
    error_message: Optional[str] = None

class AIGenerationResponse(AIGenerationBase):
    id: int
    output_media_path: Optional[str] = None
    task_id_external: Optional[str] = None
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
