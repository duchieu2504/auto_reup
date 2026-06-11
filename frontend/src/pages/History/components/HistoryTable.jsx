import React, { useState, useEffect } from 'react';
import { Search, Trash2, Edit, PlayCircle, PauseCircle, Filter, CheckCircle2, Circle, Loader2, RefreshCw } from 'lucide-react';
import { Pagination } from '../../../components/Pagination';
import { workflowSteps, getStepIndex } from '../hooks/useHistoryData';

const truncateFilename = (filename) => {
  if (!filename) return "Unknown";
  const name = filename.split('/').pop().split('\\').pop();
  if (name.length <= 15) return name;
  const ext = name.split('.').pop();
  const base = name.substring(0, name.lastIndexOf('.'));
  if (base.length <= 10) return name;
  return `${base.substring(0, 2)}..${base.substring(base.length - 5)}.${ext}`;
};

export const HistoryTable = ({ hook }) => {
  const {
    historyData, loading, selectedIds, searchQuery, filterSource, filterDate, filterStatus,
    setSearchQuery, setFilterSource, setFilterDate, setFilterStatus,
    handleSyncData, handleBulkDelete, handleSelectAll, handleSelect,
    handleResumeProcessing, handleBulkProcess, handlePauseProcessing, handlePreview,
    setProcessingItems, setShowConfigModal
  } = hook;

  const filteredData = historyData.filter(item => 
    item.original_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterSource, filterDate, filterStatus, historyData.length]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const currentData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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
          <>
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
                  <th className="p-4 border-b border-border-subtle font-medium min-w-[150px]">Nguồn</th>
                  <th className="p-4 border-b border-border-subtle font-medium min-w-[200px]">Tiến trình</th>
                  <th className="p-4 border-b border-border-subtle font-medium min-w-[150px]">Ghi chú</th>
                  <th className="p-4 border-b border-border-subtle font-medium">Trạng thái Upload</th>
                  <th className="p-4 border-b border-border-subtle font-medium">Ngày tải</th>
                  <th className="p-4 border-b border-border-subtle font-medium">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {currentData.map((item, index) => (
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
                    <td className="p-4 text-center text-text-secondary text-sm">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-16 shrink-0 rounded-lg overflow-hidden bg-black/50 border border-white/5 relative group/vid">
                          <video 
                            src={`http://localhost:8000/api/files/${(item.final_video_path || item.raw_video_path || '').replace(/^[/]?data[/]/, '')}#t=2.0`}
                            className="w-full h-full object-cover opacity-90 group-hover/vid:opacity-100 transition-opacity"
                            muted loop playsInline preload="none"
                            onMouseEnter={(e) => { e.target.play().catch(()=>{}); }}
                            onMouseLeave={(e) => { e.target.pause(); e.target.currentTime = 0; }}
                          />
                        </div>
                        <div className="flex flex-col gap-1 text-sm">
                          <span className="font-medium text-text-primary truncate max-w-[200px] cursor-help font-mono bg-white/5 px-2 py-1 rounded text-xs" title={item.original_name}>
                            {truncateFilename(item.original_name)}
                          </span>
                          <div className="flex gap-2 mt-1">
                             <button onClick={() => handlePreview(item.raw_video_path, 'video')} className="text-xs px-2 py-1 bg-brand-primary/10 text-brand-primary rounded hover:bg-brand-primary hover:text-white transition-colors">Video Gốc</button>
                             {item.audio_tts_path && <button onClick={() => handlePreview(item.audio_tts_path, 'audio')} className="text-xs px-2 py-1 bg-purple-500/10 text-purple-500 rounded hover:bg-purple-500 hover:text-white transition-colors">Audio</button>}
                             {item.final_video_path && <button onClick={() => handlePreview(item.final_video_path, 'video')} className="text-xs px-2 py-1 bg-green-500/10 text-green-500 rounded hover:bg-green-500 hover:text-white transition-colors">Video Cuối</button>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="bg-bg-secondary border border-border-subtle px-2 py-0.5 rounded-md text-[10px] font-medium text-text-secondary uppercase tracking-wider">
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
                            let currentIdx = getStepIndex(item.status, item.error_message);
                            let statusColor = "text-text-secondary opacity-40";
                            let Icon = Circle;
                            
                            if ((item.status === 'pending' || item.status === 'paused') && idx === 0) {
                              statusColor = "text-green-500";
                              Icon = CheckCircle2;
                            } else if (idx < currentIdx || item.status === 'completed') {
                              statusColor = "text-green-500";
                              Icon = CheckCircle2;
                            } else if (idx === currentIdx) {
                              if (item.status === 'failed') {
                                statusColor = "text-red-500";
                                Icon = Circle;
                              } else if (item.status === 'pending' || item.status === 'paused') {
                                statusColor = "text-yellow-500";
                                Icon = PauseCircle;
                              } else {
                                statusColor = "text-brand-primary";
                                Icon = Loader2;
                              }
                            }
                            
                            const isVisible = item.status === 'completed' ? (idx === workflowSteps.length - 1) : (idx === currentIdx || idx === currentIdx + 1);
                            
                            if (!isVisible) return null;

                            return (
                              <React.Fragment key={step.id}>
                                <div className={`flex flex-col items-center gap-1 ${statusColor}`} title={step.label}>
                                  <Icon size={16} className={Icon === Loader2 ? "animate-spin" : (item.status === 'failed' && idx === currentIdx ? "fill-red-500" : "")} />
                                  <span className="text-[10px] whitespace-nowrap font-medium">{step.label}</span>
                                </div>
                                {idx === currentIdx && item.status !== 'completed' && item.status !== 'failed' && (
                                  <div className="h-[2px] w-8 mb-4 rounded-full transition-colors bg-border-subtle overflow-hidden relative" title="Đang chờ/xử lý">
                                    {(item.status === 'pending' || item.status === 'paused') ? (
                                      <div className="absolute top-0 left-0 h-full bg-yellow-500 w-1/2" />
                                    ) : (
                                      <div className="absolute top-0 left-0 h-full bg-brand-primary w-1/2 animate-pulse" />
                                    )}
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
                      {(() => {
                        let historyEntries = [];
                        try {
                          if (item.upload_history && item.upload_history !== "[]") {
                            historyEntries = JSON.parse(item.upload_history);
                          }
                        } catch(e) {}
                        
                        if ((!item.schedules || item.schedules.length === 0) && historyEntries.length === 0) {
                          return <span className="text-text-secondary italic">Chưa lên lịch</span>;
                        }
                        
                        return (
                          <div className="flex flex-wrap gap-2">
                            {item.schedules?.map(sch => {
                              const borderColor = sch.status === 'success' ? 'border-green-500' : sch.status === 'failed' ? 'border-red-500' : 'border-yellow-500';
                              return (
                                <a 
                                  key={sch.id} href={sch.post_url || '#'} target="_blank" rel="noreferrer"
                                  title={`${sch.account?.platform}: ${sch.account?.username} - ${sch.status}`}
                                  className={`block p-0.5 rounded-full border-2 ${borderColor} transition-transform hover:scale-110 bg-bg-primary`}
                                  onClick={(e) => { if(!sch.post_url) e.preventDefault(); }}
                                >
                                  {sch.account?.avatar_url ? (
                                    <img src={sch.account.avatar_url} alt="avt" referrerPolicy="no-referrer" className="w-6 h-6 rounded-full object-cover" />
                                  ) : (
                                    <div className="w-6 h-6 rounded-full bg-brand-primary/20 flex items-center justify-center text-[10px] font-bold text-brand-primary uppercase">
                                      {sch.account?.platform?.charAt(0) || '?'}
                                    </div>
                                  )}
                                </a>
                              );
                            })}
                            {historyEntries.map((hist, i) => {
                              const borderColor = hist.status === 'COMPLETED' ? 'border-green-500' : hist.status === 'FAILED' ? 'border-red-500' : 'border-blue-500';
                              return (
                                <a 
                                  key={`hist-${i}`} href={hist.video_url || '#'} target="_blank" rel="noreferrer"
                                  title={`ADB [${hist.platform}]: ${hist.account_name} - ${hist.status}`}
                                  className={`block p-0.5 rounded-full border-2 ${borderColor} transition-transform hover:scale-110 bg-bg-primary`}
                                  onClick={(e) => { if(!hist.video_url) e.preventDefault(); }}
                                >
                                  <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-[10px] font-bold text-blue-500 uppercase" title="ADB Sync">
                                    {hist.platform?.charAt(0) || 'A'}
                                  </div>
                                </a>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </td>
                    <td className="p-4 text-text-secondary text-sm">
                      {new Date(item.created_at).toLocaleString('vi-VN')}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {(item.status === 'paused' || item.status === 'failed') && (
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
                        {item.status === 'pending' && (
                          <button 
                            className="p-2 rounded-lg text-text-secondary hover:text-brand-primary hover:bg-brand-primary/10 transition-colors group relative" 
                            onClick={() => {
                              setProcessingItems([item.raw_video_path]);
                              setShowConfigModal(true);
                            }}
                          >
                            <PlayCircle size={18} />
                            <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-bg-secondary border border-border-subtle text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                              Cấu hình & Xử lý
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
                        {(item.status === 'completed' || item.status === 'uploaded') && (
                          <a 
                            className="p-2 rounded-lg text-text-secondary hover:text-brand-primary hover:bg-brand-primary/10 transition-colors group relative inline-flex" 
                            href={`/edit/${item.id}`}
                          >
                            <Edit size={18} />
                            <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-bg-secondary border border-border-subtle text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                              Chỉnh sửa / Edit
                            </span>
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredData.length === 0 && (
                  <tr>
                    <td colSpan="9" className="p-8 text-center text-text-secondary">
                      Không tìm thấy dữ liệu nào phù hợp
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={setItemsPerPage}
          />
        </>
        )}
      </div>
    </div>
  );
};
