import React from 'react';
import { X, CheckCircle2, Play, Trash2 } from 'lucide-react';

export const BatchActionBar = ({ selectedCount, onClear, onDelete, onCheckLive }) => {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="bg-surface/90 backdrop-blur-xl border border-white/10 p-2 rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.6)] flex items-center gap-4">
        
        <div className="flex items-center gap-2 pl-3">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-primary text-white text-xs font-bold">
            {selectedCount}
          </span>
          <span className="text-text-primary text-sm font-medium">Đã chọn</span>
        </div>
        
        <div className="w-[1px] h-8 bg-white/10"></div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={onCheckLive}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-white/5 text-text-secondary hover:text-white transition-colors text-sm"
          >
            <CheckCircle2 size={16} /> Check Live
          </button>
          {/* We can add Batch Warmup here if backend supports array of IDs */}
          <button 
            onClick={onDelete}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-red-500/10 text-red-400 hover:text-red-500 transition-colors text-sm"
          >
            <Trash2 size={16} /> Xóa
          </button>
        </div>
        
        <div className="w-[1px] h-8 bg-white/10"></div>
        
        <button 
          onClick={onClear}
          className="p-2 rounded-xl hover:bg-white/5 text-text-secondary hover:text-white transition-colors"
          title="Bỏ chọn"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
};
