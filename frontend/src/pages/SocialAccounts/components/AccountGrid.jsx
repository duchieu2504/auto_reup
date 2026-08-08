import React, { useState } from 'react';
import { Trash2, Edit2, Activity, Globe, Shield, RefreshCw, Smartphone, AlertTriangle, Square, MessageCircle, BarChart2, Video, Eye, Heart, Users } from 'lucide-react';
import { AccountHealthModal } from './AccountHealthModal';

export const AccountGrid = ({ hook, onOpenNurture, selectedIds = [], onSelectOne }) => {
  const [healthModal, setHealthModal] = useState({ isOpen: false, account: null });
  const { 
    accounts, loading, warmingUpIds,
    handleDelete, checkStatus,
    triggerWarmup, stopWarmup,
    setFormData, setIsModalOpen, setEditMode
  } = hook;

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="text-center py-20 bg-surface rounded-2xl border border-white/5">
        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
          <Globe className="text-text-secondary" size={32} />
        </div>
        <h3 className="text-lg font-medium text-text-primary mb-2">Chưa có tài khoản nào</h3>
        <p className="text-text-secondary max-w-md mx-auto">
          Thêm tài khoản TikTok hoặc YouTube của bạn để bắt đầu tự động hóa quá trình đăng video.
        </p>
      </div>
    );
  }

  const openEditModal = (acc) => {
    setFormData({
      platform: acc.platform,
      username: acc.username,
      device_id: acc.device_id || '',
      auth_data: acc.auth_data || '',
      proxy_host: acc.proxy_host || '',
      proxy_port: acc.proxy_port || '',
      proxy_username: acc.proxy_username || '',
      proxy_password: acc.proxy_password || '',
      connection_type: acc.connection_type || 'web_browser',
      user_agent: acc.user_agent || ''
    });
    setEditMode(acc.id);
    setIsModalOpen(true);
  };

  const groupedAccounts = accounts.reduce((acc, account) => {
    const platform = account.platform.toLowerCase();
    if (!acc[platform]) acc[platform] = [];
    acc[platform].push(account);
    return acc;
  }, {});

  return (
    <div className="space-y-10">
      {Object.entries(groupedAccounts).map(([platform, platformAccounts]) => (
        <div key={platform}>
          <div className="flex items-center gap-2 mb-4">
            <div className={`p-2 rounded-xl ${platform === 'tiktok' ? 'bg-pink-500/20 text-pink-500' : 'bg-[#1DA1F2]/20 text-[#1DA1F2]'}`}>
              {platform === 'tiktok' ? <Video size={20} /> : <MessageCircle size={20} />}
            </div>
            <h2 className="text-xl font-bold text-text-primary capitalize">
              Nền tảng {platform} <span className="text-sm font-normal text-text-secondary ml-2">({platformAccounts.length} tài khoản)</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {platformAccounts.map(acc => (
        <div 
          key={acc.id} 
          className={`bg-white/5 backdrop-blur-xl rounded-2xl p-4 border transition-all flex flex-col hover:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] hover:-translate-y-1 ${acc.platform.toLowerCase() === 'tiktok' ? 'hover:border-pink-500/50' : 'hover:border-brand-primary/50'} ${selectedIds.includes(acc.id) ? 'border-brand-primary bg-brand-primary/10' : 'border-white/10'}`}
        >
          <div className="flex items-start gap-4 mb-4">
            <div className="pt-1">
              <input 
                type="checkbox" 
                checked={selectedIds.includes(acc.id)}
                onChange={() => onSelectOne && onSelectOne(acc.id)}
                className="w-5 h-5 rounded border-white/20 bg-black/40 checked:bg-brand-primary checked:border-brand-primary focus:ring-brand-primary focus:ring-offset-gray-900 transition-all cursor-pointer"
              />
            </div>
            
            <div className="flex items-center gap-4 flex-1">
              <div className="relative">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-white/5 border border-white/10 shrink-0">
                  <img 
                    src={acc.avatar_url || `https://ui-avatars.com/api/?name=${acc.username}&background=random`} 
                    alt={acc.username}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = `https://ui-avatars.com/api/?name=${acc.username}&background=random`;
                    }}
                  />
                </div>
                <div 
                  className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-gray-900 ${
                    acc.status === 'active' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]' : 
                    acc.status === 'shadowbanned' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse' : 
                    'bg-gray-500'
                  }`} 
                  title={acc.status === 'active' ? 'Hoạt động' : acc.status === 'shadowbanned' ? 'Bị bóp tương tác' : 'Lỗi/Đang chờ'}
                />
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-text-primary text-lg flex items-center gap-2 truncate">
                  {acc.username}
                  {acc.connection_type === 'adb_device' ? (
                    <span title="Mobile App (ADB)" className="bg-purple-500/20 text-purple-400 p-1 rounded"><Smartphone size={14}/></span>
                  ) : acc.connection_type === 'gpm_login' ? (
                    <span title="GPM Login" className="bg-green-500/20 text-green-400 p-1 rounded"><Shield size={14}/></span>
                  ) : (
                    <span title="Web Browser" className="bg-blue-500/20 text-blue-400 p-1 rounded"><Globe size={14}/></span>
                  )}
                </h3>
                <p className="text-xs text-text-secondary uppercase tracking-wider">{acc.platform}</p>
              </div>
            </div>
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => openEditModal(acc)} className="p-1.5 text-text-secondary hover:text-white bg-black/20 rounded-md">
                <Edit2 size={16} />
              </button>
              <button onClick={() => handleDelete(acc.id)} className="p-1.5 text-text-secondary hover:text-red-500 bg-black/20 rounded-md">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
          
          {acc.platform.toLowerCase() === 'tiktok' && (
            <div className="mb-4">
              <div className="grid grid-cols-4 gap-2 bg-black/20 p-2 rounded-t-xl border border-white/5 border-b-0">
                <div className="flex flex-col items-center justify-center" title="Tổng số Video">
                  <Video size={14} className="text-text-secondary mb-1" />
                  <span className="text-xs font-bold text-text-primary">{acc.videos_count || 0}</span>
                </div>
                <div className="flex flex-col items-center justify-center border-l border-white/5" title="Tổng số View">
                  <Eye size={14} className="text-text-secondary mb-1" />
                  <span className="text-xs font-bold text-text-primary">{acc.total_views || 0}</span>
                </div>
                <div className="flex flex-col items-center justify-center border-l border-white/5" title="Tổng số Like">
                  <Heart size={14} className="text-text-secondary mb-1" />
                  <span className="text-xs font-bold text-text-primary">{acc.total_likes || 0}</span>
                </div>
                <div className="flex flex-col items-center justify-center border-l border-white/5" title="Tổng số Follower">
                  <Users size={14} className="text-text-secondary mb-1" />
                  <span className="text-xs font-bold text-text-primary">{acc.followers_count || 0}</span>
                </div>
              </div>
              <div className="bg-black/40 px-3 py-1.5 rounded-b-xl border border-white/5 flex justify-between items-center text-xs">
                 <span className="text-text-secondary">Tỷ lệ tương tác (ER)</span>
                 <span className={`font-bold ${((acc.total_likes || 0) / (acc.total_views || 1)) * 100 > 5 ? 'text-green-400' : 'text-text-primary'}`}>
                    {((acc.total_likes || 0) / (acc.total_views || 1) * 100).toFixed(1)}%
                 </span>
              </div>
            </div>
          )}

          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-secondary flex items-center gap-1.5"><Shield size={14}/> Proxy IP</span>
              <span className="text-text-primary font-mono bg-black/30 px-2 py-0.5 rounded">
                {acc.proxy_host ? `${acc.proxy_host}:${acc.proxy_port || '*'}` : 'Không dùng'}
              </span>
            </div>
          </div>
          
          <div className="flex gap-2 mt-auto">
            <button 
              onClick={() => checkStatus(acc.id)}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-black/20 hover:bg-black/40 text-text-primary rounded-xl text-sm font-medium transition-colors border border-white/5"
            >
              <RefreshCw size={16} /> Check Live
            </button>

            {acc.platform.toLowerCase() === 'tiktok' && (
              <button 
                onClick={() => setHealthModal({ isOpen: true, account: acc })}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-brand-primary/10 hover:bg-brand-primary/30 text-brand-primary rounded-xl text-sm font-medium transition-colors border border-brand-primary/30"
              >
                <BarChart2 size={16} /> Chi tiết
              </button>
            )}
            
            {(acc.connection_type === 'gpm_login' || acc.connection_type === 'adb_device') && acc.platform.toLowerCase() !== 'twitter' && (
              (warmingUpIds.includes(acc.id) || acc.status === 'warming_up') ? (
                <button 
                  onClick={() => stopWarmup(acc.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors border bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30"
                >
                  <Square size={16} /> 
                  Dừng nuôi {acc.warmup_end_time ? `(${acc.warmup_end_time})` : ''}
                </button>
              ) : (
                <button 
                  onClick={() => triggerWarmup(acc.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors border bg-brand-primary/20 hover:bg-brand-primary/40 text-brand-primary border-brand-primary/30"
                >
                  <Activity size={16} /> 
                  Nuôi (Warm-up)
                </button>
              )
            )}
            
            {acc.platform.toLowerCase() === 'twitter' && (
              <button
                onClick={() => onOpenNurture(acc)}
                className="flex items-center justify-center gap-2 px-3 py-2.5 bg-[#1DA1F2]/20 hover:bg-[#1DA1F2]/30 text-[#1DA1F2] rounded-xl text-sm font-medium transition-colors border border-[#1DA1F2]/30"
              >
                <MessageCircle size={16} /> Nuôi X
              </button>
            )}
          </div>
        </div>
      ))}
          </div>
        </div>
      ))}
      <AccountHealthModal 
        isOpen={healthModal.isOpen} 
        onClose={() => setHealthModal({ isOpen: false, account: null })} 
        account={healthModal.account} 
      />
    </div>
  );
};
