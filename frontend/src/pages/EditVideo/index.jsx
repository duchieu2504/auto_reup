import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, Music, Video as VideoIcon, Sliders, ImageIcon, Type, Play, Pause } from 'lucide-react';
import { useEditVideo } from './hooks/useEditVideo';
import { useSubtitleState } from '../../hooks/useSubtitleState';
import { SubtitleConfigPanel } from '../../components/subtitle/SubtitleConfigPanel';
import { WatermarkConfigPanel } from '../../components/subtitle/WatermarkConfigPanel';
import { InteractiveVideoPreview } from '../../components/subtitle/InteractiveVideoPreview';
import { ProfileSelector, SaveProfileButton } from '../../components/subtitle/ProfileSelector';
import { TimelineEditor, parseSRT, stringifySRT, secondsToTime } from '../../components/subtitle/TimelineEditor';
import { AlignLeft } from 'lucide-react';

const API_BASE = 'http://localhost:8000/api';

const EditVideo = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Custom hooks
  const editHook = useEditVideo(id);
  const subtitleConfig = useSubtitleState(id);
  const [activeTab, setActiveTab] = useState('timeline'); // 'timeline' | 'subtitle' | 'watermark' | 'srt'
  const [aspectRatio, setAspectRatio] = useState(null);
  const [currentVideoTime, setCurrentVideoTime] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [videoDuration, setVideoDuration] = useState(0);
  const videoRef = useRef(null);
  const timelineRef = useRef(null);
  
  const videoPath = editHook.videoData?.raw_video_path;
  const subtitle = editHook.subtitle;

  const parsedSubtitleBlocks = React.useMemo(() => parseSRT(subtitle), [subtitle]);
  const activeBlock = parsedSubtitleBlocks.find(b => currentVideoTime >= b.startTime && currentVideoTime <= b.endTime);
  const activeText = activeBlock ? activeBlock.text : '';
  
  const handleSubtitleTextChange = (index, newText) => {
    const newBlocks = [...parsedSubtitleBlocks];
    newBlocks[index].text = newText;
    editHook.setSubtitle(stringifySRT(newBlocks));
  };
  
  // Override previewSubtitleText dynamically for real-time preview
  subtitleConfig.previewSubtitleText = isVideoPlaying 
    ? activeText 
    : (activeText || undefined); // When paused, if no active text, passing undefined falls back to placeholder

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

  const { videoData, saving, setSubtitle, loadingSubtitle, voices, handleSaveAndRender } = editHook;

  const tabs = [
    { id: 'timeline', label: 'Timeline Editor & SRT', icon: <AlignLeft size={14} /> },
    { id: 'subtitle', label: 'Phụ đề & Siêu lách', icon: <Sliders size={14} /> },
    { id: 'watermark', label: 'Logo / Watermark', icon: <ImageIcon size={14} /> }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/history')}
            className="p-2 bg-bg-secondary rounded-lg hover:bg-border-subtle transition-colors cursor-pointer"
            title="Quay lại Lịch sử"
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Left: Config & Profiles (30%) */}
        <div className="lg:col-span-1 flex flex-col gap-6 h-full">
          <ProfileSelector config={subtitleConfig} />
          
          <div className="bg-bg-primary border border-border-subtle rounded-2xl p-6 flex-1">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Music className="text-brand-primary" size={20} /> Cấu Hình Lồng Tiếng
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">Giọng đọc (TTS)</label>
                <select 
                  className="w-full bg-bg-secondary border border-border-subtle rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-primary transition-colors text-sm cursor-pointer"
                  value={subtitleConfig.voice}
                  onChange={e => subtitleConfig.setVoice(e.target.value)}
                >
                  {voices.map(v => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 flex justify-between">
                  <span>Âm lượng nhạc nền</span>
                  <span className="text-brand-primary font-mono">{subtitleConfig.volume}%</span>
                </label>
                <input 
                  type="range" 
                  min="0" max="100" 
                  value={subtitleConfig.volume} 
                  onChange={e => subtitleConfig.setVolume(Number(e.target.value))} 
                  className="w-full h-2 bg-border-subtle rounded-lg appearance-none cursor-pointer accent-brand-primary mt-1"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 flex justify-between">
                  <span>Âm lượng voice gốc</span>
                  <span className="text-brand-primary font-mono">{subtitleConfig.vocalVolume || 0}%</span>
                </label>
                <input 
                  type="range" 
                  min="0" max="100" 
                  value={subtitleConfig.vocalVolume || 0} 
                  onChange={e => subtitleConfig.setVocalVolume(Number(e.target.value))} 
                  className="w-full h-2 bg-border-subtle rounded-lg appearance-none cursor-pointer accent-brand-primary mt-1"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Top Right: Video Preview (70%) */}
        <div className="lg:col-span-2 bg-bg-primary border border-border-subtle rounded-2xl p-4 flex flex-col h-full min-h-[450px]">
          <h2 className="text-sm font-semibold text-text-primary mb-3 shrink-0 flex items-center gap-2">
            <VideoIcon size={16} className="text-brand-primary" /> Xem trước Video Gốc
          </h2>
          <div className="flex-1 flex flex-col min-h-0 relative gap-2">
            <div className="flex-1 relative overflow-hidden bg-black/40 rounded-lg border border-border-subtle/50 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center justify-center p-2">
                {videoData.raw_video_path ? (
                  <InteractiveVideoPreview config={subtitleConfig} aspectRatio={aspectRatio} className="max-w-full max-h-full" isFfmpegPreview={false}>
                    <video 
                      ref={videoRef}
                      src={`${API_BASE}/files/${(videoData.raw_video_path || '').replace(/\\/g, '/').replace(/^.*?(?:^|\/)data\//, '').split('/').map(encodeURIComponent).join('/')}`}
                      className="max-w-full max-h-full block rounded-lg shadow-lg cursor-pointer"
                      onClick={() => { if (videoRef.current) { if (isVideoPlaying) videoRef.current.pause(); else videoRef.current.play(); } }}
                      onLoadedMetadata={(e) => { setAspectRatio(e.target.videoWidth / e.target.videoHeight); setVideoDuration(e.target.duration); }}
                      onTimeUpdate={(e) => setCurrentVideoTime(e.target.currentTime)}
                      onPlay={() => setIsVideoPlaying(true)}
                      onPause={() => setIsVideoPlaying(false)}
                      onEnded={() => setIsVideoPlaying(false)}
                    />
                  </InteractiveVideoPreview>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-text-secondary gap-2">
                    <VideoIcon size={32} className="opacity-20" />
                    <span>Không tìm thấy file video</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Custom Controls */}
            {videoData.raw_video_path && (
              <div className="h-10 shrink-0 flex items-center gap-3 px-3 bg-bg-secondary rounded-lg border border-border-subtle">
                <span className="text-xs font-mono text-text-secondary w-10 text-center">
                  {Math.floor(currentVideoTime / 60).toString().padStart(2, '0')}:{Math.floor(currentVideoTime % 60).toString().padStart(2, '0')}
                </span>
                <input 
                  type="range"
                  min={0}
                  max={videoDuration || 100}
                  step={0.01}
                  value={currentVideoTime}
                  onChange={(e) => {
                    const newTime = Number(e.target.value);
                    setCurrentVideoTime(newTime);
                    if (videoRef.current) videoRef.current.currentTime = newTime;
                  }}
                  className="flex-1 h-1.5 bg-border-subtle rounded-lg appearance-none cursor-pointer accent-brand-primary [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-brand-primary [&::-webkit-slider-thumb]:rounded-full"
                />
                <span className="text-xs font-mono text-text-secondary w-10 text-center">
                  {Math.floor((videoDuration || 0) / 60).toString().padStart(2, '0')}:{Math.floor((videoDuration || 0) % 60).toString().padStart(2, '0')}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section: Editor Tabs & Timeline (Full Width 100%) */}
      <div className="w-full bg-bg-primary border border-border-subtle rounded-2xl flex flex-col overflow-hidden h-[85vh] min-h-[800px]">
        {/* Tab Header */}
        <div className="flex border-b border-border-subtle bg-bg-secondary/50 px-4 pt-2.5 gap-2 overflow-x-auto scrollbar-none">
          {tabs.map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`py-2.5 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all duration-300 cursor-pointer flex items-center gap-2 pb-3.5 whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-brand-primary text-brand-primary bg-bg-tertiary/50 rounded-t-lg"
                  : "border-transparent text-text-secondary hover:text-text-primary hover:bg-bg-tertiary/30 rounded-t-lg"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.id === 'srt' && loadingSubtitle && (
                <Loader2 size={12} className="animate-spin text-brand-primary" />
              )}
            </button>
          ))}
        </div>
        
        {/* Tab Content */}
        <div className="p-5 flex-1 flex flex-col overflow-y-auto min-h-0 bg-bg-secondary/10">
          {activeTab === 'timeline' && (
            <div className="flex-1 flex flex-col gap-6 animate-in fade-in duration-200">
              {/* Timeline (Top) */}
              <div className="shrink-0">
                <TimelineEditor 
                  ref={timelineRef}
                  videoData={videoData} 
                  subtitle={subtitle} 
                  setSubtitle={setSubtitle} 
                  onSeek={(time) => {
                    setCurrentVideoTime(time);
                    if (videoRef.current) videoRef.current.currentTime = time;
                  }}
                  onPlay={() => videoRef.current?.play()}
                  onPause={() => videoRef.current?.pause()}
                />
              </div>
              
              {/* SRT Text (Bottom) */}
              <div className="flex-1 flex flex-col min-h-[450px]">
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2.5 flex items-center gap-2">
                  <Type size={14} className="text-brand-primary" /> Nội dung File Phụ Đề (SRT)
                  {editHook.loadingSubtitle && <Loader2 size={12} className="animate-spin text-brand-primary ml-2" />}
                </label>
                <div className="flex-1 overflow-y-auto space-y-2 p-4 bg-bg-primary/40 border border-border-subtle rounded-xl scrollbar-thin scrollbar-thumb-bg-tertiary">
                  {parsedSubtitleBlocks.length > 0 ? (
                    parsedSubtitleBlocks.map((sub, idx) => {
                      const isActive = currentVideoTime >= sub.startTime && currentVideoTime <= sub.endTime;
                      return (
                        <div 
                          key={idx} 
                          className={`p-3 rounded-lg border transition-colors ${
                            isActive ? 'bg-brand-primary/10 border-brand-primary' : 'bg-bg-secondary border-border-subtle hover:border-brand-primary/50'
                          }`}
                        >
                          <div 
                            className="flex justify-between items-center mb-2 cursor-pointer" 
                            onClick={() => {
                              setCurrentVideoTime(sub.startTime);
                              if (videoRef.current) videoRef.current.currentTime = sub.startTime;
                              if (timelineRef.current) timelineRef.current.seekTo(sub.startTime);
                            }}
                          >
                            <span className="text-xs font-bold text-brand-primary">#{sub.id}</span>
                            <span className="text-xs font-mono text-text-secondary bg-bg-primary px-2 py-0.5 rounded">
                              {secondsToTime(sub.startTime)} ➔ {secondsToTime(sub.endTime)}
                            </span>
                          </div>
                          <textarea
                            className="w-full bg-transparent border-none text-white text-sm resize-none focus:outline-none focus:ring-0 p-0 m-0"
                            rows={Math.max(1, sub.text.split(/\r?\n/).length)}
                            value={sub.text}
                            onChange={(e) => handleSubtitleTextChange(idx, e.target.value)}
                          />
                        </div>
                      );
                    })
                  ) : (
                    <div className="h-full flex items-center justify-center text-text-secondary/50 text-sm">
                      Không có dữ liệu phụ đề SRT
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'subtitle' && (
            <div className="space-y-4 animate-in fade-in duration-200 max-w-4xl">
              <SubtitleConfigPanel config={subtitleConfig} />
            </div>
          )}
          
          {activeTab === 'watermark' && (
            <div className="space-y-4 animate-in fade-in duration-200 max-w-4xl">
              <WatermarkConfigPanel config={subtitleConfig} />
            </div>
          )}
        </div>

        {/* Sticky Actions Footer */}
        <div className="p-4 border-t border-border-subtle bg-bg-secondary/40 flex items-center justify-between gap-3 shrink-0">
          <SaveProfileButton config={subtitleConfig} />
          <button 
            className="px-8 py-3 bg-gradient-to-r from-brand-primary to-purple-600 hover:opacity-95 text-white rounded-xl font-bold transition-all duration-300 flex items-center gap-2 shadow-lg shadow-brand-primary/25 cursor-pointer text-sm"
            onClick={() => {
              if (typeof subtitleConfig.saveEditProfile === 'function') {
                subtitleConfig.saveEditProfile();
              }
              handleSaveAndRender(subtitleConfig);
            }}
            disabled={saving}
          >
            {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
            <span>Lưu & Render Lại Ngay</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditVideo;
