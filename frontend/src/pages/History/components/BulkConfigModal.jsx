import React from 'react';
import { SubtitleConfigPanel } from '../../../components/subtitle/SubtitleConfigPanel';
import { WatermarkConfigPanel } from '../../../components/subtitle/WatermarkConfigPanel';
import { InteractiveVideoPreview } from '../../../components/subtitle/InteractiveVideoPreview';
import { PlayCircle } from 'lucide-react';

export const BulkConfigModal = ({ hook, subtitleConfig }) => {
  const { 
    showConfigModal, setShowConfigModal, processingItems, 
    previewTime, setPreviewTime, previewImageUrl,
    voices, submitProcessing
  } = hook;

  if (!showConfigModal) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-in fade-in p-4 overflow-y-auto">
      <div className="bg-bg-primary border border-border-subtle p-6 rounded-2xl w-full max-w-5xl flex flex-col gap-6 shadow-2xl my-auto">
        <h3 className="text-xl font-bold border-b border-border-subtle pb-4">
          Cấu hình Xử lý Video ({processingItems.length} video)
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Col: Cấu hình */}
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Giọng Lồng Tiếng AI</label>
              <select 
                className="w-full bg-bg-secondary border border-border-subtle rounded-xl py-3 px-4 text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition-all duration-200 appearance-none" 
                value={subtitleConfig.voice} 
                onChange={e => subtitleConfig.setVoice(e.target.value)}
              >
                {voices.map(v => (
                  <option key={v.id} value={v.id}>{v.name} [{v.provider}]</option>
                ))}
                {voices.length === 0 && <option value="edge_auto">Đang tải danh sách giọng...</option>}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Âm lượng Video Gốc ({subtitleConfig.volume}%)</label>
              <input 
                type="range" 
                min="0" max="100" 
                value={subtitleConfig.volume} 
                onChange={e => subtitleConfig.setVolume(Number(e.target.value))} 
                className="w-full h-2 bg-border-subtle rounded-lg appearance-none cursor-pointer accent-brand-primary mt-3" 
              />
            </div>
            
            <SubtitleConfigPanel config={subtitleConfig} />
            <WatermarkConfigPanel config={subtitleConfig} />
          </div>
          
          {/* Right Col: Preview */}
          <div className="flex flex-col gap-2 relative bg-black/20 rounded-xl border border-border-subtle p-2">
            <label className="block text-sm font-medium text-text-secondary flex justify-between">
              <span>Preview Hiệu ứng & Phụ đề</span>
              <span className="text-xs opacity-50">Kéo thả phụ đề để đổi vị trí</span>
            </label>
            
            {previewImageUrl ? (
              <InteractiveVideoPreview config={subtitleConfig}>
                <img 
                  src={previewImageUrl} 
                  alt="Preview" 
                  className="w-full h-full object-contain pointer-events-none"
                />
              </InteractiveVideoPreview>
            ) : (
              <div className="relative w-full h-auto min-h-[300px] bg-black rounded-lg overflow-hidden flex items-center justify-center select-none text-text-secondary">
                <span className="animate-pulse">Đang tải ảnh preview...</span>
              </div>
            )}
            
            {/* Thanh Slider chỉnh thời điểm Thumbnail */}
            <div className="mt-2 px-1">
              <label className="block text-xs font-medium text-text-secondary mb-1 flex justify-between">
                <span>Thời điểm ảnh mẫu (Giây)</span>
                <span className="text-brand-primary">{previewTime}s</span>
              </label>
              <input 
                type="range" 
                min="0" max="60" 
                value={previewTime} 
                onChange={e => setPreviewTime(Number(e.target.value))} 
                className="w-full h-1.5 bg-border-subtle rounded-lg appearance-none cursor-pointer accent-brand-primary"
              />
              <p className="text-[10px] text-text-secondary opacity-60 mt-1">Kéo để thay đổi thời điểm trích xuất ảnh nền.</p>
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
            onClick={() => submitProcessing(subtitleConfig)}
          >
            <PlayCircle size={18} /> Xác nhận & Xử lý
          </button>
        </div>
      </div>
    </div>
  );
};
