import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Play, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

const API_BASE = 'http://localhost:8000/api';

const EditVideo = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [videoData, setVideoData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // States for editing
  const [voiceMode, setVoiceMode] = useState('edge_auto');
  const [bgVolume, setBgVolume] = useState(10);
  const [flipVideo, setFlipVideo] = useState(false);
  const [subtitle, setSubtitle] = useState('');
  const [loadingSubtitle, setLoadingSubtitle] = useState(false);

  useEffect(() => {
    fetchVideoData();
  }, [id]);

  const fetchVideoData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/history/${id}`);
      if (!res.ok) throw new Error("Không tìm thấy video");
      const data = await res.json();
      setVideoData(data);
      
      // Fetch translated subtitle if available
      if (data.srt_translated_path) {
        fetchSubtitle(data.srt_translated_path);
      } else if (data.srt_origin_path) {
        fetchSubtitle(data.srt_origin_path); // Fallback if no translation yet
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

  const handleSaveAndRender = async () => {
    if (!videoData) return;
    setSaving(true);
    try {
      // Gọi đúng API endpoint và payload format của Phase2Processor
      const res = await fetch(`${API_BASE}/processor/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          video_paths: [videoData.raw_video_path],
          voice_mode: voiceMode,
          bg_volume: parseInt(bgVolume),
          flip_video: flipVideo,
          force_render: true
        })
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin text-brand-primary" size={32} />
      </div>
    );
  }

  if (!videoData) {
    return <div className="text-center text-text-secondary">Không có dữ liệu.</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate(-1)} 
          className="p-2 bg-bg-secondary hover:bg-bg-tertiary rounded-full transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-2xl font-bold">Edit Video: {videoData.original_name}</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Play size={18} /> Preview Gốc
          </h3>
          <div className="w-full bg-black rounded-xl overflow-hidden aspect-video flex items-center justify-center">
            {videoData.raw_video_path ? (
              <video 
                src={`http://localhost:8000/api/files/${videoData.raw_video_path.replace(/^[/]?data[/]/, '')}`} 
                controls 
                className="w-full h-full object-contain"
              />
            ) : (
              <span className="text-text-secondary">Không có file gốc</span>
            )}
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl space-y-6">
          <h3 className="font-semibold text-lg">Cấu Hình Lại</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-text-secondary">Thay đổi Giọng AI</label>
              <select 
                value={voiceMode} 
                onChange={(e) => setVoiceMode(e.target.value)}
                className="w-full bg-bg-secondary border border-border-subtle rounded-xl p-3 focus:outline-none focus:border-brand-primary transition-colors appearance-none"
              >
                <option value="none">Giữ nguyên âm gốc (Không lồng tiếng)</option>
                <option value="edge_auto">EdgeTTS (Auto-detect Language)</option>
                <option value="edge_vi">EdgeTTS (Tiếng Việt mặc định)</option>
                <option value="coqui_tts">Coqui TTS (Local - Yêu cầu GPU)</option>
                <option value="elevenlabs">ElevenLabs (Cao cấp)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-text-secondary">
                Âm lượng nhạc nền ({bgVolume}%)
              </label>
              <input 
                type="range" 
                min="0" max="100" 
                value={bgVolume} 
                onChange={(e) => setBgVolume(e.target.value)}
                className="w-full accent-brand-primary" 
              />
            </div>

            <div className="flex items-center gap-3 p-3 bg-bg-secondary rounded-xl border border-border-subtle w-full">
              <input 
                type="checkbox" 
                id="flipVideoEdit"
                checked={flipVideo}
                onChange={(e) => setFlipVideo(e.target.checked)}
                className="w-5 h-5 accent-brand-primary rounded bg-bg-primary border-border-subtle cursor-pointer"
              />
              <label htmlFor="flipVideoEdit" className="text-sm font-medium text-text-primary cursor-pointer select-none">
                Lật ngang Video (Lách bản quyền hình ảnh)
              </label>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <label className="block text-sm font-medium text-text-secondary">Chỉnh Sửa Phụ Đề (SRT)</label>
                {loadingSubtitle && <Loader2 size={14} className="animate-spin text-brand-primary" />}
              </div>
              <textarea 
                rows={6}
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                disabled={loadingSubtitle}
                className="w-full bg-bg-secondary border border-border-subtle rounded-xl p-4 focus:outline-none focus:border-brand-primary transition-colors resize-none font-mono text-sm disabled:opacity-50"
                placeholder={loadingSubtitle ? "Đang tải dữ liệu phụ đề..." : "Nội dung phụ đề trống hoặc không tồn tại..."}
              />
              <p className="text-xs text-text-secondary mt-2">Lưu ý: Bạn có thể sửa trực tiếp nội dung phụ đề. Hệ thống sẽ sinh lại audio dựa trên văn bản này.</p>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button 
              onClick={handleSaveAndRender}
              disabled={saving}
              className="px-6 py-3 bg-brand-primary hover:bg-brand-primary/90 text-white font-medium rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              {saving ? "Đang xử lý..." : "Lưu & Render Lại"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditVideo;
