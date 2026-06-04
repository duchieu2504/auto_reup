import React, { createContext, useState, useContext, useRef } from 'react';

const ProcessorContext = createContext();

export const ProcessorProvider = ({ children }) => {
  const [videoPath, setVideoPath] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState(["[System] Đang chờ lệnh xử lý..."]);
  const eventSourceRef = useRef(null);

  const startProcessing = async (submitPath, options = {}) => {
    if (!submitPath) return;
    setIsProcessing(true);
    setLogs(["[System] Đang khởi tạo luồng xử lý..."]);

    try {
      const pathsArray = Array.isArray(submitPath) ? submitPath : submitPath.split('\n').map(p => p.trim()).filter(p => p);
      if (pathsArray.length === 0) return;

      let finalWatermarkImagePath = options.subConfig?.watermarkImagePreview || '';
      
      if (options.subConfig?.watermarkType === 'image' && options.subConfig?.watermarkImageFile) {
        const formData = new FormData();
        formData.append('file', options.subConfig.watermarkImageFile);
        
        try {
          const uploadRes = await fetch('http://localhost:8000/api/processor/upload-logo', {
            method: 'POST',
            body: formData
          });
          if (uploadRes.ok) {
            const uploadData = await uploadRes.json();
            finalWatermarkImagePath = uploadData.path;
          } else {
            setLogs(prev => [...prev, "[!] Lỗi khi tải lên ảnh Logo!"]);
            setIsProcessing(false);
            return;
          }
        } catch (error) {
          setLogs(prev => [...prev, `[!] Lỗi upload ảnh: ${error.message}`]);
          setIsProcessing(false);
          return;
        }
      }

      const res = await fetch('http://localhost:8000/api/processor/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          video_paths: pathsArray,
          voice_mode: options.voiceMode || 'edge_auto',
          bg_volume: options.bgVolume !== undefined ? options.bgVolume : 10,
          flip_video: options.flipVideo || false,
          opt_zoom: options.optZoom || false,
          opt_color: options.optColor || false,
          opt_noise: options.optNoise || false,
          opt_pitch: options.optPitch || false,
          subtitle_style: options.subConfig?.style || 'black_white',
          subtitle_text_color: options.subConfig?.textColor || '#000000',
          subtitle_bg_color: options.subConfig?.bgColor || '#ffffff',
          subtitle_font_size: options.subConfig?.fontSize || 20,
          subtitle_margin_v: options.subConfig?.marginV || 40,
          subtitle_bg_padding: options.subConfig?.bgPadding || 2,
          subtitle_bg_opacity: options.subConfig?.bgOpacity || 100,
          watermark_type: options.subConfig?.watermarkType || 'none',
          watermark_text: options.subConfig?.watermarkText || '',
          watermark_image_path: finalWatermarkImagePath,
          watermark_x: options.subConfig?.watermarkX ?? 50.0,
          watermark_y: options.subConfig?.watermarkY ?? 50.0,
          watermark_size: options.subConfig?.watermarkSize ?? 20.0,
          watermark_color: options.subConfig?.watermarkColor || '#FFFFFF',
          watermark_opacity: options.subConfig?.watermarkOpacity ?? 50.0
        })
      });
      
      if (!res.ok) {
        throw new Error("Lỗi kết nối Backend API Processor");
      }

      const data = await res.json();
      const taskId = data.task_id;

      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      const eventSource = new EventSource(`http://localhost:8000/api/processor/stream/${taskId}`);
      eventSourceRef.current = eventSource;
      
      eventSource.onmessage = (event) => {
        const newLog = event.data;
        if (newLog.includes("[DONE]")) {
          setIsProcessing(false);
          eventSource.close();
        } else {
          setLogs(prev => [...prev, newLog]);
        }
      };

      eventSource.onerror = (error) => {
        console.error("SSE Error:", error);
        setLogs(prev => [...prev, "[System] Mất kết nối Stream API."]);
        eventSource.close();
        setIsProcessing(false);
      };

    } catch (error) {
      setLogs(prev => [...prev, `[System Error] ${error.message}`]);
      setIsProcessing(false);
    }
  };

  return (
    <ProcessorContext.Provider value={{ videoPath, setVideoPath, isProcessing, logs, startProcessing }}>
      {children}
    </ProcessorContext.Provider>
  );
};

export const useProcessor = () => useContext(ProcessorContext);
