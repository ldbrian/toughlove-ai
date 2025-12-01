import { useState, useEffect } from 'react';
import { Radio, X, ChevronRight, Zap } from 'lucide-react';

interface BroadcastBarProps {
  onOpenDetail: () => void;
}

export const BroadcastBar = ({ onOpenDetail }: BroadcastBarProps) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // 检查是否已关闭过广播条（注意：这里不是检查是否看过详情，而是广播条本身）
    const hasClosed = localStorage.getItem('toughlove_broadcast_closed_v2.3');
    if (!hasClosed) {
      setTimeout(() => setVisible(true), 1000); // 进场延迟，不抢视觉重心
    }
  }, []);

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    setVisible(false);
    localStorage.setItem('toughlove_broadcast_closed_v2.3', 'true');
  };

  if (!visible) return null;

  return (
    <div 
      onClick={onOpenDetail}
      className="fixed top-4 left-4 right-4 z-[200] max-w-md mx-auto cursor-pointer animate-[slideDown_0.5s_ease-out]"
    >
      <div className="relative group overflow-hidden rounded-xl border border-red-500/30 bg-[#0a0a0a]/90 backdrop-blur-md shadow-[0_0_20px_rgba(220,38,38,0.15)]">
        
        {/* 动态扫描线背景 */}
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(220,38,38,0.05)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%,100%_100%] animate-[shimmer_3s_infinite]" />

        <div className="relative flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3 overflow-hidden">
            {/* 闪烁的图标 */}
            <div className="relative flex-shrink-0">
               <div className="absolute inset-0 bg-red-500 blur-md opacity-20 animate-pulse"></div>
               <Radio size={18} className="text-red-500 relative z-10" />
            </div>
            
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-red-500 tracking-widest uppercase bg-red-500/10 px-1.5 rounded">System Msg</span>
                <span className="text-[10px] text-gray-500 font-mono">v2.3.0</span>
              </div>
              <p className="text-xs text-gray-200 font-bold truncate pr-2 group-hover:text-white transition-colors">
                检测到命运协议更新... <span className="text-red-400 font-mono text-[10px]">Tap to read</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
             <ChevronRight size={16} className="text-gray-500 group-hover:text-red-400 group-hover:translate-x-1 transition-transform" />
             <div className="w-px h-4 bg-white/10"></div>
             <button onClick={handleClose} className="p-1 hover:bg-white/10 rounded-full text-gray-500 hover:text-white transition-colors">
               <X size={14} />
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};