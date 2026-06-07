import os
import json
from datetime import datetime

from app.core.config import DATA_DIR
ACCOUNTS_DIR = os.path.join(DATA_DIR, "accounts")

def save_account_metadata(account_record):
    if not os.path.exists(ACCOUNTS_DIR):
        os.makedirs(ACCOUNTS_DIR, exist_ok=True)
        
    def iso_format(dt):
        return dt.isoformat() if dt else None
        
    data = {
        "id": account_record.id,
        "platform": account_record.platform,
        "username": account_record.username,
        "account_id": account_record.account_id,
        "avatar_url": account_record.avatar_url,
        "auth_data": account_record.auth_data,
        "proxy_host": account_record.proxy_host,
        "proxy_port": account_record.proxy_port,
        "proxy_username": account_record.proxy_username,
        "proxy_password": account_record.proxy_password,
        "connection_type": account_record.connection_type,
        "device_id": account_record.device_id,
        "status": account_record.status,
        "last_checked_at": iso_format(account_record.last_checked_at),
        "created_at": iso_format(account_record.created_at),
        "updated_at": iso_format(account_record.updated_at),
    }
    
    # Save with platform and username as filename
    safe_username = "".join([c for c in account_record.username if c.isalpha() or c.isdigit() or c==' ']).rstrip()
    safe_username = safe_username.replace(' ', '_')
    filename = f"{account_record.platform}_{safe_username}_{account_record.id}.json"
    file_path = os.path.join(ACCOUNTS_DIR, filename)
    
    try:
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=4)
    except Exception as e:
        print(f"Failed to save account metadata: {e}")

def delete_account_metadata(account_record):
    if not os.path.exists(ACCOUNTS_DIR):
        return
    safe_username = "".join([c for c in account_record.username if c.isalpha() or c.isdigit() or c==' ']).rstrip()
    safe_username = safe_username.replace(' ', '_')
    filename = f"{account_record.platform}_{safe_username}_{account_record.id}.json"
    file_path = os.path.join(ACCOUNTS_DIR, filename)
    if os.path.exists(file_path):
        try:
            os.remove(file_path)
        except Exception as e:
            pass

def load_accounts_metadata():
    if not os.path.exists(ACCOUNTS_DIR):
        return []
        
    result = []
    for filename in os.listdir(ACCOUNTS_DIR):
        if filename.endswith(".json"):
            path = os.path.join(ACCOUNTS_DIR, filename)
            try:
                with open(path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    result.append(data)
            except Exception as e:
                print(f"Error loading account metadata {path}: {e}")
    return result
