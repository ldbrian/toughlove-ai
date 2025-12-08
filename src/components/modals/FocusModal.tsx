import { useState, useEffect } from 'react';
import { X, Play, Pause, RotateCcw, Timer, Award } from 'lucide-react';
import { LangType } from '@/lib/constants';

interface FocusModalProps {
    show: boolean;
    onClose: () => void;
    lang: LangType;
    onReward?: (amount: number) => void; // 🔥 传入奖励回调
}

// 防刷配置
const DAILY_LIMIT = 4; // 每天最多4次
const REWARD_AMOUNT = 50; // 每次50 Rin
const STORAGE_KEY = 'toughlove_focus_record';

export const FocusModal = ({ show, onClose, lang, onReward }: FocusModalProps) => {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [dailyCount, setDailyCount] = useState(0);
  const [showResult, setShowResult] = useState(false); // 完成后的结算页

  // 初始化：读取今日已完成次数
  useEffect(() => {
      if (show) {
          const today = new Date().toDateString();
          const saved = localStorage.getItem(STORAGE_KEY);
          if (saved) {
              const record = JSON.parse(saved);
              if (record.date === today) {
                  setDailyCount(record.count);
              } else {
                  setDailyCount(0); // 新的一天，重置
              }
          }
      }
  }, [show]);

  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0 && isActive) {
      // 🔥 倒计时结束
      setIsActive(false);
      handleComplete();
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const handleComplete = () => {
      // 1. 播放提示音 (可选)
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);

      // 2. 检查防刷限制
      if (dailyCount < DAILY_LIMIT) {
          const newCount = dailyCount + 1;
          setDailyCount(newCount);
          
          // 更新本地存储
          const today = new Date().toDateString();
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: today, count: newCount }));

          // 发放奖励
          if (onReward) onReward(REWARD_AMOUNT);
      }
      
      // 3. 显示结果页
      setShowResult(true);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-sm p-6 animate-in fade-in">
        <div className="w-full max-w-xs bg-[#1a1a1a] border border-orange-500/30 rounded-2xl p-6 text-center shadow-[0_0_30px_rgba(249,115,22,0.1)] relative overflow-hidden">
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white z-10"><X size={18}/></button>
            
            {!showResult ? (
                <>
                    <div className="flex items-center justify-center gap-2 text-orange-400 mb-6">
                        <Timer size={18} />
                        <span className="text-xs font-bold tracking-widest uppercase">{lang === 'zh' ? '专注模式' : 'FOCUS MODE'}</span>
                    </div>

                    <div className="text-6xl font-black text-white font-mono mb-8 tracking-tighter tabular-nums">
                        {formatTime(timeLeft)}
                    </div>

                    <div className="flex justify-center gap-4">
                        <button onClick={() => setIsActive(!isActive)} className="w-14 h-14 rounded-full bg-orange-500 text-black flex items-center justify-center hover:bg-orange-400 transition-all active:scale-95 shadow-lg">
                            {isActive ? <Pause size={24} fill="black" /> : <Play size={24} fill="black" className="ml-1"/>}
                        </button>
                        <button onClick={() => { setIsActive(false); setTimeLeft(25*60); }} className="w-14 h-14 rounded-full bg-white/10 text-gray-300 flex items-center justify-center hover:bg-white/20 transition-all active:scale-95">
                            <RotateCcw size={20} />
                        </button>
                    </div>
                    
                    <div className="mt-6 flex flex-col gap-1">
                        <p className="text-[10px] text-gray-500">
                            {isActive ? (lang === 'zh' ? '闭嘴，干活。' : 'Shut up and work.') : (lang === 'zh' ? '准备好了就开始。' : 'Start when ready.')}
                        </p>
                        <p className="text-[9px] text-orange-500/50 uppercase tracking-widest">
                            {lang === 'zh' ? `今日奖励: ${dailyCount}/${DAILY_LIMIT}` : `Daily Loot: ${dailyCount}/${DAILY_LIMIT}`}
                        </p>
                    </div>
                </>
            ) : (
                <div className="py-8 animate-in zoom-in">
                    <Award size={64} className="text-orange-500 mx-auto mb-4 animate-bounce" />
                    <h3 className="text-2xl font-black text-white uppercase mb-2">
                        {lang === 'zh' ? '专注完成' : 'SESSION COMPLETE'}
                    </h3>
                    <p className="text-sm text-gray-400 mb-6">
                        {dailyCount <= DAILY_LIMIT 
                            ? (lang === 'zh' ? `获得 ${REWARD_AMOUNT} Rin` : `+${REWARD_AMOUNT} Rin`)
                            : (lang === 'zh' ? '今日奖励已达上限' : 'Daily limit reached')}
                    </p>
                    <button onClick={() => { setShowResult(false); setTimeLeft(25*60); }} className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-full text-xs font-bold">
                        {lang === 'zh' ? '继续' : 'CONTINUE'}
                    </button>
                </div>
            )}
        </div>
    </div>
  );
};