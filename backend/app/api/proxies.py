from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
import httpx

from app.db.session import get_db
from app.models.proxy import Proxy
from app.core.security import encrypt_data, decrypt_data

router = APIRouter()

class ProxyBase(BaseModel):
    name: str
    host: str
    port: str
    username: Optional[str] = None
    password: Optional[str] = None

class ProxyCreate(ProxyBase):
    pass

class ProxyResponse(ProxyBase):
    id: int
    status: str
    last_checked_at: Optional[datetime]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True

@router.get("/", response_model=List[ProxyResponse])
def get_proxies(db: Session = Depends(get_db)):
    proxies = db.query(Proxy).order_by(Proxy.created_at.desc()).all()
    for proxy in proxies:
        if proxy.password:
            try:
                proxy.password = decrypt_data(proxy.password)
            except:
                pass
    return proxies

@router.post("/", response_model=ProxyResponse)
def create_proxy(proxy: ProxyCreate, db: Session = Depends(get_db)):
    db_proxy_data = proxy.model_dump()
    if db_proxy_data.get('password'):
        db_proxy_data['password'] = encrypt_data(db_proxy_data['password'])
    
    db_proxy = Proxy(**db_proxy_data)
    db.add(db_proxy)
    db.commit()
    db.refresh(db_proxy)
    
    if db_proxy.password:
        try:
            db_proxy.password = decrypt_data(db_proxy.password)
        except:
            pass
    return db_proxy

@router.put("/{proxy_id}", response_model=ProxyResponse)
def update_proxy(proxy_id: int, proxy: ProxyCreate, db: Session = Depends(get_db)):
    db_proxy = db.query(Proxy).filter(Proxy.id == proxy_id).first()
    if not db_proxy:
        raise HTTPException(status_code=404, detail="Proxy not found")
    
    update_data = proxy.model_dump()
    if update_data.get('password'):
        update_data['password'] = encrypt_data(update_data['password'])
        
    for key, value in update_data.items():
        setattr(db_proxy, key, value)
        
    db.commit()
    db.refresh(db_proxy)
    
    if db_proxy.password:
        try:
            db_proxy.password = decrypt_data(db_proxy.password)
        except:
            pass
    return db_proxy

@router.delete("/{proxy_id}")
def delete_proxy(proxy_id: int, db: Session = Depends(get_db)):
    db_proxy = db.query(Proxy).filter(Proxy.id == proxy_id).first()
    if not db_proxy:
        raise HTTPException(status_code=404, detail="Proxy not found")
        
    db.delete(db_proxy)
    db.commit()
    return {"status": "success"}

@router.post("/{proxy_id}/check")
def check_proxy(proxy_id: int, db: Session = Depends(get_db)):
    db_proxy = db.query(Proxy).filter(Proxy.id == proxy_id).first()
    if not db_proxy:
        raise HTTPException(status_code=404, detail="Proxy not found")
        
    proxy_pass = ""
    if db_proxy.password:
        try:
            proxy_pass = decrypt_data(db_proxy.password)
        except:
            pass
            
    proxy_url = f"http://{db_proxy.host}:{db_proxy.port}"
    if db_proxy.username and proxy_pass:
        proxy_url = f"http://{db_proxy.username}:{proxy_pass}@{db_proxy.host}:{db_proxy.port}"
        
    proxies = {
        "http://": proxy_url,
        "https://": proxy_url
    }
    
    from sqlalchemy.sql import func
    
    try:
        # Check proxy by requesting an IP check service
        with httpx.Client(proxies=proxies, timeout=10.0) as client:
            response = client.get("http://ip-api.com/json")
            if response.status_code == 200:
                data = response.json()
                db_proxy.status = "active"
                db_proxy.last_checked_at = func.now()
                db.commit()
                return {"status": "success", "ip": data.get("query"), "country": data.get("country")}
            else:
                db_proxy.status = "dead"
                db_proxy.last_checked_at = func.now()
                db.commit()
                return {"status": "error", "message": f"Proxy returned status {response.status_code}"}
    except Exception as e:
        db_proxy.status = "dead"
        db_proxy.last_checked_at = func.now()
        db.commit()
        return {"status": "error", "message": str(e)}
