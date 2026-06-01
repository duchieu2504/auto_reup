import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Trash2, Edit, PlayCircle, PauseCircle, Filter, CheckCircle2, Circle, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';

const API_BASE = 'http://localhost:8000/api';

const workflowSteps = [
  { id: 'pending', label: 'Tải về' },
  { id: 'transcribing', label: 'Nhận diện' },
  { id: 'translating', label: 'Dịch' },
  { id: 'generating_tts', label: 'Lồng tiếng' },
  { id: 'rendering', label: 'Ghép Video' },
  { id: 'completed', label: 'Hoàn tất' }
];

const getStepIndex = (status, errorMsg) => {
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

const History = () => {
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSource, setFilterSource] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [previewFile, setPreviewFile] = useState(null);
  const [previewType, setPreviewType] = useState('');
  
  // Trạm chờ config state
  const [voices, setVoices] = useState([]);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configVoice, setConfigVoice] = useState('edge_auto');
  const [configVolume, setConfigVolume] = useState(10);
  const [configFlipVideo, setConfigFlipVideo] = useState(false);
  const [processingItems, setProcessingItems] = useState([]);
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchHistory();
  }, [filterSource, filterDate, filterStatus]);

  useEffect(() => {
    fetch('http://localhost:8000/api/settings/voices')
      .then(res => res.json())
      .then(data => {
        if(data.voices) setVoices(data.voices);
      })
      .catch(err => console.error(err));
  }, []);

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
                // Nếu video chuyển sang completed, ta cần fetch lại toàn bộ để lấy các đường dẫn file mới sinh ra
                if (statusUpdate.status === 'completed' || statusUpdate.status === 'failed') {
                  needsFullRefresh = true;
                }
              }
            }
          });
          
          return updated ? newData : prevData;
        });

        if (needsFullRefresh) {
          fetchHistory(); // Lấy lại toàn bộ dữ liệu để cập nhật file paths
        }
      } catch (err) {
        console.error("Lỗi khi smart polling:", err);
      }
    }, 3000);

    return () => clearInterval(intervalId);
  }, [historyData]);

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

  const handleEdit = (id) => {
    navigate(`/edit/${id}`);
  };

  const handleResumeProcessing = (item) => {
    if (!item.raw_video_path) return toast.error("Không tìm thấy đường dẫn video gốc");
    setProcessingItems([item.raw_video_path]);
    setShowConfigModal(true);
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

  const submitProcessing = async () => {
    try {
      const res = await fetch(`${API_BASE}/processor/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          video_paths: processingItems,
          voice_mode: configVoice,
          bg_volume: configVolume,
          flip_video: configFlipVideo
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
        fetchHistory(); // Cập nhật lại UI để thấy trạng thái paused
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
    // Encode the path to access via backend static files
    // Assuming filePath is like /data/... or data/...
    // Let's strip any leading / and prepend /api/files/
    const safePath = filePath.replace(/^[/]?data[/]/, '');
    setPreviewFile(`http://localhost:8000/api/files/${safePath}`);
    setPreviewType(type);
  };

  const filteredData = historyData.filter(item => 
    item.original_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Workflow Legend */}
      <div className="bg-brand-primary/10 border border-brand-primary/20 rounded-xl p-4 flex items-center justify-center gap-4 text-sm font-medium text-brand-primary overflow-x-auto shadow-sm">
        <span className="shrink-0 text-text-primary">Quy trình (Workflow):</span>
        {workflowSteps.map((s, i) => (
           <React.Fragment key={s.id}>
              <span className="shrink-0">{s.label}</span>
              {i < workflowSteps.length - 1 && <span className="text-text-secondary">➜</span>}
           </React.Fragment>
        ))}
      </div>

      <div className="glass-panel p-4 rounded-xl flex flex-wrap gap-4 items-center justify-between shadow-md">
        <div className="flex gap-4 items-center flex-1">
          <div className="flex items-center gap-2 bg-bg-secondary px-4 py-2 rounded-lg border border-border-subtle focus-within:border-brand-primary transition-colors w-full max-w-sm">
            <Search size={18} className="text-text-secondary" />
            <input 
              type="text" 
              placeholder="Tìm kiếm tên video..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-text-primary w-full"
            />
          </div>
          
          <div className="flex items-center gap-2 bg-bg-secondary px-4 py-2 rounded-lg border border-border-subtle focus-within:border-brand-primary transition-colors">
            <Filter size={18} className="text-text-secondary" />
            <select 
              value={filterSource} 
              onChange={e => setFilterSource(e.target.value)}
              className="bg-transparent border-none outline-none text-text-primary cursor-pointer appearance-none pr-4"
            >
              <option value="" className="bg-bg-secondary">Tất cả nguồn</option>
              <option value="Douyin" className="bg-bg-secondary">Douyin</option>
              <option value="Xiaohongshu" className="bg-bg-secondary">Xiaohongshu</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-bg-secondary px-4 py-2 rounded-lg border border-border-subtle focus-within:border-brand-primary transition-colors">
            <input 
              type="date" 
              value={filterDate}
              onChange={e => setFilterDate(e.target.value)}
              className="bg-transparent border-none outline-none text-text-primary w-full"
            />
          </div>

          <div className="flex items-center gap-2 bg-bg-secondary px-4 py-2 rounded-lg border border-border-subtle focus-within:border-brand-primary transition-colors">
            <select 
              value={filterStatus} 
              onChange={e => setFilterStatus(e.target.value)}
              className="bg-transparent border-none outline-none text-text-primary cursor-pointer appearance-none pr-4"
            >
              <option value="" className="bg-bg-secondary">Tất cả trạng thái</option>
              <option value="pending" className="bg-bg-secondary">Chờ xử lý</option>
              <option value="transcribing" className="bg-bg-secondary">Đang nhận diện</option>
              <option value="translating" className="bg-bg-secondary">Đang dịch</option>
              <option value="generating_tts" className="bg-bg-secondary">Đang lồng tiếng</option>
              <option value="rendering" className="bg-bg-secondary">Đang render</option>
              <option value="paused" className="bg-bg-secondary">Tạm dừng</option>
              <option value="completed" className="bg-bg-secondary">Hoàn tất</option>
            </select>
          </div>

          <button 
            className="flex items-center gap-2 bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white px-4 py-2 rounded-lg transition-colors font-medium ml-auto"
            onClick={handleSyncData}
          >
            <RefreshCw size={18} />
            Đồng bộ từ Data
          </button>
        </div>

        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2">
            <button 
              className="flex items-center gap-2 bg-brand-primary/10 text-brand-primary hover:bg-brand-primary hover:text-white px-4 py-2 rounded-lg transition-colors font-medium"
              onClick={handleBulkProcess}
            >
              <PlayCircle size={18} />
              Xử lý {selectedIds.length} mục
            </button>
            <button 
              className="flex items-center gap-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white px-4 py-2 rounded-lg transition-colors font-medium"
              onClick={handleBulkDelete}
            >
              <Trash2 size={18} />
              Xóa {selectedIds.length} mục
            </button>
          </div>
        )}
      </div>

      <div className="glass-panel rounded-xl overflow-hidden shadow-lg">
        {loading ? (
          <div className="p-12 flex justify-center text-text-secondary items-center gap-3">
             <Loader2 className="animate-spin" size={24} /> Đang tải dữ liệu...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-black/20 text-text-secondary text-sm uppercase tracking-wider">
                  <th className="p-4 border-b border-border-subtle w-12 text-center">
                    <input 
                      type="checkbox" 
                      onChange={handleSelectAll} 
                      checked={selectedIds.length === historyData.length && historyData.length > 0} 
                      className="rounded border-border-subtle bg-bg-secondary cursor-pointer accent-brand-primary"
                    />
                  </th>
                  <th className="p-4 border-b border-border-subtle font-medium w-12 text-center">STT</th>
                  <th className="p-4 border-b border-border-subtle font-medium">Tên Video</th>
                  <th className="p-4 border-b border-border-subtle font-medium">Nguồn</th>
                  <th className="p-4 border-b border-border-subtle font-medium min-w-[200px]">Tiến trình</th>
                  <th className="p-4 border-b border-border-subtle font-medium min-w-[150px]">Ghi chú</th>
                  <th className="p-4 border-b border-border-subtle font-medium">Trạng thái Upload</th>
                  <th className="p-4 border-b border-border-subtle font-medium">Ngày tải</th>
                  <th className="p-4 border-b border-border-subtle font-medium">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {filteredData.map((item, index) => (
                  <tr 
                    key={item.id} 
                    className={`hover:bg-white/5 transition-colors ${selectedIds.includes(item.id) ? 'bg-red-500/5' : ''} ${item.status === 'failed' ? 'bg-red-500/10' : ''}`}
                  >
                    <td className="p-4 text-center">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.includes(item.id)} 
                        onChange={() => handleSelect(item.id)} 
                        className="rounded border-border-subtle bg-bg-secondary cursor-pointer accent-brand-primary"
                      />
                    </td>
                    <td className="p-4 text-center text-text-secondary text-sm">{index + 1}</td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1 text-sm">
                        <span className="font-medium text-text-primary truncate max-w-[200px]" title={item.original_name}>
                          {item.original_name}
                        </span>
                        <div className="flex gap-2 mt-1">
                           <button onClick={() => handlePreview(item.raw_video_path, 'video')} className="text-xs px-2 py-1 bg-brand-primary/10 text-brand-primary rounded hover:bg-brand-primary hover:text-white transition-colors">Video Gốc</button>
                           {item.audio_tts_path && <button onClick={() => handlePreview(item.audio_tts_path, 'audio')} className="text-xs px-2 py-1 bg-purple-500/10 text-purple-500 rounded hover:bg-purple-500 hover:text-white transition-colors">Audio</button>}
                           {item.final_video_path && <button onClick={() => handlePreview(item.final_video_path, 'video')} className="text-xs px-2 py-1 bg-green-500/10 text-green-500 rounded hover:bg-green-500 hover:text-white transition-colors">Video Cuối</button>}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="bg-bg-secondary border border-border-subtle px-2.5 py-1 rounded-md text-xs font-medium text-text-secondary uppercase tracking-wider">
                        {item.source || 'Unknown'}
                      </span>
                    </td>
                    <td className="p-4">
                      {item.status === 'paused' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
                          <Circle size={12} className="fill-yellow-500" />
                          ĐÃ TẠM DỪNG
                        </span>
                      ) : (
                        <div className="flex items-center gap-1">
                          {workflowSteps.map((step, idx) => {
                            const currentIdx = getStepIndex(item.status, item.error_message);
                            let statusColor = "text-text-secondary opacity-40";
                            let Icon = Circle;
                            
                            // Show current and next step (if failed, show the failed step)
                            const isVisible = item.status === 'completed' ? (idx === workflowSteps.length - 1) : (idx === currentIdx || idx === currentIdx + 1);
                            
                            if (!isVisible) return null;

                            if (idx < currentIdx || item.status === 'completed') {
                              statusColor = "text-green-500";
                              Icon = CheckCircle2;
                            } else if (idx === currentIdx) {
                              if (item.status === 'failed') {
                                statusColor = "text-red-500";
                                Icon = Circle; // Could use an X or alert icon here, but keeping Circle filled
                              } else {
                                statusColor = "text-brand-primary";
                                Icon = Loader2;
                              }
                            }
                            
                            return (
                              <React.Fragment key={step.id}>
                                <div className={`flex flex-col items-center gap-1 ${statusColor}`} title={step.label}>
                                  <Icon size={16} className={Icon === Loader2 ? "animate-spin" : (item.status === 'failed' && idx === currentIdx ? "fill-red-500" : "")} />
                                  <span className="text-[10px] whitespace-nowrap font-medium">{step.label}</span>
                                </div>
                                {idx === currentIdx && item.status !== 'completed' && item.status !== 'failed' && (
                                  <div className="h-[2px] w-8 mb-4 rounded-full transition-colors bg-border-subtle overflow-hidden relative" title="Đang chuyển sang bước tiếp theo">
                                    <div className="absolute top-0 left-0 h-full bg-brand-primary w-1/2 animate-pulse" />
                                  </div>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-sm">
                      {item.status === 'failed' ? (
                         <span className="text-red-500 font-medium text-xs bg-red-500/10 px-2 py-1 rounded border border-red-500/20 inline-block line-clamp-2" title={item.error_message || 'Lỗi không xác định'}>
                           {item.error_message || 'Lỗi không xác định'}
                         </span>
                      ) : (
                         <span className="text-text-secondary italic text-xs">Không có</span>
                      )}
                    </td>
                    <td className="p-4 text-sm">
                      {(!item.schedules || item.schedules.length === 0) ? (
                        <span className="text-text-secondary italic">Chưa lên lịch</span>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {item.schedules.map(sch => {
                            const borderColor = 
                              sch.status === 'success' ? 'border-green-500' :
                              sch.status === 'failed' ? 'border-red-500' :
                              'border-yellow-500';
                              
                            return (
                              <a 
                                key={sch.id}
                                href={sch.post_url || '#'}
                                target="_blank"
                                rel="noreferrer"
                                title={`${sch.account?.platform}: ${sch.account?.username} - ${sch.status}`}
                                className={`block p-0.5 rounded-full border-2 ${borderColor} transition-transform hover:scale-110 bg-bg-primary`}
                                onClick={(e) => { if(!sch.post_url) e.preventDefault(); }}
                              >
                                {sch.account?.avatar_url ? (
                                  <img 
                                    src={sch.account.avatar_url} 
                                    alt="avt" 
                                    referrerPolicy="no-referrer"
                                    className="w-6 h-6 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="w-6 h-6 rounded-full bg-brand-primary/20 flex items-center justify-center text-[10px] font-bold text-brand-primary uppercase">
                                    {sch.account?.platform?.charAt(0) || '?'}
                                  </div>
                                )}
                              </a>
                            );
                          })}
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-text-secondary text-sm">
                      {new Date(item.created_at).toLocaleString('vi-VN')}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {(item.status === 'paused' || item.status === 'failed' || item.status === 'pending') && (
                          <button 
                            className="p-2 rounded-lg text-text-secondary hover:text-green-500 hover:bg-green-500/10 transition-colors group relative" 
                            onClick={() => handleResumeProcessing(item)}
                          >
                            <PlayCircle size={18} />
                            <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-bg-secondary border border-border-subtle text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                              Chạy tiếp tiến trình
                            </span>
                          </button>
                        )}
                        {(item.status === 'transcribing' || item.status === 'translating' || item.status === 'generating_tts' || item.status === 'rendering') && (
                          <button 
                            className="p-2 rounded-lg text-text-secondary hover:text-yellow-500 hover:bg-yellow-500/10 transition-colors group relative" 
                            onClick={() => handlePauseProcessing(item)}
                          >
                            <PauseCircle size={18} />
                            <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-bg-secondary border border-border-subtle text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                              Tạm dừng (Pause)
                            </span>
                          </button>
                        )}
                        <button 
                          className="p-2 rounded-lg text-text-secondary hover:text-brand-primary hover:bg-brand-primary/10 transition-colors group relative" 
                          onClick={() => handleEdit(item.id)}
                        >
                          <Edit size={18} />
                          <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-bg-secondary border border-border-subtle text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                            Chỉnh sửa / Edit
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredData.length === 0 && (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-text-secondary">
                      Không tìm thấy dữ liệu nào phù hợp
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-in fade-in">
          <div className="bg-bg-primary border border-border-subtle p-4 rounded-2xl w-full max-w-3xl flex flex-col gap-4 relative shadow-2xl">
            <button 
              className="absolute top-4 right-4 text-text-secondary hover:text-white"
              onClick={() => setPreviewFile(null)}
            >
              ✕
            </button>
            <h3 className="text-xl font-bold">Preview</h3>
            <div className="w-full bg-black rounded-lg overflow-hidden flex items-center justify-center min-h-[300px]">
              {previewType === 'video' ? (
                <video src={previewFile} controls autoPlay className="w-full max-h-[60vh] object-contain" />
              ) : (
                <audio src={previewFile} controls autoPlay className="w-full max-w-md" />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Config Modal for Processing */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-in fade-in">
          <div className="bg-bg-primary border border-border-subtle p-6 rounded-2xl w-full max-w-lg flex flex-col gap-6 shadow-2xl">
            <h3 className="text-xl font-bold border-b border-border-subtle pb-4">
              Cấu hình Xử lý Video ({processingItems.length} video)
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Giọng Lồng Tiếng AI</label>
                <select 
                  className="w-full bg-bg-secondary border border-border-subtle rounded-xl py-3 px-4 text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition-all duration-200 appearance-none" 
                  value={configVoice} 
                  onChange={e => setConfigVoice(e.target.value)}
                >
                  {voices.map(v => (
                    <option key={v.id} value={v.id}>{v.name} [{v.provider}]</option>
                  ))}
                  {voices.length === 0 && <option value="edge_auto">Đang tải danh sách giọng...</option>}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Âm lượng Video Gốc ({configVolume}%)</label>
                <input 
                  type="range" 
                  min="0" max="100" 
                  value={configVolume} 
                  onChange={e => setConfigVolume(Number(e.target.value))} 
                  className="w-full h-2 bg-border-subtle rounded-lg appearance-none cursor-pointer accent-brand-primary mt-3" 
                />
              </div>
              
              <div className="flex items-center gap-3 mt-4 p-3 bg-bg-secondary rounded-xl border border-border-subtle">
                <input 
                  type="checkbox" 
                  id="flipVideo"
                  checked={configFlipVideo}
                  onChange={(e) => setConfigFlipVideo(e.target.checked)}
                  className="w-5 h-5 accent-brand-primary rounded bg-bg-primary border-border-subtle cursor-pointer"
                />
                <label htmlFor="flipVideo" className="text-sm font-medium text-text-primary cursor-pointer select-none">
                  Lật ngang Video (Lách bản quyền hình ảnh)
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border-subtle">
              <button 
                className="px-4 py-2 bg-bg-secondary text-text-secondary hover:text-white rounded-lg transition-colors"
                onClick={() => setShowConfigModal(false)}
              >
                Hủy
              </button>
              <button 
                className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-hover transition-colors font-medium flex items-center gap-2"
                onClick={submitProcessing}
              >
                <PlayCircle size={18} /> Xác nhận & Xử lý
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default History;
