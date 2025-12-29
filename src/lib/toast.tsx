import React from 'react';
import { toast } from 'sonner';
import { PERSONAS_REGISTRY } from '@/config/personas';

// 内部组件：消息卡片样式
const MessageToast = ({ 
  personaId, 
  text, 
  onClick 
}: { 
  personaId: string, 
  text: string, 
  onClick: () => void 
}) => {
  const persona = PERSONAS_REGISTRY[personaId] || PERSONAS_REGISTRY['ash'];
  
  return (
    <div 
      onClick={onClick}
      // 🔥 核心修复：添加背景色、边框、圆角、阴影、宽度
      className="w-full bg-[#1a1a1a]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl flex items-center gap-3 cursor-pointer active:scale-95 transition-transform select-none relative overflow-hidden group"
    >
      {/* 装饰：左侧增加一条对应角色颜色的光条 */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${persona.color?.replace('text-', 'bg-') || 'bg-cyan-500'}`} />

      {/* AI 头像 */}
      <div className={`w-10 h-10 rounded-full border border-white/10 overflow-hidden flex-shrink-0 bg-gray-900 flex items-center justify-center relative`}>
         {persona.avatar.startsWith('/') ? (
             <img src={persona.avatar} alt={persona.name} className="w-full h-full object-cover" />
         ) : (
             <span className="text-lg">{persona.avatar || 'AI'}</span>
         )}
         {/* 在线小绿点 */}
         <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-[#1a1a1a] rounded-full"></div>
      </div>

      {/* 文本内容 */}
      <div className="flex-1 min-w-0 pl-1">
        <div className="flex justify-between items-center mb-0.5">
            <h4 className={`text-sm font-bold ${persona.color || 'text-cyan-400'}`}>
               {persona.name}
            </h4>
            <span className="text-[10px] text-gray-500 font-mono opacity-70">NOW</span>
        </div>
        <p className="text-xs text-gray-200 truncate leading-tight font-sans">
          {text}
        </p>
      </div>

      {/* 装饰：右侧箭头 */}
      <div className="text-gray-600 group-hover:text-white transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
      </div>
    </div>
  );
};

export const Toast = {
  // 1. 普通成功 (绿色/青色风格)
  success: (msg: string) => toast.success(msg, {
    style: { 
        backgroundColor: '#0f0f0f', 
        color: '#22d3ee', 
        borderColor: 'rgba(34, 211, 238, 0.2)' 
    },
    icon: '✨'
  }),

  // 2. 普通错误 (红色风格)
  error: (msg: string) => toast.error(msg, {
    style: { 
        backgroundColor: '#0f0f0f', 
        color: '#f87171', 
        borderColor: 'rgba(248, 113, 113, 0.2)' 
    },
    icon: '❌'
  }),

  // 3. AI 消息通知
  message: (personaId: string, text: string, onOpen: () => void) => {
    toast.custom((t) => (
      <MessageToast 
        personaId={personaId} 
        text={text} 
        onClick={() => {
            toast.dismiss(t);
            onOpen();
        }} 
      />
    ), {
      duration: 5000,
    });
  }
};