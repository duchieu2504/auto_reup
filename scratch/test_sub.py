import subprocess

srt_content = """1
00:00:00,000 --> 00:00:10,000
Test Subtitle text
"""

with open("/tmp/test.srt", "w") as f:
    f.write(srt_content)

cmd = [
    'docker', 'exec', 'autoreup_celery_worker', 'ffmpeg', '-y', '-f', 'lavfi', '-i', 'color=c=black:s=1920x1080',
    '-vf', "subtitles='/tmp/test.srt':force_style='Fontname=Liberation Sans,Fontsize=100,PrimaryColour=&H00FFFFFF,BackColour=&H80000000,BorderStyle=3,Outline=3,Shadow=0,Alignment=2,MarginV=40'",
    '-frames:v', '1', '/tmp/test_sub.jpg'
]

res = subprocess.run(cmd, capture_output=True, text=True)
print(res.stderr)
