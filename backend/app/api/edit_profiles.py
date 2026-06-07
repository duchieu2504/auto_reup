import os
import shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from datetime import datetime

from app.db.session import get_db
from app.models.edit_profile import EditProfile

router = APIRouter()

@router.get("/")
async def get_edit_profiles(db: Session = Depends(get_db)):
    profiles = db.query(EditProfile).all()
    return [{"id": p.id, "name": p.name, "config": p.config, "updated_at": p.updated_at} for p in profiles]

@router.post("/")
async def create_edit_profile(name: str = Form(...), config: str = Form(...), db: Session = Depends(get_db)):
    try:
        new_profile = EditProfile(name=name, config=config)
        db.add(new_profile)
        db.commit()
        db.refresh(new_profile)
        return {"id": new_profile.id, "name": new_profile.name, "config": new_profile.config}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{profile_id}")
async def update_edit_profile(profile_id: int, name: str = Form(...), config: str = Form(...), db: Session = Depends(get_db)):
    profile = db.query(EditProfile).filter(EditProfile.id == profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    try:
        profile.name = name
        profile.config = config
        db.commit()
        db.refresh(profile)
        return {"id": profile.id, "name": profile.name, "config": profile.config}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{profile_id}")
async def delete_edit_profile(profile_id: int, db: Session = Depends(get_db)):
    profile = db.query(EditProfile).filter(EditProfile.id == profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    try:
        db.delete(profile)
        db.commit()
        return {"success": True, "message": "Profile deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upload-watermark")
async def upload_watermark(file: UploadFile = File(...)):
    try:
        from app.core.config import DATA_DIR
        watermarks_dir = os.path.join(DATA_DIR, "watermarks")
        os.makedirs(watermarks_dir, exist_ok=True)
        
        # Tạo tên file unique dựa trên timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{timestamp}_{file.filename.replace(' ', '_')}"
        file_path = os.path.join(watermarks_dir, filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        return {"success": True, "path": file_path}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload watermark: {str(e)}")
