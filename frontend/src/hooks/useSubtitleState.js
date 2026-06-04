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
  const [subtitleFontSize, setSubtitleFontSize] = useState(initialConfig.subtitleFontSize ?? 18);
  const [subtitleMarginV, setSubtitleMarginV] = useState(initialConfig.subtitleMarginV ?? 40);
  const [subtitleBgPadding, setSubtitleBgPadding] = useState(initialConfig.subtitleBgPadding ?? 15);
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

  return {
    // State values
    voice, volume,
    flipVideo, optZoom, optColor, optNoise, optPitch,
    subtitleFont, subtitleStyle, subtitleTextColor, subtitleBgColor,
    subtitleFontSize, subtitleMarginV, subtitleBgPadding, subtitleBgOpacity,
    // Watermark State values
    watermarkType, watermarkText, watermarkImageFile, watermarkImagePreview,
    watermarkX, watermarkY, watermarkSize, watermarkColor, watermarkOpacity,
    isDragging, isDraggingWatermark,
    
    // Setters
    setVoice, setVolume,
    setFlipVideo, setOptZoom, setOptColor, setOptNoise, setOptPitch,
    setSubtitleFont, setSubtitleStyle, setSubtitleTextColor, setSubtitleBgColor,
    setSubtitleFontSize, setSubtitleMarginV, setSubtitleBgPadding, setSubtitleBgOpacity,
    setWatermarkType, setWatermarkText, setWatermarkImageFile, setWatermarkImagePreview,
    setWatermarkX, setWatermarkY, setWatermarkSize, setWatermarkColor, setWatermarkOpacity,
    setIsDragging, setIsDraggingWatermark,

    // Handlers
    toggleAllMicroAlterations,
    handleMouseMove,
    handleMouseUpOrLeave
  };
};
