import React from 'react';

const BrowserTab = ({
  douyinCookie, setDouyinCookie,
  antiDetectProvider, setAntiDetectProvider,
  gpmApiUrl, setGpmApiUrl,
  validateStatus
}) => {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">Cookie Douyin (Bắt buộc nếu lỗi cào)</label>
        <textarea
          className="w-full bg-bg-secondary border border-border-subtle rounded-xl py-3 px-4 text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition-all duration-200 font-mono text-xs leading-relaxed"
          rows="5"
          placeholder="Nhập chuỗi cookie (ttwid=...; sessionid=...;) vào đây..."
          value={douyinCookie}
          onChange={(e) => setDouyinCookie(e.target.value)}
        ></textarea>
        {validateStatus.douyin === "valid" && (
          <div className="mt-2 text-sm bg-bg-tertiary/20 p-3 rounded-lg border border-border-subtle">
            <p className="text-green-500 font-medium">✓ Douyin API trả về thành công</p>
            {validateStatus.douyin_details?.expires && (
              <p className="text-text-secondary mt-1">🗓️ Hết hạn: <span className="text-text-primary font-medium">{validateStatus.douyin_details.expires}</span></p>
            )}
            {validateStatus.douyin_details?.missing?.length > 0 && (
              <p className="text-amber-500 font-medium mt-1">
                ⚠ Thiếu thông số: {validateStatus.douyin_details.missing.join(', ')} (Có thể gây lỗi khi tìm kiếm)
              </p>
            )}
          </div>
        )}
        {validateStatus.douyin === "invalid" && (
          <div className="mt-2 text-sm bg-bg-tertiary/20 p-3 rounded-lg border border-red-500/30">
            <p className="text-red-500 font-medium">✕ Cookie đã hết hạn hoặc bị Douyin từ chối. Vui lòng lấy lại Cookie mới!</p>
            {validateStatus.douyin_details?.expires && (
              <p className="text-text-secondary mt-1">🗓️ Hết hạn: <span className="text-text-primary font-medium">{validateStatus.douyin_details.expires}</span></p>
            )}
            {validateStatus.douyin_details?.missing?.length > 0 && (
              <p className="text-amber-500 font-medium mt-1">
                ⚠ Thiếu thông số: {validateStatus.douyin_details.missing.join(', ')} (Cần copy ĐẦY ĐỦ chuỗi cookie từ tab Network)
              </p>
            )}
          </div>
        )}
        {validateStatus.douyin === "missing" && (
          <div className="mt-2 text-sm bg-bg-tertiary/20 p-3 rounded-lg border border-red-500/30">
            <p className="text-red-500 font-medium">✕ Thiếu Cookie Douyin!</p>
            <p className="text-amber-500 font-medium mt-1">
              ⚠ Nếu không có Cookie, tính năng <span className="font-bold">Cào Video</span> và <span className="font-bold">Tìm Kiếm Khám Phá</span> sẽ KHÔNG hoạt động.
              (Chỉ duy nhất "Bảng xếp hạng Hot Trend" là xem được do Douyin không yêu cầu đăng nhập cho bảng này).
            </p>
          </div>
        )}
        <p className="text-xs text-text-secondary mt-2 italic">Dán nội dung Cookie của trình duyệt (Nhấn F12 trên Douyin, xem tab Network) vào đây.</p>
      </div>

      <div className="bg-bg-tertiary/40 p-4 rounded-xl border border-border-subtle">
        <label className="block text-sm font-bold text-text-primary mb-2">🛡️ Cấu hình Trình duyệt chống phát hiện (Anti-Detect Browser)</label>
        <p className="text-xs text-text-secondary mb-3">Tích hợp phần mềm ẩn danh để an toàn tuyệt đối khi đăng video / Nuôi tài khoản tránh bị Shadowban.</p>
        <select
          className="w-full bg-bg-secondary border border-border-subtle rounded-xl py-3 px-4 text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition-all duration-200 mb-4 cursor-pointer text-sm"
          value={antiDetectProvider}
          onChange={(e) => setAntiDetectProvider(e.target.value)}
        >
          <option value="none">Không dùng (Dùng Trình duyệt Web cơ bản của Playwright)</option>
          <option value="gpm">GPM Login (GPMLogin API)</option>
        </select>
        
        {antiDetectProvider === "gpm" && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-text-secondary mb-2">Đường dẫn API của GPM Login</label>
            <input
              type="text"
              className="w-full bg-bg-secondary border border-border-subtle rounded-xl py-3 px-4 text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition-all duration-200 text-sm font-medium"
              placeholder="Ví dụ: http://127.0.0.1:19995"
              value={gpmApiUrl}
              onChange={(e) => setGpmApiUrl(e.target.value)}
            />
            <p className="text-xs text-text-secondary mt-2">Mở app GPMLogin -{">"} Cài đặt -{">"} Bật API -{">"} Lấy cổng localhost dán vào đây.</p>
            {validateStatus.gpm === "valid" && <p className="text-sm text-green-500 mt-2 font-medium">✓ Đã kết nối thành công tới GPM Login API</p>}
            {validateStatus.gpm === "invalid" && <p className="text-sm text-red-500 mt-2 font-medium">✕ Không thể kết nối. Hãy đảm bảo phần mềm GPMLogin đang bật và tính năng API đã được kích hoạt.</p>}
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">HTTP Proxy (Tuỳ chọn)</label>
        <input
          type="text"
          className="w-full bg-bg-secondary border border-border-subtle rounded-xl py-3 px-4 text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition-all duration-200 text-sm font-medium"
          placeholder="http://user:pass@ip:port"
        />
      </div>
    </div>
  );
};

export default BrowserTab;
