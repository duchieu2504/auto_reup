# Hướng Dẫn Cài Đặt & Sử Dụng Dự Án Auto Reup TikTok (Bản Nâng Cấp)

Tài liệu này hướng dẫn chi tiết cách cài đặt và sử dụng hệ thống Tự động hóa TikTok, bao gồm các tính năng mới nhất như Trình duyệt ẩn danh (GPM), Nuôi tài khoản giả lập (ADB) và Tăng tốc phần cứng (GPU).

---

## 📌 Phần 1: Yêu cầu hệ thống (System Requirements)

Để hệ thống hoạt động đầy đủ chức năng, máy tính của người dùng cần được cài đặt:

1. **[Git](https://git-scm.com/)**: Tải mã nguồn.
2. **[Docker Desktop](https://www.docker.com/products/docker-desktop/)**: Để chạy máy chủ (Backend/Frontend/Database) và Redis.
3. **[GPM Login](https://gpmlogin.com/)** *(Tùy chọn nhưng khuyến nghị)*: Phần mềm quản lý trình duyệt ẩn danh (Anti-detect browser) dùng để đăng nhập và tải video lách luật. Cần bật API trong phần cài đặt của GPM.
4. **Giả lập Android (LDPlayer / MEmu / Nox)** *(Tùy chọn nhưng khuyến nghị)*: Dùng cho tính năng "Nuôi Tài Khoản" (Warmup). Cần bật tính năng **ADB Debugging** (Gỡ lỗi USB) trong cài đặt của giả lập.
5. **VGA/GPU (Intel/Nvidia)** *(Tùy chọn)*: Hỗ trợ tăng tốc độ render video (FFMPEG Hardware Acceleration).

---

## ⚙️ Phần 2: Cài đặt và Khởi chạy

### Bước 1: Tải mã nguồn và Khởi động Hệ thống
1. Mở Terminal (Command Prompt hoặc PowerShell) tại nơi bạn muốn lưu dự án.
2. Tải code về:
   ```bash
   git clone <đường_link_repository_github>
   cd auto_reup_tiktok
   ```
3. Khởi động Docker Desktop (để phần mềm chạy ngầm).
4. *(Dành riêng cho máy có GPU hỗ trợ FFMPEG)*: Mở file `docker-compose.yml`, kiểm tra và thêm cấu hình GPU (ví dụ mapping `/dev/dri:/dev/dri` đối với chip Intel, hoặc cài Nvidia Container Toolkit đối với card Nvidia) nếu muốn dùng tăng tốc phần cứng. 
5. Chạy lệnh sau để tự động tải thư viện và chạy hệ thống:
   ```bash
   docker-compose up -d --build
   ```
   *(Quá trình này có thể mất 5-10 phút trong lần chạy đầu tiên).*

### Bước 2: Truy cập Web và Cấu hình Ban đầu
1. Mở trình duyệt web của bạn và truy cập: 👉 **http://localhost:5173**
2. Chuyển sang Tab **⚙️ Cài đặt (Settings)** trên giao diện web.
3. Điền các thông số bắt buộc:
   - **Gemini API Key:** (Bắt buộc) Dùng để dịch thuật và phân tích vai Nam/Nữ.
   - **Groq API Key:** (Tùy chọn) Dùng cho Whisper siêu tốc (Nhận diện giọng nói). Bật công tắc Groq nếu muốn dùng.
   - **GPM API URL:** Nếu bạn dùng GPM Login, điền đường dẫn API (Thường là `http://127.0.0.1:19995`).
   - **Tăng tốc phần cứng (GPU):** Bật công tắc này nếu máy bạn hỗ trợ Intel QSV hoặc Nvidia NVENC.
4. Nhấn **Lưu cấu hình**. (Hệ thống sẽ tự động lưu các thông số này vào file `.env` ở Backend).

---

## 🚀 Phần 3: Hướng dẫn sử dụng các chức năng chính

### 1. Nuôi Tài Khoản (Warmup Engine)
*Đây là chức năng tự động lướt TikTok trên Giả Lập Android để tăng độ Trust cho tài khoản.*
1. Mở Giả lập Android (VD: LDPlayer) và mở ứng dụng TikTok (đã đăng nhập sẵn tài khoản cần nuôi).
2. Đảm bảo ADB trong Giả lập đã được bật (Cổng mặc định thường là `emulator-5554` hoặc `127.0.0.1:5555`).
3. Trên Web, vào Tab **📱 Nuôi Tài Khoản**. Nhấn "Quét thiết bị giả lập".
4. Thiết lập thời gian (VD: Lướt 3-5 video, random xem bao nhiêu giây). Hệ thống sẽ sử dụng AI để tự động tìm icon 🤍 (Tym) và tương tác một cách cực kỳ tự nhiên.

### 2. Cào Video (Scraping)
1. Chuyển sang Tab **🕷️ Cào Video**.
2. Nhập Link một Video TikTok (hoặc Profile) bạn muốn cào.
3. Video sẽ được tải xuống hoàn toàn tự động, loại bỏ watermark (logo TikTok).

### 3. Xử lý & Edit Video (Video Editor)
1. Chuyển sang Tab **🎬 Lịch Sử** (nơi chứa các video vừa cào về).
2. Các video mới tải sẽ có trạng thái "Chờ xử lý" (Dấu tích xanh ở cột Tải về).
3. Nhấn vào nút **Play (Cấu hình & Xử lý)** trên video (hoặc tích chọn nhiều video và nhấn nút "Xử lý N mục" ở góc phải).
4. Chọn **Giọng đọc AI (TTS)**, Style Phụ Đề, và các tùy chọn lách bản quyền (Lật gương, Zoom, Chỉnh màu, Đổi tần số âm).
5. Nhấn **Xác nhận & Xử lý**. Hệ thống sẽ tự động tách lời, dịch thuật AI và render ra file thành phẩm. 

### 4. Upload tự động (GPM Anti-Detect)
1. Sau khi xử lý xong, vào Tab **🚀 Tự Động Đăng**.
2. Chọn Profile GPM chứa kênh TikTok của bạn.
3. Chọn Video thành phẩm, thiết lập Giờ đăng (Lên lịch) và Caption.
4. Hệ thống sẽ kết nối với GPM Login, tự mở profile ẩn danh tương ứng và đăng video hoàn toàn giống thao tác người thật, qua mặt hệ thống kiểm duyệt bot của TikTok.

---
*Hệ thống được phát triển chuyên biệt cho môi trường Windows kết hợp kiến trúc Microservices (Docker + Celery) và tự động hóa giả lập đa thiết bị.*
