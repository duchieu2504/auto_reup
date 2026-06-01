import json
import os
from typing import Set

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../"))
DEFAULT_HISTORY_FILE = os.path.join(PROJECT_ROOT, "data", "db_data", "download_history.json")

class SyncManager:
    def __init__(self, history_file: str = DEFAULT_HISTORY_FILE):
        self.history_file = history_file
        self.downloaded_ids: Set[str] = set()
        self._ensure_file_exists()
        self.load_history()

    def _ensure_file_exists(self):
        os.makedirs(os.path.dirname(self.history_file), exist_ok=True)
        if not os.path.exists(self.history_file):
            with open(self.history_file, 'w', encoding='utf-8') as f:
                json.dump([], f)

    def load_history(self):
        try:
            with open(self.history_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                self.downloaded_ids = set(data)
        except Exception as e:
            print(f"Lỗi khi đọc file lịch sử: {e}")
            self.downloaded_ids = set()
            
        # Thêm Layer: Quét thực tế trên ổ cứng (raw_videos)
        # Để đảm bảo nếu mất file JSON hay DB, vẫn nhận ra file mp4 đã có
        raw_dir = os.path.join(PROJECT_ROOT, "data", "raw_videos")
        if os.path.exists(raw_dir):
            for root, dirs, files in os.walk(raw_dir):
                for file in files:
                    if file.endswith(".mp4"):
                        vid_id = file.replace(".mp4", "")
                        self.downloaded_ids.add(vid_id)
                        
        # Lưu ngược lại vào JSON để cache cho lần sau
        self.save_history()

    def save_history(self):
        try:
            with open(self.history_file, 'w', encoding='utf-8') as f:
                json.dump(list(self.downloaded_ids), f, indent=4)
        except Exception as e:
            print(f"Lỗi khi lưu file lịch sử: {e}")

    def is_downloaded(self, video_id: str) -> bool:
        return video_id in self.downloaded_ids

    def mark_as_downloaded(self, video_id: str):
        self.downloaded_ids.add(video_id)
        self.save_history()
