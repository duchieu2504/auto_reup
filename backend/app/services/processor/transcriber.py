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
        
        # Chỉ load model CPU nếu không dùng Groq để tiết kiệm RAM
        self.model = None
        if not self.use_groq:
            self.model = WhisperModel(model_size, device="cpu", compute_type="int8")
        elif self.use_groq and not self.groq_api_key:
            # Fallback nếu bật Groq nhưng quên nhập Key
            self.use_groq = False
            self.model = WhisperModel(model_size, device="cpu", compute_type="int8")
            
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
            return self._transcribe_groq(media_path, output_srt_path)
        else:
            return self._transcribe_offline(media_path, output_srt_path)

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
