import os
import asyncio
from .transcriber import Transcriber, GroqQuotaExceeded
from .translator import Translator
from .video_editor import VideoEditor
from .tts_generator import TTSGenerator
from .audio_extractor import extract_audio
from app.db.session import SessionLocal
from app.models.history import VideoHistory, ProcessStatus
from app.utils.metadata import save_video_metadata
import redis

REDIS_URL = os.environ.get("CELERY_BROKER_URL", "redis://localhost:6379/0")
sync_redis = redis.Redis.from_url(REDIS_URL, decode_responses=True)

class ProcessorPipeline:
    def __init__(self):
        self.transcriber = Transcriber()
        self.translator = Translator()
        self.editor = VideoEditor()
        self.tts = TTSGenerator()

    def process_video(self, video_path: str, log_callback, voice_mode: str = "edge_auto", bg_volume: int = 10, flip_video: bool = False, force_render: bool = False, subtitle_style: str = "black_white", opt_zoom: bool = False, opt_color: bool = False, opt_noise: bool = False, opt_pitch: bool = False, subtitle_text_color: str = "#000000", subtitle_bg_color: str = "#FFFFFF", subtitle_font_size: int = 20, subtitle_margin_v: int = 40, subtitle_bg_padding: int = 2, subtitle_bg_opacity: int = 100, watermark_type: str = "none", watermark_text: str = None, watermark_image_path: str = None, watermark_x: float = 50.0, watermark_y: float = 50.0, watermark_size: float = 20.0, watermark_color: str = "#FFFFFF", watermark_opacity: float = 50.0, subtitle_font_family: str = "Liberation Sans"):
        if not os.path.exists(video_path):
            log_callback(f"[!] Lỗi: Không tìm thấy file {video_path}\n")
            return

        base_dir = os.path.dirname(video_path)
        base_name = os.path.basename(video_path).split('.')[0]
        
        project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../"))
        data_dir = os.path.join(project_root, "data")
        subtitles_dir = os.path.join(data_dir, "subtitles")
        audio_dir = os.path.join(data_dir, "audio")
        processed_dir = os.path.join(data_dir, "processed_videos")
        
        os.makedirs(subtitles_dir, exist_ok=True)
        os.makedirs(audio_dir, exist_ok=True)
        os.makedirs(processed_dir, exist_ok=True)
        
        orig_srt = os.path.join(subtitles_dir, f"{base_name}_orig.srt")
        vi_srt = os.path.join(subtitles_dir, f"{base_name}_vi.srt")
        output_video = os.path.join(processed_dir, f"{base_name}_processed.mp4")
        audio_tmp = os.path.join(audio_dir, f"{base_name}_audio.mp3")
        audio_tts_path = os.path.join(audio_dir, f"{base_name}_tts.mp3")
        
        # Nếu cờ force_render bật, xóa file output cũ nếu có
        if force_render and os.path.exists(output_video):
            try:
                os.remove(output_video)
                log_callback(f"[*] Force Render: Đã xóa video cũ để render lại.\n")
            except Exception as e:
                log_callback(f"[!] Force Render: Không thể xóa video cũ: {e}\n")

        # Init DB record
        db = SessionLocal()
        try:
            record = db.query(VideoHistory).filter(VideoHistory.raw_video_path == video_path).first()
            if not record:
                record = VideoHistory(
                    original_name=f"{base_name}.mp4",
                    source="Unknown",
                    raw_video_path=video_path,
                    status=ProcessStatus.PENDING
                )
                db.add(record)
                db.commit()
                db.refresh(record)

            if sync_redis.get(f"pause_video_{base_name}") == "1":
                log_callback(f"[*] Tiến trình đã được tạm dừng bởi người dùng.\n")
                record.status = ProcessStatus.PAUSED
                db.commit()
                return

            if os.path.exists(orig_srt) and os.path.getsize(orig_srt) > 0:
                log_callback(f"[*] Bước 1: Tìm thấy phụ đề gốc đã tạo, bỏ qua Whisper...\n")
                record.srt_origin_path = orig_srt
                db.commit()
            else:
                log_callback(f"[*] Bước 1: Nhận diện giọng nói (Whisper) cho video...\n")
                try:
                    record.status = ProcessStatus.TRANSCRIBING
                    db.commit()
                    self.transcriber.transcribe(video_path, orig_srt)
                    record.srt_origin_path = orig_srt
                    db.commit()
                    log_callback(f"[*] Đã tạo phụ đề gốc thành công.\n")
                except GroqQuotaExceeded:
                    log_callback(f"[!] Groq API đã hết hạn miễn phí. Tạm dừng tiến trình.\n")
                    record.status = ProcessStatus.PAUSED
                    record.error_message = "GROQ_LIMIT_EXCEEDED"
                    db.commit()
                    return
                except Exception as e:
                    log_callback(f"[!] Lỗi Whisper: {e}\n")
                    # Fallback default error processing for other errors (in main except)
                    raise e

            if sync_redis.get(f"pause_video_{base_name}") == "1":
                log_callback(f"[*] Tiến trình đã được tạm dừng bởi người dùng.\n")
                record.status = ProcessStatus.PAUSED
                db.commit()
                return

            if os.path.exists(vi_srt) and os.path.getsize(vi_srt) > 0:
                log_callback(f"[*] Bước 2: Tìm thấy phụ đề dịch sẵn, bỏ qua dịch thuật Gemini...\n")
                record.srt_translated_path = vi_srt
                db.commit()
            else:
                log_callback(f"[*] Bước 2: Dịch thuật tiếng Trung -> Việt bằng Gemini...\n")
                try:
                    record.status = ProcessStatus.TRANSLATING
                    db.commit()
                    extract_audio(video_path, audio_tmp)
                
                    self.translator.translate_srt(orig_srt, vi_srt, voice_mode, audio_tmp)
                    record.srt_translated_path = vi_srt
                    db.commit()
                    log_callback(f"[*] Dịch thuật thành công.\n")
                
                    if os.path.exists(audio_tmp):
                        os.remove(audio_tmp)
                except Exception as e:
                    record.status = ProcessStatus.FAILED
                    record.error_message = f"Dịch thuật: {str(e)}"
                    db.commit()
                    log_callback(f"[!] Lỗi Dịch thuật: {e}\n")
                    return

            tts_audio = os.path.join(audio_dir, f"{base_name}_tts.mp3") if voice_mode != "none" else None
            if voice_mode != "none":
                if sync_redis.get(f"pause_video_{base_name}") == "1":
                    log_callback(f"[*] Tiến trình đã được tạm dừng bởi người dùng.\n")
                    record.status = ProcessStatus.PAUSED
                    db.commit()
                    return

                if tts_audio and os.path.exists(tts_audio) and os.path.getsize(tts_audio) > 0:
                    log_callback(f"[*] Bước 3: Tìm thấy audio lồng tiếng AI sẵn, bỏ qua TTS...\n")
                    record.audio_tts_path = tts_audio
                    db.commit()
                else:
                    log_callback(f"[*] Bước 3: Tạo âm thanh lồng tiếng AI...\n")
                    try:
                        record.status = ProcessStatus.GENERATING_TTS
                        db.commit()
                        self.tts.generate_tts_track(vi_srt, tts_audio, voice_mode, video_path, log_callback)
                        record.audio_tts_path = tts_audio
                        db.commit()
                        log_callback(f"[*] Sinh audio lồng tiếng thành công.\n")
                    except Exception as e:
                        record.status = ProcessStatus.FAILED
                        record.error_message = f"TTS: {str(e)}"
                        db.commit()
                        log_callback(f"[!] Lỗi TTS: {e}\n")
                        return
            else:
                log_callback(f"[*] Bỏ qua bước lồng tiếng theo cấu hình.\n")

            if sync_redis.get(f"pause_video_{base_name}") == "1":
                log_callback(f"[*] Tiến trình đã được tạm dừng bởi người dùng.\n")
                record.status = ProcessStatus.PAUSED
                db.commit()
                return

            if os.path.exists(output_video) and os.path.getsize(output_video) > 0:
                log_callback(f"[*] Bước 4: Tìm thấy video thành phẩm, bỏ qua Render.\n")
                record.final_video_path = output_video
                record.status = ProcessStatus.COMPLETED
                db.commit()
                log_callback(f"[*] Video đã hoàn tất từ trước!\n[*] File đầu ra: {output_video}\n")
            else:
                log_callback(f"[*] Bước 4: Đốt phụ đề và Render video...\n")
                try:
                    record.status = ProcessStatus.RENDERING
                    db.commit()
                    self.editor.burn_subtitles(
                        video_path, vi_srt, output_video, tts_audio, bg_volume, flip_video, subtitle_style, 
                        opt_zoom, opt_color, opt_noise, opt_pitch, 
                        subtitle_text_color=subtitle_text_color,
                        subtitle_bg_color=subtitle_bg_color,
                        subtitle_font_size=subtitle_font_size,
                        subtitle_margin_v=subtitle_margin_v,
                        subtitle_bg_padding=subtitle_bg_padding,
                        subtitle_bg_opacity=subtitle_bg_opacity,
                        watermark_type=watermark_type,
                        watermark_text=watermark_text,
                        watermark_image_path=watermark_image_path,
                        watermark_x=watermark_x,
                        watermark_y=watermark_y,
                        watermark_size=watermark_size,
                        watermark_color=watermark_color,
                        watermark_opacity=watermark_opacity,
                        subtitle_font_family=subtitle_font_family
                    )
                    record.final_video_path = output_video
                    record.status = ProcessStatus.COMPLETED
                    db.commit()
                    log_callback(f"[*] Render video thành công!\n[*] File đầu ra: {output_video}\n")
                
                except Exception as e:
                    record.status = ProcessStatus.FAILED
                    record.error_message = f"Render: {str(e)}"
                    db.commit()
                    log_callback(f"[!] Lỗi FFmpeg: {e}\n")
                    return
        finally:
            db.close()
