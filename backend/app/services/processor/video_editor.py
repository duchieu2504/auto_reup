import os
import subprocess
import imageio_ffmpeg

ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()

class VideoEditor:
    def burn_subtitles(self, input_video: str, srt_file: str, output_video: str, tts_audio: str = None, bg_volume: int = 10, flip_video: bool = False):
        # Escape path for FFmpeg subtitles filter on Windows
        srt_escaped = srt_file.replace('\\', '/').replace(':', '\\:')
        
        cmd = [ffmpeg_exe, "-y", "-i", input_video]
        
        # Build dynamic video filters
        vf_filters = []
        if flip_video:
            vf_filters.append("hflip")
            
        # Opaque box style (BorderStyle=3) with 100% opaque black background (&H00000000)
        # Outline=12 creates a larger padding box to completely hide original subtitles
        style = "BorderStyle=3,BackColour=&H00000000,Outline=12,Shadow=0,MarginV=40,FontName=Arial,FontSize=20"
        vf_filters.append(f"subtitles='{srt_escaped}':force_style='{style}'")
        vf_str = ",".join(vf_filters)
        
        if tts_audio and os.path.exists(tts_audio):
            cmd.extend(["-i", tts_audio])
            bg_vol_float = bg_volume / 100.0
            filter_complex = f"[0:a]volume={bg_vol_float}[bg];[1:a]volume=1.0[tts];[bg][tts]amix=inputs=2:duration=first:dropout_transition=2[aout]"
            cmd.extend([
                "-vf", vf_str,
                "-filter_complex", filter_complex,
                "-map", "0:v",
                "-map", "[aout]",
                "-c:v", "libx264",
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
                "-c:v", "libx264",
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
