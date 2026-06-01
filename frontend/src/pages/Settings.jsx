import React, { useState, useEffect } from 'react';

const Settings = () => {
  const [fptKey, setFptKey] = useState("");
  const [geminiKey, setGeminiKey] = useState("");
  const [concurrency, setConcurrency] = useState(1);
  const [douyinCookie, setDouyinCookie] = useState("");
  const [saveStatus, setSaveStatus] = useState("");
  const [validateStatus, setValidateStatus] = useState({ fpt: "", gemini: "", douyin: "" });

  useEffect(() => {
    fetch('http://localhost:8000/api/settings/keys')
      .then(res => res.json())
      .then(data => {
        if (data.fpt_ai_api_key) setFptKey(data.fpt_ai_api_key);
        if (data.gemini_api_key) setGeminiKey(data.gemini_api_key);
        if (data.ai_concurrency_limit) setConcurrency(data.ai_concurrency_limit);
        if (data.douyin_cookie) setDouyinCookie(data.douyin_cookie);
        
        // Tự động kiểm tra trạng thái ngay khi load trang nếu có dữ liệu
        if (data.fpt_ai_api_key || data.gemini_api_key || data.douyin_cookie) {
          fetch('http://localhost:8000/api/settings/validate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              fpt_ai_api_key: data.fpt_ai_api_key || "", 
              gemini_api_key: data.gemini_api_key || "",
              ai_concurrency_limit: data.ai_concurrency_limit || 1,
              douyin_cookie: data.douyin_cookie || ""
            })
          })
          .then(vRes => vRes.json())
          .then(vData => {
            setValidateStatus({
              fpt: vData.fpt_ai_api_key,
              gemini: vData.gemini_api_key,
              douyin: vData.douyin_cookie,
              douyin_details: vData.douyin_details || null
            });
          })
          .catch(err => console.error("Lỗi validate:", err));
        }
      })
      .catch(err => console.error(err));
  }, []);

  const handleSave = async () => {
    setSaveStatus("Đang lưu...");
    try {
      const res = await fetch('http://localhost:8000/api/settings/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          fpt_ai_api_key: fptKey, 
          gemini_api_key: geminiKey,
          ai_concurrency_limit: Number(concurrency),
          douyin_cookie: douyinCookie
        })
      });
      if (res.ok) {
        setSaveStatus("Đã lưu thành công! Đang kiểm tra kết nối...");
        
        // Gọi API kiểm tra validate
        const valRes = await fetch('http://localhost:8000/api/settings/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            fpt_ai_api_key: fptKey, 
            gemini_api_key: geminiKey,
            ai_concurrency_limit: Number(concurrency),
            douyin_cookie: douyinCookie
          })
        });
        
        if (valRes.ok) {
          const valData = await valRes.json();
          setValidateStatus({
            fpt: valData.fpt_ai_api_key,
            gemini: valData.gemini_api_key,
            douyin: valData.douyin_cookie,
            douyin_details: valData.douyin_details || null
          });
        }
        
        setTimeout(() => setSaveStatus(""), 4000);
      } else {
        setSaveStatus("Lỗi khi lưu!");
      }
    } catch (e) {
      setSaveStatus("Lỗi kết nối server!");
    }
  };

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 rounded-2xl max-w-3xl">
        <h3 className="text-xl font-bold mb-6 tracking-tight">Cấu Hình Hệ Thống</h3>
        <form className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">API Key FPT.AI (Dùng cho tính năng lồng tiếng mở rộng)</label>
            <input 
              type="text" 
              className="w-full bg-bg-secondary border border-border-subtle rounded-xl py-3 px-4 text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition-all duration-200" 
              placeholder="Nhập API Key của FPT.AI tại đây..." 
              value={fptKey}
              onChange={(e) => setFptKey(e.target.value)}
            />
            {validateStatus.fpt === "valid" && <p className="text-sm text-green-500 mt-2 font-medium">✓ API Key hợp lệ và đang hoạt động</p>}
            {validateStatus.fpt === "invalid" && <p className="text-sm text-red-500 mt-2 font-medium">✕ API Key không hợp lệ hoặc đã hết hạn</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Google Gemini API Key (Dùng cho AI Dịch Thuật & Sinh Caption)</label>
            <input 
              type="text" 
              className="w-full bg-bg-secondary border border-border-subtle rounded-xl py-3 px-4 text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition-all duration-200" 
              placeholder="Nhập API Key của Google Gemini tại đây..." 
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
            />
            {validateStatus.gemini === "valid" && <p className="text-sm text-green-500 mt-2 font-medium">✓ API Key Gemini hợp lệ và đang hoạt động</p>}
            {validateStatus.gemini === "invalid" && <p className="text-sm text-red-500 mt-2 font-medium">✕ API Key Gemini không hợp lệ</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Số luồng xử lý AI song song (Max Concurrency)</label>
            <input 
              type="number" 
              min="1"
              max="10"
              className="w-full bg-bg-secondary border border-border-subtle rounded-xl py-3 px-4 text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition-all duration-200" 
              value={concurrency}
              onChange={(e) => setConcurrency(e.target.value)}
            />
            <p className="text-xs text-text-secondary mt-2 italic">Lưu ý: Tăng số luồng sẽ tốn nhiều RAM/VRAM máy chủ hơn khi dùng AI Whisper/TTS nội bộ.</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Cookie Douyin (Bắt buộc nếu lỗi cào)</label>
            <textarea 
              className="w-full bg-bg-secondary border border-border-subtle rounded-xl py-3 px-4 text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition-all duration-200 font-mono text-sm" 
              rows="4" 
              placeholder="Nhập chuỗi cookie (ttwid=...; sessionid=...;) vào đây..."
              value={douyinCookie}
              onChange={(e) => setDouyinCookie(e.target.value)}
            ></textarea>
            {validateStatus.douyin === "valid" && (
              <div className="mt-2 text-sm bg-bg-tertiary p-3 rounded-lg border border-border-subtle">
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
              <div className="mt-2 text-sm bg-bg-tertiary p-3 rounded-lg border border-red-500/30">
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
              <div className="mt-2 text-sm bg-bg-tertiary p-3 rounded-lg border border-red-500/30">
                <p className="text-red-500 font-medium">✕ Thiếu Cookie Douyin!</p>
                <p className="text-amber-500 font-medium mt-1">
                  ⚠ Nếu không có Cookie, tính năng <span className="font-bold">Cào Video</span> và <span className="font-bold">Tìm Kiếm Khám Phá</span> sẽ KHÔNG hoạt động. 
                  (Chỉ duy nhất "Bảng xếp hạng Hot Trend" là xem được do Douyin không yêu cầu đăng nhập cho bảng này).
                </p>
              </div>
            )}
            <p className="text-xs text-text-secondary mt-2 italic">Dán nội dung Cookie của trình duyệt (Nhấn F12 trên Douyin, xem tab Network) vào đây.</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">HTTP Proxy (Tuỳ chọn)</label>
            <input 
              type="text" 
              className="w-full bg-bg-secondary border border-border-subtle rounded-xl py-3 px-4 text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition-all duration-200" 
              placeholder="http://user:pass@ip:port" 
            />
          </div>
          
          <div className="flex items-center gap-4 pt-2">
            <button 
              type="button" 
              className="bg-brand-primary hover:bg-brand-hover text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 active:scale-95" 
              onClick={handleSave}
            >
              Lưu cấu hình
            </button>
            {saveStatus && (
              <span className={`text-sm font-medium ${saveStatus.includes('thành công') ? 'text-green-500' : 'text-brand-primary'}`}>
                {saveStatus}
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default Settings;
