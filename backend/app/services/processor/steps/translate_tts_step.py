import os
import json
import queue
import threading
import subprocess
import imageio_ffmpeg
from app.services.processor.steps.base_step import ProcessorStep
from app.models.history import ProcessStatus
from app.services.processor.audio_extractor import extract_audio

class TranslateAndTTSStep(ProcessorStep):
    def execute(self, context: dict) -> bool:
        db = context['db']
        record = context['record']
        config = context['config']
        base_name = context['base_name']
        video_path = context['video_path']
        audio_tmp = context['audio_tmp']
        audio_dir = context['audio_dir']
        orig_srt = context['orig_srt']
        vi_srt = context['vi_srt']
        tts_audio = context['tts_audio']
        log_callback = context['log_callback']
        sync_redis = context['sync_redis']
        translator = context['translator']
        tts = context['tts']
        vocal_ref_path = context.get('vocal_ref_path')
        
        need_subtitles_data = config.enable_subtitles or (config.voice_mode != "none")
        if not need_subtitles_data:
            return True

        tts_audio_path = os.path.join(audio_dir, f"{base_name}_tts.mp3") if config.voice_mode != "none" else None
        context['tts_audio_path'] = tts_audio_path
        
        if os.path.exists(vi_srt) and os.path.getsize(vi_srt) > 0:
            log_callback(f"[*] Bước 2: Tìm thấy phụ đề dịch sẵn, bỏ qua dịch thuật Gemini...\n", progress=25.0)
            record.srt_translated_path = vi_srt
            db.commit()
            
            # Fallback TTS if vi_srt exists but tts_audio does not
            if config.voice_mode != "none" and (not tts_audio_path or not os.path.exists(tts_audio_path) or os.path.getsize(tts_audio_path) == 0):
                log_callback(f"[*] Bước 3: Tạo âm thanh lồng tiếng AI từ file phụ đề có sẵn...\n", progress=30.0)
                try:
                    record.status = ProcessStatus.GENERATING_TTS
                    db.commit()
                    auto_clone_enabled = os.getenv("ENABLE_AUTO_VOICE_CLONE", "False").lower() == "true"
                    vocal_path_to_clone = vocal_ref_path if auto_clone_enabled else None
                    
                    if vocal_path_to_clone and os.path.exists(vocal_path_to_clone):
                        short_vocal_path = os.path.join(audio_dir, f"{base_name}_vocal_short.wav")
                        if not os.path.exists(short_vocal_path):
                            try:
                                ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
                                subprocess.run([
                                    ffmpeg_exe, "-y", "-i", vocal_path_to_clone,
                                    "-t", "10", short_vocal_path
                                ], check=True, capture_output=True)
                            except Exception as e:
                                short_vocal_path = vocal_path_to_clone
                        vocal_path_to_clone = short_vocal_path
                        
                    tts.generate_tts_track(vi_srt, tts_audio_path, config.voice_mode, video_path, log_callback, vocal_path_to_clone)
                    record.audio_tts_path = tts_audio_path
                    db.commit()
                except Exception as e:
                    log_callback(f"[!] Lỗi TTS fallback: {e}\n")
                    raise e
            return True
            
        log_callback(f"[*] Bước 2: Dịch thuật tiếng Trung -> Việt bằng Gemini...\n", progress=15.0)
        try:
            record.status = ProcessStatus.TRANSLATING
            db.commit()
            extract_audio(video_path, audio_tmp)
            
            tts_queue = queue.Queue()
            tts_thread = None
            
            if config.voice_mode != "none" and (not tts_audio_path or not os.path.exists(tts_audio_path) or os.path.getsize(tts_audio_path) == 0):
                log_callback(f"[*] Bước 3: Tạo âm thanh lồng tiếng AI (Chạy song song)...\n", progress=25.0)
                auto_clone_enabled = os.getenv("ENABLE_AUTO_VOICE_CLONE", "False").lower() == "true"
                vocal_path_to_clone = vocal_ref_path if auto_clone_enabled else None
                
                if vocal_path_to_clone and os.path.exists(vocal_path_to_clone):
                    short_vocal_path = os.path.join(audio_dir, f"{base_name}_vocal_short.wav")
                    if not os.path.exists(short_vocal_path):
                        try:
                            ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
                            subprocess.run([
                                ffmpeg_exe, "-y", "-i", vocal_path_to_clone,
                                "-t", "10", short_vocal_path
                            ], check=True, capture_output=True)
                        except Exception as e:
                            log_callback(f"[!] Cảnh báo: Lỗi khi cắt ngắn vocal mẫu: {e}. Có thể gây tràn RAM.\n")
                            short_vocal_path = vocal_path_to_clone
                    vocal_path_to_clone = short_vocal_path
                    
                tts_thread = threading.Thread(
                    target=tts.generate_tts_from_queue,
                    args=(tts_queue, vi_srt, tts_audio_path, config.voice_mode, video_path, log_callback, vocal_path_to_clone)
                )
                tts_thread.start()
                
            def on_chunk(chunk_text):
                if tts_thread:
                    tts_queue.put(chunk_text)
        
            translator.translate_srt(orig_srt, vi_srt, config.voice_mode, audio_tmp, on_chunk_translated=on_chunk)
            
            if tts_thread:
                tts_queue.put(None)
                tts_thread.join()
                record.audio_tts_path = tts_audio_path
                
                tts_meta_path = os.path.join(audio_dir, f"{base_name}_tts_meta.json")
                if os.path.exists(tts_audio_path):
                    try:
                        with open(tts_meta_path, 'w', encoding='utf-8') as f:
                            json.dump({"voice_mode": config.voice_mode}, f)
                    except Exception:
                        pass
                        
            record.srt_translated_path = vi_srt
            db.commit()
            
        except Exception as e:
            log_callback(f"[!] Lỗi Translation/TTS: {e}\n")
            raise e

        if sync_redis.get(f"pause_video_{base_name}") == "1":
            log_callback(f"[*] Tiến trình đã được tạm dừng bởi người dùng.\n")
            record.status = ProcessStatus.PAUSED
            db.commit()
            return False

        return True
