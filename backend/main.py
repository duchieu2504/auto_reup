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
from sqlalchemy import text, inspect
from sqlalchemy.exc import OperationalError

# Retry logic for database connection (handles Postgres slow startup on fresh clone)
def init_db():
    max_retries = 5
    for i in range(max_retries):
        try:
            Base.metadata.create_all(bind=engine)
            
            inspector = inspect(engine)
            
            # Check and add proxy_id and user_agent to social_accounts
            try:
                if 'social_accounts' in inspector.get_table_names():
                    social_accounts_cols = [col['name'] for col in inspector.get_columns('social_accounts')]
                    with engine.connect() as conn:
                        if 'proxy_id' not in social_accounts_cols:
                            conn.execute(text("ALTER TABLE social_accounts ADD COLUMN proxy_id INTEGER REFERENCES proxies(id) ON DELETE SET NULL;"))
                        if 'user_agent' not in social_accounts_cols:
                            conn.execute(text("ALTER TABLE social_accounts ADD COLUMN user_agent VARCHAR(500);"))
                        conn.commit()
            except Exception as e:
                print(f"Error updating social_accounts schema: {e}")
                
            # Check and add target_account_name to live_stream_jobs
            try:
                if 'live_stream_jobs' in inspector.get_table_names():
                    live_jobs_cols = [col['name'] for col in inspector.get_columns('live_stream_jobs')]
                    with engine.connect() as conn:
                        if 'target_account_name' not in live_jobs_cols:
                            conn.execute(text("ALTER TABLE live_stream_jobs ADD COLUMN target_account_name VARCHAR(255);"))
                        conn.commit()
            except Exception as e:
                print(f"Error updating live_stream_jobs schema: {e}")

            print("Database connected and initialized successfully.")
            break
        except OperationalError as e:
            if i == max_retries - 1:
                print("Failed to connect to the database after multiple retries. Exiting.")
                raise e
            print(f"Database connection failed, retrying in 5 seconds... ({i+1}/{max_retries})")
            time.sleep(5)

init_db()

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
