import React, { useState } from 'react';

const ScriptEditor = ({ scenes, onScenesChange, onStartRender }) => {
  const [bgm, setBgm] = useState("none");

  const handleTextChange = (index, newText) => {
    const newScenes = [...scenes];
    newScenes[index].text = newText;
    onScenesChange(newScenes);
  };

  const handleKeywordChange = (index, newKeyword) => {
    const newScenes = [...scenes];
    newScenes[index].keyword = newKeyword;
    onScenesChange(newScenes);
  };

  return (
    <div className="bg-bg-secondary rounded-2xl border border-border-subtle flex flex-col h-full max-h-[800px]">
      <div className="p-6 border-b border-border-subtle">
        <h2 className="text-lg font-bold text-text-primary">2. Kịch Bản Chi Tiết</h2>
        <p className="text-sm text-text-secondary">Bạn có thể chỉnh sửa lại văn phong của AI hoặc đổi từ khóa tìm kiếm video tĩnh.</p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {scenes.map((scene, index) => (
          <div key={index} className="bg-bg-tertiary p-4 rounded-xl border border-border-subtle relative group">
            <div className="absolute -left-3 -top-3 w-8 h-8 bg-brand-primary text-white rounded-full flex items-center justify-center font-bold text-sm shadow-lg border-2 border-bg-secondary">
              {scene.scene || index + 1}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-2">
              <div className="md:col-span-1">
                <label className="block text-xs font-medium text-text-secondary mb-1">Từ khoá Video (Tiếng Anh)</label>
                <input
                  type="text"
                  className="w-full bg-bg-secondary border border-border-subtle rounded-lg py-2 px-3 text-sm text-text-primary focus:outline-none focus:border-brand-primary"
                  value={scene.keyword}
                  onChange={(e) => handleKeywordChange(index, e.target.value)}
                />
              </div>
              <div className="md:col-span-3">
                <label className="block text-xs font-medium text-text-secondary mb-1">Lời thoại TTS</label>
                <textarea
                  className="w-full bg-bg-secondary border border-border-subtle rounded-lg py-2 px-3 text-sm text-text-primary focus:outline-none focus:border-brand-primary resize-none h-20"
                  value={scene.text}
                  onChange={(e) => handleTextChange(index, e.target.value)}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-6 border-t border-border-subtle bg-bg-tertiary/50 mt-auto rounded-b-2xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex-1 w-full">
            <label className="block text-xs font-medium text-text-secondary mb-1">Nhạc nền (Từ thư viện máy)</label>
            <select
              className="w-full bg-bg-secondary border border-border-subtle rounded-lg py-2 px-3 text-sm text-text-primary focus:outline-none focus:border-brand-primary"
              value={bgm}
              onChange={(e) => setBgm(e.target.value)}
            >
              <option value="none">Không có nhạc nền</option>
              <option value="lofi_chill.mp3">Lo-fi Chill (Mặc định)</option>
              <option value="suspense.mp3">Hồi hộp / Kinh dị</option>
              <option value="funny.mp3">Hài hước / Vui nhộn</option>
              <option value="motivation.mp3">Truyền cảm hứng</option>
            </select>
          </div>
          <button
            onClick={() => onStartRender({ bgm_path: bgm })}
            className="w-full md:w-auto bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-8 rounded-xl transition-colors whitespace-nowrap shadow-lg shadow-green-500/20"
          >
            🚀 Bắt Đầu Tạo Video
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScriptEditor;
