from faster_whisper import WhisperModel
import os
import subprocess
from dotenv import load_dotenv
from app.core.security import decrypt_data

ENV_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../data/.env"))

class GroqQuotaExceeded(Exception):
    pass

class Transcriber:
    def __init__(self, model_size="base"):
        load_dotenv(ENV_PATH, override=True)
        self.use_groq = os.getenv("USE_GROQ", "False").lower() == "true"
        self.groq_api_key = decrypt_data(os.getenv("GROQ_API_KEY", ""))
        self.use_gpu = os.getenv("USE_GPU_ACCELERATION", "False").lower() == "true"
        
        # Chỉ load model CPU nếu không dùng Groq để tiết kiệm RAM
        self.model = None
        if not self.use_groq:
            self._init_whisper_model(model_size)
        elif self.use_groq and not self.groq_api_key:
            # Fallback nếu bật Groq nhưng quên nhập Key
            self.use_groq = False
            self._init_whisper_model(model_size)

    def _init_whisper_model(self, model_size):
        device = "cuda" if self.use_gpu else "cpu"
        # GPU GTX 1650 4GB VRAM dùng float16 để tăng tốc độ và tiết kiệm bộ nhớ; CPU dùng int8
        compute_type = "float16" if device == "cuda" else "int8"
        
        try:
            print(f"Initializing WhisperModel '{model_size}' on '{device}' (compute_type={compute_type})...")
            self.model = WhisperModel(model_size, device=device, compute_type=compute_type)
            print(f"WhisperModel '{model_size}' successfully initialized on '{device}'.")
        except Exception as e:
            if device == "cuda":
                print(f"Warning: Failed to load WhisperModel on GPU/CUDA: {e}. Falling back to CPU...")
                try:
                    self.model = WhisperModel(model_size, device="cpu", compute_type="int8")
                    print("WhisperModel successfully initialized on CPU fallback.")
                except Exception as fallback_err:
                    print(f"Critical Error: Failed to initialize WhisperModel on CPU fallback: {fallback_err}")
                    raise fallback_err
            else:
                raise e
            
    def _extract_audio_for_api(self, video_path: str) -> str:
        audio_path = video_path + ".temp.mp3"
        cmd = [
            "ffmpeg", "-y", "-i", video_path, 
            "-vn", "-acodec", "libmp3lame", "-q:a", "4",
            audio_path
        ]
        subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        return audio_path

    def transcribe(self, media_path: str, output_srt_path: str):
        if self.use_groq:
            srt_path = self._transcribe_groq(media_path, output_srt_path)
        else:
            srt_path = self._transcribe_offline(media_path, output_srt_path)
            
        # Tự động Diarization nếu được bật
        if os.getenv("ENABLE_DIARIZATION", "False").lower() == "true":
            self._apply_diarization(media_path, srt_path)
            
        return srt_path
        
    def _apply_diarization(self, media_path: str, srt_path: str):
        try:
            hf_token = decrypt_data(os.getenv("HF_TOKEN", ""))
            if not hf_token:
                print("Skipping Diarization: HF_TOKEN is not configured.")
                return
                
            from pyannote.audio import Pipeline
            import torch
            import pysrt
            
            print("Running Pyannote Diarization...")
            device = torch.device("cuda" if self.use_gpu else "cpu")
            pipeline = Pipeline.from_pretrained("pyannote/speaker-diarization-3.1", use_auth_token=hf_token)
            pipeline.to(device)
            
            diarization = pipeline(media_path)
            
            # Đọc file srt vừa tạo
            subs = pysrt.open(srt_path, encoding="utf-8")
            
            # Ánh xạ Speaker -> M hoặc F. SPEAKER_00 -> M, SPEAKER_01 -> F, v.v.
            speaker_map = {}
            gender_cycle = ["M", "F"]
            
            for sub in subs:
                start_sec = sub.start.ordinal / 1000.0
                end_sec = sub.end.ordinal / 1000.0
                mid_sec = (start_sec + end_sec) / 2.0
                
                # Tìm speaker có mặt tại mid_sec
                assigned_speaker = None
                for turn, _, speaker in diarization.itertracks(yield_label=True):
                    if turn.start <= mid_sec <= turn.end:
                        assigned_speaker = speaker
                        break
                        
                if assigned_speaker:
                    if assigned_speaker not in speaker_map:
                        speaker_map[assigned_speaker] = gender_cycle[len(speaker_map) % 2]
                    
                    gender_tag = speaker_map[assigned_speaker]
                    # Chèn tag [M] hoặc [F] vào đầu câu nếu chưa có
                    if not sub.text.startswith("[M]") and not sub.text.startswith("[F]"):
                        sub.text = f"[{gender_tag}] {sub.text}"
                        
            subs.save(srt_path, encoding="utf-8")
            print("Diarization completed. Tags injected into SRT.")
            
        except Exception as e:
            print(f"Diarization failed: {e}")

    def _transcribe_groq(self, media_path: str, output_srt_path: str):
        try:
            from groq import Groq
            client = Groq(api_key=self.groq_api_key)
            audio_path = self._extract_audio_for_api(media_path)
            
            with open(audio_path, "rb") as file:
                transcription = client.audio.transcriptions.create(
                    file=(os.path.basename(audio_path), file.read()),
                    model="whisper-large-v3",
                    response_format="verbose_json"
                )
            
            # Xóa file audio tạm
            if os.path.exists(audio_path):
                os.remove(audio_path)
                
            # Tạo SRT
            with open(output_srt_path, "w", encoding="utf-8") as f:
                for i, segment in enumerate(transcription.segments, start=1):
                    start = self._format_timestamp(segment["start"])
                    end = self._format_timestamp(segment["end"])
                    f.write(f"{i}\n")
                    f.write(f"{start} --> {end}\n")
                    f.write(f"{segment['text'].strip()}\n\n")
                    
            return output_srt_path
            
        except Exception as e:
            error_str = str(e).lower()
            if "rate limit" in error_str or "quota" in error_str or "429" in error_str or "402" in error_str:
                raise GroqQuotaExceeded("GROQ_LIMIT_EXCEEDED")
            raise e

    def _transcribe_offline(self, media_path: str, output_srt_path: str):
        segments, info = self.model.transcribe(media_path, beam_size=5)
        
        with open(output_srt_path, "w", encoding="utf-8") as f:
            for i, segment in enumerate(segments, start=1):
                start = self._format_timestamp(segment.start)
                end = self._format_timestamp(segment.end)
                f.write(f"{i}\n")
                f.write(f"{start} --> {end}\n")
                f.write(f"{segment.text.strip()}\n\n")
                
        return output_srt_path

    def _format_timestamp(self, seconds: float) -> str:
        hours = int(seconds // 3600)
        minutes = int((seconds % 3600) // 60)
        secs = int(seconds % 60)
        millis = int((seconds - int(seconds)) * 1000)
        return f"{hours:02d}:{minutes:02d}:{secs:02d},{millis:03d}"
