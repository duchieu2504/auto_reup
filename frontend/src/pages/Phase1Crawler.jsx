import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Download, PlayCircle, Terminal, Cpu } from 'lucide-react';
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

  const pageVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4, ease: "easeOut" }
    }
  };

  return (
    <motion.div 
      variants={pageVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Input Form Panel */}
      <div className="glass-panel p-6 rounded-2xl border border-white/5 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-24 h-24 bg-neon-purple/5 blur-2xl rounded-full pointer-events-none" />
        
        <h3 className="text-xl font-bold mb-5 tracking-tight font-display bg-gradient-to-r from-white to-text-secondary bg-clip-text text-transparent flex items-center gap-2">
          <Download className="text-neon-purple" size={20} />
          Nhập URL Kênh Douyin / TikTok
        </h3>
        
        <form onSubmit={handleStart} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">Đường dẫn Profile hoặc Video</label>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1 group">
                <Search size={18} className="absolute left-4 top-4 text-text-secondary group-focus-within:text-neon-purple transition-colors" />
                <textarea 
                  className="w-full bg-bg-secondary/60 border border-border-subtle rounded-xl py-3 pl-12 pr-4 text-text-primary focus:outline-none focus:ring-2 focus:ring-neon-purple/50 focus:border-neon-purple/40 transition-all duration-300 resize-none font-medium text-sm placeholder:text-text-secondary/50" 
                  placeholder="Nhập 1 hoặc nhiều link (Profile hoặc Video), mỗi link 1 dòng..." 
                  value={urls}
                  onChange={(e) => setUrls(e.target.value)}
                  rows={3}
                />
              </div>
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit" 
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-neon-purple to-neon-pink hover:opacity-95 text-white px-7 py-3 rounded-xl font-semibold transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_15px_rgba(168,85,247,0.3)] cursor-pointer h-fit sm:self-end" 
                disabled={isCrawling}
              >
                {isCrawling ? <PlayCircle size={18} className="animate-spin text-white" /> : <Cpu size={18} />}
                <span>{isCrawling ? 'Đang chạy...' : 'Bắt đầu Cào'}</span>
              </motion.button>
            </div>
          </div>
        </form>
      </div>

      {/* Terminal Log Panel */}
      <div className="glass-panel p-6 rounded-2xl border border-white/5 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
          <h3 className="text-xl font-bold tracking-tight font-display bg-gradient-to-r from-white to-text-secondary bg-clip-text text-transparent flex items-center gap-2">
            <Terminal className="text-neon-cyan" size={20} />
            Log Hoạt Động (Live Stream)
          </h3>
          
          <AnimatePresence>
            {isCrawling && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center gap-3 w-full sm:w-64"
              >
                <span className="text-xs font-bold text-neon-cyan font-mono">{progress}%</span>
                <div className="flex-1 h-1.5 bg-bg-secondary border border-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-neon-cyan to-neon-purple"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Terminal Window style */}
        <div className="relative rounded-xl overflow-hidden border border-border-subtle shadow-2xl">
          {/* Mac-like Header dots */}
          <div className="bg-[#0b0f17] px-4 py-2.5 flex items-center gap-1.5 border-b border-border-subtle/50">
            <span className="w-2.5 h-2.5 rounded-full bg-neon-pink/70"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-neon-green/70"></span>
            <span className="text-[10px] text-text-secondary font-mono font-bold ml-2 tracking-wider">CRAWLER_CONSOLE.SH</span>
          </div>
          
          <div 
            ref={logContainerRef}
            className="bg-[#04060a] p-6 font-mono text-[13px] h-[400px] overflow-y-auto leading-relaxed shadow-inner text-neon-cyan/90 selection:bg-neon-purple/20 selection:text-white"
          >
            {logs.length === 0 ? (
              <div className="text-text-secondary/50 italic flex items-center gap-2">
                <span className="text-neon-purple animate-pulse">&gt;</span> Hệ thống đang sẵn sàng, vui lòng nhập URL và nhấn cào...
              </div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="whitespace-pre-wrap py-0.5 border-l-2 border-transparent hover:border-neon-purple/40 hover:bg-white/1 px-2 transition-colors">
                  <span className="text-neon-purple/60 mr-2 select-none">[{index + 1}]</span>
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Phase1Crawler;
