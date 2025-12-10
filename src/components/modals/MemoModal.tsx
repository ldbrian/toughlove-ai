import { X, Check } from 'lucide-react';
// Refactor: 引入单一事实来源 (根据你的目录结构使用相对路径)
import { MemoModalProps } from '@/types';

export function MemoModal({ 
  show, 
  onClose, 
  lang, 
  partnerId, 
  onReward, 
  handleSend 
}: MemoModalProps) {
  if (!show) return null;

  // 这里的任务数据暂时 Hardcode，后续版本可以根据 partnerId 动态获取
  const task = {
    title: lang === 'zh' ? '去洗一把脸。' : 'Go wash your face.',
    desc: lang === 'zh' ? '别让屏幕把你的脸照得油光满面。' : "Don't let the screen make your face shiny.",
    reward: 10
  };
  
  const speakerName = partnerId.toUpperCase();

  // ✅ 完成任务
  const handleComplete = () => {
      // Safety: 类型定义中 onReward 是可选的，增加安全调用保护
      if (onReward) {
        onReward(task.reward);
      }
      
      // 🚀 通知 AI
      handleSend(`(乖乖听话，完成了便利贴任务：“${task.title}”)`);
      onClose();
  };

  // ❌ 拒绝任务
  const handleRefuse = () => {
      // 🚀 通知 AI
      handleSend(`(撕掉了便利贴，无视了任务：“${task.title}”，并表示要继续摆烂)`);
      onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="relative w-[320px] bg-[#fffdf0] text-[#2d2d2d] p-8 rounded-sm shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] rotate-1 transform transition-all duration-300 hover:rotate-0 hover:scale-[1.01]">
          
          {/* Tape Effect */}
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-28 h-10 bg-white/40 backdrop-blur-md border-l-2 border-r-2 border-white/30 shadow-sm -rotate-2"></div>

          <div className="mt-6 text-center">
              <p className="text-xs font-bold text-gray-400 tracking-[0.2em] uppercase mb-8">
                  {speakerName} {lang === 'zh' ? '的加急便签' : "'S URGENT MEMO"}
              </p>
              
              <h3 className="text-2xl font-black mb-4 leading-tight tracking-tight">
                  {task.title}
              </h3>
              
              <p className="text-sm font-bold text-[#5a5a5a] leading-relaxed mb-10">
                  {task.desc}
              </p>

              <button 
                onClick={handleComplete} 
                className="w-full py-3.5 bg-[#1a1c29] text-[#fffdf0] rounded-lg font-bold text-sm shadow-lg hover:bg-black hover:shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 group"
              >
                 <Check size={18} className="text-yellow-400 group-hover:scale-110 transition-transform"/> 
                 {lang === 'zh' ? `乖乖照做 (完成 +${task.reward})` : `Do it (Complete +${task.reward})`}
              </button>

              <button 
                onClick={handleRefuse} 
                className="mt-6 text-xs text-gray-400 font-bold hover:text-gray-600 hover:underline decoration-wavy decoration-red-400 transition-colors"
              >
                  {lang === 'zh' ? '🚫 我不听，我要摆烂' : '🚫 I refuse, I want to rot'}
              </button>
          </div>
      </div>
    </div>
  );
}