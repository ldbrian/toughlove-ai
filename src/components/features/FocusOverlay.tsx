import { Ban } from 'lucide-react';
import { PERSONAS, SOL_TAUNTS, LangType } from '@/lib/constants';

interface FocusOverlayProps {
  isFocusPaused: boolean;
  focusRemaining: number;
  focusWarning: string | null;
  tauntIndex: number;
  lang: LangType;
  onGiveUp: () => void;
}

export const FocusOverlay = ({ isFocusPaused, focusRemaining, focusWarning, tauntIndex, lang, onGiveUp }: FocusOverlayProps) => {
  return (
    <div className="fixed inset-0 z-[400] flex flex-col items-center justify-center bg-[#050505]/98 backdrop-blur-3xl animate-[fadeIn_0.5s_ease-out] touch-none">
      {/* 顶部状态栏 */}
      <div className="absolute top-10 text-[10px] font-bold tracking-[0.3em] text-gray-500 flex items-center gap-2">
         <div className={`w-2 h-2 rounded-full ${isFocusPaused ? 'bg-red-500 animate-ping' : 'bg-green-500'}`}></div>
         {lang === 'zh' ? '专注模式运行中' : 'FOCUS MODE ACTIVE'}
      </div>

      <div className="relative mb-6">
         <div className={`w-36 h-36 rounded-full overflow-hidden border-4 border-red-600 shadow-[0_0_50px_#dc2626] transition-all duration-500 ${isFocusPaused ? 'grayscale opacity-50 scale-90' : 'animate-pulse scale-100'}`}>
            {/* 强制使用 Sol 头像 */}
            <img src={PERSONAS.Sol.avatar} className="w-full h-full object-cover contrast-125" />
         </div>
         <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-red-900/80 border border-red-500/50 rounded-full text-[10px] font-bold text-red-100 whitespace-nowrap tracking-wider shadow-lg">Sol - The Architect</div>
      </div>
      
      {/* 倒计时 */}
      <div className={`text-7xl font-mono font-black tracking-widest mb-4 tabular-nums transition-colors ${isFocusPaused ? 'text-gray-600' : 'text-white'}`}>
        {Math.floor(focusRemaining / 60).toString().padStart(2, '0')}:{Math.floor(focusRemaining % 60).toString().padStart(2, '0')}
      </div>
      
      {/* 滚动弹幕 */}
      <div className="h-12 flex flex-col items-center justify-center mb-16 w-3/4 text-center">
         {focusWarning ? (
            <div className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold text-xs animate-bounce shadow-[0_0_20px_#dc2626]">
               {focusWarning}
            </div>
         ) : (
            <p className={`text-sm font-medium transition-all duration-500 ${isFocusPaused ? 'text-gray-700' : 'text-red-400/80'}`}>
               “{SOL_TAUNTS[lang as 'zh'|'en'][tauntIndex]}”
            </p>
         )}
      </div>

      {/* 🔥 优化：放弃按钮增强可见性 */}
      <button 
        onClick={onGiveUp} 
        className="absolute bottom-12 px-6 py-3 rounded-full border border-red-900/30 hover:border-red-600 bg-red-950/10 hover:bg-red-900/20 text-gray-500 hover:text-red-500 transition-all flex items-center gap-2 group"
      >
        <Ban size={14} className="group-hover:rotate-90 transition-transform" />
        <span className="text-xs font-bold tracking-wide font-mono">
          {lang === 'zh' ? '我放弃 (GIVE UP)' : 'I AM WEAK. LET ME OUT.'}
        </span>
      </button>
    </div>
  );
};