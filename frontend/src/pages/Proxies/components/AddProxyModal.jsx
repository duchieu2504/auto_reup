import React from 'react';
import { X, Shield } from 'lucide-react';

export function AddProxyModal({ hook }) {
  const { isModalOpen, setIsModalOpen, formData, handleInputChange, handleSubmit, editingProxy, resetForm } = hook;

  if (!isModalOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#121214] rounded-2xl border border-white/10 w-full max-w-xl overflow-hidden shadow-2xl">
        <div className="flex justify-between items-center p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-primary/20 flex items-center justify-center text-brand-primary">
              <Shield size={20} />
            </div>
            <h2 className="text-xl font-bold text-white">
              {editingProxy ? 'Chỉnh Sửa Proxy' : 'Thêm Proxy Mới'}
            </h2>
          </div>
          <button 
            onClick={() => { setIsModalOpen(false); resetForm(); }}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Tên Gợi Nhớ (Ví dụ: Proxy US 1) <span className="text-red-500">*</span></label>
            <input
              required
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all"
              placeholder="Nhập tên proxy..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Host / IP <span className="text-red-500">*</span></label>
              <input
                required
                type="text"
                name="host"
                value={formData.host}
                onChange={handleInputChange}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all font-mono text-sm"
                placeholder="192.168.1.1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Port <span className="text-red-500">*</span></label>
              <input
                required
                type="text"
                name="port"
                value={formData.port}
                onChange={handleInputChange}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all font-mono text-sm"
                placeholder="8080"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Username (Nếu có)</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all"
                placeholder="Tài khoản proxy"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Password (Nếu có)</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all"
                placeholder="Mật khẩu proxy"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={() => { setIsModalOpen(false); resetForm(); }}
              className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-white font-medium rounded-xl transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-brand-primary hover:bg-brand-primary/90 text-white font-medium rounded-xl transition-colors shadow-[0_0_20px_rgba(var(--color-brand-primary),0.3)]"
            >
              {editingProxy ? 'Lưu Thay Đổi' : 'Thêm Proxy'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
