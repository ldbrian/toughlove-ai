import { useState, useEffect } from 'react';
import { X, Check, Share2, RefreshCw } from 'lucide-react';
import { MemoModalProps } from '@/types';
import { ShareModal } from '@/components/shared/ShareModal';

// 🔥 任务池配置
const TASK_POOL: Record<string, { title: { zh: string, en: string }, desc: { zh: string, en: string }, reward: number }[]> = {
    // 通用任务
    common: [
        { title: { zh: "去洗一把脸。", en: "Go wash your face." }, desc: { zh: "别让屏幕把你的脸照得油光满面。", en: "Don't let the screen make your face shiny." }, reward: 10 },
        { title: { zh: "喝一杯温水。", en: "Drink warm water." }, desc: { zh: "你的身体现在比沙漠还干。", en: "Your body is drier than a desert right now." }, reward: 10 },
        { title: { zh: "清理你的桌面。", en: "Clean your desk." }, desc: { zh: "环境的混乱会导致思维的混乱。", en: "A messy desk leads to a messy mind." }, reward: 15 },
    ],
    // Ash (严厉/健康)
    ash: [
        { title: { zh: "坐直了！", en: "Sit up straight!" }, desc: { zh: "你的脊柱正在发出哀嚎，听到了吗？", en: "Your spine is screaming. Can you hear it?" }, reward: 20 },
        { title: { zh: "做一次深呼吸。", en: "Deep breath." }, desc: { zh: "吸气4秒，憋气4秒，呼气4秒。现在。", en: "In 4s, hold 4s, out 4s. Now." }, reward: 10 },
    ],
    // Rin (情绪/氛围)
    rin: [
        { title: { zh: "看窗外一分钟。", en: "Look outside." }, desc: { zh: "别盯着电子屏幕了，看看真实的世界。", en: "Stop staring at pixels. Look at the real world." }, reward: 15 },
        { title: { zh: "听一首纯音乐。", en: "Listen to music." }, desc: { zh: "让大脑的频率降下来。", en: "Lower your brain's frequency." }, reward: 15 },
    ],
    // Sol (运动/热血)
    sol: [
        { title: { zh: "做 10 个俯卧撑！", en: "10 Pushups! Now!" }, desc: { zh: "别找借口！就在地上做！", en: "No excuses! Do it on the floor!" }, reward: 30 },
        { title: { zh: "站起来走两步！", en: "Stand up & Walk!" }, desc: { zh: "你的腿要退化了！动起来！", en: "Your legs are atrophying! Move!" }, reward: 15 },
    ],
    // Vee (搞怪/反常规)
    vee: [
        { title: { zh: "删一张丑照。", en: "Delete a bad photo." }, desc: { zh: "释放一点存储空间，也释放一点黑历史。", en: "Free up space, free up history." }, reward: 20 },
        { title: { zh: "断网 5 分钟。", en: "Disconnect 5m." }, desc: { zh: "试试没有网络能不能活下来？", en: "Can you survive offline?" }, reward: 50 },
    ]
};

export function MemoModal({ 
  show, 
  onClose, 
  lang, 
  partnerId, 
  onReward, 
  handleSend 
}: MemoModalProps) {
  const [showShare, setShowShare] = useState(false);
  const [currentTask, setCurrentTask] = useState<any>(null);

  // 初始化或重新随机任务
  useEffect(() => {
      if (show) {
          randomizeTask();
      } else {
          setShowShare(false);
      }
  }, [show, partnerId]);

  const randomizeTask = () => {
      const pKey = partnerId?.toLowerCase() || 'ash';
      // 合并通用任务和角色专属任务
      const pool = [...TASK_POOL.common, ...(TASK_POOL[pKey] || [])];
      const randomTask = pool[Math.floor(Math.random() * pool.length)];
      setCurrentTask(randomTask);
  };

  if (!show || !currentTask) return null;

  const speakerName = partnerId.toUpperCase();
  const taskTitle = lang === 'zh' ? currentTask.title.zh : currentTask.title.en;
  const taskDesc = lang === 'zh' ? currentTask.desc.zh : currentTask.desc.en;

  const handleComplete = () => {
      if (onReward) onReward(currentTask.reward);
      handleSend(`(乖乖听话，完成了任务：“${taskTitle}”)`);
      onClose();
  };

  const handleRefuse = () => {
      handleSend(`(撕掉了便利贴，无视了任务：“${taskTitle}”，并表示要继续摆烂)`);
      onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="relative w-[320px] bg-[#fffdf0] text-[#2d2d2d] p-8 rounded-sm shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] rotate-1 transform transition-all duration-300 hover:rotate-0 hover:scale-[1.01]">
          
          {/* Tape Effect */}
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-28 h-10 bg-white/40 backdrop-blur-md border-l-2 border-r-2 border-white/30 shadow-sm -rotate-2"></div>

          {/* 右上角功能区 */}
          <div className="absolute top-4 right-4 flex gap-2">
              {/* 刷新任务按钮 (如果不喜欢这个任务) */}
              <button onClick={randomizeTask} className="text-gray-300 hover:text-gray-500 transition-colors p-1">
                  <RefreshCw size={14} />
              </button>
              {/* 分享按钮 */}
              <button onClick={() => setShowShare(true)} className="text-gray-400 hover:text-gray-600 transition-colors p-1">
                  <Share2 size={16} />
              </button>
          </div>

          <div className="mt-6 text-center">
              <p className="text-xs font-bold text-gray-400 tracking-[0.2em] uppercase mb-8">
                  {speakerName} {lang === 'zh' ? '的加急便签' : "'S URGENT MEMO"}
              </p>
              
              <h3 className="text-2xl font-black mb-4 leading-tight tracking-tight min-h-[3rem] flex items-center justify-center">
                  {taskTitle}
              </h3>
              
              <p className="text-sm font-bold text-[#5a5a5a] leading-relaxed mb-10 min-h-[3rem]">
                  {taskDesc}
              </p>

              <button 
                onClick={handleComplete} 
                className="w-full py-3.5 bg-[#1a1c29] text-[#fffdf0] rounded-lg font-bold text-sm shadow-lg hover:bg-black hover:shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 group"
              >
                 <Check size={18} className="text-yellow-400 group-hover:scale-110 transition-transform"/> 
                 {lang === 'zh' ? `乖乖照做 (完成 +${currentTask.reward} rin)` : `Do it (Complete +${currentTask.reward} rin)`}
              </button>

              <button 
                onClick={handleRefuse} 
                className="mt-6 text-xs text-gray-400 font-bold hover:text-gray-600 hover:underline decoration-wavy decoration-red-400 transition-colors"
              >
                  {lang === 'zh' ? '🚫 我不听，我要摆烂' : '🚫 I refuse, I want to rot'}
              </button>
          </div>

          {/* Share Modal */}
          <ShareModal 
              show={showShare}
              onClose={() => setShowShare(false)}
              type="memo"
              lang={lang}
              data={{
                  title: taskTitle,
                  text: taskDesc,
                  from: speakerName
              }}
          />
      </div>
    </div>
  );
}