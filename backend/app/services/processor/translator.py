import os
import re
from google import genai
from dotenv import load_dotenv

ENV_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../data/.env"))

class Translator:
    def __init__(self):
        pass

    def _google_translate_text(self, text: str, from_lang: str = "auto", to_lang: str = "vi") -> str:
        import requests
        url = "https://translate.googleapis.com/translate_a/single"
        params = {
            "client": "gtx",
            "sl": from_lang,
            "tl": to_lang,
            "dt": "t",
        }
        response = requests.post(url, params=params, data={"q": text}, timeout=10)
        if response.status_code == 200:
            data = response.json()
            translated = "".join([sentence[0] for sentence in data[0] if sentence[0]])
            return translated
        else:
            raise Exception(f"Google Translate API trả về mã trạng thái {response.status_code}")

    def _translate_srt_fallback_google(self, input_srt: str, output_srt: str, voice_mode: str = "none"):
        import pysrt
        subs = pysrt.open(input_srt, encoding='utf-8')
        for sub in subs:
            text = sub.text.strip()
            if not text:
                continue
            
            translated = self._google_translate_text(text, from_lang="auto", to_lang="vi")
            
            if voice_mode == "edge_auto":
                sub.text = f"[F] {translated}"
            else:
                sub.text = translated
                
        subs.save(output_srt, encoding='utf-8')

    def translate_srt(self, input_srt: str, output_srt: str, voice_mode: str = "none", audio_path: str = None, on_chunk_translated=None):
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
            import pysrt
            subs = pysrt.from_string(content)
            
            # Khởi tạo Gemini Audio nếu cần
            audio_file = None
            if audio_path and voice_mode == "edge_auto":
                if not gemini_key:
                    raise Exception("Tính năng Phân vai Nam/Nữ qua âm thanh yêu cầu phải cấu hình Gemini API Key.")
                client = genai.Client(api_key=gemini_key)
                audio_file = client.files.upload(file=audio_path)

            translated_full_text = ""
            chunk_size = 40 # Dịch từng khối 40 dòng để tránh AI bị cắt xén (truncate) với video dài

            for i in range(0, len(subs), chunk_size):
                chunk_subs = subs[i:i+chunk_size]
                chunk_content = ""
                for sub in chunk_subs:
                    chunk_content += f"{sub.index}\n{sub.start} --> {sub.end}\n{sub.text}\n\n"
                
                # Phân luồng đặc biệt: Nếu cần nghe Audio (edge_auto), LUÔN LUÔN dùng Gemini
                if audio_path and voice_mode == "edge_auto":
                    prompt = f"""
Bạn là chuyên gia dịch thuật tiếng Trung sang tiếng Việt.
Dưới đây là một phần nội dung file phụ đề định dạng SRT (Từ dòng {chunk_subs[0].index} đến {chunk_subs[-1].index}). Hãy dịch CÁC DÒNG VĂN BẢN sang tiếng Việt tự nhiên, phù hợp ngữ cảnh TikTok.
Quan trọng: Lắng nghe giọng nói trong file audio đính kèm.
- Nếu câu nói đó do Nam phát âm, hãy chèn thêm tiền tố [M] vào trước câu dịch.
- Nếu câu nói đó do Nữ phát âm, hãy chèn thêm tiền tố [F] vào trước câu dịch.
- Nếu không nghe rõ hoặc giọng AI, mặc định chèn [F].
TUYỆT ĐỐI GIỮ NGUYÊN cấu trúc thời gian và số thứ tự của file SRT gốc.

SRT Gốc (Phần {i//chunk_size + 1}):
{chunk_content}
"""
                    client = genai.Client(api_key=gemini_key)
                    response = client.models.generate_content(
                        model=gemini_model,
                        contents=[prompt, audio_file]
                    )
                    translated_text = response.text
                    
                else:
                    # Dịch text thông thường (không cần nghe âm thanh) bằng Active Provider
                    prompt = f"""
Bạn là chuyên gia dịch thuật tiếng Trung sang tiếng Việt.
Dưới đây là một phần nội dung file phụ đề định dạng SRT (Từ dòng {chunk_subs[0].index} đến {chunk_subs[-1].index}). Hãy dịch CÁC DÒNG VĂN BẢN sang tiếng Việt tự nhiên, phù hợp với ngữ cảnh video ngắn TikTok.
TUYỆT ĐỐI GIỮ NGUYÊN cấu trúc thời gian, chỉ báo dòng (số thứ tự) và dòng trống của file SRT gốc.
KHÔNG thêm bất kỳ ghi chú hay markdown formatting nào ở đầu hoặc cuối.

SRT Gốc (Phần {i//chunk_size + 1}):
{chunk_content}
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

                if not translated_text or not translated_text.strip():
                    raise Exception("Phản hồi dịch thuật từ AI bị rỗng hoặc không hợp lệ (Empty response)")

                # Sanitize: Strip markdown code fences and AI preamble/postscript
                cleaned = translated_text.strip()
                fence_match = re.search(r'```(?:srt)?\s*\n(.*?)\n\s*```', cleaned, re.DOTALL)
                if fence_match:
                    cleaned = fence_match.group(1).strip()
                else:
                    first_index = re.search(r'^(\d+)\s*\n\d{2}:\d{2}:\d{2}', cleaned, re.MULTILINE)
                    if first_index:
                        cleaned = cleaned[first_index.start():].strip()
                        
                translated_full_text += cleaned + "\n\n"
                
                if on_chunk_translated:
                    on_chunk_translated(cleaned)

            with open(output_srt, "w", encoding="utf-8") as f:
                f.write(translated_full_text.strip())
                
            return output_srt
            
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"Lỗi dịch thuật bằng AI ({active_provider}): {e}. Đang chuyển sang phương thức dự phòng Google Translate...")
            
            try:
                self._translate_srt_fallback_google(input_srt, output_srt, voice_mode)
                logger.info(f"Đã dịch phụ đề thành công bằng Google Translate dự phòng cho {output_srt}")
                return output_srt
            except Exception as google_err:
                raise Exception(f"Lỗi dịch thuật bằng AI ({e}) và Google Translate dự phòng cũng thất bại: {google_err}")
