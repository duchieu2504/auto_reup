from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
import asyncio
import json
import logging
import os

from app.db.session import get_db
from app.models.social_account import SocialAccount
from app.models.twitter_nurture_config import TwitterNurtureConfig
from app.core.security import encrypt_data, decrypt_data
from app.utils.account_metadata import save_account_metadata, delete_account_metadata

router = APIRouter()

class TwitterNurtureConfigBase(BaseModel):
    is_active: bool = False
    mode: str = "A"
    list_ids: Optional[str] = None
    hashtags: Optional[str] = None
    ai_provider: Optional[str] = "deepseek"
    ai_api_key: Optional[str] = None
    ai_model: Optional[str] = None
    ai_style_prompt: Optional[str] = None
    comments_per_hour: int = 15

    class Config:
        from_attributes = True

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
    followers_count: Optional[int] = 0
    videos_count: Optional[int] = 0
    total_views: Optional[int] = 0
    total_likes: Optional[int] = 0
    health_metrics: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    last_checked_at: Optional[datetime] = None
    warmup_end_time: Optional[str] = None

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
            
    try:
        from app.core.redis_pool import get_sync_redis
        r = get_sync_redis(decode_responses=True)
        keys = [f"warmup_end:{acc.id}" for acc in accounts]
        end_times = r.mget(keys) if keys else []
        for acc, end_time in zip(accounts, end_times):
            setattr(acc, "warmup_end_time", end_time)
    except Exception as e:
        pass
        
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
    
    if db_account.platform.lower() == 'tiktok':
        from app.services.uploader.playwright_engine import PlaywrightEngine
        import json
        
        auth_data = None
        if db_account.auth_data:
            try:
                auth_data = json.loads(db_account.auth_data)
            except:
                auth_data = db_account.auth_data
                
        acc_data = {
            'id': db_account.id,
            'username': db_account.username,
            'connection_type': db_account.connection_type,
            'proxy_host': db_account.proxy_host,
            'proxy_port': db_account.proxy_port,
            'proxy_username': db_account.proxy_username,
            'proxy_password': db_account.proxy_password,
            'auth_data': auth_data
        }
        engine = PlaywrightEngine(acc_data)
        result = engine.check_status()
        
        save_account_metadata(db_account)
        
        if result.get("status") == "success":
            return {"status": "success", "message": result.get("message")}
        else:
            raise HTTPException(status_code=500, detail=result.get("message", "Lỗi kiểm tra trạng thái"))
    else:
        # Placeholder for other platforms
        from sqlalchemy.sql import func
        db_account.status = "active"
        db_account.last_checked_at = func.now()
        db.commit()
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
    from app.utils.proxy_resolver import resolve_proxy
    
    # Giải mã trước khi ném vào task
    if db_account.auth_data:
        db_account.auth_data = decrypt_data(db_account.auth_data)
        
    # Resolve proxy using DRY helper
    proxy = resolve_proxy(db_account, db)

    account_dict = {
        "id": db_account.id,
        "platform": db_account.platform,
        "username": db_account.username,
        "auth_data": db_account.auth_data,
        "proxy_host": proxy["host"],
        "proxy_port": proxy["port"],
        "proxy_username": proxy["username"],
        "proxy_password": proxy["password"],
        "proxy_id": db_account.proxy_id,
        "connection_type": db_account.connection_type,
        "device_id": db_account.device_id,
        "user_agent": db_account.user_agent
    }
    
    import random
    warmup_duration = random.randint(600, 900)
    account_dict["warmup_duration"] = warmup_duration
    
    task = warmup_account_task.delay(account_dict)
    
    try:
        from app.core.redis_pool import get_sync_redis
        r = get_sync_redis()
        r.set(f"warmup_task:{account_id}", task.id, ex=3600)
        
        # Lưu thời gian kết thúc ước tính (UTC+7)
        from datetime import datetime, timedelta, timezone
        import zoneinfo
        vn_tz = zoneinfo.ZoneInfo("Asia/Ho_Chi_Minh")
        end_time_str = (datetime.now(vn_tz) + timedelta(seconds=warmup_duration)).strftime("%H:%M")
        r.set(f"warmup_end:{account_id}", end_time_str, ex=warmup_duration + 300)
    except Exception as e:
        pass
    
    return {"status": "success", "message": f"Đã đưa tiến trình nuôi tài khoản {db_account.username} vào hàng đợi nền."}

@router.post("/{account_id}/stop-warmup")
def stop_warmup(account_id: int, db: Session = Depends(get_db)):
    db_account = db.query(SocialAccount).filter(SocialAccount.id == account_id).first()
    if not db_account:
        raise HTTPException(status_code=404, detail="Không tìm thấy tài khoản")
        
    try:
        from app.core.redis_pool import get_sync_redis
        from app.core.celery_app import celery_app
        
        r = get_sync_redis()
        task_id = r.get(f"warmup_task:{account_id}")
        
        if task_id:
            task_id_str = task_id.decode('utf-8')
            # Thêm cờ dừng an toàn để warmup_engine tự thoát vòng lặp và dọn dẹp browser
            r.set(f"warmup_stop:{account_id}", "1", ex=3600)
            
            # Vẫn revoke để phòng ngừa nếu task đang chờ trong queue
            celery_app.control.revoke(task_id_str, terminate=True)
            r.delete(f"warmup_task:{account_id}")
            
        # Tắt app tiktok nếu là adb_device
        if db_account.connection_type == "adb_device" and db_account.device_id:
            device_id = db_account.device_id
            from app.tasks.uploader_tasks import force_stop_device_task
            force_stop_device_task.delay(device_id)
            
        db_account.status = "active"
        db.commit()
        
        try:
            r.delete(f"warmup_end:{account_id}")
        except:
            pass
            
        return {"status": "success", "message": f"Đã dừng tiến trình nuôi cho tài khoản {db_account.username}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi khi dừng: {e}")

@router.get("/{account_id}/twitter-nurture-config", response_model=TwitterNurtureConfigBase)
def get_nurture_config(account_id: int, db: Session = Depends(get_db)):
    config = db.query(TwitterNurtureConfig).filter(TwitterNurtureConfig.account_id == account_id).first()
    if not config:
        return TwitterNurtureConfigBase()
    return config

@router.post("/{account_id}/twitter-nurture-config", response_model=TwitterNurtureConfigBase)
def update_nurture_config(account_id: int, config_data: TwitterNurtureConfigBase, db: Session = Depends(get_db)):
    config = db.query(TwitterNurtureConfig).filter(TwitterNurtureConfig.account_id == account_id).first()
    if not config:
        config = TwitterNurtureConfig(account_id=account_id)
        db.add(config)
    
    for key, value in config_data.model_dump().items():
        setattr(config, key, value)
    
    db.commit()
    db.refresh(config)
    return config

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

@router.websocket("/{account_id}/nurture-ws")
async def nurture_websocket(websocket: WebSocket, account_id: int, db: Session = Depends(get_db)):
    await websocket.accept()
    
    # Lấy thông tin account và config
    db_account = db.query(SocialAccount).filter(SocialAccount.id == account_id).first()
    if not db_account:
        await websocket.send_text(json.dumps({"type": "error", "message": "Không tìm thấy tài khoản"}))
        await websocket.close()
        return

    # Check platform
    if db_account.platform != "twitter":
        await websocket.send_text(json.dumps({"type": "error", "message": "Tính năng chỉ hỗ trợ Twitter (X)"}))
        await websocket.close()
        return

    # Resolve Proxy
    from app.utils.proxy_resolver import resolve_proxy
    proxy = resolve_proxy(db_account, db)
    proxy_url = ""
    if proxy and proxy.get("host") and proxy.get("port"):
        protocol = "http"
        auth = ""
        if proxy.get("username") and proxy.get("password"):
            auth = f"{proxy['username']}:{proxy['password']}@"
        proxy_url = f"{protocol}://{auth}{proxy['host']}:{proxy['port']}"

    # Lấy Config
    config = db.query(TwitterNurtureConfig).filter(TwitterNurtureConfig.account_id == account_id).first()
    if not config:
        await websocket.send_text(json.dumps({"type": "error", "message": "Vui lòng lưu cấu hình trước khi chạy"}))
        await websocket.close()
        return

    # Khởi tạo thư mục và config JSON cho Node.js
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    bot_dir = os.path.join(base_dir, "app", "services", "twitter_bot")
    storage_dir = os.path.join(base_dir, "data", "twitter_nurture", str(account_id))
    os.makedirs(storage_dir, exist_ok=True)
    
    config_path = os.path.join(storage_dir, "config.json")
    
    # Chuyển đổi config của Python sang định dạng Node.js cần
    node_config = {
        "AI_PROVIDER": config.ai_provider or "deepseek",
        "AI_API_KEY": config.ai_api_key or "",
        "AI_MODEL": config.ai_model or ("deepseek-chat" if config.ai_provider == "deepseek" else "gemini-1.5-pro"),
        "AI_STYLE_PROMPT": config.ai_style_prompt or "Bạn là một người dùng mạng xã hội, bình luận tự nhiên, hài hước, ngắn gọn.",
        "TWITTER_TARGET_LIST_ID": config.list_ids or "",
        "TWITTER_TARGET_HASHTAGS": (config.hashtags or "").split(","),
        "TWITTER_MODE": config.mode or "A",
        "COMMENTS_PER_HOUR": config.comments_per_hour or 15
    }
    
    with open(config_path, "w", encoding="utf-8") as f:
        json.dump(node_config, f, indent=4)
        
    # Chuẩn bị biến môi trường
    env = os.environ.copy()
    env["CONFIG_PATH"] = config_path
    env["STORE_PATH"] = storage_dir
    env["RUN_LOG_PATH"] = os.path.join(storage_dir, "run.log")
    if proxy_url:
        env["PROXY_URL"] = proxy_url

    process = None
    try:
        await websocket.send_text(json.dumps({"type": "info", "message": f"Bắt đầu khởi động bot cho {db_account.username}..."}))
        
        while True:
            await websocket.send_text(json.dumps({"type": "info", "message": "Đang chạy 1 chu kỳ Nuôi X (Stateless Mode)..."}))
            
            # Khởi chạy Subprocess Node.js
            process = await asyncio.create_subprocess_exec(
                "node", "src/index.mjs", "--run-once",
                cwd=bot_dir,
                env=env,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            async def read_stream(stream, msg_type):
                while True:
                    line = await stream.readline()
                    if not line:
                        break
                    decoded_line = line.decode('utf-8', errors='replace').strip()
                    if decoded_line:
                        # Gửi trực tiếp log về websocket
                        try:
                            await websocket.send_text(json.dumps({"type": msg_type, "message": decoded_line}))
                        except Exception:
                            pass # Bỏ qua nếu websocket đóng

            # Đọc log từ cả 2 luồng
            await asyncio.gather(
                read_stream(process.stdout, "log"),
                read_stream(process.stderr, "error")
            )
            
            await process.wait()
            
            await websocket.send_text(json.dumps({"type": "success", "message": "Chu kỳ hoàn thành. Đang nghỉ ngơi 15 phút (900s) trước chu kỳ tiếp theo..."}))
            
            # Ngủ 15 phút, trong thời gian này nếu user ngắt kết nối thì asyncio.sleep sẽ bị hủy nếu ta wrap tốt, 
            # hoặc đơn giản lúc gửi tin nhắn nếu lỗi sẽ catch được. Để an toàn, ta sleep theo block nhỏ
            for _ in range(90):
                await asyncio.sleep(10)
                # Ping nhẹ để xem kết nối còn sống không (nếu chết sẽ văng WebSocketDisconnect)
                await websocket.send_text(json.dumps({"type": "ping"}))
                
    except WebSocketDisconnect:
        logging.info(f"Client ngắt kết nối WebSocket nuôi X của account {account_id}.")
        # Nếu process đang chạy thì kill đi
        if process and process.returncode is None:
            try:
                process.terminate()
                logging.info(f"Đã kill tiến trình Node.js nuôi X (PID: {process.pid})")
            except Exception as e:
                logging.error(f"Lỗi khi kill Node process: {e}")
    except Exception as e:
        logging.error(f"Lỗi WebSocket nuôi X: {str(e)}")
        if process and process.returncode is None:
            process.terminate()
        try:
            await websocket.close()
        except:
            pass
