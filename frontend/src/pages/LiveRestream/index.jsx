import React, { useState, useEffect } from 'react';
import { PlayCircle, Square, RefreshCcw, Wifi, AlertTriangle } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export default function LiveRestream() {
  const [formData, setFormData] = useState({
    douyin_url: '',
    rtmp_url: '',
    stream_key: '',
    target_account_name: '',
    flip_horizontal: true
  });
  const [jobs, setJobs] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchJobs = async () => {
    try {
      const res = await fetch(`${API_BASE}/live/status`);
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAccounts = async () => {
    try {
      const res = await fetch(`${API_BASE}/social-accounts`);
      if (res.ok) {
        const data = await res.json();
        setAccounts(data || []);
      }
    } catch (err) {
      console.error("Failed to fetch accounts", err);
    }
  };

  useEffect(() => {
    fetchJobs();
    fetchAccounts();
    const interval = setInterval(fetchJobs, 5000); // Auto refresh every 5s
    return () => clearInterval(interval);
  }, []);

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleAccountChange = (e) => {
    const selectedUsername = e.target.value;
    setFormData({ ...formData, target_account_name: selectedUsername });
  };

  const handleStart = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/live/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Lỗi khi khởi chạy luồng Live");
      setFormData({ ...formData, douyin_url: '' });
      fetchJobs();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async (jobId) => {
    try {
      const res = await fetch(`${API_BASE}/live/stop/${jobId}`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Lỗi khi dừng luồng Live");
      fetchJobs();
    } catch (err) {
      alert("Lỗi khi dừng luồng Live: " + err.message);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">📡 Live Restream (Douyin -&gt; TikTok)</h1>
          <p className="text-muted-foreground mt-2">
            Kéo luồng Live trực tiếp từ Douyin và phát lại lên kênh TikTok của bạn.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 glass-panel rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-6 border-b border-border-subtle pb-3">Tạo luồng Live mới</h2>
          
          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded mb-4 flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleStart} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Link phòng Live Douyin</label>
              <input
                type="text"
                name="douyin_url"
                value={formData.douyin_url}
                onChange={handleChange}
                placeholder="VD: https://live.douyin.com/123456"
                className="w-full px-4 py-3 bg-bg-secondary border border-border-subtle rounded-xl text-sm text-text-primary focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all shadow-sm"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">TikTok RTMP URL</label>
              <input
                type="text"
                name="rtmp_url"
                value={formData.rtmp_url}
                onChange={handleChange}
                placeholder="rtmp://push-rtmp-f5-xxxx.tiktokcdn.com/stage/"
                className="w-full px-4 py-3 bg-bg-secondary border border-border-subtle rounded-xl text-sm text-text-primary focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all shadow-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">TikTok Stream Key</label>
              <input
                type="password"
                name="stream_key"
                value={formData.stream_key}
                onChange={handleChange}
                placeholder="Tự động lấy từ TikTok Live Studio"
                className="w-full px-4 py-3 bg-bg-secondary border border-border-subtle rounded-xl text-sm text-text-primary focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all shadow-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Tài khoản đích (Tùy chọn)</label>
              <select
                name="target_account_name"
                value={formData.target_account_name}
                onChange={handleAccountChange}
                className="w-full px-4 py-3 bg-bg-secondary border border-border-subtle rounded-xl text-sm text-text-primary focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all shadow-sm appearance-none"
              >
                <option value="" className="bg-bg-secondary text-text-primary">-- Chọn tài khoản TikTok (Chỉ để quản lý) --</option>
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.username} className="bg-bg-secondary text-text-primary">
                    {acc.username} ({acc.platform})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="flip_horizontal"
                id="flip_horizontal"
                checked={formData.flip_horizontal}
                onChange={handleChange}
                className="w-4 h-4 cursor-pointer accent-brand-primary"
              />
              <label htmlFor="flip_horizontal" className="text-sm font-medium cursor-pointer">
                Lật ngang màn hình (Chống bản quyền hình ảnh)
              </label>
            </div>

            <div className="flex items-start gap-2 pt-3 border-t border-border-subtle mt-2">
              <input
                type="checkbox"
                name="realtime_translate"
                id="realtime_translate"
                disabled
                className="w-4 h-4 mt-0.5 opacity-50 cursor-not-allowed"
              />
              <div className="flex flex-col">
                <label htmlFor="realtime_translate" className="text-sm font-medium text-text-secondary cursor-not-allowed">
                  Dịch thuật Real-time (Douyin Sub -&gt; Tiếng Việt)
                </label>
                <span className="text-xs text-brand-primary font-bold mt-1 animate-pulse">🚀 Căm ming son...</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 bg-primary text-primary-foreground py-2 rounded font-medium flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <RefreshCcw className="w-5 h-5 animate-spin" /> : <PlayCircle className="w-5 h-5" />}
              {loading ? "Đang xử lý..." : "Bắt đầu Restream"}
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 glass-panel rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6 border-b border-border-subtle pb-3">
            <h2 className="text-xl font-semibold">Danh sách Luồng đang chạy</h2>
            <button onClick={fetchJobs} className="text-sm text-blue-500 flex items-center gap-1 hover:underline">
              <RefreshCcw className="w-4 h-4" /> Làm mới
            </button>
          </div>

          <div className="space-y-3">
            {jobs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">Chưa có luồng Live nào được tạo.</p>
            ) : (
              jobs.map(job => (
                <div key={job.id} className="flex justify-between items-center p-4 border border-border-subtle rounded-xl bg-bg-secondary/50 hover:bg-bg-secondary transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">Job #{job.id}</span>
                      {job.status === 'running' ? (
                        <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Wifi className="w-3 h-3" /> Đang phát
                        </span>
                      ) : job.status === 'stopped' ? (
                        <span className="bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded-full">Đã dừng</span>
                      ) : (
                        <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full">Lỗi</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate max-w-[300px]" title={job.douyin_url}>
                      Douyin: {job.douyin_url}
                    </p>
                    {job.target_account_name && (
                      <p className="text-xs text-brand-primary font-medium mt-1">
                        👉 Đang Live trên: {job.target_account_name}
                      </p>
                    )}
                    {job.error_message && (
                      <p className="text-xs text-red-500 mt-1 max-w-[300px] truncate">{job.error_message}</p>
                    )}
                  </div>
                  
                  {job.status === 'running' && (
                    <button
                      onClick={() => handleStop(job.id)}
                      className="bg-destructive/10 text-destructive hover:bg-destructive hover:text-white transition-colors px-3 py-1.5 rounded text-sm flex items-center gap-1 font-medium"
                    >
                      <Square className="w-4 h-4" /> Dừng Live
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
