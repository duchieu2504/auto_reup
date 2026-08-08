import React, { useState } from 'react';
import { X, Info, Activity, ShieldAlert, CheckCircle, TrendingUp, AlertTriangle, HelpCircle } from 'lucide-react';

export const AccountHealthModal = ({ isOpen, onClose, account }) => {
  if (!isOpen || !account) return null;

  const getHealthScore = (account) => {
    if (account.status === 'shadowbanned' || (account.total_views === 0 && account.videos_count > 5)) {
      return { status: 'dead', label: 'Báo động', color: 'text-red-500', bg: 'bg-red-500/10' };
    }
    const viewsPerVideo = account.videos_count > 0 ? account.total_views / account.videos_count : 0;
    if (viewsPerVideo > 0 && viewsPerVideo < 300) {
      return { status: 'warning', label: 'Cần theo dõi', color: 'text-yellow-500', bg: 'bg-yellow-500/10' };
    }
    return { status: 'good', label: 'Tốt', color: 'text-green-500', bg: 'bg-green-500/10' };
  };

  const health = getHealthScore(account);
  const engagementRate = account.total_views > 0 ? ((account.total_likes / account.total_views) * 100).toFixed(2) : 0;
  const followersConversion = account.followers_count > 0 ? (account.total_views / account.followers_count).toFixed(0) : '0';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-bg-secondary w-full max-w-2xl rounded-2xl border border-border-subtle shadow-2xl relative my-8">
        <div className="flex items-center justify-between p-6 border-b border-border-subtle sticky top-0 bg-bg-secondary rounded-t-2xl z-10">
          <div className="flex items-center gap-4">
            {account.avatar_url ? (
              <img src={account.avatar_url} alt="Avatar" className="w-12 h-12 rounded-full border border-white/10 object-cover" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-brand-primary/20 flex items-center justify-center font-bold text-xl text-brand-primary">
                {account.username.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold text-text-primary">Đánh giá sức khỏe kênh</h2>
              <p className="text-sm text-text-secondary">@{account.username} • {account.platform}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-text-secondary hover:text-white bg-black/20 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">Tổng quan chỉ số</h3>
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-black/20 p-4 rounded-xl border border-white/5 text-center">
                <div className="text-2xl font-bold text-text-primary">{account.videos_count || 0}</div>
                <div className="text-xs text-text-secondary mt-1">Videos</div>
              </div>
              <div className="bg-black/20 p-4 rounded-xl border border-white/5 text-center">
                <div className="text-2xl font-bold text-text-primary">{account.total_views || 0}</div>
                <div className="text-xs text-text-secondary mt-1">Views</div>
              </div>
              <div className="bg-black/20 p-4 rounded-xl border border-white/5 text-center">
                <div className="text-2xl font-bold text-text-primary">{account.total_likes || 0}</div>
                <div className="text-xs text-text-secondary mt-1">Likes</div>
              </div>
              <div className="bg-black/20 p-4 rounded-xl border border-white/5 text-center">
                <div className="text-2xl font-bold text-text-primary">{account.followers_count || 0}</div>
                <div className="text-xs text-text-secondary mt-1">Follows</div>
              </div>
            </div>
          </div>

          <div className={`p-4 rounded-xl border ${health.status === 'dead' ? 'border-red-500/30' : health.status === 'warning' ? 'border-yellow-500/30' : 'border-green-500/30'} flex items-start gap-4`}>
            <div className={`p-3 rounded-xl ${health.bg} ${health.color}`}>
              {health.status === 'dead' ? <ShieldAlert size={24} /> : health.status === 'warning' ? <AlertTriangle size={24} /> : <CheckCircle size={24} />}
            </div>
            <div>
              <h3 className={`font-bold text-lg ${health.color}`}>{health.label}</h3>
              <p className="text-sm text-text-secondary mt-1">
                {health.status === 'dead' ? 'Tài khoản có dấu hiệu shadowban hoặc sai tệp hoàn toàn. Khuyến nghị: Ngâm nick hoặc đổi chủ đề.' : 
                 health.status === 'warning' ? 'Video đăng lên không bứt phá được 200 view. Khuyến nghị: Đổi cách làm video 3s đầu tiên hoặc đổi Niche.' : 
                 'Tài khoản đang có tương tác tự nhiên tốt. Hãy tiếp tục duy trì đăng đều đặn.'}
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">Phân tích chuyên sâu</h3>
            <div className="space-y-3">
              <MetricRow 
                label="Thoát mốc 200 View"
                value={health.status !== 'dead' && (account.total_views / (account.videos_count || 1) > 250) ? "Đạt" : "Không Đạt"}
                isGood={health.status !== 'dead' && (account.total_views / (account.videos_count || 1) > 250)}
                tooltip="Tài khoản thoát khỏi 200 view có nghĩa là TikTok không xem bạn là spammer và đang phân phối thử nghiệm cho người lạ."
              />
              <MetricRow 
                label="Chất lượng tương tác (ER)"
                value={`${engagementRate}%`}
                isGood={parseFloat(engagementRate) > 5}
                tooltip="Tỷ lệ (Like + Cmt + Share) / View. Tốt nhất nên > 5%. Share và Save là yếu tố quyết định thuật toán đề xuất."
              />
              <MetricRow 
                label="Tỷ lệ chuyển đổi Follower"
                value={`1/${followersConversion}`}
                isGood={parseInt(followersConversion) < 200 && parseInt(followersConversion) > 0}
                tooltip="Bao nhiêu view thì có 1 follower. Nếu > 1000 view mới có 1 follow chứng tỏ nội dung không giữ chân hoặc sai tệp khán giả."
              />
              <MetricRow 
                label="Nguồn Traffic (Dành cho bạn)"
                value="N/A"
                isGood={true}
                tooltip="Tỷ lệ % lượt xem đến từ tab Dành cho bạn (FYP). Nếu >70% là rất tốt. Dưới 20% thì kênh của bạn đang bị giới hạn phân phối."
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const MetricRow = ({ label, value, isGood, tooltip }) => {
  return (
    <div className="flex items-center justify-between p-4 bg-black/10 rounded-xl border border-white/5 hover:bg-black/20 transition-colors group">
      <div className="flex items-center gap-2">
        <span className="text-text-primary text-sm font-medium">{label}</span>
        <div className="relative flex items-center group/tooltip">
          <Info size={14} className="text-text-secondary cursor-help hover:text-brand-primary transition-colors" />
          <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 w-64 bg-bg-surface text-text-primary text-xs p-3 rounded-lg shadow-xl border border-white/10 opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-[60]">
            {tooltip}
          </div>
        </div>
      </div>
      <div className={`text-sm font-bold flex items-center gap-2 ${value === 'N/A' ? 'text-text-secondary' : isGood ? 'text-green-400' : 'text-red-400'}`}>
        {value}
        {value !== 'N/A' && (isGood ? <CheckCircle size={16} /> : <AlertTriangle size={16} />)}
      </div>
    </div>
  );
};
