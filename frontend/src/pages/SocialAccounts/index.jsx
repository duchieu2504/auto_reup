import React from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { useAccountsData } from './hooks/useAccountsData';
import { AccountGrid } from './components/AccountGrid';
import { AddAccountModal } from './components/AddAccountModal';

export default function SocialAccounts() {
  const accountHook = useAccountsData();

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Quản lý Tài Khoản MXH</h1>
          <p className="text-text-secondary mt-1 text-sm">Thêm và cấu hình các tài khoản mạng xã hội để auto upload</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={accountHook.handleSync}
            className="flex items-center gap-2 px-4 py-2 bg-bg-secondary text-text-primary font-medium rounded-xl hover:bg-white/5 transition-colors border border-border-subtle"
            title="Đồng bộ tài khoản từ ổ cứng vào Database"
          >
            <RefreshCw size={18} />
            Đồng bộ từ Data
          </button>
          <button
            onClick={() => { accountHook.resetForm(); accountHook.setIsModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white font-medium rounded-xl hover:opacity-90 transition-all shadow-[0_0_20px_rgba(var(--color-brand-primary),0.3)]"
          >
            <Plus size={18} />
            Thêm Tài Khoản
          </button>
        </div>
      </div>

      <AccountGrid hook={accountHook} />
      <AddAccountModal hook={accountHook} />
    </div>
  );
}
