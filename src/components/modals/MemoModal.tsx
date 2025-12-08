import { useState, useEffect } from 'react';
import { X, CheckCircle, StickyNote, Sparkles, Clock, ArrowRight, AlertCircle } from 'lucide-react';
import { LangType } from '@/lib/constants';

interface MemoModalProps {
    show: boolean;
    onClose: () => void;
    lang: LangType;
    onReward?: (amount: number) => void;
}

// 任务库：增加 minSeconds (最少耗时)
const CARE_TASKS = [
    { id: 'water', zh: '喝一杯温水 (200ml)', en: 'Drink warm water (200ml)', minSeconds: 60 },
    { id: 'stretch', zh: '站起来伸个懒腰，保持 10 秒', en: 'Stand up and stretch for 10s', minSeconds: 20 },
    { id: 'blink', zh: '用力眨眼 10 次缓解疲劳', en: 'Blink hard 10 times', minSeconds: 15 },
    { id: 'window', zh: '看窗外风景，发呆一会儿', en: 'Stare out the window', minSeconds: 60 },
    { id: 'posture', zh: '调整坐姿，挺直后背', en: 'Fix your posture', minSeconds: 5 },
    { id: 'breath', zh: '做 3 次深呼吸', en: '3 Deep breaths', minSeconds: 30 },
    { id: 'smile', zh: '对着屏幕笑一下', en: 'Smile at the screen', minSeconds: 3 },
    { id: 'plant', zh: '去给植物浇点水', en: 'Water your plants', minSeconds: 120 },
    { id: 'tidy', zh: '整理一下桌面杂物', en: 'Tidy your desk', minSeconds: 60 }
];

const STORAGE_KEY = 'toughlove_rin_memo_state_v2';
const DAILY_REWARD_LIMIT = 3; // 每天前3个有奖励
const REWARD_AMOUNT = 10;

export const MemoModal = ({ show, onClose, lang, onReward }: MemoModalProps) => {
  // 状态管理
  const [currentTask, setCurrentTask] = useState<any>(null);
  const [startTime, setStartTime] = useState<number>(0);
  const [completedCount, setCompletedCount] = useState(0);
  
  // 界面状态
  const [isCompleted, setIsCompleted] = useState(false); // 当前任务是否刚完成
  const [warning, setWarning] = useState<string | null>(null); // 作弊警告
  const [rewardMessage, setRewardMessage] = useState<string | null>(null); // 奖励/夸奖提示

  // 初始化：读取状态或生成新任务
  useEffect(() => {
      if (show) {
          const today = new Date().toDateString();
          const saved = localStorage.getItem(STORAGE_KEY);
          
          let state = {
              date: today,
              taskId: null,
              startTime: Date.now(),
              count: 0
          };

          if (saved) {
              const parsed = JSON.parse(saved);
              if (parsed.date === today) {
                  state = parsed;
              }
          }

          // 恢复状态
          setCompletedCount(state.count);
          
          if (state.taskId) {
              // 恢复未完成的任务
              const task = CARE_TASKS.find(t => t.id === state.taskId);
              setCurrentTask(task);
              setStartTime(state.startTime);
          } else {
              // 生成新任务
              pickNewTask(state.count);
          }
          
          setIsCompleted(false);
          setWarning(null);
          setRewardMessage(null);
      }
  }, [show]);

  // 抽取新任务
  const pickNewTask = (currentCount: number) => {
      const randomTask = CARE_TASKS[Math.floor(Math.random() * CARE_TASKS.length)];
      setCurrentTask(randomTask);
      const now = Date.now();
      setStartTime(now);
      setIsCompleted(false);
      setRewardMessage(null);

      // 保存状态
      saveState(randomTask.id, now, currentCount);
  };

  const saveState = (taskId: string | null, start: number, count: number) => {
      const today = new Date().toDateString();
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
          date: today,
          taskId,
          startTime: start,
          count
      }));
  };

  const handleComplete = () => {
      if (!currentTask) return;

      const now = Date.now();
      const elapsedSeconds = (now - startTime) / 1000;

      // 1. 防作弊检查
      if (elapsedSeconds < currentTask.minSeconds) {
          const msg = lang === 'zh' 
              ? `太快了！Rin 正在盯着你呢... (至少还需要 ${Math.ceil(currentTask.minSeconds - elapsedSeconds)} 秒)`
              : `Too fast! Rin is watching... (${Math.ceil(currentTask.minSeconds - elapsedSeconds)}s more)`;
          setWarning(msg);
          // 震动惩罚
          if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
          return;
      }

      // 2. 完成逻辑
      const newCount = completedCount + 1;
      setCompletedCount(newCount);
      setIsCompleted(true);
      setWarning(null);

      // 3. 奖励判定
      if (newCount <= DAILY_REWARD_LIMIT) {
          // 有实质奖励
          if (onReward) onReward(REWARD_AMOUNT);
          setRewardMessage(lang === 'zh' ? `乖孩子。 (+${REWARD_AMOUNT} Rin)` : `Good job. (+${REWARD_AMOUNT} Rin)`);
      } else {
          // 仅口头表扬
          const praises = lang === 'zh' 
              ? ['做得好~', '摸摸头', '真棒', '我也为你开心'] 
              : ['Well done~', 'Headpat', 'Proud of you', 'Good boy/girl'];
          setRewardMessage(praises[Math.floor(Math.random() * praises.length)]);
      }

      // 4. 清除当前任务状态 (准备迎接下一个)
      saveState(null, 0, newCount);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
        <div className="absolute inset-0" onClick={onClose} />

        <div className="w-full max-w-sm bg-[#1e1e24] border-t-4 border-purple-400 rounded-lg shadow-2xl relative overflow-hidden z-10 animate-in zoom-in-95">
            
            {/* Header */}
            <div className="bg-[#2a2a30] px-4 py-3 flex justify-between items-center border-b border-white/5">
                <div className="flex items-center gap-2 text-purple-300">
                    <StickyNote size={16} />
                    <span className="text-xs font-bold tracking-widest uppercase">{lang === 'zh' ? 'Rin 的便利贴' : "RIN'S MEMO"}</span>
                </div>
                <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors"><X size={16}/></button>
            </div>
            
            {/* Main Content */}
            <div className="p-8 min-h-[300px] flex flex-col justify-between items-center text-center bg-[url('/noise.png')] bg-opacity-5 relative">
                
                {/* 装饰背景 */}
                <div className="absolute top-4 right-4 opacity-10 pointer-events-none">
                    <Clock size={64} className="text-purple-500" />
                </div>

                {!isCompleted ? (
                    // --- 任务进行中 ---
                    <>
                        <div className="flex-1 flex flex-col justify-center items-center gap-4">
                            <span className="text-[10px] text-purple-400/70 tracking-widest uppercase border border-purple-500/30 px-2 py-1 rounded">
                                {lang === 'zh' ? '当前任务' : 'CURRENT TASK'}
                            </span>
                            <h3 className="text-xl font-bold text-gray-100 leading-relaxed px-2">
                                {currentTask ? (lang === 'zh' ? currentTask.zh : currentTask.en) : '...'}
                            </h3>
                            <p className="text-xs text-gray-500">
                                {lang === 'zh' ? `预计耗时: ${currentTask?.minSeconds} 秒` : `Min time: ${currentTask?.minSeconds}s`}
                            </p>
                        </div>

                        <div className="w-full space-y-3 mt-6">
                            {warning && (
                                <div className="text-xs text-red-400 bg-red-500/10 py-2 rounded animate-pulse flex items-center justify-center gap-2">
                                    <AlertCircle size={12} /> {warning}
                                </div>
                            )}
                            
                            <button 
                                onClick={handleComplete}
                                className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg transition-all active:scale-95 shadow-[0_0_20px_rgba(147,51,234,0.3)] flex items-center justify-center gap-2"
                            >
                                <CheckCircle size={18} />
                                {lang === 'zh' ? '我做完了' : 'COMPLETED'}
                            </button>
                        </div>
                    </>
                ) : (
                    // --- 任务完成 / 结算 ---
                    <div className="flex-1 flex flex-col justify-center items-center w-full animate-in slide-in-from-right-4 duration-300">
                        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(34,197,94,0.2)]">
                            <CheckCircle size={32} className="text-green-400" />
                        </div>
                        
                        <h3 className="text-lg font-bold text-white mb-2">
                            {rewardMessage}
                        </h3>
                        
                        <p className="text-xs text-gray-500 mb-8 max-w-[200px]">
                            {completedCount <= DAILY_REWARD_LIMIT 
                                ? (lang === 'zh' ? '好好休息一下吧。' : 'Take a rest.')
                                : (lang === 'zh' ? '虽然没有奖励了，但我依然为你骄傲。' : 'No more rewards, but still proud.')}
                        </p>

                        <button 
                            onClick={() => pickNewTask(completedCount)}
                            className="w-full py-3 border border-white/10 hover:bg-white/5 text-gray-300 font-bold rounded-lg transition-all flex items-center justify-center gap-2"
                        >
                            {lang === 'zh' ? '下一个任务' : 'NEXT TASK'} <ArrowRight size={16} />
                        </button>
                    </div>
                )}
            </div>

            {/* Footer Status */}
            <div className="px-4 py-2 bg-[#151518] flex justify-between items-center text-[10px] text-gray-600 font-mono border-t border-white/5">
                 <div className="flex items-center gap-1">
                    <Sparkles size={10} className={completedCount < DAILY_REWARD_LIMIT ? 'text-yellow-500' : 'text-gray-600'} />
                    <span>REWARDS: {Math.max(0, DAILY_REWARD_LIMIT - completedCount)} LEFT</span>
                 </div>
                 <span>TODAY: {completedCount} DONE</span>
            </div>
        </div>
    </div>
  );
};