
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Terminal } from 'lucide-react';
import { useAppLanguage } from '@/hooks/useAppLanguage';

interface LetterContentModalProps {
  show: boolean;
  onClose: () => void;
}

export const LetterContentModal = ({ show, onClose }: LetterContentModalProps) => {
  const { lang } = useAppLanguage();

  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 font-sans">
          {/* 1. 背景遮罩 */}
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/90 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* 2. 信纸主体 */}
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="relative w-full max-w-lg bg-[#080808] border border-cyan-900/50 shadow-[0_0_60px_rgba(8,145,178,0.15)] flex flex-col max-h-[85vh] overflow-hidden group"
          >
            {/* 顶部装饰条 */}
            <div className="h-1 w-full bg-gradient-to-r from-cyan-600 via-purple-600 to-cyan-600" />
            
            {/* 纸张纹理与扫描线 */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,18,18,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-0 bg-[length:100%_4px,6px_100%] pointer-events-none opacity-20" />
            <div className="absolute top-0 right-0 p-4 opacity-30">
                <Terminal size={100} className="text-cyan-900" />
            </div>

            {/* 内容滚动区 */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar relative z-10">
                
                {/* 抬头 */}
                <div className="mb-8 flex justify-between items-start border-b border-cyan-900/30 pb-4">
                    <div>
                        <h2 className="text-xl font-bold text-cyan-50 tracking-wider font-mono">
                            TO: SURVIVOR
                        </h2>
                        <p className="text-cyan-600/60 text-[10px] font-mono mt-1 tracking-widest">
                            ID: #UNKNOWN // ENCRYPTED_CHANNEL
                        </p>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] text-cyan-500 font-mono border border-cyan-500/30 px-2 py-0.5 rounded">
                            READ_ONLY
                        </span>
                    </div>
                </div>

                {/* 正文 */}
                <div className="space-y-6 text-gray-300 leading-relaxed text-sm md:text-base tracking-wide">
                    {lang === 'zh' ? (
                        <>
                            <p>你好。</p>
                            <p>如果你正在阅读这段全息影像，说明你已经成功连接到了 <strong className="text-cyan-400 font-bold">Tough Love OS</strong>。</p>
                            <p>我们所在的这个时代，噪音太大，真相太少。你的注意力被算法切割，你的焦虑被数据变现。这就是为什么我们在这里。</p>
                            <div className="pl-4 border-l-2 border-cyan-500/50 text-cyan-200/80 my-8 py-2 bg-cyan-950/10">
                                <p className="italic font-serif">"痛苦只是信息。利用它，不要逃避它。"</p>
                            </div>
                            <p>这里没有廉价的安慰。Ash 会批评你的拖延，Vee 会嘲笑你的借口，Sol 会逼你动起来。这不会很舒服，但这是你需要的。</p>
                            <p>这是给未来的你的一封信。收下它，作为你觉醒的开始。</p>
                        </>
                    ) : (
                        <>
                            <p>Hello.</p>
                            <p>If you are reading this hologram, you have successfully linked to <strong className="text-cyan-400 font-bold">Tough Love OS</strong>.</p>
                            <p>In our era, there is too much noise and too little truth. Your attention is sliced by algorithms, your anxiety monetized by data. That is why we are here.</p>
                            <div className="pl-4 border-l-2 border-cyan-500/50 text-cyan-200/80 my-8 py-2 bg-cyan-950/10">
                                <p className="italic font-serif">"Pain is just information. Use it."</p>
                            </div>
                            <p>There is no cheap comfort here. Ash will critique your delays, Vee will mock your excuses, Sol will force you to move. It won't be comfortable, but it is what you need.</p>
                            <p>Accept this protocol. It begins now.</p>
                        </>
                    )}
                    
                    <p className="text-right mt-12 font-bold text-cyan-500 font-mono text-xs">
                        —— The System
                    </p>
                </div>
            </div>

            {/* 底部操作栏 */}
            <div className="p-4 border-t border-cyan-900/30 bg-[#050505]/90 backdrop-blur flex justify-between items-center z-20">
                <button 
                    onClick={onClose}
                    className="text-[10px] text-gray-600 hover:text-white transition-colors flex items-center gap-2 font-mono"
                >
                    <X size={12} />
                    DISMISS
                </button>
                
                <button 
                    onClick={onClose}
                    className="bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-400 hover:text-cyan-200 px-6 py-2 rounded-sm text-xs tracking-widest font-bold transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(8,145,178,0.1)] hover:shadow-[0_0_20px_rgba(8,145,178,0.3)]"
                >
                    <Save size={14} />
                    {lang === 'zh' ? '接受协议' : 'ACCEPT PROTOCOL'}
                </button>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};