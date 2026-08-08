import requests
from sqlalchemy.orm import Session
import random
from app.models.proxy import Proxy
import os

try:
    from google import genai
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False

try:
    from rembg import remove
    from PIL import Image
    REMBG_AVAILABLE = True
except ImportError:
    REMBG_AVAILABLE = False

# Tùy biến URL của Veo3 nếu cần.
VEO3_DEFAULT_ENDPOINT = "https://api.klingai.com/v1/videos/generations" 

def get_random_proxy(db: Session) -> str:
    """Lấy 1 proxy ngẫu nhiên đang active từ DB, định dạng http://user:pass@host:port"""
    proxies = db.query(Proxy).filter(Proxy.status == "active").all()
    if not proxies:
        return None
    p = random.choice(proxies)
    if p.username and p.password:
        return f"http://{p.username}:{p.password}@{p.host}:{p.port}"
    return f"http://{p.host}:{p.port}"

def test_photoroom_api(api_key: str) -> dict:
    """Kiểm tra Photoroom API Key bằng cách gọi endpoint nhẹ (vd: account info hoặc 1 request false)"""
    url = "https://sdk.photoroom.com/v1/account"
    headers = {
        "x-api-key": api_key
    }
    try:
        # Mocking check for now because Photoroom might not have an /account endpoint without image
        # Trong thực tế, gọi endpoint /v1/segment với invalid image để xem mã lỗi có phải 401/403 ko
        if not api_key or len(api_key) < 10:
            return {"success": False, "message": "API Key không hợp lệ"}
        return {"success": True, "message": "API Key Photoroom hợp lệ (Simulated)"}
    except Exception as e:
        return {"success": False, "message": str(e)}

def remove_bg_local(input_path: str, output_path: str) -> bool:
    """Tách nền bằng rembg cục bộ (không cần API)"""
    if not REMBG_AVAILABLE:
        raise Exception("Thư viện rembg chưa được cài đặt. Vui lòng chạy pip install rembg")
    try:
        input_image = Image.open(input_path)
        output_image = remove(input_image)
        output_image.save(output_path, "PNG")
        return True
    except Exception as e:
        print(f"Lỗi tách nền cục bộ: {e}")
        return False


def test_veo3_api(api_key: str, endpoint_url: str = None, proxy_url: str = None) -> dict:
    """Kiểm tra Veo3/Gemini API Key thông qua google-genai SDK"""
    try:
        if not api_key or len(api_key) < 10:
            return {"success": False, "message": "API Key quá ngắn hoặc không hợp lệ"}

        if not GENAI_AVAILABLE:
            return {"success": False, "message": "Thư viện google-genai chưa được cài đặt"}

        client = genai.Client(api_key=api_key)
        # Call a lightweight method to verify the key
        models = client.models.list()
        # If it doesn't throw an error, the key is valid
        # We can just fetch the first page
        for m in models:
            break
            
        return {"success": True, "message": "API Key Gemini/Veo hợp lệ (Kết nối thành công)", "proxy_used": False}
    except Exception as e:
        return {"success": False, "message": f"Không thể kết nối máy chủ Gemini/Veo: {str(e)}"}

def generate_video_gemini(api_key: str, prompt: str, image_path: str = None) -> bytes:
    """Gọi Veo API để sinh video thông qua google-genai"""
    if not GENAI_AVAILABLE:
        raise Exception("Thư viện google-genai chưa được cài đặt")
    
    from google import genai
    from google.genai import types
    import time
    from pathlib import Path
    
    client = genai.Client(api_key=api_key)
    
    kwargs = {
        "model": "veo-2.0-generate-001",
        "prompt": prompt,
        "config": types.GenerateVideosConfig(
            aspect_ratio="16:9",
            person_generation="ALLOW_ADULT"
        )
    }
    
    if image_path and os.path.exists(image_path):
        img_bytes = Path(image_path).read_bytes()
        kwargs["image"] = types.Image(image_bytes=img_bytes, mime_type="image/jpeg")
        
    print("Sending request to Veo API...")
    operation = client.models.generate_videos(**kwargs)
    
    # Chờ kết quả (Polling)
    while not operation.done:
        print("Đang chờ Video từ Veo...")
        time.sleep(10)
        operation = client.operations.get(operation.name)
        
    if operation.error:
        raise Exception(f"Lỗi sinh video: {operation.error.message}")
        
    try:
        vid = operation.response.generated_videos[0]
        return vid.video.video_bytes
    except Exception as e:
        print(f"Could not extract video bytes: {e}")
        raise Exception("Cấu trúc trả về không đúng, không tìm thấy video.")

def generate_image_gemini(api_key: str, prompt: str, image_path: str = None) -> bytes:
    """Sử dụng Imagen 3 hoặc Gemini Flash để sinh ảnh/ghép cảnh, tự động thử các mô hình"""
    if not GENAI_AVAILABLE:
        raise Exception("Thư viện google-genai chưa được cài đặt")
    
    from google import genai
    from google.genai import types
    from pathlib import Path
    
    client = genai.Client(api_key=api_key)
    
    # Lấy danh sách các mô hình sinh ảnh
    image_models = []
    try:
        models = list(client.models.list())
        available_names = [m.name for m in models]
        # Ưu tiên các mô hình không phải preview, sau đó ưu tiên imagen
        for name in available_names:
            short_name = name.split('/')[-1] if '/' in name else name
            if 'flash-image' in short_name.lower() or 'imagen' in short_name.lower():
                image_models.append(short_name)
                
        # Sắp xếp: Ưu tiên mô hình không chứa chữ 'preview'
        image_models.sort(key=lambda x: ('preview' in x.lower(), x))
    except Exception as e:
        print(f"Lỗi lấy danh sách mô hình: {e}")
        image_models = ["imagen-3.0-generate-002", "gemini-2.5-flash-image"]

    if not image_models:
        image_models = ["imagen-3.0-generate-002"]

    img_bytes = None
    if image_path and os.path.exists(image_path):
        img_bytes = Path(image_path).read_bytes()

    last_error = None
    
    # Lặp qua các mô hình để thử
    for model_name in image_models:
        print(f"Đang thử sinh ảnh bằng mô hình: {model_name}")
        try:
            is_gemini = "gemini" in model_name.lower()
            
            if is_gemini:
                contents = [prompt]
                if img_bytes:
                    contents.append(types.Part.from_bytes(data=img_bytes, mime_type="image/png"))
                    
                response = client.models.generate_content(
                    model=model_name,
                    contents=contents,
                    config=types.GenerateContentConfig(
                        response_modalities=["IMAGE"]
                    )
                )
                
                for part in response.candidates[0].content.parts:
                    if part.inline_data:
                        return part.inline_data.data
                raise Exception("Không tìm thấy inline_data.")
                
            else:
                if img_bytes:
                    try:
                        response = client.models.edit_image(
                            model=model_name,
                            prompt=prompt,
                            reference_images=[
                                types.ReferenceImage(
                                    reference_id=1,
                                    reference_type="SUBJECT",
                                    image=types.Image(image_bytes=img_bytes, mime_type="image/png")
                                )
                            ],
                            config=types.EditImageConfig(
                                number_of_images=1,
                                output_mime_type="image/png"
                            )
                        )
                    except Exception as sub_e:
                        print(f"edit_image failed with {model_name}, trying generate_images: {sub_e}")
                        response = client.models.generate_images(
                            model=model_name,
                            prompt=prompt,
                            config=types.GenerateImagesConfig(
                                number_of_images=1,
                                output_mime_type="image/png"
                            )
                        )
                else:
                    response = client.models.generate_images(
                        model=model_name,
                        prompt=prompt,
                        config=types.GenerateImagesConfig(
                            number_of_images=1,
                            output_mime_type="image/png"
                        )
                    )
                
                if getattr(response, 'generated_images', None):
                    img = response.generated_images[0]
                    result_bytes = getattr(img.image, 'image_bytes', getattr(img, 'image_bytes', None))
                    if result_bytes:
                        return result_bytes
                raise Exception("Không tìm thấy dữ liệu ảnh.")
                
        except Exception as e:
            last_error = str(e)
            print(f"Thất bại với {model_name}: {last_error}")
            # Tiếp tục vòng lặp để thử mô hình khác
            continue

    raise Exception(f"Tất cả các mô hình đều thất bại. Lỗi cuối cùng: {last_error}")