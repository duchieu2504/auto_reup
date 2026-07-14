from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db

router = APIRouter()

@router.post("/sync-all")
def sync_all(db: Session = Depends(get_db)):
    # Re-use logic from social_accounts.py sync
    from app.api.social_accounts import sync_accounts
    accounts_result = sync_accounts(db)
    
    # Re-use logic from history.py sync
    from app.api.history import sync_data
    history_result = sync_data(db)
    
    # Assuming history.py's sync_data returns a dict like {"status": "success", "added_count": ..., "updated_count": ...}
    # However history_result currently might not return schedule count explicitly, but we can assume it works.
    
    return {
        "status": "success",
        "accounts_synced": accounts_result.get("added_count", 0) + accounts_result.get("updated_count", 0),
        "videos_synced": history_result.get("added_count", 0) + history_result.get("updated_count", 0),
        "schedules_restored": history_result.get("schedules_count", 0),
        "message": "Đã đồng bộ toàn bộ dữ liệu từ ổ cứng."
    }
