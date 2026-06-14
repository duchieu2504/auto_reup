import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileVideo, PlayCircle, Settings, Save, Trash2, Terminal, FolderOpen, Volume2 } from 'lucide-react';
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

  const pageVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4, ease: "easeOut" }
    }
  };

  return (
    <motion.div 
      variants={pageVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Profile Selector Banner */}
      <div className="glass-panel p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between bg-neon-purple/5 border border-neon-purple/20 gap-4">
        <div className="flex items-center gap-3.5 flex-1 w-full">
          <Save size={20} className="text-neon-purple min-w-[20px]" />
          <div className="flex-1 sm:max-w-xs">
            <select 
              className="w-full bg-bg-secondary/80 border border-border-subtle rounded-xl py-2 px-3 text-text-primary focus:outline-none focus:border-neon-purple text-sm cursor-pointer"
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
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleDeleteProfile}
              className="text-neon-pink hover:text-white hover:bg-neon-pink/15 p-2 rounded-xl transition-all duration-300 border border-transparent hover:border-neon-pink/20 cursor-pointer"
              title="Xóa mẫu đang chọn"
            >
              <Trash2 size={16} />
            </motion.button>
          )}
        </div>
        <div className="w-full sm:w-auto">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowSaveModal(true)}
            className="text-xs bg-bg-tertiary hover:bg-border-subtle text-text-primary px-4 py-2.5 rounded-xl transition-colors font-bold border border-white/5 shadow-md cursor-pointer w-full sm:w-auto"
          >
            + Lưu Cấu Hình Hiện Tại
          </motion.button>
        </div>
      </div>

      <div className="glass-panel p-6 rounded-2xl border border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-neon-pink/5 blur-3xl rounded-full pointer-events-none" />
        
        <h3 className="text-xl font-bold mb-6 tracking-tight font-display bg-gradient-to-r from-white to-text-secondary bg-clip-text text-transparent flex items-center gap-2">
          <FileVideo className="text-neon-pink" size={22} />
          Upload File Có Sẵn (Xử Lý Nổi Bật)
        </h3>
        
        <form onSubmit={handleStart} className="space-y-6">
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider">Đường dẫn Video Gốc hoặc Tên Thư mục</label>
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button" 
                onClick={handleScanFolder}
                disabled={isScanning || !videoPath}
                className="text-xs bg-bg-tertiary hover:bg-border-subtle text-text-primary px-3 py-1.5 rounded-lg transition-colors border border-white/5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5"
              >
                <FolderOpen size={13} />
                {isScanning ? 'Đang quét...' : 'Quét Thư mục'}
              </motion.button>
            </div>
            
            <div className="relative group">
              <FileVideo size={18} className="absolute left-4 top-4 text-text-secondary group-focus-within:text-neon-pink transition-colors" />
              <textarea 
                className="w-full bg-bg-secondary/60 border border-border-subtle rounded-xl py-3 pl-12 pr-4 text-text-primary focus:outline-none focus:ring-2 focus:ring-neon-pink/50 focus:border-neon-pink/40 transition-all duration-300 resize-none font-medium text-sm placeholder:text-text-secondary/50" 
                placeholder="Nhập đường dẫn file (.mp4) trong máy hoặc tên thư mục (ví dụ: Douyin_User1)..." 
                value={videoPath}
                onChange={(e) => setVideoPath(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">Giọng Lồng Tiếng AI</label>
              <select 
                className="w-full bg-bg-secondary/80 border border-border-subtle rounded-xl py-3 px-4 text-text-primary focus:outline-none focus:ring-2 focus:ring-neon-pink/30 focus:border-neon-pink/40 transition-all duration-300 cursor-pointer text-sm" 
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
              <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Âm lượng Video Gốc</span>
                <span className="text-neon-pink font-mono text-xs">{bgVolume}%</span>
              </label>
              <div className="flex items-center gap-3 mt-3">
                <Volume2 size={16} className="text-text-secondary" />
                <input 
                  type="range" 
                  min="0" max="100" 
                  value={bgVolume} 
                  onChange={e => setBgVolume(Number(e.target.value))} 
                  className="w-full h-1.5 bg-border-subtle rounded-lg appearance-none cursor-pointer accent-neon-pink" 
                />
              </div>
            </div>
          </div>
          
          {/* Subtitle & Watermark Components */}
          <div className="space-y-4">
            <SubtitleConfigPanel config={subtitleState} />
            <WatermarkConfigPanel config={subtitleState} />
          </div>
          
          <div className="pt-2">
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit" 
              className="flex items-center gap-2 bg-gradient-to-r from-neon-pink to-neon-purple hover:opacity-95 text-white px-7 py-3 rounded-xl font-semibold transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_15px_rgba(236,72,153,0.3)] cursor-pointer" 
              disabled={isProcessing}
            >
              {isProcessing ? <PlayCircle size={18} className="animate-spin text-white" /> : <Settings size={18} />}
              <span>{isProcessing ? 'Đang Render...' : 'Bắt đầu Xử lý'}</span>
            </motion.button>
          </div>
        </form>
      </div>

      {/* Terminal Log Panel */}
      <div className="glass-panel p-6 rounded-2xl border border-white/5 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
          <h3 className="text-xl font-bold tracking-tight font-display bg-gradient-to-r from-white to-text-secondary bg-clip-text text-transparent flex items-center gap-2">
            <Terminal className="text-neon-cyan" size={20} />
            Log Tiến Trình (Live Stream)
          </h3>
          
          <AnimatePresence>
            {isProcessing && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center gap-3 w-full sm:w-64"
              >
                <span className="text-xs font-bold text-neon-cyan font-mono">{progress.toFixed(1)}%</span>
                <div className="flex-1 h-1.5 bg-bg-secondary border border-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-neon-cyan to-neon-purple"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Terminal Window style */}
        <div className="relative rounded-xl overflow-hidden border border-border-subtle shadow-2xl">
          {/* Mac-like Header dots */}
          <div className="bg-[#0b0f17] px-4 py-2.5 flex items-center gap-1.5 border-b border-border-subtle/50">
            <span className="w-2.5 h-2.5 rounded-full bg-neon-pink/70"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-neon-green/70"></span>
            <span className="text-[10px] text-text-secondary font-mono font-bold ml-2 tracking-wider">PROCESSOR_CONSOLE.SH</span>
          </div>
          
          <div 
            ref={logContainerRef}
            className="bg-[#04060a] p-6 font-mono text-[13px] h-[400px] overflow-y-auto leading-relaxed shadow-inner text-neon-cyan/90 selection:bg-neon-pink/20 selection:text-white"
          >
            {logs.length === 0 ? (
              <div className="text-text-secondary/50 italic flex items-center gap-2">
                <span className="text-neon-pink animate-pulse">&gt;</span> Hệ thống đang sẵn sàng, vui lòng nhập thông số và nhấn bắt đầu...
              </div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="whitespace-pre-wrap py-0.5 border-l-2 border-transparent hover:border-neon-pink/40 hover:bg-white/1 px-2 transition-colors">
                  <span className="text-neon-pink/60 mr-2 select-none">[{index + 1}]</span>
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Save Profile Modal */}
      <AnimatePresence>
        {showSaveModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="glass-panel p-6 rounded-2xl w-full max-w-md bg-bg-secondary border border-white/10 shadow-2xl relative overflow-hidden"
            >
              {/* Decorative Glow inside modal */}
              <div className="absolute -top-12 -right-12 w-24 h-24 bg-neon-purple/10 blur-2xl rounded-full" />
              
              <h3 className="text-xl font-bold mb-3 font-display bg-gradient-to-r from-white to-text-secondary bg-clip-text text-transparent flex items-center gap-2">
                <Save className="text-neon-purple" size={18} />
                Lưu Mẫu Cấu Hình
              </h3>
              
              <p className="text-xs text-text-secondary mb-4 leading-relaxed">
                Toàn bộ thông số thiết lập hiện tại (âm lượng, phụ đề, font chữ, logo...) sẽ được lưu lại thành một mẫu cấu hình riêng để dễ dàng tái sử dụng cho các lần sau.
              </p>
              
              <div className="mb-6">
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">Tên Mẫu Cấu Hình</label>
                <input 
                  type="text" 
                  autoFocus
                  className="w-full bg-bg-primary border border-border-subtle rounded-xl py-3 px-4 text-text-primary focus:outline-none focus:border-neon-purple focus:ring-1 focus:ring-neon-purple transition-all duration-300 font-medium text-sm placeholder:text-text-secondary/35"
                  value={newProfileName}
                  onChange={e => setNewProfileName(e.target.value)}
                  placeholder="Ví dụ: Giọng Đọc Độc Đáo - Viền Đen"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSaveProfile();
                    }
                  }}
                />
              </div>
              
              <div className="flex justify-end gap-3.5">
                <button 
                  onClick={() => setShowSaveModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-bg-tertiary hover:bg-border-subtle text-text-primary text-xs font-bold transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSaveProfile}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-neon-purple to-neon-pink text-white text-xs font-bold transition-all duration-300 flex items-center gap-1.5 cursor-pointer shadow-lg"
                >
                  <Save size={14} /> Lưu Lại
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Phase2Processor;
