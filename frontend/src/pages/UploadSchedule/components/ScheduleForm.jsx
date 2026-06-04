import React from 'react';
import { Send, Video, Users, Sparkles, RefreshCw, Cpu, MonitorPlay, Smartphone, Folder, ChevronLeft, CheckSquare, Image as ImageIcon, AlertTriangle, CalendarClock } from 'lucide-react';
import { truncateFilename } from '../hooks/useScheduleData';

export const ScheduleForm = ({ hook }) => {
  const {
    videos, accounts, selectedVideos, setSelectedAuthor, selectedAuthor,
    selectedAccounts, caption, setCaption, hashtags, setHashtags,
    scheduleMode, setScheduleMode, scheduledTime, setScheduledTime, engineType, setEngineType,
    isGenerating, isSubmitting, groupedVideos, postedMap,
    handleAccountToggle, handleVideoToggle, toggleAllAuthorVideos, generateAIContent, onSubmit
  } = hook;

  return (
    <div className="lg:col-span-1 bg-bg-secondary border border-border-subtle rounded-2xl p-6">
      <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
        <Send size={24} className="text-brand-primary" />
        Tạo Lịch Đăng Mới
      </h2>
      
      <form onSubmit={onSubmit} className="space-y-5">
        {/* Chọn Video */}
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
                            muted loop playsInline preload="metadata"
                            onLoadedMetadata={(e) => { e.target.currentTime = 2; }}
                            onMouseEnter={(e) => { e.target.play().catch(()=>{}); }}
                            onMouseLeave={(e) => { e.target.pause(); e.target.currentTime = 2; }}
                          />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-text-primary font-medium truncate cursor-help" title={v.original_name}>{truncateFilename(v.original_name)}</p>
                            {(() => {
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

                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors mr-1 ${isSelected ? 'bg-brand-primary border-brand-primary' : 'bg-black/20 border-border-subtle'}`}>
                          {isSelected && <div className="w-2 h-2 bg-brand-primary rounded-full" />}
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
  );
};
