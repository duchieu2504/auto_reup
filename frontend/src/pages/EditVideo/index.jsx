import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, Music, Video as VideoIcon } from 'lucide-react';
import { useEditVideo } from './hooks/useEditVideo';
import { useSubtitleState } from '../../hooks/useSubtitleState';
import { SubtitleConfigPanel } from '../../components/subtitle/SubtitleConfigPanel';
import { WatermarkConfigPanel } from '../../components/subtitle/WatermarkConfigPanel';
import { InteractiveVideoPreview } from '../../components/subtitle/InteractiveVideoPreview';
import { ProfileSelector, SaveProfileButton } from '../../components/subtitle/ProfileSelector';

const API_BASE = 'http://localhost:8000/api';

const EditVideo = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Custom hooks
  const editHook = useEditVideo(id);
  const subtitleConfig = useSubtitleState();

  if (editHook.loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
      </div>
    );
  }

  if (!editHook.videoData) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-text-secondary">
        <p>Video không tồn tại hoặc đã bị xóa.</p>
        <button onClick={() => navigate('/history')} className="mt-4 text-brand-primary hover:underline">
          Quay lại Lịch sử
        </button>
      </div>
    );
  }

  const { videoData, saving, subtitle, setSubtitle, loadingSubtitle, voices, handleSaveAndRender } = editHook;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/history')}
            className="p-2 bg-bg-secondary rounded-lg hover:bg-border-subtle transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <VideoIcon className="text-brand-primary" /> Edit Video
            </h1>
            <p className="text-text-secondary text-sm mt-1">{videoData.title || "Không có tiêu đề"}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <SaveProfileButton config={subtitleConfig} />
          <button 
            className="px-6 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-hover transition-colors font-medium flex items-center gap-2 shadow-lg shadow-brand-primary/20"
            onClick={() => handleSaveAndRender(subtitleConfig)}
            disabled={saving}
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            Lưu & Render Lại
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Col: Preview & Audio Config */}
        <div className="space-y-6">
          <ProfileSelector config={subtitleConfig} />
          
          <div className="bg-bg-primary border border-border-subtle rounded-2xl p-4">
            <h2 className="text-sm font-semibold text-text-primary mb-3">Xem trước Video Gốc</h2>
            {videoData.raw_video_path ? (
              <InteractiveVideoPreview config={subtitleConfig}>
                <video 
                  src={`${API_BASE}/files/${videoData.raw_video_path.replace(/^[/]?data[/]/, '')}`}
                  controls
                  className="w-full max-h-[500px] object-contain rounded-lg"
                />
              </InteractiveVideoPreview>
            ) : (
              <div className="w-full aspect-video bg-bg-secondary rounded-lg flex items-center justify-center text-text-secondary">
                Không tìm thấy file video
              </div>
            )}
          </div>

          <div className="bg-bg-primary border border-border-subtle rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Music className="text-brand-primary" size={20} /> Cấu Hình Lồng Tiếng
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Giọng đọc (TTS)</label>
                <select 
                  className="w-full bg-bg-secondary border border-border-subtle rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-primary transition-colors"
                  value={subtitleConfig.voice}
                  onChange={e => subtitleConfig.setVoice(e.target.value)}
                >
                  {voices.map(v => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Âm lượng nhạc nền: {subtitleConfig.volume}%</label>
                <input 
                  type="range" 
                  min="0" max="100" 
                  value={subtitleConfig.volume} 
                  onChange={e => subtitleConfig.setVolume(Number(e.target.value))} 
                  className="w-full h-2 bg-border-subtle rounded-lg appearance-none cursor-pointer accent-brand-primary"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Subtitle Editor */}
        <div className="bg-bg-primary border border-border-subtle rounded-2xl flex flex-col overflow-hidden h-[800px]">
          <div className="p-4 border-b border-border-subtle bg-bg-secondary/50 flex justify-between items-center">
            <h2 className="font-bold text-white">Chỉnh sửa Phụ đề (SRT)</h2>
            {loadingSubtitle && <Loader2 size={16} className="animate-spin text-brand-primary" />}
          </div>
          
          <div className="p-4 flex-1 flex flex-col overflow-y-auto">
            <textarea
              className="min-h-[200px] w-full bg-bg-secondary border border-border-subtle rounded-xl p-4 text-white font-mono text-sm resize-none focus:outline-none focus:border-brand-primary transition-colors mb-4"
              value={subtitle}
              onChange={e => setSubtitle(e.target.value)}
              placeholder="Nội dung file SRT sẽ hiển thị ở đây..."
            />
            
            <SubtitleConfigPanel config={subtitleConfig} />
            <WatermarkConfigPanel config={subtitleConfig} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditVideo;
