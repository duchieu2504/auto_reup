# 📖 HƯỚNG DẪN SỬ DỤNG HỆ THỐNG AUTO RE-UP TIKTOK / DOUYIN
*(Cỗ Máy Kiếm Tiền Tự Động Toàn Diện - Phiên Bản Antigravity)*

---

## 🚀 TỔNG QUAN HỆ THỐNG
Dự án **Auto Re-up** là một hệ thống tự động hoá 100% quy trình xây dựng kênh video ngắn (TikTok, Douyin, Shorts, Reels). Hệ thống thay thế hoàn toàn một đội ngũ Edit và Đăng bài thủ công bằng cách sử dụng Trí tuệ nhân tạo (AI) và Tự động hóa trình duyệt/giả lập.

Hệ thống được chia làm **4 Quy trình cốt lõi**:
1. **Cào Video (Crawler)**: Quét và tải video không logo hàng loạt.
2. **Biến Đổi Video (Processor)**: Xóa metadata, lách bản quyền, dịch phụ đề Trung-Việt bằng AI, thêm nhạc nền.
3. **Quản Trị MXH (Accounts)**: Quản lý không giới hạn tài khoản vệ tinh.
4. **Lên Lịch & Đăng Tự Động (Scheduler)**: AI tự viết Caption, hệ thống tự động điều khiển Trình duyệt ẩn danh hoặc Máy ảo Điện thoại để đăng bài 24/7.

---

## 🛠️ YÊU CẦU CHUẨN BỊ
Dành cho người mới bắt đầu, bạn cần chuẩn bị:
- **Google Gemini API Key**: Dùng để dịch phụ đề và viết Caption thông minh (Miễn phí lấy tại Google AI Studio).
- **Phần mềm giả lập Android (Tùy chọn)**: Như LDPlayer, Nox, BlueStacks nếu bạn muốn đăng bài qua phương thức thao tác màn hình điện thoại (ADB).
- **Trình duyệt (Tùy chọn)**: Lấy Cookie của các tài khoản mạng xã hội nếu đăng bằng phương thức Web.

---

## 📚 HƯỚNG DẪN TỪNG BƯỚC SỬ DỤNG (STEP-BY-STEP)

### BƯỚC 1: CẤU HÌNH HỆ THỐNG (Settings)
1. Truy cập tab **Cấu hình (Settings)** ở menu bên trái.
2. Nhập **Gemini API Key** vào ô tương ứng và lưu lại.
3. (Tùy chọn) Điền API Key của Apify nếu bạn sử dụng công cụ Crawler cấp cao.
4. Cấu hình lịch trình quét (Cronjob) nếu bạn am hiểu kỹ thuật.

### BƯỚC 2: CÀO VIDEO (Crawler)
1. Vào tab **Cào Video Douyin**.
2. Nhập Link một Video bất kỳ hoặc Link một Kênh (Profile) bạn muốn "đánh cắp" ý tưởng.
3. Nhấn **Quét Video**, hệ thống sẽ bóc tách và tải file `mp4` gốc về ổ cứng (100% không có logo/watermark).

### BƯỚC 3: XỬ LÝ & LÁCH BẢN QUYỀN (Processor)
Đây là công đoạn biến Video của người khác thành "Video Của Mình".
1. Chuyển sang tab **Upload File Xử Lý** (hoặc hệ thống tự động đẩy từ bước 2 sang).
2. Lựa chọn các tùy chọn Lách bản quyền cực mạnh:
   - *Lật ngang video* (Mirror).
   - *Thay đổi tốc độ* (Làm nhanh/chậm video để qua mặt bot kiểm duyệt).
   - *Dịch thuật AI*: Hệ thống tự động nghe âm thanh tiếng Trung, dịch sang Tiếng Việt và in thẳng Phụ đề cứng lên video.
   - *Lồng nhạc nền*: Tự chèn nhạc xu hướng.
3. Bấm **Bắt đầu xử lý** và đợi máy chủ Render ra thành phẩm.

### BƯỚC 4: QUẢN LÝ TÀI KHOẢN MXH (Social Accounts)
1. Vào tab **Tài khoản MXH**.
2. Thêm các kênh "Vệ tinh" của bạn vào đây.
3. Tại mục **Cấu hình kết nối**:
   - Nhập **Cookie** nếu bạn đăng qua nền tảng Web.
   - Nhập **IP:Port** (Ví dụ `host.docker.internal:5555`) nếu bạn đăng qua giả lập điện thoại (LDPlayer).

### BƯỚC 5: LÊN LỊCH ĐĂNG TỰ ĐỘNG (Upload Schedule)
Bây giờ bạn đã có Video đã xào nấu và Tài khoản MXH, tiến hành rải bom:
1. Vào tab **Lịch Đăng Bài**.
2. Chọn Video vừa Edit xong.
3. Check chọn 1, hoặc 10, hoặc 100 Tài khoản MXH mà bạn muốn đăng.
4. Bấm nút **Tự viết bằng AI**: Gemini sẽ quét nội dung video, sáng tác ra một caption cực giật tít kèm 5 hashtag #trending.
5. Chọn Hẹn Giờ Đăng (Sáng, Trưa, Chiều, Tối).
6. Bấm **Xác nhận lên lịch**.

### BƯỚC 6: THEO DÕI & TẬN HƯỞNG
Bạn có thể tắt trình duyệt và đi cafe. Hệ thống **Celery Beat** dưới nền sẽ chạy đếm ngược 24/7.
- Đến đúng giờ, con Bot sẽ tỉnh dậy.
- Nó sẽ tự mở Trình duyệt ẩn danh (hoặc bật App trên điện thoại giả lập của bạn).
- Upload video, gõ caption, bấm đăng bài như một người dùng thật.
- Báo cáo kết quả và trả link bài viết vào bảng điều khiển.

---

## ⚠️ CÁC TRƯỜNG HỢP XỬ LÝ SỰ CỐ THƯỜNG GẶP
- **Hệ thống mất dữ liệu lịch sử:** Nếu có yêu cầu "Purge Data" (Dọn dẹp bộ nhớ Docker) do tràn ổ C, dữ liệu thống kê sẽ mất. Hãy vào Cài đặt điền lại API là được. Video gốc vẫn an toàn.
- **Bot ADB không điều khiển được điện thoại:** Hãy chắc chắn Emulator (Máy ảo) đang bật trước khi đến giờ Hẹn đăng bài, và cổng Port (`5555`) phải chính xác.
- **Lỗi dịch Subtitles (Phụ đề):** Đảm bảo API Key của Gemini không bị giới hạn quota, và video gốc phải có tiếng nói rõ ràng để AI Whisper có thể nhận diện âm thanh.

*Chúc bạn xây dựng được một Đế chế Truyền thông Tự động thành công!* 🚀🦊
