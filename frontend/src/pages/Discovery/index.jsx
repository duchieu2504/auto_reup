import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, Users, Film, DownloadCloud, Trash2, 
  RefreshCw, Plus, ExternalLink, Loader2, Link2, Eye, Clipboard, X
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const API_BASE = "http://localhost:8000/api";

const Discovery = ({ onSelectUser }) => {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Follow account form
  const [newUrl, setNewUrl] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Sync states per account (sec_uid -> boolean)
  const [syncingMap, setSyncingMap] = useState({});

  // Preview Modal States
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewVideos, setPreviewVideos] = useState([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [selectedVideos, setSelectedVideos] = useState(new Set());
  const [currentSecUid, setCurrentSecUid] = useState('');

  useEffect(() => {
    fetchFollowedAccounts();
  }, []);

  const fetchFollowedAccounts = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/discovery/followed`);
      const data = await res.json();
      if (data.success) {
        setAccounts(data.data);
      } else {
        toast.error(data.detail || "Không thể tải danh sách tài khoản");
      }
    } catch (error) {
      toast.error("Lỗi kết nối tới Server");
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (e) => {
    if (e) e.preventDefault();
    if (!newUrl.trim()) return toast.error("Vui lòng nhập đường dẫn kênh Douyin");

    try {
      setIsAdding(true);
      const res = await fetch(`${API_BASE}/discovery/follow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: newUrl.trim() })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || "Đã theo dõi tài khoản mới");
        setNewUrl('');
        setShowAddModal(false);
        fetchFollowedAccounts();
      } else {
        toast.error(data.detail || "Lỗi khi theo dõi tài khoản");
      }
    } catch (error) {
      toast.error("Lỗi kết nối tới Server");
    } finally {
      setIsAdding(false);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setNewUrl(text);
      toast.success("Đã dán từ clipboard!");
    } catch (err) {
      toast.error("Không thể tự động đọc clipboard. Bạn có thể dán thủ công.");
    }
  };

  const handleUnfollow = async (sec_uid) => {
    if (!window.confirm("Bạn có chắc chắn muốn bỏ theo dõi tài khoản này?")) return;

    try {
      const res = await fetch(`${API_BASE}/discovery/unfollow/${sec_uid}`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || "Đã bỏ theo dõi");
        setAccounts(prev => prev.filter(acc => acc.sec_uid !== sec_uid));
      } else {
        toast.error(data.detail || "Lỗi khi bỏ theo dõi");
      }
    } catch (error) {
      toast.error("Lỗi kết nối Server");
    }
  };

  const handleToggleFavorite = async (sec_uid) => {
    try {
      // Optimistic update locally
      setAccounts(prev => prev.map(acc => {
        if (acc.sec_uid === sec_uid) {
          return { ...acc, is_favorite: !acc.is_favorite };
        }
        return acc;
      }).sort((a, b) => (notVal(a.is_favorite) - notVal(b.is_favorite)) || (b.follower_count - a.follower_count)));

      const res = await fetch(`${API_BASE}/discovery/toggle-favorite/${sec_uid}`, {
        method: 'POST'
      });
      const data = await res.json();
      if (!data.success) {
        toast.error("Không thể cập nhật trạng thái yêu thích");
        fetchFollowedAccounts(); // Revert
      }
    } catch (error) {
      toast.error("Lỗi kết nối Server");
      fetchFollowedAccounts(); // Revert
    }
  };

  const notVal = (val) => val ? 0 : 1;

  const handleSync = async (sec_uid) => {
    try {
      setSyncingMap(prev => ({ ...prev, [sec_uid]: true }));
      const res = await fetch(`${API_BASE}/discovery/sync/${sec_uid}`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || "Đã đồng bộ thông số");
        setAccounts(prev => prev.map(acc => {
          if (acc.sec_uid === sec_uid) {
            return { 
              ...acc, 
              nickname: data.data.nickname,
              avatar: data.data.avatar,
              follower_count: data.data.follower_count,
              total_favorited: data.data.total_favorited,
              video_count: data.data.video_count
            };
          }
          return acc;
        }));
      } else {
        toast.error(data.detail || "Lỗi đồng bộ");
      }
    } catch (error) {
      toast.error("Lỗi kết nối Server");
    } finally {
      setSyncingMap(prev => ({ ...prev, [sec_uid]: false }));
    }
  };

  const handleQuickCrawl = async (sec_uid, nickname) => {
    if (onSelectUser) {
      const url = `https://www.douyin.com/user/${sec_uid}`;
      onSelectUser(url);
      return;
    }
    
    // Mở modal preview
    setCurrentSecUid(sec_uid);
    setShowPreviewModal(true);
    setPreviewLoading(true);
    setPreviewVideos([]);
    setSelectedVideos(new Set());
    
    try {
      const res = await fetch(`${API_BASE}/discovery/account-videos/${sec_uid}?limit=20`);
      const data = await res.json();
      if (data.success) {
        setPreviewVideos(data.data);
      } else {
        toast.error(data.detail || "Không thể tải danh sách video");
        setShowPreviewModal(false);
      }
    } catch (error) {
      toast.error("Lỗi kết nối Server");
      setShowPreviewModal(false);
    } finally {
      setPreviewLoading(false);
    }
  };
  
  const toggleVideoSelection = (videoId) => {
    setSelectedVideos(prev => {
      const next = new Set(prev);
      if (next.has(videoId)) {
        next.delete(videoId);
      } else {
        next.add(videoId);
      }
      return next;
    });
  };

  const selectAllNewVideos = () => {
    const newVideos = previewVideos.filter(v => !v.is_downloaded).map(v => v.video_id);
    setSelectedVideos(new Set(newVideos));
  };
  
  const handleDownloadSelected = () => {
    if (selectedVideos.size === 0) {
      toast.error("Vui lòng chọn ít nhất 1 video");
      return;
    }
    
    const urls = Array.from(selectedVideos).map(id => `https://www.douyin.com/video/${id}`);
    navigate('/crawler', { state: { presetUrl: urls.join('\n'), autostart: true } });
    toast.success(`Đã chuyển ${selectedVideos.size} video sang tiến trình tải`);
    setShowPreviewModal(false);
  };

  const formatNumber = (num) => {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toLocaleString();
  };

  // Grid/Card variants for motion
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* Main Subscriptions Listing */}
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center px-1">
          <h4 className="text-lg font-bold text-text-primary flex items-center gap-2">
            <Users className="text-neon-cyan" size={20} />
            Danh sách Đang theo dõi
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-neon-cyan/10 border border-neon-cyan/20 text-neon-cyan font-mono font-bold">
              {accounts.length}
            </span>
          </h4>
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-neon-purple to-neon-pink hover:opacity-95 text-white rounded-xl font-semibold transition-all duration-300 shadow-[0_4px_15px_rgba(168,85,247,0.3)] flex items-center gap-1.5 cursor-pointer text-sm"
              title="Theo dõi kênh mới"
            >
              <Plus size={16} />
              <span>Theo dõi kênh</span>
            </motion.button>
            <motion.button
              whileHover={{ rotate: 180 }}
              transition={{ duration: 0.4 }}
              onClick={fetchFollowedAccounts}
              className="p-2.5 text-text-secondary hover:text-white rounded-xl bg-bg-secondary/40 border border-border-subtle hover:border-white/10 transition-colors flex items-center justify-center cursor-pointer"
              title="Làm mới danh sách"
            >
              <RefreshCw size={16} />
            </motion.button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="glass-panel p-6 rounded-2xl border border-white/5 animate-pulse h-[240px] flex flex-col justify-between">
                <div className="flex gap-4">
                  <div className="w-16 h-16 rounded-full bg-white/5" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 bg-white/5 rounded w-3/4" />
                    <div className="h-3 bg-white/5 rounded w-1/2" />
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2 border-y border-white/5 py-4">
                  <div className="h-8 bg-white/5 rounded" />
                  <div className="h-8 bg-white/5 rounded" />
                  <div className="h-8 bg-white/5 rounded" />
                  <div className="h-8 bg-white/5 rounded" />
                </div>
                <div className="flex gap-2">
                  <div className="h-10 bg-white/5 rounded flex-1" />
                  <div className="h-10 bg-white/5 rounded w-10" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {accounts.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-panel p-16 rounded-2xl border border-white/5 text-center flex flex-col items-center justify-center gap-3"
              >
                <div className="w-16 h-16 rounded-full bg-neon-purple/5 flex items-center justify-center text-neon-purple border border-neon-purple/10 mb-2">
                  <Users size={32} />
                </div>
                <p className="text-text-primary font-bold text-lg">Chưa có tài khoản nào được theo dõi</p>
                <p className="text-text-secondary/70 text-sm max-w-md">
                  Hãy dán link profile Douyin ở trên để theo dõi, hoặc hệ thống sẽ tự động thêm vào đây khi bạn cào video của bất kỳ kênh nào.
                </p>
              </motion.div>
            ) : (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
              >
                {accounts.map((acc) => (
                  <motion.div
                    key={acc.sec_uid}
                    variants={cardVariants}
                    layoutId={acc.sec_uid}
                    className={`glass-panel p-6 rounded-2xl border relative overflow-hidden transition-all duration-300 flex flex-col justify-between gap-5 group hover:shadow-[0_0_30px_rgba(168,85,247,0.12)] ${
                      acc.is_favorite 
                        ? 'border-neon-pink/20 bg-gradient-to-b from-bg-secondary/80 to-[#120815]/30' 
                        : 'border-white/5 bg-bg-secondary/50'
                    }`}
                  >
                    {/* Pink/Purple accent glow for favorites */}
                    {acc.is_favorite && (
                      <div className="absolute top-0 right-0 w-24 h-24 bg-neon-pink/5 blur-2xl rounded-full pointer-events-none" />
                    )}

                    {/* Top: Avatar, Nickname, Favorite Heart */}
                    <div className="flex gap-4 items-start relative">
                      <div className="relative">
                        <img 
                          src={acc.avatar || "https://via.placeholder.com/100"} 
                          alt={acc.nickname} 
                          className="w-16 h-16 rounded-full object-cover ring-2 ring-white/10 group-hover:ring-neon-purple transition-all duration-300 bg-bg-secondary"
                        />
                        {acc.is_favorite && (
                          <div className="absolute -bottom-1 -right-1 bg-neon-pink text-white p-0.5 rounded-full ring-2 ring-bg-secondary">
                            <Heart size={10} className="fill-white" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0 pr-6">
                        <a 
                          href={`https://www.douyin.com/user/${acc.sec_uid}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="font-bold text-text-primary text-base hover:text-neon-cyan transition-colors flex items-center gap-1.5 truncate group/link"
                        >
                          <span className="truncate">{acc.nickname || `Kênh Douyin`}</span>
                          <ExternalLink size={14} className="opacity-0 group-hover/link:opacity-100 transition-opacity text-neon-cyan shrink-0" />
                        </a>
                        <p className="text-xs text-text-secondary/50 font-mono mt-0.5 truncate">
                          @{acc.sec_uid.slice(0, 15)}...
                        </p>
                      </div>

                      {/* Favorite Button */}
                      <motion.button
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.85 }}
                        onClick={() => handleToggleFavorite(acc.sec_uid)}
                        className={`absolute top-0 right-0 p-1.5 rounded-full border transition-all cursor-pointer ${
                          acc.is_favorite 
                            ? 'border-neon-pink/30 bg-neon-pink/15 text-neon-pink' 
                            : 'border-white/5 bg-white/5 text-text-secondary hover:text-neon-pink hover:border-neon-pink/30'
                        }`}
                        title={acc.is_favorite ? "Bỏ yêu thích đặc biệt" : "Yêu thích đặc biệt"}
                      >
                        <Heart size={15} className={acc.is_favorite ? "fill-neon-pink" : ""} />
                      </motion.button>
                    </div>

                    {/* Middle: Stats grid */}
                    <div className="grid grid-cols-4 gap-2 border-y border-white/5 py-4 text-center">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] font-bold text-text-secondary/40 uppercase tracking-wider flex items-center gap-0.5 justify-center">
                          <Users size={10} className="text-neon-cyan" /> Sub
                        </span>
                        <span className="text-sm font-extrabold text-text-primary font-display">
                          {formatNumber(acc.follower_count)}
                        </span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] font-bold text-text-secondary/40 uppercase tracking-wider flex items-center gap-0.5 justify-center">
                          <Heart size={10} className="text-neon-pink" /> Likes
                        </span>
                        <span className="text-sm font-extrabold text-text-primary font-display">
                          {formatNumber(acc.total_favorited)}
                        </span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] font-bold text-text-secondary/40 uppercase tracking-wider flex items-center gap-0.5 justify-center">
                          <Film size={10} className="text-yellow-500" /> Video
                        </span>
                        <span className="text-sm font-extrabold text-text-primary font-display">
                          {formatNumber(acc.video_count)}
                        </span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] font-bold text-text-secondary/40 uppercase tracking-wider flex items-center gap-0.5 justify-center">
                          <DownloadCloud size={10} className="text-neon-green" /> Cào
                        </span>
                        <span className="text-sm font-extrabold text-neon-green font-display">
                          {formatNumber(acc.crawled_count)}
                        </span>
                      </div>
                    </div>

                    {/* Bottom: Action buttons */}
                    <div className="flex gap-2">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleQuickCrawl(acc.sec_uid, acc.nickname)}
                        className="flex-1 bg-gradient-to-r from-neon-purple/80 to-neon-pink/80 hover:opacity-95 text-white py-2 rounded-xl text-xs font-bold transition-all shadow-[0_2px_10px_rgba(168,85,247,0.15)] flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <DownloadCloud size={13} />
                        <span>Cào nhanh</span>
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleSync(acc.sec_uid)}
                        disabled={syncingMap[acc.sec_uid]}
                        className="p-2 bg-white/5 border border-white/5 hover:border-neon-cyan/30 text-text-secondary hover:text-neon-cyan rounded-xl transition-all cursor-pointer flex items-center justify-center shrink-0 disabled:opacity-50"
                        title="Đồng bộ chỉ số"
                      >
                        <RefreshCw size={13} className={syncingMap[acc.sec_uid] ? "animate-spin text-neon-cyan" : ""} />
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleUnfollow(acc.sec_uid)}
                        className="p-2 bg-white/5 border border-white/5 hover:border-red-500/30 text-text-secondary hover:text-red-500 rounded-xl transition-all cursor-pointer flex items-center justify-center shrink-0"
                        title="Bỏ theo dõi"
                      >
                        <Trash2 size={13} />
                      </motion.button>
                    </div>

                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Modal Popup Nhập link */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="glass-panel p-6 rounded-2xl border border-white/10 w-full max-w-md relative overflow-hidden bg-bg-secondary/95 shadow-2xl"
            >
              {/* Decorative Accent Glow */}
              <div className="absolute top-0 left-0 w-24 h-24 bg-neon-purple/5 blur-2xl rounded-full pointer-events-none" />

              {/* Close Button */}
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewUrl('');
                }}
                className="absolute top-4 right-4 text-text-secondary hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>

              <h3 className="text-lg font-bold mb-4 tracking-tight font-display bg-gradient-to-r from-white to-text-secondary bg-clip-text text-transparent flex items-center gap-2">
                <Link2 className="text-neon-purple" size={18} />
                Theo dõi Kênh Douyin Mới
              </h3>
              
              <p className="text-xs text-text-secondary/70 mb-4 leading-relaxed">
                Nhập đường dẫn trang cá nhân của kênh Douyin bạn muốn theo dõi. Hệ thống sẽ tự động đồng bộ các thông số cơ bản.
              </p>

              <form onSubmit={handleFollow} className="space-y-4">
                <div className="flex gap-2">
                  <div className="relative flex-1 group">
                    <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary/50 group-focus-within:text-neon-purple transition-colors" size={18} />
                    <input
                      type="text"
                      value={newUrl}
                      onChange={(e) => setNewUrl(e.target.value)}
                      placeholder="Dán link profile Douyin ở đây..."
                      className="w-full bg-bg-primary border border-border-subtle rounded-xl py-3 pl-12 pr-4 text-text-primary focus:outline-none focus:ring-2 focus:ring-neon-purple/50 focus:border-neon-purple/40 transition-all duration-300 font-medium text-sm placeholder:text-text-secondary/30"
                    />
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={handlePaste}
                    className="px-3.5 bg-white/5 border border-white/5 hover:border-neon-cyan/30 text-text-secondary hover:text-neon-cyan rounded-xl transition-all cursor-pointer flex items-center justify-center shrink-0"
                    title="Dán từ Clipboard"
                  >
                    <Clipboard size={18} />
                  </motion.button>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setNewUrl('');
                    }}
                    className="px-4 py-2 bg-white/5 border border-white/5 hover:bg-white/10 text-text-primary rounded-xl font-semibold transition-colors cursor-pointer text-sm"
                  >
                    Hủy
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isAdding}
                    className="px-5 py-2 bg-gradient-to-r from-neon-purple to-neon-pink hover:opacity-95 text-white rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_15px_rgba(168,85,247,0.3)] flex items-center justify-center gap-1.5 cursor-pointer text-sm"
                  >
                    {isAdding ? <Loader2 className="animate-spin" size={14} /> : <Plus size={14} />}
                    <span>{isAdding ? "Đang xử lý..." : "Theo dõi"}</span>
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Modal Preview Cào Nhanh */}
      <AnimatePresence>
        {showPreviewModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="glass-panel p-6 rounded-2xl border border-white/10 w-full max-w-4xl max-h-[90vh] flex flex-col relative overflow-hidden bg-bg-secondary/95 shadow-2xl"
            >
              <button
                onClick={() => setShowPreviewModal(false)}
                className="absolute top-4 right-4 text-text-secondary hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer z-10"
              >
                <X size={20} />
              </button>

              <div className="mb-4 pr-8">
                <h3 className="text-xl font-bold tracking-tight font-display bg-gradient-to-r from-white to-text-secondary bg-clip-text text-transparent flex items-center gap-2">
                  <Film className="text-neon-pink" size={20} />
                  Chọn lọc Video Cào Nhanh
                </h3>
                <p className="text-sm text-text-secondary/70 mt-1">
                  Hệ thống tìm thấy {previewVideos.length} video mới nhất. Hãy chọn những video bạn muốn tải về.
                </p>
              </div>

              {previewLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center py-20 gap-4">
                  <Loader2 size={32} className="animate-spin text-neon-purple" />
                  <span className="text-text-secondary font-mono text-sm">Đang tải danh sách video...</span>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto pr-2 min-h-[300px]">
                  {previewVideos.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-text-secondary/70">
                      Không tìm thấy video nào.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {previewVideos.map((video) => {
                        const isSelected = selectedVideos.has(video.video_id);
                        return (
                          <div 
                            key={video.video_id}
                            onClick={() => !video.is_downloaded && toggleVideoSelection(video.video_id)}
                            className={`relative rounded-xl overflow-hidden border-2 transition-all cursor-pointer group flex flex-col bg-bg-primary/50
                              ${video.is_downloaded 
                                ? 'opacity-40 border-transparent grayscale cursor-not-allowed' 
                                : isSelected 
                                  ? 'border-neon-purple shadow-[0_0_15px_rgba(168,85,247,0.3)]' 
                                  : 'border-white/5 hover:border-white/20'
                              }
                            `}
                          >
                            <div className="aspect-[9/16] relative">
                              <img src={video.cover_url} alt={video.desc} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                              
                              {!video.is_downloaded && (
                                <div className="absolute top-2 right-2">
                                  <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors
                                    ${isSelected ? 'bg-neon-purple border-neon-purple' : 'bg-black/50 border-white/30 group-hover:border-white'}
                                  `}>
                                    {isSelected && <div className="w-2.5 h-2.5 bg-white rounded-sm" />}
                                  </div>
                                </div>
                              )}

                              {video.is_downloaded && (
                                <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/60 backdrop-blur rounded text-[10px] font-bold text-white border border-white/10">
                                  ĐÃ TẢI
                                </div>
                              )}

                              <div className="absolute bottom-0 left-0 right-0 p-2 flex justify-between items-center text-[10px] text-white font-mono bg-black/40 backdrop-blur-sm">
                                <span className="flex items-center gap-1"><Eye size={10} className="text-neon-cyan" /> {formatNumber(video.play_count)}</span>
                                <span className="flex items-center gap-1"><Heart size={10} className="text-neon-pink" /> {formatNumber(video.digg_count)}</span>
                              </div>
                            </div>
                            <div className="p-2 text-xs text-text-secondary truncate bg-bg-secondary" title={video.desc}>
                              {video.desc || "Không có tiêu đề"}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {!previewLoading && (
                <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                  <div className="flex gap-2 items-center">
                    <button
                      onClick={selectAllNewVideos}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-text-primary"
                    >
                      Chọn tất cả ({previewVideos.filter(v => !v.is_downloaded).length})
                    </button>
                    <span className="text-sm font-mono text-neon-cyan">
                      Đã chọn: {selectedVideos.size}
                    </span>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowPreviewModal(false)}
                      className="px-4 py-2 bg-white/5 border border-white/5 hover:bg-white/10 text-text-primary rounded-xl font-semibold transition-colors text-sm"
                    >
                      Hủy
                    </button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleDownloadSelected}
                      disabled={selectedVideos.size === 0}
                      className="px-5 py-2 bg-gradient-to-r from-neon-purple to-neon-pink hover:opacity-95 text-white rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_15px_rgba(168,85,247,0.3)] flex items-center justify-center gap-1.5 text-sm"
                    >
                      <DownloadCloud size={16} />
                      <span>Tải {selectedVideos.size} video</span>
                    </motion.button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Discovery;
