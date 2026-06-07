import os
import json
import time
import re
import requests
import uuid
import subprocess
import shutil
from app.core.config import DATA_DIR
import asyncio
from typing import List, Dict, Any
from dotenv import load_dotenv
from google import genai

from app.services.processor.tts_generator import TTSGenerator
from app.services.processor.video_editor import VideoEditor, get_video_duration

ENV_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../data/.env"))

class FacelessEngine:
    def __init__(self):
        load_dotenv(ENV_PATH, override=True)
        from app.core.security import decrypt_data
        
        self.gemini_key = decrypt_data(os.getenv("GEMINI_API_KEY", ""))
        self.gemini_model = os.getenv("GEMINI_MODEL", "gemini-3.5-flash")
        
    def generate_script(self, prompt: str, style: str) -> List[Dict[str, Any]]:
        """
        Dùng Gemini sinh kịch bản JSON từ Prompt
        """
        if not self.gemini_key:
            raise Exception("Vui lòng cấu hình Gemini API Key trong phần Cài đặt hệ thống.")
            
        client = genai.Client(api_key=self.gemini_key)
        
        sys_prompt = f"""
        Bạn là một đạo diễn và biên kịch video ngắn tài năng trên TikTok.
        Dựa vào ý tưởng: "{prompt}" và Phong cách: "{style}".
        Hãy viết một kịch bản hoàn chỉnh cho video dọc (9:16) độ dài khoảng 30-60 giây.
        Đầu ra phải TUYỆT ĐỐI TUÂN THỦ ĐỊNH DẠNG JSON MẢNG (Array of Objects). KHÔNG TRẢ VỀ BẤT CỨ VĂN BẢN NÀO KHÁC NGOÀI JSON.
        
        Cấu trúc mỗi object trong JSON:
        {{
            "scene": 1, 
            "keyword": "từ khóa tiếng Anh dùng để tìm video nền trên Pexels, tối đa 2 từ ngắn gọn (vd: 'night city', 'sad man', 'money', 'ocean')", 
            "text": "Câu thoại tiếng Việt mà AI sẽ đọc, ngắn gọn, cảm xúc, không quá 15 từ mỗi phân cảnh."
        }}
        
        Lưu ý: 
        - Số lượng scene (phân cảnh) từ 4 đến 8 cảnh.
        - Text phải tự nhiên, cuốn hút.
        """
        
        response = client.models.generate_content(
            model=self.gemini_model,
            contents=sys_prompt
        )
        
        raw_text = response.text
        
        # Parse JSON
        try:
            # Lọc bỏ ```json nếu có
            json_str = re.sub(r'```json\n|\n```|```', '', raw_text).strip()
            scenes = json.loads(json_str)
            return scenes
        except Exception as e:
            raise Exception(f"Lỗi khi xử lý JSON từ AI: {e}. Raw response: {raw_text[:200]}")

    def _download_pexels_video(self, keyword: str, api_key: str, output_path: str) -> str:
        """Helper tải video từ Pexels API"""
        if not api_key:
            raise Exception("Thiếu Pexels API Key")
            
        headers = {"Authorization": api_key}
        url = f"https://api.pexels.com/videos/search?query={keyword}&orientation=portrait&size=medium&per_page=5"
        
        response = requests.get(url, headers=headers)
        if response.status_code != 200:
            raise Exception(f"Lỗi Pexels API: {response.text}")
            
        data = response.json()
        if not data.get("videos"):
            # Thử lại không giới hạn orientation
            url_retry = f"https://api.pexels.com/videos/search?query={keyword}&per_page=5"
            response = requests.get(url_retry, headers=headers)
            data = response.json()
            if not data.get("videos"):
                raise Exception(f"Không tìm thấy video stock nào cho từ khoá: {keyword}")
                
        # Lấy video đầu tiên
        video = data["videos"][0]
        # Tìm link HD (hoặc medium)
        video_files = video.get("video_files", [])
        if not video_files:
            raise Exception(f"Video từ Pexels không có file MP4: {keyword}")
            
        # Lấy file MP4 chất lượng tốt nhất
        video_files.sort(key=lambda x: (x.get('width', 0) * x.get('height', 0)), reverse=True)
        target_file = video_files[0]
        for vf in video_files:
            if vf.get("quality") == "hd" and vf.get("width", 0) <= 1080:
                target_file = vf
                break
                
        download_link = target_file["link"]
        
        # Tải file
        r = requests.get(download_link, stream=True)
        if r.status_code == 200:
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            with open(output_path, 'wb') as f:
                for chunk in r.iter_content(chunk_size=1024 * 1024):
                    if chunk:
                        f.write(chunk)
            return output_path
        else:
            raise Exception(f"Không thể tải file video từ Pexels: HTTP {r.status_code}")

    def render_video(self, task, data: Dict[str, Any]):
        """
        Thực thi toàn bộ luồng Render (chạy trong Celery)
        """
        # Các bước xử lý thực tế sẽ được thêm vào ở bản update sau
        # Hiện tại giả lập luồng chạy
        scenes = data.get("scenes", [])
        total_scenes = len(scenes)
        
        pexels_key = data.get("pexels_key")
        session_id = str(uuid.uuid4())[:8]
        # 2. Tạo thư mục làm việc tạm thời
        work_dir = os.path.join(DATA_DIR, "faceless", session_id)
        os.makedirs(work_dir, exist_ok=True)
        
        tts_gen = TTSGenerator()
        video_editor = VideoEditor()
        
        # Để lưu thông tin ghép file
        video_list_txt = f"{work_dir}/videos.txt"
        audio_list_txt = f"{work_dir}/audios.txt"
        srt_path = f"{work_dir}/subtitles.srt"
        
        valid_scenes = []
        current_time_ms = 0
        
        # Import thư viện xử lý srt
        try:
            import pysrt
            srt_file = pysrt.SubRipFile()
        except ImportError:
            pass # Handle fallback later if needed
            
        for i, scene in enumerate(scenes):
            keyword = scene.get("keyword", "")
            text = scene.get("text", "")
            if not text: continue
            
            # Bước 1: Gọi Pexels API tải video
            if task: task.update_state(state='PROGRESS', meta={'progress': 10 + int((i/total_scenes)*15), 'message': f'Đang tải cảnh {i+1}: {keyword}'})
            
            raw_video = f"{work_dir}/raw_scene_{i}.mp4"
            cut_video = f"{work_dir}/scene_{i}.mp4"
            audio_path = f"{work_dir}/scene_{i}.mp3"
            
            try:
                # Tải video từ Pexels
                self._download_pexels_video(keyword, pexels_key, raw_video)
                
                # Bước 2: Sinh Audio (TTS)
                if task: task.update_state(state='PROGRESS', meta={'progress': 25 + int((i/total_scenes)*15), 'message': f'Đang thu âm cảnh {i+1}'})
                voice = data.get("tts_voice", "edge_hoaimy")
                
                # Edge TTS mapping
                voice_id = "vi-VN-HoaiMyNeural"
                if "namminh" in voice.lower(): voice_id = "vi-VN-NamMinhNeural"
                asyncio.run(tts_gen._generate_edge_audio(text, voice_id, audio_path))
                
                # Tính độ dài audio để cắt video
                audio_dur = get_video_duration(audio_path)
                if audio_dur < 1.0: audio_dur = 2.0 # Đảm bảo tối thiểu 2 giây
                
                # Cắt video cho khớp độ dài Audio (bỏ qua âm thanh gốc)
                cmd_cut = [
                    "ffmpeg", "-y", "-i", raw_video, 
                    "-t", str(audio_dur), 
                    "-an", # Xóa audio gốc của stock
                    "-c:v", "libx264", "-crf", "23", "-preset", "fast",
                    cut_video
                ]
                subprocess.run(cmd_cut, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                
                # Thêm vào file concat
                valid_scenes.append((cut_video, audio_path, text, audio_dur))
                
                # Tạo Subtitle item
                start_s = current_time_ms / 1000.0
                end_s = start_s + audio_dur
                
                sub = pysrt.SubRipItem(
                    index=i+1,
                    start=pysrt.SubRipTime(seconds=start_s),
                    end=pysrt.SubRipTime(seconds=end_s),
                    text=text
                )
                srt_file.append(sub)
                
                current_time_ms += int(audio_dur * 1000)
                
            except Exception as e:
                if task: task.update_state(state='PROGRESS', meta={'progress': 10 + int((i/total_scenes)*30), 'message': f'Lỗi cảnh {i+1} ({keyword}): {e}'})
                import time; time.sleep(2)
                continue
                
        if not valid_scenes:
            raise Exception("Không thể xử lý bất kỳ phân cảnh nào. Vui lòng thử lại.")
            
        # Lưu file srt
        srt_file.save(srt_path, encoding='utf-8')
            
        # Tạo file danh sách concat
        with open(video_list_txt, "w") as vf, open(audio_list_txt, "w") as af:
            for v, a, t, d in valid_scenes:
                vf.write(f"file '{os.path.abspath(v).replace(chr(92), '/')}'\n")
                af.write(f"file '{os.path.abspath(a).replace(chr(92), '/')}'\n")
                
        # Bước 3: FFMpeg Stitching (Ghép Video và Audio)
        if task: task.update_state(state='PROGRESS', meta={'progress': 70, 'message': 'Đang ghép các phân cảnh (Stitching)...'})
        merged_video = f"{work_dir}/merged_video.mp4"
        merged_audio = f"{work_dir}/merged_audio.mp3"
        
        # Nối video
        subprocess.run(["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", video_list_txt, "-c", "copy", merged_video], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        # Nối audio
        subprocess.run(["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", audio_list_txt, "-c", "copy", merged_audio], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        
        # Bước 4: Add BGM & Subtitle
        if task: task.update_state(state='PROGRESS', meta={'progress': 85, 'message': 'Đang lồng ghép Nhạc nền và Phụ đề...'})
        
        final_video = os.path.join(DATA_DIR, "faceless", f"final_{session_id}.mp4")
        
        # Dùng video_editor để xử lý phụ đề và bgm
        bgm_path = data.get("bgm_path")
        if bgm_path and not os.path.exists(bgm_path):
            bgm_path = None
            
        # Tạo file audio tổng gồm bgm và tts nếu có bgm
        if bgm_path:
            mixed_audio = f"{work_dir}/mixed_audio.mp3"
            cmd_mix = [
                "ffmpeg", "-y", 
                "-i", bgm_path, 
                "-i", merged_audio, 
                "-filter_complex", "[0:a]volume=0.2[bg];[1:a]volume=1.0[tts];[bg][tts]amix=inputs=2:duration=first:dropout_transition=2[aout]",
                "-map", "[aout]", 
                mixed_audio
            ]
            subprocess.run(cmd_mix, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            final_audio_to_mux = mixed_audio
        else:
            final_audio_to_mux = merged_audio
            
        # Mux video không âm thanh với âm thanh đã ghép và burn sub
        muxed_video = f"{work_dir}/muxed_video.mp4"
        cmd_mux = [
            "ffmpeg", "-y",
            "-i", merged_video,
            "-i", final_audio_to_mux,
            "-c:v", "copy",
            "-c:a", "aac",
            muxed_video
        ]
        subprocess.run(cmd_mux, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        
        # Burn Subtitle
        video_editor.burn_subtitles(
            input_video=muxed_video,
            srt_file=srt_path,
            output_video=final_video,
            subtitle_font_size=24,
            subtitle_margin_v=80
        )
        
        # Xoá folder tạm
        try:
            shutil.rmtree(work_dir)
        except:
            pass
        
        if task: task.update_state(state='PROGRESS', meta={'progress': 100, 'message': 'Hoàn thành!'})
        return {"video_path": final_video, "duration": current_time_ms / 1000.0}
