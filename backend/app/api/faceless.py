from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import os
import json

from app.services.processor.faceless_engine import FacelessEngine
from app.tasks.faceless_tasks import render_faceless_video

router = APIRouter()

class GenerateScriptRequest(BaseModel):
    prompt: str
    video_style: str = "Tự do"
    
class RenderVideoRequest(BaseModel):
    scenes: List[Dict[str, Any]]
    account_id: int
    tts_provider: str = "edge"
    tts_voice: str = "edge_hoaimy"
    bgm_path: Optional[str] = None
    media_source: str = "pexels"
    pexels_key: Optional[str] = None

@router.post("/generate-script")
async def generate_script(req: GenerateScriptRequest):
    try:
        engine = FacelessEngine()
        scenes = engine.generate_script(req.prompt, req.video_style)
        return {"status": "success", "scenes": scenes}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/render-video")
async def start_render_video(req: RenderVideoRequest):
    try:
        # Gửi job vào Celery
        task_data = req.dict()
        task = render_faceless_video.delay(task_data)
        return {"status": "success", "task_id": task.id, "message": "Tiến trình render đã được khởi tạo"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/status/{task_id}")
async def get_task_status(task_id: str):
    try:
        from celery.result import AsyncResult
        task = AsyncResult(task_id)
        
        response = {
            "task_id": task_id,
            "status": task.status,
            "result": task.result if task.ready() else None
        }
        
        if task.status == 'PROGRESS':
            response['progress'] = task.info.get('progress', 0)
            response['message'] = task.info.get('message', 'Đang xử lý...')
        elif task.status == 'SUCCESS':
            response['progress'] = 100
            response['message'] = 'Hoàn thành!'
        elif task.status == 'FAILURE':
            response['message'] = str(task.result)
            
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
