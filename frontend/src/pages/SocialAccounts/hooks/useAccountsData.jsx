import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

const API_BASE = 'http://localhost:8000/api';

export const useAccountsData = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [warmingUpIds, setWarmingUpIds] = useState([]);

  const [formData, setFormData] = useState({
    platform: 'tiktok',
    username: '',
    account_id: '',
    avatar_url: '',
    auth_data: '',
    proxy_host: '',
    proxy_port: '',
    proxy_username: '',
    proxy_password: '',
    proxy_id: '',
    connection_type: 'web_playwright',
    device_id: '',
    user_agent: ''
  });

  const [proxiesList, setProxiesList] = useState([]);

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

  const fetchProxiesList = async () => {
    try {
      const res = await fetch(`${API_BASE}/proxies/`);
      const data = await res.json();
      setProxiesList(data);
    } catch (err) {
      console.error('Không thể tải danh sách proxy');
    }
  };

  useEffect(() => {
    fetchAccounts();
    fetchProxiesList();
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
      proxy_password: '',
      proxy_id: '',
      connection_type: 'web_playwright',
      device_id: '',
      user_agent: ''
    });
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isEdit = !!editingId;
    const url = isEdit ? `${API_BASE}/social-accounts/${editingId}` : `${API_BASE}/social-accounts/`;
    const method = isEdit ? 'PUT' : 'POST';

    const payload = { ...formData };
    if (payload.proxy_id === '') {
      payload.proxy_id = null;
    } else if (payload.proxy_id) {
      payload.proxy_id = parseInt(payload.proxy_id, 10);
    }

    const loadingToast = toast.loading(isEdit ? 'Đang cập nhật...' : 'Đang thêm tài khoản...');
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) throw new Error('Có lỗi xảy ra');
      
      toast.success(isEdit ? 'Cập nhật thành công!' : 'Thêm tài khoản thành công!', { id: loadingToast });
      setIsModalOpen(false);
      resetForm();
      fetchAccounts();
    } catch (err) {
      toast.error(err.message, { id: loadingToast });
    }
  };

  const handleAutoLogin = async () => {
    let proxyString = "";
    
    // Check if proxy_id is selected
    if (formData.proxy_id) {
      const selectedProxy = proxiesList.find(p => p.id === parseInt(formData.proxy_id));
      if (selectedProxy) {
        proxyString = `http://`;
        if (selectedProxy.username) {
          proxyString += `${selectedProxy.username}:${selectedProxy.password}@`;
        }
        proxyString += `${selectedProxy.host}:${selectedProxy.port || '80'}`;
      }
    } else if (formData.proxy_host) { // Fallback for old legacy proxy configuration
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
      auth_data: account.auth_data || '',
      proxy_host: account.proxy_host || '',
      proxy_port: account.proxy_port || '',
      proxy_username: account.proxy_username || '',
      proxy_password: account.proxy_password || '',
      proxy_id: account.proxy_id || '',
      connection_type: account.connection_type || 'web_playwright',
      device_id: account.device_id || '',
      user_agent: account.user_agent || ''
    });
    setEditingId(account.id);
    setIsModalOpen(true);
  };

  const handleSync = async () => {
    const loadingToast = toast.loading('Đang quét thư mục data/accounts để đồng bộ...');
    try {
      const res = await fetch(`${API_BASE}/social-accounts/sync`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Đồng bộ thất bại');
      toast.success(`Đồng bộ hoàn tất! (Thêm mới: ${data.added_count}, Cập nhật: ${data.updated_count})`, { id: loadingToast });
      fetchAccounts();
    } catch (err) {
      toast.error(err.message, { id: loadingToast });
    }
  };

  const triggerWarmup = async (accId) => {
    if (warmingUpIds.includes(accId)) return;
    const loadingToast = toast.loading('Đang kích hoạt tiến trình Nuôi tài khoản...');
    try {
      const res = await fetch(`${API_BASE}/social-accounts/${accId}/warmup`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Lỗi khi gọi API');
      toast.success(data.message || 'Đã đưa vào hàng đợi chạy ngầm!', { id: loadingToast });
      setWarmingUpIds(prev => [...prev, accId]);
      fetchAccounts();
    } catch (err) {
      toast.error(err.message, { id: loadingToast });
    }
  };
  const stopWarmup = async (accId) => {
    const loadingToast = toast.loading('Đang dừng tiến trình Nuôi tài khoản...');
    try {
      const res = await fetch(`${API_BASE}/social-accounts/${accId}/stop-warmup`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Lỗi khi gọi API');
      toast.success(data.message || 'Đã dừng nuôi tài khoản!', { id: loadingToast });
      setWarmingUpIds(prev => prev.filter(id => id !== accId));
      fetchAccounts(); // Lấy lại status mới nhất
    } catch (err) {
      toast.error(err.message, { id: loadingToast });
    }
  };

  return {
    accounts, proxiesList, loading, isModalOpen, setIsModalOpen, editingId, warmingUpIds,
    formData, handleInputChange, resetForm, handleSubmit, handleAutoLogin,
    handleDelete, checkStatus, openEditModal, handleSync, triggerWarmup, stopWarmup, fetchProxiesList
  };
};
