import json
import time
import requests
import os

API_BASE_URL = "https://member.bilibili.com/x/bcut/rubick-interface"
API_REQ_UPLOAD = API_BASE_URL + "/resource/create"
API_COMMIT_UPLOAD = API_BASE_URL + "/resource/create/complete"
API_CREATE_TASK = API_BASE_URL + "/task"
API_QUERY_RESULT = API_BASE_URL + "/task/result"

class BcutASR:
    """Bilibili Bcut ASR API implementation.
    Uses Bilibili's cloud ASR service with multipart upload support.
    """
    headers = {
        "User-Agent": "Bilibili/1.0.0 (https://www.bilibili.com)",
        "Content-Type": "application/json",
    }

    def __init__(self, audio_path: str):
        self.audio_path = audio_path
        
        with open(self.audio_path, "rb") as f:
            self.file_binary = f.read()

        self.session = requests.Session()
        self.task_id = None
        self.__etags = []

        self.__in_boss_key = None
        self.__resource_id = None
        self.__upload_id = None
        self.__upload_urls = []
        self.__per_size = None
        self.__clips = None
        self.__download_url = None

    def upload(self) -> None:
        """Request upload authorization and upload audio file."""
        if not self.file_binary:
            raise ValueError("No audio data to upload")
        
        payload = json.dumps(
            {
                "type": 2,
                "name": "audio.mp3",
                "size": len(self.file_binary),
                "ResourceFileType": "mp3",
                "model_id": "8",
            }
        )

        resp = requests.post(API_REQ_UPLOAD, data=payload, headers=self.headers, timeout=10)
        resp.raise_for_status()
        resp = resp.json()
        
        if resp.get("code") != 0:
            raise Exception(f"Bcut Upload Error: {resp.get('message')}")
            
        resp_data = resp["data"]

        self.__in_boss_key = resp_data["in_boss_key"]
        self.__resource_id = resp_data["resource_id"]
        self.__upload_id = resp_data["upload_id"]
        self.__upload_urls = resp_data["upload_urls"]
        self.__per_size = resp_data["per_size"]
        self.__clips = len(resp_data["upload_urls"])

        self.__upload_part()
        self.__commit_upload()

    def __upload_part(self) -> None:
        """Upload audio data in multiple parts."""
        for clip in range(self.__clips):
            start_range = clip * self.__per_size
            end_range = (clip + 1) * self.__per_size
            
            resp = requests.put(
                self.__upload_urls[clip],
                data=self.file_binary[start_range:end_range],
                headers=self.headers,
                timeout=60,
            )
            resp.raise_for_status()
            etag = resp.headers.get("Etag")
            if etag is not None:
                self.__etags.append(etag)

    def __commit_upload(self) -> None:
        """Commit the upload and get download URL."""
        data = json.dumps(
            {
                "InBossKey": self.__in_boss_key,
                "ResourceId": self.__resource_id,
                "Etags": ",".join(self.__etags) if self.__etags else "",
                "UploadId": self.__upload_id,
                "model_id": "8",
            }
        )
        resp = requests.post(API_COMMIT_UPLOAD, data=data, headers=self.headers, timeout=10)
        resp.raise_for_status()
        resp = resp.json()
        
        if resp.get("code") != 0:
            raise Exception(f"Bcut Commit Error: {resp.get('message')}")
            
        self.__download_url = resp["data"]["download_url"]

    def create_task(self) -> str:
        """Create ASR task."""
        resp = requests.post(
            API_CREATE_TASK,
            json={"resource": self.__download_url, "model_id": "8"},
            headers=self.headers,
            timeout=10,
        )
        resp.raise_for_status()
        resp = resp.json()
        if resp.get("code") != 0:
            raise Exception(f"Bcut Create Task Error: {resp.get('message')}")
            
        self.task_id = resp["data"]["task_id"]
        return self.task_id or ""

    def result(self, task_id=None):
        """Query ASR result."""
        resp = requests.get(
            API_QUERY_RESULT,
            params={"model_id": "8", "task_id": task_id or self.task_id},
            headers=self.headers,
            timeout=10,
        )
        resp.raise_for_status()
        resp = resp.json()
        if resp.get("code") != 0:
            raise Exception(f"Bcut Result Error: {resp.get('message')}")
        return resp["data"]

    def run(self) -> list:
        """Execute ASR workflow: upload -> create task -> poll result.
        Returns a list of word dictionaries: [{'word': 'Hello', 'start': 0.0, 'end': 0.5}, ...]
        """
        print("[BcutASR] Uploading file to Bilibili...")
        self.upload()

        print("[BcutASR] Creating ASR task...")
        self.create_task()

        print("[BcutASR] Transcribing (polling)...")
        task_resp = None
        for _ in range(300): # Tối đa 5 phút chờ
            task_resp = self.result()
            if task_resp["state"] == 4: # Hoàn tất
                break
            if task_resp["state"] == 3: # Lỗi
                raise RuntimeError("Bcut ASR task failed on server side")
            time.sleep(1)

        if task_resp is None or task_resp["state"] != 4:
            raise RuntimeError("Bcut ASR task timeout")

        raw_result = json.loads(task_resp["result"])
        
        # Parse into word-level timestamps (seconds)
        words = []
        for u in raw_result.get("utterances", []):
            for w in u.get("words", []):
                word_text = w["label"].strip()
                # Bcut trả về timestamp dạng millisecond, ta đổi ra second
                start_s = w["start_time"] / 1000.0
                end_s = w["end_time"] / 1000.0
                
                # Bỏ qua các từ trống rỗng hoặc rác
                if word_text:
                    words.append({
                        "word": word_text,
                        "start": start_s,
                        "end": end_s
                    })
                    
        print(f"[BcutASR] Completed transcription. Found {len(words)} words.")
        return words

def test_bcut_api():
    """Hàm test nhanh xem API có hoạt động không."""
    try:
        # Pinging upload API without file to see if it responds correctly or is blocked
        resp = requests.post(API_REQ_UPLOAD, data=json.dumps({"type": 2, "name": "test.mp3", "size": 1000, "ResourceFileType": "mp3", "model_id": "8"}), headers=BcutASR.headers, timeout=5)
        if resp.status_code == 200:
            return {"status": "ok", "message": "Bcut API is accessible"}
        else:
            return {"status": "error", "message": f"HTTP {resp.status_code}"}
    except Exception as e:
        return {"status": "error", "message": str(e)}
