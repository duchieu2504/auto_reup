from abc import ABC, abstractmethod
from typing import Dict, Any

class TaskAbortedByUser(Exception):
    """Raised when the user manually stops the upload task via the UI."""
    pass

class BaseUploaderEngine(ABC):
    """
    Lớp cơ sở trừu tượng cho tất cả các engine đăng video tự động.
    """
    
    def __init__(self, account_data: Dict[str, Any], schedule_id: int = None):
        """
        Khởi tạo engine với thông tin tài khoản (đã giải mã cookie, proxy, v.v.)
        """
        self.account_data = account_data
        self.schedule_id = schedule_id

    def check_control(self):
        """Kiểm tra tín hiệu hủy từ Redis (Stop/Pause)"""
        if not self.schedule_id:
            return
        try:
            from app.core.redis_pool import get_sync_redis
            r = get_sync_redis(decode_responses=True)
            redis_key = f"task_control:{self.schedule_id}"
            
            signal = r.get(redis_key)
            if signal == "stop":
                import logging
                logging.getLogger(__name__).warning(f"Nhận tín hiệu STOP từ người dùng cho schedule #{self.schedule_id}!")
                raise TaskAbortedByUser(f"Bị hủy bởi người dùng (schedule_id={self.schedule_id})")
                
            if signal == "pause":
                import logging
                import time
                logger = logging.getLogger(__name__)
                logger.info(f"Nhận tín hiệu PAUSE cho schedule #{self.schedule_id}. Đang chờ Resume...")
                while True:
                    time.sleep(1)
                    signal = r.get(redis_key)
                    if signal == "stop":
                        logger.warning(f"Chuyển từ PAUSE sang STOP cho schedule #{self.schedule_id}!")
                        raise TaskAbortedByUser(f"Bị hủy bởi người dùng (schedule_id={self.schedule_id})")
                    if signal != "pause":
                        logger.info(f"Đã RESUME cho schedule #{self.schedule_id}. Tiếp tục tiến trình...")
                        break
        except Exception as e:
            if isinstance(e, TaskAbortedByUser):
                raise e
            pass
        
    @abstractmethod
    def upload(self, video_path: str, caption: str, hashtags: str) -> str:
        """
        Hàm chính để thực thi quá trình upload.
        
        Args:
            video_path (str): Đường dẫn vật lý tới file video đã render.
            caption (str): Nội dung caption.
            hashtags (str): Chuỗi hashtags (vd: "#xuhuong #trend").
            
        Returns:
            str: Trả về URL của bài viết/video sau khi đăng thành công.
            
        Raises:
            Exception: Bắn ra lỗi nếu quá trình upload thất bại.
        """
        pass
        
    @abstractmethod
    def check_status(self) -> bool:
        """
        Kiểm tra trạng thái kết nối của tài khoản (VD: cookie còn sống không, adb có cắm không)
        """
        pass
