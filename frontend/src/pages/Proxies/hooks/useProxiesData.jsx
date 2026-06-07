import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

export function useProxiesData() {
  const [proxies, setProxies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProxy, setEditingProxy] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    host: '',
    port: '',
    username: '',
    password: ''
  });

  const fetchProxies = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:8000/api/proxies/');
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Lỗi khi tải danh sách Proxy');
      setProxies(data);
    } catch (err) {
      toast.error('Lỗi khi tải danh sách Proxy');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProxies();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      host: '',
      port: '',
      username: '',
      password: ''
    });
    setEditingProxy(null);
  };

  const handleEdit = (proxy) => {
    setEditingProxy(proxy);
    setFormData({
      name: proxy.name || '',
      host: proxy.host || '',
      port: proxy.port || '',
      username: proxy.username || '',
      password: proxy.password || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const loadingToast = toast.loading(editingProxy ? 'Đang cập nhật...' : 'Đang thêm Proxy...');
    try {
      const url = editingProxy 
        ? `http://localhost:8000/api/proxies/${editingProxy.id}` 
        : 'http://localhost:8000/api/proxies/';
      
      const res = await fetch(url, {
        method: editingProxy ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (!res.ok) throw new Error('Có lỗi xảy ra');
      
      toast.success(editingProxy ? 'Cập nhật Proxy thành công' : 'Thêm Proxy thành công', { id: loadingToast });
      setIsModalOpen(false);
      resetForm();
      fetchProxies();
    } catch (err) {
      toast.error('Lỗi khi lưu Proxy', { id: loadingToast });
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    toast((t) => (
      <div className="flex flex-col gap-4 p-1">
        <div>
          <p className="font-bold text-text-primary text-base mb-1">Xóa Proxy này?</p>
          <p className="text-text-secondary text-sm">Proxy sẽ bị xóa khỏi hệ thống.</p>
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
                const res = await fetch(`http://localhost:8000/api/proxies/${id}`, { method: 'DELETE' });
                if (!res.ok) throw new Error('Xóa thất bại');
                toast.success('Xóa Proxy thành công', { id: loadingToast });
                fetchProxies();
              } catch (err) {
                toast.error('Lỗi khi xóa Proxy', { id: loadingToast });
                console.error(err);
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

  const handleCheck = async (id) => {
    const loadingToast = toast.loading('Đang kiểm tra kết nối...');
    try {
      const res = await fetch(`http://localhost:8000/api/proxies/${id}/check`, { method: 'POST' });
      const data = await res.json();
      
      if (res.ok && data.status === 'success') {
        toast.success(`Kết nối thành công! IP: ${data.ip} - ${data.country}`, { id: loadingToast });
      } else {
        toast.error(`Proxy lỗi: ${data.message || data.detail}`, { id: loadingToast });
      }
      fetchProxies(); // Reload status
    } catch (err) {
      toast.error('Lỗi kết nối tới backend', { id: loadingToast });
      console.error(err);
    }
  };

  return {
    proxies,
    loading,
    isModalOpen,
    setIsModalOpen,
    formData,
    editingProxy,
    handleInputChange,
    resetForm,
    handleEdit,
    handleSubmit,
    handleDelete,
    handleCheck,
    fetchProxies
  };
}
