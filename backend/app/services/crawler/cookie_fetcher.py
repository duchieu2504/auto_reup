import os
import time
import json
import urllib.parse
import base64
from playwright.sync_api import sync_playwright
from app.core.logger import get_logger
from app.core.security import encrypt_data

logger = get_logger(__name__)

def update_env_file(cookie_str: str):
    """Cập nhật hoặc thêm biến DOUYIN_COOKIE vào file .env"""
    env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../data/.env"))
    
    # Đọc file hiện tại
    env_lines = []
    if os.path.exists(env_path):
        with open(env_path, 'r', encoding='utf-8') as f:
            env_lines = f.readlines()
            
    # Xử lý cập nhật
    encrypted_cookie = encrypt_data(cookie_str)
    new_env_lines = []
    updated = False
    
    for line in env_lines:
        if line.startswith("DOUYIN_COOKIE="):
            new_env_lines.append(f"DOUYIN_COOKIE={encrypted_cookie}\n")
            updated = True
        else:
            new_env_lines.append(line)
            
    if not updated:
        if new_env_lines and not new_env_lines[-1].endswith('\n'):
            new_env_lines.append('\n')
        new_env_lines.append(f"DOUYIN_COOKIE={encrypted_cookie}\n")
        
    with open(env_path, 'w', encoding='utf-8') as f:
        f.writelines(new_env_lines)
    
    logger.info("Đã lưu cookie mới vào file data/.env")

def fetch_fresh_cookies() -> str:
    """Mở trình duyệt ngầm để lấy Cookie mới từ Douyin"""
    logger.info("Bắt đầu tiến trình Playwright lấy Cookie Douyin mới...")
    cookie_str = ""
    
    try:
        with sync_playwright() as p:
            # Khởi chạy trình duyệt chromium
            browser = p.chromium.launch(headless=True, args=["--disable-blink-features=AutomationControlled"])
            context = browser.new_context(
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                viewport={"width": 1920, "height": 1080}
            )
            
            # Thêm script chống phát hiện
            context.add_init_script("""
                Object.defineProperty(navigator, 'webdriver', {
                  get: () => undefined
                })
            """)
            
            page = context.new_page()
            
            # Điều hướng tới trang chủ douyin
            logger.info("Đang truy cập https://www.douyin.com ...")
            page.goto("https://www.douyin.com", wait_until="networkidle", timeout=60000)
            
            # Đợi thêm 1 chút để các API ngầm chạy xong và sinh ra các cookie signature
            time.sleep(5)
            
            # Cố gắng lấy danh sách cookies
            cookies = context.cookies()
            cookie_dict = {}
            for c in cookies:
                cookie_dict[c["name"]] = c["value"]
                
            # Đảm bảo có một số cookie thiết yếu
            if "ttwid" not in cookie_dict:
                logger.warning("Không tìm thấy ttwid trong lần thử đầu tiên, đợi thêm 5s...")
                page.reload(wait_until="networkidle")
                time.sleep(5)
                cookies = context.cookies()
                for c in cookies:
                    cookie_dict[c["name"]] = c["value"]
                    
            # Sinh druidClientInfo giả lập để lấy đúng User-Agent bên Crawler (tùy chọn)
            # Dù sao thì __ac_nonce và __ac_signature là do Douyin tạo ra, chúng ta chỉ cần thu thập
            
            # Dựng lại cookie string
            cookie_str = "; ".join([f"{k}={v}" for k, v in cookie_dict.items()])
            
            browser.close()
            
            if cookie_str:
                logger.info("Lấy cookie qua Playwright thành công.")
                update_env_file(cookie_str)
            else:
                logger.error("Không thể lấy cookie nào từ trình duyệt.")
                
    except Exception as e:
        logger.error(f"Lỗi khi chạy Playwright: {str(e)}", exc_info=True)
        
    return cookie_str
