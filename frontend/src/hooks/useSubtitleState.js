import { useState } from 'react';

export const useSubtitleState = (initialConfig = {}) => {
  const [voice, setVoice] = useState(initialConfig.voice || 'edge_auto');
  const [volume, setVolume] = useState(initialConfig.volume ?? 10);
  
  // Micro-alterations
  const [flipVideo, setFlipVideo] = useState(initialConfig.flipVideo || false);
  const [optZoom, setOptZoom] = useState(initialConfig.optZoom || false);
  const [optColor, setOptColor] = useState(initialConfig.optColor || false);
  const [optNoise, setOptNoise] = useState(initialConfig.optNoise || false);
  const [optPitch, setOptPitch] = useState(initialConfig.optPitch || false);
  
  // Subtitle custom params
  const [subtitleFont, setSubtitleFont] = useState(initialConfig.subtitleFont || 'Liberation Sans');
  const [subtitleStyle, setSubtitleStyle] = useState(initialConfig.subtitleStyle || 'black_white');
  const [subtitleTextColor, setSubtitleTextColor] = useState(initialConfig.subtitleTextColor || '#000000');
  const [subtitleBgColor, setSubtitleBgColor] = useState(initialConfig.subtitleBgColor || '#ffffff');
  const [subtitleFontSize, setSubtitleFontSize] = useState(initialConfig.subtitleFontSize ?? 8);
  const [subtitleMarginV, setSubtitleMarginV] = useState(initialConfig.subtitleMarginV ?? 40);
  const [subtitleBgPadding, setSubtitleBgPadding] = useState(initialConfig.subtitleBgPadding ?? 2);
  const [subtitleBgOpacity, setSubtitleBgOpacity] = useState(initialConfig.subtitleBgOpacity ?? 100);
  
  // Watermark params
  const [watermarkType, setWatermarkType] = useState(initialConfig.watermarkType || 'none');
  const [watermarkText, setWatermarkText] = useState(initialConfig.watermarkText || '');
  const [watermarkImageFile, setWatermarkImageFile] = useState(null);
  const [watermarkImagePreview, setWatermarkImagePreview] = useState(initialConfig.watermarkImagePreview || '');
  const [watermarkX, setWatermarkX] = useState(initialConfig.watermarkX ?? 50); // percentage 0-100
  const [watermarkY, setWatermarkY] = useState(initialConfig.watermarkY ?? 50); // percentage 0-100
  const [watermarkSize, setWatermarkSize] = useState(initialConfig.watermarkSize ?? 20);
  const [watermarkColor, setWatermarkColor] = useState(initialConfig.watermarkColor || '#FFFFFF');
  const [watermarkOpacity, setWatermarkOpacity] = useState(initialConfig.watermarkOpacity ?? 50);
  
  // Subtitle toggles & Logo masking params
  const [enableSubtitles, setEnableSubtitles] = useState(initialConfig.enableSubtitles ?? true);
  const [maskEnabled, setMaskEnabled] = useState(initialConfig.maskEnabled ?? false);
  const [masks, setMasks] = useState(() => {
    if (initialConfig.masks) return initialConfig.masks;
    if (initialConfig.maskEnabled) {
      return [{
        id: 1,
        x: initialConfig.maskX ?? 10,
        y: initialConfig.maskY ?? 10,
        width: initialConfig.maskWidth ?? 20,
        height: initialConfig.maskHeight ?? 15,
        type: initialConfig.maskType || 'color',
        color: initialConfig.maskColor || '#000000'
      }];
    }
    return [];
  });
  const [activeMaskId, setActiveMaskId] = useState(() => {
    if (initialConfig.masks && initialConfig.masks.length > 0) return initialConfig.masks[0].id;
    if (initialConfig.maskEnabled) return 1;
    return null;
  });

  const addMask = () => {
    const newMask = {
      id: Date.now(),
      x: 10,
      y: 10,
      width: 20,
      height: 15,
      type: 'color',
      color: '#000000'
    };
    setMasks(prev => [...prev, newMask]);
    setActiveMaskId(newMask.id);
    setMaskEnabled(true);
  };

  const removeMask = (id) => {
    setMasks(prev => {
      const filtered = prev.filter(m => m.id !== id);
      if (filtered.length === 0) {
        setMaskEnabled(false);
      }
      return filtered;
    });
    setActiveMaskId(prev => {
      const remaining = masks.filter(m => m.id !== id);
      return remaining.length > 0 ? remaining[0].id : null;
    });
  };

  const updateMask = (id, updates) => {
    setMasks(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  // Interactive preview state
  const [isDragging, setIsDragging] = useState(false);
  const [isDraggingWatermark, setIsDraggingWatermark] = useState(false);

  const toggleAllMicroAlterations = () => {
    const newState = !(flipVideo && optZoom && optColor && optNoise && optPitch);
    setFlipVideo(newState);
    setOptZoom(newState);
    setOptColor(newState);
    setOptNoise(newState);
    setOptPitch(newState);
  };

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (isDragging) {
      const percentage = ((rect.height - y) / rect.height) * 100;
      setSubtitleMarginV(Math.round(Math.max(5, Math.min(95, percentage))));
    } else if (isDraggingWatermark) {
      const xPercent = (x / rect.width) * 100;
      const yPercent = (y / rect.height) * 100;
      setWatermarkX(Math.round(Math.max(0, Math.min(100, xPercent))));
      setWatermarkY(Math.round(Math.max(0, Math.min(100, yPercent))));
    }
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
    setIsDraggingWatermark(false);
  };

  const [loadedProfileConfig, setLoadedProfileConfig] = useState(null);

  const subConfig = {
    font: subtitleFont,
    style: subtitleStyle,
    textColor: subtitleTextColor,
    bgColor: subtitleBgColor,
    fontSize: subtitleFontSize,
    marginV: subtitleMarginV,
    bgPadding: subtitleBgPadding,
    bgOpacity: subtitleBgOpacity,
    watermarkType,
    watermarkText,
    watermarkImageFile,
    watermarkImagePreview,
    watermarkX,
    watermarkY,
    watermarkSize,
    watermarkColor,
    watermarkOpacity,
    enableSubtitles,
    maskEnabled,
    masks
  };

  const getCurrentConfigObj = () => ({
    voice, volume, flipVideo, optZoom, optColor, optNoise, optPitch,
    subtitleFont, subtitleStyle, subtitleTextColor, subtitleBgColor,
    subtitleFontSize, subtitleMarginV, subtitleBgPadding, subtitleBgOpacity,
    watermarkType, watermarkText, watermarkImagePreview,
    watermarkX, watermarkY, watermarkSize, watermarkColor, watermarkOpacity,
    enableSubtitles, maskEnabled, masks
  });

  const normalizeConfig = (configObj) => {
    if (!configObj) return null;
    return {
      voice: String(configObj.voice || ''),
      volume: String(configObj.volume || ''),
      flipVideo: Boolean(configObj.flipVideo),
      optZoom: Boolean(configObj.optZoom),
      optColor: Boolean(configObj.optColor),
      optNoise: Boolean(configObj.optNoise),
      optPitch: Boolean(configObj.optPitch),
      subtitleFont: String(configObj.subtitleFont || ''),
      subtitleStyle: String(configObj.subtitleStyle || ''),
      subtitleTextColor: String(configObj.subtitleTextColor || ''),
      subtitleBgColor: String(configObj.subtitleBgColor || ''),
      subtitleFontSize: String(configObj.subtitleFontSize || ''),
      subtitleMarginV: String(configObj.subtitleMarginV || ''),
      subtitleBgPadding: String(configObj.subtitleBgPadding || ''),
      subtitleBgOpacity: String(configObj.subtitleBgOpacity || ''),
      watermarkType: String(configObj.watermarkType || ''),
      watermarkText: String(configObj.watermarkText || ''),
      watermarkImagePreview: String(configObj.watermarkImagePreview || ''),
      watermarkX: String(configObj.watermarkX || ''),
      watermarkY: String(configObj.watermarkY || ''),
      watermarkSize: String(configObj.watermarkSize || ''),
      watermarkColor: String(configObj.watermarkColor || ''),
      watermarkOpacity: String(configObj.watermarkOpacity || ''),
      enableSubtitles: Boolean(configObj.enableSubtitles),
      maskEnabled: Boolean(configObj.maskEnabled),
      masks: Array.isArray(configObj.masks) ? configObj.masks.map(m => ({
        id: m.id,
        x: Number(m.x),
        y: Number(m.y),
        width: Number(m.width),
        height: Number(m.height),
        type: String(m.type),
        color: String(m.color)
      })) : []
    };
  };

  const isDirty = loadedProfileConfig 
    ? JSON.stringify(normalizeConfig(loadedProfileConfig)) !== JSON.stringify(normalizeConfig(getCurrentConfigObj())) 
    : true;

  return {
    // State values
    voice, volume,
    flipVideo, optZoom, optColor, optNoise, optPitch,
    subtitleFont, subtitleStyle, subtitleTextColor, subtitleBgColor,
    subtitleFontSize, subtitleMarginV, subtitleBgPadding, subtitleBgOpacity,
    // Watermark State values
    watermarkType, watermarkText, watermarkImageFile, watermarkImagePreview,
    watermarkX, watermarkY, watermarkSize, watermarkColor, watermarkOpacity,
    // Logo mask & subtitle toggle states
    enableSubtitles, maskEnabled, masks, activeMaskId,
    isDragging, isDraggingWatermark,
    subConfig,
    
    // Dirty tracking
    loadedProfileConfig, isDirty,
    
    // Setters
    setVoice, setVolume,
    setFlipVideo, setOptZoom, setOptColor, setOptNoise, setOptPitch,
    setSubtitleFont, setSubtitleStyle, setSubtitleTextColor, setSubtitleBgColor,
    setSubtitleFontSize, setSubtitleMarginV, setSubtitleBgPadding, setSubtitleBgOpacity,
    setWatermarkType, setWatermarkText, setWatermarkImageFile, setWatermarkImagePreview,
    setWatermarkX, setWatermarkY, setWatermarkSize, setWatermarkColor, setWatermarkOpacity,
    setEnableSubtitles, setMaskEnabled, setMasks, setActiveMaskId,
    addMask, removeMask, updateMask,
    setIsDragging, setIsDraggingWatermark,
    setLoadedProfileConfig,

    // Handlers
    toggleAllMicroAlterations,
    handleMouseMove,
    handleMouseUpOrLeave,
    getCurrentConfigObj
  };
};
