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

      const res = await fetch('http://localhost:8000/api/processor/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          video_paths: pathsArray,
          voice_mode: options.voiceMode || 'edge_auto',
          bg_volume: options.bgVolume !== undefined ? options.bgVolume : 10,
          flip_video: options.flipVideo || false
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
