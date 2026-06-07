import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, DownloadCloud, FileVideo, Settings, Video, History, Compass, Users, CalendarClock, ShieldCheck, Bot } from 'lucide-react';

const Sidebar = () => {
  const baseLinkStyle = "flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 text-text-secondary hover:text-brand-primary hover:bg-glass-hover";
  const activeLinkStyle = "flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 text-brand-primary bg-glass-hover shadow-[inset_2px_0_0_0_var(--color-brand-primary)]";

  return (
    <aside className="w-[260px] h-full flex flex-col bg-bg-secondary border-r border-border-subtle p-6 transition-all duration-300">
      <h2 className="flex items-center gap-3 text-2xl font-bold text-text-primary mb-8 tracking-tight">
        <Video className="text-brand-primary" size={28} />
        Auto Re-up
      </h2>
      <ul className="flex flex-col gap-2">
        <li>
          <NavLink to="/" className={({ isActive }) => (isActive ? activeLinkStyle : baseLinkStyle)}>
            <LayoutDashboard size={20} />
            Tổng quan
          </NavLink>
        </li>
        <li>
          <NavLink to="/crawler" className={({ isActive }) => (isActive ? activeLinkStyle : baseLinkStyle)}>
            <DownloadCloud size={20} />
            Cào Video Douyin
          </NavLink>
        </li>
        <li>
          <NavLink to="/discovery" className={({ isActive }) => (isActive ? activeLinkStyle : baseLinkStyle)}>
            <Compass size={20} />
            Khám phá
          </NavLink>
        </li>
        <li>
          <NavLink to="/live" className={({ isActive }) => (isActive ? activeLinkStyle : baseLinkStyle)}>
            <Bot size={20} />
            Live Restream
          </NavLink>
        </li>
        <li>
          <NavLink to="/processor" className={({ isActive }) => (isActive ? activeLinkStyle : baseLinkStyle)}>
            <FileVideo size={20} />
            Upload File Xử Lý
          </NavLink>
        </li>
        <li className="relative">
          <NavLink to="/faceless" className={({ isActive }) => `
            ${isActive ? activeLinkStyle : baseLinkStyle} 
            relative overflow-hidden group border border-transparent hover:border-pink-500/30
          `}>
            <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-brand-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="absolute -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-10 group-hover:animate-shine"></div>
            <Bot size={20} className="text-pink-400 drop-shadow-[0_0_8px_rgba(236,72,153,0.8)] group-hover:animate-bounce" />
            <span className="bg-gradient-to-r from-pink-400 via-purple-400 to-brand-primary bg-clip-text text-transparent font-extrabold tracking-wide drop-shadow-sm">
              Sáng tạo AI
            </span>
            <div className="absolute top-3 right-3 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-500"></span>
            </div>
          </NavLink>
        </li>
        <li>
          <NavLink to="/history" className={({ isActive }) => (isActive ? activeLinkStyle : baseLinkStyle)}>
            <History size={20} />
            Lịch sử
          </NavLink>
        </li>
        <li>
          <NavLink to="/social-accounts" className={({ isActive }) => (isActive ? activeLinkStyle : baseLinkStyle)}>
            <Users size={20} />
            Tài khoản MXH
          </NavLink>
        </li>
        <li>
          <NavLink to="/proxies" className={({ isActive }) => (isActive ? activeLinkStyle : baseLinkStyle)}>
            <ShieldCheck size={20} />
            Quản lý Proxy
          </NavLink>
        </li>
        <li>
          <NavLink to="/upload-schedule" className={({ isActive }) => (isActive ? activeLinkStyle : baseLinkStyle)}>
            <CalendarClock size={20} />
            Lịch Đăng Bài
          </NavLink>
        </li>
        <li>
          <NavLink to="/settings" className={({ isActive }) => (isActive ? activeLinkStyle : baseLinkStyle)}>
            <Settings size={20} />
            Cấu hình
          </NavLink>
        </li>
      </ul>
    </aside>
  );
};

export default Sidebar;
