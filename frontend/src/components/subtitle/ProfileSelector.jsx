import React, { useState, useEffect, useRef } from 'react';
import { Save, Trash2, ChevronDown } from 'lucide-react';
import { toast } from 'react-hot-toast';

export const ProfileSelector = ({ config }) => {
  const [editProfiles, setEditProfiles] = useState([]);
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchProfiles = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/edit-profiles');
      if (res.ok) {
        const data = await res.json();
        setEditProfiles(data);
      }
    } catch (err) {
      console.error("Lỗi lấy danh sách mẫu cấu hình:", err);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const handleApplyProfile = (pId) => {
    setSelectedProfileId(pId);
    setIsOpen(false);
    
    if (!pId) {
      // Reset to defaults
      if (config.setVoice) config.setVoice('edge_auto');
      if (config.setVolume) config.setVolume(10);
      if (config.setFlipVideo) config.setFlipVideo(false);
      if (config.setOptZoom) config.setOptZoom(false);
      if (config.setOptColor) config.setOptColor(false);
      if (config.setOptNoise) config.setOptNoise(false);
      if (config.setOptPitch) config.setOptPitch(false);
      if (config.setSubtitleFont) config.setSubtitleFont('Liberation Sans');
      if (config.setSubtitleStyle) config.setSubtitleStyle('black_white');
      if (config.setSubtitleTextColor) config.setSubtitleTextColor('#000000');
      if (config.setSubtitleBgColor) config.setSubtitleBgColor('#ffffff');
      if (config.setSubtitleFontSize) config.setSubtitleFontSize(18);
      if (config.setSubtitleMarginV) config.setSubtitleMarginV(40);
      if (config.setSubtitleBgPadding) config.setSubtitleBgPadding(15);
      if (config.setSubtitleBgOpacity) config.setSubtitleBgOpacity(100);
      if (config.setWatermarkType) config.setWatermarkType('none');
      if (config.setWatermarkText) config.setWatermarkText('');
      if (config.setWatermarkImagePreview) config.setWatermarkImagePreview('');
      if (config.setWatermarkImageFile) config.setWatermarkImageFile(null);
      if (config.setWatermarkX) config.setWatermarkX(50);
      if (config.setWatermarkY) config.setWatermarkY(50);
      if (config.setWatermarkSize) config.setWatermarkSize(20);
      if (config.setWatermarkColor) config.setWatermarkColor('#FFFFFF');
      if (config.setWatermarkOpacity) config.setWatermarkOpacity(50);
      if (config.setLoadedProfileConfig) config.setLoadedProfileConfig(null);
      return;
    }

    const profile = editProfiles.find(p => p.id == pId);
    if (!profile) return;

    try {
      const parsedConfig = JSON.parse(profile.config);
      
      // Basic Settings
      if (config.setVoice && parsedConfig.voiceMode) config.setVoice(parsedConfig.voiceMode);
      if (config.setVolume && parsedConfig.bgVolume !== undefined) config.setVolume(parsedConfig.bgVolume);
      
      // Video Settings
      if (config.setFlipVideo) config.setFlipVideo(parsedConfig.flipVideo ?? false);
      if (config.setOptZoom) config.setOptZoom(parsedConfig.optZoom ?? false);
      if (config.setOptColor) config.setOptColor(parsedConfig.optColor ?? false);
      if (config.setOptNoise) config.setOptNoise(parsedConfig.optNoise ?? false);
      if (config.setOptPitch) config.setOptPitch(parsedConfig.optPitch ?? false);
      
      // Subtitle Settings
      if (config.setSubtitleFont) config.setSubtitleFont(parsedConfig.subtitleFont ?? "Arial");
      if (config.setSubtitleStyle) config.setSubtitleStyle(parsedConfig.subtitleStyle ?? "outline");
      if (config.setSubtitleTextColor) config.setSubtitleTextColor(parsedConfig.subtitleTextColor ?? "#FFFF00");
      if (config.setSubtitleBgColor) config.setSubtitleBgColor(parsedConfig.subtitleBgColor ?? "#000000");
      if (config.setSubtitleFontSize) config.setSubtitleFontSize(parsedConfig.subtitleFontSize ?? 24);
      if (config.setSubtitleMarginV) config.setSubtitleMarginV(parsedConfig.subtitleMarginV ?? 40);
      if (config.setSubtitleBgPadding) config.setSubtitleBgPadding(parsedConfig.subtitleBgPadding ?? 2);
      if (config.setSubtitleBgOpacity) config.setSubtitleBgOpacity(parsedConfig.subtitleBgOpacity ?? 100);
      
      // Watermark Settings
      if (config.setWatermarkType) config.setWatermarkType(parsedConfig.watermarkType ?? "none");
      if (config.setWatermarkText) config.setWatermarkText(parsedConfig.watermarkText ?? "");
      if (config.setWatermarkImagePreview) config.setWatermarkImagePreview(parsedConfig.watermarkImagePreview ?? "");
      if (config.setWatermarkImageFile) config.setWatermarkImageFile(null);
      if (config.setWatermarkX) config.setWatermarkX(parsedConfig.watermarkX ?? 50);
      if (config.setWatermarkY) config.setWatermarkY(parsedConfig.watermarkY ?? 50);
      if (config.setWatermarkSize) config.setWatermarkSize(parsedConfig.watermarkSize ?? 20);
      if (config.setWatermarkColor) config.setWatermarkColor(parsedConfig.watermarkColor ?? "#FFFFFF");
      if (config.setWatermarkOpacity) config.setWatermarkOpacity(parsedConfig.watermarkOpacity ?? 50);

      if (config.setLoadedProfileConfig) {
        config.setLoadedProfileConfig({
          voice: parsedConfig.voiceMode ?? 'edge_auto',
          volume: parsedConfig.bgVolume ?? 10,
          flipVideo: parsedConfig.flipVideo ?? false,
          optZoom: parsedConfig.optZoom ?? false,
          optColor: parsedConfig.optColor ?? false,
          optNoise: parsedConfig.optNoise ?? false,
          optPitch: parsedConfig.optPitch ?? false,
          subtitleFont: parsedConfig.subtitleFont ?? "Arial",
          subtitleStyle: parsedConfig.subtitleStyle ?? "outline",
          subtitleTextColor: parsedConfig.subtitleTextColor ?? "#FFFF00",
          subtitleBgColor: parsedConfig.subtitleBgColor ?? "#000000",
          subtitleFontSize: parsedConfig.subtitleFontSize ?? 24,
          subtitleMarginV: parsedConfig.subtitleMarginV ?? 40,
          subtitleBgPadding: parsedConfig.subtitleBgPadding ?? 2,
          subtitleBgOpacity: parsedConfig.subtitleBgOpacity ?? 100,
          watermarkType: parsedConfig.watermarkType ?? "none",
          watermarkText: parsedConfig.watermarkText ?? "",
          watermarkImagePreview: parsedConfig.watermarkImagePreview ?? "",
          watermarkX: parsedConfig.watermarkX ?? 50,
          watermarkY: parsedConfig.watermarkY ?? 50,
          watermarkSize: parsedConfig.watermarkSize ?? 20,
          watermarkColor: parsedConfig.watermarkColor ?? "#FFFFFF",
          watermarkOpacity: parsedConfig.watermarkOpacity ?? 50,
        });
      }

      toast.success(`Đã áp dụng: ${profile.name}`);
    } catch (err) {
      console.error("Lỗi apply profile", err);
      toast.error("Mẫu cấu hình bị lỗi!");
    }
  };

  const handleDeleteProfile = async (pId, e) => {
    e.stopPropagation();
    if (!window.confirm("Bạn có chắc muốn xóa mẫu cấu hình này?")) return;

    try {
      const res = await fetch(`http://localhost:8000/api/edit-profiles/${pId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        toast.success("Đã xóa mẫu cấu hình");
        if (selectedProfileId == pId) setSelectedProfileId("");
        fetchProfiles();
      }
    } catch (err) {
      toast.error("Lỗi khi xóa");
    }
  };

  const selectedProfile = editProfiles.find(p => p.id == selectedProfileId);

  return (
    <div className="flex items-center gap-2 mb-6 bg-brand-primary/5 p-4 rounded-2xl border border-brand-primary/20 shadow-sm relative">
      <Save size={20} className="text-brand-primary shrink-0" />
      <div className="flex-1 relative" ref={dropdownRef}>
        <div 
          className="w-full bg-bg-secondary border border-border-subtle rounded-xl py-2 px-3 text-text-primary focus:outline-none focus:border-brand-primary text-sm shadow-inner cursor-pointer flex justify-between items-center"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="truncate font-medium">{selectedProfile ? selectedProfile.name : "-- Chọn Mẫu Cấu Hình Đã Lưu --"}</span>
          <ChevronDown size={16} className={`text-text-secondary transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
        
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-bg-primary border border-border-subtle rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto overflow-x-hidden">
            {editProfiles.length === 0 && (
              <div className="p-3 text-sm text-text-secondary text-center">Chưa có mẫu nào được lưu</div>
            )}
            {editProfiles.length > 0 && (
              <div 
                className="flex items-center justify-between p-3 hover:bg-bg-secondary cursor-pointer border-b border-border-subtle text-text-secondary italic"
                onClick={() => handleApplyProfile("")}
              >
                <span className="text-sm truncate pr-4">-- Bỏ chọn mẫu --</span>
              </div>
            )}
            {editProfiles.map(p => (
              <div 
                key={p.id} 
                className={`flex items-center justify-between p-2 pl-3 hover:bg-bg-secondary cursor-pointer border-b border-border-subtle last:border-0 transition-colors ${selectedProfileId == p.id ? 'bg-brand-primary/10' : ''}`}
                onClick={() => handleApplyProfile(p.id)}
              >
                <span className={`text-sm truncate pr-4 ${selectedProfileId == p.id ? 'text-brand-primary font-bold' : 'text-text-primary font-medium'}`}>
                  {p.name}
                </span>
                <button 
                  onClick={(e) => handleDeleteProfile(p.id, e)}
                  className="text-text-tertiary hover:text-red-500 hover:bg-red-500/10 p-2 rounded-lg transition-colors shrink-0"
                  title="Xóa mẫu này"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export const SaveProfileButton = ({ config, onSaveSuccess }) => {
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [newProfileName, setNewProfileName] = useState("");

  const uploadWatermarkIfNeeded = async () => {
    if (config.watermarkType === 'image' && config.watermarkImageFile) {
      const formData = new FormData();
      formData.append('file', config.watermarkImageFile);
      try {
        const res = await fetch('http://localhost:8000/api/edit-profiles/upload-watermark', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        if (data.success) return data.path;
      } catch (err) {
        console.error("Lỗi upload watermark", err);
        throw new Error("Không thể upload watermark");
      }
    }
    return config.watermarkImagePreview;
  };

  const handleSaveProfile = async () => {
    if (!newProfileName.trim()) {
      toast.error("Vui lòng nhập tên cấu hình!");
      return;
    }
    const toastId = toast.loading("Đang lưu cấu hình...");
    try {
      const watermarkPath = await uploadWatermarkIfNeeded();
      
      const configObj = {
        voiceMode: config.voice,
        bgVolume: config.volume,
        flipVideo: config.flipVideo,
        optZoom: config.optZoom,
        optColor: config.optColor,
        optNoise: config.optNoise,
        optPitch: config.optPitch,
        
        subtitleFont: config.subtitleFont,
        subtitleStyle: config.subtitleStyle,
        subtitleTextColor: config.subtitleTextColor,
        subtitleBgColor: config.subtitleBgColor,
        subtitleFontSize: config.subtitleFontSize,
        subtitleMarginV: config.subtitleMarginV,
        subtitleBgPadding: config.subtitleBgPadding,
        subtitleBgOpacity: config.subtitleBgOpacity,
        
        watermarkType: config.watermarkType,
        watermarkText: config.watermarkText,
        watermarkImagePreview: watermarkPath,
        watermarkX: config.watermarkX,
        watermarkY: config.watermarkY,
        watermarkSize: config.watermarkSize,
        watermarkColor: config.watermarkColor,
        watermarkOpacity: config.watermarkOpacity,
      };

      const formData = new FormData();
      formData.append('name', newProfileName);
      formData.append('config', JSON.stringify(configObj));

      const res = await fetch('http://localhost:8000/api/edit-profiles', {
        method: 'POST',
        body: formData
      });
      
      if (res.ok) {
        toast.success("Lưu cấu hình thành công!", { id: toastId });
        setShowSaveModal(false);
        setNewProfileName("");
        if (config.setLoadedProfileConfig && config.getCurrentConfigObj) {
          config.setLoadedProfileConfig(config.getCurrentConfigObj());
        }
        if(onSaveSuccess) onSaveSuccess();
      } else {
        throw new Error("API Error");
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi khi lưu cấu hình", { id: toastId });
    }
  };

  return (
    <>
      <button 
        type="button"
        onClick={() => setShowSaveModal(true)}
        disabled={!config.isDirty}
        className={`px-4 py-2 rounded-lg transition-colors font-medium border flex items-center gap-2 ${
          config.isDirty 
            ? "bg-bg-tertiary hover:bg-border-subtle text-text-primary border-border-subtle" 
            : "bg-bg-secondary text-text-tertiary border-transparent cursor-not-allowed"
        }`}
        title={!config.isDirty ? "Chưa có thay đổi nào so với mẫu đã chọn" : "Lưu mẫu cấu hình hiện tại"}
      >
        <Save size={18} /> Lưu Cấu Hình
      </button>

      {showSaveModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-bg-primary border border-border-subtle p-6 rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95">
            <h3 className="text-xl font-bold mb-4">Lưu Mẫu Cấu Hình</h3>
            <p className="text-sm text-text-secondary mb-4">
              Toàn bộ thông số thiết lập hiện tại sẽ được lưu lại thành một mẫu để tái sử dụng sau này.
            </p>
            <div className="mb-6">
              <label className="block text-sm font-medium text-text-secondary mb-2">Tên Mẫu</label>
              <input 
                type="text" 
                autoFocus
                className="w-full bg-bg-secondary border border-border-subtle rounded-xl py-3 px-4 text-text-primary focus:outline-none focus:border-brand-primary transition-all duration-200"
                value={newProfileName}
                onChange={e => setNewProfileName(e.target.value)}
                placeholder="VD: Kinh dị - Có Logo"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSaveProfile();
                  }
                }}
              />
            </div>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowSaveModal(false)}
                className="px-4 py-2 rounded-lg bg-bg-secondary hover:bg-border-subtle text-text-primary font-medium transition-colors"
              >
                Hủy
              </button>
              <button 
                onClick={handleSaveProfile}
                className="px-4 py-2 rounded-lg bg-brand-primary hover:bg-brand-hover text-white font-medium transition-colors flex items-center gap-2"
              >
                <Save size={16} /> Xác nhận Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
