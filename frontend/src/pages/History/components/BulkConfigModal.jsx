import React, { useState } from 'react';
import { SubtitleConfigPanel } from '../../../components/subtitle/SubtitleConfigPanel';
import { WatermarkConfigPanel } from '../../../components/subtitle/WatermarkConfigPanel';
import { InteractiveVideoPreview } from '../../../components/subtitle/InteractiveVideoPreview';
import { ProfileSelector, SaveProfileButton } from '../../../components/subtitle/ProfileSelector';
import { PlayCircle, Sliders, ImageIcon, Type, Music, X, Loader2 } from 'lucide-react';
import { useSubtitleState } from '../../../hooks/useSubtitleState';

export const BulkConfigModal = ({ hook }) => {
  const {
    showConfigModal, setShowConfigModal, processingItems,
    previewTime, setPreviewTime, previewImageUrl,
    voices, submitProcessing
  } = hook;

  const subtitleConfig = useSubtitleState();
  const [activeTab, setActiveTab] = useState('basic'); // 'basic' | 'subtitle' | 'watermark'

  if (!showConfigModal) return null;

  const tabs = [
    { id: 'basic', label: 'Lồng tiếng & Mẫu', icon: <Music size={14} /> },
    { id: 'subtitle', label: 'Phụ đề & Siêu lách', icon: <Sliders size={14} /> },
    { id: 'watermark', label: 'Logo / Watermark', icon: <ImageIcon size={14} /> }
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 animate-in fade-in duration-200 p-4 overflow-y-auto">
      <div className="glass-panel bg-bg-secondary/90 border border-white/10 p-6 rounded-2xl w-full max-w-6xl flex flex-col gap-5 shadow-2xl relative my-auto max-h-[90vh] overflow-hidden">

        {/* Header */}
        <div className="flex justify-between items-center border-b border-white/5 pb-4">
          <div className="flex items-center gap-2.5">
            <Sliders className="text-brand-primary animate-pulse" size={22} />
            <h3 className="text-xl font-bold font-display bg-gradient-to-r from-white to-text-secondary bg-clip-text text-transparent">
              Cấu hình Xử lý Video <span className="text-brand-primary font-mono text-xs font-bold bg-brand-primary/10 px-2.5 py-1 rounded-lg border border-brand-primary/20 ml-2">{processingItems.length} video</span>
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setShowConfigModal(false)}
            className="text-text-secondary hover:text-white p-2 rounded-xl hover:bg-white/5 transition-all cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 h-[600px] min-h-0">
          {/* Left Col: Tabs & Cấu hình (Chiếm 60% = 3/5 cột) */}
          <div className="lg:col-span-3 glass-panel rounded-2xl flex flex-col overflow-hidden bg-bg-primary/20 h-full border border-white/5">
            {/* Profile Selector Banner - Elevated to always be accessible */}
            <div className="px-5 pt-5 pb-0">
              <ProfileSelector config={subtitleConfig} />
            </div>

            {/* Tab Header */}
            <div className="flex border-b border-white/5 bg-bg-secondary/40 px-4 pt-2 gap-2 overflow-x-auto scrollbar-none">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all duration-300 cursor-pointer flex items-center gap-2 pb-3 whitespace-nowrap ${activeTab === tab.id
                    ? "border-brand-primary text-brand-primary"
                    : "border-transparent text-text-secondary hover:text-text-primary"
                    }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Tab Body */}
            <div className="p-5 flex-1 overflow-y-auto min-h-0 bg-bg-secondary/10">
              {activeTab === 'basic' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="bg-bg-primary/40 border border-white/5 rounded-xl p-5 space-y-5">
                    <div>
                      <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">Giọng Lồng Tiếng AI</label>
                      <select
                        className="w-full bg-bg-secondary border border-border-subtle rounded-xl py-3 px-4 text-text-primary focus:outline-none focus:border-brand-primary transition-all duration-200 text-sm cursor-pointer"
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
                      <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 flex justify-between">
                        <span>Âm lượng nhạc nền</span>
                        <span className="text-brand-primary font-mono">{subtitleConfig.volume}%</span>
                      </label>
                      <input
                        type="range"
                        min="0" max="100"
                        value={subtitleConfig.volume}
                        onChange={e => subtitleConfig.setVolume(Number(e.target.value))}
                        className="w-full h-1.5 bg-border-subtle rounded-lg appearance-none cursor-pointer accent-brand-primary mt-2"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'subtitle' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <SubtitleConfigPanel config={subtitleConfig} />
                </div>
              )}

              {activeTab === 'watermark' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <WatermarkConfigPanel config={subtitleConfig} />
                </div>
              )}
            </div>
          </div>

          {/* Right Col: Preview (Chiếm 40% = 2/5 cột) */}
          <div className="lg:col-span-2 flex flex-col gap-4 bg-bg-primary/20 rounded-2xl border border-white/5 p-5 h-full min-h-0 glass-panel">
            <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider flex justify-between items-center">
              <span className="flex items-center gap-1.5"><PlayCircle size={14} className="text-brand-primary animate-pulse" /> Preview</span>
              <span className="text-[10px] text-brand-primary normal-case font-semibold">Kéo thả ô phụ đề để thay đổi vị trí</span>
            </label>

            <div className="flex-1 bg-black/40 rounded-xl overflow-hidden border border-white/5 flex items-center justify-center select-none relative min-h-0 shadow-inner">
              {previewImageUrl ? (
                <InteractiveVideoPreview config={subtitleConfig} className="max-w-full max-h-full h-auto">
                  <img
                    src={previewImageUrl}
                    alt="Preview"
                    className="max-w-full max-h-full object-contain pointer-events-none"
                  />
                </InteractiveVideoPreview>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-text-secondary gap-2 bg-black/20">
                  <Loader2 className="animate-spin text-brand-primary" size={24} />
                  <span className="text-xs font-medium">Đang tải ảnh preview...</span>
                </div>
              )}
            </div>

            {/* Slider chỉnh thời điểm Thumbnail */}
            <div className="bg-bg-primary/40 border border-white/5 rounded-xl p-4 shrink-0">
              <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2.5 flex justify-between items-center">
                <span>Thời điểm ảnh mẫu</span>
                <span className="text-brand-primary font-mono bg-brand-primary/10 px-2 py-0.5 rounded border border-brand-primary/20 text-[11px] font-bold">{previewTime}s</span>
              </label>
              <input
                type="range"
                min="0" max="60"
                value={previewTime}
                onChange={e => setPreviewTime(Number(e.target.value))}
                className="w-full h-1.5 bg-border-subtle rounded-lg appearance-none cursor-pointer accent-brand-primary"
              />
              <p className="text-[10px] text-text-secondary opacity-60 mt-2 leading-relaxed">Kéo thanh trượt để thay đổi thời điểm trích xuất ảnh nền.</p>
            </div>
          </div>
        </div>

        {/* Footer (Sticky) */}
        <div className="flex justify-end gap-3 pt-4 border-t border-white/5 bg-bg-secondary/60 -mx-6 -mb-6 p-6 rounded-b-2xl shrink-0">
          <button
            type="button"
            className="px-5 py-2.5 bg-bg-tertiary hover:bg-border-subtle text-text-primary rounded-xl transition-all border border-white/5 font-semibold text-xs cursor-pointer active:scale-95"
            onClick={() => setShowConfigModal(false)}
          >
            Hủy bỏ
          </button>

          <SaveProfileButton config={subtitleConfig} />

          <button
            type="button"
            className="px-6 py-2.5 bg-gradient-to-r from-brand-primary to-purple-600 hover:opacity-95 text-white rounded-xl font-bold transition-all duration-300 flex items-center gap-1.5 shadow-lg shadow-brand-primary/20 cursor-pointer text-xs active:scale-95"
            onClick={() => submitProcessing(subtitleConfig)}
          >
            <PlayCircle size={15} />
            <span>Xác nhận & Xử lý</span>
          </button>
        </div>

      </div>
    </div>
  );
};
