import { useState, useEffect, useRef } from 'react';
import { XCircle, Award, Power, ArrowLeft } from 'lucide-react';
import { LangType } from '@/types';

interface FocusModalProps {
    show: boolean;
    onClose: () => void;
    lang: LangType;
    onReward?: (amount: number) => void;
    partnerId: string;
    handleSend: (text: string, isHidden?: boolean) => void;
}

const DAILY_LIMIT = 4;
const REWARD_AMOUNT = 50;
const STORAGE_KEY = 'toughlove_focus_record';
const TOTAL_SECONDS = 25 * 60; // 25分钟

const QUOTES = {
    zh: ["别发呆，盯着你的书。", "你那一秒钟的走神，已经落后了。", "平庸是舒适的陷阱。", "现在放弃？那你永远都是备用品。", "保持静默。保持高效。"],
    en: ["Don't space out. Eyes on the task.", "Mediocrity is a comfortable trap.", "Giving up now? Then you are obsolete.", "Silence. Efficiency.", "Your distraction is your weakness."]
};

export const FocusModal = ({ show, onClose, lang, onReward, handleSend }: FocusModalProps) => {
  const [timeLeft, setTimeLeft] = useState(TOTAL_SECONDS);
  const [isActive, setIsActive] = useState(false); // 计时器是否运行
  const [hasStarted, setHasStarted] = useState(false); // 🔥 新增：是否已正式开始（过了确认阶段）
  
  const [dailyCount, setDailyCount] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [quote, setQuote] = useState('');
  
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
      if (show) {
          const list = lang === 'zh' ? QUOTES.zh : QUOTES.en;
          setQuote(list[Math.floor(Math.random() * list.length)]);
          
          // 🔥 初始化为“等待确认”状态
          setHasStarted(false);
          setIsActive(false);
          setTimeLeft(TOTAL_SECONDS); 

          const today = new Date().toDateString();
          const saved = localStorage.getItem(STORAGE_KEY);
          if (saved) {
              const record = JSON.parse(saved);
              setDailyCount(record.date === today ? record.count : 0);
          }
      } else {
          setIsActive(false);
          setShowResult(false);
          setHasStarted(false);
      }
  }, [show, lang]);

  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false);
      handleComplete();
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  // ✅ 开始任务
  const handleStart = () => {
      setHasStarted(true);
      setIsActive(true);
      startTimeRef.current = Date.now();
  };

  // ✅ 完成任务
  const handleComplete = () => {
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);

      if (dailyCount < DAILY_LIMIT) {
          const newCount = dailyCount + 1;
          setDailyCount(newCount);
          const today = new Date().toDateString();
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: today, count: newCount }));
          if (onReward) onReward(REWARD_AMOUNT);
      }
      setShowResult(true);
      handleSend(`(用户完成了25分钟的深度专注任务)`);
  };

  // ❌ 放弃任务 (中途退出)
  const handleGiveUp = () => {
      const now = Date.now();
      const durationMs = now - startTimeRef.current;
      const durationSec = Math.floor(durationMs / 1000);
      
      let timeStr = "";
      if (durationSec < 60) {
          timeStr = `${durationSec}秒`;
      } else {
          const mins = Math.floor(durationSec / 60);
          const secs = durationSec % 60;
          timeStr = `${mins}分${secs}秒`;
      }

      handleSend(`(点击了放弃按钮，中断了专注模式。本次只坚持了 ${timeStr})`);
      onClose();
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-[#050505] flex flex-col items-center justify-center text-white animate-in fade-in duration-500">
        
        {/* 顶部状态：根据是否开始显示不同文案 */}
        <div className={`absolute top-12 flex items-center gap-2 text-[10px] font-mono tracking-[0.2em] ${hasStarted ? 'text-green-500 animate-pulse' : 'text-gray-500'} select-none`}>
            <div className={`w-1.5 h-1.5 rounded-full ${hasStarted ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-gray-500'}`}></div>
            {hasStarted 
                ? (lang === 'zh' ? '专注模式运行中' : 'FOCUS SEQUENCE ACTIVE')
                : (lang === 'zh' ? '等待指令' : 'SYSTEM STANDBY')
            }
        </div>

        {!showResult ? (
            <div className="flex flex-col items-center gap-10 w-full max-w-md px-6 transition-all duration-500">
                
                {/* Sol 头像 */}
                <div className="relative group">
                    <div className={`absolute inset-0 bg-red-600 rounded-full blur-[50px] transition-opacity duration-1000 ${hasStarted ? 'opacity-20 animate-pulse' : 'opacity-5'}`}></div>
                    
                    <div className="w-36 h-36 rounded-full border-2 border-red-900/50 p-1.5 relative z-10 bg-[#0a0a0a]">
                        <img 
                            src="/avatars/sol_hero.jpg" 
                            className={`w-full h-full rounded-full object-cover grayscale contrast-125 brightness-90 border border-white/5 transition-all duration-1000 ${!hasStarted && 'grayscale-[100%] brightness-75'}`}
                            onError={(e) => e.currentTarget.style.display='none'} 
                        />
                    </div>
                    
                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-[#1a0505] border border-red-500/30 px-4 py-1.5 rounded-full text-[10px] text-red-200 uppercase tracking-[0.15em] whitespace-nowrap shadow-lg z-20">
                        Sol - The Architect
                    </div>
                </div>

                {/* 倒计时显示 */}
                <div className={`text-[96px] font-black font-mono tracking-tighter leading-none drop-shadow-[0_0_20px_rgba(255,255,255,0.1)] select-none tabular-nums transition-colors duration-500 ${hasStarted ? 'text-gray-100' : 'text-gray-600'}`}>
                    {formatTime(timeLeft)}
                </div>

                {/* 毒鸡汤 / 提示语 */}
                <p className="text-gray-500 font-medium tracking-wide text-sm opacity-80 text-center max-w-[80%] italic h-6">
                    {hasStarted ? `“${quote}”` : (lang === 'zh' ? '准备好进入心流了吗？' : 'Ready to initiate flow state?')}
                </p>
            </div>
        ) : (
            // 结算页面
            <div className="flex flex-col items-center gap-6 animate-in zoom-in duration-300">
                <div className="relative">
                    <div className="absolute inset-0 bg-orange-500 blur-[40px] opacity-20"></div>
                    <Award size={80} className="text-orange-500 relative z-10 drop-shadow-[0_0_15px_rgba(249,115,22,0.5)]" />
                </div>
                
                <div className="text-center">
                    <h3 className="text-3xl font-black text-white uppercase mb-2 tracking-tight">
                        {lang === 'zh' ? '专注完成' : 'SEQUENCE COMPLETE'}
                    </h3>
                    <p className="text-sm text-gray-400 font-mono">
                        {dailyCount <= DAILY_LIMIT 
                            ? (lang === 'zh' ? `获得 ${REWARD_AMOUNT} RIN` : `REWARD: ${REWARD_AMOUNT} RIN`)
                            : (lang === 'zh' ? '今日奖励已达上限' : 'DAILY LIMIT REACHED')}
                    </p>
                </div>

                <button 
                    onClick={onClose} 
                    className="mt-4 px-8 py-3 bg-white text-black hover:bg-gray-200 rounded-full text-xs font-bold tracking-widest transition-all hover:scale-105"
                >
                    {lang === 'zh' ? '离开' : 'DISMISS'}
                </button>
            </div>
        )}

        {/* 底部按钮区：区分 开始前 和 开始后 */}
        {!showResult && (
            <div className="absolute bottom-12 w-full flex justify-center">
                {!hasStarted ? (
                    // --- 确认阶段 ---
                    <div className="flex flex-col gap-3 items-center animate-in slide-in-from-bottom-4">
                        <button 
                            onClick={handleStart}
                            className="px-10 py-3 bg-red-600 hover:bg-red-500 text-white rounded-full text-xs font-bold tracking-[0.15em] shadow-[0_0_20px_rgba(220,38,38,0.4)] hover:shadow-[0_0_30px_rgba(220,38,38,0.6)] hover:scale-105 transition-all flex items-center gap-2 group"
                        >
                            <Power size={14} className="group-hover:scale-110 transition-transform" />
                            {lang === 'zh' ? '启动专注程序' : 'INITIATE SEQUENCE'}
                        </button>
                        
                        <button 
                            onClick={onClose}
                            className="text-gray-600 hover:text-gray-400 text-[10px] tracking-wider font-bold flex items-center gap-1 py-2 px-4"
                        >
                            <ArrowLeft size={10} /> {lang === 'zh' ? '还没准备好' : 'NOT READY'}
                        </button>
                    </div>
                ) : (
                    // --- 运行阶段 (只有放弃按钮) ---
                    <button 
                        onClick={handleGiveUp}
                        className="px-6 py-2.5 rounded-full border border-red-900/30 bg-[#1a0505] text-[#8a2c2c] text-[10px] font-bold hover:bg-red-950/30 hover:text-red-500 hover:border-red-500/50 transition-all flex items-center gap-2 group tracking-wider animate-in fade-in"
                    >
                        <XCircle size={14} className="group-hover:rotate-90 transition-transform"/>
                        {lang === 'zh' ? '我是废物，我要放弃 (GIVE UP)' : 'I AM WEAK, I GIVE UP'}
                    </button>
                )}
            </div>
        )}
    </div>
  );
};