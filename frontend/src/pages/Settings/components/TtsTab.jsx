import React from 'react';

const TtsTab = ({
  concurrency, setConcurrency,
  enableDiarization, setEnableDiarization,
  hfToken, setHfToken,
  enableDemucs, setEnableDemucs,
  bgmVolume, setBgmVolume,
  activeTTSProvider, setActiveTTSProvider,
  enableAutoVoiceClone, setEnableAutoVoiceClone,
  fptKey, setFptKey,
  openaiKey, setOpenaiKey,
  elevenlabsKey, setElevenlabsKey,
  validateStatus
}) => {
  return (
    <div className="space-y-6">
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

      <div className="bg-bg-tertiary/40 p-4 rounded-xl border border-border-subtle">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-bold text-text-primary">🎙️ Phân tách Người nói (Pyannote Diarization)</label>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={enableDiarization}
              onChange={(e) => setEnableDiarization(e.target.checked)}
            />
            <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
          </label>
        </div>
        <p className="text-xs text-text-secondary mb-3">Tự động nhận diện nhiều người nói trong video (Nam/Nữ) để gán giọng AI khác nhau. Yêu cầu có Hugging Face Token.</p>
        
        {enableDiarization && (
          <div className="mt-4">
            <input
              type="text"
              className="w-full bg-bg-secondary border border-border-subtle rounded-xl py-3 px-4 text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition-all duration-200 text-sm font-medium"
              placeholder="Nhập Hugging Face Token (hf_...) tại đây..."
              value={hfToken}
              onChange={(e) => setHfToken(e.target.value)}
            />
          </div>
        )}
      </div>

      <div className="bg-bg-tertiary/40 p-4 rounded-xl border border-border-subtle">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-bold text-text-primary">🎵 Tách Nhạc Nền (Demucs Audio Separation)</label>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={enableDemucs}
              onChange={(e) => setEnableDemucs(e.target.checked)}
            />
            <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
          </label>
        </div>
        <p className="text-xs text-text-secondary mb-3">Xóa giọng nói gốc nhưng GIỮ NGUYÊN nhạc nền và tiếng động (BGM/SFX). Tốn rất nhiều CPU/GPU khi chạy.</p>
        
        {enableDemucs && (
          <div className="mt-4">
            <label className="block text-xs font-medium text-text-secondary mb-2">Âm lượng Nhạc nền (BGM Volume %)</label>
            <input
              type="range"
              min="0"
              max="100"
              value={bgmVolume}
              onChange={(e) => setBgmVolume(e.target.value)}
              className="w-full h-2 bg-bg-secondary rounded-lg appearance-none cursor-pointer"
            />
            <div className="text-right text-xs font-bold mt-1 text-brand-primary">{bgmVolume}%</div>
          </div>
        )}
      </div>
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
          <div className="mt-4 space-y-3">
            <div className="p-3 bg-bg-secondary/50 rounded-xl border border-border-subtle text-xs text-text-secondary space-y-1">
              <p className="font-bold text-neon-purple">• Hệ thống lồng tiếng offline chất lượng cao tiếng Việt.</p>
              <p>• Yêu cầu đã cài đặt phần mềm <strong className="text-text-primary">eSpeak NG</strong> trên Windows và cấu hình PATH.</p>
              <p>• Tự động sử dụng GPU rời NVIDIA GTX 1650 qua CUDA để tăng tốc nếu bật Tăng tốc phần cứng.</p>
            </div>
            
            <div className="bg-bg-tertiary/40 p-4 rounded-xl border border-border-subtle">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-bold text-text-primary">🧬 Tự động Nhái Giọng Gốc (Auto Voice Clone)</label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={enableAutoVoiceClone}
                    onChange={(e) => setEnableAutoVoiceClone(e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary"></div>
                </label>
              </div>
              <p className="text-xs text-text-secondary mb-1">
                Tự động sử dụng tính năng <strong>Tách Nhạc Nền (Demucs)</strong> lấy giọng nói gốc trong video làm file âm thanh mẫu cho VieNeu.
              </p>
              <p className="text-xs text-text-secondary">
                <span className="text-amber-500 font-bold">Lưu ý:</span> Yêu cầu bật tính năng <strong>Tách Nhạc Nền</strong> ở phần trên và đặt <strong>Voice Mode</strong> lúc render là 'Tự động'. Giọng gốc càng rõ thì clone càng giống!
              </p>
            </div>
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
  );
};

export default TtsTab;
