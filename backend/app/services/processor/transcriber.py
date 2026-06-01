from faster_whisper import WhisperModel
import os

class Transcriber:
    def __init__(self, model_size="base"):
        # Chạy trên CPU, dùng model 'base' để cân bằng giữa tốc độ và độ chính xác
        self.model = WhisperModel(model_size, device="cpu", compute_type="int8")
        
    def transcribe(self, media_path: str, output_srt_path: str):
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
