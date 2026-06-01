import os
import google.generativeai as genai
from dotenv import load_dotenv

ENV_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../.env"))

class Translator:
    def __init__(self):
        self.model = genai.GenerativeModel('gemini-3.5-flash')
        
    def translate_srt(self, input_srt: str, output_srt: str, voice_mode: str = "none", audio_path: str = None):
        load_dotenv(ENV_PATH, override=True)
        from app.core.security import decrypt_data
        api_key = decrypt_data(os.getenv("GEMINI_API_KEY", ""))
        
        if not api_key or api_key == "YOUR_GEMINI_API_KEY_HERE":
            raise Exception(f"Lỗi: Chưa cấu hình GEMINI_API_KEY (Đường dẫn đọc: {ENV_PATH})")
            
        genai.configure(api_key=api_key)

        with open(input_srt, "r", encoding="utf-8") as f:
            content = f.read()
            
        try:
            if audio_path and voice_mode == "edge_auto":
                audio_file = genai.upload_file(path=audio_path)
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
                response = self.model.generate_content([prompt, audio_file])
            else:
                prompt = f"""
Bạn là chuyên gia dịch thuật tiếng Trung sang tiếng Việt.
Dưới đây là nội dung một file phụ đề định dạng SRT. Hãy dịch CÁC DÒNG VĂN BẢN sang tiếng Việt tự nhiên, phù hợp với ngữ cảnh video ngắn TikTok.
TUYỆT ĐỐI GIỮ NGUYÊN cấu trúc thời gian, chỉ báo dòng (số thứ tự) và dòng trống của file SRT gốc.
KHÔNG thêm bất kỳ ghi chú hay markdown formatting nào ở đầu hoặc cuối.

SRT Gốc:
{content}
"""
                response = self.model.generate_content(prompt)

            translated_text = response.text
            
            with open(output_srt, "w", encoding="utf-8") as f:
                f.write(translated_text.strip())
                
            return output_srt
        except Exception as e:
            raise Exception(f"Lỗi khi dịch bằng Gemini: {e}")
