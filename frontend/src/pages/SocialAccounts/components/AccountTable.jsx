import React from 'react';
import { Trash2, Edit2, Activity, Globe, Shield, RefreshCw, Smartphone, AlertTriangle, Square, MessageCircle, BarChart2, CheckCircle2, Video } from 'lucide-react';
import { AccountHealthModal } from './AccountHealthModal';

export const AccountTable = ({ hook, onOpenNurture, selectedIds = [], onSelectOne, onSelectAll }) => {
  const [healthModal, setHealthModal] = React.useState({ isOpen: false, account: null });
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
  
  const allSelected = accounts.length > 0 && selectedIds.length === accounts.length;

  const groupedAccounts = accounts.reduce((acc, account) => {
    const platform = account.platform.toLowerCase();
    if (!acc[platform]) acc[platform] = [];
    acc[platform].push(account);
    return acc;
  }, {});

  return (
    <div className="bg-surface rounded-2xl border border-white/5 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-black/20 text-text-secondary uppercase text-xs">
            <tr>
              <th className="px-4 py-3 w-12 text-center">
                <input 
                  type="checkbox" 
                  checked={allSelected}
                  onChange={(e) => onSelectAll && onSelectAll(e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 bg-black/40 checked:bg-brand-primary checked:border-brand-primary focus:ring-brand-primary transition-all cursor-pointer"
                />
              </th>
              <th className="px-4 py-3">Tài khoản</th>
              <th className="px-4 py-3">Nền tảng</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3 text-right">Chỉ số (TikTok)</th>
              <th className="px-4 py-3 text-right">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {Object.entries(groupedAccounts).map(([platform, platformAccounts]) => (
              <React.Fragment key={platform}>
                <tr className="bg-black/40">
                  <td colSpan="6" className="px-4 py-3 text-text-primary font-bold capitalize">
                    <div className="flex items-center gap-2">
                      {platform === 'tiktok' ? <Video size={16} className="text-pink-500" /> : <MessageCircle size={16} className="text-[#1DA1F2]" />}
                      Nền tảng {platform} <span className="text-sm font-normal text-text-secondary">({platformAccounts.length} tài khoản)</span>
                    </div>
                  </td>
                </tr>
                {platformAccounts.map(acc => {
                  const isTikTok = acc.platform.toLowerCase() === 'tiktok';
                  const er = isTikTok ? (((acc.total_likes || 0) / (acc.total_views || 1)) * 100).toFixed(1) : 0;
              const isSelected = selectedIds.includes(acc.id);
              
              return (
                <tr 
                  key={acc.id} 
                  className={`hover:bg-white/5 transition-colors ${isSelected ? 'bg-brand-primary/10' : ''}`}
                >
                  <td className="px-4 py-3 text-center">
                    <input 
                      type="checkbox" 
                      checked={isSelected}
                      onChange={() => onSelectOne && onSelectOne(acc.id)}
                      className="w-4 h-4 rounded border-white/20 bg-black/40 checked:bg-brand-primary checked:border-brand-primary focus:ring-brand-primary transition-all cursor-pointer"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                         <img 
                            src={acc.avatar_url || `https://ui-avatars.com/api/?name=${acc.username}&background=random`} 
                            alt={acc.username}
                            className="w-10 h-10 rounded-full object-cover bg-white/5 border border-white/10"
                            onError={(e) => e.target.src = `https://ui-avatars.com/api/?name=${acc.username}&background=random`}
                         />
                         <div 
                          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-surface ${
                            acc.status === 'active' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]' : 
                            acc.status === 'shadowbanned' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse' : 
                            'bg-gray-500'
                          }`} 
                          title={acc.status}
                        />
                      </div>
                      <div>
                        <div className="font-semibold text-text-primary">{acc.username}</div>
                        <div className="text-xs text-text-secondary flex items-center gap-1 mt-0.5">
                           {acc.connection_type === 'adb_device' ? <Smartphone size={12}/> : acc.connection_type === 'gpm_login' ? <Shield size={12}/> : <Globe size={12}/>}
                           {acc.connection_type === 'adb_device' ? 'Mobile App' : acc.connection_type === 'gpm_login' ? 'GPM' : 'Web'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs uppercase font-medium ${isTikTok ? 'bg-pink-500/10 text-pink-400' : 'bg-[#1DA1F2]/10 text-[#1DA1F2]'}`}>
                      {acc.platform}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {acc.status === 'active' ? (
                       <span className="text-green-400 text-xs flex items-center gap-1"><CheckCircle2 size={12}/> Đang sống</span>
                    ) : acc.status === 'shadowbanned' ? (
                       <span className="text-red-400 text-xs flex items-center gap-1"><AlertTriangle size={12}/> Shadowban</span>
                    ) : (
                       <span className="text-gray-400 text-xs">Lỗi</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {isTikTok ? (
                      <div className="text-xs">
                        <div className="text-text-primary font-medium">{acc.followers_count || 0} Flw</div>
                        <div className={`mt-0.5 ${er > 5 ? 'text-green-400' : 'text-text-secondary'}`}>ER: {er}%</div>
                      </div>
                    ) : (
                      <span className="text-text-secondary text-xs">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                       <button onClick={() => checkStatus(acc.id)} className="p-1.5 hover:bg-white/10 text-text-secondary rounded" title="Check Live">
                         <RefreshCw size={14} />
                       </button>
                       {isTikTok && (
                         <button onClick={() => setHealthModal({ isOpen: true, account: acc })} className="p-1.5 hover:bg-brand-primary/20 text-brand-primary rounded" title="Chi tiết">
                           <BarChart2 size={14} />
                         </button>
                       )}
                       <button onClick={() => openEditModal(acc)} className="p-1.5 hover:bg-white/10 text-text-secondary rounded" title="Sửa">
                         <Edit2 size={14} />
                       </button>
                       <button onClick={() => handleDelete(acc.id)} className="p-1.5 hover:bg-red-500/20 text-red-400 rounded" title="Xóa">
                         <Trash2 size={14} />
                       </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            </React.Fragment>
          ))}
          </tbody>
        </table>
      </div>
      
      <AccountHealthModal 
        isOpen={healthModal.isOpen} 
        onClose={() => setHealthModal({ isOpen: false, account: null })} 
        account={healthModal.account} 
      />
    </div>
  );
};
