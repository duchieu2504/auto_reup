import os
import subprocess
import json
import sys
from .sync_manager import SyncManager
from app.core.logger import get_logger
from app.db.session import SessionLocal
from app.models.history import VideoHistory, ProcessStatus

logger = get_logger(__name__)

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../"))
DEFAULT_OUTPUT_DIR = os.path.join(PROJECT_ROOT, "data", "raw_videos")

class DouyinScraper:
    def __init__(self, output_dir: str = DEFAULT_OUTPUT_DIR):
        self.output_dir = output_dir
        self.sync_manager = SyncManager()
        self.cookie_path = os.path.join(PROJECT_ROOT, "data", "douyin_cookie.txt")
        os.makedirs(self.output_dir, exist_ok=True)
        logger.info("Khởi tạo DouyinScraper thành công.")


    def scrape_profile_generator(self, profile_url: str):
        logger.info(f"Bắt đầu quét profile: {profile_url}")
        yield f"[*] Bắt đầu quét profile: {profile_url}\n"
        
        from .douyin_api import DouyinAPIClient
        client = DouyinAPIClient()
        
        # Xử lý URL (nếu là link ngắn v.douyin thì giải mã)
        long_url = client.resolve_short_url(profile_url) or profile_url
        
        # 1. Kiểm tra xem đây có phải là link 1 video cụ thể không
        video_id_match = client.extract_video_id(long_url)
        if video_id_match:
            yield f"[*] Phát hiện link video đơn lẻ: {video_id_match}\n"
            data = client.get_video_detail(video_id_match)
            aweme = data.get("aweme_detail")
            
            if not aweme:
                yield "[*] API bị chặn, đang thử trích xuất bằng mã HTML thuần...\n"
                try:
                    import httpx
                    import re
                    import urllib.parse
                    import json
                    
                    html_resp = httpx.get(
                        f"https://www.douyin.com/video/{video_id_match}", 
                        headers=client.headers, 
                        cookies=client.cookies, 
                        timeout=10, 
                        follow_redirects=True
                    )
                    match = re.search(r'<script id="RENDER_DATA" type="application/json">(.*?)</script>', html_resp.text)
                    if match:
                        render_data_str = urllib.parse.unquote(match.group(1))
                        render_data = json.loads(render_data_str)
                        
                        def find_url_list(d):
                            if isinstance(d, dict):
                                if "playAddr" in d and isinstance(d["playAddr"], list) and len(d["playAddr"]) > 0:
                                    return d["playAddr"][0].get("src")
                                if "play_addr" in d and "url_list" in d["play_addr"] and d["play_addr"]["url_list"]:
                                    return d["play_addr"]["url_list"][0]
                                for k, v in d.items():
                                    res = find_url_list(v)
                                    if res: return res
                            elif isinstance(d, list):
                                for item in d:
                                    res = find_url_list(item)
                                    if res: return res
                            return None
                        
                        found_url = find_url_list(render_data)
                        if found_url:
                            if found_url.startswith("//"): 
                                found_url = "https:" + found_url
                            aweme = {"video": {"play_addr": {"url_list": [found_url]}}, "author": {"nickname": "HTML_Scrape"}}
                except Exception as e:
                    logger.error(f"HTML Scrape Error: {e}")
            
            if not aweme:
                yield "[!] Không tìm thấy chi tiết video. Link lỗi, video bị xóa hoặc bị chặn.\n"
                return
                
            try:
                video_urls = aweme["video"]["play_addr"]["url_list"]
                if not video_urls: raise ValueError("Empty URL list")
            except (KeyError, IndexError, TypeError, ValueError):
                yield "[!] Không thể lấy link tải trực tiếp của video này (có thể là dạng hình ảnh).\n"
                return
                
            uploader = aweme.get("author", {}).get("nickname", "Unknown User")
            
            if self.sync_manager.is_downloaded(video_id_match):
                yield f"[-] Bỏ qua video {video_id_match} - Đã tải trước đó.\n"
                return
                
            yield f"[+] Đang tải video: {video_id_match} từ {uploader}\n"
            for dl_log in self._download_video_generator(client, video_urls, video_id_match, uploader):
                yield dl_log
                
            return

        # 2. Xử lý link Profile
        sec_uid = client.extract_sec_uid(long_url)
        
        if not sec_uid:
            yield "[!] Không thể bóc tách mã người dùng (sec_uid) từ URL. Vui lòng kiểm tra lại link.\n"
            return
            
        cursor = 0
        has_more = True
        total_fetched = 0
        consecutive_duplicates = 0
        force_stop = False
        
        while has_more and not force_stop:
            data = client.get_user_post(sec_uid, max_cursor=cursor, count=18)
            aweme_list = data.get("aweme_list", [])
            if not aweme_list:
                if total_fetched == 0:
                    yield "[!] Không tìm thấy video nào. Có thể do tài khoản bị khóa riêng tư, hoặc thuật toán chống bot quá mạnh (Hệ thống Playwright đã thử vượt Captcha ngầm nhưng không thành công). Vui lòng cập nhật Cookie thủ công!\n"
                break
                
            for aweme in aweme_list:
                video_id = aweme.get("aweme_id")
                if not video_id: 
                    continue
                
                try:
                    video_urls = aweme["video"]["play_addr"]["url_list"]
                    if not video_urls: continue
                except (KeyError, IndexError, TypeError):
                    # Bỏ qua các video dạng hình ảnh / dạng lỗi
                    continue
                    
                uploader = aweme.get("author", {}).get("nickname", "Unknown User")
                total_fetched += 1
                
                if self.sync_manager.is_downloaded(video_id):
                    consecutive_duplicates += 1
                    logger.info(f"Bỏ qua video {video_id} - Đã tải trước đó.")
                    yield f"[-] Bỏ qua video {video_id} - Đã tải trước đó.\n"
                    
                    if consecutive_duplicates >= 5:
                        yield f"[!] Đã gặp 5 video cũ liên tiếp. Kích hoạt 'Tải Tăng Dần', dừng quét profile này để tối ưu.\n"
                        force_stop = True
                        break
                    continue
                    
                # Reset counter nếu gặp video mới
                consecutive_duplicates = 0
                    
                logger.info(f"Đang tải video mới: {video_id} từ {uploader}")
                yield f"[+] Đang tải video mới: {video_id}\n"
                
                for dl_log in self._download_video_generator(client, video_urls, video_id, uploader):
                    yield dl_log
                    
            cursor = data.get("max_cursor", 0)
            has_more = data.get("has_more", False)

    def _download_video_generator(self, client, video_urls: list, video_id: str, uploader: str):
        import httpx
        user_folder = "".join(c for c in uploader if c.isalnum() or c in (' ', '_', '-')).strip()
        if not user_folder:
            user_folder = "Unknown_User"
            
        target_dir = os.path.join(self.output_dir, user_folder)
        os.makedirs(target_dir, exist_ok=True)
        
        output_file = os.path.join(target_dir, f"{video_id}.mp4")
        temp_file = output_file + ".part"
        
        success = False
        last_error = ""
        max_retries_per_url = 2
        
        for url_idx, video_url in enumerate(video_urls):
            if success: break
            
            for attempt in range(max_retries_per_url):
                try:
                    with httpx.Client() as hx_client:
                        with hx_client.stream("GET", video_url, headers=client.headers, cookies=client.cookies, timeout=30, follow_redirects=True) as response:
                            response.raise_for_status()
                            
                            total_size = int(response.headers.get('content-length', 0))
                            downloaded = 0
                            
                            if total_size > 0:
                                mb_size = round(total_size / (1024 * 1024), 2)
                                yield f"[*] Bắt đầu tải file (CDN {url_idx + 1}), kích thước: {mb_size} MB\n"
                            else:
                                yield f"[*] Bắt đầu tải file (CDN {url_idx + 1})...\n"
                                
                            last_percent = 0
                            with open(temp_file, 'wb') as f:
                                for chunk in response.iter_bytes(chunk_size=8192*8):
                                    if chunk:
                                        f.write(chunk)
                                        downloaded += len(chunk)
                                        if total_size > 0:
                                            percent = int((downloaded / total_size) * 100)
                                            if percent >= last_percent + 10:
                                                yield {"log": f"[download] {percent}% of {mb_size}MB\n", "progress": percent}
                                                last_percent = percent
                    
                    # Đổi tên file part thành mp4 sau khi tải xong 100%
                    if os.path.exists(temp_file):
                        os.rename(temp_file, output_file)
                        
                    logger.info(f"Tải thành công video: {video_id} từ CDN {url_idx + 1}")
                    yield {"log": f"[*] Tải thành công video: {video_id}\n", "progress": 100}
                    self.sync_manager.mark_as_downloaded(video_id)
                    
                    db = SessionLocal()
                    try:
                        record = db.query(VideoHistory).filter(VideoHistory.raw_video_path == output_file).first()
                        if not record:
                            record = VideoHistory(
                                original_name=f"{video_id}.mp4",
                                source=f"Douyin - {uploader}",
                                raw_video_path=output_file,
                                status=ProcessStatus.PENDING
                            )
                            db.add(record)
                            db.commit()
                    except Exception as e:
                        logger.error(f"Lỗi khi lưu DB VideoHistory: {e}")
                    finally:
                        db.close()
                        
                    success = True
                    break # Thành công, thoát vòng lặp retry
                    
                except Exception as e:
                    last_error = str(e)
                    if os.path.exists(temp_file):
                        try:
                            os.remove(temp_file)
                        except:
                            pass
                            
                    if attempt < max_retries_per_url - 1:
                        yield f"[*] Mất kết nối khi tải, đang thử lại lần {attempt + 2}...\n"
                        
            if not success and url_idx < len(video_urls) - 1:
                yield f"[*] CDN {url_idx + 1} không phản hồi, đang chuyển sang server dự phòng...\n"
                
        if not success:
            logger.error(f"Lỗi hệ thống khi tải video {video_id}: {last_error}", exc_info=True)
            yield f"[!] Lỗi khi tải video {video_id}: {last_error}. Bỏ qua video này.\n"

