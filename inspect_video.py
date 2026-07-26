import os
import sys

# Thêm đường dẫn backend vào sys.path để import
sys.path.append(os.path.abspath('backend'))

from app.db.session import SessionLocal
from app.models.history import VideoHistory
from app.models.upload_schedule import UploadSchedule

db = SessionLocal()
video = db.query(VideoHistory).filter(VideoHistory.original_name.like('%16235.mp4')).first()

if video:
    print("Video ID:", video.id)
    print("Upload History:", video.upload_history)
    print("Schedules:")
    for sch in video.schedules:
        print(f" - Sch ID: {sch.id}, Account ID: {sch.account_id}, Status: {sch.status}")
else:
    print("Video not found")
