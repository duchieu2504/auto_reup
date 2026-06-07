import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, Download, PlayCircle } from 'lucide-react';
import { useCrawler } from '../context/CrawlerContext';

const Phase1Crawler = () => {
  const { urls, setUrls, isCrawling, logs, progress, startCrawling } = useCrawler();
  const logContainerRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    if (location.state?.presetUrl) {
      setUrls(location.state.presetUrl);
    }
  }, [location.state, setUrls]);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const handleStart = (e) => {
    e.preventDefault();
    startCrawling(urls);
  };

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 rounded-2xl">
        <h3 className="text-xl font-bold mb-6 tracking-tight">Nhập URL Kênh Douyin / TikTok</h3>
        <form onSubmit={handleStart} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Đường dẫn Profile</label>
            <div className="flex gap-4">
              <div className="relative flex-1 group">
                <Search size={18} className="absolute left-4 top-4 text-text-secondary group-focus-within:text-brand-primary transition-colors" />
                <textarea 
                  className="w-full bg-bg-secondary border border-border-subtle rounded-xl py-3 pl-12 pr-4 text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition-all duration-200 resize-none" 
                  placeholder="Nhập 1 hoặc nhiều link (Profile hoặc Video), mỗi link 1 dòng..." 
                  value={urls}
                  onChange={(e) => setUrls(e.target.value)}
                  rows={3}
                />
              </div>
              <button 
                type="submit" 
                className="flex items-center gap-2 bg-brand-primary hover:bg-brand-hover text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed" 
                disabled={isCrawling}
              >
                {isCrawling ? <PlayCircle size={18} className="animate-spin" /> : <Download size={18} />}
                {isCrawling ? 'Đang chạy...' : 'Bắt đầu Cào'}
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="glass-panel p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold tracking-tight">Log Hoạt Động (Live Stream)</h3>
          {isCrawling && (
            <div className="flex items-center gap-3 w-1/3">
              <span className="text-sm font-medium text-brand-primary">{progress}%</span>
              <div className="flex-1 h-2 bg-border-subtle rounded-full overflow-hidden">
                <div 
                  className="h-full bg-brand-primary transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
        <div 
          ref={logContainerRef}
          className="bg-[#010409] border border-border-subtle rounded-xl p-6 font-mono text-sm h-[400px] overflow-y-auto leading-relaxed shadow-inner"
        >
          {logs.length === 0 ? (
            <div className="text-text-secondary italic">Hệ thống đang chờ lệnh...</div>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="whitespace-pre-wrap">{log}</div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Phase1Crawler;
