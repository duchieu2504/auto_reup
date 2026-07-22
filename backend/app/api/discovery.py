from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, List
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.logger import get_logger
from app.db.session import get_db
from app.models.followed_account import FollowedAccount
from app.models.history import VideoHistory
from ..services.crawler.douyin_api import DouyinAPIClient

logger = get_logger(__name__)

router = APIRouter(prefix="/discovery", tags=["Discovery"])


class FollowRequest(BaseModel):
    url: str

def serialize_followed_account(acc: FollowedAccount) -> dict:
    return {
        "id": acc.id,
        "sec_uid": acc.sec_uid,
        "nickname": acc.nickname,
        "avatar": acc.avatar,
        "follower_count": acc.follower_count,
        "total_favorited": acc.total_favorited,
        "video_count": acc.video_count,
        "is_favorite": acc.is_favorite
    }


@router.get("/hot-board")
def get_hot_board() -> Dict[str, Any]:
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
        logger.error(f"Lỗi get_hot_board: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/search")
def search_aweme(keyword: str, count: int = 10, offset: int = 0) -> Dict[str, Any]:
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
                    "top_video_play_count": stats.get("play_count") or stats.get("playCount") or 0,
                    "top_video_digg_count": stats.get("digg_count") or stats.get("diggCount") or 0,
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
        logger.error(f"Lỗi search_aweme: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/followed")
def get_followed_accounts(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Lấy danh sách các tài khoản Douyin đang theo dõi, kèm theo số video đã cào.
    """
    try:
        accounts = db.query(FollowedAccount).all()
        result = []
        for acc in accounts:
            crawled_count = db.query(VideoHistory).filter(VideoHistory.author_sec_uid == acc.sec_uid).count()
            result.append({
                "id": acc.id,
                "sec_uid": acc.sec_uid,
                "nickname": acc.nickname,
                "avatar": acc.avatar,
                "follower_count": acc.follower_count,
                "total_favorited": acc.total_favorited,
                "video_count": acc.video_count,
                "is_favorite": acc.is_favorite,
                "crawled_count": crawled_count,
                "created_at": acc.created_at,
                "updated_at": acc.updated_at
            })
        # Sort by favorite status (True first), then by followers count (descending)
        result.sort(key=lambda x: (not x["is_favorite"], -x["follower_count"]))
        return {"success": True, "data": result}
    except Exception as e:
        logger.error(f"Error getting followed accounts: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/follow")
def follow_account(req: FollowRequest, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Theo dõi một tài khoản Douyin mới bằng cách phân tích link profile.
    """
    url = req.url.strip()
    if not url:
        raise HTTPException(status_code=400, detail="Vui lòng cung cấp link profile")
        
    client = DouyinAPIClient()
    long_url = client.resolve_short_url(url) or url
    sec_uid = client.extract_sec_uid(long_url)
    
    if not sec_uid:
        raise HTTPException(status_code=400, detail="Không tìm thấy sec_uid từ link. Vui lòng kiểm tra lại link.")
        
    # Check if already followed
    existing = db.query(FollowedAccount).filter(FollowedAccount.sec_uid == sec_uid).first()
    if existing:
        try:
            profile_info = client.get_user_profile(sec_uid)
            user_obj = profile_info.get("user", {})
            if user_obj:
                existing.nickname = user_obj.get("nickname")
                existing.avatar = user_obj.get("avatar_thumb", {}).get("url_list", [""])[0] if user_obj.get("avatar_thumb") else ""
                existing.follower_count = user_obj.get("follower_count", 0)
                existing.total_favorited = user_obj.get("total_favorited", 0)
                existing.video_count = user_obj.get("aweme_count", 0)
                db.commit()
        except Exception:
            pass
        return {"success": True, "message": "Đã theo dõi tài khoản này từ trước", "data": serialize_followed_account(existing)}
        
    try:
        profile_info = client.get_user_profile(sec_uid)
        user_obj = profile_info.get("user", {}) if isinstance(profile_info, dict) else {}
        if not user_obj:
            raise Exception("Cannot fetch profile info from Douyin API")
            
        acc = FollowedAccount(
            sec_uid=sec_uid,
            nickname=user_obj.get("nickname"),
            avatar=user_obj.get("avatar_thumb", {}).get("url_list", [""])[0] if user_obj.get("avatar_thumb") else "",
            follower_count=user_obj.get("follower_count", 0),
            total_favorited=user_obj.get("total_favorited", 0),
            video_count=user_obj.get("aweme_count", 0),
            is_favorite=False
        )
        db.add(acc)
        db.commit()
        db.refresh(acc)
        return {"success": True, "message": "Theo dõi tài khoản thành công", "data": serialize_followed_account(acc)}
    except Exception as e:
        logger.error(f"Error following account: {e}", exc_info=True)
        # Fallback to creating a stub if Douyin API blocks request.
        acc = FollowedAccount(
            sec_uid=sec_uid,
            nickname=f"Douyin_{sec_uid[:8]}",
            avatar="",
            follower_count=0,
            total_favorited=0,
            video_count=0,
            is_favorite=False
        )
        db.add(acc)
        db.commit()
        db.refresh(acc)
        return {"success": True, "message": "Đã thêm vào danh sách theo dõi (Chế độ dự phòng do API bị chặn. Hãy thử đồng bộ lại sau.)", "data": serialize_followed_account(acc)}


@router.post("/unfollow/{sec_uid}")
def unfollow_account(sec_uid: str, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Hủy theo dõi một tài khoản Douyin.
    """
    acc = db.query(FollowedAccount).filter(FollowedAccount.sec_uid == sec_uid).first()
    if not acc:
        raise HTTPException(status_code=404, detail="Không tìm thấy tài khoản để hủy theo dõi")
        
    db.delete(acc)
    db.commit()
    return {"success": True, "message": "Đã bỏ theo dõi tài khoản thành công"}


@router.post("/toggle-favorite/{sec_uid}")
def toggle_favorite(sec_uid: str, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Bật/tắt trạng thái yêu thích đặc biệt (trái tim).
    """
    acc = db.query(FollowedAccount).filter(FollowedAccount.sec_uid == sec_uid).first()
    if not acc:
        raise HTTPException(status_code=404, detail="Không tìm thấy tài khoản")
        
    acc.is_favorite = not acc.is_favorite
    db.commit()
    db.refresh(acc)
    return {"success": True, "is_favorite": acc.is_favorite, "message": "Đã cập nhật trạng thái yêu thích"}


@router.post("/sync/{sec_uid}")
def sync_account(sec_uid: str, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Đồng bộ dữ liệu tài khoản Douyin từ máy chủ.
    """
    acc = db.query(FollowedAccount).filter(FollowedAccount.sec_uid == sec_uid).first()
    if not acc:
        raise HTTPException(status_code=404, detail="Không tìm thấy tài khoản trong danh sách")
        
    client = DouyinAPIClient()
    try:
        profile_info = client.get_user_profile(sec_uid)
        user_obj = profile_info.get("user", {}) if isinstance(profile_info, dict) else {}
        if not user_obj:
            raise Exception("Cannot fetch user profile from Douyin")
            
        acc.nickname = user_obj.get("nickname")
        acc.avatar = user_obj.get("avatar_thumb", {}).get("url_list", [""])[0] if user_obj.get("avatar_thumb") else ""
        acc.follower_count = user_obj.get("follower_count", 0)
        acc.total_favorited = user_obj.get("total_favorited", 0)
        acc.video_count = user_obj.get("aweme_count", 0)
        
        db.commit()
        db.refresh(acc)
        return {"success": True, "message": "Đồng bộ thông số tài khoản thành công", "data": serialize_followed_account(acc)}
    except Exception as e:
        logger.error(f"Error syncing account {sec_uid}: {e}")
        raise HTTPException(status_code=500, detail=f"Không thể đồng bộ: {str(e)}")


@router.get("/account-videos/{sec_uid}")
def get_account_videos(sec_uid: str, limit: int = 20, db: Session = Depends(get_db)):
    """
    Lấy danh sách các video CHƯA TẢI của một tài khoản để xem trước.
    Tự động phân trang (tối đa 5 trang) để tìm video mới chưa cào.
    """
    client = DouyinAPIClient()
    result = []
    max_cursor = 0
    has_more = True
    page_count = 0
    max_pages = 5
    
    try:
        while has_more and len(result) < limit and page_count < max_pages:
            data = client.get_user_post(sec_uid, max_cursor=max_cursor, count=20)
            aweme_list = data.get("aweme_list", [])
            if not aweme_list:
                break
                
            for aweme in aweme_list:
                video_id = aweme.get("aweme_id")
                if not video_id: 
                    continue
                    
                # Check if downloaded
                is_downloaded = db.query(VideoHistory).filter(VideoHistory.original_name == f"{video_id}.mp4").first() is not None
                if is_downloaded:
                    continue  # Bỏ qua video đã tải
                    
                desc = aweme.get("desc", "")
                stats = aweme.get("statistics", {})
                
                # Get thumbnail
                cover_url = ""
                try:
                    cover_url = aweme["video"]["cover"]["url_list"][0]
                except Exception:
                    pass
                    
                play_count = stats.get("play_count") or stats.get("playCount") or 0
                digg_count = stats.get("digg_count") or stats.get("diggCount") or 0
                
                if play_count == 0 and digg_count > 0:
                    play_count = digg_count * 12
                    
                result.append({
                    "video_id": video_id,
                    "desc": desc,
                    "cover_url": cover_url,
                    "play_count": play_count,
                    "digg_count": digg_count,
                    "is_downloaded": False
                })
                
                if len(result) >= limit:
                    break
                    
            # Check has_more with integer or boolean
            has_more = bool(data.get("has_more", 0))
            max_cursor = data.get("max_cursor", 0)
            page_count += 1
            
    except Exception as e:
        logger.error(f"Error fetching videos for account {sec_uid}: {e}")
        if not result:
            raise HTTPException(status_code=400, detail=f"Lỗi khi lấy video: {e}")
            
    return {"success": True, "data": result}
