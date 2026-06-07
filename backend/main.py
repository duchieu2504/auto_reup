from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.core.config import DATA_DIR
from app.db.session import engine
from app.models.history import Base
from app.models.social_account import SocialAccount
from app.models.upload_schedule import UploadSchedule
from app.models.edit_profile import EditProfile
from app.models.proxy import Proxy
from app.models.live_job import LiveStreamJob
from app.api.social_accounts import router as social_accounts_router
from app.api.upload_schedule import router as upload_schedule_router

import time
from sqlalchemy.exc import OperationalError

# Retry logic for database connection (handles Postgres slow startup on fresh clone)
max_retries = 5
for i in range(max_retries):
    try:
        Base.metadata.create_all(bind=engine)
        
        # Add proxy_id column if not exists (for Postgres/SQLite)
        try:
            with engine.connect() as conn:
                from sqlalchemy import text
                conn.execute(text("ALTER TABLE social_accounts ADD COLUMN IF NOT EXISTS proxy_id INTEGER REFERENCES proxies(id) ON DELETE SET NULL;"))
                conn.commit()
        except Exception as e:
            print(f"Error adding proxy_id column (might already exist or SQLite syntax limitation): {e}")

        # Add user_agent column if not exists
        try:
            with engine.connect() as conn:
                from sqlalchemy import text
                # SQLite workaround: SQLite doesn't support IF NOT EXISTS in ALTER TABLE ADD COLUMN.
                # It will throw an OperationalError if the column already exists.
                conn.execute(text("ALTER TABLE social_accounts ADD COLUMN user_agent VARCHAR(500);"))
                conn.commit()
        except Exception as e:
            pass # Ignore if column already exists
            
        # Add target_account_name column if not exists
        try:
            with engine.connect() as conn:
                from sqlalchemy import text
                conn.execute(text("ALTER TABLE live_stream_jobs ADD COLUMN target_account_name VARCHAR(255);"))
                conn.commit()
        except Exception as e:
            pass

        print("Database connected and initialized successfully.")
        break
    except OperationalError as e:
        if i == max_retries - 1:
            print("Failed to connect to the database after multiple retries. Exiting.")
            raise e
        print(f"Database connection failed, retrying in 5 seconds... ({i+1}/{max_retries})")
        time.sleep(5)

app = FastAPI(title="Video Reup System API")

# Cho phép React Web gọi tới API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Phục vụ file tĩnh (Video, Audio, SRT) cho phần Preview
app.mount("/api/files", StaticFiles(directory=DATA_DIR), name="files")

from app.api import crawler, processor, settings, history, discovery, social_accounts, analytics, edit_profiles, proxies, faceless, live

app.include_router(crawler.router, prefix="/api/crawler", tags=["Crawler"])
app.include_router(processor.router, prefix="/api/processor", tags=["Processor"])
app.include_router(settings.router, prefix="/api/settings", tags=["Settings"])
app.include_router(history.router, prefix="/api/history", tags=["History"])
app.include_router(discovery.router, prefix="/api", tags=["Discovery"])
app.include_router(social_accounts_router, prefix="/api/social-accounts", tags=["Social Accounts"])
app.include_router(upload_schedule_router, prefix="/api/upload-schedules", tags=["Upload Schedules"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(edit_profiles.router, prefix="/api/edit-profiles", tags=["Edit Profiles"])
app.include_router(proxies.router, prefix="/api/proxies", tags=["Proxies"])
app.include_router(faceless.router, prefix="/api/faceless", tags=["Faceless AI"])
app.include_router(live.router, prefix="/api/live", tags=["Live Restream"])

@app.get("/")
def read_root():
    return {"status": "ok", "message": "API Server is running"}
