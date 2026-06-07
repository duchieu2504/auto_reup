import React from 'react';
import { Trash2, Edit2, Activity, Globe, Shield, RefreshCw, Smartphone, AlertTriangle } from 'lucide-react';

export const AccountGrid = ({ hook }) => {
  const { 
    accounts, loading, warmingUpIds,
    handleDelete, checkStatus, openEditModal, triggerWarmup
  } = hook;

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-text-secondary">Đang tải danh sách...</div>;
  }

  if (accounts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-text-secondary bg-bg-secondary rounded-2xl border border-border-subtle border-dashed">
        <Globe size={48} className="opacity-20 mb-4" />
        <p>Chưa có tài khoản nào được thêm.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {accounts.map(acc => (
        <div key={acc.id} className="bg-bg-secondary rounded-2xl border border-border-subtle p-6 hover:border-brand-primary/50 transition-colors group relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-primary to-purple-500 opacity-50" />
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              {acc.avatar_url ? (
                <img src={acc.avatar_url} alt="Avatar" referrerPolicy="no-referrer" className="w-10 h-10 rounded-full border border-white/10 object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-black/30 border border-white/10 flex items-center justify-center uppercase font-bold text-lg text-brand-primary">
                  {acc.platform.charAt(0)}
                </div>
              )}
              <div>
                <h3 className="font-bold text-text-primary text-lg flex items-center gap-2">
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
          
          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-secondary flex items-center gap-1.5"><Activity size={14}/> Trạng thái</span>
              <span className={`px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1 ${acc.status === 'active' ? 'bg-green-500/10 text-green-500' : acc.status === 'shadowbanned' ? 'bg-red-500/20 text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-red-500/10 text-red-500'}`}>
                {acc.status === 'shadowbanned' && <AlertTriangle size={12} className="animate-pulse" />}
                {acc.status === 'active' ? 'Hoạt động' : acc.status === 'warming_up' ? 'Đang nuôi' : acc.status === 'shadowbanned' ? 'Bị Shadowban' : 'Đứt kết nối'}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-secondary flex items-center gap-1.5"><Shield size={14}/> Proxy IP</span>
              <span className="text-text-primary font-mono bg-black/30 px-2 py-0.5 rounded">
                {acc.proxy_host ? `${acc.proxy_host}:${acc.proxy_port || '*'}` : 'Không dùng'}
              </span>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={() => checkStatus(acc.id)}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-black/20 hover:bg-black/40 text-text-primary rounded-xl text-sm font-medium transition-colors border border-white/5"
            >
              <RefreshCw size={16} /> Check Live
            </button>
            
            {(acc.connection_type === 'gpm_login' || acc.connection_type === 'adb_device') && (
              <button 
                onClick={() => {
                  if (warmingUpIds.includes(acc.id) || acc.status === 'warming_up') return;
                  triggerWarmup(acc.id);
                }}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors border ${
                  warmingUpIds.includes(acc.id) || acc.status === 'warming_up'
                    ? 'bg-green-500/20 text-green-400 border-green-500/30'
                    : 'bg-brand-primary/20 hover:bg-brand-primary/40 text-brand-primary border-brand-primary/30'
                }`}
              >
                <Activity size={16} className={warmingUpIds.includes(acc.id) || acc.status === 'warming_up' ? 'animate-pulse' : ''} /> 
                {warmingUpIds.includes(acc.id) || acc.status === 'warming_up' ? 'Đang nuôi...' : 'Nuôi (Warm-up)'}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
