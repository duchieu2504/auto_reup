import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import { CrawlerProvider } from './context/CrawlerContext';
import { ProcessorProvider } from './context/ProcessorContext';

// Dynamic imports with React.lazy
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Phase1Crawler = lazy(() => import('./pages/Phase1Crawler'));
const Phase2Processor = lazy(() => import('./pages/Phase2Processor'));
const History = lazy(() => import('./pages/History'));
const Settings = lazy(() => import('./pages/Settings'));
const EditVideo = lazy(() => import('./pages/EditVideo'));
const Discovery = lazy(() => import('./pages/Discovery'));
const SocialAccounts = lazy(() => import('./pages/SocialAccounts'));
const UploadSchedule = lazy(() => import('./pages/UploadSchedule'));
const Proxies = lazy(() => import('./pages/Proxies'));
const AIFaceless = lazy(() => import('./pages/AIFaceless/AIFaceless'));
const LiveRestream = lazy(() => import('./pages/LiveRestream'));

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
  if (location.pathname === '/proxies') title = "Quản lý Proxy";
  if (location.pathname === '/faceless') title = "Sáng Tạo AI Faceless";
  if (location.pathname === '/live') title = "Live Restream";

  return (
    <div className="flex h-screen overflow-hidden bg-bg-primary text-text-primary">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={title} />
        <main className="flex-1 overflow-y-auto p-8">
          <Suspense fallback={
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm text-text-secondary font-medium animate-pulse">Đang tải module...</span>
              </div>
            </div>
          }>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/crawler" element={<Phase1Crawler />} />
              <Route path="/discovery" element={<Discovery />} />
              <Route path="/processor" element={<Phase2Processor />} />
              <Route path="/history" element={<History />} />
              <Route path="/edit/:id" element={<EditVideo />} />
              <Route path="/social-accounts" element={<SocialAccounts />} />
              <Route path="/upload-schedule" element={<UploadSchedule />} />
              <Route path="/proxies" element={<Proxies />} />
              <Route path="/faceless" element={<AIFaceless />} />
              <Route path="/live" element={<LiveRestream />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </Suspense>
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
