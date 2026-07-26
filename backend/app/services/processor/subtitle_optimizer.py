import os
import json
import re
from dotenv import load_dotenv

ENV_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../data/.env"))

class SubtitleOptimizer:
    """
    Sử dụng LLM để chia lại câu (Semantic Segmentation) 
    và thuật toán Alignment để gán lại dấu thời gian (timestamps) cấp độ từ.
    """
    def __init__(self):
        load_dotenv(ENV_PATH, override=True)
        
    def _call_llm(self, text: str) -> str:
        """Gọi LLM (ưu tiên Active AI Provider) để chia câu."""
        from app.core.security import decrypt_data
        
        active_provider = os.getenv("ACTIVE_AI_PROVIDER", "gemini")
        gemini_key = decrypt_data(os.getenv("GEMINI_API_KEY", ""))
        openai_key = decrypt_data(os.getenv("OPENAI_API_KEY", ""))
        anthropic_key = decrypt_data(os.getenv("ANTHROPIC_API_KEY", ""))
        
        custom_ai_endpoint = os.getenv("CUSTOM_AI_ENDPOINT", "http://localhost:20128/v1")
        custom_ai_key = decrypt_data(os.getenv("CUSTOM_AI_KEY", ""))
        custom_ai_model = os.getenv("CUSTOM_AI_MODEL", "kr/claude-sonnet-4.5")
        
        if custom_ai_endpoint and custom_ai_key:
            active_provider = "custom"
            
        prompt = f"""
Bạn là một chuyên gia ngôn ngữ học và dịch giả AI.
Nhiệm vụ của bạn là xem xét đoạn văn bản sau, vốn được bóc băng từ giọng nói nên không có dấu câu và bị dính liền nhau. 
Hãy thực hiện các bước sau:
1. Chia đoạn văn bản thành các câu hoặc cụm từ có ý nghĩa hoàn chỉnh, phù hợp để làm phụ đề video ngắn (TikTok/Reels).
2. Chèn thẻ <br> vào cuối mỗi câu hoặc cụm từ bạn muốn ngắt.
3. TUYỆT ĐỐI KHÔNG thêm, bớt hoặc thay đổi bất kỳ từ ngữ nào so với bản gốc. Nhiệm vụ của bạn CHỈ là chèn <br>.
4. Không thêm bất kỳ lời giải thích nào. Chỉ trả về văn bản đã có thẻ <br>.

Văn bản gốc:
{text}
"""
        
        try:
            output = ""
            if active_provider == "custom":
                from openai import OpenAI
                client = OpenAI(api_key=custom_ai_key, base_url=custom_ai_endpoint)
                response = client.chat.completions.create(
                    model=custom_ai_model,
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.1
                )
                output = response.choices[0].message.content
                
            elif active_provider == "gemini":
                from google import genai
                client = genai.Client(api_key=gemini_key)
                response = client.models.generate_content(
                    model=os.getenv("GEMINI_MODEL", "gemini-3.5-flash"),
                    contents=prompt
                )
                output = response.text
                
            elif active_provider == "anthropic":
                from anthropic import Anthropic
                client = Anthropic(api_key=anthropic_key)
                response = client.messages.create(
                    model="claude-3-haiku-20240307",
                    messages=[{"role": "user", "content": prompt}],
                    max_tokens=4000,
                    temperature=0.1
                )
                output = response.content[0].text
                
            elif active_provider == "openai":
                from openai import OpenAI
                client = OpenAI(api_key=openai_key)
                response = client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.1
                )
                output = response.choices[0].message.content
                
            if output:
                output = re.sub(r'<thinking>.*?</thinking>', '', output, flags=re.DOTALL).strip()
            return output

                
        except Exception as e:
            print(f"[SubtitleOptimizer] LLM Segmentation failed: {e}")
            return text # Trả về bản gốc nếu lỗi

    def _align_timestamps(self, words: list, llm_output: str) -> list:
        """
        Khớp chuỗi văn bản đã chia câu (<br>) của LLM với mảng word-level timestamps,
        sử dụng mapping theo từng ký tự (character-level) để đảm bảo độ chính xác cao nhất
        đối với tiếng Trung (nơi 1 từ có thể dài 1-2 ký tự nhưng thời lượng dài).
        """
        segments = []
        raw_segments = [s.strip() for s in llm_output.split("<br>") if s.strip()]
        
        # Tạo danh sách timestamp cho từng ký tự
        char_timestamps = []
        for w_info in words:
            clean_word = re.sub(r'[^\w\s]', '', w_info["word"]).replace(" ", "")
            if len(clean_word) > 0:
                duration = w_info["end"] - w_info["start"]
                time_per_char = duration / len(clean_word)
                for i, char in enumerate(clean_word):
                    char_timestamps.append({
                        "char": char,
                        "start": w_info["start"] + i * time_per_char,
                        "end": w_info["start"] + (i + 1) * time_per_char
                    })
                    
        char_index = 0
        total_chars = len(char_timestamps)
        
        for raw_seg in raw_segments:
            clean_seg = re.sub(r'[^\w\s]', '', raw_seg).replace(" ", "")
            if not clean_seg:
                continue
                
            seg_start = -1
            seg_end = -1
            chars_to_consume = len(clean_seg)
            consumed = 0
            
            while char_index < total_chars and consumed < chars_to_consume:
                c_info = char_timestamps[char_index]
                if seg_start == -1:
                    seg_start = c_info["start"]
                seg_end = c_info["end"]
                char_index += 1
                consumed += 1
                
            if seg_start != -1 and seg_end != -1:
                segments.append({
                    "text": raw_seg.strip(),
                    "start": seg_start,
                    "end": seg_end
                })
            elif len(segments) > 0:
                # Nếu LLM thêm dư ký tự so với gốc, ta nối tiếp đoạn trước đó
                seg_start = segments[-1]["end"]
                seg_end = seg_start + 0.1
                segments.append({
                    "text": raw_seg.strip(),
                    "start": seg_start,
                    "end": seg_end
                })
                
        # Nếu LLM bỏ sót từ cuối cùng, gom hết vào đoạn cuối
        if char_index < total_chars and len(segments) > 0:
            segments[-1]["end"] = char_timestamps[-1]["end"]
            
        return segments
        
    def _format_timestamp(self, seconds: float) -> str:
        hours = int(seconds // 3600)
        minutes = int((seconds % 3600) // 60)
        secs = int(seconds % 60)
        millis = int((seconds - int(seconds)) * 1000)
        return f"{hours:02d}:{minutes:02d}:{secs:02d},{millis:03d}"

    def optimize_and_save_srt(self, words: list, output_srt_path: str, use_llm: bool = True):
        """Thực thi toàn bộ luồng optimize và lưu thành SRT."""
        if not words:
            # Fallback tạo srt rỗng
            with open(output_srt_path, "w", encoding="utf-8") as f:
                pass
            return output_srt_path
            
        segments = []
        if use_llm:
            # 1. Ghép nối thành câu dài
            full_text = " ".join([w["word"] for w in words])
            
            # 2. Gọi LLM ngắt câu
            print(f"[SubtitleOptimizer] Sending {len(full_text)} chars to LLM for semantic segmentation...")
            llm_segmented = self._call_llm(full_text)
            
            # 3. Căn chỉnh timestamps
            print("[SubtitleOptimizer] Aligning timestamps...")
            segments = self._align_timestamps(words, llm_segmented)
            
        # 4. Nếu căn chỉnh thất bại hoặc không dùng LLM, fallback dùng đoạn cứng mỗi 10 từ
        if len(segments) == 0:
            if use_llm:
                print("[SubtitleOptimizer] Alignment failed. Falling back to chunking...")
            segments = []
            chunk_size = 10
            for i in range(0, len(words), chunk_size):
                chunk = words[i:i+chunk_size]
                segments.append({
                    "text": " ".join([w["word"] for w in chunk]),
                    "start": chunk[0]["start"],
                    "end": chunk[-1]["end"]
                })
        
        # 5. Lưu ra SRT
        print(f"[SubtitleOptimizer] Saving optimized SRT with {len(segments)} lines...")
        with open(output_srt_path, "w", encoding="utf-8") as f:
            idx = 1
            for seg in segments:
                start_str = self._format_timestamp(seg["start"])
                end_str = self._format_timestamp(seg["end"])
                f.write(f"{idx}\n")
                f.write(f"{start_str} --> {end_str}\n")
                f.write(f"{seg['text']}\n\n")
                idx += 1
                
        return output_srt_path
