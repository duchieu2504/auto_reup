from abc import ABC, abstractmethod
from typing import Dict, Any

class BaseUploaderEngine(ABC):
    """
    Lớp cơ sở trừu tượng cho tất cả các engine đăng video tự động.
    """
    
    def __init__(self, account_data: Dict[str, Any]):
        """
        Khởi tạo engine với thông tin tài khoản (đã giải mã cookie, proxy, v.v.)
        """
        self.account_data = account_data
        
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
