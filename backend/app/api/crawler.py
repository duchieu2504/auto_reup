import asyncio
import os
import sys
import time
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
from app.tasks.crawler_tasks import scrape_profile_task
from app.core.logger import get_logger
from app.core.redis_pool import get_async_redis

logger = get_logger(__name__)
router = APIRouter()


class CrawlRequest(BaseModel):
    urls: list[str]


@router.post("/start")
async def start_crawler(request: CrawlRequest):
    logger.info(f"Nhận API request cào URL qua Celery: {request.urls}")
    task = scrape_profile_task.delay(request.urls)
    return {"status": "started", "task_id": task.id, "urls_count": len(request.urls)}


@router.get("/stream/{task_id}")
async def stream_logs(task_id: str, request: Request):
    redis_client = get_async_redis()

    async def event_generator():
        channel = f"task_log_{task_id}"
        last_index = 0
        max_idle_seconds = 600  # Timeout after 10 minutes of no messages
        last_message_time = time.monotonic()

        while True:
            if await request.is_disconnected():
                logger.info("Client ngắt kết nối stream.")
                break

            messages = await redis_client.lrange(channel, last_index, -1)
            if messages:
                last_message_time = time.monotonic()
                for msg in messages:
                    data = str(msg)
                    for line in data.split('\n'):
                        if line.strip():
                            yield f"data: {line}\n\n"

                    if "[DONE]" in data:
                        await redis_client.expire(channel, 60)
                        return
                last_index += len(messages)
            elif time.monotonic() - last_message_time > max_idle_seconds:
                yield f'data: {{"log": "[System] Stream timeout sau {max_idle_seconds}s không hoạt động."}}\n\n'
                return

            await asyncio.sleep(0.5)

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@router.post("/stop/{task_id}")
async def stop_crawler(task_id: str):
    logger.info(f"Yêu cầu dừng task cào video: {task_id}")
    from app.core.celery_app import celery_app
    import json
    try:
        celery_app.control.revoke(task_id, terminate=True)
        
        redis_client = get_async_redis()
        
        # Đặt cờ hủy trong Redis để crawler_tasks bắt được và ngắt gracefully
        await redis_client.setex(f"cancel_task_{task_id}", 3600, "1")
        
        # Gửi thông điệp hủy tới kênh log stream Redis để đóng kết nối và cập nhật UI phía Client
        channel = f"task_log_{task_id}"
        await redis_client.rpush(channel, json.dumps({"log": "[System] Tiến trình cào video đã bị hủy bởi người dùng.\n[DONE]\n"}))
        
        return {"status": "stopped", "message": "Đã gửi lệnh hủy tiến trình cào."}
    except Exception as e:
        logger.error(f"Lỗi khi hủy tiến trình cào: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
