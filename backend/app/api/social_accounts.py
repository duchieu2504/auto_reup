from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from app.db.session import get_db
from app.models.social_account import SocialAccount
from app.core.security import encrypt_data, decrypt_data
from app.utils.account_metadata import save_account_metadata, delete_account_metadata

router = APIRouter()

class SocialAccountBase(BaseModel):
    platform: str
    username: str
    account_id: Optional[str] = None
    avatar_url: Optional[str] = None
    auth_data: Optional[str] = None
    proxy_host: Optional[str] = None
    proxy_port: Optional[str] = None
    proxy_username: Optional[str] = None
    proxy_password: Optional[str] = None
    proxy_id: Optional[int] = None
    connection_type: Optional[str] = "web_playwright"
    device_id: Optional[str] = None
    status: Optional[str] = "active"
    user_agent: Optional[str] = None

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
        if acc.auth_data:
            acc.auth_data = decrypt_data(acc.auth_data)
        if acc.proxy_password:
            acc.proxy_password = decrypt_data(acc.proxy_password)
    return accounts

@router.post("/", response_model=SocialAccountResponse)
def create_account(account: SocialAccountCreate, db: Session = Depends(get_db)):
    db_account_data = account.model_dump()
    
    # Mã hóa dữ liệu
    if db_account_data.get('auth_data'):
        db_account_data['auth_data'] = encrypt_data(db_account_data['auth_data'])
    if db_account_data.get('proxy_password'):
        db_account_data['proxy_password'] = encrypt_data(db_account_data['proxy_password'])

    db_account = SocialAccount(**db_account_data)
    db.add(db_account)
    db.commit()
    db.refresh(db_account)
    
    # Lưu ra JSON metadata để backup
    save_account_metadata(db_account)
    
    # Giải mã để trả về response chuẩn
    if db_account.auth_data:
        db_account.auth_data = decrypt_data(db_account.auth_data)
    if db_account.proxy_password:
        db_account.proxy_password = decrypt_data(db_account.proxy_password)
    return db_account

@router.put("/{account_id}", response_model=SocialAccountResponse)
def update_account(account_id: int, account: SocialAccountCreate, db: Session = Depends(get_db)):
    db_account = db.query(SocialAccount).filter(SocialAccount.id == account_id).first()
    if not db_account:
        raise HTTPException(status_code=404, detail="Không tìm thấy tài khoản")
    
    update_data = account.model_dump(exclude_unset=True)
    
    # Mã hóa dữ liệu trước khi update
    if 'auth_data' in update_data and update_data['auth_data']:
        update_data['auth_data'] = encrypt_data(update_data['auth_data'])
    if 'proxy_password' in update_data and update_data['proxy_password']:
        update_data['proxy_password'] = encrypt_data(update_data['proxy_password'])

    for key, value in update_data.items():
        setattr(db_account, key, value)
    
    db.commit()
    db.refresh(db_account)
    
    # Lưu ra JSON metadata để backup
    save_account_metadata(db_account)
    
    # Giải mã để trả về response chuẩn
    if db_account.auth_data:
        db_account.auth_data = decrypt_data(db_account.auth_data)
    if db_account.proxy_password:
        db_account.proxy_password = decrypt_data(db_account.proxy_password)
    return db_account

@router.delete("/{account_id}")
def delete_account(account_id: int, db: Session = Depends(get_db)):
    db_account = db.query(SocialAccount).filter(SocialAccount.id == account_id).first()
    if not db_account:
        raise HTTPException(status_code=404, detail="Không tìm thấy tài khoản")
    
    # Xóa file JSON backup trước
    delete_account_metadata(db_account)
    
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
    
    # Cập nhật metadata
    save_account_metadata(db_account)
    
    return {"status": "success", "message": "Tài khoản vẫn hoạt động tốt (Simulated)"}

@router.post("/{account_id}/warmup")
def warmup_account(account_id: int, db: Session = Depends(get_db)):
    db_account = db.query(SocialAccount).filter(SocialAccount.id == account_id).first()
    if not db_account:
        raise HTTPException(status_code=404, detail="Không tìm thấy tài khoản")
    
    if db_account.connection_type not in ["gpm_login", "adb_device"]:
        raise HTTPException(status_code=400, detail="Tính năng nuôi tài khoản hiện chỉ hỗ trợ GPM Login hoặc điện thoại giả lập ADB.")
        
    from app.tasks.uploader_tasks import warmup_account_task
    
    # Giải mã trước khi ném vào task
    if db_account.auth_data:
        db_account.auth_data = decrypt_data(db_account.auth_data)
    if db_account.proxy_password:
        db_account.proxy_password = decrypt_data(db_account.proxy_password)
        
    # Fetch proxy from proxy_id if present
    proxy_host = db_account.proxy_host
    proxy_port = db_account.proxy_port
    proxy_username = db_account.proxy_username
    proxy_password = db_account.proxy_password
    
    if db_account.proxy_id:
        from app.models.proxy import Proxy
        proxy_obj = db.query(Proxy).filter(Proxy.id == db_account.proxy_id).first()
        if proxy_obj:
            proxy_host = proxy_obj.host
            proxy_port = proxy_obj.port
            proxy_username = proxy_obj.username
            if proxy_obj.password:
                try:
                    proxy_password = decrypt_data(proxy_obj.password)
                except:
                    pass

    account_dict = {
        "id": db_account.id,
        "platform": db_account.platform,
        "username": db_account.username,
        "auth_data": db_account.auth_data,
        "proxy_host": proxy_host,
        "proxy_port": proxy_port,
        "proxy_username": proxy_username,
        "proxy_password": proxy_password,
        "proxy_id": db_account.proxy_id,
        "connection_type": db_account.connection_type,
        "device_id": db_account.device_id,
        "user_agent": db_account.user_agent
    }
    
    warmup_account_task.delay(account_dict)
    
    return {"status": "success", "message": f"Đã đưa tiến trình nuôi tài khoản {db_account.username} vào hàng đợi nền."}

@router.post("/sync")
def sync_accounts(db: Session = Depends(get_db)):
    from app.utils.account_metadata import load_accounts_metadata
    from datetime import datetime

    accounts_data = load_accounts_metadata()
    added_count = 0
    updated_count = 0

    def parse_date(date_str):
        if not date_str: return None
        try:
            return datetime.fromisoformat(date_str)
        except:
            return None

    for data in accounts_data:
        # Tìm theo ID hoặc username
        acc = db.query(SocialAccount).filter(
            (SocialAccount.id == data.get("id")) | 
            (SocialAccount.username == data.get("username"))
        ).first()

        if acc:
            acc.platform = data.get("platform", acc.platform)
            acc.username = data.get("username", acc.username)
            acc.account_id = data.get("account_id", acc.account_id)
            acc.avatar_url = data.get("avatar_url", acc.avatar_url)
            acc.auth_data = data.get("auth_data", acc.auth_data)
            acc.proxy_host = data.get("proxy_host", acc.proxy_host)
            acc.proxy_port = data.get("proxy_port", acc.proxy_port)
            acc.proxy_username = data.get("proxy_username", acc.proxy_username)
            acc.proxy_password = data.get("proxy_password", acc.proxy_password)
            acc.proxy_id = data.get("proxy_id", acc.proxy_id)
            acc.connection_type = data.get("connection_type", acc.connection_type)
            acc.device_id = data.get("device_id", acc.device_id)
            acc.status = data.get("status", acc.status)
            if data.get("last_checked_at"):
                acc.last_checked_at = parse_date(data.get("last_checked_at"))
            updated_count += 1
        else:
            new_acc = SocialAccount(
                platform=data.get("platform"),
                username=data.get("username"),
                account_id=data.get("account_id"),
                avatar_url=data.get("avatar_url"),
                auth_data=data.get("auth_data"),
                proxy_host=data.get("proxy_host"),
                proxy_port=data.get("proxy_port"),
                proxy_username=data.get("proxy_username"),
                proxy_password=data.get("proxy_password"),
                proxy_id=data.get("proxy_id"),
                connection_type=data.get("connection_type", "web_playwright"),
                device_id=data.get("device_id"),
                status=data.get("status", "active"),
                last_checked_at=parse_date(data.get("last_checked_at"))
            )
            db.add(new_acc)
            added_count += 1
            
    db.commit()
    return {"status": "success", "added_count": added_count, "updated_count": updated_count}
