import React from 'react';
import { Globe, Shield, Smartphone } from 'lucide-react';

export const AddAccountModal = ({ hook }) => {
  const { 
    isModalOpen, setIsModalOpen, editingId,
    formData, handleInputChange, handleSubmit, handleAutoLogin
  } = hook;

  if (!isModalOpen) return null;

  return (
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
            <label className="block text-sm font-medium text-text-secondary mb-2">Phương thức hoạt động</label>
            <div className="flex gap-4">
              <label className={`flex-1 flex items-center justify-center gap-2 py-3 border rounded-xl cursor-pointer transition-colors ${formData.connection_type === 'web_playwright' ? 'border-brand-primary bg-brand-primary/10 text-brand-primary font-bold' : 'border-border-subtle hover:bg-glass-hover text-text-secondary font-medium'}`}>
                <input type="radio" name="connection_type" value="web_playwright" className="hidden" checked={formData.connection_type === 'web_playwright'} onChange={handleInputChange} />
                <Globe size={18} /> Web Browser
              </label>
              <label className={`flex-1 flex items-center justify-center gap-2 py-3 border rounded-xl cursor-pointer transition-colors ${formData.connection_type === 'gpm_login' ? 'border-green-500 bg-green-500/10 text-green-400 font-bold' : 'border-border-subtle hover:bg-glass-hover text-text-secondary font-medium'}`}>
                <input type="radio" name="connection_type" value="gpm_login" className="hidden" checked={formData.connection_type === 'gpm_login'} onChange={handleInputChange} />
                <Shield size={18} /> GPM Login
              </label>
              <label className={`flex-1 flex items-center justify-center gap-2 py-3 border rounded-xl cursor-pointer transition-colors ${formData.connection_type === 'adb_device' ? 'border-purple-500 bg-purple-500/10 text-purple-400 font-bold' : 'border-border-subtle hover:bg-glass-hover text-text-secondary font-medium'}`}>
                <input type="radio" name="connection_type" value="adb_device" className="hidden" checked={formData.connection_type === 'adb_device'} onChange={handleInputChange} />
                <Smartphone size={18} /> App (ADB)
              </label>
            </div>
          </div>

          {formData.connection_type === 'web_playwright' ? (
            <>
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
            </>
          ) : (
            <div className="mb-6">
              <label className="block text-sm font-medium text-text-secondary mb-2">
                {formData.connection_type === 'gpm_login' ? 'GPM Profile ID' : 'Device ID (Serial của Điện thoại / Máy ảo)'}
              </label>
              <input name="device_id" value={formData.device_id} onChange={handleInputChange} placeholder={formData.connection_type === 'gpm_login' ? "VD: ef7db922-4217-4927-a006-2c5e533b37ea" : "VD: emulator-5554"} className="w-full bg-bg-primary border border-border-subtle rounded-xl px-4 py-3 text-text-primary focus:border-brand-primary outline-none" />
              <p className="text-xs text-text-secondary mt-2 flex items-start gap-1">
                <Shield size={14} className="mt-0.5 text-brand-primary shrink-0" />
                {formData.connection_type === 'gpm_login' 
                  ? "Hệ thống sẽ lấy Profile ID này để mở tự động cấu hình GPM đã gắn sẵn cho tài khoản này." 
                  : "Hệ thống sẽ dùng ID này để chạy lệnh ADB tương tác với điện thoại Android."}
              </p>
            </div>
          )}
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
  );
};
