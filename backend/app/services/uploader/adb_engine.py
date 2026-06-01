import logging
import os
import subprocess
import time
from typing import Dict, Any
from .base_engine import BaseUploaderEngine

logger = logging.getLogger(__name__)

class ADBUploader(BaseUploaderEngine):
    """
    Engine upload sử dụng ADB (Android Debug Bridge).
    Chuyên trị: Các App nội địa Trung Quốc như Douyin, Xiaohongshu hoặc TikTok Mobile.
    Cần cấu hình: IP của máy ảo/điện thoại, port (VD: 192.168.1.10:5555).
    """
    
    def __init__(self, account_data: Dict[str, Any]):
        super().__init__(account_data)
        # Auth data có thể chứa "adb_ip" thay vì cookie
        self.adb_ip = self.account_data.get("auth_data", "127.0.0.1:5555").strip()

    def _run_adb_cmd(self, args: list, timeout: int = 60) -> str:
        """Chạy lệnh adb tới thiết bị cụ thể"""
        cmd = ["adb", "-s", self.adb_ip] + args
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
            if result.returncode != 0:
                logger.error(f"[ADB] Lỗi khi chạy lệnh {cmd}: {result.stderr}")
            return result.stdout.strip()
        except subprocess.TimeoutExpired:
            logger.error(f"[ADB] Timeout khi chạy lệnh {cmd}")
            return ""
        except Exception as e:
            logger.error(f"[ADB] Lỗi không xác định: {e}")
            return ""

    def connect(self) -> bool:
        """Kết nối tới máy ảo Android hoặc điện thoại qua mạng"""
        # Nếu thiết bị là cổng local USB thì thường auth_data là mã thiết bị (vd: emulator-5554)
        if ":" in self.adb_ip:
            logger.info(f"[ADB] Đang connect tới {self.adb_ip}...")
            subprocess.run(["adb", "connect", self.adb_ip], capture_output=True)
            
        # Kiểm tra trạng thái
        devices = subprocess.run(["adb", "devices"], capture_output=True, text=True).stdout
        if self.adb_ip in devices and "device" in devices.split(self.adb_ip)[1].split("\n")[0]:
            return True
        return False

    def upload(self, video_path: str, caption: str, hashtags: str) -> str:
        logger.info(f"[ADB] Bắt đầu đẩy video sang điện thoại {self.adb_ip}: {video_path}")
        
        if not self.connect():
            raise Exception(f"Không thể kết nối ADB tới thiết bị: {self.adb_ip}")
            
        if not os.path.exists(video_path):
            raise Exception(f"File video không tồn tại: {video_path}")

        # 1. Push video sang bộ nhớ điện thoại (Thư mục Download)
        remote_path = f"/sdcard/Download/reup_{int(time.time())}.mp4"
        logger.info(f"[ADB] Pushing video to {remote_path}...")
        self._run_adb_cmd(["push", video_path, remote_path], timeout=120)
        
        # 2. Bắn Broadcast để hệ điều hành quét lại thư viện media (để app thấy video)
        logger.info("[ADB] Cập nhật thư viện Media...")
        self._run_adb_cmd(["shell", "am", "broadcast", "-a", "android.intent.action.MEDIA_SCANNER_SCAN_FILE", "-d", f"file://{remote_path}"])
        time.sleep(2)

        # Phân loại nền tảng
        platform = self.account_data.get("platform", "douyin").lower()
        full_caption = f"{caption} {hashtags}"
        
        try:
            if platform == "douyin":
                return self._upload_douyin(remote_path, full_caption)
            elif platform == "tiktok":
                return self._upload_tiktok_mobile(remote_path, full_caption)
            else:
                raise Exception(f"Nền tảng App {platform} chưa được hỗ trợ qua ADB.")
        finally:
            # Dọn dẹp video trên điện thoại cho đỡ đầy bộ nhớ
            logger.info(f"[ADB] Xóa video tạm trên điện thoại {remote_path}")
            self._run_adb_cmd(["shell", "rm", remote_path])

    def _upload_douyin(self, remote_video_path: str, text: str) -> str:
        logger.info("[ADB] Khởi động Douyin App...")
        # Lệnh mở Douyin (Package: com.ss.android.ugc.aweme)
        self._run_adb_cmd(["shell", "monkey", "-p", "com.ss.android.ugc.aweme", "-c", "android.intent.category.LAUNCHER", "1"])
        time.sleep(8) # Chờ app mở lên
        
        # TODO: Implement quy trình click (Tuỳ thuộc vào độ phân giải màn hình)
        # Các bước thường làm (Cần thay tọa độ X Y theo máy thật):
        # 1. Bấm nút dấu + (Thêm video)
        # self._run_adb_cmd(["shell", "input", "tap", "540", "1800"])
        # time.sleep(2)
        # 2. Bấm nút Chọn Album
        # 3. Chọn video đầu tiên (Chính là video vừa push vào)
        # 4. Bấm Tiếp theo
        # 5. Dùng ADB Keyboard (com.android.adbkeyboard) để gõ Caption Unicode
        # self._run_adb_cmd(["shell", "am", "broadcast", "-a", "ADB_INPUT_TEXT", "--es", "msg", f"'{text}'"])
        # 6. Bấm nút Đăng bài
        
        logger.info("[ADB] Mô phỏng Upload Douyin App thành công!")
        return "https://www.douyin.com/video/giado_adb_123"
        
    def _upload_tiktok_mobile(self, remote_video_path: str, text: str) -> str:
        logger.info("[ADB] Khởi động Tiktok Mobile App...")
        # Lệnh mở Tiktok Quốc tế (Package: com.zhiliaoapp.musically)
        self._run_adb_cmd(["shell", "monkey", "-p", "com.zhiliaoapp.musically", "-c", "android.intent.category.LAUNCHER", "1"])
        time.sleep(8)
        
        # Giả lập thành công
        logger.info("[ADB] Mô phỏng Upload Tiktok Mobile thành công!")
        return "https://www.tiktok.com/video/giado_adb_456"

    def check_status(self) -> bool:
        """Kiểm tra thiết bị có online và nhận lệnh không"""
        return self.connect()
