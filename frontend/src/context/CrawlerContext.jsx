import React, { createContext, useState, useContext, useRef } from 'react';

const CrawlerContext = createContext();

export const CrawlerProvider = ({ children }) => {
  const [url, setUrl] = useState('');
  const [isCrawling, setIsCrawling] = useState(false);
  const [logs, setLogs] = useState(["[System] Đang chờ lệnh mới..."]);
  const eventSourceRef = useRef(null);

  const startCrawling = async (submitUrl) => {
    if (!submitUrl) return;
    
    // Parse multiple URLs
    const urlList = submitUrl.split('\n').map(u => u.trim()).filter(u => u);
    if (urlList.length === 0) return;

    setIsCrawling(true);
    setLogs(["[System] Đang khởi tạo luồng..."]);

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

      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      const eventSource = new EventSource(`http://localhost:8000/api/crawler/stream/${taskId}`);
      eventSourceRef.current = eventSource;
      
      eventSource.onmessage = (event) => {
        const newLog = event.data;
        if (newLog.includes("[DONE]")) {
          setIsCrawling(false);
          eventSource.close();
        } else {
          setLogs(prev => [...prev, newLog]);
        }
      };

      eventSource.onerror = (error) => {
        console.error("SSE Error:", error);
        setLogs(prev => [...prev, "[System] Mất kết nối Stream API."]);
        eventSource.close();
        setIsCrawling(false);
      };

    } catch (error) {
      setLogs(prev => [...prev, `[System Error] ${error.message}`]);
      setIsCrawling(false);
    }
  };

  return (
    <CrawlerContext.Provider value={{ url, setUrl, isCrawling, logs, startCrawling }}>
      {children}
    </CrawlerContext.Provider>
  );
};

export const useCrawler = () => useContext(CrawlerContext);
