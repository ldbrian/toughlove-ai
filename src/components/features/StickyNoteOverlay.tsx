import { useState, useEffect } from 'react';
import { Check, Ban } from 'lucide-react';
import { UI_TEXT, LangType } from '@/lib/constants';

interface StickyNoteProps {
  task: string;
  lang: LangType;
  onComplete: () => void;
  onGiveUp: () => void;
}

export const StickyNoteOverlay = ({ task, lang, onComplete, onGiveUp }: StickyNoteProps) => {
  const [isPeeling, setIsPeeling] = useState(false);
  const [isMounting, setIsMounting] = useState(true);
  const ui = UI_TEXT[lang];

  useEffect(() => {
    // 入场动画标记
    const timer = setTimeout(() => setIsMounting(false), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleComplete = () => {
    // 触发撕下动画 (向上飘起)
    setIsPeeling(true);
    setTimeout(() => {
      onComplete();
    }, 600); // 等待动画结束
  };

  const handleGiveUp = () => {
    if (confirm(ui.rinGiveUpConfirm)) {
      onGiveUp();
    }
  };

  return (
    <div className={`fixed inset-0 z-[500] flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isPeeling ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      {/* 便利贴本体 */}
      <div 
        className={`
          relative w-72 min-h-[340px] bg-[#fef3c7] text-gray-800 p-6 pt-12 
          shadow-[5px_5px_15px_rgba(0,0,0,0.3)] 
          transform transition-all duration-700 ease-in-out
          ${isMounting ? 'scale-90 opacity-0 translate-y-10' : 'scale-100 opacity-100 rotate-[-2deg]'}
          ${isPeeling ? '-translate-y-[120vh] rotate-[10deg] opacity-0' : 'hover:rotate-0'}
        `}
        style={{
          fontFamily: '"Comic Sans MS", "Chalkboard SE", "Marker Felt", sans-serif',
        }}
      >
        {/* 顶部胶带效果 */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-32 h-8 bg-white/40 backdrop-blur-md rotate-1 shadow-sm border border-white/20"></div>

        {/* 标题 */}
        <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-8 text-center border-b-2 border-dashed border-gray-300 pb-2">
          {ui.rinNoteTitle}
        </div>

        {/* 任务内容 */}
        <div className="text-xl font-bold leading-relaxed text-center mb-12 whitespace-pre-line text-[#1a1a1a]">
          {task}
        </div>

        {/* 底部按钮区 */}
        <div className="space-y-4">
          <button 
            onClick={handleComplete}
            className="w-full py-3 rounded-xl bg-gray-900 text-[#fef3c7] font-bold flex items-center justify-center gap-2 hover:bg-black hover:scale-105 transition-all shadow-md group"
          >
            <Check size={18} className="group-hover:text-green-400 transition-colors" />
            {ui.rinTaskDone}
          </button>

          <button 
            onClick={handleGiveUp}
            className="w-full py-2 text-xs font-bold text-gray-500 hover:text-red-600 hover:bg-red-500/10 rounded-lg transition-colors flex items-center justify-center gap-1"
          >
            <Ban size={12} />
            {ui.rinTaskGiveUp}
          </button>
        </div>

        {/* 装饰细节：右下角折角 */}
        <div className="absolute bottom-0 right-0 w-8 h-8 bg-gradient-to-tl from-black/10 to-transparent pointer-events-none rounded-tl-lg"></div>
      </div>
    </div>
  );
};