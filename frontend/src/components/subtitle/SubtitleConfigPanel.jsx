import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Type, ShieldAlert, Sliders, Plus, Trash2 } from 'lucide-react';

export const SubtitleConfigPanel = ({ config }) => {
  const [availableFonts, setAvailableFonts] = useState([]);

  useEffect(() => {
    fetch('http://localhost:8000/api/settings/fonts')
      .then(res => res.json())
      .then(data => {
        if (data.fonts) {
          setAvailableFonts(data.fonts);
        }
      })
      .catch(err => console.error("Error fetching fonts:", err));
  }, []);

  return (
    <div className="space-y-6">
      {/* Micro-alterations Panel */}
      <div className="bg-bg-secondary/40 rounded-2xl border border-white/5 p-5 w-full relative overflow-hidden">
        <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
          <label className="text-sm font-bold text-text-primary flex items-center gap-2 font-display">
            <ShieldAlert size={18} className="text-neon-pink" />
            Tính năng Siêu lách bản quyền (Micro-alterations)
          </label>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button" 
            onClick={config.toggleAllMicroAlterations}
            className="text-xs bg-neon-pink/15 text-neon-pink border border-neon-pink/20 px-3 py-1.5 rounded-lg hover:bg-neon-pink hover:text-white font-bold transition-all duration-300 cursor-pointer shadow-sm"
          >
            Chọn tất cả
          </motion.button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { id: "flipVideoEdit", label: "Lật gương (Mirror)", checked: config.flipVideo, onChange: (e) => config.setFlipVideo(e.target.checked) },
            { id: "optZoomEdit", label: "Zoom 2%", checked: config.optZoom, onChange: (e) => config.setOptZoom(e.target.checked) },
            { id: "optColorEdit", label: "Tăng màu (EQ)", checked: config.optColor, onChange: (e) => config.setOptColor(e.target.checked) },
            { id: "optNoiseEdit", label: "Nhiễu hạt (Noise)", checked: config.optNoise, onChange: (e) => config.setOptNoise(e.target.checked) },
          ].map((item) => (
            <motion.div 
              whileHover={{ x: 2 }}
              key={item.id} 
              className="flex items-center gap-3 p-2.5 rounded-xl bg-bg-primary/20 border border-white/5 hover:border-white/10 transition-colors"
            >
              <input 
                type="checkbox" 
                id={item.id} 
                checked={item.checked} 
                onChange={item.onChange} 
                className="w-4 h-4 accent-neon-pink border-border-subtle rounded cursor-pointer" 
              />
              <label htmlFor={item.id} className="text-xs font-semibold text-text-secondary cursor-pointer select-none hover:text-text-primary transition-colors">
                {item.label}
              </label>
            </motion.div>
          ))}
          <motion.div 
            whileHover={{ x: 2 }}
            className="flex items-center gap-3 p-2.5 rounded-xl bg-bg-primary/20 border border-white/5 hover:border-white/10 transition-colors sm:col-span-2"
          >
            <input 
              type="checkbox" 
              id="optPitchEdit" 
              checked={config.optPitch} 
              onChange={(e) => config.setOptPitch(e.target.checked)} 
              className="w-4 h-4 accent-neon-pink border-border-subtle rounded cursor-pointer" 
            />
            <label htmlFor="optPitchEdit" className="text-xs font-semibold text-text-secondary cursor-pointer select-none hover:text-text-primary transition-colors">
              Đổi tần số âm thanh (Pitch 2%)
            </label>
          </motion.div>
        </div>
      </div>

      {/* Logo Masking Panel */}
      <div className="bg-bg-secondary/40 rounded-2xl border border-white/5 p-5 w-full relative overflow-hidden">
        <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
          <label className="text-sm font-bold text-text-primary flex items-center gap-2 font-display">
            <Sliders size={18} className="text-neon-pink" />
            Che Logo Video Gốc
          </label>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer bg-bg-primary/40 px-3 py-1.5 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
              <input
                type="checkbox"
                checked={config.maskEnabled}
                onChange={(e) => config.setMaskEnabled(e.target.checked)}
                className="w-4 h-4 accent-neon-pink cursor-pointer rounded"
              />
              <span className="text-xs font-bold text-text-secondary select-none">Bật Che Logo</span>
            </label>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={config.addMask}
              className="flex items-center gap-1 text-xs bg-neon-pink/15 text-neon-pink border border-neon-pink/20 px-3 py-1.5 rounded-lg hover:bg-neon-pink hover:text-white font-bold transition-all duration-300 cursor-pointer shadow-sm"
            >
              <Plus size={14} />
              Thêm Ô Che
            </motion.button>
          </div>
        </div>

        <div className={`transition-opacity duration-300 ${config.maskEnabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
          {/* List of current masks */}
          <div className="flex flex-wrap gap-2 mb-4">
            {(config.masks || []).length === 0 ? (
              <span className="text-xs text-text-secondary italic">Chưa có ô che nào. Nhấp "Thêm Ô Che" để bắt đầu.</span>
            ) : (
              (config.masks || []).map((mask, idx) => {
                const isActive = mask.id === config.activeMaskId;
                return (
                  <div
                    key={mask.id}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-neon-pink/10 border-neon-pink text-neon-pink shadow-sm'
                        : 'bg-bg-primary/40 border-white/5 text-text-secondary hover:border-white/10'
                    }`}
                    onClick={() => config.setActiveMaskId(mask.id)}
                  >
                    <span>Ô #{idx + 1} ({mask.type === 'color' ? 'Màu' : mask.type === 'blur' ? 'Mờ' : 'Nhiễu'})</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        config.removeMask(mask.id);
                      }}
                      className="text-text-secondary hover:text-neon-pink p-0.5 rounded transition-colors"
                      title="Xóa ô này"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Configuration form for the active mask */}
          {config.masks && config.masks.length > 0 && (() => {
            const activeMask = config.masks.find(m => m.id === config.activeMaskId) || config.masks[0];
            if (!activeMask) return null;
            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-end bg-bg-primary/20 border border-white/5 rounded-xl p-4">
                <div className="flex flex-col gap-1.5 sm:col-span-1">
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                    Cấu hình Ô Che #{config.masks.findIndex(m => m.id === activeMask.id) + 1}
                  </label>
                  <select
                    value={activeMask.type}
                    onChange={(e) => config.updateMask(activeMask.id, { type: e.target.value })}
                    className="w-full bg-bg-primary border border-border-subtle text-text-primary text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-neon-purple cursor-pointer"
                  >
                    <option value="color">Che màu (Solid Box)</option>
                    <option value="blur">Làm mờ (Blur)</option>
                    <option value="noise">Làm nhiễu (Noise)</option>
                  </select>
                </div>

                {activeMask.type === 'color' && (
                  <div className="flex items-center justify-between bg-bg-primary/60 border border-border-subtle rounded-xl p-2 h-[38px]">
                    <label className="text-xs font-bold text-text-secondary uppercase tracking-wider pl-1">Màu Sắc Ô Che</label>
                    <input 
                      type="color" 
                      value={activeMask.color || '#000000'} 
                      onChange={(e) => config.updateMask(activeMask.id, { color: e.target.value })} 
                      className="w-7 h-7 p-0 border-0 rounded-lg cursor-pointer bg-transparent"
                    />
                  </div>
                )}
                
                <div className="flex flex-col gap-1.5 bg-bg-primary/30 border border-border-subtle rounded-xl p-2.5 h-[38px] justify-center sm:col-span-1">
                  <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                    Kéo thả & co giãn ô trên Preview
                  </span>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Subtitle Customization Panel */}
      <div className="bg-bg-secondary/40 rounded-2xl border border-white/5 p-5 w-full relative overflow-hidden">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h3 className="text-sm font-bold text-text-primary flex items-center gap-2 font-display">
            <Type size={18} className="text-neon-purple" />
            Tùy chỉnh Phụ Đề
          </h3>
          <label className="flex items-center gap-2 cursor-pointer bg-bg-primary/40 px-3 py-1.5 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
            <input
              type="checkbox"
              checked={config.enableSubtitles}
              onChange={(e) => config.setEnableSubtitles(e.target.checked)}
              className="w-4 h-4 accent-neon-pink cursor-pointer rounded"
            />
            <span className="text-xs font-bold text-text-secondary select-none">Bật Phụ Đề / Dịch Thuật</span>
          </label>
        </div>
        
        <div className={`flex flex-col gap-5 transition-opacity duration-300 ${config.enableSubtitles ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Font chữ</label>
              <select
                value={config.subtitleFont}
                onChange={e => config.setSubtitleFont(e.target.value)}
                className="w-full bg-bg-primary border border-border-subtle text-text-primary text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-neon-purple cursor-pointer"
              >
                {availableFonts.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center justify-between bg-bg-primary/60 border border-border-subtle rounded-xl p-2 h-[38px]">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wider pl-1">Màu Chữ</label>
              <input 
                type="color" 
                value={config.subtitleTextColor} 
                onChange={e => config.setSubtitleTextColor(e.target.value)} 
                className="w-7 h-7 p-0 border-0 rounded-lg cursor-pointer bg-transparent"
              />
            </div>
            
            <div className="flex items-center justify-between bg-bg-primary/60 border border-border-subtle rounded-xl p-2 h-[38px]">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wider pl-1">Màu Nền</label>
              <input 
                type="color" 
                value={config.subtitleBgColor} 
                onChange={e => config.setSubtitleBgColor(e.target.value)} 
                className="w-7 h-7 p-0 border-0 rounded-lg cursor-pointer bg-transparent"
              />
            </div>
            
            <div className="flex flex-col gap-1.5 bg-bg-primary/30 border border-border-subtle rounded-xl p-2.5 h-[38px] justify-center">
              <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider flex justify-between">
                <span>Opacity Nền</span>
                <span className="text-neon-purple font-mono font-bold">{config.subtitleBgOpacity}%</span>
              </label>
              <input 
                type="range" 
                min="0" max="100" 
                value={config.subtitleBgOpacity} 
                onChange={e => config.setSubtitleBgOpacity(Number(e.target.value))} 
                className="w-full h-1 bg-border-subtle rounded-lg appearance-none cursor-pointer accent-neon-purple"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2 bg-bg-primary/30 border border-border-subtle rounded-xl p-3">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wider flex justify-between">
                <span>Kích Thước Chữ</span>
                <span className="text-neon-pink font-mono font-bold">{config.subtitleFontSize}px</span>
              </label>
              <input 
                type="range" 
                min="10" max="50" 
                value={config.subtitleFontSize} 
                onChange={e => config.setSubtitleFontSize(Number(e.target.value))} 
                className="w-full h-1 bg-border-subtle rounded-lg appearance-none cursor-pointer accent-neon-pink"
              />
            </div>
            
            <div className="flex flex-col gap-2 bg-bg-primary/30 border border-border-subtle rounded-xl p-3">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wider flex justify-between">
                <span>Độ Dày Nền</span>
                <span className="text-neon-purple font-mono font-bold">{config.subtitleBgPadding}</span>
              </label>
              <input 
                type="range" 
                min="0" max="15" 
                value={config.subtitleBgPadding} 
                onChange={e => config.setSubtitleBgPadding(Number(e.target.value))} 
                className="w-full h-1 bg-border-subtle rounded-lg appearance-none cursor-pointer accent-neon-purple"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
