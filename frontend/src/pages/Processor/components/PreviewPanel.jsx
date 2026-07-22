import React from 'react';
import { PlayCircle, Loader2 } from 'lucide-react';
import { InteractiveVideoPreview } from '../../../components/subtitle/InteractiveVideoPreview';

export const PreviewPanel = ({
  previewVideoPath,
  subtitleState,
  aspectRatio,
  setAspectRatio,
  ffmpegPreviewUrl,
  isGeneratingPreview
}) => {
  return (
    <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-white/5 relative overflow-hidden flex flex-col justify-between gap-6">
      <div className="flex flex-col gap-5 flex-1">
        <h3 className="text-xl font-bold tracking-tight font-display bg-gradient-to-r from-white to-text-secondary bg-clip-text text-transparent flex items-center gap-2">
          <PlayCircle className="text-neon-pink" size={20} />
          Xem Trước Video & Phụ Đề
        </h3>
        
        <div className="bg-bg-secondary/40 border border-border-subtle rounded-2xl p-4 flex-1 flex items-center justify-center min-h-[300px] relative overflow-hidden">
          <div className="absolute inset-4 flex items-center justify-center">
            {previewVideoPath ? (
              <InteractiveVideoPreview config={subtitleState} aspectRatio={aspectRatio} className="max-w-full max-h-full" isFfmpegPreview={!!ffmpegPreviewUrl}>
                {ffmpegPreviewUrl ? (
                  <img
                    src={ffmpegPreviewUrl}
                    alt="Preview"
                    className={`max-w-full max-h-full block pointer-events-none object-contain transition-opacity duration-300 ${isGeneratingPreview ? 'opacity-50' : 'opacity-100'}`}
                    onLoad={(e) => setAspectRatio(e.target.naturalWidth / e.target.naturalHeight)}
                  />
                ) : (
                  <video 
                    src={`http://localhost:8000/api/files/${(previewVideoPath || '').replace(/\\/g, '/').replace(/^.*?(?:^|\/)data\//, '').split('/').map(encodeURIComponent).join('/')}`}
                    controls
                    className="max-w-full max-h-full block rounded-lg shadow-lg"
                    onLoadedMetadata={(e) => setAspectRatio(e.target.videoWidth / e.target.videoHeight)}
                  />
                )}
                
                {isGeneratingPreview && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-black/30 backdrop-blur-[2px] rounded-xl z-10">
                    <Loader2 className="animate-spin text-brand-primary mb-2" size={24} />
                    <span className="text-xs font-semibold drop-shadow-md">Đang cập nhật ảnh mẫu thực tế...</span>
                  </div>
                )}
              </InteractiveVideoPreview>
            ) : (
              <div className="w-full aspect-video bg-bg-secondary/20 rounded-lg flex flex-col items-center justify-center text-text-secondary border border-dashed border-border-subtle p-6 select-none">
                <PlayCircle size={36} className="opacity-20 mb-2 text-neon-pink animate-pulse" />
                <p className="text-sm font-semibold">Chưa có video được chọn</p>
                <p className="text-xs text-text-tertiary mt-1">Chọn 1 video từ Crawler hoặc Upload để xem trước phụ đề</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
