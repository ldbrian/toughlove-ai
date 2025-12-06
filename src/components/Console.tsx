import React, { useState, useEffect } from 'react';
import { ArrowRight, MessageSquare, X, Zap } from 'lucide-react';
// 引入常量
import { ROLE_MATRIX, PersonaType, MoodType, InteractionOption } from '../lib/constants';

interface ConsoleProps {
  currentRole: PersonaType;
  currentMood: MoodType;
  // 🔥 核心修改：onAction 现在接收 3 个参数
  onAction: (actionId: string, label: string, contextText: string) => void; 
  customText?: string | null; 
  onContinue?: () => void;
}

const Console: React.FC<ConsoleProps> = ({ currentRole, currentMood, onAction, customText, onContinue }) => {
  const matrixContent = ROLE_MATRIX[currentRole]?.[currentMood] || ROLE_MATRIX['Ash']['neutral'];
  const textToShow = customText || matrixContent.text;
  const isHistoryMode = !!customText;

  const [displayedText, setDisplayedText] = useState('');
  
  useEffect(() => {
    setDisplayedText('');
    let i = 0;
    const speed = isHistoryMode ? 10 : 30; 
    const timer = setInterval(() => {
      setDisplayedText(textToShow.slice(0, i + 1));
      i++;
      if (i >= textToShow.length) clearInterval(timer);
    }, speed);
    return () => clearInterval(timer);
  }, [textToShow, isHistoryMode]);

  const getButtonStyle = (style: string = 'secondary') => {
    const base = "flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 active:scale-95";
    switch (style) {
      case 'primary': return `${base} bg-white text-black hover:bg-gray-200 shadow-[0_0_15px_rgba(255,255,255,0.3)]`;
      case 'danger': return `${base} bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 hover:border-red-500/60`;
      case 'secondary': default: return `${base} bg-white/5 text-white/80 border border-white/10 hover:bg-white/10 hover:text-white`;
    }
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 mb-6">
      <div className="relative bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-5 overflow-hidden shadow-2xl ring-1 ring-white/5">
        
        <div className="flex items-center justify-between mb-3 text-[10px] text-white/40 font-mono uppercase tracking-widest">
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${isHistoryMode ? 'bg-blue-500' : (currentMood === 'angry' ? 'bg-red-500 animate-pulse' : 'bg-emerald-500')}`} />
            <span>Link: {currentRole} // {isHistoryMode ? 'HISTORY' : currentMood}</span>
          </div>
          <div className="flex gap-1">
            <span>{isHistoryMode ? 'LOG_LOADED' : 'SYS_READY'}</span>
          </div>
        </div>

        <div className="min-h-[60px] mb-5">
          <p className="text-base text-white/90 leading-relaxed font-sans">
            {displayedText}
            {!isHistoryMode && <span className="inline-block w-1.5 h-4 ml-1 bg-white/60 animate-pulse align-middle" />}
          </p>
        </div>

        <div className="flex gap-3">
          {isHistoryMode ? (
            <button onClick={onContinue} className={getButtonStyle('secondary')}>
              <MessageSquare size={14} />
              <span>继续对话 / Continue</span>
              <ArrowRight size={14} className="opacity-50" />
            </button>
          ) : (
            matrixContent.options.map((option: InteractionOption, index: number) => (
              <button
                key={index}
                // 🔥 核心修改：这里调用时传入了第 3 个参数 matrixContent.text
                onClick={() => onAction(option.value, option.label, matrixContent.text)}
                className={getButtonStyle(option.style)}
              >
                {option.style === 'primary' && <Zap size={14} className="fill-current" />}
                {option.style === 'danger' && <X size={14} />}
                <span>{option.label}</span>
                {option.style !== 'danger' && <ArrowRight size={14} className="opacity-50" />}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Console;