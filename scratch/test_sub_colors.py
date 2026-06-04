import subprocess

cmd = [
    'docker', 'exec', 'autoreup_celery_worker', 'ffmpeg', '-y', '-f', 'lavfi', '-i', 'color=c=red:s=1920x1080:d=1',
    '-vf', "subtitles='/tmp/dummy.srt':force_style='Fontname=Liberation Sans,Fontsize=60,PrimaryColour=&H000000FF,BackColour=&H00FFFFFF,BorderStyle=3,Outline=6,Shadow=0,Alignment=2,MarginV=120'",
    '-frames:v', '1', '/tmp/test_sub.jpg'
]

res = subprocess.run(cmd, capture_output=True, text=True)
print("STDOUT:", res.stdout)
print("STDERR:", res.stderr)
