import os
import subprocess
import signal
from typing import Optional
from app.core.logger import get_logger
from app.db.session import SessionLocal
from app.models.live_job import LiveStreamJob

logger = get_logger(__name__)

class LiveEngine:
    def __init__(self):
        pass

    def start_restream(self, job_id: int, douyin_flv_url: str, rtmp_url: str, stream_key: str, flip_horizontal: bool = False):
        db = SessionLocal()
        job = db.query(LiveStreamJob).filter(LiveStreamJob.id == job_id).first()
        if not job:
            db.close()
            return
            
        try:
            full_rtmp_url = rtmp_url.rstrip("/") + "/" + stream_key
            
            # Xây dựng lệnh FFmpeg
            # -re: Đọc input theo tốc độ thực tế (real-time) để tránh đẩy dữ liệu quá nhanh làm tràn bộ đệm server
            # -i: Input URL
            cmd = ["ffmpeg", "-re", "-i", douyin_flv_url]
            
            if flip_horizontal:
                # Lật ngang hình ảnh để chống bản quyền
                cmd.extend(["-vf", "hflip"])
                cmd.extend(["-c:v", "libx264", "-preset", "veryfast", "-maxrate", "2500k", "-bufsize", "5000k"])
                cmd.extend(["-c:a", "aac", "-b:a", "128k"])
            else:
                # Không lật thì copy thẳng luồng để giảm tối đa tải CPU
                cmd.extend(["-c:v", "copy", "-c:a", "copy"])
                
            cmd.extend(["-f", "flv", full_rtmp_url])
            
            logger.info(f"[LiveEngine] Đang khởi chạy FFmpeg cho Job {job_id}: {' '.join(cmd)}")
            
            # Khởi chạy FFmpeg ngầm
            process = subprocess.Popen(
                cmd,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                preexec_fn=os.setsid if os.name != 'nt' else None # Create new process group
            )
            
            # Cập nhật PID vào database
            job.pid = process.pid
            job.status = "running"
            db.commit()
            
        except Exception as e:
            logger.error(f"[LiveEngine] Lỗi khởi chạy FFmpeg: {e}")
            job.status = "failed"
            job.error_message = str(e)
            db.commit()
        finally:
            db.close()

    def stop_restream(self, job_id: int) -> bool:
        db = SessionLocal()
        job = db.query(LiveStreamJob).filter(LiveStreamJob.id == job_id).first()
        if not job:
            db.close()
            return False
            
        try:
            if job.pid:
                if os.name == 'nt':
                    # Windows
                    import ctypes
                    PROCESS_TERMINATE = 1
                    handle = ctypes.windll.kernel32.OpenProcess(PROCESS_TERMINATE, False, job.pid)
                    ctypes.windll.kernel32.TerminateProcess(handle, -1)
                    ctypes.windll.kernel32.CloseHandle(handle)
                else:
                    # Unix/Linux: kill entire process group
                    os.killpg(os.getpgid(job.pid), signal.SIGTERM)
                    
            job.status = "stopped"
            job.pid = None
            db.commit()
            return True
        except Exception as e:
            logger.error(f"[LiveEngine] Lỗi khi dừng FFmpeg (Job {job_id}): {e}")
            return False
        finally:
            db.close()
