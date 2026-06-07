import os
import subprocess
import imageio_ffmpeg

from dotenv import load_dotenv

import shutil
system_ffmpeg = shutil.which("ffmpeg")
ffmpeg_exe = system_ffmpeg if system_ffmpeg else imageio_ffmpeg.get_ffmpeg_exe()

def hex_to_ass_color(hex_color: str, alpha: str = "00") -> str:
    hex_color = hex_color.lstrip('#')
    if len(hex_color) != 6:
        hex_color = "FFFFFF"
    r, g, b = hex_color[0:2], hex_color[2:4], hex_color[4:6]
    return f"&H{alpha}{b}{g}{r}"

def get_video_duration(video_path: str) -> float:
    try:
        import re
        cmd = [ffmpeg_exe, "-i", video_path]
        result = subprocess.run(cmd, capture_output=True, text=True)
        match = re.search(r"Duration: (\d{2}):(\d{2}):(\d{2}\.\d{2})", result.stderr)
        if match:
            h, m, s = match.groups()
            return int(h) * 3600 + int(m) * 60 + float(s)
    except Exception:
        pass
    return 0.0

class VideoEditor:
    def get_optimal_video_encoder(self, use_gpu: bool = False) -> str:
        if not use_gpu:
            return "libx264"
        
        try:
            result = subprocess.run([ffmpeg_exe, "-encoders"], capture_output=True, text=True, check=True)
            output = result.stdout.lower()
            
            # Kiểm tra NVENC (NVIDIA)
            if "h264_nvenc" in output and shutil.which("nvidia-smi"):
                return "h264_nvenc"
            
            # Kiểm tra QSV (Intel)
            if "h264_qsv" in output and os.path.exists("/dev/dri"):
                return "h264_qsv"
                
        except Exception as e:
            print(f"Lỗi khi kiểm tra encoder, tự động fallback về CPU: {e}")
            
        return "libx264"
        return "libx264"

    def burn_subtitles(self, input_video: str, srt_file: str, output_video: str, tts_audio: str = None, bg_volume: int = 10, flip_video: bool = False, subtitle_style: str = "black_white", opt_zoom: bool = False, opt_color: bool = False, opt_noise: bool = False, opt_pitch: bool = False, subtitle_text_color: str = "#000000", subtitle_bg_color: str = "#FFFFFF", subtitle_font_size: int = 18, subtitle_margin_v: int = 40, subtitle_bg_padding: int = 15, subtitle_bg_opacity: int = 100, watermark_type: str = "none", watermark_text: str = None, watermark_image_path: str = None, watermark_x: float = 50.0, watermark_y: float = 50.0, watermark_size: float = 20.0, watermark_color: str = "#FFFFFF", watermark_opacity: float = 50.0, subtitle_font_family: str = "Liberation Sans", log_callback=None):
        load_dotenv(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../data/.env")), override=True)
        use_gpu = os.getenv("USE_GPU_ACCELERATION", "False").lower() == "true"
        vcodec = self.get_optimal_video_encoder(use_gpu)
        print(f"[*] Sử dụng Video Encoder: {vcodec} (GPU={use_gpu})")

        # Escape path for FFmpeg subtitles filter on Windows
        srt_escaped = srt_file.replace('\\', '/').replace(':', '\\:')
        
        cmd = [ffmpeg_exe, "-y", "-i", input_video]
        
        # Build dynamic video filters
        vf_filters = []
        if flip_video:
            vf_filters.append("hflip")
            
        if opt_zoom:
            vf_filters.append("crop=iw/1.02:ih/1.02,scale=iw:ih")
        if opt_color:
            vf_filters.append("eq=brightness=0.02:contrast=1.05")
        if opt_noise:
            vf_filters.append("noise=alls=1:allf=t+u")
            
        # Kích thước gốc theo form UI
        # Chú ý: Subtitle dùng định dạng ASS nên tự động scale khá to
        # Nhưng Watermark (drawtext) dùng pixel thật, nên bắt buộc phải scale x3 để nhìn thấy trên video 1080p
        real_sub_size = int(float(subtitle_font_size))
        real_watermark_size = int(float(watermark_size) * 3)
        real_margin_v = int(float(subtitle_margin_v))
        real_bg_padding = int(float(subtitle_bg_padding))
        
        # Sử dụng các tham số tùy chỉnh thay vì preset
        primary_color = hex_to_ass_color(subtitle_text_color, "00")
        
        # Calculate alpha from opacity (100 -> 00, 0 -> FF)
        alpha_val = int((100 - subtitle_bg_opacity) * 255 / 100)
        alpha_hex = f"{alpha_val:02X}"
        back_color = hex_to_ass_color(subtitle_bg_color, alpha_hex)
        
        # BorderStyle=1 + Outline lớn = Hiệu ứng nền lượn sóng (wavy background) giống bản cũ
        style = f"Fontname={subtitle_font_family},Fontsize={real_sub_size},PrimaryColour={primary_color},OutlineColour={back_color},BackColour={back_color},BorderStyle=1,Outline={real_bg_padding},Shadow=0,Alignment=2,MarginV={real_margin_v}"
            
        vf_filters.append(f"subtitles='{srt_escaped}':force_style='{style}'")
        
        # Add watermark filter if applicable
        if watermark_type == "text" and watermark_text:
            text_color = watermark_color.replace('#', '0x')
            opacity_val = watermark_opacity / 100.0
            
            # Default fallback for Linux/Docker
            font_path = "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf"
            
            # If a custom font is selected, try to find its file in data/fonts
            fonts_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../data/fonts"))
            if subtitle_font_family != "Liberation Sans" and os.path.exists(fonts_dir):
                for f in os.listdir(fonts_dir):
                    if os.path.splitext(f)[0] == subtitle_font_family:
                        font_path = os.path.join(fonts_dir, f).replace("\\", "/")
                        break
            
            # Write watermark text to a temp file to avoid all FFmpeg quoting/escaping hell
            import uuid
            wm_file = f"/tmp/wm_{uuid.uuid4().hex}.txt"
            with open(wm_file, "w", encoding="utf-8") as f:
                f.write(watermark_text)
                
            drawtext_filter = f"drawtext=fontfile='{font_path}':textfile='{wm_file}':fontcolor={text_color}@{opacity_val}:fontsize={real_watermark_size}:x=(w-text_w)*{watermark_x}/100:y=(h-text_h)*{watermark_y}/100"
            print(f"DEBUG DRAWTEXT FILTER: {drawtext_filter}")
            vf_filters.append(drawtext_filter)
            
        vf_str = ",".join(vf_filters)
        print(f"DEBUG VF_STR: {vf_str}")
        
        wm_idx = -1
        if watermark_type == "image" and watermark_image_path and os.path.exists(watermark_image_path):
            cmd.extend(["-i", watermark_image_path])
            wm_idx = 1
            opacity_val = watermark_opacity / 100.0
            v_filter_complex = f"[0:v]{vf_str}[vbase];[{wm_idx}:v]format=rgba,colorchannelmixer=aa={opacity_val},scale=iw*{watermark_size}/100:-1[wm];[vbase][wm]overlay=x=(W-w)*{watermark_x}/100:y=(H-h)*{watermark_y}/100[vout]"
        else:
            v_filter_complex = f"[0:v]{vf_str}[vout]"
            
        tts_idx = -1
        if tts_audio and os.path.exists(tts_audio):
            cmd.extend(["-i", tts_audio])
            tts_idx = 2 if wm_idx != -1 else 1

        filter_complex_str = v_filter_complex
        a_map = "0:a?"
        v_map = "[vout]"
        
        if tts_idx != -1:
            bg_vol_float = bg_volume / 100.0
            if opt_pitch:
                audio_filter = f"[0:a]volume={bg_vol_float},asetrate=44100*1.02,atempo=1/1.02[bg];[{tts_idx}:a]volume=1.0[tts];[bg][tts]amix=inputs=2:duration=first:dropout_transition=2[aout]"
            else:
                audio_filter = f"[0:a]volume={bg_vol_float}[bg];[{tts_idx}:a]volume=1.0[tts];[bg][tts]amix=inputs=2:duration=first:dropout_transition=2[aout]"
            
            filter_complex_str += ";" + audio_filter
            a_map = "[aout]"
        else:
            if opt_pitch:
                audio_filter = f"[0:a]asetrate=44100*1.02,atempo=1/1.02[aout]"
                filter_complex_str += ";" + audio_filter
                a_map = "[aout]"

        cmd.extend([
            "-filter_complex", filter_complex_str,
            "-map", v_map,
            "-map", a_map,
            "-c:v", vcodec,
            "-crf", "28",
            "-preset", "faster",
            "-pix_fmt", "yuv420p"
        ])
        
        if tts_idx != -1 or opt_pitch:
            cmd.extend([
                "-c:a", "aac",
                "-b:a", "128k"
            ])
        else:
            cmd.extend(["-c:a", "copy"])
            
        cmd.append(output_video)
        
        total_duration = get_video_duration(input_video)
        
        try:
            import re
            process = subprocess.Popen(cmd, stderr=subprocess.PIPE, universal_newlines=True, encoding='utf-8', errors='replace')
            for line in process.stderr:
                if log_callback and total_duration > 0:
                    match = re.search(r"time=(\d{2}):(\d{2}):(\d{2}\.\d{2})", line)
                    if match:
                        h, m, s = match.groups()
                        current_sec = int(h) * 3600 + int(m) * 60 + float(s)
                        percent = 40.0 + (current_sec / total_duration) * 50.0
                        percent = min(90.0, max(40.0, percent))
                        log_callback(f"[*] Đang Render... {current_sec:.1f}s / {total_duration:.1f}s\n", progress=round(percent, 1))
            
            process.wait()
            if process.returncode != 0:
                raise Exception(f"FFmpeg exited with code {process.returncode}")
            return output_video
        except Exception as e:
            raise Exception(f"Lỗi FFmpeg khi burn sub: {e}")
