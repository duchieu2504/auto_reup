import React from 'react';
import { Activity } from 'lucide-react';

const Header = ({ title }) => {
  return (
    <header className="h-[70px] px-8 flex items-center justify-between border-b border-border-subtle bg-bg-primary/80 backdrop-blur-md sticky top-0 z-10">
      <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
      <div className="flex items-center gap-2 text-sm font-medium text-green-500 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
        <Activity size={16} className="animate-pulse" />
        Hệ thống trực tuyến
      </div>
    </header>
  );
};

export default Header;
