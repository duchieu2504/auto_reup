import React from 'react';
import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';

const Header = ({ title }) => {
  return (
    <header className="h-[70px] px-8 flex items-center justify-between border-b border-border-subtle bg-bg-secondary/40 backdrop-blur-xl sticky top-0 z-30">
      <motion.h1 
        key={title}
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="text-xl font-bold tracking-tight bg-gradient-to-r from-text-primary to-text-secondary bg-clip-text text-transparent font-display"
      >
        {title}
      </motion.h1>
      
      <motion.div 
        whileHover={{ scale: 1.05 }}
        className="flex items-center gap-2.5 text-xs font-semibold text-neon-green px-3.5 py-2 rounded-full bg-neon-green/10 border border-neon-green/20 shadow-[0_0_15px_rgba(16,185,129,0.05)] cursor-default transition-all duration-300"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-green opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-neon-green"></span>
        </span>
        <Activity size={14} className="animate-pulse" />
        HỆ THỐNG TRỰC TUYẾN
      </motion.div>
    </header>
  );
};

export default Header;
