import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

const API_BASE = 'http://localhost:8000/api';

export const workflowSteps = [
  { id: 'pending', label: 'Tải về' },
  { id: 'transcribing', label: 'Nhận diện' },
  { id: 'translating', label: 'Dịch' },
  { id: 'generating_tts', label: 'Lồng tiếng' },
  { id: 'rendering', label: 'Ghép Video' },
  { id: 'completed', label: 'Hoàn tất' }
];

export const getStepIndex = (status, errorMsg) => {
  if (status === 'downloading' || status === 'paused') return 0;
  if (status === 'failed') {
    if (!errorMsg) return 0;
    const msg = errorMsg.toLowerCase();
    if (msg.includes('dịch')) return 2; // translating
    if (msg.includes('tts') || msg.includes('lồng tiếng')) return 3; // generating_tts
    if (msg.includes('render') || msg.includes('ghép')) return 4; // rendering
    return 1; // transcribing as fallback
  }
  const idx = workflowSteps.findIndex(s => s.id === status);
  return idx >= 0 ? idx : 0;
};

export const useHistoryData = () => {
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSource, setFilterSource] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  
  // UI States
  const [previewFile, setPreviewFile] = useState(null);
  const [previewType, setPreviewType] = useState('');
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [processingItems, setProcessingItems] = useState([]);
  
  // Groq Fallback
  const [showGroqFallbackModal, setShowGroqFallbackModal] = useState(false);
  const [fallbackItem, setFallbackItem] = useState(null);

  // Preview thumbnail state
  const [previewTime, setPreviewTime] = useState(3);
  const [previewImageUrl, setPreviewImageUrl] = useState('');

  // Config data
  const [voices, setVoices] = useState([]);

  useEffect(() => {
    fetchHistory();
  }, [filterSource, filterDate, filterStatus]);

  useEffect(() => {
    fetch(`${API_BASE}/settings/voices`)
      .then(res => res.json())
      .then(data => {
        if(data.voices) setVoices(data.voices);
      })
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    if (showConfigModal && processingItems.length > 0) {
      setPreviewImageUrl(`http://localhost:8000/api/history/thumbnail?path=${encodeURIComponent(processingItems[0])}&time=${previewTime}`);
    } else {
      setPreviewImageUrl('');
    }
  }, [showConfigModal, processingItems, previewTime]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      let url = `${API_BASE}/history/?limit=100`;
      const params = new URLSearchParams();
      if (filterSource) params.append('source', filterSource);
      if (filterDate) params.append('date', filterDate);
      if (filterStatus) params.append('status', filterStatus);
      if (params.toString()) {
        url += `&${params.toString()}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      setHistoryData(data);
    } catch (err) {
      console.error('Lỗi khi lấy lịch sử:', err);
    } finally {
      setLoading(false);
    }
  };

  // Smart Polling Mechanism
  useEffect(() => {
    const activeItems = historyData.filter(item => 
      ['pending', 'downloading', 'transcribing', 'translating', 'generating_tts', 'rendering'].includes(item.status)
    );

    if (activeItems.length === 0) return;

    const intervalId = setInterval(async () => {
      try {
        const ids = activeItems.map(item => item.id).join(',');
        const res = await fetch(`${API_BASE}/history/status?ids=${ids}`);
        if (!res.ok) return;
        const statuses = await res.json();
        
        let needsFullRefresh = false;
        
        setHistoryData(prevData => {
          const newData = [...prevData];
          let updated = false;
          
          statuses.forEach(statusUpdate => {
            const idx = newData.findIndex(item => item.id === statusUpdate.id);
            if (idx !== -1) {
              const currentItem = newData[idx];
              if (currentItem.status !== statusUpdate.status || currentItem.error_message !== statusUpdate.error_message) {
                newData[idx] = { ...currentItem, status: statusUpdate.status, error_message: statusUpdate.error_message };
                updated = true;
                if (statusUpdate.status === 'completed' || statusUpdate.status === 'failed') {
                  needsFullRefresh = true;
                }
              }
            }
          });
          
          return updated ? newData : prevData;
        });

        if (needsFullRefresh) {
          fetchHistory();
        }
      } catch (err) {
        console.error("Lỗi khi smart polling:", err);
      }
    }, 3000);

    return () => clearInterval(intervalId);
  }, [historyData]);

  const executeBulkDelete = async () => {
    try {
      const res = await fetch(`${API_BASE}/history/bulk`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds })
      });
      if (res.ok) {
        setHistoryData(prev => prev.filter(item => !selectedIds.includes(item.id)));
        setSelectedIds([]);
        toast.success("Đã xóa các video được chọn.");
      } else {
        toast.error("Lỗi khi xóa video.");
      }
    } catch (err) {
      console.error('Lỗi khi xóa lịch sử:', err);
      toast.error("Lỗi kết nối Server");
    }
  };

  const handleBulkDelete = () => {
    toast((t) => (
      <div className="flex flex-col gap-4 p-1">
        <p className="text-sm font-medium">Bạn có chắc chắn muốn xóa {selectedIds.length} video này? Các file vật lý cũng sẽ bị xóa!</p>
        <div className="flex justify-end gap-2 mt-2">
          <button className="px-3 py-1.5 bg-bg-secondary border border-border-subtle text-text-primary hover:bg-glass-hover rounded-lg text-xs transition-colors" onClick={() => toast.dismiss(t.id)}>Hủy</button>
          <button className="px-3 py-1.5 bg-red-500 text-white hover:bg-red-600 rounded-lg text-xs transition-colors" onClick={() => {
            toast.dismiss(t.id);
            executeBulkDelete();
          }}>Xác nhận Xóa</button>
        </div>
      </div>
    ), { duration: Infinity });
  };

  const handleSyncData = async () => {
    toast.loading("Đang đồng bộ data...", { id: 'sync' });
    try {
      const res = await fetch(`${API_BASE}/history/sync`, {
        method: 'POST'
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Đã đồng bộ ${data.added_count} video mới từ thư mục data.`, { id: 'sync' });
        fetchHistory();
      } else {
        toast.error("Lỗi đồng bộ: " + data.message, { id: 'sync' });
      }
    } catch (err) {
      console.error('Lỗi khi đồng bộ:', err);
      toast.error("Lỗi kết nối Server", { id: 'sync' });
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(historyData.map(item => item.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleResumeProcessing = async (item) => {
    if (!item.raw_video_path) return toast.error("Không tìm thấy đường dẫn video gốc");
    
    if (item.error_message === "GROQ_LIMIT_EXCEEDED") {
      setFallbackItem(item);
      setShowGroqFallbackModal(true);
      return;
    }
    
    if (item.process_config && item.process_config !== "{}" && item.process_config !== "") {
      try {
        const config = JSON.parse(item.process_config);
        const payload = {
          video_paths: [item.raw_video_path],
          ...config
        };
        const res = await fetch(`${API_BASE}/processor/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.status === 'started') {
          toast.success('Đã tiếp tục xử lý với cấu hình cũ!');
          fetchHistory();
          return;
        }
      } catch (e) {
        console.error("Lỗi khi resume tự động:", e);
      }
    }
    
    setProcessingItems([item.raw_video_path]);
    setShowConfigModal(true);
  };

  const handleGroqFallback = async () => {
    try {
      const keysRes = await fetch('http://localhost:8000/api/settings/keys');
      const keys = await keysRes.json();
      
      await fetch('http://localhost:8000/api/settings/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...keys,
          use_groq: false
        })
      });
      
      toast.success("Đã tắt Groq. Đang khởi động lại bằng CPU...");
      setShowGroqFallbackModal(false);
      
      if (fallbackItem) {
        const modifiedItem = { ...fallbackItem, error_message: "" };
        handleResumeProcessing(modifiedItem);
      }
      
    } catch (e) {
      console.error(e);
      toast.error("Lỗi khi chuyển đổi cấu hình");
    }
  };

  const handleBulkProcess = () => {
    const paths = historyData
      .filter(item => selectedIds.includes(item.id))
      .map(item => item.raw_video_path)
      .filter(Boolean);
      
    if (paths.length === 0) {
      return toast.error("Không có video nào có file gốc hợp lệ để xử lý.");
    }
    setProcessingItems(paths);
    setShowConfigModal(true);
  };

  const submitProcessing = async (subtitleConfig) => {
    try {
      const res = await fetch(`${API_BASE}/processor/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          video_paths: processingItems,
          voice_mode: subtitleConfig.voice,
          bg_volume: parseInt(subtitleConfig.volume),
          flip_video: subtitleConfig.flipVideo,
          opt_zoom: subtitleConfig.optZoom,
          opt_color: subtitleConfig.optColor,
          opt_noise: subtitleConfig.optNoise,
          opt_pitch: subtitleConfig.optPitch,
          subtitle_style: subtitleConfig.subtitleStyle,
          subtitle_text_color: subtitleConfig.subtitleTextColor,
          subtitle_bg_color: subtitleConfig.subtitleBgColor,
          subtitle_font_size: subtitleConfig.subtitleFontSize,
          subtitle_margin_v: subtitleConfig.subtitleMarginV,
          subtitle_bg_padding: subtitleConfig.subtitleBgPadding,
          subtitle_bg_opacity: subtitleConfig.subtitleBgOpacity
        })
      });
      const data = await res.json();
      if (data.status === 'started') {
        toast.success(`Đã gửi lệnh xử lý cho ${processingItems.length} video.`);
        setShowConfigModal(false);
        fetchHistory();
        setSelectedIds([]);
      } else {
        toast.error("Lỗi khi gửi lệnh xử lý: " + JSON.stringify(data));
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi kết nối Server");
    }
  };

  const handlePauseProcessing = async (item) => {
    if (!item.raw_video_path) return;
    try {
      const res = await fetch(`${API_BASE}/processor/pause`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ video_path: item.raw_video_path })
      });
      const data = await res.json();
      if (data.status === 'success') {
        toast.success("Đã tạm dừng tiến trình.");
        fetchHistory(); 
      } else {
        toast.error("Lỗi khi gửi lệnh tạm dừng: " + JSON.stringify(data));
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi kết nối Server");
    }
  };

  const handlePreview = (filePath, type) => {
    if (!filePath) {
      toast.error("Không tìm thấy file.");
      return;
    }
    const safePath = filePath.replace(/^[/]?data[/]/, '');
    setPreviewFile(`http://localhost:8000/api/files/${safePath}`);
    setPreviewType(type);
  };

  return {
    historyData, loading, selectedIds, searchQuery, filterSource, filterDate, filterStatus,
    setSearchQuery, setFilterSource, setFilterDate, setFilterStatus,
    showConfigModal, setShowConfigModal, processingItems, setProcessingItems,
    showGroqFallbackModal, setShowGroqFallbackModal, fallbackItem, setFallbackItem,
    previewFile, setPreviewFile, previewType, setPreviewType,
    previewTime, setPreviewTime, previewImageUrl,
    voices,
    handleSyncData, handleBulkDelete, handleSelectAll, handleSelect,
    handleResumeProcessing, handleGroqFallback, handleBulkProcess,
    submitProcessing, handlePauseProcessing, handlePreview,
    fetchHistory
  };
};
