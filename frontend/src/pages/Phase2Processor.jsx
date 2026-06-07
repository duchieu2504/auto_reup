import React, { useEffect, useRef, useState } from 'react';
import { FileVideo, PlayCircle, Settings, Save, Trash2 } from 'lucide-react';
import { useProcessor } from '../context/ProcessorContext';
import { toast } from 'react-hot-toast';
import { useSubtitleState } from '../hooks/useSubtitleState';
import { SubtitleConfigPanel } from '../components/subtitle/SubtitleConfigPanel';
import { WatermarkConfigPanel } from '../components/subtitle/WatermarkConfigPanel';

const Phase2Processor = () => {
  const { videoPath, setVideoPath, isProcessing, logs, progress, startProcessing } = useProcessor();
  const logContainerRef = useRef(null);
  
  const subtitleState = useSubtitleState();

  const [voices, setVoices] = useState([]);
  const [voiceMode, setVoiceMode] = useState("edge_auto");
  const [bgVolume, setBgVolume] = useState(10);

  const [isScanning, setIsScanning] = useState(false);

  // Edit Profiles State
  const [editProfiles, setEditProfiles] = useState([]);
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [newProfileName, setNewProfileName] = useState("");

  useEffect(() => {
    fetch('http://localhost:8000/api/settings/voices')
      .then(res => res.json())
      .then(data => setVoices(data.voices || []))
      .catch(err => console.error(err));
      
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/edit-profiles');
      if (res.ok) {
        const data = await res.json();
        setEditProfiles(data);
      }
    } catch (err) {
      console.error("Lỗi lấy danh sách mẫu cấu hình:", err);
    }
  };

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

  const uploadWatermarkIfNeeded = async () => {
    if (subtitleState.watermarkType === 'image' && subtitleState.watermarkImageFile) {
      const formData = new FormData();
      formData.append('file', subtitleState.watermarkImageFile);
      try {
        const res = await fetch('http://localhost:8000/api/edit-profiles/upload-watermark', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        if (data.success) return data.path;
      } catch (err) {
        console.error("Lỗi upload watermark", err);
        throw new Error("Không thể upload watermark");
      }
    }
    return subtitleState.watermarkImagePreview;
  };

  const handleSaveProfile = async () => {
    if (!newProfileName.trim()) {
      toast.error("Vui lòng nhập tên cấu hình!");
      return;
    }
    const toastId = toast.loading("Đang lưu cấu hình...");
    try {
      const watermarkPath = await uploadWatermarkIfNeeded();
      
      const configObj = {
        voiceMode,
        bgVolume,
        flipVideo: subtitleState.flipVideo,
        optZoom: subtitleState.optZoom,
        optColor: subtitleState.optColor,
        optNoise: subtitleState.optNoise,
        optPitch: subtitleState.optPitch,
        
        subtitleFont: subtitleState.subtitleFont,
        subtitleStyle: subtitleState.subtitleStyle,
        subtitleTextColor: subtitleState.subtitleTextColor,
        subtitleBgColor: subtitleState.subtitleBgColor,
        subtitleFontSize: subtitleState.subtitleFontSize,
        subtitleMarginV: subtitleState.subtitleMarginV,
        subtitleBgPadding: subtitleState.subtitleBgPadding,
        subtitleBgOpacity: subtitleState.subtitleBgOpacity,
        
        watermarkType: subtitleState.watermarkType,
        watermarkText: subtitleState.watermarkText,
        watermarkImagePreview: watermarkPath,
        watermarkX: subtitleState.watermarkX,
        watermarkY: subtitleState.watermarkY,
        watermarkSize: subtitleState.watermarkSize,
        watermarkColor: subtitleState.watermarkColor,
        watermarkOpacity: subtitleState.watermarkOpacity,
      };

      const formData = new FormData();
      formData.append('name', newProfileName);
      formData.append('config', JSON.stringify(configObj));

      const res = await fetch('http://localhost:8000/api/edit-profiles', {
        method: 'POST',
        body: formData
      });
      
      if (res.ok) {
        toast.success("Lưu cấu hình thành công!", { id: toastId });
        setShowSaveModal(false);
        setNewProfileName("");
        fetchProfiles();
      } else {
        throw new Error("API Error");
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi khi lưu cấu hình", { id: toastId });
    }
  };

  const handleApplyProfile = (e) => {
    const pId = e.target.value;
    setSelectedProfileId(pId);
    if (!pId) return;

    const profile = editProfiles.find(p => p.id === parseInt(pId));
    if (!profile) return;

    try {
      const config = JSON.parse(profile.config);
      setVoiceMode(config.voiceMode ?? "edge_auto");
      setBgVolume(config.bgVolume ?? 10);
      
      subtitleState.setFlipVideo(config.flipVideo ?? false);
      subtitleState.setOptZoom(config.optZoom ?? false);
      subtitleState.setOptColor(config.optColor ?? false);
      subtitleState.setOptNoise(config.optNoise ?? false);
      subtitleState.setOptPitch(config.optPitch ?? false);
      
      subtitleState.setSubtitleFont(config.subtitleFont ?? "Arial");
      subtitleState.setSubtitleStyle(config.subtitleStyle ?? "outline");
      subtitleState.setSubtitleTextColor(config.subtitleTextColor ?? "#FFFF00");
      subtitleState.setSubtitleBgColor(config.subtitleBgColor ?? "#000000");
      subtitleState.setSubtitleFontSize(config.subtitleFontSize ?? 24);
      subtitleState.setSubtitleMarginV(config.subtitleMarginV ?? 40);
      subtitleState.setSubtitleBgPadding(config.subtitleBgPadding ?? 2);
      subtitleState.setSubtitleBgOpacity(config.subtitleBgOpacity ?? 100);
      
      subtitleState.setWatermarkType(config.watermarkType ?? "none");
      subtitleState.setWatermarkText(config.watermarkText ?? "");
      subtitleState.setWatermarkImagePreview(config.watermarkImagePreview ?? "");
      subtitleState.setWatermarkImageFile(null); // Clear file so preview path is used
      subtitleState.setWatermarkX(config.watermarkX ?? 50);
      subtitleState.setWatermarkY(config.watermarkY ?? 50);
      subtitleState.setWatermarkSize(config.watermarkSize ?? 20);
      subtitleState.setWatermarkColor(config.watermarkColor ?? "#FFFFFF");
      subtitleState.setWatermarkOpacity(config.watermarkOpacity ?? 50);

      toast.success(`Đã áp dụng: ${profile.name}`);
    } catch (err) {
      console.error("Lỗi apply profile", err);
      toast.error("Mẫu cấu hình bị lỗi!");
    }
  };

  const handleDeleteProfile = async () => {
    if (!selectedProfileId) return;
    if (!window.confirm("Bạn có chắc muốn xóa mẫu cấu hình này?")) return;

    try {
      const res = await fetch(`http://localhost:8000/api/edit-profiles/${selectedProfileId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        toast.success("Đã xóa mẫu cấu hình");
        setSelectedProfileId("");
        fetchProfiles();
      }
    } catch (err) {
      toast.error("Lỗi khi xóa");
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Profile Selector Banner */}
      <div className="glass-panel p-4 rounded-2xl flex items-center justify-between bg-brand-primary/5 border border-brand-primary/20">
        <div className="flex items-center gap-4 flex-1">
          <Save size={20} className="text-brand-primary" />
          <div className="w-1/3">
            <select 
              className="w-full bg-bg-secondary border border-border-subtle rounded-xl py-2 px-3 text-text-primary focus:outline-none focus:border-brand-primary text-sm"
              value={selectedProfileId}
              onChange={handleApplyProfile}
            >
              <option value="">-- Chọn Mẫu Cấu Hình --</option>
              {editProfiles.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          {selectedProfileId && (
            <button 
              onClick={handleDeleteProfile}
              className="text-red-500 hover:text-red-400 hover:bg-red-500/10 p-2 rounded-lg transition-colors"
              title="Xóa mẫu đang chọn"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
        <div>
          <button 
            onClick={() => setShowSaveModal(true)}
            className="text-sm bg-bg-tertiary hover:bg-border-subtle text-text-primary px-4 py-2 rounded-lg transition-colors font-medium border border-white/5"
          >
            + Lưu Cấu Hình Hiện Tại
          </button>
        </div>
      </div>

      <div className="glass-panel p-6 rounded-2xl">
        <h3 className="text-xl font-bold mb-6 tracking-tight">Upload File Có Sẵn (Xử Lý Nổi Bật)</h3>
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
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold tracking-tight">Log Tiến Trình (Live Stream)</h3>
          {isProcessing && (
            <div className="flex items-center gap-3 w-1/3">
              <span className="text-sm font-medium text-brand-primary">{progress.toFixed(1)}%</span>
              <div className="flex-1 h-2 bg-border-subtle rounded-full overflow-hidden">
                <div 
                  className="h-full bg-brand-primary transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
        
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

      {/* Save Profile Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="glass-panel p-6 rounded-2xl w-full max-w-md bg-bg-primary">
            <h3 className="text-xl font-bold mb-4">Lưu Mẫu Cấu Hình</h3>
            <p className="text-sm text-text-secondary mb-4">
              Toàn bộ thông số thiết lập hiện tại (âm lượng, phụ đề, font chữ, logo...) sẽ được lưu lại thành một mẫu để tái sử dụng sau này.
            </p>
            <div className="mb-6">
              <label className="block text-sm font-medium text-text-secondary mb-2">Tên Mẫu (Ví dụ: Kinh dị - Có Logo)</label>
              <input 
                type="text" 
                autoFocus
                className="w-full bg-bg-secondary border border-border-subtle rounded-xl py-3 px-4 text-text-primary focus:outline-none focus:border-brand-primary"
                value={newProfileName}
                onChange={e => setNewProfileName(e.target.value)}
                placeholder="Nhập tên mẫu..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSaveProfile();
                  }
                }}
              />
            </div>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowSaveModal(false)}
                className="px-4 py-2 rounded-lg bg-bg-tertiary hover:bg-border-subtle text-text-primary font-medium transition-colors"
              >
                Hủy
              </button>
              <button 
                onClick={handleSaveProfile}
                className="px-4 py-2 rounded-lg bg-brand-primary hover:bg-brand-hover text-white font-medium transition-colors flex items-center gap-2"
              >
                <Save size={16} /> Lưu Lại
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Phase2Processor;
