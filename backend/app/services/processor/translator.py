import os
from google import genai
from dotenv import load_dotenv

ENV_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../data/.env"))

class Translator:
    def __init__(self):
        # We will load keys in translate_srt to ensure they are fresh
        pass
        
    def translate_srt(self, input_srt: str, output_srt: str, voice_mode: str = "none", audio_path: str = None):
        load_dotenv(ENV_PATH, override=True)
        from app.core.security import decrypt_data
        
        active_provider = os.getenv("ACTIVE_AI_PROVIDER", "gemini")
        gemini_key = decrypt_data(os.getenv("GEMINI_API_KEY", ""))
        gemini_model = os.getenv("GEMINI_MODEL", "gemini-3.5-flash")
        openai_key = decrypt_data(os.getenv("OPENAI_API_KEY", ""))
        anthropic_key = decrypt_data(os.getenv("ANTHROPIC_API_KEY", ""))
        xai_key = decrypt_data(os.getenv("XAI_API_KEY", ""))
        
        with open(input_srt, "r", encoding="utf-8") as f:
            content = f.read()
            
        try:
            # Phân luồng đặc biệt: Nếu cần nghe Audio (edge_auto), LUÔN LUÔN dùng Gemini
            if audio_path and voice_mode == "edge_auto":
                if not gemini_key:
                    raise Exception("Tính năng Phân vai Nam/Nữ qua âm thanh yêu cầu phải cấu hình Gemini API Key.")
                
                client = genai.Client(api_key=gemini_key)
                audio_file = client.files.upload(file=audio_path)
                
                prompt = f"""
Bạn là chuyên gia dịch thuật tiếng Trung sang tiếng Việt.
Dưới đây là nội dung một file phụ đề định dạng SRT. Hãy dịch CÁC DÒNG VĂN BẢN sang tiếng Việt tự nhiên, phù hợp với ngữ cảnh video ngắn TikTok.
Quan trọng: Lắng nghe giọng nói trong file audio đính kèm. 
- Nếu câu nói đó do Nam phát âm, hãy chèn thêm tiền tố [M] vào trước câu dịch.
- Nếu câu nói đó do Nữ phát âm, hãy chèn thêm tiền tố [F] vào trước câu dịch.
- Nếu không nghe rõ hoặc giọng AI, mặc định chèn [F].
TUYỆT ĐỐI GIỮ NGUYÊN cấu trúc thời gian và số thứ tự của file SRT gốc.

SRT Gốc:
{content}
"""
                response = client.models.generate_content(
                    model=gemini_model,
                    contents=[prompt, audio_file]
                )
                translated_text = response.text
                
            else:
                # Dịch text thông thường (không cần nghe âm thanh) bằng Active Provider
                prompt = f"""
Bạn là chuyên gia dịch thuật tiếng Trung sang tiếng Việt.
Dưới đây là nội dung một file phụ đề định dạng SRT. Hãy dịch CÁC DÒNG VĂN BẢN sang tiếng Việt tự nhiên, phù hợp với ngữ cảnh video ngắn TikTok.
TUYỆT ĐỐI GIỮ NGUYÊN cấu trúc thời gian, chỉ báo dòng (số thứ tự) và dòng trống của file SRT gốc.
KHÔNG thêm bất kỳ ghi chú hay markdown formatting nào ở đầu hoặc cuối.

SRT Gốc:
{content}
"""
                translated_text = ""
                
                if active_provider == "gemini":
                    if not gemini_key: raise Exception("Chưa cấu hình Gemini API Key")
                    client = genai.Client(api_key=gemini_key)
                    response = client.models.generate_content(
                        model=gemini_model,
                        contents=prompt
                    )
                    translated_text = response.text
                    
                elif active_provider == "openai":
                    if not openai_key: raise Exception("Chưa cấu hình OpenAI API Key")
                    from openai import OpenAI
                    client = OpenAI(api_key=openai_key)
                    response = client.chat.completions.create(
                        model="gpt-4o-mini",
                        messages=[{"role": "user", "content": prompt}],
                        temperature=0.3
                    )
                    translated_text = response.choices[0].message.content
                    
                elif active_provider == "anthropic":
                    if not anthropic_key: raise Exception("Chưa cấu hình Anthropic API Key")
                    from anthropic import Anthropic
                    client = Anthropic(api_key=anthropic_key)
                    response = client.messages.create(
                        model="claude-3-haiku-20240307",
                        messages=[{"role": "user", "content": prompt}],
                        max_tokens=4000,
                        temperature=0.3
                    )
                    translated_text = response.content[0].text
                    
                elif active_provider == "xai":
                    if not xai_key: raise Exception("Chưa cấu hình xAI API Key")
                    from openai import OpenAI
                    client = OpenAI(api_key=xai_key, base_url="https://api.x.ai/v1")
                    response = client.chat.completions.create(
                        model="grok-beta",
                        messages=[{"role": "user", "content": prompt}],
                        temperature=0.3
                    )
                    translated_text = response.choices[0].message.content

            with open(output_srt, "w", encoding="utf-8") as f:
                f.write(translated_text.strip())
                
            return output_srt
            
        except Exception as e:
            raise Exception(f"Lỗi khi dịch phụ đề bằng AI ({active_provider}): {e}")
