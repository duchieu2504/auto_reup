import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, TrendingUp, Users, Play, Heart, Eye, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

const API_BASE = "http://localhost:8000/api";

const Discovery = () => {
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
      document.getElementById("btn-search").click();
    }, 100);
  };

  const formatNumber = (num) => {
    if (num >= 10000) return (num / 10000).toFixed(1) + 'W';
    return num.toString();
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* 1. Hot Board Section */}
      <div className="bg-bg-secondary p-6 rounded-2xl border border-border-subtle">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <TrendingUp className="text-red-500" /> Bảng xếp hạng Hot Trend Douyin
        </h3>
        
        {loadingHot ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="animate-spin text-brand-primary" size={32} />
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {hotWords.map((item, index) => (
              <button
                key={index}
                onClick={() => handleKeywordClick(item.word)}
                className="flex items-center gap-2 px-4 py-2 bg-glass border border-border-subtle rounded-full hover:border-brand-primary hover:bg-glass-hover transition-all"
              >
                <span className={`font-bold ${index < 3 ? 'text-red-500' : 'text-text-secondary'}`}>
                  #{index + 1}
                </span>
                <span className="font-medium">{item.word}</span>
                <span className="text-xs text-text-tertiary">🔥 {formatNumber(item.hot_value)}</span>
              </button>
            ))}
            {hotWords.length === 0 && <p className="text-text-secondary">Không có dữ liệu (có thể do Cookie lỗi)</p>}
          </div>
        )}
      </div>

      {/* 2. Search Section */}
      <div className="bg-bg-secondary p-6 rounded-2xl border border-border-subtle">
        <form onSubmit={handleSearch} className="flex gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary" size={20} />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Nhập từ khóa, hashtag để tìm video và tài khoản viral..."
              className="w-full pl-12 pr-4 py-3 bg-bg-primary border border-border-subtle rounded-xl focus:outline-none focus:border-brand-primary transition-colors"
            />
          </div>
          <button
            id="btn-search"
            type="submit"
            disabled={isSearching}
            className="px-8 py-3 bg-brand-primary text-white rounded-xl font-medium hover:bg-brand-primary/90 disabled:opacity-50 flex items-center gap-2"
          >
            {isSearching ? <Loader2 className="animate-spin" size={20} /> : "Tìm kiếm"}
          </button>
        </form>

        {/* Results */}
        {searchResults && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Viral Users */}
            <div className="space-y-4">
              <h4 className="text-lg font-bold flex items-center gap-2 mb-4">
                <Users className="text-blue-400" /> Gợi ý Tài khoản Viral
              </h4>
              <div className="flex flex-col gap-3">
                {searchResults.viral_users.map((user, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-bg-primary rounded-xl border border-border-subtle hover:border-brand-primary transition-all">
                    <div className="flex items-center gap-4 overflow-hidden">
                      <img src={user.avatar || "https://via.placeholder.com/50"} alt="avatar" className="w-12 h-12 rounded-full object-cover bg-bg-secondary" />
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-text-primary truncate">{user.nickname}</span>
                        <span className="text-sm text-text-tertiary truncate">@{user.sec_uid.slice(0, 8)}...</span>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate('/crawler', { state: { presetUrl: `https://www.douyin.com/user/${user.sec_uid}` } })}
                      className="shrink-0 p-2 text-brand-primary bg-brand-primary/10 rounded-lg hover:bg-brand-primary/20 transition-colors"
                      title="Quét kênh này"
                    >
                      <ArrowRight size={20} />
                    </button>
                  </div>
                ))}
                {searchResults.viral_users.length === 0 && <p className="text-text-secondary">Không tìm thấy tài khoản</p>}
              </div>
            </div>

            {/* Top Videos */}
            <div className="space-y-4">
              <h4 className="text-lg font-bold flex items-center gap-2 mb-4">
                <Play className="text-brand-primary" /> Top Video Nổi bật
              </h4>
              <div className="flex flex-col gap-3">
                {searchResults.videos.map((video, idx) => (
                  <div key={idx} className="flex gap-4 p-4 bg-bg-primary rounded-xl border border-border-subtle">
                    <img 
                      src={video.video?.cover?.url_list?.[0] || "https://via.placeholder.com/100x140"} 
                      alt="cover" 
                      className="w-24 h-32 object-cover rounded-lg bg-bg-secondary"
                    />
                    <div className="flex flex-col justify-between flex-1 min-w-0">
                      <div>
                        <p className="font-medium text-text-primary line-clamp-2 mb-2">
                          {video.desc || "Không có tiêu đề"}
                        </p>
                        <p className="text-sm text-text-tertiary">@{video.author?.nickname}</p>
                      </div>
                      <div className="flex items-center gap-4 text-sm font-medium">
                        <span className="flex items-center gap-1 text-red-400">
                          <Heart size={16} /> {formatNumber(video.statistics?.digg_count || 0)}
                        </span>
                        <span className="flex items-center gap-1 text-blue-400">
                          <Eye size={16} /> {formatNumber(video.statistics?.play_count || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {searchResults.videos.length === 0 && <p className="text-text-secondary">Không tìm thấy video</p>}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default Discovery;
