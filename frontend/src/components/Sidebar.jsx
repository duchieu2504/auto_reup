import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, DownloadCloud, FileVideo, Settings, Video, History, Compass, Users, CalendarClock } from 'lucide-react';

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
          <NavLink to="/processor" className={({ isActive }) => (isActive ? activeLinkStyle : baseLinkStyle)}>
            <FileVideo size={20} />
            Upload File Xử Lý
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
