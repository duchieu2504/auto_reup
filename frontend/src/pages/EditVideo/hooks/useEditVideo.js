import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const API_BASE = 'http://localhost:8000/api';

export const useEditVideo = (id) => {
  const navigate = useNavigate();
  const [videoData, setVideoData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [subtitle, setSubtitle] = useState('');
  const [loadingSubtitle, setLoadingSubtitle] = useState(false);
  const [voices, setVoices] = useState([]);

  useEffect(() => {
    fetchVideoData();
    fetch('http://localhost:8000/api/settings/voices')
      .then(res => res.json())
      .then(data => {
        if(data.voices) setVoices(data.voices);
      })
      .catch(err => console.error("Lỗi lấy danh sách giọng:", err));
  }, [id]);

  const fetchVideoData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/history/${id}`);
      if (!res.ok) throw new Error("Không tìm thấy video");
      const data = await res.json();
      setVideoData(data);
      
      if (data.srt_translated_path) {
        fetchSubtitle(data.srt_translated_path);
      } else if (data.srt_origin_path) {
        fetchSubtitle(data.srt_origin_path);
      } else {
        setSubtitle("");
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi tải thông tin video");
    } finally {
      setLoading(false);
    }
  };

  const fetchSubtitle = async (srtPath) => {
    setLoadingSubtitle(true);
    try {
      const cleanPath = srtPath.replace(/^[/]?data[/]/, '');
      const res = await fetch(`${API_BASE}/files/${cleanPath}`);
      if (res.ok) {
        const text = await res.text();
        setSubtitle(text);
      } else {
        setSubtitle("");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingSubtitle(false);
    }
  };

  const handleSaveAndRender = async (subtitleConfig) => {
    if (!videoData) return;
    setSaving(true);
    try {
      let finalWatermarkImagePath = subtitleConfig.watermarkImagePreview;
      
      // If image watermark is used and there's a new file, upload it first
      if (subtitleConfig.watermarkType === 'image' && subtitleConfig.watermarkImageFile) {
        const formData = new FormData();
        formData.append('file', subtitleConfig.watermarkImageFile);
        
        try {
          const uploadRes = await fetch(`${API_BASE}/processor/upload-logo`, {
            method: 'POST',
            body: formData
          });
          if (uploadRes.ok) {
            const uploadData = await uploadRes.json();
            finalWatermarkImagePath = uploadData.path; // Absolute path returned from server
          } else {
            toast.error("Lỗi khi tải lên ảnh Logo!");
            setSaving(false);
            return;
          }
        } catch (error) {
          console.error("Upload logo error:", error);
          toast.error("Không thể kết nối đến máy chủ để tải ảnh.");
          setSaving(false);
          return;
        }
      }

      const payload = {
        video_paths: [videoData.raw_video_path],
        voice_mode: subtitleConfig.voice,
        bg_volume: parseInt(subtitleConfig.volume),
        flip_video: subtitleConfig.flipVideo,
        opt_zoom: subtitleConfig.optZoom,
        opt_color: subtitleConfig.optColor,
        opt_noise: subtitleConfig.optNoise,
        opt_pitch: subtitleConfig.optPitch,
        force_render: true,
        subtitle_font_family: subtitleConfig.subtitleFont,
        subtitle_style: subtitleConfig.subtitleStyle,
        subtitle_text_color: subtitleConfig.subtitleTextColor,
        subtitle_bg_color: subtitleConfig.subtitleBgColor,
        subtitle_font_size: subtitleConfig.subtitleFontSize,
        subtitle_margin_v: subtitleConfig.subtitleMarginV,
        subtitle_bg_padding: subtitleConfig.subtitleBgPadding,
        subtitle_bg_opacity: subtitleConfig.subtitleBgOpacity,
        watermark_type: subtitleConfig.watermarkType,
        watermark_text: subtitleConfig.watermarkText,
        watermark_image_path: finalWatermarkImagePath,
        watermark_x: subtitleConfig.watermarkX,
        watermark_y: subtitleConfig.watermarkY,
        watermark_size: subtitleConfig.watermarkSize,
        watermark_color: subtitleConfig.watermarkColor,
        watermark_opacity: subtitleConfig.watermarkOpacity
      };

      const res = await fetch(`${API_BASE}/processor/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        toast.success("Đã bắt đầu tiến trình Render lại!");
        navigate('/history');
      } else {
        toast.error("Có lỗi xảy ra khi gọi API");
      }
    } catch (err) {
      console.error(err);
      toast.error("Có lỗi xảy ra khi gọi API");
    } finally {
      setSaving(false);
    }
  };

  return {
    videoData, loading, saving, subtitle, setSubtitle, loadingSubtitle, voices,
    handleSaveAndRender
  };
};
