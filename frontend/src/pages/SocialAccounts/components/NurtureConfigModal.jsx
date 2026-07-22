import React, { useState, useEffect, useRef } from 'react';
import { X, Save, MessageCircle, Info, Play, Square, Terminal } from 'lucide-react';
import { toast } from 'react-hot-toast';

const API_BASE = 'http://localhost:8000/api';
const WS_BASE = 'ws://localhost:8000/api';

export const NurtureConfigModal = ({ isOpen, onClose, accountId, username }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState([]);
  
  const wsRef = useRef(null);
  const logsEndRef = useRef(null);
  
  const [formData, setFormData] = useState({
    mode: 'A',
    list_ids: '',
    hashtags: '',
    ai_provider: 'deepseek',
    ai_api_key: '',
    ai_model: '',
    ai_style_prompt: '',
    comments_per_hour: 15
  });

  useEffect(() => {
    if (isOpen && accountId) {
      fetchConfig();
    }
    // Cleanup WS on unmount or modal close
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [isOpen, accountId]);

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/social-accounts/${accountId}/twitter-nurture-config`);
      if (res.ok) {
        const data = await res.json();
        setFormData({
          mode: data.mode || 'A',
          list_ids: data.list_ids || '',
          hashtags: data.hashtags || '',
          ai_provider: data.ai_provider || 'deepseek',
          ai_api_key: data.ai_api_key || '',
          ai_model: data.ai_model || '',
          ai_style_prompt: data.ai_style_prompt || '',
          comments_per_hour: data.comments_per_hour || 15
        });
      }
    } catch (err) {
      toast.error("Lỗi khi tải cấu hình Nuôi X");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const saveConfigOnly = async () => {
    setSaving(true);
    try {
      const payload = { ...formData, is_active: false }; // is_active no longer used by Celery Beat
      const res = await fetch(`${API_BASE}/social-accounts/${accountId}/twitter-nurture-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Lỗi khi lưu cấu hình');
      return true;
    } catch (err) {
      toast.error(err.message);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const loadingToast = toast.loading('Đang lưu cấu hình...');
    const success = await saveConfigOnly();
    if (success) {
      toast.success('Đã lưu cấu hình Nuôi X', { id: loadingToast });
    } else {
      toast.error('Lưu cấu hình thất bại', { id: loadingToast });
    }
  };

  const startNurture = async () => {
    // 1. Save config first
    const success = await saveConfigOnly();
    if (!success) return;

    // 2. Connect WebSocket
    setLogs(prev => [...prev, { type: 'info', msg: 'Đang kết nối tới máy chủ Nuôi X...' }]);
    wsRef.current = new WebSocket(`${WS_BASE}/social-accounts/${accountId}/nurture-ws`);

    wsRef.current.onopen = () => {
      setIsRunning(true);
      setLogs(prev => [...prev, { type: 'success', msg: 'Đã kết nối! Bắt đầu tiến trình...' }]);
    };

    wsRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'ping') return; // ignore ping
        setLogs(prev => [...prev, { type: data.type, msg: data.message }]);
      } catch (err) {
        setLogs(prev => [...prev, { type: 'log', msg: event.data }]);
      }
    };

    wsRef.current.onerror = (error) => {
      setLogs(prev => [...prev, { type: 'error', msg: 'Lỗi kết nối WebSocket!' }]);
      setIsRunning(false);
    };

    wsRef.current.onclose = () => {
      setIsRunning(false);
      setLogs(prev => [...prev, { type: 'error', msg: 'Đã ngắt kết nối với máy chủ Nuôi X.' }]);
    };
  };

  const stopNurture = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsRunning(false);
    setLogs(prev => [...prev, { type: 'error', msg: 'Đã yêu cầu dừng tiến trình.' }]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1A1D24] rounded-2xl border border-white/10 w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        <div className="bg-[#1A1D24] px-6 py-4 border-b border-white/10 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <MessageCircle className="text-[#1DA1F2]" size={24} />
              Cấu Hình Nuôi X (Twitter)
            </h2>
            <p className="text-sm text-gray-400 mt-1">Tài khoản: <span className="font-semibold text-brand-primary">@{username}</span></p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col lg:flex-row gap-6">
          {/* Cột Cấu Hình */}
          <div className="flex-1 space-y-6">
            {loading ? (
              <div className="py-12 text-center text-gray-400">Đang tải cấu hình...</div>
            ) : (
              <form id="configForm" onSubmit={handleSubmit} className="space-y-6">
                {/* Mode Selection */}
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-300">Chế độ hoạt động</label>
                  <div className="grid grid-cols-1 gap-3">
                    <label className={`relative flex flex-col p-4 cursor-pointer rounded-xl border ${formData.mode === 'A' ? 'border-brand-primary bg-brand-primary/10' : 'border-white/10 bg-black/20 hover:border-white/30'}`}>
                      <input type="radio" name="mode" value="A" checked={formData.mode === 'A'} onChange={handleChange} className="sr-only" />
                      <span className="font-semibold text-white mb-1">List Mode (A)</span>
                      <span className="text-xs text-gray-400">Tương tác với danh sách ID cố định</span>
                    </label>
                    <label className={`relative flex flex-col p-4 cursor-pointer rounded-xl border ${formData.mode === 'B' ? 'border-brand-primary bg-brand-primary/10' : 'border-white/10 bg-black/20 hover:border-white/30'}`}>
                      <input type="radio" name="mode" value="B" checked={formData.mode === 'B'} onChange={handleChange} className="sr-only" />
                      <span className="font-semibold text-white mb-1">Amplify Mode (B)</span>
                      <span className="text-xs text-gray-400">Tìm bài viết theo Hashtag/Từ khóa</span>
                    </label>
                    <label className={`relative flex flex-col p-4 cursor-pointer rounded-xl border ${formData.mode === 'C' ? 'border-brand-primary bg-brand-primary/10' : 'border-white/10 bg-black/20 hover:border-white/30'}`}>
                      <input type="radio" name="mode" value="C" checked={formData.mode === 'C'} onChange={handleChange} className="sr-only" />
                      <span className="font-semibold text-white mb-1">Hybrid Mode (C)</span>
                      <span className="text-xs text-gray-400">Kết hợp cả List và Amplify</span>
                    </label>
                  </div>
                </div>

                {/* Targets */}
                {(formData.mode === 'A' || formData.mode === 'C') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Danh sách List IDs (Dạng JSON Array)</label>
                    <input
                      type="text"
                      name="list_ids"
                      value={formData.list_ids}
                      onChange={handleChange}
                      placeholder='VD: ["123456789", "987654321"]'
                      className="w-full px-4 py-2.5 bg-black/30 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-primary transition-colors font-mono text-sm"
                    />
                  </div>
                )}

                {(formData.mode === 'B' || formData.mode === 'C') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Hashtags (Dạng JSON Array)</label>
                    <input
                      type="text"
                      name="hashtags"
                      value={formData.hashtags}
                      onChange={handleChange}
                      placeholder='VD: ["#crypto", "#bitcoin"]'
                      className="w-full px-4 py-2.5 bg-black/30 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-primary transition-colors font-mono text-sm"
                    />
                  </div>
                )}

                {/* AI Config */}
                <div className="bg-black/20 p-4 rounded-xl border border-white/5 space-y-4">
                  <h3 className="font-semibold text-white flex items-center gap-2">
                    <Info size={16} className="text-brand-primary" />
                    Cấu hình AI Comment
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Nhà cung cấp</label>
                      <select
                        name="ai_provider"
                        value={formData.ai_provider}
                        onChange={handleChange}
                        className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-lg text-white focus:border-brand-primary outline-none"
                      >
                        <option value="deepseek">Deepseek</option>
                        <option value="openai">OpenAI</option>
                        <option value="9proxy">9Proxy (Custom AI)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Model</label>
                      <input
                        type="text"
                        name="ai_model"
                        value={formData.ai_model}
                        onChange={handleChange}
                        placeholder="deepseek-chat"
                        className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-lg text-white focus:border-brand-primary outline-none"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-400 mb-1">API Key</label>
                      <input
                        type="password"
                        name="ai_api_key"
                        value={formData.ai_api_key}
                        onChange={handleChange}
                        placeholder="sk-..."
                        className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-lg text-white focus:border-brand-primary outline-none"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-400 mb-1">Phong cách Prompt</label>
                      <textarea
                        name="ai_style_prompt"
                        value={formData.ai_style_prompt}
                        onChange={handleChange}
                        rows={3}
                        placeholder="Hãy là một chuyên gia crypto, bình luận ngắn gọn, hài hước..."
                        className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-lg text-white focus:border-brand-primary outline-none resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Speed Limit */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Giới hạn bình luận / Giờ</label>
                  <input
                    type="number"
                    name="comments_per_hour"
                    value={formData.comments_per_hour}
                    onChange={handleChange}
                    min={1}
                    max={60}
                    className="w-full max-w-[200px] px-4 py-2.5 bg-black/30 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-primary transition-colors"
                  />
                  <p className="text-xs text-gray-500 mt-2">Nên để 10-15 để tránh bị rate limit (spam).</p>
                </div>
              </form>
            )}
          </div>

          {/* Cột Log Terminal */}
          <div className="flex-1 flex flex-col bg-black rounded-xl border border-white/10 overflow-hidden min-h-[400px]">
            <div className="bg-[#2D2D2D] px-4 py-2 flex items-center justify-between border-b border-white/10 shrink-0">
              <div className="flex items-center gap-2">
                <Terminal size={16} className="text-gray-400" />
                <span className="text-xs font-mono text-gray-300">Nurture Terminal</span>
              </div>
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
            </div>
            <div className="flex-1 p-4 overflow-y-auto font-mono text-sm space-y-1.5">
              {logs.length === 0 ? (
                <div className="text-gray-500 italic">Hệ thống đang chờ lệnh...</div>
              ) : (
                logs.map((log, idx) => (
                  <div key={idx} className={`break-words ${
                    log.type === 'error' ? 'text-red-400' :
                    log.type === 'success' ? 'text-green-400' :
                    log.type === 'info' ? 'text-blue-400' :
                    'text-gray-300'
                  }`}>
                    <span className="text-gray-600 mr-2">[{new Date().toLocaleTimeString()}]</span>
                    {log.msg}
                  </div>
                ))
              )}
              <div ref={logsEndRef} />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-white/10 shrink-0 bg-[#1A1D24] flex justify-between items-center">
          <div className="flex items-center gap-3">
            {!isRunning ? (
              <button
                type="button"
                onClick={startNurture}
                disabled={loading || saving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-white bg-green-600 hover:bg-green-500 transition-colors"
              >
                <Play size={18} />
                Bắt đầu nuôi
              </button>
            ) : (
              <button
                type="button"
                onClick={stopNurture}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-white bg-red-600 hover:bg-red-500 transition-colors"
              >
                <Square size={18} />
                Dừng nuôi
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl font-medium text-gray-300 bg-white/5 hover:bg-white/10 transition-colors"
            >
              Đóng
            </button>
            <button
              type="submit"
              form="configForm"
              disabled={saving || loading || isRunning}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium text-white bg-brand-primary hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-brand-primary/20"
            >
              <Save size={18} />
              {saving ? 'Đang lưu...' : 'Lưu Cấu Hình'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

