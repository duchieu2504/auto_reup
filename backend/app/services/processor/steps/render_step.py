import os
from app.services.processor.steps.base_step import ProcessorStep
from app.models.history import ProcessStatus

class RenderStep(ProcessorStep):
    def execute(self, context: dict) -> bool:
        db = context['db']
        record = context['record']
        config = context['config']
        video_path = context['video_path']
        vi_srt = context['vi_srt']
        out_video_path = context['out_video_path']
        log_callback = context['log_callback']
        sync_redis = context['sync_redis']
        video_editor = context['video_editor']
        instrumental_audio_path = context.get('instrumental_audio_path')
        tts_audio_path = context.get('tts_audio_path')

        log_callback(f"[*] Bước 4: Đang render video kết quả...\n", progress=40.0)
        
        try:
            record.status = ProcessStatus.RENDERING
            db.commit()
            
            # Xử lý TTS file nếu bị rỗng hoặc không chọn voice
            final_tts_audio = tts_audio_path
            if final_tts_audio and (not os.path.exists(final_tts_audio) or os.path.getsize(final_tts_audio) == 0):
                final_tts_audio = None
            if config.voice_mode == "none":
                final_tts_audio = None
                
            srt_to_use = vi_srt if config.enable_subtitles else None
                
            video_editor.burn_subtitles(
                input_video=video_path,
                srt_file=srt_to_use,
                output_video=out_video_path,
                tts_audio=final_tts_audio,
                bgm_audio=instrumental_audio_path,
                config=config,
                log_callback=log_callback
            )
            
            record.final_video_path = out_video_path
            record.status = ProcessStatus.COMPLETED
            record.error_message = None
            db.commit()
            log_callback(f"[*] Đã render xong video: {out_video_path}\n", progress=100.0)
            
        except Exception as e:
            if "bị hủy" in str(e):
                log_callback(f"[*] Tiến trình render đã bị hủy bởi người dùng.\n")
                record.status = ProcessStatus.PAUSED
                db.commit()
                return False
            else:
                log_callback(f"[!] Lỗi Render: {e}\n")
                raise e

        return True
