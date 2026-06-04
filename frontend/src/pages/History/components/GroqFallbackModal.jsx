import React from 'react';
import { AlertTriangle } from 'lucide-react';

export const GroqFallbackModal = ({ hook }) => {
  const { showGroqFallbackModal, setShowGroqFallbackModal, handleGroqFallback } = hook;

  if (!showGroqFallbackModal) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-in fade-in p-4">
      <div className="bg-bg-primary border border-red-500/50 p-6 rounded-2xl w-full max-w-md flex flex-col gap-4 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-red-500"></div>
        <div className="flex items-center gap-3 text-red-500 mb-2">
          <AlertTriangle size={24} />
          <h3 className="text-xl font-bold">Lỗi Giới Hạn Groq API</h3>
        </div>
        <p className="text-sm text-text-secondary leading-relaxed">
          Tài khoản Groq của bạn đã đạt tới giới hạn (Rate Limit) cho model Whisper. Tiến trình bị kẹt không thể chạy tiếp.
        </p>
        <p className="text-sm text-text-secondary leading-relaxed">
          Bạn có muốn <strong className="text-white">Tắt Groq</strong> và tiếp tục xử lý bằng CPU (mặc định) không? 
        </p>
        <div className="flex justify-end gap-3 pt-4 mt-2 border-t border-border-subtle">
          <button 
            className="px-4 py-2 bg-bg-secondary text-text-secondary hover:text-white rounded-lg transition-colors"
            onClick={() => setShowGroqFallbackModal(false)}
          >
            Đóng
          </button>
          <button 
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium flex items-center gap-2"
            onClick={handleGroqFallback}
          >
            Tắt Groq & Chạy CPU
          </button>
        </div>
      </div>
    </div>
  );
};
