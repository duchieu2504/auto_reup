import os
import subprocess
import imageio_ffmpeg

ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()

def extract_audio(video_path: str, output_audio_path: str):
    """
    Tách âm thanh từ video gốc thành file mp3 (nếu cần thiết cho các công cụ khác).
    """
    cmd = [
        ffmpeg_exe,
        "-y",
        "-i", video_path,
        "-q:a", "0",
        "-map", "a",
        output_audio_path
    ]
    try:
        subprocess.run(cmd, check=True, capture_output=True, text=True)
        return output_audio_path
    except subprocess.CalledProcessError as e:
        raise Exception(f"Lỗi FFmpeg khi trích xuất âm thanh: {e.stderr}")

def separate_audio_with_ai(audio_path: str, output_dir: str, log_callback=None):
    """
    Sử dụng AI (UVR5/Demucs) để bóc tách giọng nói/giọng hát ra khỏi nhạc nền.
    Trả về (vocal_file, instrumental_file). Nếu thất bại trả về (audio_path, None).
    """
    try:
        from audio_separator.separator import Separator
    except ImportError:
        if log_callback:
            log_callback("[!] Chưa cài đặt audio-separator. Bỏ qua bước tách AI.\n")
        return audio_path, None

    if log_callback:
        log_callback(f"[*] Đang tách giọng nói bằng AI (UVR5), quá trình này mất khoảng 15-30s...\n")

    try:
        # Cấu hình Separator sử dụng CPU hoặc ONNX GPU
        separator = Separator(
            output_dir=output_dir, 
            output_format="wav"
        )
        
        # Tải mô hình mặc định chất lượng cao cho việc bóc tách
        separator.load_model(model_filename="UVR-MDX-NET-Inst_HQ_3.onnx")
        
        # Thực hiện tách (trả về danh sách file output, thường là [Inst, Vocals])
        output_files = separator.separate(audio_path)
        
        vocal_file = None
        instrumental_file = None
        for f in output_files:
            if "Vocals" in f or "vocals" in f.lower():
                vocal_file = os.path.join(output_dir, f)
            elif "Instrumental" in f or "instrumental" in f.lower() or "Other" in f:
                instrumental_file = os.path.join(output_dir, f)
                
        if not vocal_file and len(output_files) >= 2:
            vocal_file = os.path.join(output_dir, output_files[1])
        if not instrumental_file and len(output_files) >= 1:
            instrumental_file = os.path.join(output_dir, output_files[0])
            
        if vocal_file and os.path.exists(vocal_file):
            if log_callback:
                log_callback(f"[*] Đã tách giọng nói bằng AI thành công.\n")
            return vocal_file, instrumental_file
            
        return audio_path, None
        
    except Exception as e:
        if log_callback:
            log_callback(f"[!] Lỗi khi tách âm thanh AI: {e}. Sẽ sử dụng âm thanh gốc.\n")
        return audio_path, None
