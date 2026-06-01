import os
import re
import pysrt
import asyncio
from pydub import AudioSegment
import edge_tts
import requests
import json
from app.core.security import decrypt_data
from dotenv import load_dotenv
import imageio_ffmpeg

# Chỉ định đường dẫn FFmpeg cho pydub để tránh lỗi WinError 2
AudioSegment.converter = imageio_ffmpeg.get_ffmpeg_exe()

ENV_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../.env"))

class TTSGenerator:
    def __init__(self):
        pass
        
    def _get_fpt_audio(self, text: str, voice: str) -> str:
        load_dotenv(ENV_PATH, override=True)
        api_key = decrypt_data(os.getenv("FPT_AI_API_KEY", ""))
        if not api_key:
            raise Exception("Lỗi: FPT_AI_API_KEY chưa được cấu hình!")
            
        url = "https://api.fpt.ai/hmi/tts/v5"
        payload = text.encode('utf-8')
        headers = {
            'api-key': api_key,
            'voice': voice,
            'speed': '',
            'format': 'mp3'
        }
        
        response = requests.post(url, data=payload, headers=headers)
        if response.status_code == 200:
            result = response.json()
            if "async" in result:
                audio_url = result["async"]
                import time
                for _ in range(10): # polling for 10 seconds
                    time.sleep(1)
                    audio_res = requests.get(audio_url)
                    if audio_res.status_code == 200:
                        import tempfile
                        tmp_path = os.path.join(tempfile.gettempdir(), f"fpt_{int(time.time())}.mp3")
                        with open(tmp_path, "wb") as f:
                            f.write(audio_res.content)
                        return tmp_path
            raise Exception("FPT API không trả về audio_url hợp lệ")
        else:
            raise Exception(f"Lỗi FPT API: {response.text}")

    async def _generate_edge_audio(self, text: str, voice: str, output_path: str, rate: str = "+0%"):
        max_retries = 5
        for attempt in range(max_retries):
            try:
                communicate = edge_tts.Communicate(text, voice, rate=rate)
                await communicate.save(output_path)
                return
            except Exception as e:
                if attempt < max_retries - 1:
                    await asyncio.sleep(2 + attempt * 2) # Nghỉ 2s, 4s, 6s... tránh bị Microsoft block IP
                    continue
                raise e

    def generate_tts_track(self, srt_path: str, output_audio_path: str, voice_mode: str, video_path: str, log_callback):
        subs = pysrt.open(srt_path, encoding='utf-8')
        
        import subprocess
        # Lấy duration bằng ffmpeg_exe để tránh phụ thuộc ffprobe
        ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
        cmd = [ffmpeg_exe, "-i", video_path]
        result = subprocess.run(cmd, capture_output=True, text=True)
        # Parse Duration: 00:00:15.12
        import re
        match = re.search(r"Duration:\s*(\d+):(\d+):(\d+\.\d+)", result.stderr)
        total_duration_ms = 60000
        if match:
            h, m, s = match.groups()
            total_duration_ms = int((float(h) * 3600 + float(m) * 60 + float(s)) * 1000)
            
        base_audio = AudioSegment.silent(duration=total_duration_ms)
        
        import tempfile
        tmp_dir = tempfile.gettempdir()
        
        for i, sub in enumerate(subs):
            text = sub.text.replace('\n', ' ').strip()
            
            # Detect [M] or [F] tag
            tag = None
            if text.startswith("[M]"):
                tag = "M"
                text = text[3:].strip()
            elif text.startswith("[F]"):
                tag = "F"
                text = text[3:].strip()
                
            # Cập nhật lại text vào srt để video_editor không hiển thị chữ [M] [F] lên màn hình
            sub.text = text 
            
            if not text:
                continue
                
            # Tạo chuỗi sạch để đọc TTS (loại bỏ ký tự đặc biệt làm hỏng SSML)
            tts_text = re.sub(r'[<>\*\[\]\~_\|\^\-\+]', ' ', text).strip()
                
            # Kiểm tra nếu text chỉ toàn dấu câu thì bỏ qua (tránh lỗi No audio was received)
            if not re.search(r'[a-zA-Z0-9\u00C0-\u1EF9]', tts_text):
                continue
                
            # Xác định giọng đọc dựa trên voice_mode
            voice_to_use = None
            is_fpt = False
            
            if voice_mode == "edge_auto":
                voice_to_use = "vi-VN-NamMinhNeural" if tag == "M" else "vi-VN-HoaiMyNeural"
            elif voice_mode == "edge_hoaimy":
                voice_to_use = "vi-VN-HoaiMyNeural"
            elif voice_mode == "edge_namminh":
                voice_to_use = "vi-VN-NamMinhNeural"
            elif voice_mode == "fpt_banmai":
                voice_to_use = "banmai"
                is_fpt = True
            elif voice_mode == "fpt_minhquang":
                voice_to_use = "minhquang"
                is_fpt = True
            elif voice_mode == "fpt_thuminh":
                voice_to_use = "thuminh"
                is_fpt = True
            else:
                voice_to_use = "vi-VN-HoaiMyNeural" # default
                
            start_ms = (sub.start.hours * 3600 + sub.start.minutes * 60 + sub.start.seconds) * 1000 + sub.start.milliseconds
            end_ms = (sub.end.hours * 3600 + sub.end.minutes * 60 + sub.end.seconds) * 1000 + sub.end.milliseconds
            duration_ms = max(end_ms - start_ms, 100) # Đảm bảo > 0
            
            # Tính toán Characters Per Second (CPS) để điều chỉnh tốc độ nói (tạo điểm nhấn)
            cps = len(tts_text) / (duration_ms / 1000.0)
            if cps > 20:
                rate = "+25%"
            elif cps > 16:
                rate = "+15%"
            elif cps > 13:
                rate = "+5%"
            elif cps < 7:
                rate = "-10%"
            else:
                rate = "+0%"
            
            clip_path = os.path.join(tmp_dir, f"clip_{i}.mp3")
            clip_wav_path = os.path.join(tmp_dir, f"clip_{i}.wav")
            
            try:
                if is_fpt:
                    clip_path = self._get_fpt_audio(tts_text, voice_to_use)
                else:
                    asyncio.run(self._generate_edge_audio(tts_text, voice_to_use, clip_path, rate=rate))
                    
                import time
                time.sleep(0.5) # Nghỉ 0.5s giữa các request để tránh bị Microsoft Rate Limit
                    
                # Convert MP3 to WAV using FFmpeg to avoid Pydub needing ffprobe
                subprocess.run([
                    imageio_ffmpeg.get_ffmpeg_exe(), "-y", "-i", clip_path, clip_wav_path
                ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
                
                clip_audio = AudioSegment.from_wav(clip_wav_path)
                
                # Overlay audio clip at exact start time
                base_audio = base_audio.overlay(clip_audio, position=start_ms)
                
                # Xoá file tạm
                if os.path.exists(clip_path):
                    os.remove(clip_path)
                if os.path.exists(clip_wav_path):
                    os.remove(clip_wav_path)
            except Exception as e:
                log_callback(f"[!] Lỗi tạo audio cho dòng {i} ('{text}'): {e}\n")
        
        # Save clean srt
        subs.save(srt_path, encoding='utf-8')
        
        base_audio.export(output_audio_path, format="mp3")
        return output_audio_path
