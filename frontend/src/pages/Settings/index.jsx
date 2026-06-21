import React, { useState, useEffect } from 'react';

const Settings = () => {
  const [fptKey, setFptKey] = useState("");
  const [elevenlabsKey, setElevenlabsKey] = useState("");
  const [geminiKey, setGeminiKey] = useState("");
  const [geminiModel, setGeminiModel] = useState("gemini-3.5-flash");
  const [openaiKey, setOpenaiKey] = useState("");
  const [anthropicKey, setAnthropicKey] = useState("");
  const [xaiKey, setXaiKey] = useState("");
  const [groqKey, setGroqKey] = useState("");
  const [pexelsKey, setPexelsKey] = useState("");
  const [useGroq, setUseGroq] = useState(false);
  const [useGpuAcceleration, setUseGpuAcceleration] = useState(false);
  const [enableHealthCheck, setEnableHealthCheck] = useState(false);
  const [healthCheckInterval, setHealthCheckInterval] = useState(4);
  const [activeAIProvider, setActiveAIProvider] = useState("gemini");
  const [activeTTSProvider, setActiveTTSProvider] = useState("edge");
  const [concurrency, setConcurrency] = useState(1);
  const [douyinCookie, setDouyinCookie] = useState("");
  const [antiDetectProvider, setAntiDetectProvider] = useState("none");
  const [gpmApiUrl, setGpmApiUrl] = useState("");
  const [themeBgType, setThemeBgType] = useState("default");
  const [themeBgCustomPath, setThemeBgCustomPath] = useState("");
  const [uploadBgStatus, setUploadBgStatus] = useState("");
  const [saveStatus, setSaveStatus] = useState("");
  const [validateStatus, setValidateStatus] = useState({ fpt: "", elevenlabs: "", gemini: "", openai: "", anthropic: "", xai: "", groq: "", pexels: "", douyin: "", gpm: "" });
  const [activeTab, setActiveTab] = useState("ai");
  const [gpuStatus, setGpuStatus] = useState(null);
  const [checkingGpu, setCheckingGpu] = useState(false);

  const settingsTabs = [
    { id: "ai", label: "API & AI Keys" },
    { id: "tts", label: "Giọng nói (TTS)" },
    { id: "browser", label: "Trình duyệt & Proxy" },
    { id: "system", label: "Hệ thống & Giám sát" },
    { id: "theme", label: "Giao diện" }
  ];

  const fetchGpuStatus = () => {
    setCheckingGpu(true);
    fetch('http://localhost:8000/api/settings/gpu-status')
      .then(res => res.json())
      .then(data => {
        setGpuStatus(data);
        setCheckingGpu(false);
      })
      .catch(err => {
        console.error("Lỗi fetch GPU:", err);
        setCheckingGpu(false);
      });
  };

  useEffect(() => {
    if (activeTab === "system") {
      fetchGpuStatus();
    }
  }, [activeTab]);

  useEffect(() => {
    fetch('http://localhost:8000/api/settings/keys')
      .then(res => res.json())
      .then(data => {
        if (data.fpt_ai_api_key) setFptKey(data.fpt_ai_api_key);
        if (data.elevenlabs_api_key) setElevenlabsKey(data.elevenlabs_api_key);
        if (data.gemini_api_key) setGeminiKey(data.gemini_api_key);
        if (data.gemini_model) setGeminiModel(data.gemini_model);
        if (data.openai_api_key) setOpenaiKey(data.openai_api_key);
        if (data.anthropic_api_key) setAnthropicKey(data.anthropic_api_key);
        if (data.xai_api_key) setXaiKey(data.xai_api_key);
        if (data.groq_api_key) setGroqKey(data.groq_api_key);
        if (data.pexels_api_key) setPexelsKey(data.pexels_api_key);
        if (data.use_groq !== undefined) setUseGroq(data.use_groq);
        if (data.use_gpu_acceleration !== undefined) setUseGpuAcceleration(data.use_gpu_acceleration);
        if (data.enable_health_check !== undefined) setEnableHealthCheck(data.enable_health_check);
        if (data.health_check_interval_hours) setHealthCheckInterval(data.health_check_interval_hours);
        if (data.active_ai_provider) setActiveAIProvider(data.active_ai_provider);
        if (data.active_tts_provider) setActiveTTSProvider(data.active_tts_provider);
        if (data.ai_concurrency_limit) setConcurrency(data.ai_concurrency_limit);
        if (data.douyin_cookie) setDouyinCookie(data.douyin_cookie);
        if (data.anti_detect_provider) setAntiDetectProvider(data.anti_detect_provider);
        if (data.gpm_api_url) setGpmApiUrl(data.gpm_api_url);
        if (data.theme_bg_type) setThemeBgType(data.theme_bg_type);
        if (data.theme_bg_custom_path) setThemeBgCustomPath(data.theme_bg_custom_path);

        // Tự động kiểm tra trạng thái ngay khi load trang nếu có dữ liệu
        if (data.fpt_ai_api_key || data.gemini_api_key || data.douyin_cookie || data.pexels_api_key) {
          fetch('http://localhost:8000/api/settings/validate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fpt_ai_api_key: data.fpt_ai_api_key || "",
              elevenlabs_api_key: data.elevenlabs_api_key || "",
              gemini_api_key: data.gemini_api_key || "",
              gemini_model: data.gemini_model || "gemini-3.5-flash",
              openai_api_key: data.openai_api_key || "",
              anthropic_api_key: data.anthropic_api_key || "",
              xai_api_key: data.xai_api_key || "",
              groq_api_key: data.groq_api_key || "",
              pexels_api_key: data.pexels_api_key || "",
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
                pexels: vData.pexels_api_key,
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
          gemini_model: geminiModel,
          openai_api_key: openaiKey,
          anthropic_api_key: anthropicKey,
          xai_api_key: xaiKey,
          pexels_api_key: pexelsKey,
          active_ai_provider: activeAIProvider,
          active_tts_provider: activeTTSProvider,
          ai_concurrency_limit: Number(concurrency),
          douyin_cookie: douyinCookie,
          anti_detect_provider: antiDetectProvider,
          groq_api_key: groqKey,
          use_groq: useGroq,
          use_gpu_acceleration: useGpuAcceleration,
          enable_health_check: enableHealthCheck,
          health_check_interval_hours: Number(healthCheckInterval),
          theme_bg_type: themeBgType,
          theme_bg_custom_path: themeBgCustomPath
        })
      });
      if (res.ok) {
        setSaveStatus("Đã lưu thành công! Đang kiểm tra kết nối...");
        localStorage.setItem('theme_bg_type', themeBgType);
        localStorage.setItem('theme_bg_custom_path', themeBgCustomPath);
        
        // Áp dụng trực tiếp giao diện
        if (themeBgType === 'dark') {
          document.documentElement.style.setProperty('--bg-image', 'none');
          document.documentElement.style.setProperty('--bg-opacity', '0');
        } else if (themeBgType === 'custom' && themeBgCustomPath) {
          const fullUrl = themeBgCustomPath.startsWith('http') ? themeBgCustomPath : `http://localhost:8000${themeBgCustomPath}`;
          document.documentElement.style.setProperty('--bg-image', `url('${fullUrl}')`);
          document.documentElement.style.setProperty('--bg-opacity', '0.8');
        } else {
          document.documentElement.style.setProperty('--bg-image', "url('/src/assets/bg.jpg')");
          document.documentElement.style.setProperty('--bg-opacity', '0.8');
        }

        // Gọi API kiểm tra validate
        const valRes = await fetch('http://localhost:8000/api/settings/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fpt_ai_api_key: fptKey,
            elevenlabs_api_key: elevenlabsKey,
            gemini_api_key: geminiKey,
            gemini_model: geminiModel,
            openai_api_key: openaiKey,
            anthropic_api_key: anthropicKey,
            xai_api_key: xaiKey,
            groq_api_key: groqKey,
            pexels_api_key: pexelsKey,
            active_ai_provider: activeAIProvider,
            active_tts_provider: activeTTSProvider,
            ai_concurrency_limit: Number(concurrency),
            douyin_cookie: douyinCookie,
            anti_detect_provider: antiDetectProvider,
            gpm_api_url: gpmApiUrl,
            use_groq: useGroq,
            use_gpu_acceleration: useGpuAcceleration,
            enable_health_check: enableHealthCheck,
            health_check_interval_hours: Number(healthCheckInterval),
            theme_bg_type: themeBgType,
            theme_bg_custom_path: themeBgCustomPath
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
            pexels: valData.pexels_api_key,
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

  const handleCheckNow = async () => {
    try {
      setSaveStatus("Đang gửi lệnh kiểm tra...");
      const res = await fetch('http://localhost:8000/api/settings/health/check_now', { method: 'POST' });
      if (res.ok) {
        setSaveStatus("Đã gửi lệnh kiểm tra vào hàng đợi (Xem console backend)!");
        setTimeout(() => setSaveStatus(""), 4000);
      } else {
        setSaveStatus("Lỗi khi gửi lệnh!");
      }
    } catch (e) {
      setSaveStatus("Lỗi kết nối server!");
    }
  };

  const handleUploadBg = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadBgStatus("Đang tải lên...");
    const formData = new FormData();
    formData.append("file", file);
    
    try {
      const res = await fetch("http://localhost:8000/api/settings/upload-background", {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      if (data.status === "success") {
        setUploadBgStatus("Tải lên thành công!");
        setThemeBgCustomPath(data.url);
        // Áp dụng lập tức
        document.documentElement.style.setProperty('--bg-image', `url('http://localhost:8000${data.url}')`);
        document.documentElement.style.setProperty('--bg-opacity', '0.8');
      } else {
        setUploadBgStatus("Lỗi: " + data.message);
      }
    } catch (err) {
      setUploadBgStatus("Lỗi kết nối máy chủ");
    }
  };

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 rounded-2xl max-w-3xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-neon-purple/5 blur-3xl rounded-full pointer-events-none" />
        
        <h3 className="text-xl font-bold mb-6 tracking-tight font-display bg-gradient-to-r from-white to-text-secondary bg-clip-text text-transparent">
          Cấu Hình Hệ Thống
        </h3>

        {/* Tabs Bar */}
        <div className="flex border-b border-border-subtle overflow-x-auto pb-px gap-2 scrollbar-none mb-6">
          {settingsTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all duration-300 cursor-pointer whitespace-nowrap pb-3 ${
                activeTab === tab.id
                  ? "border-neon-purple text-neon-purple"
                  : "border-transparent text-text-secondary hover:text-text-primary"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form className="space-y-6">
          <div className="min-h-[350px]">
            {/* TAB 1: API & AI Keys */}
            {activeTab === "ai" && (
              <div className="space-y-6">
                <div className="bg-bg-tertiary/40 p-4 rounded-xl border border-border-subtle">
                  <label className="block text-sm font-bold text-text-primary mb-2">🤖 AI Mặc định (Active AI Provider)</label>
                  <p className="text-xs text-text-secondary mb-3">Chọn AI sẽ được sử dụng mặc định để Dịch thuật và Sinh Caption tự động (Lưu ý: Tính năng "Phân vai Nam/Nữ" qua âm thanh luôn dùng Gemini. Vui lòng đảm bảo bạn đã chọn Gemini và lưu Key ít nhất 1 lần).</p>
                  <select
                    className="w-full bg-bg-secondary border border-border-subtle rounded-xl py-3 px-4 text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition-all duration-200 cursor-pointer text-sm"
                    value={activeAIProvider}
                    onChange={(e) => setActiveAIProvider(e.target.value)}
                  >
                    <option value="gemini">Google Gemini (Khuyên dùng - gemini-2.5-flash)</option>
                    <option value="openai">OpenAI (ChatGPT - gpt-4o-mini)</option>
                    <option value="anthropic">Anthropic (Claude - claude-3-haiku)</option>
                    <option value="xai">xAI (Grok - grok-beta)</option>
                  </select>
                </div>

                <div className="space-y-4">
                  <label className="block text-sm font-medium text-text-secondary">
                    API Key của {
                      activeAIProvider === "gemini" ? "Google Gemini" :
                        activeAIProvider === "openai" ? "OpenAI (ChatGPT)" :
                          activeAIProvider === "anthropic" ? "Anthropic (Claude)" : "xAI (Grok)"
                    }
                  </label>
                  <input
                    type="text"
                    className="w-full bg-bg-secondary border border-border-subtle rounded-xl py-3 px-4 text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition-all duration-200 text-sm font-medium"
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
                  {activeAIProvider === "gemini" && (
                    <div className="mt-3">
                      <label className="block text-xs font-medium text-text-secondary mb-1">Phiên bản Mô hình Gemini (Model)</label>
                      <select
                        className="w-full bg-bg-secondary border border-border-subtle rounded-xl py-2.5 px-3 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all duration-200 cursor-pointer"
                        value={geminiModel}
                        onChange={(e) => setGeminiModel(e.target.value)}
                      >
                        <option value="gemini-3.5-flash">Gemini 3.5 Flash (Mới nhất - có thể gặp lỗi quá tải)</option>
                        <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                        <option value="gemini-2.0-flash">Gemini 2.0 Flash (Khuyên dùng - Ổn định nhất)</option>
                        <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                      </select>
                    </div>
                  )}
                  {validateStatus[activeAIProvider] === "valid" && <p className="text-sm text-green-500 mt-2 font-medium">✓ API Key hợp lệ và đang hoạt động</p>}
                  {validateStatus[activeAIProvider] === "invalid" && <p className="text-sm text-red-500 mt-2 font-medium">✕ API Key không hợp lệ</p>}
                </div>

                <div className="bg-bg-tertiary/40 p-4 rounded-xl border border-border-subtle">
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
                        className="w-full bg-bg-secondary border border-border-subtle rounded-xl py-3 px-4 text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition-all duration-200 text-sm font-medium"
                        placeholder="Nhập API Key của Groq tại đây..."
                        value={groqKey}
                        onChange={(e) => setGroqKey(e.target.value)}
                      />
                      {validateStatus.groq === "valid" && <p className="text-sm text-green-500 mt-2 font-medium">✓ API Key hợp lệ và đang hoạt động</p>}
                      {validateStatus.groq === "invalid" && <p className="text-sm text-red-500 mt-2 font-medium">✕ API Key không hợp lệ</p>}
                    </div>
                  )}
                </div>
                <div className="bg-bg-tertiary/40 p-4 rounded-xl border border-border-subtle space-y-4">
                  <label className="block text-sm font-bold text-text-primary mb-1">📸 Kho Media (Stock Media Keys)</label>
                  <p className="text-xs text-text-secondary">Cấu hình khóa API để tự động tìm kiếm video nền hoặc sinh ảnh minh họa trong trang AI Faceless.</p>
                  
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1.5">Pexels API Key</label>
                    <input
                      type="text"
                      className="w-full bg-bg-secondary border border-border-subtle rounded-xl py-3 px-4 text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition-all duration-200 text-sm font-medium"
                      placeholder="Nhập Pexels API Key tại đây..."
                      value={pexelsKey}
                      onChange={(e) => setPexelsKey(e.target.value)}
                    />
                    {validateStatus.pexels === "valid" && <p className="text-sm text-green-500 mt-2 font-medium">✓ API Key hợp lệ và đang hoạt động</p>}
                    {validateStatus.pexels === "invalid" && <p className="text-sm text-red-500 mt-2 font-medium">✕ API Key không hợp lệ</p>}
                    {validateStatus.pexels === "error" && <p className="text-sm text-amber-500 mt-2 font-medium">⚠ Lỗi kết nối kiểm tra API Key</p>}
                  </div>

                  <div className="pt-2 border-t border-border-subtle/50">
                    <p className="text-xs text-text-secondary leading-relaxed">
                      💡 <strong>DALL-E 3 (OpenAI Image Source):</strong> Sẽ tự động sử dụng <strong>API Key của OpenAI</strong> mà bạn cấu hình ở trên để sinh hình ảnh minh họa cho video.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">Số luồng xử lý AI song song (Max Concurrency)</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    className="w-full bg-bg-secondary border border-border-subtle rounded-xl py-3 px-4 text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition-all duration-200 text-sm font-medium"
                    value={concurrency}
                    onChange={(e) => setConcurrency(e.target.value)}
                  />
                  <p className="text-xs text-text-secondary mt-2 italic">Lưu ý: Tăng số luồng sẽ tốn nhiều RAM/VRAM máy chủ hơn khi dùng AI Whisper/TTS nội bộ.</p>
                </div>
              </div>
            )}

            {/* TAB 2: Giọng nói (TTS) */}
            {activeTab === "tts" && (
              <div className="space-y-6">
                <div className="bg-bg-tertiary/40 p-4 rounded-xl border border-border-subtle">
                  <label className="block text-sm font-bold text-text-primary mb-2">🎙️ Nền tảng Lồng tiếng (Active TTS Provider)</label>
                  <p className="text-xs text-text-secondary mb-3">Chọn nền tảng AI sẽ được dùng để tạo giọng đọc lồng tiếng cho video.</p>
                  <select
                    className="w-full bg-bg-secondary border border-border-subtle rounded-xl py-3 px-4 text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition-all duration-200 cursor-pointer text-sm"
                    value={activeTTSProvider}
                    onChange={(e) => setActiveTTSProvider(e.target.value)}
                  >
                    <option value="edge">Edge-TTS (Miễn phí, Không cần Key)</option>
                    <option value="fpt">FPT.AI (Giọng chuẩn Việt Nam)</option>
                    <option value="openai">OpenAI TTS (Dùng chung key OpenAI, truyền cảm)</option>
                    <option value="elevenlabs">ElevenLabs (Siêu thực, biểu cảm)</option>
                    <option value="vieneu">VieNeu-TTS (Offline, Tăng tốc GPU/CPU)</option>
                  </select>
                  
                  {activeTTSProvider === "vieneu" && (
                    <div className="mt-3 p-3 bg-bg-secondary/50 rounded-xl border border-border-subtle text-xs text-text-secondary space-y-1">
                      <p className="font-bold text-neon-purple">• Hệ thống lồng tiếng offline chất lượng cao tiếng Việt.</p>
                      <p>• Yêu cầu đã cài đặt phần mềm <strong className="text-text-primary">eSpeak NG</strong> trên Windows và cấu hình PATH.</p>
                      <p>• Tự động sử dụng GPU rời NVIDIA GTX 1650 qua CUDA để tăng tốc nếu bật Tăng tốc phần cứng.</p>
                    </div>
                  )}
                </div>

                {activeTTSProvider !== "edge" && activeTTSProvider !== "vieneu" && (
                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      API Key của {
                        activeTTSProvider === "fpt" ? "FPT.AI" :
                          activeTTSProvider === "openai" ? "OpenAI TTS" :
                            activeTTSProvider === "elevenlabs" ? "ElevenLabs" : ""
                      }
                    </label>
                    <input
                      type="text"
                      className="w-full bg-bg-secondary border border-border-subtle rounded-xl py-3 px-4 text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition-all duration-200 text-sm font-medium"
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
              </div>
            )}

            {/* TAB 3: Trình duyệt & Proxy */}
            {activeTab === "browser" && (
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
            )}

            {/* TAB 4: Hệ thống & Giám sát */}
            {activeTab === "system" && (
              <div className="space-y-6">
                <div className="bg-bg-tertiary/40 p-4 rounded-xl border border-border-subtle">
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
                  <p className="text-xs text-text-secondary mb-4">Sử dụng GPU (Intel QSV / Nvidia NVENC) để tăng tốc độ xử lý video bằng FFMPEG và giảm tải CPU. Hệ thống sẽ tự động quét và kiểm tra xem thiết bị của bạn có hỗ trợ GPU nào không.</p>
                  
                  {/* GPU Check Status Box */}
                  <div className="mt-3 pt-3 border-t border-border-subtle/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">🔍 Trạng thái phần cứng GPU:</span>
                      <button
                        type="button"
                        onClick={fetchGpuStatus}
                        disabled={checkingGpu}
                        className="text-[9px] bg-bg-secondary hover:bg-bg-tertiary text-text-primary border border-border-subtle px-2 py-0.5 rounded transition-colors disabled:opacity-50 font-bold uppercase tracking-wide cursor-pointer"
                      >
                        {checkingGpu ? "Đang quét..." : "🔄 Quét lại"}
                      </button>
                    </div>
                    {checkingGpu ? (
                      <p className="text-xs text-neon-purple animate-pulse">Đang kiểm tra khả năng tương thích của GPU...</p>
                    ) : gpuStatus ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${gpuStatus.can_use_gpu_acceleration ? 'bg-green-500 animate-pulse' : gpuStatus.gpu_available ? 'bg-amber-500' : 'bg-gray-500'}`} />
                          <span className="text-xs font-semibold text-text-primary">{gpuStatus.gpu_name}</span>
                          {gpuStatus.gpu_available && (
                            <span className="text-[10px] bg-neon-purple/20 text-neon-purple px-1.5 py-0.5 rounded font-mono font-bold">CUDA {gpuStatus.cuda_version}</span>
                          )}
                        </div>
                        <p className={`text-xs ${gpuStatus.can_use_gpu_acceleration ? 'text-green-500' : gpuStatus.gpu_available ? 'text-amber-500' : 'text-text-secondary'}`}>
                          {gpuStatus.message}
                        </p>
                        {gpuStatus.gpu_available && (
                          <div className="text-[10px] text-text-secondary/80 bg-bg-secondary/40 p-2 rounded border border-border-subtle/30 space-y-1">
                            <p>• GPU rời NVIDIA hỗ trợ: <span className="text-green-500 font-semibold">Có</span></p>
                            <p>• FFmpeg NVENC (Bộ giải mã card rời): <span className={gpuStatus.ffmpeg_nvenc_available ? 'text-green-500 font-semibold' : 'text-red-500 font-semibold'}>{gpuStatus.ffmpeg_nvenc_available ? 'Khả dụng (✓)' : 'Không tìm thấy (✕)'}</span></p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-text-secondary italic">Chưa thực hiện quét phần cứng.</p>
                    )}
                  </div>
                </div>

                <div className="bg-bg-tertiary/40 p-4 rounded-xl border border-border-subtle">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-bold text-text-primary">🏥 Giám sát Sức khỏe Tài khoản (Shadowban Check)</label>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={enableHealthCheck}
                        onChange={(e) => setEnableHealthCheck(e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                    </label>
                  </div>
                  <p className="text-xs text-text-secondary mb-4">Tự động dùng trình duyệt quét số lượt xem của các video mới đăng trong vòng 3 ngày. Nếu 0 view liên tục, hệ thống sẽ cảnh báo đỏ (Shadowbanned).</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-2">Chu kỳ kiểm tra</label>
                      <select
                        className="w-full bg-bg-secondary border border-border-subtle rounded-xl py-2.5 px-3 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all duration-200 cursor-pointer"
                        value={healthCheckInterval}
                        onChange={(e) => setHealthCheckInterval(Number(e.target.value))}
                        disabled={!enableHealthCheck}
                      >
                        <option value={4}>Mỗi 4 giờ (Khuyên dùng)</option>
                        <option value={8}>Mỗi 8 giờ</option>
                        <option value={12}>Mỗi 12 giờ</option>
                        <option value={24}>Mỗi 24 giờ</option>
                      </select>
                    </div>
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={handleCheckNow}
                        className="w-full bg-bg-secondary hover:bg-bg-tertiary border border-border-subtle text-text-primary px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer"
                      >
                        🔍 Kiểm tra ngay
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: Giao diện */}
            {activeTab === "theme" && (
              <div className="space-y-6">
                <div className="bg-bg-tertiary/40 p-5 rounded-xl border border-border-subtle space-y-4">
                  <label className="block text-sm font-bold text-text-primary">🌌 Hình nền giao diện (Background Style)</label>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    Tùy chỉnh phong cách hình nền của hệ thống. Thay đổi sẽ được hiển thị ngay lập tức.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Dark Option */}
                    <button
                      type="button"
                      onClick={() => setThemeBgType("dark")}
                      className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-300 relative cursor-pointer ${
                        themeBgType === "dark"
                          ? "border-neon-purple bg-neon-purple/5 shadow-md shadow-neon-purple/10"
                          : "border-border-subtle bg-bg-secondary/50 hover:border-brand-primary/30"
                      }`}
                    >
                      <div className="w-full aspect-[16/10] bg-bg-primary rounded-lg mb-3 border border-border-subtle flex items-center justify-center">
                        <span className="text-xs font-semibold text-text-secondary">Pure Dark</span>
                      </div>
                      <span className="text-sm font-bold text-text-primary">Tông đen xám (Dark)</span>
                    </button>

                    {/* Default Option */}
                    <button
                      type="button"
                      onClick={() => setThemeBgType("default")}
                      className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-300 relative cursor-pointer ${
                        themeBgType === "default"
                          ? "border-neon-purple bg-neon-purple/5 shadow-md shadow-neon-purple/10"
                          : "border-border-subtle bg-bg-secondary/50 hover:border-brand-primary/30"
                      }`}
                    >
                      <div className="w-full aspect-[16/10] rounded-lg mb-3 border border-border-subtle overflow-hidden relative">
                        <div className="absolute inset-0 bg-cover bg-center opacity-80" style={{ backgroundImage: "url('/src/assets/bg.jpg')" }} />
                        <div className="absolute inset-0 bg-bg-primary/20" />
                      </div>
                      <span className="text-sm font-bold text-text-primary">Mặc định hệ thống</span>
                    </button>

                    {/* Custom Option */}
                    <button
                      type="button"
                      onClick={() => setThemeBgType("custom")}
                      className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-300 relative cursor-pointer ${
                        themeBgType === "custom"
                          ? "border-neon-purple bg-neon-purple/5 shadow-md shadow-neon-purple/10"
                          : "border-border-subtle bg-bg-secondary/50 hover:border-brand-primary/30"
                      }`}
                    >
                      <div className="w-full aspect-[16/10] rounded-lg mb-3 border border-border-subtle overflow-hidden relative flex items-center justify-center bg-bg-secondary">
                        {themeBgCustomPath ? (
                          <img
                            src={themeBgCustomPath.startsWith('http') ? themeBgCustomPath : `http://localhost:8000${themeBgCustomPath}`}
                            alt="Custom Background"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-xs font-semibold text-text-secondary">Chưa tải ảnh lên</span>
                        )}
                      </div>
                      <span className="text-sm font-bold text-text-primary">Tự tải lên (Custom)</span>
                    </button>
                  </div>

                  {themeBgType === "custom" && (
                    <div className="mt-4 p-4 rounded-xl bg-bg-secondary/50 border border-border-subtle space-y-3">
                      <label className="block text-xs font-bold text-text-primary">Tải lên hình nền mới (Khuyên dùng tỉ lệ 16:9 hoặc ảnh ngang phân giải cao)</label>
                      <div className="flex items-center gap-4">
                        <label className="flex-1 flex flex-col items-center justify-center h-28 border-2 border-dashed border-border-subtle hover:border-brand-primary/50 rounded-xl cursor-pointer bg-bg-tertiary/20 hover:bg-bg-tertiary/40 transition-all">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <span className="text-2xl mb-1">📤</span>
                            <p className="text-xs text-text-secondary"><span className="font-bold text-brand-primary">Nhấp để chọn file</span> hoặc kéo thả</p>
                            <p className="text-[10px] text-text-secondary/60 mt-1">PNG, JPG (Tối đa 5MB)</p>
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleUploadBg}
                          />
                        </label>
                        
                        {themeBgCustomPath && (
                          <div className="w-28 h-28 rounded-xl border border-border-subtle overflow-hidden relative group">
                            <img
                              src={themeBgCustomPath.startsWith('http') ? themeBgCustomPath : `http://localhost:8000${themeBgCustomPath}`}
                              alt="Background Preview"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                      </div>
                      {uploadBgStatus && (
                        <p className={`text-xs font-semibold ${uploadBgStatus.includes("thành công") ? "text-green-500" : "text-brand-primary animate-pulse"}`}>
                          {uploadBgStatus}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 pt-6 border-t border-border-subtle mt-6">
            <button
              type="button"
              className="bg-brand-primary hover:bg-brand-hover text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 active:scale-95 cursor-pointer text-sm"
              onClick={handleSave}
            >
              Lưu cấu hình
            </button>
            {saveStatus && (
              <span className={`text-sm font-medium ${saveStatus.includes('thành công') ? 'text-green-500' : 'text-brand-primary animate-pulse'}`}>
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
