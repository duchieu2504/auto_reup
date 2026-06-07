import os
import sys

# Thêm đường dẫn backend vào sys.path để import
sys.path.append('/app')

from app.services.processor.video_editor import VideoEditor

editor = VideoEditor()

# Tạo file SRT giả
with open('/tmp/dummy.srt', 'w') as f:
    f.write("1\n00:00:00,000 --> 00:00:10,000\nTest\n")

try:
    editor.burn_subtitles(
        input_video="color=c=black:s=1920x1080",
        srt_file="/tmp/dummy.srt",
        output_video="/tmp/output.mp4",
        watermark_type="text",
        watermark_text="Logo",
        subtitle_font_size="20",
        watermark_size="20",
        subtitle_text_color="#000000",
        subtitle_bg_color="#ffffff"
    )
except Exception as e:
    print("ERROR:", e)
