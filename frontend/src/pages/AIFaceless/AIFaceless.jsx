import React, { useState } from 'react';
import PromptForm from './components/PromptForm';
import ScriptEditor from './components/ScriptEditor';
import RenderProgress from './components/RenderProgress';

const AIFaceless = () => {
  const [step, setStep] = useState(1);
  const [scenes, setScenes] = useState([]);
  const [renderTask, setRenderTask] = useState(null);
  const [config, setConfig] = useState({});

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">🤖 Sáng tạo AI Faceless</h1>
          <p className="text-text-secondary mt-1">Tự động viết kịch bản, tìm video nền, đọc giọng AI và ghép thành video hoàn chỉnh.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cột trái: Cấu hình và Sinh Kịch Bản (Bước 1) */}
        <div className="lg:col-span-1 space-y-6">
          <PromptForm onScriptGenerated={(newScenes, newConfig) => {
            setScenes(newScenes);
            setConfig(newConfig);
            setStep(2);
          }} />
        </div>

        {/* Cột phải: Chỉnh sửa Kịch bản và Tiến trình Render (Bước 2 & 3) */}
        <div className="lg:col-span-2 space-y-6">
          {step === 1 && (
            <div className="bg-bg-secondary rounded-2xl p-10 border border-border-subtle flex flex-col items-center justify-center text-center h-full min-h-[400px]">
              <div className="w-16 h-16 bg-brand-primary/10 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl">📝</span>
              </div>
              <h3 className="text-lg font-bold text-text-primary mb-2">Chưa có Kịch bản nào</h3>
              <p className="text-text-secondary max-w-sm">Hãy nhập Ý tưởng (Prompt) ở cột bên trái và bấm "Sinh Kịch Bản" để AI bắt đầu làm việc.</p>
            </div>
          )}

          {step === 2 && !renderTask && (
            <ScriptEditor 
              scenes={scenes} 
              onScenesChange={setScenes} 
              onStartRender={async (renderConfig) => {
                const finalConfig = {
                  scenes: scenes,
                  account_id: 1, // Fake for now
                  bgm_path: renderConfig.bgm_path,
                  media_source: config.mediaSource,
                  pexels_key: config.pexelsKey
                };
                
                try {
                  const res = await fetch("http://localhost:8000/api/faceless/render-video", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(finalConfig)
                  });
                  const data = await res.json();
                  if (data.status === "success") {
                    setRenderTask({ id: data.task_id, status: "PROGRESS" });
                    setStep(3);
                  } else {
                    alert("Lỗi Render: " + data.detail);
                  }
                } catch (err) {
                  alert("Lỗi kết nối máy chủ khi Render");
                }
              }} 
            />
          )}

          {step === 3 && renderTask && (
            <RenderProgress taskId={renderTask.id} onReset={() => {
              setStep(1);
              setScenes([]);
              setRenderTask(null);
            }} />
          )}
        </div>
      </div>
    </div>
  );
};

export default AIFaceless;
