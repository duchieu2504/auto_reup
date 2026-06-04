import React, { useEffect, useRef, useState } from 'react';
import { FileVideo, PlayCircle, Settings } from 'lucide-react';
import { useProcessor } from '../context/ProcessorContext';
import { toast } from 'react-hot-toast';
import { useSubtitleState } from '../hooks/useSubtitleState';
import { SubtitleConfigPanel } from '../components/subtitle/SubtitleConfigPanel';
import { WatermarkConfigPanel } from '../components/subtitle/WatermarkConfigPanel';

const Phase2Processor = () => {
  const { videoPath, setVideoPath, isProcessing, logs, startProcessing } = useProcessor();
  const logContainerRef = useRef(null);
  
  const subtitleState = useSubtitleState();

  const [voices, setVoices] = useState([]);
  const [voiceMode, setVoiceMode] = useState("edge_auto");
  const [bgVolume, setBgVolume] = useState(10);

  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    fetch('http://localhost:8000/api/settings/voices')
      .then(res => res.json())
      .then(data => setVoices(data.voices || []))
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const handleStart = (e) => {
    e.preventDefault();
    startProcessing(videoPath, { 
      voiceMode, bgVolume, 
      flipVideo: subtitleState.flipVideo, 
      optZoom: subtitleState.optZoom, 
      optColor: subtitleState.optColor, 
      optNoise: subtitleState.optNoise, 
      optPitch: subtitleState.optPitch,
      subConfig: subtitleState.subConfig
    });
  };

  const handleScanFolder = async () => {
    if (!videoPath) return;
    setIsScanning(true);
    try {
      const res = await fetch(`http://localhost:8000/api/processor/scan-folder?folder_path=${encodeURIComponent(videoPath)}`);
      const data = await res.json();
      if (data.status === 'success' && data.files.length > 0) {
        setVideoPath(data.files.join('\n'));
        toast.success(`Tìm thấy ${data.files.length} video.`);
      } else {
        toast.error("Không tìm thấy file mp4 nào trong thư mục này, hoặc thư mục không tồn tại.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi khi quét thư mục");
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 rounded-2xl">
        <h3 className="text-xl font-bold mb-6 tracking-tight">Upload File Có Sẵn (Xử lý Nội bộ)</h3>
        <form onSubmit={handleStart} className="space-y-6">
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-text-secondary">Đường dẫn Video Gốc hoặc Tên Thư mục</label>
              <button 
                type="button" 
                onClick={handleScanFolder}
                disabled={isScanning || !videoPath}
                className="text-xs bg-bg-tertiary hover:bg-border-subtle text-text-primary px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
              >
                {isScanning ? 'Đang quét...' : 'Quét Thư mục'}
              </button>
            </div>
            <div className="relative group">
              <FileVideo size={18} className="absolute left-4 top-4 text-text-secondary group-focus-within:text-brand-primary transition-colors" />
              <textarea 
                className="w-full bg-bg-secondary border border-border-subtle rounded-xl py-3 pl-12 pr-4 text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition-all duration-200 resize-none" 
                placeholder="Nhập đường dẫn file (.mp4) trong máy hoặc tên thư mục (ví dụ: Douyin_User1)..." 
                value={videoPath}
                onChange={(e) => setVideoPath(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Giọng Lồng Tiếng AI</label>
              <select 
                className="w-full bg-bg-secondary border border-border-subtle rounded-xl py-3 px-4 text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition-all duration-200 appearance-none" 
                value={voiceMode} 
                onChange={e => setVoiceMode(e.target.value)}
              >
                {voices.map(v => (
                  <option key={v.id} value={v.id}>{v.name} [{v.provider}]</option>
                ))}
                {voices.length === 0 && <option value="edge_auto">Đang tải danh sách giọng...</option>}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Âm lượng Video Gốc ({bgVolume}%)</label>
              <input 
                type="range" 
                min="0" max="100" 
                value={bgVolume} 
                onChange={e => setBgVolume(Number(e.target.value))} 
                className="w-full h-2 bg-border-subtle rounded-lg appearance-none cursor-pointer accent-brand-primary mt-3" 
              />
            </div>
          </div>
          

          <SubtitleConfigPanel config={subtitleState} />
          <WatermarkConfigPanel config={subtitleState} />
          
          <div className="pt-2">
             <button 
              type="submit" 
              className="flex items-center gap-2 bg-brand-primary hover:bg-brand-hover text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed" 
              disabled={isProcessing}
            >
                {isProcessing ? <PlayCircle size={18} className="animate-spin" /> : <Settings size={18} />}
                {isProcessing ? 'Đang Render...' : 'Bắt đầu Xử lý'}
              </button>
          </div>
        </form>
      </div>

      <div className="glass-panel p-6 rounded-2xl">
        <h3 className="text-xl font-bold mb-6 tracking-tight">Log Tiến Trình (Live Stream)</h3>
        <div 
          ref={logContainerRef}
          className="bg-[#010409] border border-border-subtle rounded-xl p-6 font-mono text-sm h-[400px] overflow-y-auto leading-relaxed shadow-inner"
        >
          {logs.length === 0 ? (
            <div className="text-text-secondary italic">Chưa có tiến trình nào đang chạy...</div>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="whitespace-pre-wrap">{log}</div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Phase2Processor;
