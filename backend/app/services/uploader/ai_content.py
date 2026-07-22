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
        self.gemini_model = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
        self.openai_key = decrypt_data(os.getenv("OPENAI_API_KEY", ""))
        self.anthropic_key = decrypt_data(os.getenv("ANTHROPIC_API_KEY", ""))
        self.xai_key = decrypt_data(os.getenv("XAI_API_KEY", ""))
        
        self.custom_ai_endpoint = os.getenv("CUSTOM_AI_ENDPOINT", "http://localhost:20128/v1")
        self.custom_ai_key = decrypt_data(os.getenv("CUSTOM_AI_KEY", ""))
        self.custom_ai_model = os.getenv("CUSTOM_AI_MODEL", "kr/claude-sonnet-4.5")
        
        if self.custom_ai_endpoint and self.custom_ai_key:
            self.active_provider = "custom"
        
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
        elif self.active_provider == "custom" and self.custom_ai_key:
            from openai import OpenAI
            self.custom_client = OpenAI(api_key=self.custom_ai_key, base_url=self.custom_ai_endpoint)
            self.is_configured = True

    def generate_viral_content(self, video_title: str, translated_text: str = "", original_hashtags: str = "") -> Dict[str, str]:
        """
        Sử dụng AI để sinh Caption giật tít và Hashtag thịnh hành
        """
        if not self.is_configured:
            return {
                "caption": f"Góc chia sẻ: {video_title}",
                "hashtags": original_hashtags if original_hashtags else "#xuhuong #trend #fyp"
            }
            
        prompt = f"""
        Bạn là một chuyên gia sáng tạo nội dung (Content Creator) cho mạng xã hội TikTok và YouTube Shorts.
        Hãy viết một đoạn Caption thật ngắn gọn, giật tít, thu hút người xem dựa vào thông tin video sau:
        - Tiêu đề gốc: {video_title}
        - Một phần nội dung (phụ đề): {translated_text[:500] if translated_text else 'Không có'}
        - Hashtag gốc của video: {original_hashtags if original_hashtags else 'Không có'}
        
        Yêu cầu:
        1. Phần Caption: Viết thật tự nhiên, hài hước hoặc gây tò mò, KHÔNG DÙNG DẤU NHÁY KÉP, tối đa 2 câu. Không chèn hashtag vào phần này.
        2. Phần Hashtags: Hãy dịch hoặc chuyển đổi các hashtag gốc sang tiếng Việt (giữ nguyên định dạng #hashtag, viết liền không dấu hoặc có dấu tùy ý). Nếu video không có hashtag gốc, hãy tự gợi ý 3-5 hashtag hot nhất. Trả về dưới dạng chuỗi các hashtag cách nhau bởi dấu cách.
        
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
                    model=self.gemini_model,
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
            elif self.active_provider == "custom":
                response = self.custom_client.chat.completions.create(
                    model=self.custom_ai_model,
                    messages=[{"role": "user", "content": prompt}],
                    max_tokens=200
                )
                result_text = response.choices[0].message.content.strip()
            
            import json
            import re
            
            # Loại bỏ các thẻ <thinking> hoặc <thought>
            result_text = re.sub(r'<thinking>.*?</thinking>', '', result_text, flags=re.DOTALL | re.IGNORECASE)
            result_text = re.sub(r'<thought>.*?</thought>', '', result_text, flags=re.DOTALL | re.IGNORECASE)
            
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
            raise Exception(f"Lỗi API ({self.active_provider}): {str(e)}")

    def translate_to_vietnamese(self, text: str, video_context: str = "", original_hashtags: str = "") -> Dict[str, str]:
        """
        Dịch một đoạn văn bản (caption gốc) sang tiếng Việt bằng AI đang được cấu hình.
        Đồng thời dịch cả các hashtag gốc sang tiếng Việt.
        """
        if not text and not original_hashtags:
            return {"caption": "", "hashtags": ""}
            
        if not self.is_configured:
            return {"caption": text, "hashtags": original_hashtags}
            
        context_prompt = ""
        if video_context:
            context_prompt = f"""
        [NGỮ CẢNH TỪ VIDEO]
        - Thoại trong video (Subtitle): "{video_context[:2000]}"
        * Lưu ý: [M] là giọng Nam, [F] là giọng Nữ. Hãy điều chỉnh đại từ nhân xưng (Anh/Chị/Ông/Bà/Mình...) cho phù hợp với giới tính người nói và hoàn cảnh.
        """
            
        prompt = f"""
        Bạn là một dịch giả chuyên nghiệp và chuyên gia sáng tạo nội dung. Nhiệm vụ của bạn là dịch đoạn caption gốc và chuyển đổi hashtag sang tiếng Việt một cách tự nhiên, thu hút, đúng ngữ cảnh mạng xã hội.
        {context_prompt}
        
        Thông tin cần xử lý:
        - Caption gốc: {text if text else 'Không có'}
        - Hashtag gốc: {original_hashtags if original_hashtags else 'Không có'}
        
        Yêu cầu:
        1. Phần Caption: Dịch trôi chảy sang tiếng Việt. Không tự thêm thông tin hay lời giải thích.
        2. Phần Hashtags: Dịch/chuyển đổi các hashtag gốc sang tiếng Việt (định dạng #hashtag). Nếu hashtag gốc không có ý nghĩa khi dịch, có thể giữ nguyên hoặc thay thế bằng hashtag tiếng Việt tương đương. Trả về thành 1 chuỗi cách nhau bằng dấu cách.
        
        Vui lòng trả về kết quả dưới định dạng JSON đúng chuẩn sau, KHÔNG kèm theo văn bản nào khác:
        {{
            "caption": "bản dịch caption",
            "hashtags": "bản dịch hashtag"
        }}
        """
        
        try:
            result_text = ""
            if self.active_provider == "gemini":
                response = self.gemini_client.models.generate_content(
                    model=self.gemini_model,
                    contents=prompt
                )
                result_text = response.text.strip()
            elif self.active_provider == "openai":
                response = self.openai_client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[{"role": "user", "content": prompt}],
                    max_tokens=300
                )
                result_text = response.choices[0].message.content.strip()
            elif self.active_provider == "anthropic":
                response = self.anthropic_client.messages.create(
                    model="claude-3-haiku-20240307",
                    messages=[{"role": "user", "content": prompt}],
                    max_tokens=300
                )
                result_text = response.content[0].text.strip()
            elif self.active_provider == "xai":
                response = self.xai_client.chat.completions.create(
                    model="grok-beta",
                    messages=[{"role": "user", "content": prompt}],
                    max_tokens=300
                )
                result_text = response.choices[0].message.content.strip()
            elif self.active_provider == "custom":
                response = self.custom_client.chat.completions.create(
                    model=self.custom_ai_model,
                    messages=[{"role": "user", "content": prompt}],
                    max_tokens=300
                )
                result_text = response.choices[0].message.content.strip()
                
            import json
            import re
            # Loại bỏ các thẻ <thinking> hoặc <thought> thường xuất hiện ở các model Reasoning (DeepSeek R1, Claude)
            result_text = re.sub(r'<thinking>.*?</thinking>', '', result_text, flags=re.DOTALL | re.IGNORECASE)
            result_text = re.sub(r'<thought>.*?</thought>', '', result_text, flags=re.DOTALL | re.IGNORECASE)
            
            # Xử lý lấy JSON
            json_match = re.search(r'\{.*\}', result_text, re.DOTALL)
            if json_match:
                result_text = json_match.group(0)
                
            data = json.loads(result_text)
            return {
                "caption": data.get("caption", text),
                "hashtags": data.get("hashtags", original_hashtags)
            }
        except Exception as e:
            import logging
            logging.error(f"Lỗi khi dịch AI ({self.active_provider}): {e}")
            raise Exception(f"Lỗi API dịch ({self.active_provider}): {str(e)}")
