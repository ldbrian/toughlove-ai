

import { useState, useEffect } from 'react';
import { X, Download, Share2, Loader2 } from 'lucide-react';
// 🔥 FIX: 引入 LangType
import { LangType } from '@/types';

interface ShareModalProps {
  show: boolean;
  onClose: () => void;
  type: 'tarot' | 'focus' | 'memo';
  data: Record<string, string>;
  // 🔥 FIX: 使用 LangType 替代 'zh' | 'en'
  lang: LangType;
}

export const ShareModal = ({ show, onClose, type, data, lang }: ShareModalProps) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // 简单的语言判断：简体或繁体都视为中文显示
  const isZh = lang === 'zh' || lang === 'tw';

  useEffect(() => {
    if (show) {
      setLoading(true);
      setError(false);
      setImageUrl(null);

      const params = new URLSearchParams(data);
      params.append('t', Date.now().toString());
      
      const url = `/api/og/${type}?${params.toString()}`;
      
      const img = new Image();
      img.src = url;
      img.onload = () => {
        setImageUrl(url);
        setLoading(false);
      };
      img.onerror = () => {
        setError(true);
        setLoading(false);
      };
    }
  }, [show, type, JSON.stringify(data)]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/95 backdrop-blur-xl p-6 animate-in fade-in duration-200">
      <div className="w-full max-w-md flex flex-col gap-4">
        
        {/* Header */}
        <div className="flex justify-between items-center text-gray-400">
          <div className="flex items-center gap-2 text-xs font-mono tracking-widest uppercase">
            <Share2 size={14} />
            {isZh ? '导出神经影像' : 'EXPORTING NEURAL IMAGE...'}
          </div>
          <button onClick={onClose} className="hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Image Container */}
        <div className="relative aspect-[4/5] w-full bg-[#111] border border-white/10 rounded-xl overflow-hidden flex items-center justify-center shadow-2xl">
          {loading && (
            <div className="flex flex-col items-center gap-3 text-[#7F5CFF]">
              <Loader2 size={32} className="animate-spin" />
              <span className="text-xs font-mono animate-pulse">GENERATING PIXELS...</span>
            </div>
          )}
          
          {error && (
            <div className="text-red-500 text-xs font-mono flex flex-col items-center gap-2">
              <ShieldAlert size={24} />
              <span>RENDER FAILED</span>
            </div>
          )}

          {imageUrl && !loading && (
            <img 
              src={imageUrl} 
              alt="Share Card" 
              className="w-full h-full object-contain animate-in zoom-in-95 duration-300" 
            />
          )}
          
          {/* 装饰性扫描线 */}
          <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[size:100%_4px] pointer-events-none opacity-20"></div>
        </div>

        {/* Footer Actions */}
        <div className="flex gap-3">
           <button onClick={onClose} className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold tracking-widest transition-colors">
             {isZh ? '关闭' : 'CLOSE'}
           </button>
           {imageUrl && (
             <a 
               href={imageUrl} 
               download={`toughlove_${type}_${Date.now()}.png`}
               className="flex-[2] py-3 bg-[#7F5CFF] hover:bg-[#6b4bd6] text-white rounded-lg text-xs font-bold tracking-widest flex items-center justify-center gap-2 transition-colors shadow-[0_0_20px_rgba(127,92,255,0.3)]"
             >
               <Download size={16} />
               {isZh ? '保存影像' : 'SAVE IMAGE'}
             </a>
           )}
        </div>
        
        <p className="text-[10px] text-gray-600 text-center font-mono">
          {isZh ? '长按图片亦可保存' : 'Long press image to save'}
        </p>

      </div>
    </div>
  );
};

function ShieldAlert({ size }: { size: number }) {
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
}