import React, { useState, useEffect } from 'react';

const Settings = () => {
  const [fptKey, setFptKey] = useState("");
  const [elevenlabsKey, setElevenlabsKey] = useState("");
  const [geminiKey, setGeminiKey] = useState("");
  const [openaiKey, setOpenaiKey] = useState("");
  const [anthropicKey, setAnthropicKey] = useState("");
  const [xaiKey, setXaiKey] = useState("");
  const [groqKey, setGroqKey] = useState("");
  const [useGroq, setUseGroq] = useState(false);
  const [useGpuAcceleration, setUseGpuAcceleration] = useState(false);
  const [activeAIProvider, setActiveAIProvider] = useState("gemini");
  const [activeTTSProvider, setActiveTTSProvider] = useState("edge");
  const [concurrency, setConcurrency] = useState(1);
  const [douyinCookie, setDouyinCookie] = useState("");
  const [antiDetectProvider, setAntiDetectProvider] = useState("none");
  const [gpmApiUrl, setGpmApiUrl] = useState("");
  const [saveStatus, setSaveStatus] = useState("");
  const [validateStatus, setValidateStatus] = useState({ fpt: "", elevenlabs: "", gemini: "", openai: "", anthropic: "", xai: "", groq: "", douyin: "", gpm: "" });

  useEffect(() => {
    fetch('http://localhost:8000/api/settings/keys')
      .then(res => res.json())
      .then(data => {
        if (data.fpt_ai_api_key) setFptKey(data.fpt_ai_api_key);
        if (data.elevenlabs_api_key) setElevenlabsKey(data.elevenlabs_api_key);
        if (data.gemini_api_key) setGeminiKey(data.gemini_api_key);
        if (data.openai_api_key) setOpenaiKey(data.openai_api_key);
        if (data.anthropic_api_key) setAnthropicKey(data.anthropic_api_key);
        if (data.xai_api_key) setXaiKey(data.xai_api_key);
        if (data.groq_api_key) setGroqKey(data.groq_api_key);
        if (data.use_groq !== undefined) setUseGroq(data.use_groq);
        if (data.use_gpu_acceleration !== undefined) setUseGpuAcceleration(data.use_gpu_acceleration);
        if (data.active_ai_provider) setActiveAIProvider(data.active_ai_provider);
        if (data.active_tts_provider) setActiveTTSProvider(data.active_tts_provider);
        if (data.ai_concurrency_limit) setConcurrency(data.ai_concurrency_limit);
        if (data.douyin_cookie) setDouyinCookie(data.douyin_cookie);
        if (data.anti_detect_provider) setAntiDetectProvider(data.anti_detect_provider);
        if (data.gpm_api_url) setGpmApiUrl(data.gpm_api_url);

        // Tự động kiểm tra trạng thái ngay khi load trang nếu có dữ liệu
        if (data.fpt_ai_api_key || data.gemini_api_key || data.douyin_cookie) {
          fetch('http://localhost:8000/api/settings/validate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fpt_ai_api_key: data.fpt_ai_api_key || "",
              elevenlabs_api_key: data.elevenlabs_api_key || "",
              gemini_api_key: data.gemini_api_key || "",
              openai_api_key: data.openai_api_key || "",
              anthropic_api_key: data.anthropic_api_key || "",
              xai_api_key: data.xai_api_key || "",
              active_ai_provider: data.active_ai_provider || "gemini",
              active_tts_provider: data.active_tts_provider || "edge",
              ai_concurrency_limit: data.ai_concurrency_limit || 1,
              douyin_cookie: data.douyin_cookie || "",
              anti_detect_provider: data.anti_detect_provider || "none",
              gpm_api_url: data.gpm_api_url || ""
            })
          })
            .then(vRes => vRes.json())
            .then(vData => {
              setValidateStatus({
                fpt: vData.fpt_ai_api_key,
                elevenlabs: vData.elevenlabs_api_key,
                gemini: vData.gemini_api_key,
                openai: vData.openai_api_key,
                anthropic: vData.anthropic_api_key,
                xai: vData.xai_api_key,
                groq: vData.groq_api_key,
                douyin: vData.douyin_cookie,
                gpm: vData.gpm_api_url,
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
          elevenlabs_api_key: elevenlabsKey,
          gemini_api_key: geminiKey,
          openai_api_key: openaiKey,
          anthropic_api_key: anthropicKey,
          xai_api_key: xaiKey,
          active_ai_provider: activeAIProvider,
          active_tts_provider: activeTTSProvider,
          ai_concurrency_limit: Number(concurrency),
          douyin_cookie: douyinCookie,
          anti_detect_provider: antiDetectProvider,
          gpm_api_url: gpmApiUrl,
          groq_api_key: groqKey,
          use_groq: useGroq,
          use_gpu_acceleration: useGpuAcceleration
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
            elevenlabs_api_key: elevenlabsKey,
            gemini_api_key: geminiKey,
            openai_api_key: openaiKey,
            anthropic_api_key: anthropicKey,
            xai_api_key: xaiKey,
            active_ai_provider: activeAIProvider,
            active_tts_provider: activeTTSProvider,
            ai_concurrency_limit: Number(concurrency),
            douyin_cookie: douyinCookie,
            anti_detect_provider: antiDetectProvider,
            gpm_api_url: gpmApiUrl,
            groq_api_key: groqKey,
            use_groq: useGroq,
            use_gpu_acceleration: useGpuAcceleration
          })
        });

        if (valRes.ok) {
          const valData = await valRes.json();
          setValidateStatus({
            fpt: valData.fpt_ai_api_key,
            elevenlabs: valData.elevenlabs_api_key,
            gemini: valData.gemini_api_key,
            openai: valData.openai_api_key,
            anthropic: valData.anthropic_api_key,
            xai: valData.xai_api_key,
            groq: valData.groq_api_key,
            douyin: valData.douyin_cookie,
            gpm: valData.gpm_api_url,
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
          <div className="bg-bg-tertiary p-4 rounded-xl border border-border-subtle">
            <label className="block text-sm font-bold text-text-primary mb-2">🎙️ Nền tảng Lồng tiếng (Active TTS Provider)</label>
            <p className="text-xs text-text-secondary mb-3">Chọn nền tảng AI sẽ được dùng để tạo giọng đọc lồng tiếng cho video.</p>
            <select
              className="w-full bg-bg-secondary border border-border-subtle rounded-xl py-3 px-4 text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition-all duration-200"
              value={activeTTSProvider}
              onChange={(e) => setActiveTTSProvider(e.target.value)}
            >
              <option value="edge">Edge-TTS (Miễn phí, Không cần Key)</option>
              <option value="fpt">FPT.AI (Giọng chuẩn Việt Nam)</option>
              <option value="openai">OpenAI TTS (Dùng chung key OpenAI, truyền cảm)</option>
              <option value="elevenlabs">ElevenLabs (Siêu thực, biểu cảm)</option>
            </select>
          </div>

          {activeTTSProvider !== "edge" && (
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                API Key của {
                  activeTTSProvider === "fpt" ? "FPT.AI" :
                    activeTTSProvider === "openai" ? "OpenAI TTS" :
                      activeTTSProvider === "elevenlabs" ? "ElevenLabs" : ""
                }
              </label>
              <input
                type="text"
                className="w-full bg-bg-secondary border border-border-subtle rounded-xl py-3 px-4 text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition-all duration-200"
                placeholder={`Nhập API Key của ${activeTTSProvider} tại đây...`}
                value={
                  activeTTSProvider === "fpt" ? fptKey :
                    activeTTSProvider === "openai" ? openaiKey :
                      activeTTSProvider === "elevenlabs" ? elevenlabsKey : ""
                }
                onChange={(e) => {
                  if (activeTTSProvider === "fpt") setFptKey(e.target.value);
                  else if (activeTTSProvider === "openai") setOpenaiKey(e.target.value);
                  else if (activeTTSProvider === "elevenlabs") setElevenlabsKey(e.target.value);
                }}
              />
              {validateStatus[activeTTSProvider] === "valid" && <p className="text-sm text-green-500 mt-2 font-medium">✓ API Key hợp lệ và đang hoạt động</p>}
              {validateStatus[activeTTSProvider] === "invalid" && <p className="text-sm text-red-500 mt-2 font-medium">✕ API Key không hợp lệ</p>}
            </div>
          )}

          <div className="bg-bg-tertiary p-4 rounded-xl border border-border-subtle">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-bold text-text-primary">⚡ Bóc băng Siêu tốc (Groq API)</label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={useGroq}
                  onChange={(e) => setUseGroq(e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
              </label>
            </div>
            <p className="text-xs text-text-secondary mb-3">Sử dụng mô hình LPU siêu tốc của Groq để thay thế CPU nội bộ cho việc bóc tách phụ đề. Tốc độ &lt; 1 giây. Cần nhập API Key.</p>
            
            {useGroq && (
              <div className="mt-4">
                <input
                  type="text"
                  className="w-full bg-bg-secondary border border-border-subtle rounded-xl py-3 px-4 text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition-all duration-200"
                  placeholder="Nhập API Key của Groq tại đây..."
                  value={groqKey}
                  onChange={(e) => setGroqKey(e.target.value)}
                />
                {validateStatus.groq === "valid" && <p className="text-sm text-green-500 mt-2 font-medium">✓ API Key hợp lệ và đang hoạt động</p>}
                {validateStatus.groq === "invalid" && <p className="text-sm text-red-500 mt-2 font-medium">✕ API Key không hợp lệ</p>}
              </div>
            )}
          </div>

          <div className="bg-bg-tertiary p-4 rounded-xl border border-border-subtle">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-bold text-text-primary">🖥️ Tăng tốc phần cứng (GPU Acceleration)</label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={useGpuAcceleration}
                  onChange={(e) => setUseGpuAcceleration(e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
              </label>
            </div>
            <p className="text-xs text-text-secondary">Sử dụng GPU (Intel QSV / Nvidia NVENC) để tăng tốc độ xử lý video bằng FFMPEG và giảm tải CPU. Hệ thống sẽ tự động quét và kiểm tra xem thiết bị của bạn có hỗ trợ GPU nào không.</p>
          </div>

          <div className="bg-bg-tertiary p-4 rounded-xl border border-border-subtle">
            <label className="block text-sm font-bold text-text-primary mb-2">🤖 AI Mặc định (Active AI Provider)</label>
            <p className="text-xs text-text-secondary mb-3">Chọn AI sẽ được sử dụng mặc định để Dịch thuật và Sinh Caption tự động (Lưu ý: Tính năng "Phân vai Nam/Nữ" qua âm thanh luôn dùng Gemini. Vui lòng đảm bảo bạn đã chọn Gemini và lưu Key ít nhất 1 lần).</p>
            <select
              className="w-full bg-bg-secondary border border-border-subtle rounded-xl py-3 px-4 text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition-all duration-200"
              value={activeAIProvider}
              onChange={(e) => setActiveAIProvider(e.target.value)}
            >
              <option value="gemini">Google Gemini (Khuyên dùng - gemini-2.5-flash)</option>
              <option value="openai">OpenAI (ChatGPT - gpt-4o-mini)</option>
              <option value="anthropic">Anthropic (Claude - claude-3-haiku)</option>
              <option value="xai">xAI (Grok - grok-beta)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              API Key của {
                activeAIProvider === "gemini" ? "Google Gemini" :
                  activeAIProvider === "openai" ? "OpenAI (ChatGPT)" :
                    activeAIProvider === "anthropic" ? "Anthropic (Claude)" : "xAI (Grok)"
              }
            </label>
            <input
              type="text"
              className="w-full bg-bg-secondary border border-border-subtle rounded-xl py-3 px-4 text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition-all duration-200"
              placeholder={`Nhập API Key của ${activeAIProvider} tại đây...`}
              value={
                activeAIProvider === "gemini" ? geminiKey :
                  activeAIProvider === "openai" ? openaiKey :
                    activeAIProvider === "anthropic" ? anthropicKey : xaiKey
              }
              onChange={(e) => {
                if (activeAIProvider === "gemini") setGeminiKey(e.target.value);
                else if (activeAIProvider === "openai") setOpenaiKey(e.target.value);
                else if (activeAIProvider === "anthropic") setAnthropicKey(e.target.value);
                else setXaiKey(e.target.value);
              }}
            />
            {validateStatus[activeAIProvider] === "valid" && <p className="text-sm text-green-500 mt-2 font-medium">✓ API Key hợp lệ và đang hoạt động</p>}
            {validateStatus[activeAIProvider] === "invalid" && <p className="text-sm text-red-500 mt-2 font-medium">✕ API Key không hợp lệ</p>}
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

          <div className="bg-bg-tertiary p-4 rounded-xl border border-border-subtle">
            <label className="block text-sm font-bold text-text-primary mb-2">🛡️ Cấu hình Trình duyệt chống phát hiện (Anti-Detect Browser)</label>
            <p className="text-xs text-text-secondary mb-3">Tích hợp phần mềm ẩn danh để an toàn tuyệt đối khi đăng video / Nuôi tài khoản tránh bị Shadowban.</p>
            <select
              className="w-full bg-bg-secondary border border-border-subtle rounded-xl py-3 px-4 text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition-all duration-200 mb-4"
              value={antiDetectProvider}
              onChange={(e) => setAntiDetectProvider(e.target.value)}
            >
              <option value="none">Không dùng (Dùng Trình duyệt Web cơ bản của Playwright)</option>
              <option value="gpm">GPM Login (GPMLogin API)</option>
            </select>
            
            {antiDetectProvider === "gpm" && (
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Đường dẫn API của GPM Login</label>
                <input
                  type="text"
                  className="w-full bg-bg-secondary border border-border-subtle rounded-xl py-3 px-4 text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition-all duration-200"
                  placeholder="Ví dụ: http://127.0.0.1:19995"
                  value={gpmApiUrl}
                  onChange={(e) => setGpmApiUrl(e.target.value)}
                />
                <p className="text-xs text-text-tertiary mt-2">Mở app GPMLogin -{">"} Cài đặt -{">"} Bật API -{">"} Lấy cổng localhost dán vào đây.</p>
                {validateStatus.gpm === "valid" && <p className="text-sm text-green-500 mt-2 font-medium">✓ Đã kết nối thành công tới GPM Login API</p>}
                {validateStatus.gpm === "invalid" && <p className="text-sm text-red-500 mt-2 font-medium">✕ Không thể kết nối. Hãy đảm bảo phần mềm GPMLogin đang bật và tính năng API đã được kích hoạt.</p>}
              </div>
            )}
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
