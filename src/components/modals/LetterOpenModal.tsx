

import { motion } from 'framer-motion';
import { Mail, Lock, Fingerprint, Disc } from 'lucide-react';
import { useState } from 'react';

// 假设这是传入的 Props
interface LetterOpenModalProps {
  onReceive: () => void;
}

export const LetterOpenModal = ({ onReceive }: LetterOpenModalProps) => {
  const [isOpening, setIsOpening] = useState(false);

  const handleOpen = () => {
    setIsOpening(true);
    // 播放一个简短的动画后触发回调
    setTimeout(() => {
      onReceive();
    }, 1200); 
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* 1. 背景：深色模糊遮罩 + 网格噪点 */}
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" />
      <div className="absolute inset-0 bg-[url('/images/grid-pattern.png')] opacity-10 pointer-events-none" /> {/* 也可以用 CSS grid */}

      {/* 2. 主体：赛博信封 */}
      <motion.div 
        initial={{ scale: 0.8, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 1.5, opacity: 0 }}
        className="relative w-full max-w-md aspect-[1.6/1] perspective-1000 group cursor-pointer"
        onClick={handleOpen}
      >
        
        {/* 信封主体容器 */}
        <motion.div 
          className="w-full h-full relative bg-slate-900 border border-cyan-500/30 shadow-[0_0_50px_rgba(6,182,212,0.15)] overflow-hidden"
          animate={isOpening ? { rotateX: -10, scale: 0.95, opacity: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
            
            {/* 装饰：角落的发光电路纹路 */}
            <div className="absolute top-0 left-0 w-20 h-20 border-t-2 border-l-2 border-cyan-500/50 rounded-tl-lg" />
            <div className="absolute top-0 right-0 w-20 h-20 border-t-2 border-r-2 border-cyan-500/50 rounded-tr-lg" />
            <div className="absolute bottom-0 left-0 w-20 h-20 border-b-2 border-l-2 border-cyan-500/50 rounded-bl-lg" />
            <div className="absolute bottom-0 right-0 w-20 h-20 border-b-2 border-r-2 border-cyan-500/50 rounded-br-lg" />

            {/* 信封折痕视觉 (利用 SVG 或 CSS 渐变模拟信封盖) */}
            <div className="absolute inset-0 bg-gradient-to-b from-slate-800/50 to-slate-950/80 z-0" />
            
            {/* 上盖的三角形视觉效果 */}
            <div className="absolute top-0 left-0 w-full h-[60%] bg-gradient-to-b from-slate-800 to-slate-900 z-10 clip-path-triangle opacity-40 border-b border-cyan-500/20" 
                 style={{ clipPath: 'polygon(0 0, 100% 0, 50% 100%)' }} 
            />
            {/* 边框线条模拟 */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-20 opacity-30">
                <line x1="0" y1="0" x2="50%" y2="60%" stroke="#06b6d4" strokeWidth="1" />
                <line x1="100%" y1="0" x2="50%" y2="60%" stroke="#06b6d4" strokeWidth="1" />
            </svg>

            {/* 内容区域：文字信息 */}
            <div className="absolute bottom-6 w-full text-center z-30 flex flex-col items-center gap-1">
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    transition={{ delay: 0.2 }}
                    className="flex items-center gap-2 text-cyan-400/80 mb-2"
                >
                    <div className="h-[1px] w-8 bg-cyan-500/50" />
                    <span className="text-[10px] tracking-[0.2em] font-mono uppercase">Incoming Transmission</span>
                    <div className="h-[1px] w-8 bg-cyan-500/50" />
                </motion.div>
                
                <h2 className="text-2xl font-bold text-white tracking-widest font-sans drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
                    传入传输
                </h2>
                
                <div className="mt-1 px-3 py-1 bg-cyan-950/50 border border-cyan-500/20 rounded text-cyan-300 text-xs font-mono">
                    Time-Capsule (时间胶囊) #001
                </div>
            </div>

            {/* 中心：数字蜡封 (交互核心) */}
            <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-40">
                <motion.div 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="relative w-16 h-16 rounded-full bg-slate-950 border-2 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.4)] flex items-center justify-center group-hover:border-cyan-200 transition-colors"
                >
                    {/* 呼吸光环 */}
                    <motion.div 
                        animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0, 0.2] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute inset-0 rounded-full bg-cyan-400 blur-md"
                    />
                    
                    {/* 图标切换 */}
                    <div className="relative z-10 text-cyan-100">
                        {isOpening ? (
                             <Fingerprint size={32} className="animate-pulse text-cyan-400" />
                        ) : (
                             <Lock size={28} />
                        )}
                    </div>
                </motion.div>
                <div className="mt-2 text-[9px] text-cyan-500/60 text-center font-mono tracking-wider">
                    TAP TO DECRYPT<br/>点击解密
                </div>
            </div>

            {/* 扫描线特效 */}
            <motion.div 
                animate={{ top: ['0%', '100%'] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="absolute left-0 w-full h-[2px] bg-cyan-400/30 blur-[1px] z-50"
            />
        </motion.div>
      </motion.div>
    </div>
  );
};