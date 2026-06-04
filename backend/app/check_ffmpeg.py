import os
import sys

# Giả lập lệnh ffmpeg
video_path = "/data/raw_videos/鼠鼠视界/7646719676520746266.mp4"
vi_srt = "/data/subtitles/7646719676520746266_vi.srt"
tts_audio = "/data/audio/7646719676520746266_tts.mp3"

watermark_type = "text"
watermark_text = "@Zhiu'Nika"
watermark_image_path = None
watermark_opacity = 50.0
watermark_x = 50.0
watermark_y = 50.0
watermark_size = 20.0
watermark_color = "#FFFFFF"

bg_volume = 10
opt_pitch = False
flip_video = False
opt_zoom = False
opt_color = False
opt_noise = False
subtitle_style = "black_white"
subtitle_text_color = "#000000"
subtitle_bg_color = "#FFFFFF"
subtitle_font_size = 20
subtitle_margin_v = 40
subtitle_bg_padding = 2
subtitle_bg_opacity = 100

vcodec = "libx264"
output_video = "/tmp/test_output.mp4"

# logic từ video_editor.py
def hex_to_ass_color(hex_color: str, alpha: str = "00") -> str:
    hex_color = hex_color.lstrip('#')
    if len(hex_color) != 6:
        hex_color = "FFFFFF"
    r, g, b = hex_color[0:2], hex_color[2:4], hex_color[4:6]
    return f"&H{alpha}{b}{g}{r}"

cmd = ["ffmpeg", "-y", "-i", video_path]
srt_escaped = vi_srt.replace('\\', '/').replace(':', '\\:')
vf_filters = []
primary_color = hex_to_ass_color(subtitle_text_color, "00")
alpha_val = int((100 - subtitle_bg_opacity) * 255 / 100)
alpha_hex = f"{alpha_val:02X}"
back_color = hex_to_ass_color(subtitle_bg_color, alpha_hex)
style = f"Fontname=Arial,Fontsize={subtitle_font_size},PrimaryColour={primary_color},BackColour={back_color},BorderStyle=3,Outline={subtitle_bg_padding},Shadow=0,Alignment=2,MarginV={subtitle_margin_v}"

vf_filters.append(f"subtitles='{srt_escaped}':force_style='{style}'")

escaped_text = watermark_text.replace("'", "'\\''")
text_color = watermark_color.replace('#', '0x')
opacity_val = watermark_opacity / 100.0
drawtext_filter = f"drawtext=text='{escaped_text}':fontcolor={text_color}@{opacity_val}:fontsize={watermark_size}:x=(w-text_w)*{watermark_x}/100:y=(h-text_h)*{watermark_y}/100"
vf_filters.append(drawtext_filter)

vf_str = ",".join(vf_filters)
print("VF STR:", vf_str)

wm_idx = -1
v_filter_complex = f"[0:v]{vf_str}[vout]"
tts_idx = -1
if tts_audio and os.path.exists(tts_audio):
    cmd.extend(["-i", tts_audio])
    tts_idx = 1

filter_complex_str = v_filter_complex
a_map = "0:a?"
v_map = "[vout]"

if tts_idx != -1:
    bg_vol_float = bg_volume / 100.0
    audio_filter = f"[0:a]volume={bg_vol_float}[bg];[{tts_idx}:a]volume=1.0[tts];[bg][tts]amix=inputs=2:duration=first:dropout_transition=2[aout]"
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
cmd.extend([
    "-c:a", "aac",
    "-b:a", "128k"
])
cmd.append(output_video)

print("CMD:")
print(" ".join(cmd))
