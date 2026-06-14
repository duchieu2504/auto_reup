import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { Image as ImageIcon, Type, X, Upload } from 'lucide-react';
import { toast } from 'react-hot-toast';

export const WatermarkConfigPanel = ({ config }) => {
  const fileInputRef = useRef(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate size (<5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Kích thước ảnh phải nhỏ hơn 5MB');
      return;
    }

    // Validate type (PNG, JPG)
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      toast.error('Chỉ hỗ trợ định dạng PNG hoặc JPG');
      return;
    }

    config.setWatermarkImageFile(file);
    
    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    config.setWatermarkImagePreview(previewUrl);
  };

  return (
    <div className="bg-bg-secondary/40 border border-white/5 rounded-2xl p-5 mt-4 relative overflow-hidden">
      <h3 className="text-white font-bold mb-4 flex items-center gap-2 font-display">
        <ImageIcon size={18} className="text-neon-cyan" /> Cấu hình Logo / Watermark
      </h3>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 bg-bg-primary/55 p-1 rounded-xl border border-white/5">
        {[
          { id: 'none', label: 'Không có', icon: <X size={15} /> },
          { id: 'text', label: 'Chữ viết', icon: <Type size={15} /> },
          { id: 'image', label: 'Hình ảnh', icon: <ImageIcon size={15} /> }
        ].map(tab => {
          const isActive = config.watermarkType === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => config.setWatermarkType(tab.id)}
              className="flex-1 relative py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all duration-300 cursor-pointer focus:outline-none"
            >
              {isActive && (
                <motion.div 
                  layoutId="activeWatermarkTab"
                  className="absolute inset-0 bg-gradient-to-r from-neon-purple/20 to-neon-pink/20 border border-neon-purple/30 rounded-lg shadow-[0_0_15px_rgba(168,85,247,0.1)]"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <span className={`relative z-10 flex items-center gap-1.5 ${isActive ? 'text-white' : 'text-text-secondary hover:text-text-primary'}`}>
                {tab.icon} {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      {config.watermarkType !== 'none' && (
        <motion.div 
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-5"
        >
          {config.watermarkType === 'text' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Nội dung Logo chữ</label>
              <input 
                type="text" 
                value={config.watermarkText}
                onChange={e => config.setWatermarkText(e.target.value)}
                placeholder="Ví dụ: @KenhCuaToi"
                className="w-full bg-bg-primary border border-border-subtle rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan transition-all duration-300 text-sm font-medium placeholder:text-text-secondary/35"
              />
            </div>
          )}

          {config.watermarkType === 'image' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Tải lên Logo ảnh</label>
              <div className="flex gap-4 items-center">
                <input 
                  type="file" 
                  accept=".png,.jpg,.jpeg" 
                  ref={fileInputRef}
                  className="hidden" 
                  onChange={handleImageUpload}
                />
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 bg-bg-primary hover:bg-bg-tertiary text-white px-4 py-2.5 rounded-xl border border-border-subtle transition-all duration-300 text-xs font-bold cursor-pointer"
                >
                  <Upload size={14} /> Chọn Ảnh (PNG/JPG)
                </motion.button>
                {config.watermarkImagePreview && (
                  <div className="h-10 w-10 rounded-xl overflow-hidden border border-border-subtle bg-black/40 p-1 flex items-center justify-center">
                    <img src={config.watermarkImagePreview} alt="Preview" className="w-full h-full object-contain" />
                  </div>
                )}
              </div>
              <p className="text-[10px] text-text-secondary/70 mt-1">Gợi ý: Dùng ảnh PNG có nền trong suốt để Logo đẹp nhất. Dung lượng tối đa 5MB.</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {config.watermarkType === 'text' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Màu chữ</label>
                <div className="flex gap-3">
                  <input 
                    type="color" 
                    value={config.watermarkColor}
                    onChange={e => config.setWatermarkColor(e.target.value)}
                    className="w-9 h-9 rounded-xl border-none cursor-pointer bg-transparent"
                  />
                  <input 
                    type="text"
                    value={config.watermarkColor.toUpperCase()}
                    onChange={e => config.setWatermarkColor(e.target.value)}
                    className="flex-1 bg-bg-primary border border-border-subtle rounded-xl px-3 text-white text-xs font-mono font-bold uppercase focus:outline-none focus:border-neon-cyan"
                  />
                </div>
              </div>
            )}
            
            <div className={`flex flex-col gap-2 bg-bg-primary/30 border border-border-subtle rounded-xl p-3 ${config.watermarkType === 'image' ? 'col-span-2' : ''}`}>
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wider flex justify-between">
                <span>{config.watermarkType === 'text' ? 'Cỡ chữ' : 'Độ lớn'}</span>
                <span className="text-neon-cyan font-mono font-bold">{config.watermarkSize}{config.watermarkType === 'text' ? 'px' : '%'}</span>
              </label>
              <input 
                type="range" 
                min={config.watermarkType === 'text' ? "10" : "5"} 
                max="100" 
                value={config.watermarkSize} 
                onChange={e => config.setWatermarkSize(Number(e.target.value))} 
                className="w-full h-1 bg-border-subtle rounded-lg appearance-none cursor-pointer accent-neon-cyan mt-1"
              />
            </div>
            
            <div className="col-span-2 flex flex-col gap-2 bg-bg-primary/30 border border-border-subtle rounded-xl p-3">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wider flex justify-between">
                <span>Độ mờ (Opacity)</span>
                <span className="text-neon-cyan font-mono font-bold">{config.watermarkOpacity}%</span>
              </label>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={config.watermarkOpacity} 
                onChange={e => config.setWatermarkOpacity(Number(e.target.value))} 
                className="w-full h-1 bg-border-subtle rounded-lg appearance-none cursor-pointer accent-neon-cyan mt-1"
              />
            </div>
          </div>
          
          <div className="bg-neon-cyan/5 border border-neon-cyan/15 rounded-xl p-3 text-xs text-neon-cyan/90 leading-relaxed shadow-sm">
            <span className="font-bold text-neon-cyan">Mẹo:</span> Kéo thả Logo trực tiếp trên khung Xem Trước Video ở phía trên để điều chỉnh vị trí hiển thị mong muốn.
          </div>
        </motion.div>
      )}
    </div>
  );
};
