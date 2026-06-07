import os
from celery import Celery

from app.core.config import REDIS_URL

celery_app = Celery(
    "autoreup_tasks",
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=["app.tasks.crawler_tasks", "app.tasks.processor_tasks", "app.tasks.uploader_tasks", "app.tasks.health_tasks", "app.tasks.faceless_tasks"]
)

# Tối ưu hóa cấu hình Celery
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Ho_Chi_Minh",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=3600, # Giới hạn 1 task tối đa 1 tiếng (dành cho video nặng)
)

# Cấu hình định kỳ cho Celery Beat
from celery.schedules import crontab
celery_app.conf.beat_schedule = {
    "check-scheduled-uploads-every-minute": {
        "task": "check_scheduled_uploads",
        "schedule": crontab(minute="*/10"), # Chạy mỗi 10 phút
    },
    "check-account-health-every-hour": {
        "task": "check_all_accounts_health_task",
        "schedule": crontab(minute="0"), # Chạy mỗi đầu giờ
    }
}
