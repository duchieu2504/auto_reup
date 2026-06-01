import React, { useState, useEffect } from 'react';

import { toast } from 'react-hot-toast';
import { CalendarClock, CheckCircle, Clock, Video, Users, Sparkles, Send, XCircle, RefreshCw, Cpu, MonitorPlay, Smartphone } from 'lucide-react';

const API_BASE = 'http://localhost:8000/api';

const UploadSchedule = () => {
  const [schedules, setSchedules] = useState([]);
  const [videos, setVideos] = useState([]);
  const [accounts, setAccounts] = useState([]);
  
  // Form State
  const [selectedVideo, setSelectedVideo] = useState("");
  const [selectedAccounts, setSelectedAccounts] = useState([]);
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [scheduleMode, setScheduleMode] = useState("now"); // now or timer
  const [scheduledTime, setScheduledTime] = useState("");
  const [engineType, setEngineType] = useState("playwright"); // playwright or adb
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const generateAIContent = async () => {
    if (!selectedVideo) {
      toast.error("Vui lòng chọn Video trước khi sinh Caption!");
      return;
    }
    
    setIsGenerating(true);
    const loadingToast = toast.loading("Đang gọi AI để phân tích video...");
    try {
      const res = await fetch(`${API_BASE}/upload-schedules/generate-content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ video_history_id: parseInt(selectedVideo) })
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
    if (!selectedVideo) return toast.error("Chưa chọn Video!");
    if (selectedAccounts.length === 0) return toast.error("Chưa chọn Tài khoản MXH!");
    if (scheduleMode === "timer" && !scheduledTime) return toast.error("Vui lòng chọn thời gian hẹn giờ!");
    
    let timeToPost = null;
    if (scheduleMode === "timer") {
      timeToPost = new Date(scheduledTime).toISOString();
    }
    
    setIsSubmitting(true);
    const loadingToast = toast.loading("Đang lên lịch...");
    
    try {
      // Vì API hiện tại chỉ nhận 1 account mỗi request, ta lặp qua từng account
      for (let accId of selectedAccounts) {
        const res = await fetch(`${API_BASE}/upload-schedules/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            video_history_id: parseInt(selectedVideo),
            account_id: parseInt(accId),
            caption: caption,
            hashtags: hashtags,
            scheduled_time: timeToPost,
            engine_type: engineType
          })
        });
        
        if (!res.ok) {
           const errData = await res.json();
           throw new Error(errData?.detail || "Lỗi khi lên lịch đăng");
        }
      }
      
      toast.success("Lên lịch thành công!", { id: loadingToast });
      // Reset form
      setSelectedVideo("");
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
            {/* Chọn Video */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2 flex items-center gap-2">
                <Video size={16} /> Chọn Video
              </label>
              <select 
                value={selectedVideo} 
                onChange={e => setSelectedVideo(e.target.value)}
                className="w-full bg-bg-primary border border-border-subtle rounded-xl px-4 py-3 focus:outline-none focus:border-brand-primary transition-colors appearance-none"
              >
                <option value="">-- Chọn video đã Render --</option>
                {videos.map(v => (
                  <option key={v.id} value={v.id}>[{v.id}] {v.original_name}</option>
                ))}
              </select>
            </div>
            
            {/* Chọn Tài khoản */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2 flex items-center gap-2">
                <Users size={16} /> Chọn Nền tảng rải (Đa kênh)
              </label>
              <div className="bg-bg-primary border border-border-subtle rounded-xl p-3 max-h-40 overflow-y-auto space-y-2">
                {accounts.length === 0 && <p className="text-xs text-text-tertiary">Chưa có tài khoản nào được cấu hình.</p>}
                {accounts.map(acc => (
                  <label key={acc.id} className="flex items-center gap-3 p-2 hover:bg-glass-hover rounded-lg cursor-pointer transition-colors">
                    <input 
                      type="checkbox" 
                      className="accent-brand-primary w-4 h-4"
                      checked={selectedAccounts.includes(acc.id)}
                      onChange={() => handleAccountToggle(acc.id)}
                    />
                    {acc.avatar_url ? (
                      <img src={acc.avatar_url} alt="avt" referrerPolicy="no-referrer" className="w-6 h-6 rounded-full object-cover border border-white/10" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-brand-primary/20 flex items-center justify-center text-[10px] font-bold text-brand-primary uppercase border border-white/5">
                        {acc.platform.charAt(0)}
                      </div>
                    )}
                    <span className="flex-1 font-medium text-sm">{acc.platform.toUpperCase()}</span>
                    <span className="text-xs text-text-secondary truncate text-right font-medium">{acc.username || "No name"}</span>
                  </label>
                ))}
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
                    <td className="p-4 text-sm font-medium">#{sch.video_history_id}</td>
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
                      {sch.scheduled_time ? new Date(sch.scheduled_time).toLocaleString('vi-VN') : 'Đăng ngay'}
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
