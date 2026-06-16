import React, { createContext, useState, useContext, useRef } from 'react';

const CrawlerContext = createContext();

export const CrawlerProvider = ({ children }) => {
  const [urls, setUrls] = useState('');
  const [isCrawling, setIsCrawling] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState(null);
  const [logs, setLogs] = useState(["[System] Đang chờ lệnh..."]);
  const [progress, setProgress] = useState(0);
  const eventSourceRef = useRef(null);

  const startCrawling = async (submitUrl) => {
    if (!submitUrl) return;
    
    // Parse multiple URLs
    const urlList = submitUrl.split('\n').map(u => u.trim()).filter(u => u);
    if (!submitUrl.trim()) return;

    setIsCrawling(true);
    setProgress(0);
    setLogs(["[System] Đang khởi tạo tiến trình cào dữ liệu..."]);

    try {
      const res = await fetch('http://localhost:8000/api/crawler/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: urlList })
      });
      
      if (!res.ok) {
        throw new Error("Lỗi khi kết nối đến Backend API");
      }

      const data = await res.json();
      const taskId = data.task_id;
      setActiveTaskId(taskId);

      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      const eventSource = new EventSource(`http://localhost:8000/api/crawler/stream/${taskId}`);
      eventSourceRef.current = eventSource;
      
      eventSource.onmessage = (event) => {
        const newLog = event.data;
        if (newLog.includes("[DONE]")) {
          setIsCrawling(false);
          setProgress(100);
          setActiveTaskId(null);
          eventSource.close();
        } else {
          try {
            const parsed = JSON.parse(newLog);
            if (parsed.progress !== undefined) {
              setProgress(parsed.progress);
            }
            if (parsed.log) {
              setLogs(prev => [...prev, parsed.log]);
            }
          } catch (e) {
            setLogs(prev => [...prev, newLog]);
          }
        }
      };

      eventSource.onerror = (error) => {
        console.error("SSE Error:", error);
        setLogs(prev => [...prev, "[System] Mất kết nối Stream API."]);
        eventSource.close();
        setIsCrawling(false);
        setActiveTaskId(null);
      };

    } catch (error) {
      setLogs(prev => [...prev, `[System Error] ${error.message}`]);
      setIsCrawling(false);
      setActiveTaskId(null);
    }
  };

  const stopCrawling = async () => {
    if (!activeTaskId) return;
    try {
      const res = await fetch(`http://localhost:8000/api/crawler/stop/${activeTaskId}`, {
        method: 'POST'
      });
      const data = await res.json();
      if (res.ok) {
        setLogs(prev => [...prev, "[System] Đang gửi yêu cầu hủy tiến trình cào..."]);
      } else {
        setLogs(prev => [...prev, `[System Error] Không thể hủy: ${data.detail || "Lỗi hệ thống"}`]);
      }
    } catch (error) {
      setLogs(prev => [...prev, `[System Error] Lỗi kết nối: ${error.message}`]);
    }
  };

  return (
    <CrawlerContext.Provider value={{ urls, setUrls, isCrawling, logs, progress, startCrawling, stopCrawling }}>
      {children}
    </CrawlerContext.Provider>
  );
};

export const useCrawler = () => useContext(CrawlerContext);
