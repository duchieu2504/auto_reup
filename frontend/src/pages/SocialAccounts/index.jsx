import React, { useState } from 'react';
import { Plus, LayoutGrid, List } from 'lucide-react';
import { useAccountsData } from './hooks/useAccountsData';
import { AccountGrid } from './components/AccountGrid';
import { AccountTable } from './components/AccountTable';
import { AddAccountModal } from './components/AddAccountModal';
import { NurtureConfigModal } from './components/NurtureConfigModal';
import { BatchActionBar } from './components/BatchActionBar';

export default function SocialAccounts() {
  const accountHook = useAccountsData();
  const [nurtureModal, setNurtureModal] = React.useState({ isOpen: false, accountId: null, username: '' });
  const [viewMode, setViewMode] = useState('grid');
  const [selectedIds, setSelectedIds] = useState([]);

  const openNurtureModal = (account) => {
    setNurtureModal({ isOpen: true, accountId: account.id, username: account.username });
  };

  const handleSelectAll = (isAll) => {
    if (isAll) {
      setSelectedIds(accountHook.accounts.map(a => a.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  
  const handleBatchDelete = async () => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa ${selectedIds.length} tài khoản này?`)) return;
    try {
        await Promise.all(selectedIds.map(id => accountHook.handleDelete(id, true)));
        accountHook.fetchAccounts();
        setSelectedIds([]);
    } catch(e) { console.error(e); }
  };
  
  const handleBatchCheckLive = async () => {
     try {
        await Promise.all(selectedIds.map(id => accountHook.checkStatus(id, true)));
        accountHook.fetchAccounts();
     } catch(e) { console.error(e); }
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-24">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Quản lý Tài Khoản MXH</h1>
          <p className="text-text-secondary mt-1 text-sm">Thêm và cấu hình các tài khoản mạng xã hội để auto upload</p>
        </div>
        <div className="flex gap-3 items-center">
          <div className="flex items-center bg-black/30 p-1 rounded-xl border border-white/10">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-text-secondary hover:text-text-primary'}`}
            >
              <LayoutGrid size={18} />
            </button>
            <button 
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'table' ? 'bg-white/10 text-white' : 'text-text-secondary hover:text-text-primary'}`}
            >
              <List size={18} />
            </button>
          </div>
          
          <button
            onClick={() => { accountHook.resetForm(); accountHook.setIsModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white font-medium rounded-xl hover:opacity-90 transition-all shadow-[0_0_20px_rgba(var(--color-brand-primary),0.3)]"
          >
            <Plus size={18} />
            Thêm Tài Khoản
          </button>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <AccountGrid 
          hook={accountHook} 
          onOpenNurture={openNurtureModal} 
          selectedIds={selectedIds}
          onSelectOne={handleSelectOne}
        />
      ) : (
        <AccountTable 
           hook={accountHook}
           onOpenNurture={openNurtureModal}
           selectedIds={selectedIds}
           onSelectOne={handleSelectOne}
           onSelectAll={handleSelectAll}
        />
      )}
      
      <AddAccountModal hook={accountHook} />
      <NurtureConfigModal
        isOpen={nurtureModal.isOpen}
        onClose={() => setNurtureModal({ isOpen: false, accountId: null, username: '' })}
        accountId={nurtureModal.accountId}
        username={nurtureModal.username}
      />
      
      <BatchActionBar 
        selectedCount={selectedIds.length} 
        onClear={() => setSelectedIds([])}
        onDelete={handleBatchDelete}
        onCheckLive={handleBatchCheckLive}
      />
    </div>
  );
}
