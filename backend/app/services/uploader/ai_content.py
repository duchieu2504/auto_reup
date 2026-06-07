import os
from google import genai
from typing import Dict

class AIContentGenerator:
    def __init__(self):
        from dotenv import load_dotenv
        from app.core.security import decrypt_data
        
        ENV_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../data/.env"))
        load_dotenv(ENV_PATH, override=True)
        
        self.active_provider = os.getenv("ACTIVE_AI_PROVIDER", "gemini")
        self.gemini_key = decrypt_data(os.getenv("GEMINI_API_KEY", ""))
        self.openai_key = decrypt_data(os.getenv("OPENAI_API_KEY", ""))
        self.anthropic_key = decrypt_data(os.getenv("ANTHROPIC_API_KEY", ""))
        self.xai_key = decrypt_data(os.getenv("XAI_API_KEY", ""))
        
        self.is_configured = False
        if self.active_provider == "gemini" and self.gemini_key:
            self.gemini_client = genai.Client(api_key=self.gemini_key)
            self.is_configured = True
        elif self.active_provider == "openai" and self.openai_key:
            from openai import OpenAI
            self.openai_client = OpenAI(api_key=self.openai_key)
            self.is_configured = True
        elif self.active_provider == "anthropic" and self.anthropic_key:
            from anthropic import Anthropic
            self.anthropic_client = Anthropic(api_key=self.anthropic_key)
            self.is_configured = True
        elif self.active_provider == "xai" and self.xai_key:
            from openai import OpenAI
            self.xai_client = OpenAI(api_key=self.xai_key, base_url="https://api.x.ai/v1")
            self.is_configured = True

    def generate_viral_content(self, video_title: str, translated_text: str = "") -> Dict[str, str]:
        """
        Sử dụng AI để sinh Caption giật tít và Hashtag thịnh hành
        """
        if not self.is_configured:
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
            result_text = ""
            if self.active_provider == "gemini":
                response = self.gemini_client.models.generate_content(
                    model='gemini-2.5-flash',
                    contents=prompt
                )
                result_text = response.text.strip()
            elif self.active_provider == "openai":
                response = self.openai_client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[{"role": "user", "content": prompt}],
                    max_tokens=200
                )
                result_text = response.choices[0].message.content.strip()
            elif self.active_provider == "anthropic":
                response = self.anthropic_client.messages.create(
                    model="claude-3-haiku-20240307",
                    messages=[{"role": "user", "content": prompt}],
                    max_tokens=200
                )
                result_text = response.content[0].text.strip()
            elif self.active_provider == "xai":
                response = self.xai_client.chat.completions.create(
                    model="grok-beta",
                    messages=[{"role": "user", "content": prompt}],
                    max_tokens=200
                )
                result_text = response.choices[0].message.content.strip()
            
            import json
            import re
            
            # Xử lý tìm chuỗi JSON trong phản hồi (tránh trường hợp AI nói thêm)
            json_match = re.search(r'\{.*\}', result_text, re.DOTALL)
            if json_match:
                result_text = json_match.group(0)
                
            data = json.loads(result_text)
            return {
                "caption": data.get("caption", video_title),
                "hashtags": data.get("hashtags", "#xuhuong #fyp")
            }
        except Exception as e:
            import logging
            logging.error(f"Lỗi khi sinh nội dung AI ({self.active_provider}): {e}")
            return {
                "caption": f"Hot: {video_title}",
                "hashtags": "#xuhuong #viral"
            }
