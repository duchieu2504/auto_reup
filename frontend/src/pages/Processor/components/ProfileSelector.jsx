import React from 'react';
import { motion } from 'framer-motion';
import { Save, Trash2 } from 'lucide-react';

export const ProfileSelector = ({
  editProfiles,
  selectedProfileId,
  handleApplyProfile,
  handleDeleteProfile,
  setShowSaveModal
}) => {
  return (
    <div className="glass-panel p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between bg-neon-purple/5 border border-neon-purple/20 gap-4">
      <div className="flex items-center gap-3.5 flex-1 w-full">
        <Save size={20} className="text-neon-purple min-w-[20px]" />
        <div className="flex-1 sm:max-w-xs">
          <select 
            className="w-full bg-bg-secondary/80 border border-border-subtle rounded-xl py-2 px-3 text-text-primary focus:outline-none focus:border-neon-purple text-sm cursor-pointer"
            value={selectedProfileId}
            onChange={handleApplyProfile}
          >
            <option value="">-- Chọn Mẫu Cấu Hình --</option>
            {editProfiles.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        {selectedProfileId && (
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleDeleteProfile}
            className="text-neon-pink hover:text-white hover:bg-neon-pink/15 p-2 rounded-xl transition-all duration-300 border border-transparent hover:border-neon-pink/20 cursor-pointer"
            title="Xóa mẫu đang chọn"
          >
            <Trash2 size={16} />
          </motion.button>
        )}
      </div>
      <div className="w-full sm:w-auto">
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowSaveModal(true)}
          className="text-xs bg-bg-tertiary hover:bg-border-subtle text-text-primary px-4 py-2.5 rounded-xl transition-colors font-bold border border-white/5 shadow-md cursor-pointer w-full sm:w-auto"
        >
          + Lưu Cấu Hình Hiện Tại
        </motion.button>
      </div>
    </div>
  );
};
