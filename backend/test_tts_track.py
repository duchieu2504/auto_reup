"""Diagnostic script: test generate_tts_track directly."""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.services.processor.tts_generator import TTSGenerator

VIDEO = r"E:\Tradingbot\auto_reup_tiktok\data\raw_videos\老六动画\7642754049300811058.mp4"
SRT = r"E:\Tradingbot\auto_reup_tiktok\data\subtitles\7642754049300811058_vi.srt"
OUTPUT_MP3 = r"E:\Tradingbot\auto_reup_tiktok\backend\test_tts_output.mp3"

def dummy_log(msg, progress=None):
    print(f"LOG: {msg.strip()}")

tts = TTSGenerator()

try:
    print("Starting generate_tts_track...")
    res = tts.generate_tts_track(SRT, OUTPUT_MP3, "edge_auto", VIDEO, dummy_log)
    print(f"Success! Output: {res}")
    if os.path.exists(res):
        print(f"Output size: {os.path.getsize(res)} bytes")
except Exception as e:
    print(f"Exception: {e}")
