import React from 'react';

export const InteractiveVideoPreview = ({ config, children }) => {
  // `children` can be the <video> or <img> tag passed from the parent.
  return (
    <div 
      className="relative w-full h-auto bg-black rounded-lg overflow-hidden flex items-center justify-center select-none cursor-crosshair group"
      onMouseMove={config.handleMouseMove}
      onMouseUp={config.handleMouseUpOrLeave}
      onMouseLeave={config.handleMouseUpOrLeave}
    >
      {/* Container for the media (Video or Image) */}
      <div 
        className="w-full h-full flex items-center justify-center"
        style={{
          transform: (config.flipVideo ? 'scaleX(-1) ' : '') + (config.optZoom ? 'scale(1.02) ' : '')
        }}
      >
        {children}
      </div>
      
      {/* Overlay Subtitle */}
      <div 
        className={`absolute w-full flex justify-center transition-opacity z-10 pointer-events-auto ${config.isDragging ? 'opacity-50' : 'hover:opacity-90'}`}
        style={{ bottom: config.subtitleMarginV + '%', cursor: 'move' }}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          config.setIsDragging(true);
        }}
      >
        <div
          className="text-center rounded-lg pointer-events-none"
          style={{
            color: config.subtitleTextColor,
            backgroundColor: config.subtitleBgColor + Math.round((config.subtitleBgOpacity / 100) * 255).toString(16).padStart(2, '0').toUpperCase(),
            fontSize: config.subtitleFontSize + 'px',
            padding: `${config.subtitleBgPadding * 3}px ${config.subtitleBgPadding * 5}px`,
            fontWeight: 'bold',
            textShadow: '0px 1px 2px rgba(0,0,0,0.5)',
            userSelect: 'none'
          }}
        >
          Đây là phụ đề mẫu tự động sinh...
        </div>
      </div>

      {/* Overlay Watermark Logo */}
      {config.watermarkType !== 'none' && (
        <div
          className={`absolute z-20 transition-opacity pointer-events-auto ${config.isDraggingWatermark ? 'opacity-50' : 'hover:opacity-90'}`}
          style={{
            left: config.watermarkX + '%',
            top: config.watermarkY + '%',
            transform: 'translate(-50%, -50%)',
            cursor: 'move'
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (config.setIsDraggingWatermark) {
              config.setIsDraggingWatermark(true);
            }
          }}
        >
          {config.watermarkType === 'text' && (
            <div
              className="px-4 py-2 border-2 border-dashed border-white/50 rounded pointer-events-none relative"
              style={{
                color: config.watermarkColor,
                fontSize: config.watermarkSize + 'px',
                fontWeight: 'bold',
                textShadow: '0px 1px 3px rgba(0,0,0,0.8)',
                whiteSpace: 'nowrap',
                opacity: config.watermarkOpacity / 100
              }}
            >
              {config.watermarkText || 'Logo của bạn'}
              <span className="animate-pulse ml-1 border-r-2 border-white absolute right-2 h-3/4 top-[12.5%]"></span>
            </div>
          )}
          {config.watermarkType === 'image' && config.watermarkImagePreview && (
            <div className="border-2 border-dashed border-white/50 rounded pointer-events-none p-1 bg-black/10"
                 style={{ width: `${config.watermarkSize * 3}px`, opacity: config.watermarkOpacity / 100 }}>
              <img 
                src={config.watermarkImagePreview} 
                alt="Watermark" 
                className="w-full h-auto object-contain"
              />
            </div>
          )}
        </div>
      )}
      
      <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm pointer-events-none z-10 space-y-1">
        <div>Sub-Y: {Math.round(config.subtitleMarginV)}%</div>
        {config.watermarkType !== 'none' && (
          <div>Logo: {Math.round(config.watermarkX)}% x {Math.round(config.watermarkY)}%</div>
        )}
      </div>
    </div>
  );
};
