import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Phase1Crawler from './pages/Phase1Crawler';
import Phase2Processor from './pages/Phase2Processor';
import History from './pages/History';
import Settings from './pages/Settings';
import EditVideo from './pages/EditVideo';
import Discovery from './pages/Discovery';
import SocialAccounts from './pages/SocialAccounts';
import UploadSchedule from './pages/UploadSchedule';
import { CrawlerProvider } from './context/CrawlerContext';
import { ProcessorProvider } from './context/ProcessorContext';

const MainLayout = () => {
  const location = useLocation();
  let title = "Tổng quan";
  if (location.pathname === '/crawler') title = "Cào Video Douyin";
  if (location.pathname === '/processor') title = "Upload File Có Sẵn (Xử lý Nội bộ)";
  if (location.pathname === '/history') title = "Quản lý Lịch sử";
  if (location.pathname.startsWith('/edit')) title = "Edit Video";
  if (location.pathname === '/discovery') title = "Khám phá Hot Trend";
  if (location.pathname === '/settings') title = "Cấu Hình Hệ Thống";
  if (location.pathname === '/social-accounts') title = "Quản lý Tài Khoản MXH";
  if (location.pathname === '/upload-schedule') title = "Lịch Đăng Bài Tự Động";

  return (
    <div className="flex h-screen overflow-hidden bg-bg-primary text-text-primary">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={title} />
        <main className="flex-1 overflow-y-auto p-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/crawler" element={<Phase1Crawler />} />
            <Route path="/discovery" element={<Discovery />} />
            <Route path="/processor" element={<Phase2Processor />} />
            <Route path="/history" element={<History />} />
            <Route path="/edit/:id" element={<EditVideo />} />
            <Route path="/social-accounts" element={<SocialAccounts />} />
            <Route path="/upload-schedule" element={<UploadSchedule />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>

      </div>
    </div>
  );
};

function App() {
  return (
    <CrawlerProvider>
      <ProcessorProvider>
        <Router>
          <Toaster 
            position="top-right"
            toastOptions={{
              className: '',
              style: {
                borderRadius: '16px',
                background: '#1a1d24',
                color: '#fff',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                border: '1px solid rgba(255,255,255,0.05)',
                padding: '16px 20px',
                fontSize: '14px',
                fontWeight: '500',
              },
            }}
          />
          <MainLayout />
        </Router>
      </ProcessorProvider>
    </CrawlerProvider>
  );
}

export default App;
