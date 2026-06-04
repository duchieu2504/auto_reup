import React, { useRef } from 'react';
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
    <div className="bg-bg-primary border border-border-subtle rounded-xl p-4 mt-4">
      <h3 className="text-white font-medium mb-4 flex items-center gap-2">
        <ImageIcon size={18} className="text-brand-primary" /> Cấu hình Logo / Watermark
      </h3>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 bg-bg-secondary p-1 rounded-lg">
        {[
          { id: 'none', label: 'Không có', icon: <X size={16} /> },
          { id: 'text', label: 'Chữ viết', icon: <Type size={16} /> },
          { id: 'image', label: 'Hình ảnh', icon: <ImageIcon size={16} /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => config.setWatermarkType(tab.id)}
            className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
              config.watermarkType === tab.id 
                ? 'bg-brand-primary text-white shadow-md' 
                : 'text-text-secondary hover:text-white hover:bg-white/5'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {config.watermarkType !== 'none' && (
        <div className="space-y-5 animate-in fade-in slide-in-from-top-2 duration-200">
          
          {config.watermarkType === 'text' && (
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Nội dung Logo chữ</label>
              <input 
                type="text" 
                value={config.watermarkText}
                onChange={e => config.setWatermarkText(e.target.value)}
                placeholder="Ví dụ: @KenhCuaToi"
                className="w-full bg-bg-secondary border border-border-subtle rounded-lg px-3 py-2 text-white focus:outline-none focus:border-brand-primary transition-colors text-sm"
              />
            </div>
          )}

          {config.watermarkType === 'image' && (
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Tải lên Logo ảnh</label>
              <div className="flex gap-3 items-center">
                <input 
                  type="file" 
                  accept=".png,.jpg,.jpeg" 
                  ref={fileInputRef}
                  className="hidden" 
                  onChange={handleImageUpload}
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 bg-bg-secondary hover:bg-border-subtle text-white px-4 py-2 rounded-lg border border-border-subtle transition-colors text-sm"
                >
                  <Upload size={16} /> Chọn Ảnh (PNG/JPG)
                </button>
                {config.watermarkImagePreview && (
                  <div className="h-10 w-10 rounded overflow-hidden border border-border-subtle bg-black/50">
                    <img src={config.watermarkImagePreview} alt="Preview" className="w-full h-full object-contain" />
                  </div>
                )}
              </div>
              <p className="text-xs text-text-secondary mt-2">Gợi ý: Dùng ảnh PNG có nền trong suốt để Logo đẹp nhất. Tối đa 5MB.</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {config.watermarkType === 'text' && (
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Màu chữ</label>
                <div className="flex gap-2">
                  <input 
                    type="color" 
                    value={config.watermarkColor}
                    onChange={e => config.setWatermarkColor(e.target.value)}
                    className="w-8 h-8 rounded border-none cursor-pointer bg-transparent"
                  />
                  <input 
                    type="text"
                    value={config.watermarkColor.toUpperCase()}
                    onChange={e => config.setWatermarkColor(e.target.value)}
                    className="flex-1 bg-bg-secondary border border-border-subtle rounded-lg px-2 text-white text-xs uppercase"
                  />
                </div>
              </div>
            )}
            
            <div className={config.watermarkType === 'image' ? 'col-span-2' : ''}>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                {config.watermarkType === 'text' ? 'Cỡ chữ (px)' : 'Độ lớn (%)'}
              </label>
              <input 
                type="range" 
                min={config.watermarkType === 'text' ? "10" : "5"} 
                max={config.watermarkType === 'text' ? "100" : "100"} 
                value={config.watermarkSize} 
                onChange={e => config.setWatermarkSize(Number(e.target.value))} 
                className="w-full h-2 bg-border-subtle rounded-lg appearance-none cursor-pointer accent-brand-primary mt-2"
              />
            </div>
            
            <div className="col-span-2">
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Độ mờ (Opacity): {config.watermarkOpacity}%
              </label>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={config.watermarkOpacity} 
                onChange={e => config.setWatermarkOpacity(Number(e.target.value))} 
                className="w-full h-2 bg-border-subtle rounded-lg appearance-none cursor-pointer accent-brand-primary mt-2"
              />
            </div>
          </div>
          
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-sm text-blue-200">
            <span className="font-semibold text-blue-400">Mẹo:</span> Kéo thả Logo trực tiếp trên khung Xem Trước Video để điều chỉnh vị trí.
          </div>
        </div>
      )}
    </div>
  );
};
