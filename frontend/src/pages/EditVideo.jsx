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
  const [optZoom, setOptZoom] = useState(false);
  const [optColor, setOptColor] = useState(false);
  const [optNoise, setOptNoise] = useState(false);
  const [optPitch, setOptPitch] = useState(false);
  const [subtitleStyle, setSubtitleStyle] = useState('black_white');
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
          opt_zoom: optZoom,
          opt_color: optColor,
          opt_noise: optNoise,
          opt_pitch: optPitch,
          force_render: true,
          subtitle_style: subtitleStyle
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
                src={`http://localhost:8000/api/files/${videoData.raw_video_path.replace(/^[/]?data[/]/, '')}?t=${Date.now()}`} 
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
                {voices.map(v => (
                  <option key={v.id} value={v.id}>{v.name} ({v.provider})</option>
                ))}
                {voices.length === 0 && <option value="edge_auto">Đang tải danh sách giọng...</option>}
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

            <div>
              <label className="block text-sm font-medium mb-2 text-text-secondary">Style Phụ Đề</label>
              <select 
                value={subtitleStyle} 
                onChange={(e) => setSubtitleStyle(e.target.value)}
                className="w-full bg-bg-secondary border border-border-subtle rounded-xl p-3 focus:outline-none focus:border-brand-primary transition-colors appearance-none"
              >
                <option value="black_white">Nền đen bo góc, Chữ trắng</option>
                <option value="white_black">Nền trắng bo góc, Chữ đen</option>
              </select>
            </div>

            <div className="bg-bg-secondary rounded-xl border border-border-subtle p-3 w-full">
              <div className="flex items-center justify-between mb-3 border-b border-border-subtle pb-2">
                <label className="text-sm font-semibold text-text-primary">
                  Tính năng Siêu lách bản quyền (Micro-alterations)
                </label>
                <button 
                  type="button" 
                  onClick={() => {
                    const newState = !(flipVideo && optZoom && optColor && optNoise && optPitch);
                    setFlipVideo(newState);
                    setOptZoom(newState);
                    setOptColor(newState);
                    setOptNoise(newState);
                    setOptPitch(newState);
                  }}
                  className="text-xs bg-brand-primary/10 text-brand-primary px-2 py-1 rounded hover:bg-brand-primary/20"
                >
                  Chọn tất cả
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="flipVideoEdit" checked={flipVideo} onChange={(e) => setFlipVideo(e.target.checked)} className="w-4 h-4 accent-brand-primary cursor-pointer" />
                  <label htmlFor="flipVideoEdit" className="text-xs text-text-secondary cursor-pointer select-none">Lật gương (Mirror)</label>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="optZoomEdit" checked={optZoom} onChange={(e) => setOptZoom(e.target.checked)} className="w-4 h-4 accent-brand-primary cursor-pointer" />
                  <label htmlFor="optZoomEdit" className="text-xs text-text-secondary cursor-pointer select-none">Zoom 2%</label>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="optColorEdit" checked={optColor} onChange={(e) => setOptColor(e.target.checked)} className="w-4 h-4 accent-brand-primary cursor-pointer" />
                  <label htmlFor="optColorEdit" className="text-xs text-text-secondary cursor-pointer select-none">Tăng màu (EQ)</label>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="optNoiseEdit" checked={optNoise} onChange={(e) => setOptNoise(e.target.checked)} className="w-4 h-4 accent-brand-primary cursor-pointer" />
                  <label htmlFor="optNoiseEdit" className="text-xs text-text-secondary cursor-pointer select-none">Nhiễu hạt (Noise)</label>
                </div>
                <div className="flex items-center gap-2 col-span-2">
                  <input type="checkbox" id="optPitchEdit" checked={optPitch} onChange={(e) => setOptPitch(e.target.checked)} className="w-4 h-4 accent-brand-primary cursor-pointer" />
                  <label htmlFor="optPitchEdit" className="text-xs text-text-secondary cursor-pointer select-none">Đổi tần số âm thanh (Pitch 2%)</label>
                </div>
              </div>
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
