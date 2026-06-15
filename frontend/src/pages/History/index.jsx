import React, { useEffect } from 'react';
import { useHistoryData } from './hooks/useHistoryData';
import { HistoryTable } from './components/HistoryTable';
import { PreviewModal } from './components/PreviewModal';

export default function History() {
  const historyHook = useHistoryData();

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto w-full pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
            Lịch sử
          </h1>
          <p className="text-text-secondary mt-1">
            Quản lý các video đã xử lý
          </p>
        </div>
      </div>

      <HistoryTable hook={historyHook} />
      <PreviewModal hook={historyHook} />
    </div>
  );
}

