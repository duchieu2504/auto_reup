import { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-hot-toast';

const API_BASE = 'http://localhost:8000/api';

export const truncateFilename = (filename) => {
  if (!filename) return "Unknown";
  const name = filename.split('/').pop().split('\\').pop();
  if (name.length <= 15) return name;
  const ext = name.split('.').pop();
  const base = name.substring(0, name.lastIndexOf('.'));
  if (base.length <= 10) return name;
  return `${base.substring(0, 2)}..${base.substring(base.length - 5)}.${ext}`;
};

export const useScheduleData = () => {
  const [schedules, setSchedules] = useState([]);
  const [videos, setVideos] = useState([]);
  const [accounts, setAccounts] = useState([]);
  
  // Form State
  const [selectedVideos, setSelectedVideos] = useState([]);
  const [selectedAuthor, setSelectedAuthor] = useState(null);
  const [selectedAccounts, setSelectedAccounts] = useState([]);
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [scheduleMode, setScheduleMode] = useState("now");
  const [scheduledTime, setScheduledTime] = useState("");
  const [engineType, setEngineType] = useState("playwright");
  
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

  const handleAccountToggle = (accId) => {
    setSelectedAccounts(prev => 
      prev.includes(accId) ? prev.filter(id => id !== accId) : [...prev, accId]
    );
  };

  const handleVideoToggle = (vidId) => {
    setSelectedVideos(prev => 
      prev.includes(vidId) ? prev.filter(id => id !== vidId) : [...prev, vidId]
    );
  };

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
    
    // Check duplicates
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

  const handlePause = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/upload-schedules/${id}/pause`, { method: 'POST' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Lỗi khi tạm dừng");
      }
      toast.success("Đã tạm dừng tiến trình upload ⏸️");
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleResume = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/upload-schedules/${id}/resume`, { method: 'POST' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Lỗi khi tiếp tục");
      }
      toast.success("Đã tiếp tục tiến trình upload ▶️");
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleStop = async (id) => {
    if (!window.confirm("Bạn có chắc muốn HỦY tiến trình upload này không? Thao tác này không thể hoàn tác!")) return;
    try {
      const res = await fetch(`${API_BASE}/upload-schedules/${id}/stop`, { method: 'POST' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Lỗi khi hủy");
      }
      toast.success("Đang hủy tiến trình upload... 🛑");
    } catch (error) {
      toast.error(error.message);
    }
  };

  return {
    schedules, videos, accounts,
    selectedVideos, setSelectedVideos, selectedAuthor, setSelectedAuthor,
    selectedAccounts, setSelectedAccounts, caption, setCaption, hashtags, setHashtags,
    scheduleMode, setScheduleMode, scheduledTime, setScheduledTime, engineType, setEngineType,
    isGenerating, isSubmitting, groupedVideos, postedMap,
    handleAccountToggle, handleVideoToggle, toggleAllAuthorVideos, generateAIContent,
    onSubmit, deleteSchedule, handleRetry, handlePause, handleResume, handleStop, fetchData
  };
};
