import React, { useState, useEffect } from 'react';

const RenderProgress = ({ taskId, onReset }) => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("Đang khởi tạo Engine...");
  const [isFinished, setIsFinished] = useState(false);
  const [isError, setIsError] = useState(false);
  const [videoUrl, setVideoUrl] = useState(null);

  useEffect(() => {
    if (!taskId) return;
    
    let isSubscribed = true;
    
    const pollStatus = async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/faceless/status/${taskId}`);
        const data = await res.json();
        
        if (!isSubscribed) return;
        
        if (data.status === "PROGRESS") {
          setProgress(data.progress || 0);
          setStatus(data.message || "Đang xử lý...");
          setTimeout(pollStatus, 2000);
        } else if (data.status === "SUCCESS") {
          setProgress(100);
          setStatus("Hoàn tất! Video đã sẵn sàng.");
          setIsFinished(true);
          
          if (data.result && data.result.data && data.result.data.video_path) {
            // Chuyển /data/faceless/... thành /api/files/faceless/...
            const url = `http://localhost:8000/api/files` + data.result.data.video_path.replace('/data', '');
            setVideoUrl(url);
          }
        } else if (data.status === "FAILURE") {
          setIsError(true);
          setStatus("Lỗi Render: " + data.message);
        } else {
          // Trạng thái chờ PENDING
          setTimeout(pollStatus, 2000);
        }
      } catch (err) {
        if (!isSubscribed) return;
        console.error("Lỗi khi poll status:", err);
        setTimeout(pollStatus, 3000); // Thử lại nếu mất kết nối
      }
    };

    pollStatus();
    
    return () => {
      isSubscribed = false;
    };
  }, [taskId]);

  return (
    <div className="bg-bg-secondary rounded-2xl p-10 border border-border-subtle flex flex-col items-center justify-center text-center h-full min-h-[400px]">
      <div className="w-24 h-24 mb-6 relative">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle
            className="text-border-subtle stroke-current"
            strokeWidth="8"
            cx="50" cy="50" r="40" fill="transparent"
          ></circle>
          <circle
            className={`${isFinished ? 'text-green-500' : isError ? 'text-red-500' : 'text-brand-primary'} stroke-current transition-all duration-500 ease-out`}
            strokeWidth="8"
            strokeLinecap="round"
            cx="50" cy="50" r="40" fill="transparent"
            strokeDasharray={`${progress * 2.513}, 251.3`}
          ></circle>
        </svg>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-xl font-bold text-text-primary">
          {progress}%
        </div>
      </div>
      
      <h3 className="text-xl font-bold text-text-primary mb-2">
        {isFinished ? "Render Thành Công! 🎉" : "Đang xử lý Video..."}
      </h3>
      <p className="text-text-secondary max-w-sm mb-8">{status}</p>

      {isFinished && (
        <div className="flex gap-4">
          <button
            onClick={onReset}
            className="bg-bg-tertiary hover:bg-border-subtle text-text-primary font-medium py-2 px-6 rounded-xl transition-colors border border-border-subtle"
          >
            Làm Video Khác
          </button>
          {videoUrl && (
            <button
              onClick={() => window.open(videoUrl, '_blank')}
              className="bg-brand-primary hover:bg-brand-primary/90 text-white font-medium py-2 px-6 rounded-xl transition-colors"
            >
              Xem Thử Video
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default RenderProgress;
