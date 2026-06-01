import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, DownloadCloud } from 'lucide-react';

const Dashboard = () => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-panel p-6 rounded-2xl hover:-translate-y-1 transition-transform duration-300">
          <div className="text-sm font-semibold text-text-secondary uppercase mb-2 tracking-wider">Tổng Video Đã Tải</div>
          <div className="text-4xl font-bold text-text-primary">1,204</div>
        </div>
        <div className="glass-panel p-6 rounded-2xl hover:-translate-y-1 transition-transform duration-300">
          <div className="text-sm font-semibold text-text-secondary uppercase mb-2 tracking-wider">Đã Render</div>
          <div className="text-4xl font-bold text-text-primary">850</div>
        </div>
        <div className="glass-panel p-6 rounded-2xl hover:-translate-y-1 transition-transform duration-300">
          <div className="text-sm font-semibold text-text-secondary uppercase mb-2 tracking-wider">Đã Upload Lên TikTok</div>
          <div className="text-4xl font-bold text-text-primary">845</div>
        </div>
        <div className="glass-panel p-6 rounded-2xl hover:-translate-y-1 transition-transform duration-300">
          <div className="text-sm font-semibold text-text-secondary uppercase mb-2 tracking-wider">Lỗi</div>
          <div className="text-4xl font-bold text-red-500">3</div>
        </div>
      </div>
      
      <div className="glass-panel p-8 rounded-2xl min-h-[300px]">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">Tiến độ các chiến dịch gần đây</h3>
          <div className="flex gap-3">
            <button 
              onClick={() => window.open('http://localhost:8000/api/history/backup', '_blank')}
              className="px-4 py-2 bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white rounded-lg transition-colors font-medium flex items-center gap-2"
            >
              <DownloadCloud size={16} />
              Tạo bản Backup Data
            </button>
            <Link to="/history" className="px-4 py-2 bg-primary/20 text-primary hover:bg-primary/30 rounded-lg transition-colors font-medium flex items-center gap-2">
              Xem lịch sử <ArrowRight size={16} />
            </Link>
          </div>
        </div>
        <p className="text-text-secondary">Biểu đồ hiển thị ở đây (Updating...)</p>
      </div>
    </div>
  );
};

export default Dashboard;
