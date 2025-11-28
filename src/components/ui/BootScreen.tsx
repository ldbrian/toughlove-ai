import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export const BootScreen = () => {
  const [text, setText] = useState<string[]>([]);
  const lines = ["INITIALIZING CORE SYSTEMS...", "LOADING PERSONALITY MODULES...", "ESTABLISHING NEURAL LINK...", "BYPASSING SAFETY PROTOCOLS...", "SYSTEM ONLINE."];
  useEffect(() => {
    let delay = 0;
    lines.forEach((line) => { delay += Math.random() * 300 + 100; setTimeout(() => setText(prev => [...prev, line]), delay); });
  }, []);
  return (
    <div className="flex flex-col h-screen bg-black text-green-500 font-mono text-xs p-8 justify-end pb-20">
      {text.map((t, i) => <div key={i} className="mb-2 animate-[fadeIn_0.1s_ease-out]"><span className="opacity-50 mr-2">{`>`}</span>{t}</div>)}
      <div className="mt-2 flex items-center gap-2 text-[#7F5CFF] animate-pulse"><Loader2 size={14} className="animate-spin" /><span>WAITING FOR USER INPUT...</span></div>
    </div>
  );
};