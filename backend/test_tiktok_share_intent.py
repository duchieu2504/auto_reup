import subprocess
import time
import re
import argparse
import os

def run_adb(cmd, device_id=None):
    base_cmd = ["adb"]
    if device_id:
        base_cmd.extend(["-s", device_id])
    base_cmd.extend(cmd.split())
    print(f"Executing: {' '.join(base_cmd)}")
    result = subprocess.run(base_cmd, capture_output=True, text=True)
    return result.stdout.strip()

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--device", help="Device ID (IP or serial)")
    parser.add_argument("--video", help="Path to local video file", default="test_video.mp4")
    parser.add_argument("--pkg", help="Tiktok Package Name", default="com.zhiliaoapp.musically")
    args = parser.parse_args()
    
    device_id = args.device
    if device_id and ":" in device_id:
        print(f"Đang kết nối tới thiết bị {device_id}...")
        run_adb(f"connect {device_id}")
        
    if not device_id:
        print("Lấy danh sách thiết bị ADB...")
        devices_out = run_adb("devices")
        lines = devices_out.split('\n')[1:]
        devices = [line.split('\t')[0] for line in lines if '\t' in line]
        if not devices:
            print("Không tìm thấy thiết bị ADB nào đang được kết nối trong Docker!")
            print("Vui lòng chạy lệnh kèm theo IP. Ví dụ: python test_tiktok_share_intent.py --device host.docker.internal:5555")
            return
        device_id = devices[0]
        print(f"Tự động chọn thiết bị: {device_id}")
        
    # Tạo một file video giả để test nếu chưa có
    if not os.path.exists(args.video):
        print(f"Không tìm thấy file {args.video}, đang tạo một file video rỗng để test...")
        with open(args.video, "wb") as f:
            f.write(b"\x00" * 1024) # 1KB dummy file (TikTok có thể từ chối video hỏng, tốt nhất nên dùng video thật)
        print("LƯU Ý: Đã tạo video giả. TikTok có thể báo 'Video bị hỏng' nhưng quan trọng là nó CÓ MỞ VÀO MÀN HÌNH EDIT HAY KHÔNG.")

    remote_path = f"/sdcard/DCIM/Camera/test_share_tiktok_{int(time.time())}.mp4"
    
    # 1. Chép file vào điện thoại
    print(f"\n1. Chép video {args.video} vào {remote_path}...")
    run_adb(f"push {args.video} {remote_path}", device_id)
    
    # 2. Cập nhật Media Store
    print("\n2. Cập nhật Media Scanner...")
    run_adb(f"shell am broadcast -a android.intent.action.MEDIA_SCANNER_SCAN_FILE -d file://{remote_path}", device_id)
    time.sleep(3)
    
    # 3. Truy vấn Content URI từ MediaStore
    print("\n3. Lấy Content URI từ MediaStore (Android 7+ yêu cầu URI content:// thay vì file://)...")
    query_cmd = f"shell content query --uri content://media/external/video/media --projection _id,_data"
    query_out = run_adb(query_cmd, device_id)
    
    content_uri = None
    # Ví dụ output: Row: 0 _id=123, _data=/sdcard/DCIM/Camera/test_share.mp4
    for line in query_out.split('\n'):
        if remote_path in line:
            match = re.search(r'_id=(\d+)', line)
            if match:
                video_id = match.group(1)
                content_uri = f"content://media/external/video/media/{video_id}"
                break
                
    if not content_uri:
        print("Không thể lấy Content URI, thử fallback dùng file:// URI...")
        content_uri = f"file://{remote_path}"
    else:
        print(f"Đã tìm thấy Content URI hợp lệ: {content_uri}")
        
    # 4. Gắn cờ quyền cho Content URI và Share sang Tiktok
    print(f"\n4. Bắn Share Intent sang Tiktok ({args.pkg})...")
    # Sử dụng action SEND, chỉ định type video/mp4, extra stream là URI video.
    # --grant-read-uri-permission (cờ 1) để Tiktok có quyền đọc content URI này
    share_cmd = f"shell am start -a android.intent.action.SEND -t video/mp4 --eu android.intent.extra.STREAM {content_uri} -f 1 -p {args.pkg}"
    
    # Ép Tiktok đóng trước để Share Intent kích hoạt sạch sẽ
    run_adb(f"shell am force-stop {args.pkg}", device_id)
    time.sleep(2)
    
    out = run_adb(share_cmd, device_id)
    print("\nKết quả lệnh Share:")
    print(out)
    print("\n>>> KIỂM TRA ĐIỆN THOẠI XEM TIKTOK ĐÃ MỞ VÀO MÀN HÌNH CHỈNH SỬA / TẢI LÊN CHƯA! <<<")

if __name__ == "__main__":
    main()
