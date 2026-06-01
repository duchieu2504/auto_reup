import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Activity, Globe, Shield, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const API_BASE = 'http://localhost:8000/api';

const SocialAccounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    platform: 'tiktok',
    username: '',
    account_id: '',
    avatar_url: '',
    auth_data: '',
    proxy_host: '',
    proxy_port: '',
    proxy_username: '',
    proxy_password: ''
  });

  const fetchAccounts = async () => {
    try {
      const res = await fetch(`${API_BASE}/social-accounts/`);
      const data = await res.json();
      setAccounts(data);
    } catch (err) {
      toast.error('Lỗi khi tải danh sách tài khoản');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isEdit = !!editingId;
    const url = isEdit ? `${API_BASE}/social-accounts/${editingId}` : `${API_BASE}/social-accounts/`;
    const method = isEdit ? 'PUT' : 'POST';

    const loadingToast = toast.loading(isEdit ? 'Đang cập nhật...' : 'Đang thêm tài khoản...');
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (!res.ok) throw new Error('Có lỗi xảy ra');
      
      toast.success(isEdit ? 'Cập nhật thành công!' : 'Thêm tài khoản thành công!', { id: loadingToast });
      setIsModalOpen(false);
      resetForm();
      fetchAccounts();
    } catch (err) {
      toast.error(err.message, { id: loadingToast });
      toast.error(err.message, { id: loadingToast });
    }
  };

  const handleAutoLogin = async () => {
    let proxyString = "";
    if (formData.proxy_host) {
      proxyString = `http://`;
      if (formData.proxy_username) {
        proxyString += `${formData.proxy_username}:${formData.proxy_password}@`;
      }
      proxyString += `${formData.proxy_host}:${formData.proxy_port || '80'}`;
    }

    const loadingToast = toast.loading("Đang kết nối Local Agent... Hãy đăng nhập trên cửa sổ Chrome vừa mở!");
    try {
      const res = await fetch("http://localhost:9999/open-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: formData.platform,
          proxy: proxyString,
          profile_id: editingId || Date.now()
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi khi gọi Agent");
      
      setFormData(prev => ({
        ...prev,
        auth_data: data.cookies,
        ...(data.username && { username: data.username }),
        ...(data.account_id && { account_id: data.account_id }),
        ...(data.avatar_url && { avatar_url: data.avatar_url })
      }));
      toast.success("Trích xuất Cookie thành công! Bạn có thể Lưu Tài Khoản.", { id: loadingToast, duration: 4000 });
    } catch (err) {
      toast.error("Lỗi: Không tìm thấy Local Agent! Vui lòng chạy file DangNhapTiktok.bat trên máy của bạn.", { id: loadingToast, duration: 6000 });
    }
  };

  const handleDelete = async (id) => {
    toast((t) => (
      <div className="flex flex-col gap-4 p-1">
        <div>
          <p className="font-bold text-text-primary text-base mb-1">Xóa tài khoản này?</p>
          <p className="text-text-secondary text-sm">Toàn bộ dữ liệu kết nối sẽ bị xóa khỏi hệ thống.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="flex-1 px-3 py-2 bg-bg-secondary text-text-primary rounded-lg text-sm font-medium hover:bg-white/5 transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              const loadingToast = toast.loading('Đang xóa...');
              try {
                const res = await fetch(`${API_BASE}/social-accounts/${id}`, { method: 'DELETE' });
                if (!res.ok) throw new Error('Xóa thất bại');
                toast.success('Đã xóa tài khoản', { id: loadingToast });
                fetchAccounts();
              } catch (err) {
                toast.error(err.message, { id: loadingToast });
              }
            }}
            className="flex-1 px-3 py-2 bg-red-500/20 text-red-500 rounded-lg text-sm font-medium hover:bg-red-500/30 transition-colors border border-red-500/20"
          >
            Xóa ngay
          </button>
        </div>
      </div>
    ), { duration: Infinity });
  };

  const checkStatus = async (id) => {
    const loadingToast = toast.loading('Đang kiểm tra trạng thái...');
    try {
      const res = await fetch(`${API_BASE}/social-accounts/${id}/check-status`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Kiểm tra thất bại');
      toast.success(data.message, { id: loadingToast });
      fetchAccounts();
    } catch (err) {
      toast.error(err.message, { id: loadingToast });
    }
  };

  const openEditModal = (account) => {
    setFormData({
      platform: account.platform,
      username: account.username,
      account_id: account.account_id || '',
      avatar_url: account.avatar_url || '',
      auth_data: account.auth_data,
      proxy_host: account.proxy_host || '',
      proxy_port: account.proxy_port || '',
      proxy_username: account.proxy_username || '',
      proxy_password: account.proxy_password || ''
    });
    setEditingId(account.id);
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      platform: 'tiktok',
      username: '',
      account_id: '',
      avatar_url: '',
      auth_data: '',
      proxy_host: '',
      proxy_port: '',
      proxy_username: '',
      proxy_password: ''
    });
    setEditingId(null);
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Quản lý Tài Khoản MXH</h1>
          <p className="text-text-secondary mt-1 text-sm">Thêm và cấu hình các tài khoản mạng xã hội để auto upload</p>
        </div>
        <button
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white font-medium rounded-xl hover:opacity-90 transition-all shadow-[0_0_20px_rgba(var(--color-brand-primary),0.3)]"
        >
          <Plus size={18} />
          Thêm Tài Khoản
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-text-secondary">Đang tải danh sách...</div>
      ) : accounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-text-secondary bg-bg-secondary rounded-2xl border border-border-subtle border-dashed">
          <Globe size={48} className="opacity-20 mb-4" />
          <p>Chưa có tài khoản nào được thêm.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.map(acc => (
            <div key={acc.id} className="bg-bg-secondary rounded-2xl border border-border-subtle p-6 hover:border-brand-primary/50 transition-colors group relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-primary to-purple-500 opacity-50" />
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  {acc.avatar_url ? (
                    <img src={acc.avatar_url} alt="Avatar" referrerPolicy="no-referrer" className="w-10 h-10 rounded-full border border-white/10 object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-black/30 border border-white/10 flex items-center justify-center uppercase font-bold text-lg text-brand-primary">
                      {acc.platform.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-text-primary text-lg">{acc.username}</h3>
                    <p className="text-xs text-text-secondary uppercase tracking-wider">{acc.platform}</p>
                  </div>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEditModal(acc)} className="p-1.5 text-text-secondary hover:text-white bg-black/20 rounded-md">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDelete(acc.id)} className="p-1.5 text-text-secondary hover:text-red-500 bg-black/20 rounded-md">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-secondary flex items-center gap-1.5"><Activity size={14}/> Trạng thái</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${acc.status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                    {acc.status === 'active' ? 'ĐANG SỐNG' : 'LỖI COOKIE'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-secondary flex items-center gap-1.5"><Shield size={14}/> Proxy IP</span>
                  <span className="text-text-primary font-mono bg-black/30 px-2 py-0.5 rounded">
                    {acc.proxy_host ? `${acc.proxy_host}:${acc.proxy_port || '*'}` : 'Không dùng'}
                  </span>
                </div>
              </div>
              
              <button 
                onClick={() => checkStatus(acc.id)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-black/20 hover:bg-black/40 text-text-primary rounded-xl text-sm font-medium transition-colors border border-white/5"
              >
                <RefreshCw size={16} /> Kiểm tra Live/Die
              </button>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-bg-secondary w-full max-w-2xl rounded-2xl border border-border-subtle shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-border-subtle flex justify-between items-center">
              <h2 className="text-lg font-bold text-text-primary">{editingId ? 'Cập nhật tài khoản' : 'Thêm tài khoản mới'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-text-secondary hover:text-white">✕</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">Nền tảng</label>
                  <select name="platform" value={formData.platform} onChange={handleInputChange} className="w-full bg-bg-primary border border-border-subtle rounded-xl px-4 py-3 text-text-primary focus:border-brand-primary outline-none">
                    <option value="tiktok">TikTok</option>
                    <option value="youtube">YouTube</option>
                    <option value="instagram">Instagram</option>
                    <option value="facebook">Facebook</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">Tên định danh (Tên kênh)</label>
                  <input required name="username" value={formData.username} onChange={handleInputChange} placeholder="VD: TikTok Ẩm Thực" className="w-full bg-bg-primary border border-border-subtle rounded-xl px-4 py-3 text-text-primary focus:border-brand-primary outline-none" />
                </div>
              </div>

              <div className="mb-6">
                <div className="flex justify-between items-end mb-2">
                  <label className="block text-sm font-medium text-text-secondary">Auth Data (Cookie / Access Token)</label>
                  <button 
                    type="button" 
                    onClick={handleAutoLogin}
                    className="flex items-center gap-1.5 text-xs font-bold bg-brand-primary/20 text-brand-primary px-3 py-1.5 rounded-lg hover:bg-brand-primary/30 transition-colors"
                  >
                    <Globe size={14} /> Lấy Cookie Tự Động (Auto)
                  </button>
                </div>
                <textarea required name="auth_data" value={formData.auth_data} onChange={handleInputChange} rows={4} placeholder="Dán toàn bộ đoạn Cookie hoặc Token ở đây..." className="w-full bg-bg-primary border border-border-subtle rounded-xl px-4 py-3 text-text-primary font-mono text-sm focus:border-brand-primary outline-none resize-none" />
                <p className="text-xs text-brand-primary mt-1">Sử dụng nút "Lấy Cookie Tự Động" hoặc copy thủ công đoạn JSON cookie vào đây.</p>
              </div>

              <h3 className="font-bold text-text-primary mb-4 flex items-center gap-2"><Shield size={18} className="text-text-secondary"/> Cấu hình Proxy (Tùy chọn)</h3>
              <p className="text-xs text-text-secondary mb-3">Nếu điền Proxy dưới đây, hãy điền TRƯỚC KHI bấm Lấy Cookie Tự Động để hệ thống bọc IP luôn.</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">IP Host</label>
                  <input name="proxy_host" value={formData.proxy_host} onChange={handleInputChange} placeholder="VD: 192.168.1.1" className="w-full bg-bg-primary border border-border-subtle rounded-xl px-3 py-2 text-text-primary text-sm focus:border-brand-primary outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">Port</label>
                  <input name="proxy_port" value={formData.proxy_port} onChange={handleInputChange} placeholder="VD: 8080" className="w-full bg-bg-primary border border-border-subtle rounded-xl px-3 py-2 text-text-primary text-sm focus:border-brand-primary outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">Proxy Username</label>
                  <input name="proxy_username" value={formData.proxy_username} onChange={handleInputChange} placeholder="Tùy chọn" className="w-full bg-bg-primary border border-border-subtle rounded-xl px-3 py-2 text-text-primary text-sm focus:border-brand-primary outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">Proxy Password</label>
                  <input type="password" name="proxy_password" value={formData.proxy_password} onChange={handleInputChange} placeholder="Tùy chọn" className="w-full bg-bg-primary border border-border-subtle rounded-xl px-3 py-2 text-text-primary text-sm focus:border-brand-primary outline-none" />
                </div>
              </div>
            </form>
            
            <div className="px-6 py-4 border-t border-border-subtle flex justify-end gap-3 bg-black/20">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl font-medium text-text-secondary hover:text-white transition-colors">
                Hủy bỏ
              </button>
              <button onClick={handleSubmit} className="px-5 py-2.5 bg-brand-primary text-white font-medium rounded-xl hover:opacity-90 transition-all shadow-[0_0_15px_rgba(var(--color-brand-primary),0.3)]">
                {editingId ? 'Lưu cập nhật' : 'Lưu tài khoản'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SocialAccounts;
