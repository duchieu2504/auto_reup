import os
import json

from app.core.celery_app import celery_app
from app.services.crawler.douyin_scraper import DouyinScraper
from app.core.logger import get_logger
from app.core.redis_pool import get_sync_redis
from celery.exceptions import MaxRetriesExceededError

logger = get_logger(__name__)

@celery_app.task(bind=True, name="crawler_tasks.scrape_profile", max_retries=3)
def scrape_profile_task(self, urls: list):
    task_id = self.request.id
    channel = f"task_log_{task_id}"

    redis_client = get_sync_redis()
    redis_client.delete(channel)

    def log_callback(msg: str, progress: float = None):
        payload = {"log": msg.strip()}
        if progress is not None:
            payload["progress"] = progress
        redis_client.rpush(channel, json.dumps(payload))

    try:
        scraper_instance = DouyinScraper()
            
        for url in urls:
            log_callback(f"[System] Bắt đầu xử lý URL: {url}\n")
            try:
                for log_item in scraper_instance.scrape_profile_generator(url):
                    if isinstance(log_item, dict):
                        log_callback(log_item["log"], log_item.get("progress"))
                    else:
                        log_callback(log_item)
            except Exception as e:
                error_msg = str(e).lower()
                fatal_keywords = ["không tồn tại", "đã xóa", "xóa khỏi", "bị khóa", "bị chết", "chặn"]
                is_fatal = any(kw in error_msg for kw in fatal_keywords)
                
                if is_fatal:
                    log_callback(f"[!] Lỗi nghiêm trọng khi quét {url}: {e}. Bỏ qua.\n")
                else:
                    try:
                        backoff_delays = [60, 120, 300]
                        retries = self.request.retries
                        delay = backoff_delays[retries] if retries < len(backoff_delays) else 300
                        log_callback(f"[!] Lỗi mạng/tạm thời khi quét {url}: {e}. Sẽ thử lại toàn bộ task lần {retries + 1} sau {delay}s...\n")
                        raise self.retry(exc=e, countdown=delay)
                    except MaxRetriesExceededError:
                        log_callback(f"[!] Hết số lần thử lại (3 lần) cho task cào dữ liệu. Bỏ qua.\n")
                        logger.error(f"Max retries exceeded for crawler task: {e}")
            
        log_callback("[System] Hoàn thành luồng cào dữ liệu.\n[DONE]\n")
        logger.info(f"Hoàn thành xử lý {len(urls)} URLs")
        return {"status": "success", "urls_count": len(urls)}
    except MaxRetriesExceededError:
        # Re-raise to let celery handle it properly
        raise
    except Exception as e:
        logger.error(f"Lỗi nghiêm trọng trong Celery Task: {str(e)}", exc_info=True)
        log_callback(f"[System] Lỗi nghiêm trọng: {e}\n[DONE]\n")
        return {"status": "error", "error": str(e)}
