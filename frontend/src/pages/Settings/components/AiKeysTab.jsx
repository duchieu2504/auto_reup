import React from 'react';

const AiKeysTab = ({
  activeAIProvider, setActiveAIProvider,
  geminiKey, setGeminiKey,
  openaiKey, setOpenaiKey,
  anthropicKey, setAnthropicKey,
  xaiKey, setXaiKey,
  geminiModel, setGeminiModel,
  validateStatus,
  useGroq, setUseGroq,
  groqKey, setGroqKey,
  pexelsKey, setPexelsKey,
  customAiEndpoint, setCustomAiEndpoint,
  customAiKey, setCustomAiKey,
  customAiModel, setCustomAiModel
}) => {
  return (
    <div className="space-y-6">
      <div className="bg-bg-tertiary/40 p-4 rounded-xl border border-border-subtle">
        <label className="block text-sm font-bold text-text-primary mb-2">🤖 AI Mặc định (Active AI Provider)</label>
        <p className="text-xs text-text-secondary mb-3">
          Chọn AI sẽ được sử dụng mặc định để Dịch thuật và Sinh Caption tự động (Lưu ý: Tính năng "Phân vai Nam/Nữ" qua âm thanh luôn dùng Gemini. Vui lòng đảm bảo bạn đã chọn Gemini và lưu Key ít nhất 1 lần).
          <br />
          <strong className="text-neon-purple">💡 Khi Custom AI được cấu hình (nhập Endpoint và API Key), hệ thống sẽ luôn tự động ưu tiên sử dụng nó cho tất cả các tác vụ AI.</strong>
        </p>
        <select
          className="w-full bg-bg-secondary border border-border-subtle rounded-xl py-3 px-4 text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition-all duration-200 cursor-pointer text-sm"
          value={activeAIProvider}
          onChange={(e) => setActiveAIProvider(e.target.value)}
        >
          <option value="gemini">Google Gemini (Khuyên dùng - gemini-2.5-flash)</option>
          <option value="openai">OpenAI (ChatGPT - gpt-4o-mini)</option>
          <option value="anthropic">Anthropic (Claude - claude-3-haiku)</option>
          <option value="xai">xAI (Grok - grok-beta)</option>
          <option value="custom">Custom AI (Tương thích OpenAI - Claude/GPT/DeepSeek...)</option>
        </select>
      </div>

      <div className="space-y-4">
        <label className="block text-sm font-medium text-text-secondary">
          API Key của {
            activeAIProvider === "gemini" ? "Google Gemini" :
              activeAIProvider === "openai" ? "OpenAI (ChatGPT)" :
                activeAIProvider === "anthropic" ? "Anthropic (Claude)" :
                  activeAIProvider === "xai" ? "xAI (Grok)" : "Custom AI (OpenAI Compatible)"
          }
        </label>
        <input
          type="text"
          className="w-full bg-bg-secondary border border-border-subtle rounded-xl py-3 px-4 text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition-all duration-200 text-sm font-medium"
          placeholder={`Nhập API Key của ${activeAIProvider === 'custom' ? 'Custom AI (VD: sk-...)' : activeAIProvider} tại đây...`}
          value={
            activeAIProvider === "gemini" ? geminiKey :
              activeAIProvider === "openai" ? openaiKey :
                activeAIProvider === "anthropic" ? anthropicKey :
                  activeAIProvider === "xai" ? xaiKey : customAiKey
          }
          onChange={(e) => {
            if (activeAIProvider === "gemini") setGeminiKey(e.target.value);
            else if (activeAIProvider === "openai") setOpenaiKey(e.target.value);
            else if (activeAIProvider === "anthropic") setAnthropicKey(e.target.value);
            else if (activeAIProvider === "xai") setXaiKey(e.target.value);
            else setCustomAiKey(e.target.value);
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
        {activeAIProvider === "custom" && (
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Custom AI Endpoint URL</label>
              <input
                type="text"
                className="w-full bg-bg-secondary border border-border-subtle rounded-xl py-2.5 px-3 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all duration-200"
                placeholder="Ví dụ: http://localhost:20128/v1"
                value={customAiEndpoint}
                onChange={(e) => setCustomAiEndpoint(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Tên Mô hình (Model Name)</label>
              <input
                type="text"
                className="w-full bg-bg-secondary border border-border-subtle rounded-xl py-2.5 px-3 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all duration-200"
                placeholder="Ví dụ: kr/claude-sonnet-4.5"
                value={customAiModel}
                onChange={(e) => setCustomAiModel(e.target.value)}
              />
            </div>
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
    </div>
  );
};

export default AiKeysTab;
