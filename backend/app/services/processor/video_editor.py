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

def get_video_resolution(video_path: str) -> tuple[int, int]:
    try:
        import re
        cmd = [ffmpeg_exe, "-i", video_path]
        result = subprocess.run(cmd, capture_output=True, text=True)
        match = re.search(r", (\d{3,5})x(\d{3,5})\b", result.stderr)
        if match:
            w, h = match.groups()
            return int(w), int(h)
    except Exception:
        pass
    return 1920, 1080

def get_safe_boxblur_params(crop_w: float, crop_h: float, target_radius: int) -> str:
    # yuv420p chroma dimensions are half of luma
    chroma_w = crop_w / 2.0
    chroma_h = crop_h / 2.0
    
    # FFmpeg boxblur radius constraint for luma: must be >= 0 and <= (luma_dim + 1)/2
    # To be safe: luma_radius <= (luma_dim - 1)/2
    max_luma_r = int((min(crop_w, crop_h) - 1) / 2)
    luma_r = min(target_radius, max_luma_r)
    if luma_r < 1:
        luma_r = 1
        
    # boxblur radius constraint for chroma: must be >= 0 and <= (chroma_dim + 1)/2
    # To be safe: chroma_radius <= (chroma_dim - 1)/2
    max_chroma_r = int((min(chroma_w, chroma_h) - 1) / 2)
    chroma_r = min(luma_r, max_chroma_r)
    if chroma_r < 1:
        chroma_r = 1
        
    return f"{luma_r}:5:{chroma_r}:5"

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

    def burn_subtitles(self, input_video: str, srt_file: str, output_video: str, tts_audio: str = None, bg_volume: int = 10, flip_video: bool = False, subtitle_style: str = "black_white", opt_zoom: bool = False, opt_color: bool = False, opt_noise: bool = False, opt_pitch: bool = False, subtitle_text_color: str = "#000000", subtitle_bg_color: str = "#FFFFFF", subtitle_font_size: int = 8, subtitle_margin_v: int = 40, subtitle_bg_padding: int = 2, subtitle_bg_opacity: int = 100, watermark_type: str = "none", watermark_text: str = None, watermark_image_path: str = None, watermark_x: float = 50.0, watermark_y: float = 50.0, watermark_size: float = 20.0, watermark_color: str = "#FFFFFF", watermark_opacity: float = 50.0, subtitle_font_family: str = "Liberation Sans", enable_subtitles: bool = True, mask_enabled: bool = False, mask_x: float = 10.0, mask_y: float = 10.0, mask_width: float = 20.0, mask_height: float = 15.0, mask_type: str = "color", mask_color: str = "#000000", masks: list = None, log_callback=None, force_cpu: bool = False):
        load_dotenv(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../data/.env")), override=True)
        use_gpu = os.getenv("USE_GPU_ACCELERATION", "False").lower() == "true" and not force_cpu
        vcodec = self.get_optimal_video_encoder(use_gpu)
        print(f"[*] Sử dụng Video Encoder: {vcodec} (GPU={use_gpu})")

        cmd = [ffmpeg_exe, "-y", "-i", input_video]
        input_count = 1
        video_w, video_h = get_video_resolution(input_video)
        
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
            
        # Scale subtitle size, padding, and position dynamically based on video height relative to preview reference (540px height)
        scale_factor = video_h / 540.0
        real_sub_size = max(1, int(float(subtitle_font_size) * scale_factor))
        real_watermark_size = int(float(watermark_size) * 3)
        real_margin_v = int(video_h * float(subtitle_margin_v) / 100.0)
        real_bg_padding = max(0, int(float(subtitle_bg_padding) * scale_factor))
        
        subs_input_idx = -1
        if enable_subtitles and srt_file:
            from app.services.processor.subtitle_renderer import SubtitleRenderer
            import tempfile
            
            # Use /tmp directly on Linux (Docker), but fallback to system temp on Windows
            subs_dir = tempfile.mkdtemp(prefix="subs_")
            
            renderer = SubtitleRenderer(
                video_width=video_w,
                video_height=video_h,
                font_family=subtitle_font_family,
                font_size=subtitle_font_size,
                text_color=subtitle_text_color,
                bg_color=subtitle_bg_color,
                bg_opacity=subtitle_bg_opacity,
                margin_v=subtitle_margin_v,
                bg_padding=subtitle_bg_padding,
                style=subtitle_style
            )
            
            concat_file = renderer.generate_subtitle_sequence(srt_file, subs_dir)
            
            # Format path for FFmpeg on Windows if needed
            concat_escaped = concat_file.replace('\\', '/')
            
            cmd.extend(["-f", "concat", "-safe", "0", "-i", concat_escaped])
            subs_input_idx = input_count
            input_count += 1
        
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
            
        pre_filter = ""
        input_label = "[0:v]"
        
        if mask_enabled:
            # Fallback for compatibility if masks list is empty or None
            local_masks = masks
            if not local_masks:
                local_masks = [{
                    "x": mask_x,
                    "y": mask_y,
                    "width": mask_width,
                    "height": mask_height,
                    "type": mask_type,
                    "color": mask_color
                }]

            current_in = "[0:v]"
            filter_parts = []
            for i, mask in enumerate(local_masks):
                m_x = mask.get("x", 10.0) if isinstance(mask, dict) else getattr(mask, "x", 10.0)
                m_y = mask.get("y", 10.0) if isinstance(mask, dict) else getattr(mask, "y", 10.0)
                m_w = mask.get("width", 20.0) if isinstance(mask, dict) else getattr(mask, "width", 20.0)
                m_h = mask.get("height", 15.0) if isinstance(mask, dict) else getattr(mask, "height", 15.0)
                m_type = mask.get("type", "color") if isinstance(mask, dict) else getattr(mask, "type", "color")
                m_color = mask.get("color", "#000000") if isinstance(mask, dict) else getattr(mask, "color", "#000000")

                crop_w = video_w * m_w / 100.0
                crop_h = video_h * m_h / 100.0

                out_label = f"[vmasked_{i}]"
                if m_type == "blur":
                    blur_params = get_safe_boxblur_params(crop_w, crop_h, 15)
                    part = f"{current_in}split[vsplitbase_{i}][vblur_{i}];[vblur_{i}]crop=w=iw*{m_w}/100:h=ih*{m_h}/100:x=iw*{m_x}/100:y=ih*{m_y}/100,boxblur={blur_params}[blurred_{i}];[vsplitbase_{i}][blurred_{i}]overlay=x=W*{m_x}/100:y=H*{m_y}/100{out_label}"
                elif m_type == "noise":
                    blur_params = get_safe_boxblur_params(crop_w, crop_h, 5)
                    part = f"{current_in}split[vsplitbase_{i}][vnoise_{i}];[vnoise_{i}]crop=w=iw*{m_w}/100:h=ih*{m_h}/100:x=iw*{m_x}/100:y=ih*{m_y}/100,noise=alls=50:allf=t+u,boxblur={blur_params}[noisy_{i}];[vsplitbase_{i}][noisy_{i}]overlay=x=W*{m_x}/100:y=H*{m_y}/100{out_label}"
                else: # color
                    color_hex = m_color.replace('#', '0x')
                    part = f"{current_in}drawbox=x=iw*{m_x}/100:y=ih*{m_y}/100:w=iw*{m_w}/100:h=ih*{m_h}/100:color={color_hex}:t=fill{out_label}"
                
                filter_parts.append(part)
                current_in = out_label
            
            pre_filter = ";".join(filter_parts) + ";"
            input_label = current_in

        if vf_filters:
            vf_str = ",".join(vf_filters)
            v_filter_complex = f"{pre_filter}{input_label}{vf_str}[vbase]"
        else:
            if pre_filter:
                v_filter_complex = pre_filter.rstrip(';')
                if v_filter_complex.endswith(input_label):
                    v_filter_complex = v_filter_complex[:-len(input_label)] + "[vbase]"
            else:
                v_filter_complex = "[0:v]copy[vbase]"
                
        # Overlay generated subtitles if any
        if subs_input_idx != -1:
            v_filter_complex += f";[vbase][{subs_input_idx}:v]overlay=x=0:y=0:shortest=1[vsub_out]"
            vbase_label = "[vsub_out]"
        else:
            vbase_label = "[vbase]"
        
        print(f"DEBUG V_FILTER_COMPLEX: {v_filter_complex}")
        
        wm_idx = -1
        if watermark_type == "image" and watermark_image_path and os.path.exists(watermark_image_path):
            cmd.extend(["-i", watermark_image_path])
            wm_idx = input_count
            input_count += 1
            opacity_val = watermark_opacity / 100.0
            v_filter_complex += f";[{wm_idx}:v]format=rgba,colorchannelmixer=aa={opacity_val},scale=iw*{watermark_size}/100:-1[wm];{vbase_label}[wm]overlay=x=(W-w)*{watermark_x}/100:y=(H-h)*{watermark_y}/100[vout]"
        else:
            v_filter_complex += f";{vbase_label}copy[vout]"
            
        tts_idx = -1
        if tts_audio and os.path.exists(tts_audio):
            cmd.extend(["-i", tts_audio])
            tts_idx = input_count
            input_count += 1

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
        ])

        if vcodec == "h264_nvenc":
            # h264_nvenc không hỗ trợ -crf và sử dụng bộ preset riêng (slow, medium, fast)
            cmd.extend([
                "-preset", "fast",
                "-pix_fmt", "yuv420p"
            ])
        else:
            cmd.extend([
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
            import redis
            from app.core.config import REDIS_URL
            sync_redis = redis.Redis.from_url(REDIS_URL, decode_responses=True)
            base_name = os.path.basename(input_video).split('.')[0]
 
            stderr_lines = []
            process = subprocess.Popen(cmd, stderr=subprocess.PIPE, universal_newlines=True, encoding='utf-8', errors='replace')
            for line in process.stderr:
                stderr_lines.append(line)
                # Periodically check pause/cancellation flag to cancel render early
                if sync_redis.get(f"pause_video_{base_name}") == "1":
                    log_callback(f"[System] Phát hiện lệnh dừng từ người dùng. Đang hủy tiến trình FFmpeg cho {base_name}...\n")
                    process.kill()
                    raise Exception("Tiến trình bị hủy bởi người dùng.")
 
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
                if sync_redis.get(f"pause_video_{base_name}") == "1":
                    raise Exception("Tiến trình bị hủy bởi người dùng.")
                ffmpeg_err = "".join(stderr_lines[-15:])
                print(f"FFmpeg Error Output:\n{ffmpeg_err}")
                raise Exception(f"FFmpeg exited with code {process.returncode}. Log: {ffmpeg_err.strip()}")
            return output_video
        except Exception as e:
            # Tự động fallback về CPU nếu gặp lỗi do GPU encoder
            is_gpu_err = any(x in str(e).lower() for x in ["nvenc", "libnvidia", "driver", "encoder", "cuda"])
            if use_gpu and is_gpu_err:
                print(f"[!] Lỗi GPU Encoder: {e}. Tự động fallback về CPU (libx264)...")
                if log_callback:
                    log_callback(f"[!] Phát hiện lỗi bộ mã hóa GPU (NVENC): {e}.\nTự động chuyển hướng render bằng CPU (libx264)...\n")
                return self.burn_subtitles(
                    input_video, srt_file, output_video, tts_audio, bg_volume, flip_video, subtitle_style,
                    opt_zoom, opt_color, opt_noise, opt_pitch, subtitle_text_color, subtitle_bg_color,
                    subtitle_font_size, subtitle_margin_v, subtitle_bg_padding, subtitle_bg_opacity,
                    watermark_type, watermark_text, watermark_image_path, watermark_x, watermark_y,
                    watermark_size, watermark_color, watermark_opacity, subtitle_font_family,
                    enable_subtitles, mask_enabled, mask_x, mask_y, mask_width, mask_height, mask_type,
                    mask_color, masks, log_callback, force_cpu=True
                )
            else:
                raise Exception(f"Lỗi FFmpeg khi burn sub: {e}")
