import { useState, useEffect, useRef } from 'react';
import { Terminal, ChevronRight, Zap, MessageSquare } from 'lucide-react';
// ⚠️ 请确认这里的路径！如果不确定，请检查你的 ROLE_MATRIX 到底定义在哪里
// 如果是在 src/constants/personas.ts，请改为 import { ROLE_MATRIX } from '@/constants/personas';
import { ROLE_MATRIX } from '@/lib/constants'; 
import { LangType, MoodType, PersonaType } from '@/types';

interface ConsoleProps {
  currentRole: string; 
  currentMood: string;
  onAction: (id: string, label: string, context: string) => void;
  customText: string | null; 
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

  // 1. 安全获取当前角色的配置
  const safeRole = (currentRole === 'System' ? 'Ash' : currentRole);
  const roleKey = safeRole as Exclude<PersonaType, 'System'>;
  const moodKey = currentMood as MoodType;
  // 防御性编程：如果找不到对应的 Mood，回退到 neutral
  const personaState = ROLE_MATRIX[roleKey]?.[moodKey] || ROLE_MATRIX['Ash']['neutral'];

  // ----------------------------------------------------------------------
  // 🔥 核心修复逻辑 (The Fix)
  // ----------------------------------------------------------------------
  
  const defaultHookZh = personaState.hook.zh;
  const defaultHookEn = personaState.hook.en;

  // 🕵️‍♂️ 侦探逻辑：判断传入的 customText 是否看起来像“默认开场白”
  // 我们不再要求完全相等，只要前 15 个字母对得上，就认为是开场白
  // 这样能忽略空格、换行符或细微标点的差异
  const isLooksLikeGreeting = customText && (
      customText.trim().startsWith(defaultHookEn.substring(0, 15).trim()) || 
      customText.trim().startsWith(defaultHookZh.substring(0, 15).trim())
  );

  // 决定最终显示的文本：
  // 如果是开场白（无论中英），或者是空文本 -> 强制根据当前 lang 显示
  // 只有当它完全不像开场白时，才认为是真正的“历史记录”，原样显示
  const finalContent = (isLooksLikeGreeting || !customText) 
      ? (lang === 'zh' ? defaultHookZh : defaultHookEn)
      : customText;

  // 决定模式：如果最终显示的是默认开场白，就不算 Memory Recall
  const isMemoryMode = !!customText && !isLooksLikeGreeting;

  // 清理文本中的动作标记 [action]
  const targetText = finalContent.replace(/\[.*?\]/g, '').trim();

  // ----------------------------------------------------------------------

  useEffect(() => {
    // 每次内容变化重置打字机
    setDisplayedText('');
    setIsTyping(true);
    indexRef.current = 0;

    const interval = setInterval(() => {
        // 防止数组越界
        if (indexRef.current < targetText.length) {
            setDisplayedText(targetText.slice(0, indexRef.current + 1));
            indexRef.current++;
        } else {
            clearInterval(interval);
            setIsTyping(false);
        }
    }, 30); 
    return () => clearInterval(interval);
  }, [targetText]); // 依赖项改为 targetText，确保切语言时重打

  return (
    <div className="w-full max-w-md mx-auto p-4 animate-in slide-in-from-bottom-4 duration-500">
      <div className="bg-[#0a0a0a]/90 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/5 font-mono text-sm relative group">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-white/5">
           <div className="flex items-center gap-2">
               <div className={`w-2 h-2 rounded-full ${isTyping ? 'bg-green-500 animate-pulse' : 'bg-green-500/50'}`}></div>
               <span className="text-[10px] text-gray-500 tracking-[0.2em] uppercase font-bold">
                   {/* 根据状态显示不同标题 */}
                   {isMemoryMode ? 'MEMORY_RECALL' : `LINK: ${currentRole.toUpperCase()} // ${currentMood.toUpperCase()}`}
               </span>
           </div>
           <span className="text-[9px] text-gray-600 tracking-widest opacity-50">SYS_READY</span>
        </div>

        {/* Console Screen */}
        <div className="px-6 py-8 min-h-[140px] flex flex-col justify-center relative">
            <div className="text-gray-200 text-sm leading-normal font-medium tracking-wide">
                {displayedText}
                <span className={`inline-block w-2 h-4 bg-white/50 align-middle ml-1 ${isTyping ? 'animate-pulse' : 'opacity-0'}`}></span>
            </div>
        </div>

        {/* Footer Buttons */}
        <div className="grid grid-cols-2 gap-4 p-6 pt-0">
           
           {/* 情况 A: 只要不是那种特别老的历史记录，就显示互动按钮 */}
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
           
           {/* 情况 B: 真正的历史记录才显示 Continue */}
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