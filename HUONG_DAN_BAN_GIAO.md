# Hướng Dẫn Bàn Giao & Cài Đặt Dự Án Auto Reup TikTok

Tài liệu này hướng dẫn cách bàn giao dự án qua GitHub và các bước chi tiết để người nhận (đối tác, người kiểm thử) có thể tự cài đặt và chạy hệ thống trên máy của họ.

---

## Phần 1: Dành cho người gửi (Bạn) - Cách bàn giao dự án

Vì dự án đã được tích hợp `.gitignore`, bạn không cần phải nén file thủ công nữa. Hệ thống Git sẽ tự động loại bỏ các file nhạy cảm (như `.env`, thư mục `data/`, `node_modules/`).

Cách bàn giao chuyên nghiệp nhất:
1. Đẩy toàn bộ mã nguồn lên một Repository (kho lưu trữ) trên GitHub (nên để chế độ Private).
2. Thêm người nhận vào danh sách **Collaborators** trong phần Settings của Repository để cấp quyền truy cập cho họ.
3. Gửi cho họ đường link của Repository cùng với hướng dẫn ở Phần 2.

---

## Phần 2: Dành cho người nhận - Hướng dẫn cài đặt và sử dụng

### 📌 Yêu cầu hệ thống (System Requirements)
Máy tính của người kiểm thử cần phải cài đặt sẵn các phần mềm sau:
1. **[Git](https://git-scm.com/)**: Để tải mã nguồn từ GitHub về máy.
2. **[Docker Desktop](https://www.docker.com/products/docker-desktop/)**: Để chạy máy chủ Backend, Frontend và Database.
3. **[Node.js (Bản LTS)](https://nodejs.org/)**: Để chạy hệ thống nhận diện tài khoản TikTok (Local Agent).
4. **Trình duyệt Google Chrome**: Hệ thống bắt buộc dùng Chrome để trích xuất Cookie tài khoản TikTok.

### ⚙️ Các bước cài đặt chi tiết

**Bước 1: Tải mã nguồn (Clone) và Cấu hình Môi trường**
1. Mở Terminal (Command Prompt hoặc PowerShell) tại nơi bạn muốn lưu dự án.
2. Chạy lệnh clone để tải code về:
   ```bash
   git clone <đường_link_repository_github>
   cd auto_reup_tiktok
   ```
3. Tạo file `.env` từ file mẫu:
   - Copy file `.env.example` và đổi tên bản sao thành `.env`.
4. Mở file `.env` bằng Notepad và đảm bảo điền key API của Gemini:
   ```env
   GEMINI_API_KEY=điền_key_gemini_của_bạn_vào_đây
   ```

**Bước 2: Khởi động hệ thống Docker (Backend + Frontend + DB)**
1. Mở phần mềm **Docker Desktop** (để nó chạy ngầm).
2. Tại Terminal đang ở thư mục `auto_reup_tiktok`, chạy lệnh sau để tự động tải và cài đặt mọi thứ:
   ```bash
   docker-compose up -d --build
   ```
   *(Quá trình này có thể mất 5-10 phút trong lần chạy đầu tiên).*

**Bước 3: Khởi động Hệ thống Liên kết TikTok (Local Agent)**
1. Mở thư mục `local_agent`.
2. Lần đầu tiên chạy, click đúp chuột vào file:
   👉 **`install_agent.bat`** (File này sẽ cài đặt thư viện tự động, chỉ cần chạy 1 lần).
3. Đợi cài xong, click đúp chuột vào file:
   👉 **`DangNhapTiktok.bat`**.
4. Một cửa sổ Chrome đen mờ sẽ hiện lên (hoặc mở ẩn). Lúc này **KHÔNG ĐƯỢC TẮT** cửa sổ terminal màu đen của Local Agent. Hãy cứ để nó chạy ngầm.

### 🚀 Cách sử dụng hệ thống

1. **Truy cập Giao Diện Web**: Mở trình duyệt web của bạn và truy cập:
   👉 **http://localhost:5173**
2. **Liên kết tài khoản TikTok**: 
   - Trên web, vào mục "Tài khoản TikTok" -> Bấm "Thêm tài khoản".
   - Trình duyệt Chrome sẽ tự nhảy ra trang đăng nhập TikTok. Bạn hãy quét mã QR hoặc đăng nhập tay.
   - Khi đăng nhập thành công, tắt trình duyệt đó đi, dữ liệu Avatar và Tên sẽ được đồng bộ.
3. **Thêm Video**: 
   - Đưa các video gốc cần xử lý vào thư mục `data/raw_videos/`.
   *(Lưu ý: Do Git đã chặn thư mục `data`, nếu hệ thống chưa tự tạo thư mục này, bạn hãy tạo thủ công thư mục `data/raw_videos/` ở thư mục gốc dự án).*
4. **Xử lý Video**: 
   - Trên web, vào tính năng "Xử lý hàng loạt", chọn thư mục và tùy chỉnh giọng nói AI / âm lượng.
   - Nhấn "Bắt đầu xử lý" để máy tự động Dịch thuật, Lồng tiếng AI và Xóa phụ đề gốc.
   
---
*Hệ thống được phát triển chuyên biệt cho môi trường Windows kết hợp kiến trúc Microservices (Docker + Local Puppeteer).*
