import React, { useState } from 'react';

const PromptForm = ({ onScriptGenerated }) => {
  const [prompt, setPrompt] = useState("");
  const [videoStyle, setVideoStyle] = useState("Tự do");
  const [mediaSource, setMediaSource] = useState("pexels");
  const [pexelsKey, setPexelsKey] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!prompt) return;
    setIsGenerating(true);
    
    try {
      const res = await fetch("http://localhost:8000/api/faceless/generate-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, video_style: videoStyle })
      });
      const data = await res.json();
      if (data.status === "success") {
        onScriptGenerated(data.scenes, { pexelsKey, mediaSource });
      } else {
        alert("Lỗi: " + data.detail);
      }
    } catch (err) {
      alert("Lỗi kết nối máy chủ");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-bg-secondary rounded-2xl p-6 border border-border-subtle">
      <h2 className="text-lg font-bold text-text-primary mb-4">1. Lên Ý Tưởng</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">Chủ đề (Prompt)</label>
          <textarea
            className="w-full bg-bg-tertiary border border-border-subtle rounded-xl py-3 px-4 text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition-all duration-200 resize-none h-32"
            placeholder="Ví dụ: Kể về 3 sự thật rùng rợn dưới đáy biển..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">Phong cách Video</label>
          <select
            className="w-full bg-bg-tertiary border border-border-subtle rounded-xl py-3 px-4 text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
            value={videoStyle}
            onChange={(e) => setVideoStyle(e.target.value)}
          >
            <option value="Tự do">Tự do (Mặc định)</option>
            <option value="Động lực">Tạo động lực (Kể chuyện trầm ấm)</option>
            <option value="Kinh dị">Bí ẩn / Tâm linh (Hồi hộp)</option>
            <option value="Hài hước">Hài hước / Giải trí</option>
            <option value="Tài chính">Tài chính / Crypto (Chuyên nghiệp)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">Nguồn Media (Video/Ảnh nền)</label>
          <div className="flex bg-bg-tertiary rounded-xl p-1 border border-border-subtle mb-3">
            <button
              onClick={() => setMediaSource("pexels")}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${mediaSource === "pexels" ? "bg-brand-primary text-white shadow-md" : "text-text-secondary hover:text-text-primary"}`}
            >
              Pexels Video (Miễn phí)
            </button>
            <button
              onClick={() => setMediaSource("dalle")}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${mediaSource === "dalle" ? "bg-brand-primary text-white shadow-md" : "text-text-secondary hover:text-text-primary"}`}
            >
              DALL-E 3 Ảnh (Tốn API)
            </button>
          </div>
          
          {mediaSource === "pexels" && (
            <input
              type="password"
              className="w-full bg-bg-tertiary border border-border-subtle rounded-xl py-2 px-3 text-sm text-text-primary focus:outline-none focus:border-brand-primary"
              placeholder="Nhập Pexels API Key..."
              value={pexelsKey}
              onChange={(e) => setPexelsKey(e.target.value)}
            />
          )}
        </div>

        <button
          onClick={handleGenerate}
          disabled={!prompt || isGenerating}
          className="w-full bg-brand-primary hover:bg-brand-primary/90 text-white font-medium py-3 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
        >
          {isGenerating ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Đang Sinh Kịch Bản...
            </>
          ) : (
            <>
              <span className="text-lg">✨</span> Tạo Kịch Bản
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default PromptForm;
