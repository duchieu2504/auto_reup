import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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

  const COLORS = ['#00C49F', '#FFBB28', '#FF8042', '#0088FE', '#8884d8'];

  // Empty data for the future View/Likes chart
  const emptyViewData = [
    { date: 'Mon', views: 0 },
    { date: 'Tue', views: 0 },
    { date: 'Wed', views: 0 },
    { date: 'Thu', views: 0 },
    { date: 'Fri', views: 0 },
    { date: 'Sat', views: 0 },
    { date: 'Sun', views: 0 },
  ];

  if (loading) {
    return <div className="flex justify-center items-center h-64 text-text-secondary">Đang tải dữ liệu thống kê...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-xl flex items-center gap-3">
        <AlertTriangle />
        {error}
      </div>
    );
  }

  const kpis = stats?.kpis || {};

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Bảng Điều Khiển (Dashboard)</h2>
        <div className="flex gap-3">
          <button 
            onClick={() => window.open('http://localhost:8000/api/history/backup', '_blank')}
            className="px-4 py-2 bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white rounded-lg transition-colors font-medium flex items-center gap-2"
          >
            <DownloadCloud size={16} />
            Tạo bản Backup Data
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-panel p-6 rounded-2xl hover:-translate-y-1 transition-transform duration-300">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Tổng Video Đã Cào</div>
            <Video className="text-blue-400 opacity-50" size={24} />
          </div>
          <div className="text-4xl font-bold text-text-primary">{kpis.total_videos || 0}</div>
        </div>
        <div className="glass-panel p-6 rounded-2xl hover:-translate-y-1 transition-transform duration-300">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Đã Render</div>
            <Activity className="text-orange-400 opacity-50" size={24} />
          </div>
          <div className="text-4xl font-bold text-text-primary">{kpis.processed_videos || 0}</div>
        </div>
        <div className="glass-panel p-6 rounded-2xl hover:-translate-y-1 transition-transform duration-300">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Đã Upload</div>
            <UploadCloud className="text-green-400 opacity-50" size={24} />
          </div>
          <div className="text-4xl font-bold text-text-primary">{kpis.uploaded_videos || 0}</div>
        </div>
        <div className="glass-panel p-6 rounded-2xl hover:-translate-y-1 transition-transform duration-300">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Sức khỏe Tài Khoản</div>
            <Users className="text-purple-400 opacity-50" size={24} />
          </div>
          <div className="text-4xl font-bold text-purple-400">{kpis.active_accounts || 0}/{kpis.total_accounts || 0}</div>
        </div>
      </div>
      
      {/* Charts Section 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-2xl lg:col-span-2 min-h-[350px]">
          <h3 className="text-lg font-bold mb-4">Năng suất hoạt động (7 ngày qua)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats?.charts?.activity_7_days || []} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="date" stroke="#888" />
              <YAxis stroke="#888" />
              <RechartsTooltip contentStyle={{ backgroundColor: '#1f1f23', borderColor: '#333' }} />
              <Legend />
              <Line type="monotone" name="Đã cào" dataKey="downloaded" stroke="#0088FE" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              <Line type="monotone" name="Đã xử lý" dataKey="processed" stroke="#FF8042" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" name="Đã upload" dataKey="uploaded" stroke="#00C49F" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-panel p-6 rounded-2xl min-h-[350px] flex flex-col items-center">
          <h3 className="text-lg font-bold mb-4 w-full text-left">Nguồn Video</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={stats?.charts?.platform_distribution || []}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {stats?.charts?.platform_distribution?.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <RechartsTooltip contentStyle={{ backgroundColor: '#1f1f23', borderColor: '#333' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Section 2 & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Placeholder for Future Analytics Feature */}
        <div className="glass-panel p-6 rounded-2xl min-h-[300px]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">Lượt Tương Tác (Sắp ra mắt)</h3>
            <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full font-bold">Comming Soon</span>
          </div>
          <p className="text-sm text-text-secondary mb-4">Dữ liệu View/Heart từ các nền tảng sẽ được tự động đồng bộ về đây.</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={emptyViewData} margin={{ top: 5, right: 0, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.5} />
              <XAxis dataKey="date" stroke="#888" opacity={0.5} />
              <YAxis stroke="#888" opacity={0.5} />
              <RechartsTooltip contentStyle={{ backgroundColor: '#1f1f23', borderColor: '#333' }} />
              <Bar dataKey="views" fill="#8884d8" radius={[4, 4, 0, 0]} opacity={0.3} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Activity */}
        <div className="glass-panel p-6 rounded-2xl min-h-[300px] flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">Hoạt động gần đây</h3>
            <Link to="/history" className="text-sm text-primary hover:underline flex items-center gap-1">
              Xem tất cả <ArrowRight size={14} />
            </Link>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-3">
            {stats?.recent_activity?.length > 0 ? (
              stats.recent_activity.map((item, index) => (
                <div key={index} className="flex gap-3 items-start p-3 rounded-lg bg-bg-primary/50 border border-white/5">
                  <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${
                    item.status === 'success' ? 'bg-green-500' : 
                    item.status === 'error' ? 'bg-red-500' : 'bg-blue-500'
                  }`}></div>
                  <div className="flex-1">
                    <p className="text-sm text-text-primary">{item.message}</p>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-text-secondary font-mono">{item.time}</span>
                      <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/5 text-text-secondary">
                        {item.type}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-text-secondary text-center py-10">Chưa có hoạt động nào.</div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
