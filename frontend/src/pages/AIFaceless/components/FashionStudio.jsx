import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { FASHION_CONCEPTS, FASHION_MODELS } from '../data/fashionPrompts';

const FashionStudio = () => {
  const [mode, setMode] = useState('product'); // 'product' | 'model'
  const [image, setImage] = useState(null);
  
  // Product state
  const [selectedConcept, setSelectedConcept] = useState('');
  
  // Model state
  const [selectedGroup, setSelectedGroup] = useState(FASHION_MODELS[0].groupId);
  const [selectedVariation, setSelectedVariation] = useState(0);

  // API Keys state
  const [photoroomKey, setPhotoroomKey] = useState(localStorage.getItem('photoroomKey') || '');
  const [veo3Key, setVeo3Key] = useState(localStorage.getItem('veo3Key') || '');
  const [apiStatus, setApiStatus] = useState({ photoroom: null, veo3: null }); // null, 'testing', 'success', 'error'
  const [apiLogs, setApiLogs] = useState({ photoroom: '', veo3: '' });

  // Result
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultMedia, setResultMedia] = useState(null);
  const [currentTaskId, setCurrentTaskId] = useState(null);
  const [useLocalBg, setUseLocalBg] = useState(true);

  // Form errors
  const [formErrors, setFormErrors] = useState({});

  const saveApiKey = (type, value) => {
    if (type === 'photoroom') {
      setPhotoroomKey(value);
      localStorage.setItem('photoroomKey', value);
      setApiStatus(prev => ({ ...prev, photoroom: null }));
      setApiLogs(prev => ({ ...prev, photoroom: '' }));
    } else {
      setVeo3Key(value);
      localStorage.setItem('veo3Key', value);
      setApiStatus(prev => ({ ...prev, veo3: null }));
      setApiLogs(prev => ({ ...prev, veo3: '' }));
    }
  };

  const testApi = async (type) => {
    const key = type === 'photoroom' ? photoroomKey : veo3Key;
    if (!key) {
      const msg = "Vui lòng nhập API Key trước khi kiểm tra!";
      setApiLogs(prev => ({ ...prev, [type]: msg }));
      setApiStatus(prev => ({ ...prev, [type]: 'error' }));
      toast.error(msg);
      return;
    }
    
    setApiStatus(prev => ({ ...prev, [type]: 'testing' }));
    setApiLogs(prev => ({ ...prev, [type]: "Đang kiểm tra kết nối..." }));
    
    try {
      const res = await fetch(`http://localhost:8000/api/ai-studio/test-${type}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_key: key })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setApiStatus(prev => ({ ...prev, [type]: 'success' }));
        setApiLogs(prev => ({ ...prev, [type]: data.message || "Kiểm tra thành công!" }));
      } else {
        const errorMsg = `Lỗi: ${data.detail || data.message || "Không xác định"}`;
        setApiStatus(prev => ({ ...prev, [type]: 'error' }));
        setApiLogs(prev => ({ ...prev, [type]: errorMsg }));
        toast.error(errorMsg);
      }
    } catch (err) {
      const errorMsg = "Lỗi kết nối đến Backend Server.";
      setApiStatus(prev => ({ ...prev, [type]: 'error' }));
      setApiLogs(prev => ({ ...prev, [type]: errorMsg }));
      toast.error(errorMsg);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImage(url);
      setFormErrors(prev => ({ ...prev, image: '' }));
    }
  };

  const generatePrompt = () => {
    setFormErrors({});
    if (!image) {
      const msg = "Vui lòng tải ảnh lên trước!";
      setFormErrors(prev => ({ ...prev, image: msg }));
      toast.error(msg);
      return;
    }

    if (mode === 'product') {
      if (!selectedConcept) {
        const msg = 'Vui lòng chọn 1 concept!';
        setFormErrors(prev => ({ ...prev, concept: msg }));
        toast.error(msg);
        return;
      }
      const concept = FASHION_CONCEPTS.find(c => c.id === selectedConcept);
      setGeneratedPrompt(concept ? concept.prompt : '');
    } else {
      const group = FASHION_MODELS.find(g => g.groupId === selectedGroup);
      if (group && group.prompts[selectedVariation]) {
        setGeneratedPrompt(group.prompts[selectedVariation]);
      }
    }
  };

  const handleRender = async () => {
    setFormErrors({});
    if (!image) {
      const msg = "Vui lòng tải ảnh lên!";
      setFormErrors(prev => ({ ...prev, image: msg }));
      toast.error(msg);
      return;
    }
    if (!generatedPrompt) {
      const msg = "Vui lòng tạo lệnh prompt trước!";
      setFormErrors(prev => ({ ...prev, prompt: msg }));
      toast.error(msg);
      return;
    }
    
    if (mode === 'product' && !useLocalBg && !photoroomKey) {
      const msg = "Thiếu Photoroom API Key!";
      setApiStatus(prev => ({ ...prev, photoroom: 'error' }));
      setApiLogs(prev => ({ ...prev, photoroom: msg }));
      toast.error(msg);
      return;
    }
    if (mode === 'model' && !veo3Key) {
      const msg = "Thiếu Veo3 API Key!";
      setApiStatus(prev => ({ ...prev, veo3: 'error' }));
      setApiLogs(prev => ({ ...prev, veo3: msg }));
      toast.error(msg);
      return;
    }

    setIsProcessing(true);
    
    try {
      const formData = new FormData();
      formData.append("mode", mode);
      formData.append("concept_id", selectedConcept || selectedGroup);
      formData.append("prompt_text", generatedPrompt);
      if (photoroomKey && !useLocalBg) formData.append("photoroom_key", photoroomKey);
      if (veo3Key) formData.append("veo3_key", veo3Key);
      formData.append("use_local_bg", useLocalBg);
      
      // Chuyển DataURL của ảnh thành File blob
      const resImage = await fetch(image);
      const imageBlob = await resImage.blob();
      formData.append("image", imageBlob, "upload.jpg");

      const res = await fetch("http://localhost:8000/api/ai-studio/generate", {
        method: "POST",
        body: formData // Không set Content-Type, browser sẽ tự động gắn multipart boundary
      });
      const data = await res.json();
      if (res.ok) {
        // Bắt đầu Polling
        setCurrentTaskId(data.id);
        pollStatus(data.id);
      } else {
        alert("Lỗi render: " + data.detail);
        setIsProcessing(false);
      }
    } catch (error) {
      alert("Lỗi kết nối Backend: " + error.message);
      setIsProcessing(false);
    }
  };

  const pollStatus = async (taskId) => {
    try {
      const res = await fetch(`http://localhost:8000/api/ai-studio/status/${taskId}`);
      const data = await res.json();
      
      if (data.status === 'completed') {
        setIsProcessing(false);
        setResultMedia(data.output_media_path);
        // Có thể cần setup file server ở FastAPI nếu output_media_path là đường dẫn máy chủ cục bộ
      } else if (data.status === 'failed') {
        setIsProcessing(false);
        alert(`Tạo AI thất bại: ${data.error_message}`);
      } else {
        // Đang processing, gọi lại sau 5 giây
        setTimeout(() => pollStatus(taskId), 5000);
      }
    } catch (error) {
      console.error("Polling error", error);
      setTimeout(() => pollStatus(taskId), 5000);
    }
  };

  return (
    <div className="bg-bg-secondary rounded-2xl p-6 border border-border-subtle shadow-sm">
      <div className="flex flex-col gap-6">
        
        {/* Mode Switcher */}
        <div className="flex p-1 bg-bg-tertiary rounded-lg w-fit">
          <button 
            onClick={() => setMode('product')}
            className={`px-4 py-2 rounded-md font-medium text-sm transition-all ${mode === 'product' ? 'bg-brand-primary text-white shadow-md' : 'text-text-secondary hover:text-text-primary'}`}
          >
            👕 Studio Sản Phẩm (Tĩnh)
          </button>
          <button 
            onClick={() => setMode('model')}
            className={`px-4 py-2 rounded-md font-medium text-sm transition-all ${mode === 'model' ? 'bg-brand-primary text-white shadow-md' : 'text-text-secondary hover:text-text-primary'}`}
          >
            💃 Người Mẫu (Chuyển động)
          </button>
        </div>

        {/* Cấu hình API Panel */}
        <div className="bg-bg-primary border border-border-subtle rounded-xl p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-text-primary flex items-center gap-2">
              <span>⚙️</span> Cấu Hình Kết Nối API
            </h3>
            {mode === 'product' && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-text-secondary font-medium">Tách nền AI Cục bộ (Miễn phí)</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={useLocalBg} onChange={(e) => setUseLocalBg(e.target.checked)} />
                  <div className="w-11 h-6 bg-border-strong rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-success"></div>
                </label>
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Photoroom Key */}
            <div className={`space-y-2 transition-opacity ${useLocalBg && mode === 'product' ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
              <label className="text-sm font-medium text-text-secondary">Photoroom API Key (Tạo ảnh sản phẩm)</label>
              <div className="flex gap-2">
                <input 
                  type="password" 
                  value={photoroomKey}
                  onChange={(e) => saveApiKey('photoroom', e.target.value)}
                  placeholder="Nhập Photoroom API Key..."
                  className={`flex-1 p-2 rounded-lg border text-sm focus:outline-none focus:ring-1 ${apiStatus.photoroom === 'error' ? 'border-error bg-error/5 text-error focus:ring-error' : 'border-border-strong bg-bg-secondary text-text-primary focus:ring-brand-primary'}`}
                />
                <button 
                  onClick={() => testApi('photoroom')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    apiStatus.photoroom === 'success' ? 'bg-success/10 text-success border border-success/20' : 
                    apiStatus.photoroom === 'error' ? 'bg-error/10 text-error border border-error/20' : 
                    'bg-bg-tertiary text-text-primary hover:bg-border-subtle'
                  }`}
                >
                  {apiStatus.photoroom === 'testing' ? '⏳ Đang thử...' : 'Kiểm tra'}
                </button>
              </div>
              {apiLogs.photoroom && (
                <p className={`text-xs mt-1 ${apiStatus.photoroom === 'error' ? 'text-error' : apiStatus.photoroom === 'success' ? 'text-success' : 'text-text-secondary'}`}>
                  {apiLogs.photoroom}
                </p>
              )}
            </div>

            {/* Veo3 Key */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-secondary">Veo3/Gemini API Key (Tạo video)</label>
              <div className="flex gap-2">
                <input 
                  type="password" 
                  value={veo3Key}
                  onChange={(e) => saveApiKey('veo3', e.target.value)}
                  placeholder="Nhập Veo3 hoặc Gemini API Key..."
                  className={`flex-1 p-2 rounded-lg border text-sm focus:outline-none focus:ring-1 ${apiStatus.veo3 === 'error' ? 'border-error bg-error/5 text-error focus:ring-error' : 'border-border-strong bg-bg-secondary text-text-primary focus:ring-brand-primary'}`}
                />
                <button 
                  onClick={() => testApi('veo3')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    apiStatus.veo3 === 'success' ? 'bg-success/10 text-success border border-success/20' : 
                    apiStatus.veo3 === 'error' ? 'bg-error/10 text-error border border-error/20' : 
                    'bg-bg-tertiary text-text-primary hover:bg-border-subtle'
                  }`}
                >
                  {apiStatus.veo3 === 'testing' ? '⏳ Đang thử...' : 'Kiểm tra'}
                </button>
              </div>
              {apiLogs.veo3 && (
                <p className={`text-xs mt-1 ${apiStatus.veo3 === 'error' ? 'text-error' : apiStatus.veo3 === 'success' ? 'text-success' : 'text-text-secondary'}`}>
                  {apiLogs.veo3}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Upload Section */}
        <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${formErrors.image ? 'border-error bg-error/5 hover:bg-error/10' : 'border-border-strong hover:bg-bg-tertiary'}`}>
          <input 
            type="file" 
            id="fashion-upload" 
            className="hidden" 
            accept="image/*"
            onChange={handleImageUpload}
          />
          <label htmlFor="fashion-upload" className="cursor-pointer flex flex-col items-center gap-3">
            {image ? (
              <img src={image} alt="Preview" className="h-48 object-contain rounded-lg shadow-md" />
            ) : (
              <>
                <div className="w-12 h-12 bg-bg-primary rounded-full flex items-center justify-center text-xl shadow-sm">
                  📸
                </div>
                <div className={`font-medium ${formErrors.image ? 'text-error' : 'text-text-primary'}`}>Nhấn để tải ảnh lên</div>
                <p className="text-sm text-text-secondary max-w-xs">Tải ảnh gốc quần áo trải sàn hoặc ảnh người mẫu đang mặc sản phẩm</p>
              </>
            )}
          </label>
        </div>
        {formErrors.image && <p className="text-sm text-error font-medium mt-[-16px] px-2">{formErrors.image}</p>}

        {/* Concept / Settings */}
        {mode === 'product' ? (
          <div className="space-y-4">
            <h3 className="font-bold text-text-primary text-lg">Chọn Concept (Thay phông nền)</h3>
            <p className="text-sm text-text-secondary">Hệ thống sẽ tự động gọi Photoroom API để tách nền và ghép vào bối cảnh bên dưới.</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {FASHION_CONCEPTS.map(concept => (
                <button
                  key={concept.id}
                  onClick={() => {
                    setSelectedConcept(concept.id);
                    setFormErrors(prev => ({ ...prev, concept: '' }));
                  }}
                  className={`p-4 rounded-xl border text-left transition-all ${selectedConcept === concept.id ? 'border-brand-primary bg-brand-primary/5 shadow-sm ring-1 ring-brand-primary' : formErrors.concept ? 'border-error bg-error/5' : 'border-border-subtle hover:border-border-strong bg-bg-primary'}`}
                >
                  <div className="text-2xl mb-2">{concept.icon}</div>
                  <div className="font-medium text-text-primary">{concept.name}</div>
                </button>
              ))}
            </div>
            {formErrors.concept && <p className="text-sm text-error font-medium px-2">{formErrors.concept}</p>}
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="font-bold text-text-primary text-lg">Thiết lập Chuyển động (Veo3 API)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-secondary">Chọn Động tác</label>
                <select 
                  className="w-full p-3 rounded-lg border border-border-strong bg-bg-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  value={selectedGroup}
                  onChange={(e) => {
                    setSelectedGroup(e.target.value);
                    setSelectedVariation(0);
                  }}
                >
                  {FASHION_MODELS.map(g => (
                    <option key={g.groupId} value={g.groupId}>{g.groupName}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-secondary">Biến thể Góc quay ({FASHION_MODELS.find(g => g.groupId === selectedGroup)?.prompts.length || 0})</label>
                <select 
                  className="w-full p-3 rounded-lg border border-border-strong bg-bg-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  value={selectedVariation}
                  onChange={(e) => setSelectedVariation(Number(e.target.value))}
                >
                  {FASHION_MODELS.find(g => g.groupId === selectedGroup)?.prompts.map((_, idx) => (
                    <option key={idx} value={idx}>Góc quay {idx + 1}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Generate Prompt Button */}
        <div className="pt-2">
          <button 
            onClick={generatePrompt}
            className="px-6 py-2 bg-bg-primary border border-border-strong text-text-primary rounded-lg font-medium hover:bg-bg-tertiary transition-colors"
          >
            Tạo Lệnh Prompt
          </button>
        </div>

        {/* Prompt Output & Action */}
        {generatedPrompt && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-bg-primary rounded-lg border border-border-subtle p-4 relative">
              <span className="absolute top-0 right-0 transform translate-x-2 -translate-y-2 bg-success text-white text-xs font-bold px-2 py-1 rounded-full">Sẵn sàng</span>
              <p className="text-text-primary text-sm leading-relaxed">{generatedPrompt}</p>
            </div>
            
            <button 
              onClick={handleRender}
              disabled={isProcessing}
              className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all flex justify-center items-center gap-2 ${isProcessing ? 'bg-brand-secondary cursor-not-allowed' : 'bg-brand-primary hover:bg-brand-primary-hover hover:-translate-y-0.5'}`}
            >
              {isProcessing ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  {isProcessing ? '⏳ Đang khởi tạo AI...' : '✨ Khởi tạo Video/Ảnh AI'}
                </>
              ) : (
                <>
                  ✨ Bắt đầu Render (Gọi API)
                </>
              )}
            </button>
          </div>
        )}

        {/* Result Section */}
        {resultMedia && (
          <div className="bg-bg-primary border border-border-subtle rounded-xl p-6 shadow-sm">
            <h3 className="font-bold text-text-primary mb-4 flex items-center gap-2">
              <span>🎉</span> Thành Quả AI Studio
            </h3>
            <div className="flex flex-col items-center gap-4">
              {resultMedia.endsWith('.mp4') ? (
                <video src={`http://localhost:8000/api/files/ai_results/${resultMedia.split('/').pop()}`} controls className="max-h-[500px] rounded-lg border border-border-strong shadow-sm w-full object-contain bg-black" />
              ) : (
                <img src={`http://localhost:8000/api/files/ai_results/${resultMedia.split('/').pop()}`} alt="AI Result" className="max-h-[500px] rounded-lg border border-border-strong shadow-sm object-contain" />
              )}
              <div className="flex gap-4">
                <a 
                  href={`http://localhost:8000/api/files/ai_results/${resultMedia.split('/').pop()}`} 
                  download 
                  target="_blank" rel="noreferrer"
                  className="px-6 py-2 bg-brand-primary text-white font-medium rounded-lg hover:bg-brand-secondary transition-colors"
                >
                  ⬇️ Tải xuống
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FashionStudio;
