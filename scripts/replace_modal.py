import os
import re

file_path = r"e:\Tradingbot\auto_reup_tiktok\frontend\src\pages\History.jsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

start_marker = "{/* Config Modal for Processing */}"
end_marker = "{/* GROQ FALLBACK MODAL */}"

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx == -1 or end_idx == -1:
    print("Markers not found")
    exit(1)

new_modal = """{/* Config Modal for Processing */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-in fade-in p-4 overflow-y-auto">
          <div className="bg-bg-primary border border-border-subtle p-6 rounded-2xl w-full max-w-5xl flex flex-col gap-6 shadow-2xl my-auto">
            <h3 className="text-xl font-bold border-b border-border-subtle pb-4">
              Cấu hình Xử lý Video ({processingItems.length} video)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Cột trái: Cấu hình */}
              <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">Giọng Lồng Tiếng AI</label>
                  <select 
                    className="w-full bg-bg-secondary border border-border-subtle rounded-xl py-3 px-4 text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition-all duration-200 appearance-none" 
                    value={configVoice} 
                    onChange={e => setConfigVoice(e.target.value)}
                  >
                    {voices.map(v => (
                      <option key={v.id} value={v.id}>{v.name} [{v.provider}]</option>
                    ))}
                    {voices.length === 0 && <option value="edge_auto">Đang tải danh sách giọng...</option>}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">Âm lượng Video Gốc ({configVolume}%)</label>
                  <input 
                    type="range" 
                    min="0" max="100" 
                    value={configVolume} 
                    onChange={e => setConfigVolume(Number(e.target.value))} 
                    className="w-full h-2 bg-border-subtle rounded-lg appearance-none cursor-pointer accent-brand-primary mt-3" 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">Tùy chỉnh Subtitle</label>
                  <div className="bg-bg-secondary border border-border-subtle rounded-xl p-4 grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-text-secondary mb-1">Màu Chữ</label>
                      <input 
                        type="color" 
                        value={configSubtitleTextColor} 
                        onChange={e => setConfigSubtitleTextColor(e.target.value)} 
                        className="w-full h-10 rounded cursor-pointer border border-border-subtle"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-text-secondary mb-1">Màu Nền</label>
                      <input 
                        type="color" 
                        value={configSubtitleBgColor} 
                        onChange={e => setConfigSubtitleBgColor(e.target.value)} 
                        className="w-full h-10 rounded cursor-pointer border border-border-subtle"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs text-text-secondary mb-1">Kích Thước Chữ ({configSubtitleFontSize}px)</label>
                      <input 
                        type="range" 
                        min="10" max="50" 
                        value={configSubtitleFontSize} 
                        onChange={e => setConfigSubtitleFontSize(Number(e.target.value))} 
                        className="w-full h-2 bg-border-subtle rounded-lg appearance-none cursor-pointer accent-brand-primary"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="bg-bg-secondary rounded-xl border border-border-subtle p-3 mt-4">
                  <div className="flex items-center justify-between mb-3 border-b border-border-subtle pb-2">
                    <label className="text-sm font-semibold text-text-primary">
                      Tính năng Siêu lách bản quyền (Micro-alterations)
                    </label>
                    <button 
                      type="button" 
                      onClick={() => {
                        const newState = !(configFlipVideo && configOptZoom && configOptColor && configOptNoise && configOptPitch);
                        setConfigFlipVideo(newState);
                        setConfigOptZoom(newState);
                        setConfigOptColor(newState);
                        setConfigOptNoise(newState);
                        setConfigOptPitch(newState);
                      }}
                      className="text-xs bg-brand-primary/10 text-brand-primary px-2 py-1 rounded hover:bg-brand-primary/20"
                    >
                      Chọn tất cả
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="flipVideoHistory" checked={configFlipVideo} onChange={(e) => setConfigFlipVideo(e.target.checked)} className="w-4 h-4 accent-brand-primary cursor-pointer" />
                      <label htmlFor="flipVideoHistory" className="text-xs text-text-secondary cursor-pointer select-none">Lật gương (Mirror)</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="optZoomHistory" checked={configOptZoom} onChange={(e) => setConfigOptZoom(e.target.checked)} className="w-4 h-4 accent-brand-primary cursor-pointer" />
                      <label htmlFor="optZoomHistory" className="text-xs text-text-secondary cursor-pointer select-none">Zoom 2%</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="optColorHistory" checked={configOptColor} onChange={(e) => setConfigOptColor(e.target.checked)} className="w-4 h-4 accent-brand-primary cursor-pointer" />
                      <label htmlFor="optColorHistory" className="text-xs text-text-secondary cursor-pointer select-none">Tăng màu (EQ)</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="optNoiseHistory" checked={configOptNoise} onChange={(e) => setConfigOptNoise(e.target.checked)} className="w-4 h-4 accent-brand-primary cursor-pointer" />
                      <label htmlFor="optNoiseHistory" className="text-xs text-text-secondary cursor-pointer select-none">Nhiễu hạt (Noise)</label>
                    </div>
                    <div className="flex items-center gap-2 col-span-2">
                      <input type="checkbox" id="optPitchHistory" checked={configOptPitch} onChange={(e) => setConfigOptPitch(e.target.checked)} className="w-4 h-4 accent-brand-primary cursor-pointer" />
                      <label htmlFor="optPitchHistory" className="text-xs text-text-secondary cursor-pointer select-none">Đổi tần số âm thanh (Pitch 2%)</label>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Cột phải: Preview */}
              <div className="flex flex-col gap-2 relative bg-black/20 rounded-xl border border-border-subtle p-2">
                <label className="block text-sm font-medium text-text-secondary flex justify-between">
                  <span>Preview Hiệu ứng & Phụ đề</span>
                  <span className="text-xs opacity-50">Kéo thả phụ đề để đổi vị trí</span>
                </label>
                <div 
                  className="relative w-full aspect-[9/16] bg-black rounded-lg overflow-hidden flex items-center justify-center select-none cursor-crosshair"
                  onMouseMove={(e) => {
                    if (isDragging) {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const y = e.clientY - rect.top;
                      const percentage = ((rect.height - y) / rect.height) * 100;
                      setConfigSubtitleMarginV(Math.max(5, Math.min(95, percentage)));
                    }
                  }}
                  onMouseUp={() => setIsDragging(false)}
                  onMouseLeave={() => setIsDragging(false)}
                >
                  {previewImageUrl ? (
                    <img 
                      src={previewImageUrl} 
                      alt="Preview" 
                      className="w-full h-full object-contain pointer-events-none"
                      style={{
                        transform: (configFlipVideo ? 'scaleX(-1) ' : '') + (configOptZoom ? 'scale(1.02) ' : '')
                      }}
                    />
                  ) : (
                    <div className="text-text-secondary flex flex-col items-center gap-2">
                      <span className="animate-pulse">Đang tải ảnh preview...</span>
                    </div>
                  )}
                  
                  {/* Lớp Overlay mô phỏng Phụ đề */}
                  <div 
                    className="absolute left-1/2 -translate-x-1/2 w-3/4 max-w-[80%] text-center cursor-ns-resize transition-opacity hover:opacity-90 z-10"
                    style={{ 
                      bottom: configSubtitleMarginV + '%',
                      color: configSubtitleTextColor,
                      backgroundColor: configSubtitleBgColor + 'CC',
                      fontSize: configSubtitleFontSize + 'px',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontWeight: 'bold',
                      textShadow: '0px 1px 2px rgba(0,0,0,0.5)',
                      userSelect: 'none'
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                      setStartY(e.clientY);
                    }}
                  >
                    Đây là phụ đề mẫu tự động sinh...
                  </div>
                  
                  <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm pointer-events-none">
                    MarginV: {Math.round(configSubtitleMarginV)}%
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border-subtle">
              <button 
                className="px-4 py-2 bg-bg-secondary text-text-secondary hover:text-white rounded-lg transition-colors"
                onClick={() => setShowConfigModal(false)}
              >
                Hủy
              </button>
              <button 
                className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-hover transition-colors font-medium flex items-center gap-2"
                onClick={submitProcessing}
              >
                <PlayCircle size={18} /> Xác nhận & Xử lý
              </button>
            </div>
          </div>
        </div>
      )}
      
      """

new_content = content[:start_idx] + new_modal + content[end_idx:]

with open(file_path, "w", encoding="utf-8") as f:
    f.write(new_content)

print("Success")
