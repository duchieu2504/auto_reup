# BẢNG THEO DÕI LỖI (ERRORS LOG)

## [2026-04-25 15:51] - Lỗi không tìm thấy lệnh PIP (Infrastructure Error)

- **Type**: Process & Test Failure (Infrastructure Fail)
- **Severity**: High
- **File**: `N/A`
- **Agent**: fox
- **Root Cause**: Máy Windows của người dùng chưa cài đặt Python, hoặc cài đặt rồi nhưng chưa thêm `pip` vào biến môi trường `PATH`.
- **Error Message**: 
  ```text
  pip : The term 'pip' is not recognized as the name of a cmdlet, function, script file, or operable program.
  ```
- **Fix Applied**: Đề xuất kiểm tra `py --version`, tải Python và nhớ tick "Add to PATH", hoặc dùng lệnh thay thế.
- **Prevention**: Thêm bước kiểm tra môi trường Python vào quy trình trước khi cài đặt requirements trên Windows.
- **Status**: Fixed
---

## [2026-04-25 16:14] - AutoTrading Disabled (Integration Error)

- **Type**: Integration Error (MT5 Config)
- **Severity**: High
- **File**: `execution.py`
- **Agent**: emyeu
- **Root Cause**: Bot bắn lệnh thành công đến MT5 nhưng bị phần mềm MT5 từ chối do tính năng "Algo Trading" đang bị tắt trên giao diện người dùng.
- **Error Message**: 
  ```text
  retcode=10027, comment=AutoTrading disabled by client
  ```
- **Fix Applied**: Hướng dẫn người dùng bật nút "Algo Trading" trên thanh công cụ của phần mềm MT5.
- **Prevention**: Thêm cảnh báo hoặc code kiểm tra trạng thái `mt5.terminal_info().trade_allowed` ở đầu script.
- **Status**: Fixed
---

## [2026-04-25 16:28] - UnicodeEncodeError in Logging (Runtime Error)

- **Type**: Runtime Error
- **Severity**: Medium
- **File**: `main.py`
- **Agent**: emyeu
- **Root Cause**: Windows mặc định dùng encoding `cp1252` nên không thể ghi các ký tự tiếng Việt (ví dụ chữ 'ạ' trong "Trạng thái DCA") vào file `bot.log`.
- **Error Message**: 
  ```text
  UnicodeEncodeError: 'charmap' codec can't encode character '\u1ea1'
  ```
- **Fix Applied**: Bổ sung tham số `encoding="utf-8"` vào hàm `logging.FileHandler("bot.log")`.
- **Prevention**: Luôn set `encoding="utf-8"` khi xử lý File I/O trên Windows.
- **Status**: Fixed
---

## [2026-05-23 20:15] - WinError 2: The system cannot find the file specified (yt-dlp)

- **Type**: Runtime Error
- **Severity**: High
- **File**: `backend/app/services/crawler/douyin_scraper.py`
- **Agent**: fox
- **Root Cause**: `subprocess.run` kh�ng t�m th?y `yt-dlp.exe` trong PATH.
- **Error Message**: 
  ```n  [WinError 2] The system cannot find the file specified
  ```
- **Fix Applied**: D�ng `sys.executable -m yt_dlp`. Th�m `bot.log`.
- **Prevention**: Lu�n g?i Python module b?ng sys.executable.
- **Status**: Fixed

---

## [2026-05-24 10:50] - Edge-TTS "No audio was received" do k� t? d?c bi?t

- **Type**: Integration Error
- **Severity**: Medium
- **File**: backend/app/services/processor/tts_generator.py
- **Agent**: @backend-specialist
- **Root Cause**: Edge-TTS API t? ch?i ph?n h?i (No audio was received) khi van b?n ch?a c�c k� t? d?c bi?t nhu ~, *, [, ], <, > ho?c kho?ng tr?ng/d?u ng?t c�u b?t thu?ng. C�c k� t? n�y l�m h?ng c?u tr�c SSML c?a Edge TTS.
- **Error Message**: 
  ``r
  No audio was received. Please verify that your parameters are correct.
  ``r
- **Fix Applied**: Th�m bu?c sanitize van b?n, d�ng e.sub lo?i b? to�n b? c�c k� t? ph� v? d?nh d?ng tru?c khi g?i API Edge-TTS. Gi? nguy�n text hi?n th? tr�n video, ch? thay d?i do?n text g?i cho AI l?ng ti?ng.
- **Prevention**: Lu�n sanitize (l�m s?ch) chu?i van b?n g?i v�o TTS API.
- **Status**: Fixed
---

## [2026-05-25 21:21] - API /aweme/detail/ trả về dữ liệu rỗng (Logic Error)

- **Type**: Logic Error
- **Severity**: Medium
- **File**: `backend/app/services/crawler/douyin_api.py`
- **Agent**: fox
- **Root Cause**: Douyin WAF/Anti-bot chặn API `/aweme/v1/web/aweme/detail/` đối với link video đơn lẻ dù đã có XBogus và aid, khiến `data.get("aweme_detail")` bị rỗng. API của profile `/aweme/post/` thì vẫn hoạt động.
- **Error Message**: 
  ```text
  [*] Phát hiện link video đơn lẻ: 7640334063244414217
  [!] Không tìm thấy chi tiết video. Link lỗi, video bị xóa hoặc bị chặn.
  ```
- **Fix Applied**: Đã thêm log vào đây để tiện theo dõi. Sắp tới sẽ phải đổi phương pháp (VD: parse thẻ HTML RENDER_DATA hoặc đổi endpoint) nếu tính năng lấy link đơn lẻ cần thiết.
- **Prevention**: Luôn dự phòng phương án cào HTML thuần khi API Native có dấu hiệu bị chặn cục bộ.
- **Status**: Deferred
---

## [2026-05-26 17:05] - Cào video đơn lẻ thất bại do Cookie bị can thiệp (Integration Error)

- **Type**: Integration Error
- **Severity**: High
- **File**: ackend/app/services/crawler/douyin_scraper.py
- **Agent**: fox
- **Root Cause**: Người dùng thử nghiệm xóa vài ký tự trong Cookie và lưu lại. Backend gửi Cookie bị hỏng này lên Douyin, khiến API /aweme/v1/web/aweme/detail/ phát hiện giả mạo và từ chối trả về chi tiết video (dữ liệu rỗng). Celery Worker sử dụng Cookie này để cào video nên thất bại.
- **Error Message**: 
  `	ext
  [!] Không tìm thấy chi tiết video. Link lỗi, video bị xóa hoặc bị chặn.
  `
- **Fix Applied**: Nâng cấp hàm alidate_keys (dùng DouyinAPIClient) để chặn ngay việc lưu Cookie hỏng. Giải thích cho người dùng hiểu cần dùng Cookie nguyên vẹn hoặc để trống hoàn toàn (Guest mode).
- **Prevention**: Luôn dùng API thực tế với chữ ký _bogus để xác thực Cookie thay vì chỉ check HTTP 200.
- **Status**: Fixed
---


## [2026-06-15 11:26] - NameError: name 'DATA_DIR' is not defined (Runtime Error)

- **Type**: Runtime Error
- **Severity**: High
- **File**: ackend/app/api/settings.py:388
- **Agent**: fox
- **Root Cause**: Bổ sung endpoint /upload-background sử dụng biến DATA_DIR nhưng quên import từ pp.core.config.
- **Error Message**:
  `	ext
  NameError: name 'DATA_DIR' is not defined
  `
- **Fix Applied**: Thêm dòng import rom app.core.config import DATA_DIR ở đầu file ackend/app/api/settings.py.
- **Prevention**: Luôn chạy biên dịch kiểm thử code python (py_compile hoặc static analyzer) sau mỗi lần cập nhật file.
- **Status**: Fixed
---
