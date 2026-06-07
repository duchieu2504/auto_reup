import redis
import os
from app.core.celery_app import celery_app
from app.services.processor.pipeline import ProcessorPipeline
from app.core.logger import get_logger
from celery.exceptions import MaxRetriesExceededError

logger = get_logger(__name__)

# Kết nối Redis để đẩy log realtime
from app.core.config import REDIS_URL
redis_client = redis.Redis.from_url(REDIS_URL)

pipeline_instance = None

@celery_app.task(bind=True, name="processor_tasks.process_video", max_retries=3)
def process_video_task(self, video_paths: list, voice_mode: str, bg_volume: int, flip_video: bool = False, force_render: bool = False, subtitle_style: str = "black_white", opt_zoom: bool = False, opt_color: bool = False, opt_noise: bool = False, opt_pitch: bool = False, subtitle_text_color: str = "#000000", subtitle_bg_color: str = "#FFFFFF", subtitle_font_size: int = 20, subtitle_margin_v: int = 40, subtitle_bg_padding: int = 2, subtitle_bg_opacity: int = 100, watermark_type: str = "none", watermark_text: str = None, watermark_image_path: str = None, watermark_x: float = 50.0, watermark_y: float = 50.0, watermark_size: float = 20.0, watermark_color: str = "#FFFFFF", watermark_opacity: float = 50.0, subtitle_font_family: str = "Liberation Sans"):
    global pipeline_instance
    task_id = self.request.id
    channel = f"task_log_{task_id}"

    # Xóa list cũ nếu có
    redis_client.delete(channel)

    import json
    def log_callback(msg: str, progress: float = None):
        payload = {"log": msg.strip()}
        if progress is not None:
            payload["progress"] = progress
            
        redis_client.rpush(channel, json.dumps(payload))
        if progress is not None:
            logger.info(f"[{task_id}] {msg.strip()} (Progress: {progress}%)")
        else:
            logger.info(f"[{task_id}] {msg.strip()}")

    try:
        if pipeline_instance is None:
            log_callback(f"[System] Đang nạp AI Models vào bộ nhớ tiến trình (chỉ chạy 1 lần)...\n")
            pipeline_instance = ProcessorPipeline()
            
        import concurrent.futures
        from dotenv import load_dotenv
        
        load_dotenv(override=True)
        concurrency = int(os.getenv("AI_CONCURRENCY_LIMIT", 1))
        
        log_callback(f"[System] Chế độ đa luồng đang bật: {concurrency} luồng song song\n")
        
        def process_single(vp):
            try:
                pipeline_instance.process_video(vp, log_callback, voice_mode, bg_volume, flip_video, force_render, subtitle_style, opt_zoom, opt_color, opt_noise, opt_pitch, subtitle_text_color, subtitle_bg_color, subtitle_font_size, subtitle_margin_v, subtitle_bg_padding, subtitle_bg_opacity, watermark_type, watermark_text, watermark_image_path, watermark_x, watermark_y, watermark_size, watermark_color, watermark_opacity, subtitle_font_family)
            except Exception as e:
                logger.error(f"Lỗi khi xử lý {vp}: {e}")
                
                # Phân loại lỗi OOM hoặc Resource
                error_msg = str(e).lower()
                if "memory" in error_msg or "resource" in error_msg or "os error" in error_msg or "killed" in error_msg:
                    log_callback(f"[!] Lỗi tài nguyên hệ thống khi xử lý {vp}: {e}. Đang ném ngoại lệ lên để Celery Retry...\n")
                    raise  # Ném lỗi ra để future catch và loop ngoài catch
                else:
                    log_callback(f"[!] Lỗi logic/FFmpeg khi xử lý {vp}: {e}. Bỏ qua video này.\n")

        with concurrent.futures.ThreadPoolExecutor(max_workers=concurrency) as executor:
            futures = []
            for video_path in video_paths:
                log_callback(f"\n[System] Đưa vào hàng đợi: {video_path}\n")
                futures.append(executor.submit(process_single, video_path))
                
            for future in concurrent.futures.as_completed(futures):
                try:
                    future.result() # Will raise if process_single raised
                except Exception as exc:
                    raise exc # Re-raise to trigger outer retry
        
        log_callback("\n[System] Hoàn thành toàn bộ luồng xử lý video.\n[DONE]\n")
        return {"status": "success", "processed_count": len(video_paths)}
    except MaxRetriesExceededError:
        log_callback("[System] Hết số lần thử lại cho render video.\n[DONE]\n")
        raise
    except Exception as e:
        logger.error(f"Lỗi nghiêm trọng trong Celery Task: {str(e)}", exc_info=True)
        try:
            backoff_delays = [60, 120, 300]
            retries = self.request.retries
            delay = backoff_delays[retries] if retries < len(backoff_delays) else 300
            log_callback(f"[System] Lỗi tài nguyên: {e}. Đang thử lại lần {retries + 1} sau {delay}s...\n")
            raise self.retry(exc=e, countdown=delay)
        except MaxRetriesExceededError:
            log_callback(f"[System] Hết số lần thử lại (3 lần). Bỏ qua.\n[DONE]\n")
            return {"status": "error", "error": str(e)}
