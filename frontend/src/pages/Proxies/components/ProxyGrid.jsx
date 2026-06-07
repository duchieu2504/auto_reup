import React from 'react';
import { Edit2, Trash2, ShieldCheck, ShieldAlert, Activity } from 'lucide-react';

export function ProxyGrid({ hook }) {
  const { proxies, loading, handleEdit, handleDelete, handleCheck } = hook;

  if (loading) {
    return <div className="text-center py-10 text-text-secondary">Đang tải dữ liệu...</div>;
  }

  if (proxies.length === 0) {
    return (
      <div className="text-center py-10 text-text-secondary bg-bg-secondary rounded-xl border border-border-subtle">
        Chưa có Proxy nào. Hãy thêm Proxy mới!
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {proxies.map(proxy => (
        <div key={proxy.id} className="bg-bg-secondary p-5 rounded-xl border border-border-subtle relative group overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-brand-primary" />
          
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-bg-tertiary flex items-center justify-center border border-border-subtle">
                <ShieldCheck size={20} className={proxy.status === 'active' ? 'text-green-500' : 'text-text-secondary'} />
              </div>
              <div>
                <h3 className="font-semibold text-text-primary">{proxy.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`w-2 h-2 rounded-full ${proxy.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  <span className="text-xs text-text-secondary capitalize">{proxy.status}</span>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={() => handleCheck(proxy.id)}
                className="p-1.5 text-text-secondary hover:text-blue-500 bg-bg-tertiary rounded-md transition-colors"
                title="Kiểm tra kết nối"
              >
                <Activity size={16} />
              </button>
              <button 
                onClick={() => handleEdit(proxy)}
                className="p-1.5 text-text-secondary hover:text-brand-primary bg-bg-tertiary rounded-md transition-colors"
                title="Chỉnh sửa"
              >
                <Edit2 size={16} />
              </button>
              <button 
                onClick={() => handleDelete(proxy.id)}
                className="p-1.5 text-text-secondary hover:text-red-500 bg-bg-tertiary rounded-md transition-colors"
                title="Xóa"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>

          <div className="space-y-2 mt-4 p-3 bg-bg-tertiary rounded-lg border border-border-subtle">
            <div className="flex justify-between items-center text-sm">
              <span className="text-text-secondary">Host:Port</span>
              <span className="font-mono text-text-primary text-xs">{proxy.host}:{proxy.port}</span>
            </div>
            {proxy.username && (
              <div className="flex justify-between items-center text-sm border-t border-border-subtle pt-2">
                <span className="text-text-secondary">Auth</span>
                <span className="font-mono text-text-primary text-xs">Sử dụng tài khoản</span>
              </div>
            )}
            <div className="flex justify-between items-center text-sm border-t border-border-subtle pt-2">
              <span className="text-text-secondary">Last Check</span>
              <span className="text-text-primary text-xs">
                {proxy.last_checked_at ? new Date(proxy.last_checked_at).toLocaleString('vi-VN') : 'Chưa kiểm tra'}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
