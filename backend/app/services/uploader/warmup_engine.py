import logging
import time
import random
import os
import requests
from typing import Dict, Any

logger = logging.getLogger(__name__)

class BaseWarmupEngine:
    def __init__(self, account_data: Dict[str, Any]):
        self.account_data = account_data
        
    def warmup(self):
        raise NotImplementedError

class GpmWarmupEngine(BaseWarmupEngine):
    def warmup(self):
        from playwright.sync_api import sync_playwright
        
        # 1. Start GPM Profile
        gpm_api_url = os.getenv("GPM_API_URL", "").rstrip('/')
        profile_id = self.account_data.get("device_id")
        
        if not gpm_api_url or not profile_id:
            raise Exception("GPM API URL hoặc Profile ID không hợp lệ.")
            
        logger.info(f"[Warmup-GPM] Đang khởi động GPM Profile: {profile_id}")
        start_res = requests.get(f"{gpm_api_url}/api/v2/profile/start?profileId={profile_id}")
        start_data = start_res.json()
        
        if not start_data.get("success"):
            raise Exception(f"Không thể mở GPM Profile: {start_data}")
            
        ws_endpoint = start_data.get("data", {}).get("ws_endpoint")
        if not ws_endpoint:
            raise Exception("Không tìm thấy WebSocket Endpoint từ GPM")
            
        logger.info(f"[Warmup-GPM] Kết nối qua CDP: {ws_endpoint}")
        
        with sync_playwright() as p:
            browser = p.chromium.connect_over_cdp(ws_endpoint)
            # Find an existing page or create a new one
            if browser.contexts and browser.contexts[0].pages:
                page = browser.contexts[0].pages[0]
            else:
                context = browser.contexts[0] if browser.contexts else browser.new_context()
                page = context.new_page()
                
            try:
                platform = self.account_data.get("platform", "tiktok").lower()
                if platform == "tiktok":
                    self._warmup_tiktok(page)
                else:
                    logger.warning(f"Chưa hỗ trợ nuôi nền tảng {platform}")
            finally:
                browser.disconnect()
                # Stop profile after warmup
                logger.info(f"[Warmup-GPM] Đóng GPM Profile: {profile_id}")
                requests.get(f"{gpm_api_url}/api/v2/profile/stop?profileId={profile_id}")

    def _warmup_tiktok(self, page):
        logger.info("[Warmup-GPM] Mở tiktok.com/foryou")
        page.goto("https://www.tiktok.com/foryou", timeout=60000)
        time.sleep(5)
        
        # Nuôi trong khoảng 10-15 phút (600 - 900 giây)
        warmup_duration = random.randint(600, 900)
        end_time = time.time() + warmup_duration
        
        videos_watched = 0
        likes_given = 0
        
        logger.info(f"[Warmup-GPM] Bắt đầu lướt dạo (Kéo dài {warmup_duration}s)...")
        while time.time() < end_time:
            # Ngẫu nhiên dừng lại xem video từ 10s đến 45s
            watch_time = random.randint(10, 45)
            logger.info(f"[Warmup-GPM] Đang xem video {videos_watched + 1} trong {watch_time}s...")
            time.sleep(watch_time)
            
            # Ngẫu nhiên thả tim (Tỷ lệ 15%)
            if random.random() < 0.15:
                try:
                    like_button = page.locator('span[data-e2e="like-icon"]').first
                    if like_button.is_visible():
                        like_button.click()
                        likes_given += 1
                        logger.info(f"[Warmup-GPM] Đã thả tim! (Tổng: {likes_given})")
                        time.sleep(1)
                except Exception:
                    pass
            
            # Cuộn xuống video tiếp theo
            page.keyboard.press("ArrowDown")
            videos_watched += 1
            
        logger.info(f"[Warmup-GPM] Hoàn tất phiên nuôi! Đã lướt {videos_watched} video, thả {likes_given} tim.")

class AdbWarmupEngine(BaseWarmupEngine):
    def warmup(self):
        import subprocess
        device_id = self.account_data.get("device_id")
        if not device_id:
            raise Exception("Thiếu Device ID cho ADB.")
            
        if ":" in device_id:
            logger.info(f"[Warmup-ADB] Đang connect tới {device_id}...")
            subprocess.run(f"adb connect {device_id}", shell=True)
            
        adb_cmd = f"adb -s {device_id}"
        
        logger.info(f"[Warmup-ADB] Khởi động Tiktok trên thiết bị {device_id}")
        # Mở app Tiktok (Thử lần lượt các phiên bản Quốc tế, Châu Á, Douyin)
        packages = ["com.zhiliaoapp.musically", "com.ss.android.ugc.trill", "com.ss.android.ugc.aweme"]
        for pkg in packages:
            res = subprocess.run(f"{adb_cmd} shell monkey -p {pkg} -c android.intent.category.LAUNCHER 1", shell=True, capture_output=True, text=True)
            if "No activities found to run" not in res.stderr and "No activities found to run" not in res.stdout:
                logger.info(f"[Warmup-ADB] Đã khởi chạy package {pkg}")
                break
        time.sleep(8) # Đợi app load
        
        warmup_duration = random.randint(600, 900)
        end_time = time.time() + warmup_duration
        
        videos_watched = 0
        likes_given = 0
        
        # Screen dimensions (approximate for swipe)
        # Tốt nhất là tự động lấy nhưng để an toàn cứ vuốt từ giữa màn dưới lên giữa màn trên
        
        while time.time() < end_time:
            watch_time = random.randint(10, 45)
            logger.info(f"[Warmup-ADB] Đang xem video {videos_watched + 1} trong {watch_time}s...")
            time.sleep(watch_time)
            
            # Tỷ lệ thả tim 15% (Double tap)
            if random.random() < 0.15:
                logger.info(f"[Warmup-ADB] Thả tim video...")
                # Double tap ở tọa độ giữa màn hình (VD: 500 1000)
                # Trên thiết bị đa số là x=500, y=1000
                subprocess.run(f"{adb_cmd} shell input tap 500 1000 && {adb_cmd} shell input tap 500 1000", shell=True)
                likes_given += 1
                time.sleep(1)
                
            # Swipe lên video tiếp (Vuốt từ y=1500 lên y=500)
            subprocess.run(f"{adb_cmd} shell input swipe 500 1500 500 500 300", shell=True)
            videos_watched += 1
            
        logger.info(f"[Warmup-ADB] Hoàn tất phiên nuôi! Đã lướt {videos_watched} video, thả {likes_given} tim.")
        # Về màn hình chính hoặc tắt màn
        subprocess.run(f"{adb_cmd} shell input keyevent 3", shell=True)

class WarmupEngineFactory:
    @staticmethod
    def get_engine(account_data: Dict[str, Any]) -> BaseWarmupEngine:
        connection_type = account_data.get("connection_type")
        if connection_type == "gpm_login":
            return GpmWarmupEngine(account_data)
        elif connection_type == "adb_device":
            return AdbWarmupEngine(account_data)
        else:
            raise ValueError(f"Không hỗ trợ nuôi tài khoản cho loại kết nối: {connection_type}")
