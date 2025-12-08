import { useState, useEffect } from 'react';
import { Mail, ArrowRight, Fingerprint } from 'lucide-react';

interface LetterOpenModalProps {
  show: boolean;
  onOpen: () => void; // 点击拆信后的回调
}

export const LetterOpenModal = ({ show, onOpen }: LetterOpenModalProps) => {
  const [step, setStep] = useState<'ENVELOPE' | 'READING'>('ENVELOPE');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) setTimeout(() => setVisible(true), 500);
  }, [show]);

  if (!show) return null;

  return (
    <div className={`fixed inset-0 z-[800] flex items-center justify-center bg-black/95 backdrop-blur-xl transition-opacity duration-1000 ${visible ? 'opacity-100' : 'opacity-0'}`}>
      
      {/* 阶段 1: 悬浮的信封 */}
      {step === 'ENVELOPE' && (
        <div 
          onClick={() => setStep('READING')}
          className="cursor-pointer group relative flex flex-col items-center animate-[float_6s_ease-in-out_infinite]"
        >
          {/* 光效 */}
          <div className="absolute inset-0 bg-[#7F5CFF] blur-[100px] opacity-20 group-hover:opacity-40 transition-opacity"></div>
          
          <div className="relative w-64 h-40 bg-[#e3d5b8] rounded-lg shadow-2xl flex items-center justify-center border-4 border-[#d4c5a5] group-hover:scale-105 transition-transform duration-500">
             <div className="absolute inset-0 border border-black/10 m-2 border-dashed"></div>
             <Mail size={48} className="text-[#8c7b5d] opacity-50" />
             <div className="absolute bottom-4 right-4 text-[10px] font-serif text-[#8c7b5d] opacity-80 rotate-[-5deg]">
                From: 2077
             </div>
          </div>
          
          <div className="mt-8 text-center space-y-2">
             <p className="text-xs text-gray-500 tracking-[0.3em] uppercase font-mono group-hover:text-[#7F5CFF] transition-colors">
                Incoming Transmission
             </p>
             <p className="text-[10px] text-gray-700 animate-pulse">Tap to open</p>
          </div>
        </div>
      )}

      {/* 阶段 2: 展开的信纸 */}
      {step === 'READING' && (
        <div className="w-full max-w-sm p-6 animate-[scaleIn_0.5s_ease-out]">
           <div className="relative bg-[#f5e6ca] text-[#2c241b] p-8 rounded-sm shadow-[0_0_50px_rgba(255,255,255,0.1)] font-serif leading-relaxed rotate-1">
              {/* 顶部胶带 */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-24 h-6 bg-white/30 backdrop-blur-sm rotate-[-2deg] shadow-sm"></div>

              <div className="mb-6 opacity-60 text-xs tracking-widest uppercase border-b border-[#2c241b]/20 pb-2 flex justify-between">
                 <span>No. 000001</span>
                 <span>LOG: START</span>
              </div>

              <p className="mb-4 text-sm">
                 致 过去的我自己：
              </p>
              <p className="mb-4 text-sm">
                 当你读到这封信时，说明**连接**已经建立。不要问我是谁，也不要问那个世界变成了什么样。
              </p>
              <p className="mb-6 text-sm font-bold">
                 只有一件事是确定的：不要温和地走进那个良夜。
              </p>
              <p className="mb-8 text-sm">
                 活下去。保持愤怒。
              </p>

              <div className="flex justify-between items-end border-t border-[#2c241b]/20 pt-4">
                 <div className="flex items-center gap-2 opacity-50">
                    <Fingerprint size={24} />
                    <span className="text-[10px] font-mono">ID_MATCHED</span>
                 </div>
                 <button 
                    onClick={onOpen}
                    className="flex items-center gap-2 px-4 py-2 bg-[#2c241b] text-[#f5e6ca] text-xs font-bold tracking-widest hover:bg-black transition-colors"
                 >
                    ACCEPT <ArrowRight size={12} />
                 </button>
              </div>
           </div>
        </div>
      )}

    </div>
  );
};