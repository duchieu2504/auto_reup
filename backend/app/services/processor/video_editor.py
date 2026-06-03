import os
import subprocess
import imageio_ffmpeg

from dotenv import load_dotenv

ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()

class VideoEditor:
    def get_optimal_video_encoder(self, use_gpu: bool = False) -> str:
        if not use_gpu:
            return "libx264"
        
        try:
            result = subprocess.run([ffmpeg_exe, "-encoders"], capture_output=True, text=True, check=True)
            output = result.stdout.lower()
            if "h264_qsv" in output:
                return "h264_qsv"
            elif "h264_nvenc" in output:
                return "h264_nvenc"
        except Exception as e:
            print(f"Lỗi khi kiểm tra encoder, tự động fallback về CPU: {e}")
            
        return "libx264"

    def burn_subtitles(self, input_video: str, srt_file: str, output_video: str, tts_audio: str = None, bg_volume: int = 10, flip_video: bool = False, subtitle_style: str = "black_white", opt_zoom: bool = False, opt_color: bool = False, opt_noise: bool = False, opt_pitch: bool = False):
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
            
        # Define subtitle style based on user choice
        # Use BorderStyle=1 (Outline) with a very thick Outline (e.g. 15) to simulate a rounded background box!
        if subtitle_style == "white_black":
            # Nền trắng bo góc (Outline=15), chữ đen. Opacity 75% (Alpha=40)
            style = "BorderStyle=1,Outline=15,Shadow=0,MarginV=40,FontName=Arial,FontSize=20,PrimaryColour=&H00000000,OutlineColour=&H40FFFFFF"
        else:
            # Nền đen bo góc (Outline=15), chữ trắng. Opacity 75% (Alpha=40)
            style = "BorderStyle=1,Outline=15,Shadow=0,MarginV=40,FontName=Arial,FontSize=20,PrimaryColour=&H00FFFFFF,OutlineColour=&H40000000"
            
        vf_filters.append(f"subtitles='{srt_escaped}':force_style='{style}'")
        vf_str = ",".join(vf_filters)
        
        if tts_audio and os.path.exists(tts_audio):
            cmd.extend(["-i", tts_audio])
            bg_vol_float = bg_volume / 100.0
            if opt_pitch:
                filter_complex = f"[0:a]volume={bg_vol_float},asetrate=44100*1.02,atempo=1/1.02[bg];[1:a]volume=1.0[tts];[bg][tts]amix=inputs=2:duration=first:dropout_transition=2[aout]"
            else:
                filter_complex = f"[0:a]volume={bg_vol_float}[bg];[1:a]volume=1.0[tts];[bg][tts]amix=inputs=2:duration=first:dropout_transition=2[aout]"
            
            cmd.extend([
                "-vf", vf_str,
                "-filter_complex", filter_complex,
                "-map", "0:v",
                "-map", "[aout]",
                "-c:v", vcodec,
                "-crf", "28",
                "-preset", "faster",
                "-pix_fmt", "yuv420p",
                "-c:a", "aac",
                "-b:a", "128k",
                output_video
            ])
        else:
            if opt_pitch:
                cmd.extend([
                    "-vf", vf_str,
                    "-af", "asetrate=44100*1.02,atempo=1/1.02",
                    "-c:v", vcodec,
                    "-crf", "28",
                    "-preset", "faster",
                    "-pix_fmt", "yuv420p",
                    "-c:a", "aac",
                    "-b:a", "128k",
                    output_video
                ])
            else:
                cmd.extend([
                    "-vf", vf_str,
                    "-c:v", vcodec,
                    "-crf", "28",
                    "-preset", "faster",
                    "-pix_fmt", "yuv420p",
                    "-c:a", "copy",
                    output_video
                ])
        
        try:
            subprocess.run(cmd, check=True, capture_output=True, text=True)
            return output_video
        except subprocess.CalledProcessError as e:
            raise Exception(f"Lỗi FFmpeg khi burn sub: {e.stderr}")
