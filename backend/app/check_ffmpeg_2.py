import subprocess
cmd = [
    "docker", "exec", "autoreup_celery_worker", "ffmpeg", "-f", "lavfi", "-i", "color=c=black:s=640x480:d=1",
    "-filter_complex", "[0:v]drawtext=text='@Zhiu'\\''Nika':fontcolor=0xFFFFFF@0.5:fontsize=20.0:x=(w-text_w)*50.0/100:y=(h-text_h)*50.0/100[vout]",
    "-map", "[vout]", "-y", "/tmp/test_out.mp4"
]
print("CMD", cmd)
p = subprocess.run(cmd, capture_output=True, text=True)
print("SUCCESS" if "Error" not in p.stderr else p.stderr[-500:])
