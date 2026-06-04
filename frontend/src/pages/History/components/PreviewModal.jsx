import React from 'react';

export const PreviewModal = ({ hook }) => {
  const { previewFile, setPreviewFile, previewType } = hook;
  
  if (!previewFile) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-in fade-in">
      <div className="bg-bg-primary border border-border-subtle p-4 rounded-2xl w-full max-w-3xl flex flex-col gap-4 relative shadow-2xl">
        <button 
          className="absolute top-4 right-4 text-text-secondary hover:text-white"
          onClick={() => setPreviewFile(null)}
        >
          ✕
        </button>
        <h3 className="text-xl font-bold">Preview</h3>
        <div className="w-full bg-black rounded-lg overflow-hidden flex items-center justify-center min-h-[300px]">
          {previewType === 'video' ? (
            <video src={previewFile} controls autoPlay className="w-full max-h-[60vh] object-contain" />
          ) : (
            <audio src={previewFile} controls autoPlay className="w-full max-w-md" />
          )}
        </div>
      </div>
    </div>
  );
};
