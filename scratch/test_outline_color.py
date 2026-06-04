import subprocess

# Test without OutlineColour
cmd1 = [
    'docker', 'exec', 'autoreup_celery_worker', 'ffmpeg', '-y', '-f', 'lavfi', '-i', 'color=c=red:s=1920x1080:d=1',
    '-vf', "subtitles='/tmp/dummy.srt':force_style='Fontname=Liberation Sans,Fontsize=60,PrimaryColour=&H00000000,BackColour=&H00FFFFFF,BorderStyle=3,Outline=6,Shadow=0,Alignment=2,MarginV=120'",
    '-frames:v', '1', '/tmp/test_sub_black.jpg'
]

# Test with OutlineColour
cmd2 = [
    'docker', 'exec', 'autoreup_celery_worker', 'ffmpeg', '-y', '-f', 'lavfi', '-i', 'color=c=red:s=1920x1080:d=1',
    '-vf', "subtitles='/tmp/dummy.srt':force_style='Fontname=Liberation Sans,Fontsize=60,PrimaryColour=&H00000000,OutlineColour=&H00FFFFFF,BackColour=&H00FFFFFF,BorderStyle=3,Outline=6,Shadow=0,Alignment=2,MarginV=120'",
    '-frames:v', '1', '/tmp/test_sub_white.jpg'
]

subprocess.run(cmd1, capture_output=True)
subprocess.run(cmd2, capture_output=True)

print("Done generating test frames")
