import os
import requests
from fastapi import APIRouter, Request
from pydantic import BaseModel
from dotenv import load_dotenv, set_key
from app.core.security import encrypt_data, decrypt_data

router = APIRouter()

ENV_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../data/.env"))

class KeysUpdate(BaseModel):
    fpt_ai_api_key: str = ""
    elevenlabs_api_key: str = ""
    gemini_api_key: str = ""
    openai_api_key: str = ""
    anthropic_api_key: str = ""
    xai_api_key: str = ""
    active_ai_provider: str = "gemini"
    active_tts_provider: str = "edge"
    ai_concurrency_limit: int = 1
    douyin_cookie: str = ""

@router.get("/voices")
async def get_available_voices():
    load_dotenv(ENV_PATH, override=True)
    active_tts = os.getenv("ACTIVE_TTS_PROVIDER", "edge")
    
    voices = []
    
    # Auto Voice option that delegates to active provider
    voices.append({"id": "auto", "name": "Tự động phân vai Nam/Nữ", "provider": "Auto"})
    
    if active_tts == "fpt":
        voices.extend([
            {"id": "fpt_banmai", "name": "FPT Nữ (Ban Mai - Miền Bắc)", "provider": "FPT.AI"},
            {"id": "fpt_minhquang", "name": "FPT Nam (Minh Quang - Miền Nam)", "provider": "FPT.AI"},
            {"id": "fpt_thuminh", "name": "FPT Nữ (Thu Minh - Miền Bắc)", "provider": "FPT.AI"}
        ])
    elif active_tts == "openai":
        voices.extend([
            {"id": "openai_alloy", "name": "OpenAI (Alloy - Nam tính)", "provider": "OpenAI"},
            {"id": "openai_echo", "name": "OpenAI (Echo - Trầm ấm)", "provider": "OpenAI"},
            {"id": "openai_fable", "name": "OpenAI (Fable - Kể chuyện)", "provider": "OpenAI"},
            {"id": "openai_onyx", "name": "OpenAI (Onyx - Trầm)", "provider": "OpenAI"},
            {"id": "openai_nova", "name": "OpenAI (Nova - Nữ tính)", "provider": "OpenAI"},
            {"id": "openai_shimmer", "name": "OpenAI (Shimmer - Nữ trong trẻo)", "provider": "OpenAI"}
        ])
    elif active_tts == "elevenlabs":
        voices.extend([
            {"id": "elevenlabs_rachel", "name": "ElevenLabs (Rachel - Nữ)", "provider": "ElevenLabs"},
            {"id": "elevenlabs_drew", "name": "ElevenLabs (Drew - Nam)", "provider": "ElevenLabs"},
            {"id": "elevenlabs_clyde", "name": "ElevenLabs (Clyde - Nam)", "provider": "ElevenLabs"},
            {"id": "elevenlabs_mimi", "name": "ElevenLabs (Mimi - Nữ em bé)", "provider": "ElevenLabs"}
        ])
    else:
        # Default edge
        voices.extend([
            {"id": "edge_hoaimy", "name": "Chỉ Nữ (Hoài My)", "provider": "Edge-TTS"},
            {"id": "edge_namminh", "name": "Chỉ Nam (Nam Minh)", "provider": "Edge-TTS"}
        ])
        
    voices.append({"id": "none", "name": "Không lồng tiếng (Chỉ ghép phụ đề)", "provider": "None"})
        
    return {"voices": voices}

@router.get("/keys")
async def get_keys():
    load_dotenv(ENV_PATH, override=True)
    return {
        "fpt_ai_api_key": decrypt_data(os.getenv("FPT_AI_API_KEY", "")),
        "elevenlabs_api_key": decrypt_data(os.getenv("ELEVENLABS_API_KEY", "")),
        "gemini_api_key": decrypt_data(os.getenv("GEMINI_API_KEY", "")),
        "openai_api_key": decrypt_data(os.getenv("OPENAI_API_KEY", "")),
        "anthropic_api_key": decrypt_data(os.getenv("ANTHROPIC_API_KEY", "")),
        "xai_api_key": decrypt_data(os.getenv("XAI_API_KEY", "")),
        "active_ai_provider": os.getenv("ACTIVE_AI_PROVIDER", "gemini"),
        "active_tts_provider": os.getenv("ACTIVE_TTS_PROVIDER", "edge"),
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
    set_key(ENV_PATH, "ELEVENLABS_API_KEY", encrypt_data(data.elevenlabs_api_key))
    set_key(ENV_PATH, "GEMINI_API_KEY", encrypt_data(data.gemini_api_key))
    set_key(ENV_PATH, "OPENAI_API_KEY", encrypt_data(data.openai_api_key))
    set_key(ENV_PATH, "ANTHROPIC_API_KEY", encrypt_data(data.anthropic_api_key))
    set_key(ENV_PATH, "XAI_API_KEY", encrypt_data(data.xai_api_key))
    set_key(ENV_PATH, "ACTIVE_AI_PROVIDER", data.active_ai_provider)
    set_key(ENV_PATH, "ACTIVE_TTS_PROVIDER", data.active_tts_provider)
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
        "elevenlabs_api_key": "unknown",
        "gemini_api_key": "unknown",
        "openai_api_key": "unknown",
        "anthropic_api_key": "unknown",
        "xai_api_key": "unknown",
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
            
    # Test ElevenLabs API Key
    if data.elevenlabs_api_key and data.elevenlabs_api_key.strip():
        try:
            headers = {"xi-api-key": data.elevenlabs_api_key}
            resp = requests.get("https://api.elevenlabs.io/v1/user", headers=headers, timeout=5)
            if resp.status_code == 200:
                results["elevenlabs_api_key"] = "valid"
            else:
                results["elevenlabs_api_key"] = "invalid"
        except Exception:
            results["elevenlabs_api_key"] = "error"
            
    # 2. Test Gemini API Key
    if data.gemini_api_key and data.gemini_api_key.strip():
        try:
            import google.generativeai as genai
            genai.configure(api_key=data.gemini_api_key)
            model = genai.GenerativeModel('gemini-2.5-flash')
            # Test simple completion
            model.generate_content("hello")
            results["gemini_api_key"] = "valid"
        except Exception as e:
            print("Gemini Test Error:", e)
            results["gemini_api_key"] = "invalid"

    # 3. Test OpenAI API Key
    if data.openai_api_key and data.openai_api_key.strip():
        try:
            from openai import OpenAI
            client = OpenAI(api_key=data.openai_api_key)
            client.models.list()
            results["openai_api_key"] = "valid"
        except Exception as e:
            print("OpenAI Test Error:", e)
            results["openai_api_key"] = "invalid"

    # 4. Test Anthropic API Key
    if data.anthropic_api_key and data.anthropic_api_key.strip():
        try:
            from anthropic import Anthropic
            client = Anthropic(api_key=data.anthropic_api_key)
            # Make a cheap call
            client.messages.create(model="claude-3-haiku-20240307", max_tokens=10, messages=[{"role": "user", "content": "hi"}])
            results["anthropic_api_key"] = "valid"
        except Exception as e:
            print("Anthropic Test Error:", e)
            results["anthropic_api_key"] = "invalid"

    # 5. Test xAI API Key
    if data.xai_api_key and data.xai_api_key.strip():
        try:
            from openai import OpenAI
            client = OpenAI(api_key=data.xai_api_key, base_url="https://api.x.ai/v1")
            client.models.list()
            results["xai_api_key"] = "valid"
        except Exception as e:
            print("xAI Test Error:", e)
            results["xai_api_key"] = "invalid"
            
    # 6. Test Douyin Cookie
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
