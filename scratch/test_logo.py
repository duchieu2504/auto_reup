import subprocess
import uuid

wm_file = f"/tmp/wm_{uuid.uuid4().hex}.txt"
with open(wm_file, "w", encoding="utf-8") as f:
    f.write("Logo Test 123")

cmd = [
    'docker', 'exec', 'autoreup_celery_worker', 'ffmpeg', '-y', '-f', 'lavfi', '-i', 'color=c=black:s=1920x1080:d=1',
    '-vf', f"drawtext=fontfile=/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf:textfile='{wm_file}':fontcolor=white:fontsize=150:x=50:y=50",
    '-frames:v', '1', '/tmp/test_logo.jpg'
]

res = subprocess.run(cmd, capture_output=True, text=True)
print("STDOUT:", res.stdout)
print("STDERR:", res.stderr)
