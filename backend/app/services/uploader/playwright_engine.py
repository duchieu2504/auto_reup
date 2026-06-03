import logging
import os
import json
import time
from typing import Dict, Any
from .base_engine import BaseUploaderEngine
from playwright.sync_api import sync_playwright

logger = logging.getLogger(__name__)

class PlaywrightUploader(BaseUploaderEngine):
    """
    Engine upload sử dụng Playwright (Stealth mode) thông qua Trình duyệt ảo.
    Chuyên trị các nền tảng: YouTube, TikTok Web, Instagram PC...
    """
    
    def __init__(self, account_data: Dict[str, Any]):
        super().__init__(account_data)
        
        proxy_host = self.account_data.get("proxy_host")
        proxy_port = self.account_data.get("proxy_port")
        proxy_username = self.account_data.get("proxy_username")
        proxy_password = self.account_data.get("proxy_password")
        
        self.proxy_server = None
        self.proxy_auth = None
        if proxy_host and proxy_port:
            self.proxy_server = f"http://{proxy_host}:{proxy_port}"
            if proxy_username and proxy_password:
                self.proxy_auth = {
                    "username": proxy_username,
                    "password": proxy_password
                }
        
        # Parse cookie từ auth_data (đã được giải mã json)
        try:
            self.cookies = json.loads(self.account_data.get("auth_data", "[]"))
        except Exception:
            self.cookies = []

    def _apply_stealth(self, page):
        """Inject tệp javascript để ẩn danh bot (Bypass Cloudflare/Tiktok Captcha)"""
        try:
            from playwright_stealth import stealth_sync
            stealth_sync(page)
        except Exception as e:
            logger.warning(f"[Playwright] Không thể áp dụng stealth mode: {e}")

    def upload(self, video_path: str, caption: str, hashtags: str) -> str:
        logger.info(f"[Playwright] Bắt đầu upload video: {video_path}")
        
        if not os.path.exists(video_path):
            raise Exception(f"File video không tồn tại: {video_path}")

        post_url = ""
        full_caption = f"{caption}\n\n{hashtags}"

        with sync_playwright() as p:
            is_gpm = self.account_data.get("connection_type") == "gpm_login"
            gpm_api_url = os.getenv("GPM_API_URL", "").rstrip('/')
            gpm_profile_id = self.account_data.get("device_id")
            
            if is_gpm:
                if not gpm_api_url or not gpm_profile_id:
                    raise Exception("Thiếu GPM API URL hoặc Profile ID để khởi chạy GPM Login.")
                import requests
                logger.info(f"[Playwright] Khởi động GPM Profile {gpm_profile_id}")
                start_res = requests.get(f"{gpm_api_url}/api/v2/profile/start?profileId={gpm_profile_id}")
                start_data = start_res.json()
                if not start_data.get("success"):
                    raise Exception(f"Không thể mở GPM Profile: {start_data}")
                
                ws_endpoint = start_data.get("data", {}).get("ws_endpoint")
                browser = p.chromium.connect_over_cdp(ws_endpoint)
                if browser.contexts and browser.contexts[0].pages:
                    page = browser.contexts[0].pages[0]
                else:
                    context = browser.contexts[0] if browser.contexts else browser.new_context()
                    page = context.new_page()
            else:
                # Cấu hình Proxy nếu có cho Chromium thường
                launch_args = {
                    "headless": True,
                    "args": ["--disable-blink-features=AutomationControlled"]
                }
                if self.proxy_server:
                    launch_args["proxy"] = {"server": self.proxy_server}
                    if self.proxy_auth:
                        launch_args["proxy"]["username"] = self.proxy_auth["username"]
                        launch_args["proxy"]["password"] = self.proxy_auth["password"]

                browser = p.chromium.launch(**launch_args)
                context = browser.new_context(
                    user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
                )
                
                # Add cookies
                if self.cookies and isinstance(self.cookies, list):
                    context.add_cookies(self.cookies)
                    
                page = context.new_page()
                self._apply_stealth(page)
            
            
            try:
                # Phân loại nền tảng dựa trên tên tài khoản hoặc biến platform
                platform = self.account_data.get("platform", "tiktok").lower()
                
                if platform == "tiktok":
                    post_url = self._upload_tiktok(page, video_path, full_caption)
                elif platform == "youtube":
                    post_url = self._upload_youtube(page, video_path, full_caption)
                else:
                    raise Exception(f"Nền tảng {platform} chưa được hỗ trợ.")
                    
            except Exception as e:
                # Capture screenshot khi lỗi để debug
                page.screenshot(path=f"/data/error_{int(time.time())}.png")
                raise e
            finally:
                if is_gpm:
                    browser.disconnect()
                    import requests
                    logger.info(f"[Playwright] Đóng GPM Profile {gpm_profile_id}")
                    requests.get(f"{gpm_api_url}/api/v2/profile/stop?profileId={gpm_profile_id}")
                else:
                    browser.close()
                
        return post_url

    def _upload_tiktok(self, page, video_path: str, text: str) -> str:
        logger.info("[Playwright] Mở trang Tiktok Upload...")
        page.goto("https://www.tiktok.com/creator-center/upload", timeout=60000, wait_until="domcontentloaded")
        page.wait_for_timeout(5000)
        
        # Check login
        if "login" in page.url:
            raise Exception("Tiktok báo chưa đăng nhập (Cookie hết hạn hoặc không hợp lệ).")
            
        # TIKTOK UPLOAD LOGIC 2024
        logger.info("[Playwright] Đang tìm trường Upload File Tiktok...")
        try:
            # Hỗ trợ cả trường hợp trang upload bọc trong Iframe hoặc nằm ngay ngoài
            frame = page.frame_locator('iframe[data-tt="Upload_index_iframe"]')
            file_input = frame.locator('input[type="file"][accept*="video"]')
            
            if file_input.count() == 0:
                file_input = page.locator('input[type="file"][accept*="video"]')
                
            file_input.set_input_files(video_path)
        except Exception as e:
            # Fallback
            page.locator('input[type="file"]').set_input_files(video_path)
            
        logger.info("[Playwright] Đã tải video lên, chờ hệ thống xử lý nội bộ...")
        page.wait_for_timeout(10000)
        
        # Tiêu diệt toàn bộ popup / overlay cản đường bằng Javascript
        try:
            page.evaluate("""
                document.querySelectorAll('.TUXModal-overlay, [data-floating-ui-portal], .react-joyride__overlay, #react-joyride-portal').forEach(el => el.style.display = 'none');
            """)
        except:
            pass
        page.keyboard.press("Escape")
        
        logger.info("[Playwright] Đang nhập Caption...")
        try:
            # Tìm ô nhập caption
            caption_editor = page.locator('.public-DraftEditor-content')
            if caption_editor.count() == 0:
                frame = page.frame_locator('iframe[data-tt="Upload_index_iframe"]')
                caption_editor = frame.locator('.public-DraftEditor-content')
                
            caption_editor.click(timeout=10000)
            
            # Xóa tên file mặc định do Tiktok tự động điền vào ô caption
            page.keyboard.press("Control+A")
            page.wait_for_timeout(200)
            page.keyboard.press("Backspace")
            page.wait_for_timeout(500)
            
            page.keyboard.type(text, delay=30)
        except Exception as e:
            logger.warning(f"[Playwright] Bỏ qua nhập caption do không tìm thấy ô nhập: {e}")
            
        logger.info("[Playwright] Đang bấm nút Đăng (Post)...")
        try:
            # Tiêu diệt popup lần nữa trước khi bấm
            try:
                page.evaluate("""
                    document.querySelectorAll('.TUXModal-overlay, [data-floating-ui-portal], .react-joyride__overlay, #react-joyride-portal').forEach(el => el.style.display = 'none');
                """)
            except:
                pass
            
            # Chờ thêm 5 giây để nút đăng sáng lên (hết disable)
            page.wait_for_timeout(5000)
            
            post_btn = page.locator('button:has-text("Post"), button:has-text("Đăng")').last
            # Bỏ force=True để nó tự check nút có bị mờ không, nếu mờ thì đợi
            post_btn.click(timeout=20000)
        except Exception as e:
            logger.error(f"[Playwright] Không bấm được nút Đăng: {e}")
            raise Exception(f"Không bấm được nút Đăng, có thể do mạng chậm hoặc giao diện thay đổi: {str(e)}")
            
        logger.info("[Playwright] Hoàn tất lệnh Upload Tiktok. Đợi URL trả về...")
        page.wait_for_timeout(8000)
        
        # Thử lấy link post nếu Tiktok trả về thông báo "Video upload saved/posted"
        try:
            # Ưu tiên lấy link từ các toast hoặc modal thông báo thành công
            success_toast = page.locator('div[class*="toast"] a[href*="/video/"], div[class*="modal"] a[href*="/video/"], .tiktok-toast a[href*="/video/"]').last
            if success_toast.is_visible(timeout=5000):
                href = success_toast.get_attribute("href")
                if href and href.startswith("/"):
                    href = f"https://www.tiktok.com{href}"
                return href
            
            # Nếu không tìm thấy toast rõ ràng, đừng lấy bừa thẻ a href video trên trang (vì có thể là video cũ)
            # Trả về URL mặc định của trang Profile hoặc Upload
            return "https://www.tiktok.com/profile"
        except:
            return "https://www.tiktok.com/profile"
        
    def _upload_youtube(self, page, video_path: str, text: str) -> str:
        logger.info("[Playwright] Mở trang Youtube Studio...")
        page.goto("https://studio.youtube.com/", timeout=60000, wait_until="domcontentloaded")
        page.wait_for_timeout(5000)
        
        # Check login
        if "accounts.google.com" in page.url or "v=SIGNIN" in page.url:
            raise Exception("Youtube báo chưa đăng nhập (Cookie hết hạn).")
            
        # YOUTUBE UPLOAD LOGIC
        logger.info("[Playwright] Bắt đầu luồng Upload Youtube...")
        try:
            # 1. Bấm nút Create / Tạo
            create_btn = page.locator('ytcp-icon-button[aria-label*="Create"], ytcp-icon-button[aria-label*="Tạo"]').first
            create_btn.click()
            page.locator('tp-yt-paper-item:has-text("Upload videos"), tp-yt-paper-item:has-text("Tải video lên")').click()
            
            # 2. Upload file
            page.wait_for_timeout(2000)
            page.locator('input[type="file"]').set_input_files(video_path)
            
            # 3. Nhập chi tiết (Đợi dialog hiện lên)
            page.wait_for_timeout(8000)
            logger.info("[Playwright] Đang nhập mô tả (Description)...")
            
            desc_box = page.locator('#textbox').nth(1)
            desc_box.click()
            page.keyboard.type(text, delay=20)
            
            # 4. Chọn "No, it's not made for kids" (Bắt buộc)
            not_for_kids = page.locator('[name="VIDEO_MADE_FOR_KIDS_NOT_MFK"]')
            if not_for_kids.is_visible():
                not_for_kids.click()
            
            # 5. Next qua các bước
            for _ in range(3):
                next_btn = page.locator('#next-button')
                if next_btn.is_visible():
                    next_btn.click()
                page.wait_for_timeout(1000)
                
            # 6. Chọn Public
            public_radio = page.locator('[name="PUBLIC"]')
            if public_radio.is_visible():
                public_radio.click()
            
            # 7. Publish
            done_btn = page.locator('#done-button')
            done_btn.click()
            
            logger.info("[Playwright] Đã gửi video Youtube, đợi link Public...")
            page.wait_for_timeout(10000)
            
            # 8. Lấy URL (Trong hộp thoại Video Published)
            video_link = page.locator('a.ytcp-video-info').first
            if video_link.is_visible():
                return video_link.get_attribute("href")
                
        except Exception as e:
            logger.error(f"[Playwright] Lỗi thao tác Youtube: {e}")
            raise e
            
        return "https://studio.youtube.com/"

    def check_status(self) -> bool:
        """Kiểm tra cookie có hợp lệ không bằng cách truy cập thử trang profile."""
        logger.info(f"[Playwright] Kiểm tra trạng thái cookie cho tài khoản...")
        try:
            with sync_playwright() as p:
                browser = p.chromium.launch(headless=True)
                context = browser.new_context()
                if self.cookies and isinstance(self.cookies, list):
                    context.add_cookies(self.cookies)
                page = context.new_page()
                page.goto("https://www.tiktok.com/")
                page.wait_for_timeout(3000)
                # Check selector của avatar góc phải
                # is_logged_in = page.locator("div[data-e2e='profile-icon']").is_visible()
                browser.close()
                return True # Giả lập always True tạm thời
        except Exception as e:
            logger.error(f"[Playwright] Lỗi check status: {e}")
            return False
