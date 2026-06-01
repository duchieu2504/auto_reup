import asyncio
import os
import sys
from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import redis.asyncio as redis

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
from app.tasks.crawler_tasks import scrape_profile_task
from app.core.logger import get_logger

logger = get_logger(__name__)
router = APIRouter()

REDIS_URL = os.environ.get("CELERY_BROKER_URL", "redis://localhost:6379/0")
redis_client = redis.from_url(REDIS_URL, decode_responses=True)

class CrawlRequest(BaseModel):
    urls: list[str]

@router.post("/start")
async def start_crawler(request: CrawlRequest):
    logger.info(f"Nhận API request cào URL qua Celery: {request.urls}")
    task = scrape_profile_task.delay(request.urls)
    return {"status": "started", "task_id": task.id, "urls_count": len(request.urls)}

@router.get("/stream/{task_id}")
async def stream_logs(task_id: str, request: Request):
    async def event_generator():
        channel = f"task_log_{task_id}"
        last_index = 0
        while True:
            if await request.is_disconnected():
                logger.info("Client ngắt kết nối stream.")
                break
                
            messages = await redis_client.lrange(channel, last_index, -1)
            if messages:
                for msg in messages:
                    data = str(msg)
                    for line in data.split('\n'):
                        if line.strip():
                            yield f"data: {line}\n\n"
                            
                    if "[DONE]" in data:
                        await redis_client.expire(channel, 60)
                        return
                last_index += len(messages)
            
            await asyncio.sleep(0.5)
            
    return StreamingResponse(event_generator(), media_type="text/event-stream")
