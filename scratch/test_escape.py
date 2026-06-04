import subprocess

cmd = [
    'docker', 'exec', 'autoreup_celery_worker', 'ffmpeg', '-y', '-f', 'lavfi', '-i', 'color=c=black:s=1920x1080',
    '-vf', "drawtext=fontfile=/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf:fontcolor=white:fontsize=150:text=Hello\\: World\\: with spaces",
    '-frames:v', '1', '/tmp/test.jpg'
]

res = subprocess.run(cmd, capture_output=True, text=True)
print("STDOUT:", res.stdout)
print("STDERR:", res.stderr)
