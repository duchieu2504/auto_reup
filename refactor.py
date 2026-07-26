import sys

file_path = r'e:\Tradingbot\auto_reup_tiktok\frontend\src\pages\Processor\index.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update imports
content = content.replace(
    "import { FileVideo, PlayCircle, Settings, Save, Trash2, Terminal, FolderOpen, Volume2, UploadCloud, RefreshCw, Folder, ChevronLeft, Edit, XCircle, Loader2 } from 'lucide-react';",
    "import { FileVideo, Settings, XCircle } from 'lucide-react';"
)

new_imports = '''import { InteractiveVideoPreview } from '../../components/subtitle/InteractiveVideoPreview';

// Sub-components
import { ProfileSelector } from './components/ProfileSelector';
import { SaveProfileModal } from './components/SaveProfileModal';
import { PreviewPanel } from './components/PreviewPanel';
import { TerminalPanel } from './components/TerminalPanel';
import { SourceConfigTab } from './components/SourceConfigTab';
'''
content = content.replace(
    "import { InteractiveVideoPreview } from '../../components/subtitle/InteractiveVideoPreview';",
    new_imports
)

# 2. Replace return statement
return_idx = content.find('  return (')
if return_idx == -1:
    print('Could not find return statement')
    sys.exit(1)

export_idx = content.find('export default Phase2Processor;')
if export_idx == -1:
    print('Could not find export statement')
    sys.exit(1)

new_return = '''  return (
    <motion.div 
      variants={pageVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      <ProfileSelector
        editProfiles={editProfiles}
        selectedProfileId={selectedProfileId}
        handleApplyProfile={handleApplyProfile}
        handleDeleteProfile={handleDeleteProfile}
        setShowSaveModal={setShowSaveModal}
      />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:items-stretch">
        
        {/* CỘT TRÁI: Form Cấu Hình (Chiếm 60%) */}
        <div className="lg:col-span-3 glass-panel p-6 rounded-2xl border border-white/5 relative overflow-hidden flex flex-col justify-between gap-6">
          <div className="absolute top-0 right-0 w-32 h-32 bg-neon-pink/5 blur-3xl rounded-full pointer-events-none" />
          
          <div>
            <h3 className="text-xl font-bold mb-5 tracking-tight font-display bg-gradient-to-r from-white to-text-secondary bg-clip-text text-transparent flex items-center gap-2">
              <FileVideo className="text-neon-pink" size={22} />
              Cấu Hình Video & Render
            </h3>

            <div className="flex border-b border-border-subtle overflow-x-auto pb-px gap-2 scrollbar-none mb-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all duration-300 cursor-pointer whitespace-nowrap pb-3 ${
                    activeTab === tab.id
                      ? "border-neon-pink text-neon-pink"
                      : "border-transparent text-text-secondary hover:text-text-primary"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            
            <form onSubmit={handleStart} className="space-y-6">
              <div className="min-h-[300px]">
                {activeTab === "source" && (
                  <SourceConfigTab
                    sourceType={sourceType}
                    setSourceType={setSourceType}
                    crawlerSearch={crawlerSearch}
                    setCrawlerSearch={setCrawlerSearch}
                    crawlerFilterStatus={crawlerFilterStatus}
                    setCrawlerFilterStatus={setCrawlerFilterStatus}
                    fetchCrawlerVideos={fetchCrawlerVideos}
                    groupedCrawlerVideos={groupedCrawlerVideos}
                    selectedAuthor={selectedAuthor}
                    setSelectedAuthor={setSelectedAuthor}
                    selectedCrawlerPaths={selectedCrawlerPaths}
                    setSelectedCrawlerPaths={setSelectedCrawlerPaths}
                    fileInputRef={fileInputRef}
                    handleVideoUpload={handleVideoUpload}
                    uploading={uploading}
                    uploadedFiles={uploadedFiles}
                    setUploadedFiles={setUploadedFiles}
                    isScanning={isScanning}
                    handleScanFolder={handleScanFolder}
                    videoPath={videoPath}
                    setVideoPath={setVideoPath}
                    voices={voices}
                    voiceMode={voiceMode}
                    setVoiceMode={setVoiceMode}
                    bgVolume={bgVolume}
                    setBgVolume={setBgVolume}
                  />
                )}
                
                {activeTab === "subtitle" && (
                  <div className="space-y-4">
                    <SubtitleConfigPanel config={subtitleState} />
                  </div>
                )}
                
                {activeTab === "watermark" && (
                  <div className="space-y-4">
                    <WatermarkConfigPanel config={subtitleState} />
                  </div>
                )}
              </div>
              
              <div className="pt-4 border-t border-border-subtle flex gap-3">
                {isProcessing ? (
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button" 
                    onClick={stopProcessing}
                    className="flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white px-7 py-3.5 rounded-xl font-semibold transition-all duration-300 active:scale-95 shadow-[0_4px_15px_rgba(239,68,68,0.3)] cursor-pointer w-full" 
                  >
                    <XCircle size={18} />
                    <span>Hủy tiến trình xử lý</span>
                  </motion.button>
                ) : (
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit" 
                    className="flex items-center gap-2 bg-gradient-to-r from-neon-pink to-neon-purple hover:opacity-95 text-white px-7 py-3.5 rounded-xl font-semibold transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_15px_rgba(236,72,153,0.3)] cursor-pointer" 
                    disabled={isProcessing}
                  >
                    <Settings size={18} />
                    <span>Bắt đầu Xử lý</span>
                  </motion.button>
                )}
              </div>
            </form>
          </div>
        </div>

        <PreviewPanel
          previewVideoPath={previewVideoPath}
          subtitleState={subtitleState}
          aspectRatio={aspectRatio}
          setAspectRatio={setAspectRatio}
          ffmpegPreviewUrl={ffmpegPreviewUrl}
          isGeneratingPreview={isGeneratingPreview}
        />
      </div>

      <TerminalPanel
        progress={progress}
        logs={logs}
        logContainerRef={logContainerRef}
      />

      <SaveProfileModal
        showSaveModal={showSaveModal}
        setShowSaveModal={setShowSaveModal}
        newProfileName={newProfileName}
        setNewProfileName={setNewProfileName}
        handleSaveProfile={handleSaveProfile}
      />
    </motion.div>
  );
};

'''

final_content = content[:return_idx] + new_return + content[export_idx:]

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(final_content)
print('Successfully refactored index.jsx')
