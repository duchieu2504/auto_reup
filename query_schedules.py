import os
import sys

sys.path.append(os.path.abspath('backend'))
from app.db.session import SessionLocal
from app.models.upload_schedule import UploadSchedule

db = SessionLocal()
schedules = db.query(UploadSchedule).filter(UploadSchedule.video_history_id == 119).all()

for sch in schedules:
    print(f"Sch ID: {sch.id}, Account ID: {sch.account_id}, Status: {sch.status}")
print("Done")
