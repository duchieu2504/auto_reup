import React from 'react';
import { Send, Video, Users, Sparkles, RefreshCw, Cpu, MonitorPlay, Smartphone, Folder, ChevronLeft, CheckSquare, Image as ImageIcon, AlertTriangle, CalendarClock, Languages } from 'lucide-react';
import { truncateFilename } from '../hooks/useScheduleData';

export const ScheduleForm = ({ hook }) => {
  const {
    videos, accounts, selectedVideos, setSelectedAuthor, selectedAuthor,
    selectedAccounts, caption, setCaption, hashtags, setHashtags,
    scheduleMode, setScheduleMode, scheduledTime, setScheduledTime, engineType, setEngineType,
    isGenerating, isTranslating, isSubmitting, groupedVideos, postedMap,
    handleAccountToggle, handleVideoToggle, toggleAllAuthorVideos, generateAIContent, translateOriginalCaption, onSubmit
  } = hook;

  return (
    <div className="bg-bg-secondary border border-border-subtle rounded-2xl p-6">
      <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
        <Send size={24} className="text-brand-primary" />
        Tạo Lịch Đăng Mới
      </h2>
      
      <form onSubmit={onSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cột 1: Chọn Video */}
        <div className="space-y-5">
          {/* Chọn Video */}
          <div className="flex flex-col h-full">
          <div className="flex justify-between items-end mb-2">
            <label className="block text-sm font-medium text-text-secondary flex items-center gap-2">
              <Video size={16} /> Chọn Video
            </label>
            <span className="text-xs text-brand-primary font-medium bg-brand-primary/10 px-2 py-0.5 rounded">
              Đã chọn: {selectedVideos.length}
            </span>
          </div>
          
          <div className="bg-bg-primary border border-border-subtle rounded-xl p-4 h-[500px] overflow-y-auto">
              <div className="flex flex-col gap-3">
                {Object.entries(groupedVideos).length === 0 && (
                  <div className="text-center py-10 text-text-tertiary">
                    <ImageIcon size={32} className="mx-auto mb-2 opacity-20" />
                    <p className="text-sm">Chưa có video nào khả dụng (Đã tải về/Đã render).</p>
                  </div>
                )}
                {Object.entries(groupedVideos).map(([author, authorVideos]) => {
                  const isOpen = selectedAuthor === author;
                  // Tính số video đã chọn trong thư mục này
                  const selectedCountInAuthor = authorVideos.filter(v => selectedVideos.includes(v.id)).length;
                  const isAllSelected = selectedCountInAuthor > 0 && selectedCountInAuthor === authorVideos.length;

                  return (
                    <div key={author} className={`border rounded-xl overflow-hidden transition-all ${isOpen ? 'border-brand-primary/50 shadow-[0_0_15px_rgba(var(--color-brand-primary),0.05)] bg-bg-secondary' : 'border-border-subtle bg-bg-primary hover:border-brand-primary/30'}`}>
                      {/* Accordion Header */}
                      <div 
                        onClick={() => setSelectedAuthor(isOpen ? null : author)}
                        className="flex items-center justify-between p-3 cursor-pointer hover:bg-glass-hover transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Folder size={20} className={`${isOpen ? 'text-brand-primary' : 'text-brand-secondary'} shrink-0 transition-colors`} />
                          <div className={`font-bold text-sm truncate transition-colors ${isOpen ? 'text-brand-primary' : 'text-text-primary'}`} title={author}>{author}</div>
                          <div className="text-[10px] text-text-secondary px-2 py-0.5 bg-black/20 rounded-md border border-white/5 shrink-0">
                            {authorVideos.length} vid
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {selectedCountInAuthor > 0 && (
                            <div className="text-[10px] font-bold text-white bg-brand-primary px-2 py-0.5 rounded-md shadow-sm">
                              Đã chọn {selectedCountInAuthor}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Accordion Content */}
                      {isOpen && (
                        <div className="p-3 border-t border-border-subtle/50 bg-bg-primary/50">
                          <div className="flex items-center justify-between mb-3 pb-2 border-b border-border-subtle/30">
                            <span className="text-xs text-text-secondary">Click vào video để chọn</span>
                            <button 
                              type="button"
                              onClick={(e) => { e.stopPropagation(); toggleAllAuthorVideos(authorVideos); }}
                              className="flex items-center gap-1 text-xs text-brand-primary hover:text-brand-secondary transition-colors bg-brand-primary/10 hover:bg-brand-primary/20 px-2 py-1 rounded-md font-medium"
                            >
                              <CheckSquare size={14} /> {isAllSelected ? "Bỏ chọn tất cả" : "Chọn tất cả"}
                            </button>
                          </div>
                          
                          {/* Grid Thumbnails */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {authorVideos.map(v => {
                              const isSelected = selectedVideos.includes(v.id);
                              const hasDuplicate = selectedAccounts.some(accId => postedMap[String(v.id)]?.has(String(accId)));
                              
                              return (
                                <div 
                                  key={v.id}
                                  onClick={(e) => { e.stopPropagation(); handleVideoToggle(v.id); }}
                                  className={`relative group/vid cursor-pointer rounded-lg overflow-hidden border-2 transition-all aspect-[9/16] bg-black/50 ${isSelected ? 'border-brand-primary shadow-[0_0_10px_rgba(var(--color-brand-primary),0.3)]' : 'border-transparent hover:border-brand-primary/50'}`}
                                >
                                  {/* Video preview element */}
                                  <video 
                                    src={`http://localhost:8000/api/files/${(v.final_video_path || v.raw_video_path || '').replace(/\\/g, '/').replace(/^.*?(?:^|\/)data\//, '').split('/').map(encodeURIComponent).join('/')}#t=2.0`}
                                    className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover/vid:opacity-100 transition-opacity"
                                    muted loop playsInline preload="metadata"
                                    onLoadedMetadata={(e) => { e.target.currentTime = 2; }}
                                    onMouseEnter={(e) => { e.target.play().catch(()=>{}); }}
                                    onMouseLeave={(e) => { e.target.pause(); e.target.currentTime = 2; }}
                                  />
                                  
                                  {/* Overlay content */}
                                  <div className="absolute inset-0 flex flex-col justify-between p-1.5 pointer-events-none">
                                    {/* Top Badges */}
                                    <div className="flex justify-between items-start gap-1">
                                      <span className={`text-[9px] px-1 py-0.5 rounded shadow-sm backdrop-blur-md font-medium ${v.final_video_path || v.status === 'completed' || v.status === 'processed' ? 'bg-green-500/80 text-white' : 'bg-yellow-500/80 text-white'}`}>
                                        {v.final_video_path || v.status === 'completed' || v.status === 'processed' ? 'Rendered' : 'Raw'}
                                      </span>
                                      
                                      {hasDuplicate && (
                                        <div className="text-yellow-400 bg-black/60 backdrop-blur-md p-1 rounded shadow-sm" title="Đã đăng lên tài khoản đang chọn">
                                          <AlertTriangle size={12} />
                                        </div>
                                      )}
                                    </div>
                                    
                                    {/* Bottom Info */}
                                    <div className="bg-black/70 backdrop-blur-md p-1.5 rounded-md">
                                      <p className="text-[10px] text-white font-medium truncate" title={v.original_name}>
                                        {truncateFilename(v.original_name)}
                                      </p>
                                    </div>
                                  </div>
                                  
                                  {/* Selection Indicator */}
                                  <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-brand-primary border-white opacity-100 scale-100' : 'bg-black/50 border-white/50 opacity-0 scale-90 group-hover/vid:opacity-100 group-hover/vid:scale-100'}`}>
                                    {isSelected && <CheckSquare size={16} className="text-white" />}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
          </div>
        </div>
        </div>

        {/* Cột 2: Chọn Tài khoản */}
        <div className="space-y-5">
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
          <div className="bg-bg-primary border border-border-subtle rounded-xl p-4 h-[500px] overflow-y-auto">
            {(() => {
              const filteredAccounts = accounts.filter(acc => {
                const type = acc.connection_type || 'web_playwright';
                if (engineType === 'playwright') return type === 'web_playwright' || type === 'gpm_login';
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
                <div className="flex flex-col gap-5">
                  {['tiktok', 'youtube', 'facebook', 'instagram'].map(platform => {
                    const platformAccounts = filteredAccounts.filter(a => (a.platform || '').toLowerCase() === platform);
                    if (platformAccounts.length === 0) return null;
                    
                    return (
                      <div key={platform}>
                        <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 flex items-center gap-1.5 border-b border-border-subtle/50 pb-1">
                          {platform === 'tiktok' && <div className="w-2 h-2 rounded-full bg-black"></div>}
                          {platform === 'youtube' && <div className="w-2 h-2 rounded-full bg-red-500"></div>}
                          {platform === 'facebook' && <div className="w-2 h-2 rounded-full bg-blue-500"></div>}
                          {platform === 'instagram' && <div className="w-2 h-2 rounded-full bg-pink-500"></div>}
                          {platform} <span className="text-[10px] bg-bg-secondary px-1.5 py-0.5 rounded-md border border-border-subtle">{platformAccounts.length}</span>
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                          {platformAccounts.map(acc => {
                            const isSelected = selectedAccounts.includes(acc.id);
                            const hasDuplicate = selectedVideos.some(vidId => postedMap[String(vidId)]?.has(String(acc.id)));
                            return (
                              <label 
                                key={acc.id} 
                                className={`relative flex flex-col p-3 rounded-xl cursor-pointer transition-all border ${isSelected ? 'bg-brand-primary/10 border-brand-primary shadow-[0_0_15px_rgba(var(--color-brand-primary),0.15)]' : 'bg-bg-secondary border-border-subtle hover:border-brand-primary/50'} ${hasDuplicate && !isSelected ? 'opacity-60' : ''}`}
                                title={hasDuplicate ? "Video đã chọn từng được đăng trên tài khoản này!" : ""}
                              >
                                <input 
                                  type="checkbox" 
                                  className="hidden"
                                  checked={isSelected}
                                  onChange={() => handleAccountToggle(acc.id)}
                                />
                                
                                <div className="flex justify-between items-start mb-2">
                                  {acc.avatar_url ? (
                                    <img src={acc.avatar_url} alt="avt" referrerPolicy="no-referrer" className="w-10 h-10 rounded-full object-cover border-2 border-bg-primary shadow-sm" />
                                  ) : (
                                    <div className="w-10 h-10 rounded-full bg-brand-primary/20 flex items-center justify-center text-sm font-bold text-brand-primary uppercase border-2 border-bg-primary shadow-sm">
                                      {acc.username ? acc.username.charAt(0) : '?'}
                                    </div>
                                  )}
                                  
                                  {/* Selection Checkbox */}
                                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${isSelected ? 'bg-brand-primary border-brand-primary scale-110' : 'border-border-subtle bg-bg-primary'}`}>
                                    {isSelected && <CheckSquare size={12} className="text-white" />}
                                  </div>
                                </div>
                                
                                <div className="mt-1 flex-1 flex flex-col justify-end">
                                  <div className="font-bold text-sm text-text-primary truncate mb-0.5" title={acc.username || "No name"}>
                                    {acc.username || "No name"}
                                  </div>
                                  
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    {acc.connection_type === 'gpm_login' ? (
                                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-400 font-medium border border-green-500/20">GPM Login</span>
                                    ) : acc.connection_type === 'adb_device' ? (
                                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 font-medium border border-purple-500/20">ADB Device</span>
                                    ) : (
                                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-medium border border-blue-500/20">Web Native</span>
                                    )}
                                  </div>
                                </div>
                                
                                {hasDuplicate && (
                                  <div className="absolute top-2 right-8 text-yellow-500 bg-yellow-500/10 p-1 rounded-md border border-yellow-500/20 backdrop-blur-md shadow-sm" title="Cảnh báo: Video đã đăng">
                                    <AlertTriangle size={12} />
                                  </div>
                                )}
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Other platforms catch-all */}
                  {(() => {
                    const knownPlatforms = ['tiktok', 'youtube', 'facebook', 'instagram'];
                    const otherAccounts = filteredAccounts.filter(a => !knownPlatforms.includes((a.platform || '').toLowerCase()));
                    if (otherAccounts.length === 0) return null;
                    
                    return (
                      <div key="other">
                        <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 flex items-center gap-1.5 border-b border-border-subtle/50 pb-1">
                          <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                          Khác <span className="text-[10px] bg-bg-secondary px-1.5 py-0.5 rounded-md border border-border-subtle">{otherAccounts.length}</span>
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                          {otherAccounts.map(acc => {
                            const isSelected = selectedAccounts.includes(acc.id);
                            const hasDuplicate = selectedVideos.some(vidId => postedMap[String(vidId)]?.has(String(acc.id)));
                            return (
                              <label 
                                key={acc.id} 
                                className={`relative flex flex-col p-3 rounded-xl cursor-pointer transition-all border ${isSelected ? 'bg-brand-primary/10 border-brand-primary shadow-[0_0_15px_rgba(var(--color-brand-primary),0.15)]' : 'bg-bg-secondary border-border-subtle hover:border-brand-primary/50'} ${hasDuplicate && !isSelected ? 'opacity-60' : ''}`}
                                title={hasDuplicate ? "Video đã chọn từng được đăng trên tài khoản này!" : ""}
                              >
                                <input 
                                  type="checkbox" 
                                  className="hidden"
                                  checked={isSelected}
                                  onChange={() => handleAccountToggle(acc.id)}
                                />
                                
                                <div className="flex justify-between items-start mb-2">
                                  {acc.avatar_url ? (
                                    <img src={acc.avatar_url} alt="avt" referrerPolicy="no-referrer" className="w-10 h-10 rounded-full object-cover border-2 border-bg-primary shadow-sm" />
                                  ) : (
                                    <div className="w-10 h-10 rounded-full bg-brand-primary/20 flex items-center justify-center text-sm font-bold text-brand-primary uppercase border-2 border-bg-primary shadow-sm">
                                      {acc.username ? acc.username.charAt(0) : '?'}
                                    </div>
                                  )}
                                  
                                  {/* Selection Checkbox */}
                                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${isSelected ? 'bg-brand-primary border-brand-primary scale-110' : 'border-border-subtle bg-bg-primary'}`}>
                                    {isSelected && <CheckSquare size={12} className="text-white" />}
                                  </div>
                                </div>
                                
                                <div className="mt-1 flex-1 flex flex-col justify-end">
                                  <div className="font-bold text-sm text-text-primary truncate mb-0.5" title={acc.username || "No name"}>
                                    {acc.username || "No name"}
                                  </div>
                                  
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-gray-500/20 text-gray-400 font-medium border border-gray-500/20 uppercase">{acc.platform || 'Unknown'}</span>
                                  </div>
                                </div>
                                
                                {hasDuplicate && (
                                  <div className="absolute top-2 right-8 text-yellow-500 bg-yellow-500/10 p-1 rounded-md border border-yellow-500/20 backdrop-blur-md shadow-sm" title="Cảnh báo: Video đã đăng">
                                    <AlertTriangle size={12} />
                                  </div>
                                )}
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              );
            })()}
          </div>
        </div>
        </div>

        {/* Cột 3: Cài đặt nâng cao */}
        <div className="space-y-5">
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
            <div className="flex gap-2">
              <button 
                type="button" 
                onClick={translateOriginalCaption}
                disabled={isTranslating || isGenerating}
                className="flex items-center gap-1 text-xs text-brand-secondary hover:text-brand-primary transition-colors font-medium bg-brand-secondary/10 px-2 py-1 rounded-md disabled:opacity-50"
              >
                <Languages size={14} className={isTranslating ? "animate-spin" : ""} /> 
                {isTranslating ? "Đang dịch..." : "Dịch caption gốc"}
              </button>
              <button 
                type="button" 
                onClick={generateAIContent}
                disabled={isGenerating || isTranslating}
                className="flex items-center gap-1 text-xs text-brand-primary hover:text-brand-secondary transition-colors font-medium bg-brand-primary/10 px-2 py-1 rounded-md disabled:opacity-50"
              >
                <Sparkles size={14} /> {isGenerating ? "Đang viết..." : "Tự viết bằng AI"}
              </button>
            </div>
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
        </div>
      </form>
    </div>
  );
};
