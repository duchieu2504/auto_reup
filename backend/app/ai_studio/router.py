from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import shutil
import os
from datetime import datetime

from app.core.config import DATA_DIR
from app.db.session import get_db
from app.ai_studio import services, crud, schemas
from app.tasks.ai_studio_tasks import generate_ai_media_task

router = APIRouter()

class ApiKeyTestRequest(BaseModel):
    api_key: str
    endpoint_url: Optional[str] = None

@router.post("/test-photoroom")
def test_photoroom_endpoint(req: ApiKeyTestRequest):
    res = services.test_photoroom_api(req.api_key)
    if not res["success"]:
        raise HTTPException(status_code=400, detail=res["message"])
    return res

@router.post("/test-veo3")
def test_veo3_endpoint(req: ApiKeyTestRequest, db: Session = Depends(get_db)):
    proxy_url = services.get_random_proxy(db)
    res = services.test_veo3_api(req.api_key, req.endpoint_url, proxy_url)
    if not res["success"]:
        raise HTTPException(status_code=400, detail=res["message"])
    return res

@router.post("/generate", response_model=schemas.AIGenerationResponse)
async def generate_ai_media(
    mode: str = Form(...),
    concept_id: Optional[str] = Form(None),
    prompt_text: str = Form(...),
    photoroom_key: Optional[str] = Form(None),
    veo3_key: Optional[str] = Form(None),
    use_local_bg: bool = Form(False),
    image: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Endpoint xử lý sinh ảnh/video bằng Multipart/Form-Data"""
    # 1. Lưu file ảnh tĩnh tạm thời
    uploads_dir = os.path.join(DATA_DIR, "ai_uploads")
    os.makedirs(uploads_dir, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    file_extension = image.filename.split(".")[-1] if "." in image.filename else "jpg"
    temp_file_path = os.path.join(uploads_dir, f"{timestamp}_{image.filename}")
    
    with open(temp_file_path, "wb") as buffer:
        shutil.copyfileobj(image.file, buffer)

    # 2. Lưu DB trạng thái pending
    db_gen = crud.create_generation(db, schemas.AIGenerationCreate(
        mode=mode,
        concept_id=concept_id,
        prompt_text=prompt_text,
        status="processing"
    ))
    
    # 3. Đẩy vào Celery Task xử lý ngầm
    generate_ai_media_task.delay(
        generation_id=db_gen.id,
        mode=mode,
        prompt_text=prompt_text,
        image_path=temp_file_path,
        photoroom_key=photoroom_key,
        veo3_key=veo3_key,
        use_local_bg=use_local_bg
    )
    
    return db_gen

@router.get("/status/{generation_id}", response_model=schemas.AIGenerationResponse)
def get_generation_status(generation_id: int, db: Session = Depends(get_db)):
    db_gen = crud.get_generation(db, generation_id)
    if not db_gen:
        raise HTTPException(status_code=404, detail="Generation not found")
    return db_gen
