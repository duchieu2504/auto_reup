import React, { useEffect } from 'react';
import { useHistoryData } from './hooks/useHistoryData';
import { useSubtitleState } from '../../hooks/useSubtitleState';
import { HistoryTable } from './components/HistoryTable';
import { BulkConfigModal } from './components/BulkConfigModal';
import { PreviewModal } from './components/PreviewModal';
import { GroqFallbackModal } from './components/GroqFallbackModal';
import { toast } from 'react-hot-toast';

export default function History() {
  const historyHook = useHistoryData();
  const subtitleConfig = useSubtitleState();

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto w-full pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
            Lịch sử Xử lý
          </h1>
          <p className="text-text-secondary mt-1">
            Quản lý và theo dõi tiến độ các video đã tải về
          </p>
        </div>
      </div>

      <HistoryTable hook={historyHook} subtitleConfig={subtitleConfig} />
      <BulkConfigModal hook={historyHook} subtitleConfig={subtitleConfig} />
      <PreviewModal hook={historyHook} />
      <GroqFallbackModal hook={historyHook} />
    </div>
  );
}
