from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from app.db.session import get_db
from app.models.social_account import SocialAccount
from app.core.security import encrypt_data, decrypt_data

router = APIRouter()

class SocialAccountBase(BaseModel):
    platform: str
    username: str
    account_id: Optional[str] = None
    avatar_url: Optional[str] = None
    auth_data: str
    proxy_host: Optional[str] = None
    proxy_port: Optional[str] = None
    proxy_username: Optional[str] = None
    proxy_password: Optional[str] = None
    status: Optional[str] = "active"

class SocialAccountCreate(SocialAccountBase):
    pass

class SocialAccountResponse(SocialAccountBase):
    id: int
    last_checked_at: Optional[datetime]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True

@router.get("/", response_model=List[SocialAccountResponse])
def get_accounts(db: Session = Depends(get_db)):
    accounts = db.query(SocialAccount).order_by(SocialAccount.created_at.desc()).all()
    # Giải mã dữ liệu nhạy cảm trước khi trả về (chỉ nên làm vậy nếu API được bảo vệ, hoặc che pass)
    # Tuy nhiên, để cho giao diện Edit có thể load lại, ta sẽ trả về dạng giải mã.
    # Trong môi trường thực tế, nên che proxy_password.
    for acc in accounts:
        acc.auth_data = decrypt_data(acc.auth_data)
        acc.proxy_password = decrypt_data(acc.proxy_password)
    return accounts

@router.post("/", response_model=SocialAccountResponse)
def create_account(account: SocialAccountCreate, db: Session = Depends(get_db)):
    db_account_data = account.model_dump()
    
    # Mã hóa dữ liệu
    db_account_data['auth_data'] = encrypt_data(db_account_data['auth_data'])
    if db_account_data.get('proxy_password'):
        db_account_data['proxy_password'] = encrypt_data(db_account_data['proxy_password'])

    db_account = SocialAccount(**db_account_data)
    db.add(db_account)
    db.commit()
    db.refresh(db_account)
    
    # Giải mã để trả về response chuẩn
    db_account.auth_data = decrypt_data(db_account.auth_data)
    db_account.proxy_password = decrypt_data(db_account.proxy_password)
    return db_account

@router.put("/{account_id}", response_model=SocialAccountResponse)
def update_account(account_id: int, account: SocialAccountCreate, db: Session = Depends(get_db)):
    db_account = db.query(SocialAccount).filter(SocialAccount.id == account_id).first()
    if not db_account:
        raise HTTPException(status_code=404, detail="Không tìm thấy tài khoản")
    
    update_data = account.model_dump()
    
    # Mã hóa dữ liệu trước khi update
    if 'auth_data' in update_data and update_data['auth_data']:
        update_data['auth_data'] = encrypt_data(update_data['auth_data'])
    if 'proxy_password' in update_data and update_data['proxy_password']:
        update_data['proxy_password'] = encrypt_data(update_data['proxy_password'])

    for key, value in update_data.items():
        setattr(db_account, key, value)
    
    db.commit()
    db.refresh(db_account)
    
    # Giải mã để trả về response chuẩn
    db_account.auth_data = decrypt_data(db_account.auth_data)
    db_account.proxy_password = decrypt_data(db_account.proxy_password)
    return db_account

@router.delete("/{account_id}")
def delete_account(account_id: int, db: Session = Depends(get_db)):
    db_account = db.query(SocialAccount).filter(SocialAccount.id == account_id).first()
    if not db_account:
        raise HTTPException(status_code=404, detail="Không tìm thấy tài khoản")
    db.delete(db_account)
    db.commit()
    return {"status": "success"}

@router.post("/{account_id}/check-status")
def check_status(account_id: int, db: Session = Depends(get_db)):
    db_account = db.query(SocialAccount).filter(SocialAccount.id == account_id).first()
    if not db_account:
        raise HTTPException(status_code=404, detail="Không tìm thấy tài khoản")
    
    # Placeholder for actual checking logic using proxy and auth_data
    # For now, just mark it as active and update last_checked_at
    from sqlalchemy.sql import func
    db_account.status = "active"
    db_account.last_checked_at = func.now()
    db.commit()
    return {"status": "success", "message": "Tài khoản vẫn hoạt động tốt (Simulated)"}
