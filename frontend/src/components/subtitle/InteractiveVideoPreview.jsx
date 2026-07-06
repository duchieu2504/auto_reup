import React from 'react';

export const InteractiveVideoPreview = ({ config, children, className = "w-full h-auto", aspectRatio }) => {
  const handleBoxMouseDown = (e, mask) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (config.setActiveMaskId) {
      config.setActiveMaskId(mask.id);
    }
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startMaskX = mask.x;
    const startMaskY = mask.y;
    
    // Get container size
    const container = e.currentTarget.parentElement;
    const rect = container.getBoundingClientRect();
    
    const handleMouseMove = (moveEvent) => {
      const deltaX = ((moveEvent.clientX - startX) / rect.width) * 100;
      const deltaY = ((moveEvent.clientY - startY) / rect.height) * 100;
      
      const newX = Math.max(0, Math.min(100 - mask.width, startMaskX + deltaX));
      const newY = Math.max(0, Math.min(100 - mask.height, startMaskY + deltaY));
      
      if (config.updateMask) {
        config.updateMask(mask.id, {
          x: Math.round(newX),
          y: Math.round(newY)
        });
      }
    };
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleResizeMouseDown = (e, mask) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (config.setActiveMaskId) {
      config.setActiveMaskId(mask.id);
    }
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = mask.width;
    const startHeight = mask.height;
    
    // Get container size
    const container = e.currentTarget.parentElement.parentElement;
    const rect = container.getBoundingClientRect();
    
    const handleMouseMove = (moveEvent) => {
      const deltaWidth = ((moveEvent.clientX - startX) / rect.width) * 100;
      const deltaHeight = ((moveEvent.clientY - startY) / rect.height) * 100;
      
      const newWidth = Math.max(5, Math.min(100 - mask.x, startWidth + deltaWidth));
      const newHeight = Math.max(5, Math.min(100 - mask.y, startHeight + deltaHeight));
      
      if (config.updateMask) {
        config.updateMask(mask.id, {
          width: Math.round(newWidth),
          height: Math.round(newHeight)
        });
      }
    };
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div 
      className={`relative bg-black rounded-lg overflow-hidden select-none cursor-crosshair group ${className}`}
      style={{
         ...(aspectRatio ? {
           aspectRatio: `${aspectRatio}`,
           width: 'auto',
           height: 'auto',
           maxWidth: '100%',
           maxHeight: '100%',
           display: 'flex',
           alignItems: 'center',
           justifyContent: 'center',
           margin: '0 auto'
         } : {})
      }}
      onMouseMove={config.handleMouseMove}
      onMouseUp={config.handleMouseUpOrLeave}
      onMouseLeave={config.handleMouseUpOrLeave}
    >
      {/* Container for the media (Video or Image) */}
      <div 
        className={`flex items-center justify-center max-w-full max-h-full ${config.isDragging ? 'pointer-events-none' : ''}`}
        style={{
          ...(aspectRatio ? { width: '100%', height: '100%' } : { width: 'fit-content', height: 'fit-content' }),
          transform: (config.flipVideo ? 'scaleX(-1) ' : '') + (config.optZoom ? 'scale(1.02) ' : '')
        }}
      >
        {children}
      </div>
      
      {/* Overlay Subtitle */}
      {config.enableSubtitles && (() => {
        const styleId = config.subtitleStyle || 'classic';
        const isNeon = styleId === 'neon';
        const isCloud = styleId === 'cloud';
        const isRounded = styleId === 'rounded';
        
        let br = '4px';
        if (isRounded) br = '16px';
        if (isCloud) br = '20px 30px 25px 35px / 30px 20px 35px 25px';
        
        const bgColorHex = config.subtitleBgColor + Math.round((config.subtitleBgOpacity / 100) * 255).toString(16).padStart(2, '0').toUpperCase();
        
        return (
        <div 
          className={`absolute w-full flex justify-center transition-opacity z-50 pointer-events-auto ${config.isDragging ? 'opacity-50' : 'hover:opacity-90'}`}
          style={{ bottom: config.subtitleMarginV + '%', cursor: 'move' }}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            config.setIsDragging(true);
          }}
        >
          <div
            className="text-center pointer-events-none relative"
            style={{
              color: config.subtitleTextColor,
              backgroundColor: isNeon ? 'transparent' : bgColorHex,
              fontSize: config.subtitleFontSize + 'px',
              padding: `${config.subtitleBgPadding * 3}px ${config.subtitleBgPadding * 5}px`,
              textShadow: isNeon ? 'none' : '0px 1px 2px rgba(0,0,0,0.5)',
              userSelect: 'none',
              borderRadius: br,
              boxShadow: isNeon ? `0 0 10px ${config.subtitleBgColor}, inset 0 0 10px ${config.subtitleBgColor}` : 'none',
              border: isNeon ? `2px solid ${config.subtitleBgColor}` : 'none',
            }}
          >
            {isNeon && (
               <div style={{
                 position: 'absolute', inset: 0, 
                 backgroundColor: config.subtitleBgColor, opacity: config.subtitleBgOpacity / 100, 
                 borderRadius: br, zIndex: 0, filter: 'blur(8px)'
               }}></div>
            )}
            <span style={{ position: 'relative', zIndex: 1, textShadow: isNeon ? `0 0 8px ${config.subtitleBgColor}` : 'none' }}>
              {config.previewSubtitleText || 'Đây là phụ đề mẫu tự động sinh...'}
            </span>
          </div>
        </div>
        );
      })()}

      {/* Overlay Logo Masks */}
      {config.maskEnabled && (config.masks || []).map((mask, index) => {
        const isActive = mask.id === config.activeMaskId;
        return (
          <div
            key={mask.id}
            style={{
              left: `${mask.x}%`,
              top: `${mask.y}%`,
              width: `${mask.width}%`,
              height: `${mask.height}%`,
              position: 'absolute',
              border: isActive ? '2px dashed #EC4899' : '2px dashed rgba(236, 72, 153, 0.4)',
              backgroundColor: mask.type === 'color' 
                ? mask.color 
                : 'rgba(236, 72, 153, 0.15)',
              backdropFilter: mask.type === 'blur' ? 'blur(8px)' : 'none',
              cursor: 'move',
              zIndex: isActive ? 35 : 30,
              boxSizing: 'border-box'
            }}
            onMouseDown={(e) => handleBoxMouseDown(e, mask)}
          >
            <div className={`absolute top-1 left-1 bg-black/70 text-white text-[9px] px-1 rounded pointer-events-none select-none font-mono ${isActive ? 'ring-1 ring-[#EC4899]' : ''}`}>
              #{index + 1} {mask.type === 'color' ? 'Màu' : mask.type === 'blur' ? 'Mờ' : 'Nhiễu'} ({Math.round(mask.width)}x{Math.round(mask.height)})
            </div>
            
            {isActive && (
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  backgroundColor: '#EC4899',
                  position: 'absolute',
                  right: '-6px',
                  bottom: '-6px',
                  cursor: 'se-resize',
                  borderRadius: '50%',
                  zIndex: 36
                }}
                onMouseDown={(e) => handleResizeMouseDown(e, mask)}
              />
            )}
          </div>
        );
      })}

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
        {config.enableSubtitles && (
          <div>Sub-Y: {Math.round(config.subtitleMarginV)}%</div>
        )}
        {config.watermarkType !== 'none' && (
          <div>Logo: {Math.round(config.watermarkX)}% x {Math.round(config.watermarkY)}%</div>
        )}
        {config.maskEnabled && config.masks && config.masks.length > 0 && (
          <div>Che: {config.masks.length} vùng</div>
        )}
      </div>
    </div>
  );
};
