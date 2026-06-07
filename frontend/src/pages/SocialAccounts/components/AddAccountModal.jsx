import React from 'react';
import { Globe, Shield, Smartphone } from 'lucide-react';

export const AddAccountModal = ({ hook }) => {
  const { 
    isModalOpen, setIsModalOpen, editingId,
    formData, handleInputChange, handleSubmit, handleAutoLogin,
    proxiesList, fetchProxiesList
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

              <div className="mb-6">
                <div className="flex justify-between items-end mb-2">
                  <label className="block text-sm font-medium text-text-secondary">User Agent (Trình duyệt ảo)</label>
                  <button 
                    type="button" 
                    onClick={() => {
                      const uas = [
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0",
                        "Mozilla/5.0 (Macintosh; Intel Mac OS X 14.4; rv:124.0) Gecko/20100101 Firefox/124.0",
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edge/123.0.0.0 Safari/537.36"
                      ];
                      const randomUa = uas[Math.floor(Math.random() * uas.length)];
                      handleInputChange({ target: { name: 'user_agent', value: randomUa } });
                    }}
                    className="flex items-center gap-1.5 text-xs font-bold bg-border-subtle text-text-primary px-3 py-1.5 rounded-lg hover:bg-glass-hover transition-colors"
                  >
                    Tạo Ngẫu Nhiên
                  </button>
                </div>
                <input name="user_agent" value={formData.user_agent || ''} onChange={handleInputChange} placeholder="Để trống hệ thống sẽ dùng Chrome mặc định..." className="w-full bg-bg-primary border border-border-subtle rounded-xl px-4 py-3 text-text-primary focus:border-brand-primary outline-none text-sm" />
                <p className="text-xs text-text-secondary mt-1">Nên tạo User-Agent riêng biệt cho từng tài khoản để tránh bị TikTok quét dính bot (Shadowban).</p>
              </div>

              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-text-primary flex items-center gap-2"><Shield size={18} className="text-text-secondary"/> Cấu hình Proxy (Tùy chọn)</h3>
                <button 
                  type="button"
                  onClick={fetchProxiesList}
                  className="text-xs text-brand-primary hover:underline flex items-center gap-1"
                >
                  ↻ Tải lại danh sách
                </button>
              </div>
              <p className="text-xs text-text-secondary mb-3">Nếu chọn Proxy dưới đây, hãy chọn TRƯỚC KHI bấm Lấy Cookie Tự Động để hệ thống bọc IP luôn.</p>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-text-secondary mb-2">Chọn Proxy từ Kho dữ liệu</label>
                <select 
                  name="proxy_id" 
                  value={formData.proxy_id || ''} 
                  onChange={handleInputChange} 
                  className="w-full bg-bg-primary border border-border-subtle rounded-xl px-4 py-3 text-text-primary focus:border-brand-primary outline-none"
                >
                  <option value="">-- Không dùng Proxy (Sử dụng IP Máy chủ) --</option>
                  {proxiesList && proxiesList.map(proxy => (
                    <option key={proxy.id} value={proxy.id}>
                      {proxy.name} ({proxy.host}:{proxy.port}) - {proxy.status === 'active' ? '🟢 Live' : '🔴 Dead'}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-text-secondary mt-2">
                  Bạn có thể quản lý và thêm mới Proxy trong menu <b>Quản lý Proxy</b> ở thanh điều hướng bên trái.
                </p>
              </div>
              
              {/* Legacy fallback - only show if no proxy_id is selected and there's old data */}
              {!formData.proxy_id && formData.proxy_host && (
                <div className="mt-4 p-4 border border-yellow-500/20 bg-yellow-500/5 rounded-xl">
                  <p className="text-xs text-yellow-500 mb-3 font-medium">Tài khoản này đang dùng cấu hình Proxy cũ (Legacy). Khuyến nghị chuyển sang chọn Proxy từ danh sách phía trên.</p>
                  <div className="grid grid-cols-2 gap-4 opacity-70 cursor-not-allowed">
                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1">IP Host (Legacy)</label>
                      <input disabled value={formData.proxy_host || ''} className="w-full bg-bg-secondary border border-border-subtle rounded-xl px-3 py-2 text-text-secondary text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1">Port (Legacy)</label>
                      <input disabled value={formData.proxy_port || ''} className="w-full bg-bg-secondary border border-border-subtle rounded-xl px-3 py-2 text-text-secondary text-sm" />
                    </div>
                  </div>
                </div>
              )}
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
