import React, { useState, useEffect } from 'react';

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
    <div className="space-y-4">
      <div className="bg-bg-secondary rounded-xl border border-border-subtle p-3 w-full">
        <div className="flex items-center justify-between mb-3 border-b border-border-subtle pb-2">
          <label className="text-sm font-semibold text-text-primary">
            Tính năng Siêu lách bản quyền (Micro-alterations)
          </label>
          <button 
            type="button" 
            onClick={config.toggleAllMicroAlterations}
            className="text-xs bg-brand-primary/10 text-brand-primary px-2 py-1 rounded hover:bg-brand-primary/20"
          >
            Chọn tất cả
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            <input type="checkbox" id="flipVideoEdit" checked={config.flipVideo} onChange={(e) => config.setFlipVideo(e.target.checked)} className="w-4 h-4 accent-brand-primary cursor-pointer" />
            <label htmlFor="flipVideoEdit" className="text-xs text-text-secondary cursor-pointer select-none">Lật gương (Mirror)</label>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="optZoomEdit" checked={config.optZoom} onChange={(e) => config.setOptZoom(e.target.checked)} className="w-4 h-4 accent-brand-primary cursor-pointer" />
            <label htmlFor="optZoomEdit" className="text-xs text-text-secondary cursor-pointer select-none">Zoom 2%</label>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="optColorEdit" checked={config.optColor} onChange={(e) => config.setOptColor(e.target.checked)} className="w-4 h-4 accent-brand-primary cursor-pointer" />
            <label htmlFor="optColorEdit" className="text-xs text-text-secondary cursor-pointer select-none">Tăng màu (EQ)</label>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="optNoiseEdit" checked={config.optNoise} onChange={(e) => config.setOptNoise(e.target.checked)} className="w-4 h-4 accent-brand-primary cursor-pointer" />
            <label htmlFor="optNoiseEdit" className="text-xs text-text-secondary cursor-pointer select-none">Nhiễu hạt (Noise)</label>
          </div>
          <div className="flex items-center gap-2 col-span-2">
            <input type="checkbox" id="optPitchEdit" checked={config.optPitch} onChange={(e) => config.setOptPitch(e.target.checked)} className="w-4 h-4 accent-brand-primary cursor-pointer" />
            <label htmlFor="optPitchEdit" className="text-xs text-text-secondary cursor-pointer select-none">Đổi tần số âm thanh (Pitch 2%)</label>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">Tùy chỉnh Subtitle</label>
        <div className="bg-bg-secondary border border-border-subtle rounded-xl p-4 flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <label className="text-xs text-text-secondary">Font chữ</label>
              <select
                value={config.subtitleFont}
                onChange={e => config.setSubtitleFont(e.target.value)}
                className="bg-bg-primary border border-border-subtle text-text-primary text-xs rounded px-2 py-1 focus:outline-none focus:border-brand-primary"
              >
                {availableFonts.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-text-secondary">Màu Chữ</label>
              <input 
                type="color" 
                value={config.subtitleTextColor} 
                onChange={e => config.setSubtitleTextColor(e.target.value)} 
                className="w-8 h-8 p-0 border-0 rounded cursor-pointer bg-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-text-secondary">Màu Nền</label>
              <input 
                type="color" 
                value={config.subtitleBgColor} 
                onChange={e => config.setSubtitleBgColor(e.target.value)} 
                className="w-8 h-8 p-0 border-0 rounded cursor-pointer bg-transparent"
              />
            </div>
            <div className="flex items-center gap-2 ml-2">
              <label className="text-xs text-text-secondary">Opacity Nền ({config.subtitleBgOpacity}%)</label>
              <input 
                type="range" 
                min="0" max="100" 
                value={config.subtitleBgOpacity} 
                onChange={e => config.setSubtitleBgOpacity(Number(e.target.value))} 
                className="w-20 h-2 bg-border-subtle rounded-lg appearance-none cursor-pointer accent-brand-primary"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-text-secondary mb-1">Kích Thước Chữ ({config.subtitleFontSize}px)</label>
            <input 
              type="range" 
              min="10" max="50" 
              value={config.subtitleFontSize} 
              onChange={e => config.setSubtitleFontSize(Number(e.target.value))} 
              className="w-full h-2 bg-border-subtle rounded-lg appearance-none cursor-pointer accent-brand-primary"
            />
          </div>
          <div>
            <label className="block text-xs text-text-secondary mb-1">Độ Dày Nền ({config.subtitleBgPadding})</label>
            <input 
              type="range" 
              min="0" max="15" 
              value={config.subtitleBgPadding} 
              onChange={e => config.setSubtitleBgPadding(Number(e.target.value))} 
              className="w-full h-2 bg-border-subtle rounded-lg appearance-none cursor-pointer accent-brand-primary"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
