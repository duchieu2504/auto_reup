import React from 'react';
import { motion } from 'framer-motion';
import { Terminal } from 'lucide-react';

export const TerminalPanel = ({
  progress,
  logs,
  logContainerRef
}) => {
  return (
    <div className="glass-panel p-6 rounded-2xl border border-white/5 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-neon-cyan/5 blur-3xl rounded-full pointer-events-none" />
      
      <div className="flex flex-col gap-5">
        <h3 className="text-xl font-bold tracking-tight font-display bg-gradient-to-r from-white to-text-secondary bg-clip-text text-transparent flex items-center gap-2">
          <Terminal className="text-neon-cyan" size={20} />
          Tiến Trình Render
        </h3>
        
        {/* Progress Bar */}
        <div className="bg-bg-secondary/40 p-4 rounded-xl border border-white/5 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Trạng thái Render</span>
            <span className="text-xs font-bold text-neon-cyan font-mono">{progress.toFixed(1)}%</span>
          </div>
          <div className="h-1.5 bg-bg-secondary border border-white/5 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-neon-cyan to-neon-purple"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
        
        {/* Terminal Window style */}
        <div className="relative rounded-xl overflow-hidden border border-border-subtle shadow-2xl flex flex-col w-full">
          <div className="bg-[#0b0f17] px-4 py-2.5 flex items-center gap-1.5 border-b border-border-subtle/50">
            <span className="w-2.5 h-2.5 rounded-full bg-neon-pink/70"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-neon-green/70"></span>
            <span className="text-[10px] text-text-secondary font-mono font-bold ml-2 tracking-wider">PROCESSOR_CONSOLE.SH</span>
          </div>
          
          <div 
            ref={logContainerRef}
            className="bg-[#04060a] p-5 font-mono text-[12px] overflow-y-auto leading-relaxed shadow-inner text-neon-cyan/90 selection:bg-neon-pink/20 selection:text-white w-full h-[300px]"
          >
            {logs.length === 0 ? (
              <div className="text-text-secondary/50 italic flex items-center gap-2">
                <span className="text-neon-pink animate-pulse">&gt;</span> Hệ thống sẵn sàng...
              </div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="whitespace-pre-wrap py-0.5 border-l-2 border-transparent hover:border-neon-pink/40 hover:bg-white/1 px-2 transition-colors">
                  <span className="text-neon-pink/60 mr-2 select-none">[{index + 1}]</span>
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
