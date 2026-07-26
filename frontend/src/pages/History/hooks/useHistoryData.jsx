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
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [filterSource, setFilterSource] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  
  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  
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
  const [accounts, setAccounts] = useState([]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    fetchHistory();
  }, [filterSource, filterDate, filterStatus, currentPage, itemsPerPage, debouncedSearchQuery]);

  useEffect(() => {
    fetch(`${API_BASE}/settings/voices`)
      .then(res => res.json())
      .then(data => {
        if(data.voices) setVoices(data.voices);
      })
      .catch(err => console.error(err));

    fetch(`${API_BASE}/social-accounts/`)
      .then(res => res.json())
      .then(data => setAccounts(data))
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
      let url = `${API_BASE}/history/`;
      const params = new URLSearchParams();
      if (debouncedSearchQuery) params.append('search', debouncedSearchQuery);
      if (filterSource) params.append('source', filterSource);
      if (filterDate) params.append('date', filterDate);
      if (filterStatus) params.append('status', filterStatus);
      params.append('page', currentPage);
      params.append('limit', itemsPerPage);

      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      setHistoryData(data.data || []);
      setTotalPages(data.pages || 1);
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
    
    // Fetch full record with process_config (deferred from list query for performance)
    try {
      const detailRes = await fetch(`${API_BASE}/history/${item.id}`);
      if (detailRes.ok) {
        const fullItem = await detailRes.json();
        if (fullItem.process_config && fullItem.process_config !== "{}" && fullItem.process_config !== "") {
          const config = JSON.parse(fullItem.process_config);
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
        }
      }
    } catch (e) {
      console.error("Lỗi khi resume tự động:", e);
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
      if (subtitleConfig && typeof subtitleConfig.saveEditProfile === 'function') {
        subtitleConfig.saveEditProfile(); // Save selected params as default for next time
      }

      let finalWatermarkPath = subtitleConfig.watermarkImagePath;
      if (subtitleConfig.watermarkType === 'image' && subtitleConfig.watermarkImageFile) {
        const formData = new FormData();
        formData.append('file', subtitleConfig.watermarkImageFile);
        const uploadRes = await fetch(`${API_BASE}/processor/upload-logo`, {
          method: 'POST',
          body: formData
        });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          finalWatermarkPath = uploadData.path;
          subtitleConfig.setWatermarkImagePath(finalWatermarkPath);
        } else {
          return toast.error("Lỗi khi tải lên logo watermark!");
        }
      }

      const res = await fetch(`${API_BASE}/processor/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          video_paths: processingItems,
          voice_mode: subtitleConfig.voice,
          bg_volume: parseInt(subtitleConfig.volume),
          vocal_volume: parseInt(subtitleConfig.vocalVolume || 0),
          flip_video: subtitleConfig.flipVideo,
          opt_zoom: subtitleConfig.optZoom,
          opt_color: subtitleConfig.optColor,
          opt_noise: subtitleConfig.optNoise,
          opt_pitch: subtitleConfig.optPitch,
          opt_speed: subtitleConfig.optSpeed,
          opt_reverb: subtitleConfig.optReverb,
          opt_vignette: subtitleConfig.optVignette,
          opt_random_combo: subtitleConfig.optRandomCombo,
          enable_subtitles: subtitleConfig.enableSubtitles,
          subtitle_style: subtitleConfig.subtitleStyle,
          subtitle_text_color: subtitleConfig.subtitleTextColor,
          subtitle_bg_color: subtitleConfig.subtitleBgColor,
          subtitle_font_size: subtitleConfig.subtitleFontSize,
          subtitle_margin_v: subtitleConfig.subtitleMarginV,
          subtitle_bg_padding: subtitleConfig.subtitleBgPadding,
          subtitle_bg_opacity: subtitleConfig.subtitleBgOpacity,
          watermark_type: subtitleConfig.watermarkType || "none",
          watermark_text: subtitleConfig.watermarkText || null,
          watermark_image_path: finalWatermarkPath || null,
          watermark_x: subtitleConfig.watermarkX || 50.0,
          watermark_y: subtitleConfig.watermarkY || 50.0,
          watermark_size: subtitleConfig.watermarkSize || 20.0,
          watermark_color: subtitleConfig.watermarkColor || "#FFFFFF",
          watermark_opacity: subtitleConfig.watermarkOpacity || 50.0,
          mask_enabled: subtitleConfig.maskEnabled,
          mask_x: subtitleConfig.maskX || 10.0,
          mask_y: subtitleConfig.maskY || 10.0,
          mask_width: subtitleConfig.maskWidth || 20.0,
          mask_height: subtitleConfig.maskHeight || 15.0,
          mask_type: subtitleConfig.maskType || "color",
          mask_color: subtitleConfig.maskColor || "#000000",
          masks: subtitleConfig.masks || [],
          use_bcut_asr: subtitleConfig.useBcutAsr ?? false,
          use_llm_segmentation: subtitleConfig.useLlmSegmentation ?? false,
          whisper_prompt: subtitleConfig.whisperPrompt || null
        })
      });
      const data = await res.json();
      if (data.status === 'started') {
        toast.success(`Đã gửi lệnh xử lý cho ${processingItems.length} video.`);
        setShowConfigModal(false);
        
        // Cập nhật Optimistic UI ngay lập tức thành "transcribing" (để đổi nút Play thành Pause)
        setHistoryData(prev => prev.map(item => {
          if (processingItems.includes(item.raw_video_path)) {
            return { ...item, status: 'transcribing' };
          }
          return item;
        }));
        
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
    const safePath = (filePath || '').replace(/\\/g, '/').replace(/^.*?(?:^|\/)data\//, '').split('/').map(encodeURIComponent).join('/');
    setPreviewFile(`http://localhost:8000/api/files/${safePath}`);
    setPreviewType(type);
  };

  const handleDeleteFiles = async (id) => {
    toast((t) => (
      <div className="flex flex-col gap-4 p-1">
        <p className="text-sm font-medium">Bạn có chắc chắn muốn xóa file video vật lý để tiết kiệm dung lượng? Lịch sử và thumbnail vẫn được giữ lại.</p>
        <div className="flex justify-end gap-2 mt-2">
          <button className="px-3 py-1.5 bg-bg-secondary border border-border-subtle text-text-primary hover:bg-glass-hover rounded-lg text-xs transition-colors" onClick={() => toast.dismiss(t.id)}>Hủy</button>
          <button className="px-3 py-1.5 bg-red-500 text-white hover:bg-red-600 rounded-lg text-xs transition-colors" onClick={async () => {
            toast.dismiss(t.id);
            const toastId = toast.loading("Đang xóa file video...");
            try {
              const res = await fetch(`${API_BASE}/history/${id}/delete-files`, { method: 'POST' });
              if (res.ok) {
                toast.success("Đã xóa file video vật lý, giữ lại thumbnail & DB.", { id: toastId });
                fetchHistory();
              } else {
                toast.error("Lỗi khi xóa file.", { id: toastId });
              }
            } catch (err) {
              toast.error("Lỗi kết nối server.", { id: toastId });
            }
          }}>Xác nhận</button>
        </div>
      </div>
    ), { duration: Infinity });
  };

  return {
    historyData, loading, selectedIds, searchQuery, filterSource, filterDate, filterStatus,
    setSearchQuery, setFilterSource, setFilterDate, setFilterStatus,
    currentPage, setCurrentPage, itemsPerPage, setItemsPerPage, totalPages,
    showConfigModal, setShowConfigModal, processingItems, setProcessingItems,
    showGroqFallbackModal, setShowGroqFallbackModal, fallbackItem, setFallbackItem,
    previewFile, setPreviewFile, previewType, setPreviewType,
    previewTime, setPreviewTime, previewImageUrl,
    voices, accounts,
    handleSyncData, handleBulkDelete, handleSelectAll, handleSelect,
    handleResumeProcessing, handleGroqFallback, handleBulkProcess,
    submitProcessing, handlePauseProcessing, handlePreview,
    handleDeleteFiles,
    fetchHistory
  };
};
