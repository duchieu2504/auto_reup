import React, { useState, useEffect, useMemo } from 'react';

import { toast } from 'react-hot-toast';
import { CalendarClock, CheckCircle, Clock, Video, Users, Sparkles, Send, XCircle, RefreshCw, Cpu, MonitorPlay, Smartphone, Folder, ChevronLeft, CheckSquare, Image as ImageIcon, AlertTriangle } from 'lucide-react';

const API_BASE = 'http://localhost:8000/api';

const UploadSchedule = () => {
  const [schedules, setSchedules] = useState([]);
  const [videos, setVideos] = useState([]);
  const [accounts, setAccounts] = useState([]);
  
  // Form State
  const [selectedVideos, setSelectedVideos] = useState([]);
  const [selectedAuthor, setSelectedAuthor] = useState(null);
  const [selectedAccounts, setSelectedAccounts] = useState([]);
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [scheduleMode, setScheduleMode] = useState("now"); // now or timer
  const [scheduledTime, setScheduledTime] = useState("");
  const [engineType, setEngineType] = useState("playwright"); // playwright or adb
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper truncate filename
  const truncateFilename = (filename) => {
    if (!filename) return "Unknown";
    const name = filename.split('/').pop().split('\\').pop();
    if (name.length <= 15) return name;
    const ext = name.split('.').pop();
    const base = name.substring(0, name.lastIndexOf('.'));
    if (base.length <= 10) return name;
    return `${base.substring(0, 2)}..${base.substring(base.length - 5)}.${ext}`;
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [schedRes, vidRes, accRes] = await Promise.all([
        fetch(`${API_BASE}/upload-schedules/`).then(res => res.json()),
        fetch(`${API_BASE}/history/`).then(res => res.json()),
        fetch(`${API_BASE}/social-accounts/`).then(res => res.json())
      ]);
      setSchedules(schedRes);
      
      // Lọc các video đã xử lý xong hoặc tải xong
      const availableVideos = vidRes.filter(v => 
        v.status === 'processed' || v.status === 'downloaded' || v.status === 'completed'
      );
      setVideos(availableVideos);
      setAccounts(accRes);
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi tải dữ liệu lịch đăng!');
    }
  };

  const handleAccountToggle = (accId) => {
    setSelectedAccounts(prev => 
      prev.includes(accId) ? prev.filter(id => id !== accId) : [...prev, accId]
    );
  };

  // Nhóm video theo Kênh (Author)
  const groupedVideos = useMemo(() => {
    const groups = {};
    videos.forEach(v => {
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
  }, [videos]);

  const handleVideoToggle = (vidId) => {
    setSelectedVideos(prev => 
      prev.includes(vidId) ? prev.filter(id => id !== vidId) : [...prev, vidId]
    );
  };

  // Bản đồ Video -> Các tài khoản đã đăng
  const postedMap = useMemo(() => {
    const map = {};
    schedules.forEach(sch => {
      const vId = String(sch.video_history_id);
      const aId = String(sch.account_id);
      if (!map[vId]) map[vId] = new Set();
      map[vId].add(aId);
    });
    return map;
  }, [schedules]);

  const toggleAllAuthorVideos = (authorVideos) => {
    const allIds = authorVideos.map(v => v.id);
    const isAllSelected = allIds.every(id => selectedVideos.includes(id));
    if (isAllSelected) {
      setSelectedVideos(prev => prev.filter(id => !allIds.includes(id)));
    } else {
      setSelectedVideos(prev => {
        const newSet = new Set([...prev, ...allIds]);
        return Array.from(newSet);
      });
    }
  };

  const generateAIContent = async () => {
    if (selectedVideos.length === 0) {
      toast.error("Vui lòng chọn ít nhất 1 Video trước khi sinh Caption!");
      return;
    }
    
    setIsGenerating(true);
    const loadingToast = toast.loading("Đang gọi AI phân tích video đầu tiên...");
    try {
      const res = await fetch(`${API_BASE}/upload-schedules/generate-content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ video_history_id: parseInt(selectedVideos[0]) })
      });
      
      const data = await res.json();
      
      if (res.ok && data) {
        setCaption(data.caption || "");
        setHashtags(data.hashtags || "");
        toast.success("AI đã tạo xong Caption!", { id: loadingToast });
      } else {
        throw new Error(data?.detail || "Lỗi tạo caption");
      }
    } catch (error) {
      console.error(error);
      toast.error("Lỗi khi sinh nội dung AI. Vui lòng kiểm tra lại cấu hình API.", { id: loadingToast });
    } finally {
      setIsGenerating(false);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (selectedVideos.length === 0) return toast.error("Chưa chọn Video nào!");
    if (selectedAccounts.length === 0) return toast.error("Chưa chọn Tài khoản MXH!");
    if (scheduleMode === "timer" && !scheduledTime) return toast.error("Vui lòng chọn thời gian hẹn giờ!");
    
    // Check for duplicates
    for (let vidId of selectedVideos) {
      for (let accId of selectedAccounts) {
        if (postedMap[String(vidId)] && postedMap[String(vidId)].has(String(accId))) {
          const v = videos.find(v => String(v.id) === String(vidId));
          const a = accounts.find(a => String(a.id) === String(accId));
          const vName = v ? truncateFilename(v.original_name || v.raw_video_path) : `Video #${vidId}`;
          const aName = a ? a.username : `Tài khoản #${accId}`;
          return toast.error(`Cảnh báo: ${vName} đã được lên lịch/đăng trên tài khoản ${aName}. Vui lòng bỏ chọn để tránh trùng lặp!`);
        }
      }
    }
    
    let timeToPost = null;
    if (scheduleMode === "timer") {
      timeToPost = new Date(scheduledTime).toISOString();
    }
    
    setIsSubmitting(true);
    const loadingToast = toast.loading(`Đang lên lịch cho ${selectedVideos.length} video x ${selectedAccounts.length} tài khoản...`);
    
    try {
      for (let vidId of selectedVideos) {
        for (let accId of selectedAccounts) {
          const res = await fetch(`${API_BASE}/upload-schedules/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              video_history_id: parseInt(vidId),
              account_id: parseInt(accId),
              caption: caption,
              hashtags: hashtags,
              scheduled_time: timeToPost,
              engine_type: engineType
            })
          });
          
          if (!res.ok) {
             const errData = await res.json();
             throw new Error(errData?.detail || `Lỗi khi lên lịch đăng video #${vidId}`);
          }
        }
      }
      
      toast.success("Lên lịch hàng loạt thành công!", { id: loadingToast });
      // Reset form
      setSelectedVideos([]);
      setSelectedAuthor(null);
      setSelectedAccounts([]);
      setCaption("");
      setHashtags("");
      setScheduledTime("");
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Lỗi khi lên lịch đăng", { id: loadingToast });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const deleteSchedule = async (id) => {
    if(!window.confirm("Bạn có chắc muốn xóa lịch đăng video này không?")) return;
    try {
      await fetch(`${API_BASE}/upload-schedules/${id}`, { method: 'DELETE' });
      toast.success("Đã gỡ lịch đăng video thành công! 🗑️");
      fetchData();
    } catch (error) {
      toast.error("Gặp sự cố khi xóa lịch đăng, vui lòng thử lại! ❌");
    }
  };

  const handleRetry = async (id) => {
    const loadingToast = toast.loading("Đang đẩy lại video...");
    try {
      const res = await fetch(`${API_BASE}/upload-schedules/${id}/retry`, { method: 'POST' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Lỗi khi thử lại");
      }
      toast.success("Đã đẩy video vào hàng đợi thành công!", { id: loadingToast });
      fetchData();
    } catch (error) {
      toast.error(error.message, { id: loadingToast });
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'pending': return <span className="flex items-center gap-1 text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded-md text-xs font-medium"><Clock size={12}/> Đang chờ</span>;
      case 'uploading': return <span className="flex items-center gap-1 text-blue-400 bg-blue-400/10 px-2 py-1 rounded-md text-xs font-medium"><RefreshCw size={12} className="animate-spin"/> Đang Up</span>;
      case 'success': return <span className="flex items-center gap-1 text-green-400 bg-green-400/10 px-2 py-1 rounded-md text-xs font-medium"><CheckCircle size={12}/> Thành công</span>;
      case 'failed': return <span className="flex items-center gap-1 text-red-400 bg-red-400/10 px-2 py-1 rounded-md text-xs font-medium"><XCircle size={12}/> Thất bại</span>;
      default: return <span className="text-gray-400">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Form Tạo Lịch */}
        <div className="lg:col-span-1 bg-bg-secondary border border-border-subtle rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <Send size={24} className="text-brand-primary" />
            Tạo Lịch Đăng Mới
          </h2>
          
          <form onSubmit={onSubmit} className="space-y-5">
            {/* Chọn Video (Folder/Gallery) */}
            <div>
              <div className="flex justify-between items-end mb-2">
                <label className="block text-sm font-medium text-text-secondary flex items-center gap-2">
                  <Video size={16} /> Chọn Video
                </label>
                <span className="text-xs text-brand-primary font-medium bg-brand-primary/10 px-2 py-0.5 rounded">
                  Đã chọn: {selectedVideos.length}
                </span>
              </div>
              
              <div className="bg-bg-primary border border-border-subtle rounded-xl p-4 max-h-[240px] overflow-y-auto">
                {!selectedAuthor ? (
                  // Level 1: Danh sách các kênh (Thư mục)
                  <div className="flex flex-col gap-2">
                    {Object.entries(groupedVideos).map(([author, authorVideos]) => (
                      <div 
                        key={author}
                        onClick={() => setSelectedAuthor(author)}
                        className="flex items-center justify-between gap-3 p-3 rounded-xl cursor-pointer transition-all border bg-bg-secondary border-border-subtle hover:border-brand-primary/50 hover:bg-glass-hover group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Folder size={24} className="text-brand-secondary group-hover:text-brand-primary transition-colors shrink-0" />
                          <div className="font-bold text-sm text-text-primary truncate" title={author}>{author}</div>
                        </div>
                        <div className="text-[10px] text-text-secondary px-2 py-0.5 bg-bg-primary rounded-md border border-border-subtle shrink-0">
                          {authorVideos.length} video
                        </div>
                      </div>
                    ))}
                    {Object.keys(groupedVideos).length === 0 && (
                      <div className="col-span-2 text-center py-10 text-text-tertiary">
                        <ImageIcon size={32} className="mx-auto mb-2 opacity-20" />
                        <p className="text-sm">Chưa có video nào hoàn tất render.</p>
                      </div>
                    )}
                  </div>
                ) : (
                  // Level 2: Lưới Gallery các video của kênh đó
                  <div className="space-y-3">
                    <div className="flex items-center justify-between sticky top-0 bg-bg-primary pb-2 z-10 border-b border-border-subtle">
                      <button 
                        type="button"
                        onClick={() => setSelectedAuthor(null)}
                        className="flex items-center gap-1 text-sm text-text-secondary hover:text-white transition-colors"
                      >
                        <ChevronLeft size={16} /> Trở lại
                      </button>
                      <h3 className="text-sm font-bold text-brand-primary truncate max-w-[150px]">{selectedAuthor}</h3>
                      <button 
                        type="button"
                        onClick={() => toggleAllAuthorVideos(groupedVideos[selectedAuthor])}
                        className="flex items-center gap-1 text-xs text-brand-secondary hover:text-brand-primary transition-colors bg-brand-primary/10 px-2 py-1 rounded-md"
                      >
                        <CheckSquare size={14} /> Chọn tất cả
                      </button>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      {groupedVideos[selectedAuthor]?.map(v => {
                        const isSelected = selectedVideos.includes(v.id);
                        return (
                          <div 
                            key={v.id}
                            onClick={() => handleVideoToggle(v.id)}
                            className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer border transition-all ${isSelected ? 'border-brand-primary bg-brand-primary/10 shadow-[0_0_10px_rgba(var(--color-brand-primary),0.1)]' : 'border-border-subtle bg-bg-secondary hover:border-brand-primary/50'}`}
                          >
                            <div className="w-12 h-16 shrink-0 rounded-lg overflow-hidden bg-black/50 border border-white/5 relative group/vid">
                              <video 
                                src={`http://localhost:8000/api/files/${(v.final_video_path || v.raw_video_path).replace(/^[/]?data[/]/, '')}#t=2.0`}
                                className="w-full h-full object-cover opacity-90 group-hover/vid:opacity-100 transition-opacity"
                                muted
                                loop
                                playsInline
                                preload="metadata"
                                onLoadedMetadata={(e) => { e.target.currentTime = 2; }}
                                onMouseEnter={(e) => { e.target.play().catch(()=>{}); }}
                                onMouseLeave={(e) => { e.target.pause(); e.target.currentTime = 2; }}
                              />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm text-text-primary font-medium truncate cursor-help" title={v.original_name}>{truncateFilename(v.original_name)}</p>
                                {(() => {
                                  // Check if this video has already been posted to ANY of the selected accounts
                                  const hasDuplicate = selectedAccounts.some(accId => postedMap[String(v.id)]?.has(String(accId)));
                                  return hasDuplicate ? (
                                    <div className="text-yellow-500 bg-yellow-500/10 p-0.5 rounded shrink-0" title="Đã đăng lên tài khoản đang chọn">
                                      <AlertTriangle size={12} />
                                    </div>
                                  ) : null;
                                })()}
                              </div>
                              <div className="flex items-center gap-2 mt-1.5">
                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${v.final_video_path || v.status === 'completed' || v.status === 'processed' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                  {v.final_video_path || v.status === 'completed' || v.status === 'processed' ? 'Đã render (Edit xong)' : 'Bản gốc (Chưa edit)'}
                                </span>
                                <span className="text-[10px] text-text-tertiary font-mono">#{v.id}</span>
                              </div>
                            </div>

                            {/* Checkbox indicator */}
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors mr-1 ${isSelected ? 'bg-brand-primary border-brand-primary' : 'bg-black/20 border-border-subtle'}`}>
                              {isSelected && <CheckCircle size={12} className="text-white" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Chọn Engine Upload */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2 flex items-center gap-2">
                <Cpu size={16} /> Chế độ Đăng bài (Engine)
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setEngineType("playwright")}
                  className={`flex flex-col items-center p-3 border rounded-xl transition-all ${engineType === 'playwright' ? 'border-brand-primary bg-brand-primary/10 text-brand-primary' : 'border-border-subtle hover:bg-glass-hover text-text-secondary'}`}
                >
                  <MonitorPlay size={24} className="mb-1" />
                  <span className="text-sm font-semibold">Web Browser</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEngineType("adb")}
                  className={`flex flex-col items-center p-3 border rounded-xl transition-all ${engineType === 'adb' ? 'border-brand-primary bg-brand-primary/10 text-brand-primary' : 'border-border-subtle hover:bg-glass-hover text-text-secondary'}`}
                >
                  <Smartphone size={24} className="mb-1" />
                  <span className="text-sm font-semibold">Mobile App (ADB)</span>
                </button>
              </div>
            </div>

            {/* Chọn Tài khoản */}
            <div>
              <div className="flex justify-between items-end mb-2">
                <label className="block text-sm font-medium text-text-secondary flex items-center gap-2">
                  <Users size={16} /> Chọn Nền tảng rải (Đa kênh)
                </label>
                <span className="text-xs text-brand-primary font-medium bg-brand-primary/10 px-2 py-0.5 rounded">
                  Đã chọn: {selectedAccounts.length}
                </span>
              </div>
              <div className="bg-bg-primary border border-border-subtle rounded-xl p-4 max-h-[240px] overflow-y-auto">
                {(() => {
                  const filteredAccounts = accounts.filter(acc => {
                    const type = acc.connection_type || 'web_playwright';
                    if (engineType === 'playwright') return type === 'web_playwright';
                    if (engineType === 'adb') return type === 'adb_device';
                    return false;
                  });

                  if (filteredAccounts.length === 0) {
                    return (
                      <div className="text-center py-6 text-text-tertiary">
                        <Users size={32} className="mx-auto mb-2 opacity-20" />
                        <p className="text-sm">Chưa có tài khoản nào phù hợp với Engine hiện tại.</p>
                      </div>
                    );
                  }

                  return (
                    <div className="flex flex-col gap-2">
                      {filteredAccounts.map(acc => {
                        const isSelected = selectedAccounts.includes(acc.id);
                        const hasDuplicate = selectedVideos.some(vidId => postedMap[String(vidId)]?.has(String(acc.id)));
                        return (
                          <label 
                            key={acc.id} 
                            className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all border ${isSelected ? 'bg-brand-primary/10 border-brand-primary shadow-[0_0_10px_rgba(var(--color-brand-primary),0.2)]' : 'bg-bg-secondary border-border-subtle hover:border-brand-primary/50'} ${hasDuplicate && !isSelected ? 'opacity-60' : ''}`}
                            title={hasDuplicate ? "Video đã chọn từng được đăng trên tài khoản này!" : ""}
                          >
                            <input 
                              type="checkbox" 
                              className="hidden"
                              checked={isSelected}
                              onChange={() => handleAccountToggle(acc.id)}
                            />
                            {acc.avatar_url ? (
                              <img src={acc.avatar_url} alt="avt" referrerPolicy="no-referrer" className="w-6 h-6 rounded-full object-cover border border-white/10 shrink-0" />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-brand-primary/20 flex items-center justify-center text-[10px] font-bold text-brand-primary uppercase border border-white/5 shrink-0">
                                {acc.platform.charAt(0)}
                              </div>
                            )}
                            <div className="flex-1 min-w-0 flex items-center gap-2">
                              <div className="font-medium text-sm text-text-primary truncate">{acc.username || "No name"}</div>
                              {hasDuplicate && (
                                <div className="text-yellow-500 bg-yellow-500/10 p-0.5 rounded shrink-0" title="Cảnh báo: Video đã đăng">
                                  <AlertTriangle size={12} />
                                </div>
                              )}
                              <div className="text-[9px] px-1.5 py-0.5 rounded bg-bg-primary border border-border-subtle text-text-secondary uppercase tracking-wider shrink-0">{acc.platform}</div>
                            </div>
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'border-brand-primary' : 'border-border-subtle'}`}>
                              {isSelected && <div className="w-2 h-2 bg-brand-primary rounded-full" />}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Caption & Hashtags */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-text-secondary">Nội dung Caption</label>
                <button 
                  type="button" 
                  onClick={generateAIContent}
                  disabled={isGenerating}
                  className="flex items-center gap-1 text-xs text-brand-primary hover:text-brand-secondary transition-colors font-medium bg-brand-primary/10 px-2 py-1 rounded-md"
                >
                  <Sparkles size={14} /> {isGenerating ? "Đang viết..." : "Tự viết bằng AI"}
                </button>
              </div>
              <textarea 
                value={caption}
                onChange={e => setCaption(e.target.value)}
                rows={3}
                placeholder="Nhập caption của bạn hoặc dùng AI sinh tự động..."
                className="w-full bg-bg-primary border border-border-subtle rounded-xl px-4 py-3 focus:outline-none focus:border-brand-primary transition-colors text-sm resize-none"
              />
              <input 
                type="text" 
                value={hashtags}
                onChange={e => setHashtags(e.target.value)}
                placeholder="#xuhuong #trending"
                className="w-full bg-bg-primary border border-border-subtle rounded-xl px-4 py-2.5 focus:outline-none focus:border-brand-primary transition-colors text-sm font-mono text-brand-secondary"
              />
            </div>

            {/* Thời gian đăng */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2 flex items-center gap-2">
                <CalendarClock size={16} /> Thời gian lên sóng
              </label>
              <div className="flex gap-4 mb-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="mode" className="accent-brand-primary" checked={scheduleMode === 'now'} onChange={() => setScheduleMode('now')} />
                  <span className="text-sm">Đăng ngay</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="mode" className="accent-brand-primary" checked={scheduleMode === 'timer'} onChange={() => setScheduleMode('timer')} />
                  <span className="text-sm">Hẹn giờ</span>
                </label>
              </div>
              
              {scheduleMode === 'timer' && (
                <input 
                  type="datetime-local" 
                  value={scheduledTime}
                  onChange={e => setScheduledTime(e.target.value)}
                  className="w-full bg-bg-primary border border-border-subtle rounded-xl px-4 py-3 focus:outline-none focus:border-brand-primary transition-colors [color-scheme:dark]"
                />
              )}
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-semibold py-3.5 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg shadow-brand-primary/20"
            >
              {isSubmitting ? <RefreshCw className="animate-spin" size={20} /> : <Send size={20} />}
              Xác nhận Lên Lịch
            </button>
          </form>
        </div>

        {/* Bảng Danh sách Lịch đăng */}
        <div className="lg:col-span-2 bg-bg-secondary border border-border-subtle rounded-2xl p-6 flex flex-col h-[800px]">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <CalendarClock size={24} className="text-brand-secondary" />
              Tiến trình Lên Lịch
            </h2>
            <button onClick={fetchData} className="p-2 hover:bg-glass-hover rounded-lg text-text-secondary transition-colors" title="Làm mới">
              <RefreshCw size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-auto rounded-xl border border-border-subtle">
            <table className="w-full text-left border-collapse">
              <thead className="bg-bg-primary sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="p-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">Video ID</th>
                  <th className="p-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">Account</th>
                  <th className="p-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">Engine</th>
                  <th className="p-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">Thời gian hẹn</th>
                  <th className="p-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">Trạng thái</th>
                  <th className="p-4 text-xs font-semibold text-text-secondary uppercase tracking-wider text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {schedules.length === 0 && (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-text-tertiary">
                      Chưa có lịch đăng nào được tạo.
                    </td>
                  </tr>
                )}
                {schedules.map(sch => (
                  <tr key={sch.id} className="hover:bg-glass-hover transition-colors">
                    <td className="p-4 text-sm font-medium">
                      {(() => {
                        const v = videos.find(v => v.id === sch.video_history_id);
                        if (!v) {
                          return <div className="font-mono text-xs text-text-secondary">Video #{sch.video_history_id}</div>;
                        }
                        const videoName = v.original_name || v.raw_video_path;
                        return (
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-14 shrink-0 rounded overflow-hidden bg-black/50 border border-border-subtle relative group/vid">
                              <video 
                                src={`http://localhost:8000/api/files/${(v.final_video_path || v.raw_video_path).replace(/^[/]?data[/]/, '')}#t=2.0`}
                                className="w-full h-full object-cover opacity-90 group-hover/vid:opacity-100 transition-opacity"
                                muted
                                loop
                                playsInline
                                preload="metadata"
                                onLoadedMetadata={(e) => { e.target.currentTime = 2; }}
                                onMouseEnter={(e) => { e.target.play().catch(()=>{}); }}
                                onMouseLeave={(e) => { e.target.pause(); e.target.currentTime = 2; }}
                              />
                            </div>
                            <div title={videoName} className="cursor-help font-mono text-brand-secondary bg-brand-secondary/10 px-2 py-1 rounded inline-block text-xs">
                              {truncateFilename(videoName)}
                            </div>
                          </div>
                        );
                      })()}
                    </td>
                    <td className="p-4 text-sm">
                      {(() => {
                        const a = accounts.find(a => a.id === sch.account_id);
                        if (!a) return `ID: ${sch.account_id}`;
                        return (
                          <div className="flex items-center gap-2">
                            {a.avatar_url ? (
                              <img src={a.avatar_url} referrerPolicy="no-referrer" className="w-6 h-6 rounded-full object-cover" alt="avt" />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-brand-primary/20 flex items-center justify-center text-[9px] font-bold text-brand-primary uppercase">
                                {a.platform.charAt(0)}
                              </div>
                            )}
                            <span className="font-medium text-text-primary">{a.username}</span>
                          </div>
                        );
                      })()}
                    </td>
                    <td className="p-4 text-sm">
                      {sch.engine_type === 'playwright' ? <span className="text-blue-400">Web</span> : <span className="text-purple-400">ADB</span>}
                    </td>
                    <td className="p-4 text-sm font-mono text-text-secondary">
                      {sch.status === 'completed' && sch.updated_at
                        ? new Date(sch.updated_at).toLocaleString('vi-VN')
                        : sch.scheduled_time 
                          ? new Date(sch.scheduled_time).toLocaleString('vi-VN') 
                          : 'Đăng ngay'}
                    </td>
                    <td className="p-4">
                      {getStatusBadge(sch.status)}
                      {sch.error_message && (
                        <p className="text-xs text-red-400 mt-1 truncate max-w-[150px]" title={sch.error_message}>{sch.error_message}</p>
                      )}
                      {sch.post_url && (
                        <a href={sch.post_url} target="_blank" rel="noreferrer" className="text-xs text-brand-primary hover:underline mt-1 block truncate max-w-[150px]">Link Post</a>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        {sch.status === 'failed' && (
                          <button 
                            onClick={() => handleRetry(sch.id)}
                            className="text-text-tertiary hover:text-brand-primary transition-colors flex items-center justify-center p-1 bg-brand-primary/10 rounded"
                            title="Thử lại (Dùng nguyên caption và nền tảng cũ)"
                          >
                            <RefreshCw size={16} />
                          </button>
                        )}
                        <button 
                          onClick={() => deleteSchedule(sch.id)}
                          className="text-text-tertiary hover:text-red-400 transition-colors p-1"
                          title="Xóa lịch"
                        >
                          <XCircle size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadSchedule;
