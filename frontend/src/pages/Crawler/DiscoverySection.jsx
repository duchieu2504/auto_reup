import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, TrendingUp, Users, Play, Heart, Eye, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

const API_BASE = "http://localhost:8000/api";

const DiscoverySection = ({ onSelectUser }) => {
  const navigate = useNavigate();
  const [hotWords, setHotWords] = useState([]);
  const [loadingHot, setLoadingHot] = useState(true);
  
  const [keyword, setKeyword] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState(null);

  useEffect(() => {
    fetchHotBoard();
  }, []);

  const fetchHotBoard = async () => {
    try {
      setLoadingHot(true);
      const res = await fetch(`${API_BASE}/discovery/hot-board`);
      const data = await res.json();
      if (data.success) {
        setHotWords(data.data.slice(0, 10)); // Lấy top 10
      } else {
        toast.error("Không thể lấy dữ liệu Hot Trend");
      }
    } catch (error) {
      toast.error("Lỗi kết nối Server");
    } finally {
      setLoadingHot(false);
    }
  };

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!keyword.trim()) return toast.error("Vui lòng nhập từ khóa");
    
    try {
      setIsSearching(true);
      const res = await fetch(`${API_BASE}/discovery/search?keyword=${encodeURIComponent(keyword)}&count=10`);
      const data = await res.json();
      if (data.success) {
        setSearchResults(data.data);
      } else {
        toast.error(data.detail || "Lỗi tìm kiếm");
      }
    } catch (error) {
      toast.error("Lỗi kết nối Server");
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeywordClick = (word) => {
    setKeyword(word);
    // Tự động tìm kiếm
    setTimeout(() => {
      const btn = document.getElementById("btn-search-discovery");
      if (btn) btn.click();
    }, 100);
  };

  const formatNumber = (num) => {
    if (num >= 10000) return (num / 10000).toFixed(1) + 'W';
    return num.toString();
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* 1. Hot Board Section */}
      <div className="glass-panel p-6 rounded-2xl border border-white/5 relative overflow-hidden bg-bg-secondary/40">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2 tracking-tight font-display bg-gradient-to-r from-white to-text-secondary bg-clip-text text-transparent">
          <TrendingUp className="text-red-500 animate-pulse" size={20} /> Bảng xếp hạng Hot Trend Douyin
        </h3>
        
        {loadingHot ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="animate-spin text-neon-purple" size={32} />
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {hotWords.map((item, index) => (
              <button
                key={index}
                onClick={() => handleKeywordClick(item.word)}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/5 rounded-full hover:border-neon-purple/50 hover:bg-white/10 transition-all cursor-pointer"
              >
                <span className={`font-bold ${index < 3 ? 'text-red-500' : 'text-text-secondary/70'}`}>
                  #{index + 1}
                </span>
                <span className="font-medium text-text-primary text-sm">{item.word}</span>
                <span className="text-xs text-text-secondary/40 font-mono">🔥 {formatNumber(item.hot_value)}</span>
              </button>
            ))}
            {hotWords.length === 0 && <p className="text-text-secondary/50 italic">Không có dữ liệu (có thể do Cookie lỗi)</p>}
          </div>
        )}
      </div>

      {/* 2. Search Section */}
      <div className="glass-panel p-6 rounded-2xl border border-white/5 relative overflow-hidden bg-bg-secondary/40">
        <form onSubmit={handleSearch} className="flex gap-3 mb-8">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary/50 group-focus-within:text-neon-purple transition-colors" size={20} />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Nhập từ khóa, hashtag để tìm video và tài khoản viral..."
              className="w-full bg-bg-primary/50 border border-border-subtle rounded-xl py-3 pl-12 pr-4 text-text-primary focus:outline-none focus:ring-2 focus:ring-neon-purple/50 focus:border-neon-purple/40 transition-all duration-300 font-medium text-sm placeholder:text-text-secondary/40"
            />
          </div>
          <button
            id="btn-search-discovery"
            type="submit"
            disabled={isSearching}
            className="px-8 py-3 bg-gradient-to-r from-neon-purple to-neon-pink hover:opacity-95 text-white rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_15px_rgba(168,85,247,0.3)] flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSearching ? <Loader2 className="animate-spin" size={18} /> : "Tìm kiếm"}
          </button>
        </form>

        {/* Results */}
        {searchResults && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Viral Users */}
            <div className="space-y-4">
              <h4 className="text-lg font-bold flex items-center gap-2 mb-4 text-text-primary">
                <Users className="text-blue-400" size={18} /> Gợi ý Tài khoản Viral
              </h4>
              <div className="flex flex-col gap-3">
                {searchResults.viral_users.map((user, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-bg-primary/40 rounded-xl border border-white/5 hover:border-neon-purple/40 transition-all duration-300">
                    <div className="flex items-center gap-4 overflow-hidden">
                      <img src={user.avatar || "https://via.placeholder.com/50"} alt="avatar" className="w-12 h-12 rounded-full object-cover bg-bg-secondary border border-white/5" />
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-text-primary truncate">{user.nickname}</span>
                        <span className="text-xs text-text-secondary/50 truncate font-mono">@{user.sec_uid.slice(0, 8)}...</span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const url = `https://www.douyin.com/user/${user.sec_uid}`;
                        if (onSelectUser) {
                          onSelectUser(url);
                        } else {
                          navigate('/crawler', { state: { presetUrl: url } });
                        }
                      }}
                      className="shrink-0 p-2 text-neon-purple bg-neon-purple/10 border border-neon-purple/10 rounded-lg hover:bg-neon-purple/20 transition-all cursor-pointer"
                      title="Quét kênh này"
                    >
                      <ArrowRight size={18} />
                    </button>
                  </div>
                ))}
                {searchResults.viral_users.length === 0 && <p className="text-text-secondary/50 italic">Không tìm thấy tài khoản</p>}
              </div>
            </div>

            {/* Top Videos */}
            <div className="space-y-4">
              <h4 className="text-lg font-bold flex items-center gap-2 mb-4 text-text-primary">
                <Play className="text-neon-pink" size={18} /> Top Video Nổi bật
              </h4>
              <div className="flex flex-col gap-3">
                {searchResults.videos.map((video, idx) => (
                  <div key={idx} className="flex gap-4 p-4 bg-bg-primary/40 rounded-xl border border-white/5">
                    <img 
                      src={video.video?.cover?.url_list?.[0] || "https://via.placeholder.com/100x140"} 
                      alt="cover" 
                      className="w-20 h-28 object-cover rounded-lg bg-bg-secondary shrink-0 border border-white/5"
                    />
                    <div className="flex flex-col justify-between flex-1 min-w-0 py-0.5">
                      <div>
                        <p className="font-medium text-text-primary text-sm line-clamp-2 mb-1 leading-snug">
                          {video.desc || "Không có tiêu đề"}
                        </p>
                        <p className="text-xs text-text-secondary/50">@{video.author?.nickname}</p>
                      </div>
                      <div className="flex items-center gap-4 text-xs font-semibold">
                        <span className="flex items-center gap-1 text-neon-pink">
                          <Heart size={14} className="fill-neon-pink/20" /> {formatNumber(video.statistics?.digg_count || 0)}
                        </span>
                        <span className="flex items-center gap-1 text-neon-cyan">
                          <Eye size={14} /> {formatNumber(video.statistics?.play_count || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {searchResults.videos.length === 0 && <p className="text-text-secondary/50 italic">Không tìm thấy video</p>}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default DiscoverySection;
