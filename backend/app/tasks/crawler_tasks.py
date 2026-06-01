import redis
import os
from app.core.celery_app import celery_app
from app.services.crawler.douyin_scraper import DouyinScraper
from app.core.logger import get_logger

logger = get_logger(__name__)

REDIS_URL = os.environ.get("CELERY_BROKER_URL", "redis://localhost:6379/0")
redis_client = redis.Redis.from_url(REDIS_URL)

@celery_app.task(bind=True, name="crawler_tasks.scrape_profile")
def scrape_profile_task(self, urls: list):
    task_id = self.request.id
    channel = f"task_log_{task_id}"

    redis_client.delete(channel)

    def log_callback(msg: str):
        redis_client.rpush(channel, msg)

    try:
        scraper_instance = DouyinScraper()
            
        for url in urls:
            log_callback(f"[System] Bắt đầu xử lý URL: {url}\n")
            try:
                for log_line in scraper_instance.scrape_profile_generator(url):
                    log_callback(log_line)
            except Exception as e:
                log_callback(f"[!] Lỗi khi quét {url}: {e}\n")
            
        log_callback("[System] Hoàn thành luồng cào dữ liệu.\n[DONE]\n")
        logger.info(f"Hoàn thành xử lý {len(urls)} URLs")
        return {"status": "success", "urls_count": len(urls)}
    except Exception as e:
        logger.error(f"Lỗi nghiêm trọng trong Celery Task: {str(e)}", exc_info=True)
        log_callback(f"[System] Lỗi nghiêm trọng: {e}\n[DONE]\n")
        return {"status": "error", "error": str(e)}
