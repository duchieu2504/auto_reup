import os
import google.generativeai as genai
from typing import Dict

class AIContentGenerator:
    def __init__(self):
        # API Key sẽ được giải mã từ .env thông qua settings
        from dotenv import load_dotenv
        from app.core.security import decrypt_data
        
        ENV_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../data/.env"))
        load_dotenv(ENV_PATH, override=True)
        api_key = decrypt_data(os.getenv("GEMINI_API_KEY", ""))
        
        if api_key:
            genai.configure(api_key=api_key)
            self.model = genai.GenerativeModel('gemini-3.5-flash')
        else:
            self.model = None

    def generate_viral_content(self, video_title: str, translated_text: str = "") -> Dict[str, str]:
        """
        Sử dụng AI để sinh Caption giật tít và Hashtag thịnh hành
        """
        if not self.model:
            return {
                "caption": f"Góc chia sẻ: {video_title}",
                "hashtags": "#xuhuong #trend #fyp"
            }
            
        prompt = f"""
        Bạn là một chuyên gia sáng tạo nội dung (Content Creator) cho mạng xã hội TikTok và YouTube Shorts.
        Hãy viết một đoạn Caption thật ngắn gọn, giật tít, thu hút người xem dựa vào thông tin video sau:
        - Tiêu đề gốc: {video_title}
        - Một phần nội dung (phụ đề): {translated_text[:500] if translated_text else 'Không có'}
        
        Yêu cầu:
        1. Phần Caption: Viết thật tự nhiên, hài hước hoặc gây tò mò, KHÔNG DÙNG DẤU NHÁY KÉP, tối đa 2 câu. Không chèn hashtag vào phần này.
        2. Phần Hashtags: Gợi ý 3-5 hashtag hot nhất và phù hợp nhất với chủ đề này (VD: #xuhuong #kienthuc...).
        
        Vui lòng trả về định dạng đúng JSON như sau, không kèm theo bất kỳ văn bản nào khác:
        {{
            "caption": "nội dung caption",
            "hashtags": "#hashtag1 #hashtag2"
        }}
        """
        
        try:
            response = self.model.generate_content(prompt)
            result_text = response.text.strip()
            
            # Xử lý cắt bỏ markdown block nếu có
            if result_text.startswith("```json"):
                result_text = result_text.replace("```json", "").replace("```", "").strip()
            elif result_text.startswith("```"):
                result_text = result_text.replace("```", "").strip()
                
            import json
            data = json.loads(result_text)
            return {
                "caption": data.get("caption", video_title),
                "hashtags": data.get("hashtags", "#xuhuong #fyp")
            }
        except Exception as e:
            import logging
            logging.error(f"Lỗi khi sinh nội dung AI: {e}")
            return {
                "caption": f"Hot: {video_title}",
                "hashtags": "#xuhuong #viral"
            }
