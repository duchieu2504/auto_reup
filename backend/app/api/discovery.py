from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List
from ..services.crawler.douyin_api import DouyinAPIClient

router = APIRouter(prefix="/discovery", tags=["Discovery"])

@router.get("/hot-board")
async def get_hot_board() -> Dict[str, Any]:
    """
    Lấy danh sách các từ khóa đang hot trend trên Douyin.
    """
    try:
        client = DouyinAPIClient()
        data = client.get_hot_search_board()
        return {
            "success": True,
            "data": data.get("items", [])
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/search")
async def search_aweme(keyword: str, count: int = 10, offset: int = 0) -> Dict[str, Any]:
    """
    Tìm kiếm video theo từ khóa và bóc tách danh sách các user viral từ những video đó.
    """
    if not keyword:
        raise HTTPException(status_code=400, detail="Keyword is required")
        
    try:
        client = DouyinAPIClient()
        data = client.search_aweme(keyword=keyword, offset=offset, count=count)
        
        videos = data.get("items", [])
        viral_users_map = {}
        
        # Bóc tách user viral từ danh sách video tìm được
        for v in videos:
            author = v.get("author")
            if not author:
                continue
            
            sec_uid = author.get("sec_uid")
            if sec_uid and sec_uid not in viral_users_map:
                # Tính tổng view và tim cơ bản cho user dựa trên video này để lấy metrics gợi ý
                stats = v.get("statistics", {})
                viral_users_map[sec_uid] = {
                    "sec_uid": sec_uid,
                    "uid": author.get("uid"),
                    "nickname": author.get("nickname"),
                    "avatar": author.get("avatar_thumb", {}).get("url_list", [""])[0] if author.get("avatar_thumb") else "",
                    "signature": author.get("signature", ""),
                    "follower_count": author.get("follower_count", 0),
                    "total_favorited": author.get("total_favorited", 0),
                    # Thông tin lấy từ video hot nhất
                    "top_video_desc": v.get("desc", ""),
                    "top_video_play_count": stats.get("play_count", 0),
                    "top_video_digg_count": stats.get("digg_count", 0),
                }
                
        # Sắp xếp danh sách user dựa trên lượt view của video top đầu
        viral_users = list(viral_users_map.values())
        viral_users.sort(key=lambda x: x["top_video_play_count"], reverse=True)
        
        # Cắt bớt kết quả (tối đa bằng count)
        viral_users = viral_users[:count]
        
        return {
            "success": True,
            "data": {
                "videos": videos,
                "viral_users": viral_users,
                "has_more": data.get("has_more", False),
                "max_cursor": data.get("max_cursor", 0)
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
