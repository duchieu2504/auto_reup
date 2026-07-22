import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save } from 'lucide-react';

export const SaveProfileModal = ({
  showSaveModal,
  setShowSaveModal,
  newProfileName,
  setNewProfileName,
  handleSaveProfile
}) => {
  return (
    <AnimatePresence>
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="glass-panel p-6 rounded-2xl w-full max-w-md bg-bg-secondary border border-white/10 shadow-2xl relative overflow-hidden"
          >
            {/* Decorative Glow inside modal */}
            <div className="absolute -top-12 -right-12 w-24 h-24 bg-neon-purple/10 blur-2xl rounded-full" />
            
            <h3 className="text-xl font-bold mb-3 font-display bg-gradient-to-r from-white to-text-secondary bg-clip-text text-transparent flex items-center gap-2">
              <Save className="text-neon-purple" size={18} />
              Lưu Mẫu Cấu Hình
            </h3>
            
            <p className="text-xs text-text-secondary mb-4 leading-relaxed">
              Toàn bộ thông số thiết lập hiện tại (âm lượng, phụ đề, font chữ, logo...) sẽ được lưu lại thành một mẫu cấu hình riêng để dễ dàng tái sử dụng cho các lần sau.
            </p>
            
            <div className="mb-6">
              <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">Tên Mẫu Cấu Hình</label>
              <input 
                type="text" 
                autoFocus
                className="w-full bg-bg-primary border border-border-subtle rounded-xl py-3 px-4 text-text-primary focus:outline-none focus:border-neon-purple focus:ring-1 focus:ring-neon-purple transition-all duration-300 font-medium text-sm placeholder:text-text-secondary/35"
                value={newProfileName}
                onChange={e => setNewProfileName(e.target.value)}
                placeholder="Ví dụ: Giọng Đọc Độc Đáo - Viền Đen"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSaveProfile();
                  }
                }}
              />
            </div>
            
            <div className="flex justify-end gap-3.5">
              <button 
                onClick={() => setShowSaveModal(false)}
                className="px-4 py-2.5 rounded-xl bg-bg-tertiary hover:bg-border-subtle text-text-primary text-xs font-bold transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSaveProfile}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-neon-purple to-neon-pink text-white text-xs font-bold transition-all duration-300 flex items-center gap-1.5 cursor-pointer shadow-lg"
              >
                <Save size={14} /> Lưu Lại
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
