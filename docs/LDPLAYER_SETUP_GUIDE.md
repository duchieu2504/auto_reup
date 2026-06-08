# Hướng Dẫn Setup Giả Lập LDPlayer Cho Hệ Thống Auto TikTok

Tài liệu này hướng dẫn chi tiết cách cấu hình giả lập **LDPlayer** để chạy mượt mà hệ thống tự động hóa TikTok (Auto Reup). Việc cài đặt đúng chuẩn giúp tối ưu hiệu năng, giảm thiểu tỷ lệ crash app, và đảm bảo bot nhận diện giao diện chính xác 100%.

---

## 1. Phiên Bản Khuyên Dùng
- **LDPlayer 9**: Sử dụng nhân Android 9 (Pie). 
- *Tuyệt đối không dùng LDPlayer 4 (Android 7)* vì các phiên bản TikTok mới yêu cầu cấu hình và nhân hệ điều hành cao hơn, chạy trên Android 7 rất dễ văng ứng dụng khi render video.

---

## 2. Cấu Hình Thông Số Giả Lập (Cài đặt góc phải trên LDPlayer)

Vào bánh răng **Cài đặt (Settings)** của LDMultiPlayer hoặc trên chính cửa sổ LDPlayer:

### ⚙️ Cài đặt Cơ bản (Basic)
- **Quyền Root**: Bắt buộc chọn **Mở / Bật (Enable)**.
  - *Lý do:* Hệ thống Python cần đẩy file `.mp4` vào thư viện máy và quét UI thông qua quyền root.
- **Gỡ lỗi ADB (ADB debugging)**: Bắt buộc chọn **Mở kết nối (Open connection)**.
  - *Lý do:* Để code có thể giao tiếp với giả lập qua port nội bộ (127.0.0.1).

### 🖥️ Nâng cao (Advanced)
- **Độ phân giải**: Chọn **Điện thoại (Mobile)**.
- **Kích thước**: Bắt buộc để `720 x 1280` (DPI `320`).
  - *Lý do:* Hệ thống bot được căn chuẩn toạ độ tương đối (Percentage-based clicks) dựa trên tỷ lệ màn hình dọc phổ biến này. Tối ưu nhẹ máy khi chạy nhiều tab.
- **CPU**: `2 Cores`.
- **RAM**: Khuyên dùng từ `3072 MB (3GB)` đến `4096 MB (4GB)`. Tối thiểu là `2048 MB (2GB)`.
  - *Lý do:* TikTok cực kỳ ngốn RAM lúc tải và render video up lên. Dưới 2GB sẽ bị văng (crash) giữa chừng.

### 📱 Kiểu máy (Model)
- Chọn các dòng máy cao cấp phổ biến như `Samsung Galaxy S21`, `S22 Ultra`, hoặc `Google Pixel 4 / 5`.
- **ĐẶC BIỆT LƯU Ý**: Với mỗi máy ảo (cho 1 tài khoản TikTok riêng biệt), bạn phải bấm **Cài đặt ngẫu nhiên (Random)** mã IMEI, IMSI, và Android ID.
  - *Lý do:* TikTok cực kỳ nhạy cảm với nhận diện thiết bị (Device Fingerprint). Nếu 10 kênh chạy chung 1 ID thiết bị, kênh sẽ bị "bóp" tương tác ngay lập tức (Shadowban).

---

## 3. Cài Đặt Bên Trong Hệ Điều Hành Android (Quan trọng)

Mở giả lập lên, vào app **Cài đặt (Settings)** của hệ điều hành Android và thực hiện 2 bước cực kỳ quan trọng sau:

### 🚀 Bước 1: Tắt hoàn toàn Animation (Chống delay Bot)
1. Vào **Settings** -> **About Tablet/Phone** (Giới thiệu về điện thoại).
2. Bấm liên tục 7 lần vào dòng **Build number** (Số bản dựng) cho đến khi hiện thông báo "You are now a developer!".
3. Trở ra ngoài, vào **Developer options** (Tùy chọn nhà phát triển).
4. Tìm và TẮT (Chuyển về `Animation off`) cả 3 dòng sau:
   - *Window animation scale*
   - *Transition animation scale*
   - *Animator duration scale*
> **Mục đích:** Khi bot ấn các nút, màn hình chuyển ngay lập tức mà không có hiệu ứng zoom hay mờ dần. Giúp bot quét giao diện không bị sai lệch thời gian, cực kỳ mượt mà.

### ⌨️ Bước 2: Thiết lập ADBKeyboard
Hệ thống sử dụng bàn phím ảo tàng hình `ADBKeyboard` để gõ Captions tiếng Việt có chứa Hashtag mà không bị lỗi.
1. Khởi động bot ít nhất 1 lần để bot tự động tải và cài `ADBKeyboard.apk` vào máy.
2. Vào **Settings** -> **System** -> **Language & input** -> **Virtual keyboard** -> **Manage keyboards**.
3. Bật công tắc cho **ADB Keyboard**.
4. Mở ứng dụng Ghi chú hoặc bất kỳ chỗ nào có ô nhập văn bản để bàn phím Google hiện lên.
5. Ấn vào biểu tượng chuyển đổi bàn phím ở góc dưới cùng, chọn **ADB Keyboard** làm mặc định.
> **Lưu ý:** Khi chọn xong, bàn phím trên màn hình sẽ biến mất hoàn toàn (tàng hình). Đây là dấu hiệu cho thấy bạn đã cài đặt đúng!

---

## 4. Quản Lý Proxy Cho Hệ Thống Nuôi Nhiều Kênh

Nếu bạn sử dụng tính năng tự động đăng video cho nhiều thị trường (Mỹ, Anh, Việt Nam...):
- **KHÔNG dùng VPN trên máy tính gốc**: Vì nó sẽ đổi IP của tất cả giả lập cùng lúc.
- **Sử dụng Proxy riêng cho từng máy ảo**: 
  - Tải app quản lý Proxy (như `College Proxy`, `v2rayNG`, `Potatso`...) cài thẳng vào từng máy ảo LDPlayer.
  - Mỗi máy ảo điền 1 IP Proxy tĩnh cố định.
- Tắt tính năng tự động đồng bộ giờ hệ thống. Chọn múi giờ (Timezone) trong cài đặt Android khớp với quốc gia của Proxy đó.

---

## 5. Quy Trình Nhân Bản Chuẩn
Để không phải làm đi làm lại các cài đặt trên, hãy tạo ra 1 cái "Khuôn" (Template):
1. Làm đủ các bước 1 -> 3 vào Máy số 0 (Máy khuôn). Đừng đăng nhập TikTok vội.
2. Tắt Máy số 0 đi. Mở **LDMultiPlayer**.
3. Chọn máy số 0 -> **Nhân bản (Clone)** ra số lượng máy bạn muốn (Máy 1, Máy 2, Máy 3...).
4. Mở từng máy vừa nhân bản lên -> Vào Cài đặt giả lập -> **BẤM RANDOM LẠI IMEI / ANDROID ID**.
5. Đăng nhập TikTok, gán Proxy vào, và ném cho Bot chạy!

Chúc bạn nuôi kênh thuận lợi và "lên xu hướng"! 🦊🚀
