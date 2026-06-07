import os

path = r'e:\Tradingbot\auto_reup_tiktok\backend\app\tasks\processor_tasks.py'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    'opt_pitch: bool = False, subtitle_text_color: str = "#000000", subtitle_bg_color: str = "#FFFFFF", subtitle_font_size: int = 20, subtitle_margin_v: int = 40, subtitle_bg_padding: int = 2):',
    'opt_pitch: bool = False, subtitle_text_color: str = "#000000", subtitle_bg_color: str = "#FFFFFF", subtitle_font_size: int = 20, subtitle_margin_v: int = 40, subtitle_bg_padding: int = 2, subtitle_bg_opacity: int = 100):'
)

content = content.replace(
    'pipeline_instance.process_video(vp, log_callback, voice_mode, bg_volume, flip_video, force_render, subtitle_style, opt_zoom, opt_color, opt_noise, opt_pitch, subtitle_text_color, subtitle_bg_color, subtitle_font_size, subtitle_margin_v, subtitle_bg_padding)',
    'pipeline_instance.process_video(vp, log_callback, voice_mode, bg_volume, flip_video, force_render, subtitle_style, opt_zoom, opt_color, opt_noise, opt_pitch, subtitle_text_color, subtitle_bg_color, subtitle_font_size, subtitle_margin_v, subtitle_bg_padding, subtitle_bg_opacity)'
)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)


path2 = r'e:\Tradingbot\auto_reup_tiktok\backend\app\services\processor\pipeline.py'
with open(path2, 'r', encoding='utf-8') as f:
    content2 = f.read()

content2 = content2.replace(
    'subtitle_font_size: int = 20, subtitle_margin_v: int = 40, subtitle_bg_padding: int = 2):',
    'subtitle_font_size: int = 20, subtitle_margin_v: int = 40, subtitle_bg_padding: int = 2, subtitle_bg_opacity: int = 100):'
)

content2 = content2.replace(
    'subtitle_bg_padding=subtitle_bg_padding\n            )',
    'subtitle_bg_padding=subtitle_bg_padding,\n                        subtitle_bg_opacity=subtitle_bg_opacity\n                    )'
)

with open(path2, 'w', encoding='utf-8') as f:
    f.write(content2)

print("Done")
