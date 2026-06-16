import React, { useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileVideo, PlayCircle, Settings, Save, Trash2, Terminal, FolderOpen, Volume2, UploadCloud, RefreshCw, Folder, ChevronLeft, Edit, XCircle } from 'lucide-react';
import { useProcessor } from '../../context/ProcessorContext';
import { toast } from 'react-hot-toast';
import { useSubtitleState } from '../../hooks/useSubtitleState';
import { SubtitleConfigPanel } from '../../components/subtitle/SubtitleConfigPanel';
import { WatermarkConfigPanel } from '../../components/subtitle/WatermarkConfigPanel';
import { InteractiveVideoPreview } from '../../components/subtitle/InteractiveVideoPreview';

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
        setCrawlerVideos(data);
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

  const tabs = [
    { id: "source", label: "Nguồn & Giọng AI" },
    { id: "subtitle", label: "Phụ đề & Siêu lách" },
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

        enableSubtitles: subtitleState.enableSubtitles,
        maskEnabled: subtitleState.maskEnabled,
        masks: subtitleState.masks,
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

      {/* Grid 2 Cột Linh Hoạt trên Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:items-stretch">
        
        {/* CỘT TRÁI: Form Cấu Hình (Chiếm 60%) */}
        <div className="lg:col-span-3 glass-panel p-6 rounded-2xl border border-white/5 relative overflow-hidden flex flex-col justify-between gap-6">
          <div className="absolute top-0 right-0 w-32 h-32 bg-neon-pink/5 blur-3xl rounded-full pointer-events-none" />
          
          <div>
            <h3 className="text-xl font-bold mb-5 tracking-tight font-display bg-gradient-to-r from-white to-text-secondary bg-clip-text text-transparent flex items-center gap-2">
              <FileVideo className="text-neon-pink" size={22} />
              Cấu Hình Video & Render
            </h3>

            {/* Tabs Navigation Header */}
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
              {/* Tab Contents */}
              <div className="min-h-[300px]">
                {activeTab === "source" && (
                  <div className="space-y-6">
                    {/* Source Selector Radios */}
                    <div>
                      <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2.5">
                        Nguồn Video Đầu Vào
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          type="button"
                          onClick={() => setSourceType('crawler')}
                          className={`py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider border transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
                            sourceType === 'crawler'
                              ? 'bg-neon-pink/10 border-neon-pink text-neon-pink shadow-[0_0_10px_rgba(236,72,153,0.15)]'
                              : 'bg-bg-secondary/40 border-white/5 text-text-secondary hover:text-text-primary hover:bg-glass-hover'
                          }`}
                        >
                          <PlayCircle size={15} />
                          Video từ Crawler
                        </button>
                        <button
                          type="button"
                          onClick={() => setSourceType('upload')}
                          className={`py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider border transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
                            sourceType === 'upload'
                              ? 'bg-neon-pink/10 border-neon-pink text-neon-pink shadow-[0_0_10px_rgba(236,72,153,0.15)]'
                              : 'bg-bg-secondary/40 border-white/5 text-text-secondary hover:text-text-primary hover:bg-glass-hover'
                          }`}
                        >
                          <FolderOpen size={15} />
                          Tải file / Local Path
                        </button>
                      </div>
                    </div>

                    {sourceType === 'crawler' ? (
                      /* Crawler Videos Selection Component */
                      <div className="space-y-3 animate-in fade-in duration-200">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Tìm kiếm video..."
                            value={crawlerSearch}
                            onChange={e => setCrawlerSearch(e.target.value)}
                            className="flex-1 bg-bg-secondary/60 border border-border-subtle rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-neon-pink text-text-primary placeholder:text-text-secondary/45"
                          />
                          <select
                            value={crawlerFilterStatus}
                            onChange={e => setCrawlerFilterStatus(e.target.value)}
                            className="bg-bg-secondary/60 border border-border-subtle rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-neon-pink text-text-primary cursor-pointer"
                          >
                            <option value="all">Tất cả</option>
                            <option value="pending">Chờ xử lý</option>
                            <option value="completed">Đã hoàn thành</option>
                            <option value="failed">Bị lỗi</option>
                          </select>
                          <button
                            type="button"
                            onClick={fetchCrawlerVideos}
                            className="p-2 bg-bg-tertiary hover:bg-border-subtle rounded-xl border border-white/5 text-text-primary transition-colors cursor-pointer flex items-center justify-center"
                            title="Làm mới danh sách"
                          >
                            <RefreshCw size={15} className="text-text-secondary" />
                          </button>
                        </div>

                        <div className="border border-border-subtle rounded-xl overflow-hidden bg-bg-secondary/20">
                          {/* Folder Selector View */}
                          {!selectedAuthor ? (
                            <div className="max-h-[220px] overflow-y-auto p-3 flex flex-col gap-2 scrollbar-none">
                              {Object.entries(groupedCrawlerVideos).map(([author, authorVideos]) => (
                                <div
                                  key={author}
                                  onClick={() => setSelectedAuthor(author)}
                                  className="flex items-center justify-between gap-3 p-3 rounded-xl cursor-pointer transition-all border border-white/5 bg-bg-secondary/40 hover:border-neon-pink/50 hover:bg-neon-pink/5 group"
                                >
                                  <div className="flex items-center gap-3 min-w-0">
                                    <Folder size={18} className="text-neon-purple group-hover:text-neon-pink transition-colors shrink-0" />
                                    <div className="font-bold text-xs text-text-primary truncate" title={author}>{author}</div>
                                  </div>
                                  <div className="text-[10px] text-text-secondary px-2 py-0.5 bg-bg-primary rounded-md border border-border-subtle shrink-0 font-bold">
                                    {authorVideos.length} video
                                  </div>
                                </div>
                              ))}
                              {Object.keys(groupedCrawlerVideos).length === 0 && (
                                <div className="text-center py-10 text-text-secondary text-xs italic">
                                  Không tìm thấy thư mục video nào
                                </div>
                              )}
                            </div>
                          ) : (
                            /* Sub-Folder Videos List View */
                            <div className="flex flex-col">
                              {/* Sub Header sticky */}
                              <div className="flex items-center justify-between px-3 py-2 border-b border-border-subtle bg-bg-secondary/80 backdrop-blur sticky top-0 z-10">
                                <button 
                                  type="button"
                                  onClick={() => setSelectedAuthor(null)}
                                  className="flex items-center gap-1 text-xs text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                                >
                                  <ChevronLeft size={14} /> Trở lại
                                </button>
                                <span className="text-xs font-bold text-neon-pink truncate max-w-[150px]">{selectedAuthor}</span>
                                <button 
                                  type="button"
                                  onClick={() => {
                                    const authorVideos = groupedCrawlerVideos[selectedAuthor] || [];
                                    const authorPaths = authorVideos.map(v => v.raw_video_path).filter(Boolean);
                                    const allSelected = authorPaths.every(path => selectedCrawlerPaths.includes(path));
                                    if (allSelected) {
                                      setSelectedCrawlerPaths(prev => prev.filter(path => !authorPaths.includes(path)));
                                    } else {
                                      setSelectedCrawlerPaths(prev => Array.from(new Set([...prev, ...authorPaths])));
                                    }
                                  }}
                                  className="text-[10px] text-neon-purple hover:text-neon-pink font-semibold transition-colors bg-neon-purple/10 px-2 py-1 rounded-md cursor-pointer"
                                >
                                  Chọn tất cả
                                </button>
                              </div>

                              <div className="max-h-[180px] overflow-y-auto divide-y divide-border-subtle/50 scrollbar-none">
                                {(groupedCrawlerVideos[selectedAuthor] || []).length === 0 ? (
                                  <div className="p-8 text-center text-text-secondary text-xs italic">
                                    Thư mục này không có video nào
                                  </div>
                                ) : (
                                  groupedCrawlerVideos[selectedAuthor].map((video) => {
                                    const isSelected = selectedCrawlerPaths.includes(video.raw_video_path);
                                    return (
                                      <div
                                        key={video.id}
                                        onClick={() => {
                                          if (isSelected) {
                                            setSelectedCrawlerPaths(prev => prev.filter(p => p !== video.raw_video_path));
                                          } else {
                                            setSelectedCrawlerPaths(prev => [...prev, video.raw_video_path]);
                                          }
                                        }}
                                        className={`flex items-center gap-3 p-3 hover:bg-white/5 transition-colors cursor-pointer ${
                                          isSelected ? 'bg-neon-pink/5' : ''
                                        }`}
                                      >
                                        <input
                                          type="checkbox"
                                          checked={isSelected}
                                          readOnly
                                          className="rounded border-border-subtle bg-bg-secondary cursor-pointer accent-neon-pink"
                                        />
                                        <div className="w-10 h-14 shrink-0 rounded overflow-hidden bg-black/40 border border-white/5 relative flex items-center justify-center">
                                          {video.raw_video_path?.startsWith('deleted:') ? (
                                            <img 
                                              src={`http://localhost:8000/api/history/thumbnail?path=${encodeURIComponent(video.raw_video_path)}`}
                                              className="w-full h-full object-cover"
                                              alt="thumb"
                                            />
                                          ) : (
                                            <video
                                              src={`http://localhost:8000/api/files/${(video.raw_video_path || '').replace(/^[/]?data[/]/, '')}#t=2.0`}
                                              className="w-full h-full object-cover"
                                              muted
                                              playsInline
                                              preload="none"
                                            />
                                          )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-xs font-semibold text-text-primary truncate font-mono" title={video.original_name}>
                                            {video.original_name.split('/').pop().split('\\').pop()}
                                          </p>
                                          <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded mt-1.5 uppercase tracking-wider ${
                                            video.status === 'completed' ? 'bg-green-500/10 text-green-500 border border-green-500/20' :
                                            video.status === 'failed' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                                            'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                                          }`}>
                                            {video.status}
                                          </span>
                                        </div>
                                        {/* Nút Edit nếu video đã xử lý xong */}
                                        {(video.status === 'completed' || video.status === 'uploaded') && (
                                          <a 
                                            href={`/edit/${video.id}`}
                                            onClick={(e) => e.stopPropagation()}
                                            className="p-1.5 rounded-lg text-text-secondary hover:text-neon-pink hover:bg-neon-pink/10 transition-colors shrink-0 cursor-pointer"
                                            title="Chỉnh sửa phụ đề thủ công (Edit)"
                                          >
                                            <Edit size={14} />
                                          </a>
                                        )}
                                      </div>
                                    );
                                  })
                                )}
                              </div>
                            </div>
                          )}
                          
                          {/* Footer hiển thị số video đã chọn */}
                          <div className="bg-bg-secondary/40 p-2.5 flex justify-between items-center text-[11px] border-t border-border-subtle text-text-secondary select-none">
                            <span>Đã chọn tổng cộng: <strong className="text-neon-pink font-mono">{selectedCrawlerPaths.length}</strong> video</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedCrawlerPaths([]);
                              }}
                              className="text-neon-pink font-semibold hover:underline cursor-pointer"
                            >
                              Bỏ chọn tất cả
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Upload & Local Path Component */
                      <div className="space-y-4 animate-in fade-in duration-200">
                        {/* Drag and Drop Zone */}
                        <div 
                          className="border border-dashed border-border-subtle hover:border-neon-pink/40 rounded-xl p-5 text-center cursor-pointer transition-all bg-bg-secondary/20 hover:bg-neon-pink/5"
                          onClick={() => fileInputRef.current.click()}
                        >
                          <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleVideoUpload}
                            accept="video/*" 
                            className="hidden" 
                          />
                          <div className="flex flex-col items-center gap-2 text-text-secondary">
                            <UploadCloud size={24} className={uploading ? "animate-bounce text-neon-pink" : "text-text-secondary"} />
                            <span className="text-xs font-semibold text-text-primary">
                              {uploading ? "Đang tải video lên server..." : "Nhấp hoặc kéo thả video vào đây để tải lên"}
                            </span>
                            <span className="text-[10px]">Hỗ trợ file video (mp4, mkv, webm...)</span>
                          </div>
                        </div>

                        {/* Uploaded Files Queue */}
                        {uploadedFiles.length > 0 && (
                          <div className="space-y-2">
                            <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                              Danh sách video đã tải lên:
                            </label>
                            <div className="bg-bg-secondary/40 border border-border-subtle rounded-xl p-2.5 divide-y divide-border-subtle/40">
                              {uploadedFiles.map((file, idx) => (
                                <div key={idx} className="flex justify-between items-center py-1.5 first:pt-0 last:pb-0">
                                  <span className="text-xs font-medium text-text-primary truncate max-w-[85%] font-mono">
                                    {file.name}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => setUploadedFiles(prev => prev.filter((_, i) => i !== idx))}
                                    className="text-neon-pink/80 hover:text-neon-pink p-1 rounded transition-colors cursor-pointer"
                                    title="Xóa video khỏi hàng chờ"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Local Paths Input */}
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider">Hoặc nhập đường dẫn video cục bộ</label>
                            <motion.button 
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              type="button" 
                              onClick={handleScanFolder}
                              disabled={isScanning || !videoPath}
                              className="text-[11px] bg-bg-tertiary hover:bg-border-subtle text-text-primary px-3 py-1.5 rounded-lg transition-colors border border-white/5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5 font-bold"
                            >
                              <FolderOpen size={12} />
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
                              rows={3}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
                  </div>
                )}
                
                {activeTab === "subtitle" && (
                  <div className="space-y-4">
                    <SubtitleConfigPanel config={subtitleState} />
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

        {/* CỘT PHẢI: Xem trước Video & Phụ Đề (Chiếm 40%) */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-white/5 relative overflow-hidden flex flex-col justify-between gap-6">
          <div className="flex flex-col gap-5 flex-1">
            <h3 className="text-xl font-bold tracking-tight font-display bg-gradient-to-r from-white to-text-secondary bg-clip-text text-transparent flex items-center gap-2">
              <PlayCircle className="text-neon-pink" size={20} />
              Xem Trước Video & Phụ Đề
            </h3>
            
            <div className="bg-bg-secondary/40 border border-border-subtle rounded-2xl p-4 flex-1 flex flex-col justify-center min-h-[300px]">
              {previewVideoPath ? (
                <InteractiveVideoPreview config={subtitleState}>
                  <video 
                    src={`http://localhost:8000/api/files/${previewVideoPath.replace(/^[/]?data[/]/, '').replace(/^\\data\\/, '').replace(/\\/g, '/')}`}
                    controls
                    className="w-full max-h-[500px] object-contain rounded-lg shadow-lg"
                  />
                </InteractiveVideoPreview>
              ) : (
                <div className="w-full aspect-video bg-bg-secondary/20 rounded-lg flex flex-col items-center justify-center text-text-secondary border border-dashed border-border-subtle p-6 select-none">
                  <PlayCircle size={36} className="opacity-20 mb-2 text-neon-pink animate-pulse" />
                  <p className="text-sm font-semibold">Chưa có video được chọn</p>
                  <p className="text-xs text-text-tertiary mt-1">Chọn 1 video từ Crawler hoặc Upload để xem trước phụ đề</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* PHẦN DƯỚI: Tiến Trình Render & Terminal Console */}
      <div className="glass-panel p-6 rounded-2xl border border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-neon-cyan/5 blur-3xl rounded-full pointer-events-none" />
        
        <div className="flex flex-col gap-5">
          <h3 className="text-xl font-bold tracking-tight font-display bg-gradient-to-r from-white to-text-secondary bg-clip-text text-transparent flex items-center gap-2">
            <Terminal className="text-neon-cyan" size={20} />
            Tiến Trình Render
          </h3>
          
          {/* Progress Bar */}
          <div className="bg-bg-secondary/40 p-4 rounded-xl border border-white/5 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Trạng thái Render</span>
              <span className="text-xs font-bold text-neon-cyan font-mono">{progress.toFixed(1)}%</span>
            </div>
            <div className="h-1.5 bg-bg-secondary border border-white/5 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-neon-cyan to-neon-purple"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
          
          {/* Terminal Window style */}
          <div className="relative rounded-xl overflow-hidden border border-border-subtle shadow-2xl flex flex-col w-full">
            <div className="bg-[#0b0f17] px-4 py-2.5 flex items-center gap-1.5 border-b border-border-subtle/50">
              <span className="w-2.5 h-2.5 rounded-full bg-neon-pink/70"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-neon-green/70"></span>
              <span className="text-[10px] text-text-secondary font-mono font-bold ml-2 tracking-wider">PROCESSOR_CONSOLE.SH</span>
            </div>
            
            <div 
              ref={logContainerRef}
              className="bg-[#04060a] p-5 font-mono text-[12px] overflow-y-auto leading-relaxed shadow-inner text-neon-cyan/90 selection:bg-neon-pink/20 selection:text-white w-full h-[300px]"
            >
              {logs.length === 0 ? (
                <div className="text-text-secondary/50 italic flex items-center gap-2">
                  <span className="text-neon-pink animate-pulse">&gt;</span> Hệ thống sẵn sàng...
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
