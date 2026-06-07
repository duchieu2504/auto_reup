import time
import os
import subprocess
from datetime import datetime
from app.services.uploader.adb_automator import ADBAutomator
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(TEST)

adb_ip = 192.168.43.1:5555
video_path = /data/data/processed_videos/7643407793793436979_processed.mp4

def run_adb_cmd(cmd):
    full_cmd = [adb, -s, adb_ip] + cmd
    logger.info(fRunning:
