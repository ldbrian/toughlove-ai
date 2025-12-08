import { useState, useEffect, useRef } from 'react';
import { Terminal, ChevronRight, Zap, MessageSquare } from 'lucide-react';
import { ROLE_MATRIX, LangType, MoodType, PersonaType } from '@/lib/constants';

interface ConsoleProps {
  currentRole: string; 
  currentMood: string;
  onAction: (id: string, label: string, context: string) => void;
  customText: string | null; // 这是传入的“最后一条聊天记录”
  onContinue: () => void;
  lang: LangType;
  inventoryItems?: string[]; 
}

export default function Console({ 
  currentRole, currentMood, onAction, customText, onContinue, lang 
}: ConsoleProps) {
  
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const indexRef = useRef(0);

  // 1. 获取配置 (Hook & Options)
  const roleKey = currentRole as PersonaType;
  const moodKey = currentMood as MoodType;
  const personaState = ROLE_MATRIX[roleKey]?.[moodKey] || ROLE_MATRIX['Ash']['neutral'];

  // 2. 判定当前模式：是否有记忆
  // 如果 customText 存在，说明是“老熟人”，进入记忆模式
  const isMemoryMode = !!customText;

  // 3. 决定显示的文本
  const rawText = customText || (lang === 'zh' ? personaState.hook.zh : personaState.hook.en);
  const targetText = rawText.replace(/\[.*?\]/g, '').trim();

  useEffect(() => {
    setDisplayedText('');
    setIsTyping(true);
    indexRef.current = 0;

    const interval = setInterval(() => {
        setDisplayedText(targetText.slice(0, indexRef.current + 1));
        indexRef.current++;
        if (indexRef.current >= targetText.length) {
            clearInterval(interval);
            setIsTyping(false);
        }
    }, 30);
    return () => clearInterval(interval);
  }, [targetText, currentRole, currentMood]);

  return (
    <div className="w-full max-w-md mx-auto p-4 animate-in slide-in-from-bottom-4 duration-500">
      <div className="bg-[#0a0a0a]/90 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/5 font-mono text-sm relative group">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-white/5">
           <div className="flex items-center gap-2">
               <div className={`w-2 h-2 rounded-full ${isTyping ? 'bg-green-500 animate-pulse' : 'bg-green-500/50'}`}></div>
               <span className="text-[10px] text-gray-500 tracking-[0.2em] uppercase font-bold">
                   {/* 区分显示模式状态 */}
                   {isMemoryMode ? 'MEMORY_RECALL' : `LINK: ${currentRole} // ${currentMood.toUpperCase()}`}
               </span>
           </div>
           <span className="text-[9px] text-gray-600 tracking-widest opacity-50">SYS_READY</span>
        </div>

        {/* Content Area */}
        <div className="px-6 py-8 min-h-[140px] flex flex-col justify-center relative">
            <div className="text-gray-200 text-base leading-loose font-medium tracking-wide">
                {displayedText}
                <span className={`inline-block w-2 h-5 bg-white/50 align-middle ml-1 ${isTyping ? 'animate-pulse' : 'opacity-0'}`}></span>
            </div>
        </div>

        {/* 🔥 Footer Buttons Logic Fix 🔥 */}
        <div className="grid grid-cols-2 gap-4 p-6 pt-0">
           
           {/* 情况 A: 初次见面 (无记忆) -> 显示 Hook 的两个选项 */}
           {!isMemoryMode && personaState.options.map((opt, idx) => (
             <button 
               key={opt.id}
               onClick={() => onAction(opt.id, lang === 'zh' ? opt.label.zh : opt.label.en, targetText)}
               className={`
                 relative group overflow-hidden rounded-lg border border-white/10 p-4 text-left transition-all hover:border-white/30 active:scale-95
                 ${idx === 0 ? 'bg-white text-black hover:bg-gray-200' : 'bg-white/5 text-white hover:bg-white/10'}
               `}
             >
                <div className="flex items-center justify-between mb-1">
                    {idx === 0 ? <Zap size={18} className="fill-current" /> : <MessageSquare size={18} />}
                    <ChevronRight size={16} className={`transition-transform group-hover:translate-x-1 ${idx === 0 ? 'opacity-100' : 'opacity-50'}`} />
                </div>
                <span className="text-xs font-black tracking-wider uppercase block mt-2">
                    {lang === 'zh' ? opt.label.zh : opt.label.en}
                </span>
             </button>
           ))}
           
           {/* 情况 B: 记忆模式 (有记忆) OR 异常情况 -> 只显示一个“继续”按钮 */}
           {(isMemoryMode || personaState.options.length === 0) && (
               <button 
                   onClick={onContinue}
                   className="col-span-2 py-4 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-white font-bold tracking-widest uppercase flex items-center justify-center gap-2 transition-all group"
               >
                   <span className="group-hover:translate-x-1 transition-transform flex items-center gap-2">
                       {lang === 'zh' ? '继续连接' : 'CONTINUE LINK'} <ChevronRight size={16} />
                   </span>
               </button>
           )}
        </div>

      </div>
    </div>
  );
}