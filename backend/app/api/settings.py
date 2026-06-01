import os
import requests
from fastapi import APIRouter, Request
from pydantic import BaseModel
from dotenv import load_dotenv, set_key
from app.core.security import encrypt_data, decrypt_data

router = APIRouter()

ENV_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../data/.env"))

class KeysUpdate(BaseModel):
    fpt_ai_api_key: str
    gemini_api_key: str = ""
    ai_concurrency_limit: int = 1
    douyin_cookie: str = ""

@router.get("/voices")
async def get_available_voices():
    # Mặc định luôn có Edge-TTS
    voices = [
        {"id": "edge_auto", "name": "Tự động phân vai Nam/Nữ (Gemini phân tích)", "provider": "Edge-TTS"},
        {"id": "edge_hoaimy", "name": "Chỉ Nữ (Hoài My)", "provider": "Edge-TTS"},
        {"id": "edge_namminh", "name": "Chỉ Nam (Nam Minh)", "provider": "Edge-TTS"},
        {"id": "none", "name": "Không lồng tiếng (Chỉ ghép phụ đề)", "provider": "None"}
    ]
    
    # Kiểm tra cấu hình bên thứ 3 (FPT.AI)
    load_dotenv(ENV_PATH, override=True)
    fpt_key = decrypt_data(os.getenv("FPT_AI_API_KEY", ""))
    
    if fpt_key and fpt_key.strip():
        # Thêm giọng FPT.AI nếu có key
        fpt_voices = [
            {"id": "fpt_banmai", "name": "FPT Nữ (Ban Mai - Miền Bắc)", "provider": "FPT.AI"},
            {"id": "fpt_minhquang", "name": "FPT Nam (Minh Quang - Miền Nam)", "provider": "FPT.AI"},
            {"id": "fpt_thuminh", "name": "FPT Nữ (Thu Minh - Miền Bắc)", "provider": "FPT.AI"}
        ]
        voices.extend(fpt_voices)
        
    return {"voices": voices}

@router.get("/keys")
async def get_keys():
    load_dotenv(ENV_PATH, override=True)
    return {
        "fpt_ai_api_key": decrypt_data(os.getenv("FPT_AI_API_KEY", "")),
        "gemini_api_key": decrypt_data(os.getenv("GEMINI_API_KEY", "")),
        "ai_concurrency_limit": int(os.getenv("AI_CONCURRENCY_LIMIT", 1)),
        "douyin_cookie": decrypt_data(os.getenv("DOUYIN_COOKIE", ""))
    }

@router.post("/keys")
async def update_keys(data: KeysUpdate):
    # Đảm bảo file .env tồn tại
    if not os.path.exists(ENV_PATH):
        with open(ENV_PATH, "w") as f:
            f.write("")
            
    set_key(ENV_PATH, "FPT_AI_API_KEY", encrypt_data(data.fpt_ai_api_key))
    set_key(ENV_PATH, "GEMINI_API_KEY", encrypt_data(data.gemini_api_key))
    set_key(ENV_PATH, "AI_CONCURRENCY_LIMIT", str(data.ai_concurrency_limit))
    set_key(ENV_PATH, "DOUYIN_COOKIE", encrypt_data(data.douyin_cookie))
    
    # Save cookie to file in Netscape format for yt-dlp (Lưu ý: yt-dlp cần file raw text)
    cookie_path = os.path.join(os.path.dirname(ENV_PATH), "douyin_cookie.txt")
    if os.path.exists(os.path.dirname(cookie_path)):
        lines = ["# Netscape HTTP Cookie File", ""]
        for domain in [".douyin.com", ".iesdouyin.com"]:
            for part in data.douyin_cookie.strip().split(";"):
                part = part.strip()
                if not part or "=" not in part: continue
                k, v = part.split("=", 1)
                lines.append(f"{domain}\tTRUE\t/\tFALSE\t2147483647\t{k}\t{v}")
            
        with open(cookie_path, "w", encoding="utf-8") as f:
            f.write("\n".join(lines))
            
    return {"status": "success", "message": "Cập nhật cấu hình thành công"}

@router.post("/validate")
async def validate_keys(data: KeysUpdate):
    results = {
        "fpt_ai_api_key": "unknown",
        "gemini_api_key": "unknown",
        "douyin_cookie": "unknown"
    }
    
    # 1. Test FPT API Key
    if data.fpt_ai_api_key and data.fpt_ai_api_key.strip():
        headers = {"api-key": data.fpt_ai_api_key}
        payload = {"text": "test", "voice": "banmai"}
        try:
            resp = requests.post("https://api.fpt.ai/hmi/tts/v5", headers=headers, data=payload, timeout=5)
            if resp.status_code in [200, 201]:
                results["fpt_ai_api_key"] = "valid"
            else:
                results["fpt_ai_api_key"] = "invalid"
        except Exception:
            results["fpt_ai_api_key"] = "error"
            
    # 2. Test Gemini API Key
    if data.gemini_api_key and data.gemini_api_key.strip():
        try:
            import google.generativeai as genai
            genai.configure(api_key=data.gemini_api_key)
            model = genai.GenerativeModel('gemini-3.5-flash')
            # Test simple completion
            model.generate_content("hello")
            results["gemini_api_key"] = "valid"
        except Exception as e:
            print("Gemini Test Error:", e)
            results["gemini_api_key"] = "invalid"
            
    # 3. Test Douyin Cookie
    if data.douyin_cookie and data.douyin_cookie.strip():
        import urllib.parse
        missing = []
        if "sessionid=" not in data.douyin_cookie:
            missing.append("sessionid")
        if "__ac_signature=" not in data.douyin_cookie:
            missing.append("__ac_signature")
            
        expires = None
        for item in data.douyin_cookie.split(";"):
            item = item.strip()
            if item.startswith("sid_guard="):
                parts = item.split("=", 1)
                if len(parts) > 1:
                    val_parts = urllib.parse.unquote(parts[1]).split("|")
                    if len(val_parts) >= 4:
                        expires = val_parts[3]
                break

        results["douyin_details"] = {
            "missing": missing,
            "expires": expires
        }

        try:
            from ..services.crawler.douyin_api import DouyinAPIClient
            client = DouyinAPIClient()
            client.raw_cookie = data.douyin_cookie
            client.cookies = {}
            for part in data.douyin_cookie.split(";"):
                part = part.strip()
                if "=" in part:
                    k, v = part.split("=", 1)
                    client.cookies[k] = v
                    
            if "__druidClientInfo=" in data.douyin_cookie:
                import base64
                import json
                import urllib.parse
                try:
                    for part in data.douyin_cookie.split(";"):
                        part = part.strip()
                        if part.startswith("__druidClientInfo="):
                            val = urllib.parse.unquote(part.split("=", 1)[1])
                            decoded = base64.b64decode(val).decode('utf-8')
                            info = json.loads(decoded)
                            if "userAgent" in info:
                                client.user_agent = info["userAgent"]
                                client.headers["User-Agent"] = client.user_agent
                                client.abogus_generator.user_agent = client.user_agent
                            break
                except Exception:
                    pass

            # Thử lấy bảng xếp hạng hoặc profile để kiểm tra chính xác
            params = client._default_query()
            params.update({"sec_user_id": "MS4wLjABAAAAgbac9ihpTlet1afYz7ingYX92zHVMzSGZeHQtWVaLSE"})
            resp_data = client.request_json("/aweme/v1/web/aweme/post/", params)
            
            if resp_data and isinstance(resp_data, dict):
                if resp_data.get("status_code") == 0:
                    results["douyin_cookie"] = "valid"
                else:
                    results["douyin_cookie"] = "invalid"
            else:
                results["douyin_cookie"] = "invalid"
                
        except Exception as e:
            results["douyin_cookie"] = "error"
    else:
        results["douyin_cookie"] = "missing"
        
    return results
