import sys
import os
import time
from app.services.uploader.adb_engine import ADBUploader

def test_adb():
    print("=== KIỂM TRA ĐỘNG CƠ ADB UPLOAD (GIAI ĐOẠN 4) ===")
    
    # Giả lập data của một tài khoản Douyin kết nối qua ADB
    # Thay đổi IP:PORT theo thiết bị giả lập thực tế của bạn
    # VD: LDPlayer mặc định là 127.0.0.1:5555, Nox là 127.0.0.1:62001
    account_data = {
        "platform": "douyin",
        "auth_data": "host.docker.internal:5555" # <- Thay IP ở đây nếu cần (5555 là cổng của LDPlayer/BlueStacks)
    }
    
    engine = ADBUploader(account_data)
    
    print(f"[*] Đang kết nối tới thiết bị: {engine.adb_ip}...")
    if not engine.check_status():
        print("[-] LỖI: Không thể kết nối tới thiết bị ADB. Hãy chắc chắn máy ảo đang mở và IP chính xác.")
        return
        
    print("[+] Kết nối ADB thành công!")
    
    # Tạo một file video ảo để test Push
    test_video_path = "test_video_adb.mp4"
    if not os.path.exists(test_video_path):
        with open(test_video_path, "wb") as f:
            f.write(b"dummy video content")
            
    try:
        print(f"[*] Tiến hành Upload thử nghiệm...")
        # Gọi hàm upload
        result_url = engine.upload(test_video_path, "Video test từ Cỗ máy Antigravity", "#test #adb")
        print(f"[+] Upload hoàn tất! Trả về link: {result_url}")
    except Exception as e:
        print(f"[-] Lỗi trong quá trình upload: {e}")
    finally:
        # Xoá file rác
        if os.path.exists(test_video_path):
            os.remove(test_video_path)

if __name__ == "__main__":
    test_adb()
