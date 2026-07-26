import os
import sys
# Add backend to pythonpath
sys.path.append(os.path.abspath("backend"))

from app.services.processor.tts_generator import TTSGenerator

tts = TTSGenerator()

def dummy_log(msg, progress=0):
    print(msg, end='')

try:
    video_path = r"E:\Tradingbot\auto_reup_tiktok\data\raw_videos\7622293281384571835\7622293281384571835.mp4"
    if not os.path.exists(video_path):
        # find some mp4
        import glob
        files = glob.glob(r"E:\Tradingbot\auto_reup_tiktok\data\raw_videos\*\*.mp4")
        if files:
            video_path = files[0]
            print(f"Using {video_path}")
    
    # Try to extract the same duration info as the code
    import imageio_ffmpeg
    import subprocess
    import re
    ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
    cmd = [ffmpeg_exe, "-i", video_path]
    result = subprocess.run(cmd, capture_output=True, text=True)
    
    print("STDERR: ", result.stderr)
    match = re.search(r"Duration:\s*(\d+):(\d+):(\d+\.\d+)", result.stderr)
    print("Match: ", match)
    
except Exception as e:
    import traceback
    traceback.print_exc()
