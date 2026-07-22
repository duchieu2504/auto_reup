import React from 'react';
import { motion } from 'framer-motion';
import { PlayCircle, FolderOpen, RefreshCw, Folder, ChevronLeft, Edit, UploadCloud, Trash2, FileVideo, Volume2 } from 'lucide-react';

export const SourceConfigTab = ({
  sourceType,
  setSourceType,
  crawlerSearch,
  setCrawlerSearch,
  crawlerFilterStatus,
  setCrawlerFilterStatus,
  fetchCrawlerVideos,
  groupedCrawlerVideos,
  selectedAuthor,
  setSelectedAuthor,
  selectedCrawlerPaths,
  setSelectedCrawlerPaths,
  fileInputRef,
  handleVideoUpload,
  uploading,
  uploadedFiles,
  setUploadedFiles,
  isScanning,
  handleScanFolder,
  videoPath,
  setVideoPath,
  voices,
  voiceMode,
  setVoiceMode,
  bgVolume,
  setBgVolume
}) => {
  return (
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
                                src={`http://localhost:8000/api/files/${(video.raw_video_path || '').replace(/\\/g, '/').replace(/^.*?(?:^|\/)data\//, '').split('/').map(encodeURIComponent).join('/')}#t=2.0`}
                                className="w-full h-full object-cover"
                                muted
                                playsInline
                                preload="metadata"
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
  );
};
