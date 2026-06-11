import React, { useState } from 'react';
import { CalendarClock, RefreshCw, XCircle, CheckCircle, Clock, Pause, Play, StopCircle } from 'lucide-react';
import { truncateFilename } from '../hooks/useScheduleData';

const getStatusBadge = (status) => {
  switch(status) {
    case 'pending': return <span className="flex items-center gap-1 text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded-md text-xs font-medium"><Clock size={12}/> Đang chờ</span>;
    case 'uploading': return <span className="flex items-center gap-1 text-blue-400 bg-blue-400/10 px-2 py-1 rounded-md text-xs font-medium"><RefreshCw size={12} className="animate-spin"/> Đang Up</span>;
    case 'success': return <span className="flex items-center gap-1 text-green-400 bg-green-400/10 px-2 py-1 rounded-md text-xs font-medium"><CheckCircle size={12}/> Thành công</span>;
    case 'failed': return <span className="flex items-center gap-1 text-red-400 bg-red-400/10 px-2 py-1 rounded-md text-xs font-medium"><XCircle size={12}/> Thất bại</span>;
    default: return <span className="text-gray-400">{status}</span>;
  }
};

export const ScheduleList = ({ hook }) => {
  const { schedules, videos, accounts, fetchData, deleteSchedule, handleRetry, handlePause, handleResume, handleStop } = hook;
  const [pausedTasks, setPausedTasks] = useState(new Set());

  return (
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
                            muted loop playsInline preload="metadata"
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
                    {sch.status === 'uploading' && (
                      <>
                        {/* Nút Pause / Play */}
                        {pausedTasks.has(sch.id) ? (
                          <button
                            onClick={() => {
                              handleResume(sch.id);
                              setPausedTasks(prev => { const n = new Set(prev); n.delete(sch.id); return n; });
                            }}
                            className="text-green-400 hover:text-green-300 transition-colors p-1.5 bg-green-400/10 hover:bg-green-400/20 rounded-lg"
                            title="Tiếp tục upload"
                          >
                            <Play size={16} />
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              handlePause(sch.id);
                              setPausedTasks(prev => new Set(prev).add(sch.id));
                            }}
                            className="text-yellow-400 hover:text-yellow-300 transition-colors p-1.5 bg-yellow-400/10 hover:bg-yellow-400/20 rounded-lg"
                            title="Tạm dừng upload"
                          >
                            <Pause size={16} />
                          </button>
                        )}
                        {/* Nút Stop (X) */}
                        <button
                          onClick={() => handleStop(sch.id)}
                          className="text-red-400 hover:text-red-300 transition-colors p-1.5 bg-red-400/10 hover:bg-red-400/20 rounded-lg"
                          title="Hủy tiến trình upload"
                        >
                          <StopCircle size={16} />
                        </button>
                      </>
                    )}
                    {sch.status === 'failed' && (
                      <button 
                        onClick={() => handleRetry(sch.id)}
                        className="text-text-tertiary hover:text-brand-primary transition-colors flex items-center justify-center p-1 bg-brand-primary/10 rounded"
                        title="Thử lại (Dùng nguyên caption và nền tảng cũ)"
                      >
                        <RefreshCw size={16} />
                      </button>
                    )}
                    {sch.status !== 'uploading' && (
                      <button 
                        onClick={() => deleteSchedule(sch.id)}
                        className="text-text-tertiary hover:text-red-400 transition-colors p-1"
                        title="Xóa lịch"
                      >
                        <XCircle size={18} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
