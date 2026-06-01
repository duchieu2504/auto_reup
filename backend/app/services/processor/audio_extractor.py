import os
import subprocess
import imageio_ffmpeg

ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()

def extract_audio(video_path: str, output_audio_path: str):
    """
    Tách âm thanh từ video gốc thành file mp3 (nếu cần thiết cho các công cụ khác).
    """
    cmd = [
        ffmpeg_exe,
        "-y",
        "-i", video_path,
        "-q:a", "0",
        "-map", "a",
        output_audio_path
    ]
    try:
        subprocess.run(cmd, check=True, capture_output=True, text=True)
        return output_audio_path
    except subprocess.CalledProcessError as e:
        raise Exception(f"Lỗi FFmpeg khi trích xuất âm thanh: {e.stderr}")
