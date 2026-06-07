import httpx
import re
import urllib.parse
import json
from typing import Optional

def get_douyin_live_stream_url(room_url_or_id: str) -> str:
    """Trích xuất link FLV trực tiếp từ Douyin Live"""
    room_id = room_url_or_id
    if "live.douyin.com" in room_url_or_id:
        match = re.search(r"live\.douyin\.com/(\d+)", room_url_or_id)
        if match:
            room_id = match.group(1)
    elif "v.douyin.com" in room_url_or_id:
        # Resolve short URL
        try:
            resp = httpx.get(room_url_or_id, follow_redirects=True, timeout=10)
            url = str(resp.url)
            match = re.search(r"webcast/reflow/(\d+)", url)
            if match:
                room_id = match.group(1)
        except Exception:
            pass

    url = f"https://live.douyin.com/{room_id}"
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Cookie": "__ac_nonce=0666144e1008064a7c06c;"
    }
    
    resp = httpx.get(url, headers=headers, follow_redirects=True, timeout=15)
    
    match = re.search(r'<script id="RENDER_DATA" type="application/json">(.*?)</script>', resp.text)
    if not match:
        raise Exception("Không tìm thấy thông tin luồng. Phòng Live có thể không tồn tại hoặc bạn bị chặn IP.")
        
    render_data_str = urllib.parse.unquote(match.group(1))
    data = json.loads(render_data_str)
    
    try:
        room_info = data.get("app", {}).get("initialState", {}).get("roomStore", {}).get("roomInfo", {}).get("room", {})
        if not room_info:
            # Maybe the structure is different
            raise Exception("Không tìm thấy thông tin phòng live (Data structure error).")
            
        status = room_info.get("status")
        if status != 2:
            raise Exception("Phòng Live hiện đang tắt (Offline).")
            
        stream_url_data = room_info.get("stream_url", {})
        flv_pull_url = stream_url_data.get("flv_pull_url", {})
        
        # Ưu tiên lấy chất lượng FULL HD
        qualities = ["FULL_HD1", "HD1", "SD1", "SD2"]
        for q in qualities:
            if q in flv_pull_url:
                return flv_pull_url[q]
                
        # Nếu không có lấy đại 1 cái đầu tiên
        for k, v in flv_pull_url.items():
            return v
            
        raise Exception("Không trích xuất được luồng FLV kéo từ Douyin.")
    except Exception as e:
        raise Exception(f"Lỗi khi trích xuất FLV: {str(e)}")
