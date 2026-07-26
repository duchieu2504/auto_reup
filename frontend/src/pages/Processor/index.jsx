import React, { useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileVideo, Settings, XCircle } from 'lucide-react';
import { useProcessor } from '../../context/ProcessorContext';
import { toast } from 'react-hot-toast';
import { useSubtitleState } from '../../hooks/useSubtitleState';
import { useFfmpegPreview } from '../../hooks/useFfmpegPreview';
import { SubtitleConfigPanel } from '../../components/subtitle/SubtitleConfigPanel';
import { WatermarkConfigPanel } from '../../components/subtitle/WatermarkConfigPanel';
import { InteractiveVideoPreview } from '../../components/subtitle/InteractiveVideoPreview';

// Sub-components
import { ProfileSelector } from './components/ProfileSelector';
import { SaveProfileModal } from './components/SaveProfileModal';
import { PreviewPanel } from './components/PreviewPanel';
import { TerminalPanel } from './components/TerminalPanel';
import { SourceConfigTab } from './components/SourceConfigTab';


const Phase2Processor = () => {
  const { videoPath, setVideoPath, isProcessing, logs, progress, startProcessing, stopProcessing } = useProcessor();
  const logContainerRef = useRef(null);
  
  const subtitleState = useSubtitleState();

  const [voices, setVoices] = useState([]);
  const [voiceMode, setVoiceMode] = useState("edge_auto");
  const [bgVolume, setBgVolume] = useState(10);

  const [isScanning, setIsScanning] = useState(false);

  const fileInputRef = useRef(null);
  const [sourceType, setSourceType] = useState("crawler");
  const [crawlerVideos, setCrawlerVideos] = useState([]);
  const [selectedCrawlerPaths, setSelectedCrawlerPaths] = useState([]);
  const [crawlerSearch, setCrawlerSearch] = useState("");
  const [crawlerFilterStatus, setCrawlerFilterStatus] = useState("all");
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [selectedAuthor, setSelectedAuthor] = useState(null);

  const previewVideoPath = useMemo(() => {
    if (sourceType === 'crawler') {
      if (selectedCrawlerPaths.length > 0) {
        return selectedCrawlerPaths[0];
      }
    } else {
      if (uploadedFiles.length > 0) {
        return uploadedFiles[0].path;
      }
      const paths = videoPath.split('\n').map(p => p.trim()).filter(p => p);
      if (paths.length > 0) {
        return paths[0];
      }
    }
    return null;
  }, [sourceType, selectedCrawlerPaths, uploadedFiles, videoPath]);

  const { ffmpegPreviewUrl, isGeneratingPreview } = useFfmpegPreview(subtitleState, previewVideoPath);

  const filteredCrawlerVideos = crawlerVideos.filter(video => {
    const matchesSearch = video.original_name.toLowerCase().includes(crawlerSearch.toLowerCase());
    
    if (crawlerFilterStatus === 'all') return matchesSearch;
    if (crawlerFilterStatus === 'pending') {
      return matchesSearch && video.status === 'pending';
    }
    if (crawlerFilterStatus === 'completed') {
      return matchesSearch && (video.status === 'completed' || video.status === 'uploaded');
    }
    if (crawlerFilterStatus === 'failed') {
      return matchesSearch && video.status === 'failed';
    }
    return matchesSearch;
  });

  const groupedCrawlerVideos = useMemo(() => {
    const groups = {};
    filteredCrawlerVideos.forEach(v => {
      let author = "Imported (Không rõ nguồn)";
      if (v.source && v.source.startsWith("Douyin - ")) {
        author = v.source.replace("Douyin - ", "");
      } else if (v.source) {
        author = v.source;
      }
      
      if (!groups[author]) groups[author] = [];
      groups[author].push(v);
    });
    return groups;
  }, [filteredCrawlerVideos]);

  const fetchCrawlerVideos = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/history/?limit=200');
      if (res.ok) {
        const data = await res.json();
        setCrawlerVideos(data.data || []);
      }
    } catch (err) {
      console.error("Lỗi lấy danh sách video crawler:", err);
    }
  };

  useEffect(() => {
    if (sourceType === 'crawler') {
      fetchCrawlerVideos();
    }
  }, [sourceType]);

  const handleVideoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const toastId = toast.loading(`Đang tải lên ${file.name}...`);
    
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://localhost:8000/api/processor/upload-video", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setUploadedFiles(prev => [...prev, { name: data.filename, path: data.path }]);
        toast.success("Tải video lên thành công!", { id: toastId });
      } else {
        const errData = await res.json();
        throw new Error(errData.detail || "Upload error");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Lỗi tải video lên server", { id: toastId });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Edit Profiles State
  const [editProfiles, setEditProfiles] = useState([]);
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [newProfileName, setNewProfileName] = useState("");
  const [activeTab, setActiveTab] = useState("source");
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [aspectRatio, setAspectRatio] = useState(null);

  const tabs = [
    { id: "source", label: "Nguồn & Giọng AI" },
    { id: "subtitle", label: "Phụ đề & Siêu lách" },
    { id: "customSrt", label: "Sub Tùy Chỉnh" },
    { id: "watermark", label: "Logo & Watermark" }
  ];

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
    
    let finalPaths = [];
    if (sourceType === 'crawler') {
      if (selectedCrawlerPaths.length === 0) {
        toast.error("Vui lòng chọn ít nhất một video từ crawler!");
        return;
      }
      finalPaths = selectedCrawlerPaths;
    } else {
      const localPaths = videoPath.split('\n').map(p => p.trim()).filter(p => p);
      const uploadedPaths = uploadedFiles.map(f => f.path);
      finalPaths = [...uploadedPaths, ...localPaths];
      
      if (finalPaths.length === 0) {
        toast.error("Vui lòng tải lên video hoặc nhập đường dẫn cục bộ!");
        return;
      }
    }

    startProcessing(finalPaths, { 
      voiceMode, bgVolume, 
      vocalVolume: subtitleState.vocalVolume,
      flipVideo: subtitleState.flipVideo, 
      optZoom: subtitleState.optZoom, 
      optColor: subtitleState.optColor, 
      optNoise: subtitleState.optNoise, 
      optPitch: subtitleState.optPitch,
      optSpeed: subtitleState.optSpeed,
      optReverb: subtitleState.optReverb,
      optVignette: subtitleState.optVignette,
      optRandomCombo: subtitleState.optRandomCombo,
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
        vocalVolume: subtitleState.vocalVolume,
        flipVideo: subtitleState.flipVideo,
        optZoom: subtitleState.optZoom,
        optColor: subtitleState.optColor,
        optNoise: subtitleState.optNoise,
        optPitch: subtitleState.optPitch,
        optSpeed: subtitleState.optSpeed,
        optReverb: subtitleState.optReverb,
        optVignette: subtitleState.optVignette,
        optRandomCombo: subtitleState.optRandomCombo,
        
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

        enableSubtitles: subtitleState.enableSubtitles,
        maskEnabled: subtitleState.maskEnabled,
        masks: subtitleState.masks,
        useCustomSrt: subtitleState.useCustomSrt,
        customSrt: subtitleState.customSrt,
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
      subtitleState.setVocalVolume(config.vocalVolume ?? 0);
      
      subtitleState.setFlipVideo(config.flipVideo ?? false);
      subtitleState.setOptZoom(config.optZoom ?? false);
      subtitleState.setOptColor(config.optColor ?? false);
      subtitleState.setOptNoise(config.optNoise ?? false);
      subtitleState.setOptPitch(config.optPitch ?? false);
      
      subtitleState.setSubtitleFont(config.subtitleFont ?? "Arial");
      subtitleState.setSubtitleStyle(config.subtitleStyle ?? "outline");
      subtitleState.setSubtitleTextColor(config.subtitleTextColor ?? "#FFFF00");
      subtitleState.setSubtitleBgColor(config.subtitleBgColor ?? "#000000");
      subtitleState.setSubtitleFontSize(config.subtitleFontSize ?? 8);
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

      subtitleState.setEnableSubtitles(config.enableSubtitles ?? true);
      subtitleState.setMaskEnabled(config.maskEnabled ?? false);
      if (Array.isArray(config.masks)) {
        subtitleState.setMasks(config.masks);
        if (config.masks.length > 0) {
          subtitleState.setActiveMaskId(config.masks[0].id);
        } else {
          subtitleState.setActiveMaskId(null);
        }
      } else {
        // Fallback for older profiles with single mask settings
        const oldMask = {
          id: 1,
          x: config.maskX ?? 10,
          y: config.maskY ?? 10,
          width: config.maskWidth ?? 20,
          height: config.maskHeight ?? 15,
          type: config.maskType ?? "color",
          color: config.maskColor ?? "#000000"
        };
        subtitleState.setMasks(config.maskEnabled ? [oldMask] : []);
        subtitleState.setActiveMaskId(config.maskEnabled ? 1 : null);
      }
      
      subtitleState.setUseCustomSrt(config.useCustomSrt ?? false);
      subtitleState.setCustomSrt(config.customSrt ?? "");

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
      <ProfileSelector
        editProfiles={editProfiles}
        selectedProfileId={selectedProfileId}
        handleApplyProfile={handleApplyProfile}
        handleDeleteProfile={handleDeleteProfile}
        setShowSaveModal={setShowSaveModal}
      />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:items-stretch">
        
        {/* CỘT TRÁI: Form Cấu Hình (Chiếm 60%) */}
        <div className="lg:col-span-3 glass-panel p-6 rounded-2xl border border-white/5 relative overflow-hidden flex flex-col justify-between gap-6">
          <div className="absolute top-0 right-0 w-32 h-32 bg-neon-pink/5 blur-3xl rounded-full pointer-events-none" />
          
          <div>
            <h3 className="text-xl font-bold mb-5 tracking-tight font-display bg-gradient-to-r from-white to-text-secondary bg-clip-text text-transparent flex items-center gap-2">
              <FileVideo className="text-neon-pink" size={22} />
              Cấu Hình Video & Render
            </h3>

            <div className="flex border-b border-border-subtle overflow-x-auto pb-px gap-2 scrollbar-none mb-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all duration-300 cursor-pointer whitespace-nowrap pb-3 ${
                    activeTab === tab.id
                      ? "border-neon-pink text-neon-pink"
                      : "border-transparent text-text-secondary hover:text-text-primary"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            
            <form onSubmit={handleStart} className="space-y-6">
              <div className="min-h-[300px]">
                {activeTab === "source" && (
                  <SourceConfigTab
                    sourceType={sourceType}
                    setSourceType={setSourceType}
                    crawlerSearch={crawlerSearch}
                    setCrawlerSearch={setCrawlerSearch}
                    crawlerFilterStatus={crawlerFilterStatus}
                    setCrawlerFilterStatus={setCrawlerFilterStatus}
                    fetchCrawlerVideos={fetchCrawlerVideos}
                    groupedCrawlerVideos={groupedCrawlerVideos}
                    selectedAuthor={selectedAuthor}
                    setSelectedAuthor={setSelectedAuthor}
                    selectedCrawlerPaths={selectedCrawlerPaths}
                    setSelectedCrawlerPaths={setSelectedCrawlerPaths}
                    fileInputRef={fileInputRef}
                    handleVideoUpload={handleVideoUpload}
                    uploading={uploading}
                    uploadedFiles={uploadedFiles}
                    setUploadedFiles={setUploadedFiles}
                    isScanning={isScanning}
                    handleScanFolder={handleScanFolder}
                    videoPath={videoPath}
                    setVideoPath={setVideoPath}
                    voices={voices}
                    voiceMode={voiceMode}
                    setVoiceMode={setVoiceMode}
                    bgVolume={bgVolume}
                    setBgVolume={setBgVolume}
                  />
                )}
                
                {activeTab === "subtitle" && (
                  <div className="space-y-4">
                    <SubtitleConfigPanel config={subtitleState} />
                  </div>
                )}
                
                {activeTab === "customSrt" && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="bg-bg-primary/40 border border-white/5 rounded-xl p-5 space-y-5">
                      <div>
                        <label className="flex items-center gap-2 cursor-pointer mb-4">
                          <input
                            type="checkbox"
                            checked={subtitleState.useCustomSrt}
                            onChange={(e) => subtitleState.setUseCustomSrt(e.target.checked)}
                            className="w-4 h-4 rounded border-border-subtle bg-bg-secondary text-neon-pink focus:ring-neon-pink"
                          />
                          <span className="text-sm font-semibold text-text-primary">Bật phụ đề tùy chỉnh (Bỏ qua Dịch AI)</span>
                        </label>
                        <p className="text-xs text-text-secondary mb-4">
                          Hệ thống sẽ bỏ qua bước nhận diện và dịch AI, trực tiếp render âm thanh lồng tiếng theo mốc thời gian bạn cấu hình dưới đây.
                        </p>
                      </div>

                      <div className={!subtitleState.useCustomSrt ? 'opacity-50 pointer-events-none transition-opacity' : 'transition-opacity'}>
                        <div className="flex justify-between items-center mb-2">
                          <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider">Nội dung SRT</label>
                          <label className="cursor-pointer bg-bg-secondary hover:bg-neon-pink/20 text-neon-pink text-xs px-3 py-1.5 rounded-lg transition-colors border border-neon-pink/30 flex items-center gap-2">
                            <span>Tải file .srt</span>
                            <input 
                              type="file" 
                              accept=".srt" 
                              className="hidden" 
                              onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = (e) => subtitleState.setCustomSrt(e.target.result);
                                  reader.readAsText(file);
                                }
                              }}
                            />
                          </label>
                        </div>
                        <textarea
                          className="w-full h-48 bg-bg-secondary border border-border-subtle rounded-xl p-4 text-text-primary focus:outline-none focus:border-neon-pink transition-all duration-200 text-sm font-mono resize-y"
                          placeholder="1\n00:00:01,000 --> 00:00:05,000\nXin chào các bạn!\n\n2\n..."
                          value={subtitleState.customSrt}
                          onChange={(e) => subtitleState.setCustomSrt(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}
                
                {activeTab === "watermark" && (
                  <div className="space-y-4">
                    <WatermarkConfigPanel config={subtitleState} />
                  </div>
                )}
              </div>
              
              <div className="pt-4 border-t border-border-subtle flex gap-3">
                {isProcessing ? (
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button" 
                    onClick={stopProcessing}
                    className="flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white px-7 py-3.5 rounded-xl font-semibold transition-all duration-300 active:scale-95 shadow-[0_4px_15px_rgba(239,68,68,0.3)] cursor-pointer w-full" 
                  >
                    <XCircle size={18} />
                    <span>Hủy tiến trình xử lý</span>
                  </motion.button>
                ) : (
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit" 
                    className="flex items-center gap-2 bg-gradient-to-r from-neon-pink to-neon-purple hover:opacity-95 text-white px-7 py-3.5 rounded-xl font-semibold transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_15px_rgba(236,72,153,0.3)] cursor-pointer" 
                    disabled={isProcessing}
                  >
                    <Settings size={18} />
                    <span>Bắt đầu Xử lý</span>
                  </motion.button>
                )}
              </div>
            </form>
          </div>
        </div>

        <PreviewPanel
          previewVideoPath={previewVideoPath}
          subtitleState={subtitleState}
          aspectRatio={aspectRatio}
          setAspectRatio={setAspectRatio}
          ffmpegPreviewUrl={ffmpegPreviewUrl}
          isGeneratingPreview={isGeneratingPreview}
        />
      </div>

      <TerminalPanel
        progress={progress}
        logs={logs}
        logContainerRef={logContainerRef}
      />

      <SaveProfileModal
        showSaveModal={showSaveModal}
        setShowSaveModal={setShowSaveModal}
        newProfileName={newProfileName}
        setNewProfileName={setNewProfileName}
        handleSaveProfile={handleSaveProfile}
      />
    </motion.div>
  );
};

export default Phase2Processor;
