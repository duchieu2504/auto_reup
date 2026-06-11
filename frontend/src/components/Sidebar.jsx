import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, DownloadCloud, FileVideo, Settings, Video, History, Compass, Users, CalendarClock, ShieldCheck, Bot, ChevronLeft, ChevronRight } from 'lucide-react';

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const getLinkStyle = (isActive) => {
    const base = `flex items-center ${isCollapsed ? 'justify-center w-12 h-12 p-0' : 'gap-3 px-4 py-3'} rounded-xl font-medium transition-all duration-200 overflow-hidden whitespace-nowrap`;

    if (isActive) {
      return `${base} text-brand-primary bg-glass-hover ${isCollapsed ? 'shadow-[inset_2px_0_0_0_var(--color-brand-primary)]' : 'shadow-[inset_2px_0_0_0_var(--color-brand-primary)]'}`;
    }
    return `${base} text-text-secondary hover:text-brand-primary hover:bg-glass-hover`;
  };

  return (
    <aside className={`relative h-full flex flex-col bg-bg-secondary border-r border-border-subtle ${isCollapsed ? 'w-[80px] p-4 items-center' : 'w-[260px] p-6'} transition-all duration-300 z-40`}>

      {/* Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-9 flex items-center justify-center w-6 h-6 bg-brand-primary text-white rounded-full shadow-lg z-50 hover:bg-brand-secondary transition-colors"
        title={isCollapsed ? "Mở rộng menu" : "Thu nhỏ menu"}
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      <h2 className={`flex items-center text-2xl font-bold text-text-primary mb-8 tracking-tight ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
        <Video className="text-brand-primary min-w-[28px]" size={28} />
        {!isCollapsed && <span className="whitespace-nowrap">Auto Re-up</span>}
      </h2>

      <ul className={`flex flex-col gap-2 ${isCollapsed ? 'items-center w-full' : 'w-full'}`}>
        <li className="w-full">
          <NavLink to="/" className={({ isActive }) => getLinkStyle(isActive)} title="Tổng quan">
            <LayoutDashboard size={20} className="min-w-[20px]" />
            {!isCollapsed && <span>Tổng quan</span>}
          </NavLink>
        </li>
        <li className="w-full">
          <NavLink to="/crawler" className={({ isActive }) => getLinkStyle(isActive)} title="Cào Video Douyin">
            <DownloadCloud size={20} className="min-w-[20px]" />
            {!isCollapsed && <span>Cào Video Douyin</span>}
          </NavLink>
        </li>
        <li className="w-full">
          <NavLink to="/discovery" className={({ isActive }) => getLinkStyle(isActive)} title="Khám phá">
            <Compass size={20} className="min-w-[20px]" />
            {!isCollapsed && <span>Khám phá</span>}
          </NavLink>
        </li>
        <li className="w-full">
          <NavLink to="/live" className={({ isActive }) => getLinkStyle(isActive)} title="Live Restream">
            <Bot size={20} className="min-w-[20px]" />
            {!isCollapsed && <span>Live Restream</span>}
          </NavLink>
        </li>
        <li className="w-full">
          <NavLink to="/processor" className={({ isActive }) => getLinkStyle(isActive)} title="Upload File Xử Lý">
            <FileVideo size={20} className="min-w-[20px]" />
            {!isCollapsed && <span>Upload File Xử Lý</span>}
          </NavLink>
        </li>
        <li className="relative w-full">
          <NavLink to="/faceless" className={({ isActive }) => `
            ${getLinkStyle(isActive)} 
            relative overflow-hidden group border border-transparent hover:border-pink-500/30
          `} title="Sáng tạo AI">
            <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-brand-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="absolute -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-10 group-hover:animate-shine"></div>
            <Bot size={20} className="text-pink-400 drop-shadow-[0_0_8px_rgba(236,72,153,0.8)] group-hover:animate-bounce min-w-[20px]" />
            {!isCollapsed && (
              <span className="bg-gradient-to-r from-pink-400 via-purple-400 to-brand-primary bg-clip-text text-transparent font-extrabold tracking-wide drop-shadow-sm">
                Sáng tạo AI
              </span>
            )}
            <div className={`absolute flex h-2 w-2 ${isCollapsed ? 'top-2 right-2' : 'top-3 right-3'}`}>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-500"></span>
            </div>
          </NavLink>
        </li>
        <li className="w-full">
          <NavLink to="/history" className={({ isActive }) => getLinkStyle(isActive)} title="Lịch sử">
            <History size={20} className="min-w-[20px]" />
            {!isCollapsed && <span>Lịch sử</span>}
          </NavLink>
        </li>
        <li className="w-full">
          <NavLink to="/social-accounts" className={({ isActive }) => getLinkStyle(isActive)} title="Tài khoản MXH">
            <Users size={20} className="min-w-[20px]" />
            {!isCollapsed && <span>Tài khoản MXH</span>}
          </NavLink>
        </li>
        <li className="w-full">
          <NavLink to="/proxies" className={({ isActive }) => getLinkStyle(isActive)} title="Quản lý Proxy">
            <ShieldCheck size={20} className="min-w-[20px]" />
            {!isCollapsed && <span>Quản lý Proxy</span>}
          </NavLink>
        </li>
        <li className="w-full">
          <NavLink to="/upload-schedule" className={({ isActive }) => getLinkStyle(isActive)} title="Lịch Đăng Bài">
            <CalendarClock size={20} className="min-w-[20px]" />
            {!isCollapsed && <span>Lịch Đăng Bài</span>}
          </NavLink>
        </li>
        <li className="w-full">
          <NavLink to="/settings" className={({ isActive }) => getLinkStyle(isActive)} title="Cấu hình">
            <Settings size={20} className="min-w-[20px]" />
            {!isCollapsed && <span>Cấu hình</span>}
          </NavLink>
        </li>
      </ul>
    </aside>
  );
};

export default Sidebar;
