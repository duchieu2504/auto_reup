import { useState, useEffect, useRef } from 'react';

export const useSubtitleState = (videoId = 'default', initialConfig = {}) => {
  const [voice, setVoice] = useState(initialConfig.voice || 'edge_auto');
  const [volume, setVolume] = useState(initialConfig.volume ?? 10);
  
  // Preview Subtitle Text
  const [previewSubtitleText, setPreviewSubtitleText] = useState(initialConfig.previewSubtitleText || 'Đây là phụ đề mẫu tự động sinh...');
  
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

  // Load from backend API if initialConfig is empty
  useEffect(() => {
    if (Object.keys(initialConfig).length === 0 && videoId && videoId !== 'default') {
      // Reset state to defaults on video change before fetching
      setVoice('edge_auto');
      setVolume(10);
      setPreviewSubtitleText('Đây là phụ đề mẫu tự động sinh...');
      setFlipVideo(false);
      setOptZoom(false);
      setOptColor(false);
      setOptNoise(false);
      setOptPitch(false);
      setSubtitleFont('Liberation Sans');
      setSubtitleStyle('black_white');
      setSubtitleTextColor('#000000');
      setSubtitleBgColor('#ffffff');
      setSubtitleFontSize(8);
      setSubtitleMarginV(40);
      setSubtitleBgPadding(2);
      setSubtitleBgOpacity(100);
      setWatermarkType('none');
      setWatermarkText('');
      setWatermarkImagePreview('');
      setWatermarkX(50);
      setWatermarkY(50);
      setWatermarkSize(20);
      setWatermarkColor('#FFFFFF');
      setWatermarkOpacity(50);
      setEnableSubtitles(true);
      setMaskEnabled(false);
      setMasks([]);
      setActiveMaskId(null);
      setLoadedProfileConfig(null);

      fetch(`http://localhost:8000/api/settings/edit_profile/${videoId}`)
        .then(res => res.json())
        .then(data => {
          if (data && Object.keys(data).length > 0) {
            if (data.voice) setVoice(data.voice);
            if (data.volume !== undefined) setVolume(data.volume);
            if (data.previewSubtitleText) setPreviewSubtitleText(data.previewSubtitleText);
            if (data.flipVideo !== undefined) setFlipVideo(data.flipVideo);
            if (data.optZoom !== undefined) setOptZoom(data.optZoom);
            if (data.optColor !== undefined) setOptColor(data.optColor);
            if (data.optNoise !== undefined) setOptNoise(data.optNoise);
            if (data.optPitch !== undefined) setOptPitch(data.optPitch);
            if (data.subtitleFont) setSubtitleFont(data.subtitleFont);
            if (data.subtitleStyle) setSubtitleStyle(data.subtitleStyle);
            if (data.subtitleTextColor) setSubtitleTextColor(data.subtitleTextColor);
            if (data.subtitleBgColor) setSubtitleBgColor(data.subtitleBgColor);
            if (data.subtitleFontSize !== undefined) setSubtitleFontSize(data.subtitleFontSize);
            if (data.subtitleMarginV !== undefined) setSubtitleMarginV(data.subtitleMarginV);
            if (data.subtitleBgPadding !== undefined) setSubtitleBgPadding(data.subtitleBgPadding);
            if (data.subtitleBgOpacity !== undefined) setSubtitleBgOpacity(data.subtitleBgOpacity);
            if (data.watermarkType) setWatermarkType(data.watermarkType);
            if (data.watermarkText) setWatermarkText(data.watermarkText);
            if (data.watermarkImagePreview) setWatermarkImagePreview(data.watermarkImagePreview);
            if (data.watermarkX !== undefined) setWatermarkX(data.watermarkX);
            if (data.watermarkY !== undefined) setWatermarkY(data.watermarkY);
            if (data.watermarkSize !== undefined) setWatermarkSize(data.watermarkSize);
            if (data.watermarkColor) setWatermarkColor(data.watermarkColor);
            if (data.watermarkOpacity !== undefined) setWatermarkOpacity(data.watermarkOpacity);
            if (data.enableSubtitles !== undefined) setEnableSubtitles(data.enableSubtitles);
            if (data.maskEnabled !== undefined) setMaskEnabled(data.maskEnabled);
            if (data.masks && data.masks.length > 0) {
              setMasks(data.masks);
              setActiveMaskId(data.masks[0].id);
            }
          }
        })
        .catch(err => console.error('Failed to load edit profile from backend:', err));
    }
  }, [videoId]);

  const toggleAllMicroAlterations = () => {
    const newState = !(flipVideo && optZoom && optColor && optNoise && optPitch);
    setFlipVideo(newState);
    setOptZoom(newState);
    setOptColor(newState);
    setOptNoise(newState);
    setOptPitch(newState);
  };

  const lastMoveRef = useRef(0);
  
  const handleMouseMove = (e) => {
    // Throttle to ~30fps to prevent React re-render flooding
    const now = performance.now();
    if (now - lastMoveRef.current < 30) return;
    lastMoveRef.current = now;
    // Find the actual media element (video or img) inside the container
    // to get accurate dimensions for coordinate mapping
    const container = e.currentTarget;
    const mediaEl = container.querySelector('video, img');
    const rect = mediaEl ? mediaEl.getBoundingClientRect() : container.getBoundingClientRect();
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Clamp coordinates to media boundaries
    const clampedX = Math.max(0, Math.min(rect.width, x));
    const clampedY = Math.max(0, Math.min(rect.height, y));
    
    if (isDragging) {
      const percentage = ((rect.height - clampedY) / rect.height) * 100;
      setSubtitleMarginV(Math.round(Math.max(0, Math.min(95, percentage))));
    } else if (isDraggingWatermark) {
      const xPercent = (clampedX / rect.width) * 100;
      const yPercent = (clampedY / rect.height) * 100;
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
    previewSubtitleText,
    watermarkType, watermarkText, watermarkImagePreview,
    watermarkX, watermarkY, watermarkSize, watermarkColor, watermarkOpacity,
    enableSubtitles, maskEnabled, masks
  });
  
  // Auto-save to backend when config changes (with debounce/effect logic implemented where called)
  const saveEditProfile = () => {
    if (!videoId || videoId === 'default') return;
    fetch(`http://localhost:8000/api/settings/edit_profile/${videoId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(getCurrentConfigObj())
    }).catch(err => console.error('Failed to save edit profile to backend:', err));
  };

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
      previewSubtitleText: String(configObj.previewSubtitleText || ''),
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
    previewSubtitleText,
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
    setPreviewSubtitleText,
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
    getCurrentConfigObj,
    saveEditProfile
  };
};
