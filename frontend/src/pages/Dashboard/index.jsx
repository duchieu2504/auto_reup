import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, DownloadCloud, Activity, UploadCloud, Video, Users, AlertTriangle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, BarChart, Bar } from 'recharts';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/api/analytics/dashboard-stats');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setStats(data);
      setError('');
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setError('Không thể kết nối đến server để lấy dữ liệu thống kê.');
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#06b6d4', '#ec4899', '#a855f7', '#10b981', '#f59e0b'];

  const emptyViewData = [
    { date: 'Mon', views: 0 },
    { date: 'Tue', views: 0 },
    { date: 'Wed', views: 0 },
    { date: 'Thu', views: 0 },
    { date: 'Fri', views: 0 },
    { date: 'Sat', views: 0 },
    { date: 'Sun', views: 0 },
  ];

  // Animation variants for Staggered Entrance
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-96 text-text-secondary gap-3">
        <div className="w-8 h-8 border-4 border-neon-purple border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm font-medium animate-pulse">Đang tải dữ liệu thống kê...</span>
      </div>
    );
  }

  if (error) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-red-500/10 border border-red-500/30 text-red-400 p-5 rounded-2xl flex items-center gap-3 shadow-[0_0_15px_rgba(239,68,68,0.1)]"
      >
        <AlertTriangle className="text-red-400" />
        <span className="font-medium">{error}</span>
      </motion.div>
    );
  }

  const kpis = stats?.kpis || {};

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      <motion.div variants={itemVariants} className="flex justify-between items-center">
        <h2 className="text-2xl font-extrabold tracking-tight font-display bg-gradient-to-r from-white to-text-secondary bg-clip-text text-transparent">
          Bảng Điều Khiển (Dashboard)
        </h2>
        <div className="flex gap-3">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => window.open('http://localhost:8000/api/history/backup', '_blank')}
            className="px-4 py-2 bg-neon-green/10 text-neon-green hover:bg-neon-green hover:text-white border border-neon-green/20 rounded-xl transition-all duration-300 font-medium flex items-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.05)]"
          >
            <DownloadCloud size={16} />
            Tạo bản Backup Data
          </motion.button>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: "Tổng Video Đã Cào", value: kpis.total_videos || 0, icon: Video, color: "text-neon-cyan", border: "group-hover:border-neon-cyan/30" },
          { title: "Đã Render", value: kpis.processed_videos || 0, icon: Activity, color: "text-neon-pink", border: "group-hover:border-neon-pink/30" },
          { title: "Đã Upload", value: kpis.uploaded_videos || 0, icon: UploadCloud, color: "text-neon-purple", border: "group-hover:border-neon-purple/30" },
          { title: "Sức khỏe Tài Khoản", value: `${kpis.active_accounts || 0}/${kpis.total_accounts || 0}`, icon: Users, color: "text-neon-green", border: "group-hover:border-neon-green/30" }
        ].map((kpi, idx) => (
          <div 
            key={idx} 
            className={`glass-panel p-6 rounded-2xl relative overflow-hidden group cursor-default border border-white/5 hover:border-transparent ${kpi.border} transition-all duration-300`}
          >
            {/* Top Border Hover Effect */}
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-white/20 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-bold text-text-secondary uppercase tracking-wider">{kpi.title}</div>
              <kpi.icon className={`${kpi.color} opacity-80 drop-shadow-[0_0_8px_currentColor]`} size={22} />
            </div>
            <div className={`text-4xl font-extrabold text-text-primary tracking-tight font-display`}>
              {kpi.value}
            </div>
          </div>
        ))}
      </motion.div>
      
      {/* Charts Section 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div variants={itemVariants} className="glass-panel p-6 rounded-2xl lg:col-span-2 min-h-[350px] border border-white/5 hover:border-white/10 transition-colors">
          <h3 className="text-lg font-bold mb-4 font-display">Năng suất hoạt động (7 ngày qua)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats?.charts?.activity_7_days || []} margin={{ top: 10, right: 10, bottom: 5, left: -20 }}>
              <defs>
                <linearGradient id="gradDownloaded" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="gradProcessed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ec4899" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="gradUploaded" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" opacity={0.3} />
              <XAxis dataKey="date" stroke="#6b7280" tickLine={false} style={{ fontSize: '12px' }} />
              <YAxis stroke="#6b7280" tickLine={false} style={{ fontSize: '12px' }} />
              <RechartsTooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(18, 22, 32, 0.85)', 
                  backdropFilter: 'blur(12px)',
                  borderColor: 'rgba(255, 255, 255, 0.08)', 
                  borderRadius: '16px',
                  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)'
                }} 
              />
              <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 500 }} />
              <Line type="monotone" name="Đã cào" dataKey="downloaded" stroke="#06b6d4" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} fill="url(#gradDownloaded)" />
              <Line type="monotone" name="Đã xử lý" dataKey="processed" stroke="#ec4899" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} fill="url(#gradProcessed)" />
              <Line type="monotone" name="Đã upload" dataKey="uploaded" stroke="#a855f7" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} fill="url(#gradUploaded)" />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div variants={itemVariants} className="glass-panel p-6 rounded-2xl min-h-[350px] flex flex-col items-center border border-white/5 hover:border-white/10 transition-colors">
          <h3 className="text-lg font-bold mb-4 w-full text-left font-display">Nguồn Video</h3>
          <div className="flex-1 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={stats?.charts?.platform_distribution || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={85}
                  paddingAngle={6}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={{ stroke: '#4b5563', strokeWidth: 1 }}
                >
                  {(stats?.charts?.platform_distribution || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="focus:outline-none transition-all duration-300" />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(18, 22, 32, 0.85)', 
                    backdropFilter: 'blur(12px)',
                    borderColor: 'rgba(255, 255, 255, 0.08)', 
                    borderRadius: '12px' 
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Charts Section 2 & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Coming Soon Section */}
        <motion.div variants={itemVariants} className="glass-panel p-6 rounded-2xl min-h-[320px] border border-white/5 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-bold font-display">Lượt Tương Tác (Phân tích nâng cao)</h3>
              <span className="text-[10px] bg-neon-pink/10 text-neon-pink border border-neon-pink/20 px-2 py-0.5 rounded-full font-bold tracking-wider uppercase">
                Sắp ra mắt
              </span>
            </div>
            <p className="text-sm text-text-secondary mb-4 leading-relaxed">
              Dữ liệu View/Likes/Comments từ các nền tảng MXH sẽ được tự động đồng bộ và thống kê dưới dạng biểu đồ phân tích xu hướng.
            </p>
          </div>
          <div className="flex-1 flex items-end">
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={emptyViewData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" opacity={0.1} />
                <XAxis dataKey="date" stroke="#4b5563" opacity={0.3} style={{ fontSize: '11px' }} />
                <Bar dataKey="views" fill="#a855f7" radius={[4, 4, 0, 0]} opacity={0.15} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div variants={itemVariants} className="glass-panel p-6 rounded-2xl min-h-[320px] flex flex-col border border-white/5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold font-display">Hoạt động gần đây</h3>
            <Link to="/history" className="text-sm text-neon-purple hover:text-brand-hover hover:underline flex items-center gap-1 transition-colors font-medium">
              Xem tất cả <ArrowRight size={14} />
            </Link>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-1 space-y-3 max-h-[220px]">
            {stats?.recent_activity?.length > 0 ? (
              stats.recent_activity.map((item, index) => (
                <div key={index} className="flex gap-3.5 items-start p-3 rounded-xl bg-bg-primary/30 border border-white/5 hover:border-white/10 hover:translate-x-1 transition-all duration-200">
                  <span className="relative flex h-2 w-2 mt-1.5 flex-shrink-0">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      item.status === 'success' ? 'bg-neon-green' : 
                      item.status === 'error' ? 'bg-neon-pink' : 'bg-neon-cyan'
                    }`}></span>
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${
                      item.status === 'success' ? 'bg-neon-green' : 
                      item.status === 'error' ? 'bg-neon-pink' : 'bg-neon-cyan'
                    }`}></span>
                  </span>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary font-medium leading-normal truncate-2-lines">{item.message}</p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-[11px] text-text-secondary font-mono">{item.time}</span>
                      <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-text-secondary">
                        {item.type}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-text-secondary text-center py-12 italic">Chưa có hoạt động nào được ghi nhận.</div>
            )}
          </div>
        </motion.div>
      </div>

    </motion.div>
  );
};

export default Dashboard;
