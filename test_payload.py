import sys
from pydantic import ValidationError
sys.path.append('backend')
from app.api.processor import ProcessRequest

payload = {
    "video_paths": ["test.mp4"],
    "voice_mode": "edge_auto",
    "bg_volume": 10,
    "vocal_volume": 0,
    "flip_video": False,
    "opt_zoom": False,
    "opt_color": False,
    "opt_noise": False,
    "opt_pitch": False,
    "opt_speed": False,
    "opt_reverb": False,
    "opt_vignette": False,
    "opt_random_combo": False,
    "enable_subtitles": True,
    "subtitle_style": "black_white",
    "subtitle_text_color": "#000000",
    "subtitle_bg_color": "#ffffff",
    "subtitle_font_size": 8,
    "subtitle_margin_v": 40,
    "subtitle_bg_padding": 2,
    "subtitle_bg_opacity": 100,
    "watermark_type": "none",
    "watermark_text": None,
    "watermark_image_path": None,
    "watermark_x": 50.0,
    "watermark_y": 50.0,
    "watermark_size": 20.0,
    "watermark_color": "#FFFFFF",
    "watermark_opacity": 50.0,
    "mask_enabled": False,
    "mask_x": 10.0,
    "mask_y": 10.0,
    "mask_width": 20.0,
    "mask_height": 15.0,
    "mask_type": "color",
    "mask_color": "#000000",
    "masks": []
}

try:
    req = ProcessRequest(**payload)
    print("Success:", req)
except ValidationError as e:
    print("Error:", e.errors())
