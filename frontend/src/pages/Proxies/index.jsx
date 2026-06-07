import React from 'react';
import { Plus } from 'lucide-react';
import { useProxiesData } from './hooks/useProxiesData';
import { ProxyGrid } from './components/ProxyGrid';
import { AddProxyModal } from './components/AddProxyModal';

export default function Proxies() {
  const proxyHook = useProxiesData();

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Quản lý Proxy</h1>
          <p className="text-text-secondary mt-1 text-sm">Quản lý kho Proxy để tự động gán vào các tài khoản MXH</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => { proxyHook.resetForm(); proxyHook.setIsModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white font-medium rounded-xl hover:opacity-90 transition-all shadow-[0_0_20px_rgba(var(--color-brand-primary),0.3)]"
          >
            <Plus size={18} />
            Thêm Proxy
          </button>
        </div>
      </div>

      <ProxyGrid hook={proxyHook} />
      <AddProxyModal hook={proxyHook} />
    </div>
  );
}
