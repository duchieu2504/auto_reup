import time
import os
import sys
import logging

sys.path.append(os.path.abspath(os.path.dirname(__file__)))
from app.db.session import SessionLocal
from app.models.history import VideoHistory, ProcessStatus
from app.models.social_account import SocialAccount
from app.services.processor.pipeline import ProcessorPipeline
from app.services.uploader.adb_engine import ADBUploader

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def main():
    db = SessionLocal()
    try:
        # Lấy video gần nhất trong lịch sử
        video = db.query(VideoHistory).order_by(VideoHistory.id.desc()).first()
        # Lấy tài khoản Tiktok Nika
        account = db.query(SocialAccount).filter(SocialAccount.username.like('%Zhiu%Nika%')).first()

        if not video:
            logger.error("Không tìm thấy video nào trong DB.")
            return
        if not account:
            logger.error("Không tìm thấy tài khoản Tiktok Nika.")
            return

        raw_video_path = video.raw_video_path
        if not raw_video_path or not os.path.exists(raw_video_path):
            logger.error(f"File raw video không tồn tại: {raw_video_path}")
            return

        logger.info("==================================================")
        logger.info(f"BẮT ĐẦU FULL PIPELINE CHO VIDEO: {os.path.basename(raw_video_path)}")
        logger.info("==================================================")

        # 1. RENDER VIDEO
        logger.info("\n[1] BƯỚC 1: Render Video bằng ProcessorPipeline...")
        processor = ProcessorPipeline()
        def dummy_log(msg):
            sys.stdout.write(msg)
            sys.stdout.flush()

        # Gọi hàm process_video (sẽ chạy transcribe -> translate -> TTS -> render)
        # Để chạy nhanh, bỏ qua voice nếu muốn, nhưng ở đây chạy full
        processor.process_video(
            video_path=raw_video_path,
            log_callback=dummy_log,
            force_render=True, # Ép render lại để test
            voice_mode="edge_auto",
            subtitle_style="black_white"
        )

        db.refresh(video)
        if video.status != ProcessStatus.COMPLETED or not video.final_video_path:
            logger.error(f"Render thất bại! Trạng thái: {video.status}, Lỗi: {video.error_message}")
            return
        
        final_video_path = video.final_video_path
        logger.info(f"\n✅ Đã render xong video: {final_video_path}")

        # 2. TẠO CAPTION BẰNG AI
        logger.info("\n[2] BƯỚC 2: Sinh Caption...")
        caption = "Lại một siêu phẩm được lồng tiếng bởi AI của Cáo nè! Mọi người xem ủng hộ nhé ❤️"
        hashtags = "#xuhuong #douyin #fyp #giaitri"
        
        logger.info(f"Caption: {caption} {hashtags}")

        # 3. UPLOAD LÊN TIKTOK QUA ADB
        logger.info("\n[3] BƯỚC 3: Đăng bài tự động lên Tiktok qua ADB...")
        import json
        from app.core.security import decrypt_data
        
        account_data = {
            "platform": account.platform,
            "auth_data": decrypt_data(account.auth_data),
            "device_id": account.device_id
        }

        uploader = ADBUploader(account_data)
        post_url = uploader.upload(final_video_path, caption, hashtags)

        logger.info("==================================================")
        logger.info(f"✅ FULL PIPELINE HOÀN TẤT THÀNH CÔNG!")
        logger.info(f"✅ Link post dự kiến: {post_url}")
        logger.info("==================================================")

    finally:
        db.close()

if __name__ == "__main__":
    main()
