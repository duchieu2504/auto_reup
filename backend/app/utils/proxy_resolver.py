"""
Centralized proxy resolution logic — DRY helper used by uploader tasks and API endpoints.
Resolves proxy details from an account, prioritizing proxy_id FK over inline fields.
"""
from app.core.security import decrypt_data


def resolve_proxy(account, db) -> dict:
    """Resolve proxy config from account object.
    
    Priority: proxy_id FK (Proxy table) > inline proxy fields on account.
    Automatically decrypts password.
    
    Returns dict with keys: host, port, username, password
    """
    proxy_data = {
        "host": account.proxy_host,
        "port": account.proxy_port,
        "username": account.proxy_username,
        "password": account.proxy_password,
    }

    if account.proxy_id:
        from app.models.proxy import Proxy
        proxy_obj = db.query(Proxy).filter(Proxy.id == account.proxy_id).first()
        if proxy_obj:
            proxy_data["host"] = proxy_obj.host
            proxy_data["port"] = proxy_obj.port
            proxy_data["username"] = proxy_obj.username
            if proxy_obj.password:
                proxy_data["password"] = decrypt_data(proxy_obj.password)
            return proxy_data

    # Decrypt inline password if present
    if proxy_data["password"]:
        proxy_data["password"] = decrypt_data(proxy_data["password"])

    return proxy_data
