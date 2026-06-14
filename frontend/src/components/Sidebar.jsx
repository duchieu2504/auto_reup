import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, DownloadCloud, FileVideo, Settings, Video, History, Compass, Users, CalendarClock, ShieldCheck, Bot, ChevronLeft, ChevronRight } from 'lucide-react';

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const getLinkStyle = (isActive) => {
    const base = `flex items-center ${isCollapsed ? 'justify-center w-12 h-12 p-0' : 'gap-3 px-4 py-3'} rounded-xl font-medium transition-all duration-300 overflow-hidden whitespace-nowrap`;

    if (isActive) {
      return `${base} text-white bg-gradient-to-r from-neon-purple/20 to-neon-pink/20 border border-neon-purple/30 shadow-[0_0_15px_rgba(168,85,247,0.15)]`;
    }
    return `${base} text-text-secondary hover:text-text-primary hover:bg-glass-hover hover:border-white/5 border border-transparent`;
  };

  return (
    <motion.aside
      animate={{ width: isCollapsed ? 80 : 260 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className={`relative h-full flex flex-col bg-bg-secondary border-r border-border-subtle ${isCollapsed ? 'p-4 items-center' : 'p-6'} z-40`}
    >
      {/* Decorative Glow Background */}
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-neon-purple/5 to-transparent pointer-events-none" />

      {/* Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-14 flex items-center justify-center w-6 h-6 bg-neon-purple hover:bg-brand-hover text-white rounded-full shadow-[0_0_10px_rgba(168,85,247,0.5)] z-50 transition-colors cursor-pointer"
        title={isCollapsed ? "Mở rộng menu" : "Thu nhỏ menu"}
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </motion.button>

      {/* Logo Header */}
      <div className={`flex items-center text-2xl font-extrabold text-text-primary mb-8 tracking-tight w-full ${isCollapsed ? 'justify-center' : 'gap-3 px-2'}`}>
        <motion.div
          animate={{ rotate: isCollapsed ? 360 : 0 }}
          transition={{ duration: 0.5 }}
        >
          <Video className="text-neon-purple drop-shadow-[0_0_8px_rgba(168,85,247,0.8)] min-w-[28px]" size={28} />
        </motion.div>

        <AnimatePresence>
          {!isCollapsed && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="text-xl tracking-tighter bg-gradient-to-r from-text-primary via-white to-text-secondary bg-clip-text text-transparent whitespace-nowrap font-display"
            >
              Auto Re-up
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation List */}
      <ul className={`flex flex-col gap-1.5 w-full ${isCollapsed ? 'items-center' : ''}`}>
        {[
          { to: "/", title: "Tổng quan", icon: LayoutDashboard },
          { to: "/crawler", title: "Cào Video Douyin", icon: DownloadCloud },
          { to: "/discovery", title: "Khám phá", icon: Compass },
          { to: "/live", title: "Live Restream", icon: Bot },
          { to: "/processor", title: "Upload File Xử Lý", icon: FileVideo },
        ].map((item) => (
          <li className="w-full" key={item.to}>
            <NavLink to={item.to} className={({ isActive }) => getLinkStyle(isActive)} title={item.title}>
              <item.icon size={20} className="min-w-[20px]" />
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {item.title}
                  </motion.span>
                )}
              </AnimatePresence>
            </NavLink>
          </li>
        ))}

        {/* Specialized AI Creation Menu (Unique design with glow & badge) */}
        <li className="relative w-full">
          <NavLink
            to="/faceless"
            className={({ isActive }) => `
              ${getLinkStyle(isActive)} 
              relative overflow-hidden group border border-transparent hover:border-neon-pink/30
            `}
            title="Sáng tạo AI"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-neon-pink/10 via-neon-purple/10 to-neon-cyan/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <Bot size={20} className="text-neon-pink drop-shadow-[0_0_8px_rgba(236,72,153,0.8)] group-hover:animate-bounce min-w-[20px]" />
            <AnimatePresence>
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="bg-gradient-to-r from-neon-pink via-neon-purple to-neon-cyan bg-clip-text text-transparent font-extrabold tracking-wide drop-shadow-sm"
                >
                  Sáng tạo AI
                </motion.span>
              )}
            </AnimatePresence>
            <div className={`absolute flex h-2 w-2 ${isCollapsed ? 'top-2 right-2' : 'top-3.5 right-3'}`}>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-pink opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-neon-pink"></span>
            </div>
          </NavLink>
        </li>

        {[
          { to: "/history", title: "Lịch sử", icon: History },
          { to: "/social-accounts", title: "Tài khoản MXH", icon: Users },
          { to: "/proxies", title: "Quản lý Proxy", icon: ShieldCheck },
          { to: "/upload-schedule", title: "Lịch Đăng Bài", icon: CalendarClock },
          { to: "/settings", title: "Cấu hình", icon: Settings },
        ].map((item) => (
          <li className="w-full" key={item.to}>
            <NavLink to={item.to} className={({ isActive }) => getLinkStyle(isActive)} title={item.title}>
              <item.icon size={20} className="min-w-[20px]" />
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {item.title}
                  </motion.span>
                )}
              </AnimatePresence>
            </NavLink>
          </li>
        ))}
      </ul>
    </motion.aside>
  );
};

export default Sidebar;
