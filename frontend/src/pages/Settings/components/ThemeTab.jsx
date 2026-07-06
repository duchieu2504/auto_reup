import React from 'react';

const ThemeTab = ({
  themeBgType, setThemeBgType,
  themeBgCustomPath, handleUploadBg,
  uploadBgStatus
}) => {
  return (
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
  );
};

export default ThemeTab;
