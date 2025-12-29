'use client';

import { motion } from 'framer-motion';
import { Lock, Zap, ArrowUpRight, Disc } from 'lucide-react';
import { useAppLanguage } from '@/hooks/useAppLanguage';

export type SimStatus = 'LIVE' | 'LOCKED';

interface SimulationCardProps {
  status?: SimStatus;
  shardCount?: number;
  theme?: string; // 传入剧本主题
}

export function SimulationCard({ status = 'LIVE', shardCount = 0, theme }: SimulationCardProps) {
  
  const isReady = shardCount >= 5;
  const progress = Math.min(100, (shardCount / 5) * 100);
  const { t } = useAppLanguage();

  const getStatusConfig = () => {
      if (!isReady) {
          return {
              label: t.home.locked,
              color: 'bg-zinc-800 text-gray-400 border-zinc-700',
              icon: <Lock size={10} />,
              text: `${shardCount}/5 ${t.home.shardsCollected}`
          };
      }
      if (status === 'LIVE') {
          return {
              label: t.home.accessGranted,
              color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]',
              icon: <Zap size={10} className="fill-current" />,
              text: t.home.ticketReady
          };
      }
      return {
            label: t.home.offline,
            color: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
            icon: <Lock size={10} />,
            text: t.home.maintenance
      };
  };

  const currentStatus = getStatusConfig();

  return (
    <motion.div 
      whileHover={isReady ? { scale: 0.98 } : {}}
      whileTap={isReady ? { scale: 0.95 } : {}}
      className={`relative w-full h-full min-h-[140px] rounded-[1.5rem] overflow-hidden group border transition-all duration-300
        ${isReady ? 'cursor-pointer border-white/10 hover:border-emerald-500/40' : 'cursor-not-allowed border-white/5 opacity-80'}
        bg-[#080808]
      `}
    >
      {/* 背景效果 */}
      <div className="absolute inset-0 opacity-20" 
           style={{
               backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)',
               backgroundSize: '20px 20px'
           }} 
      />
      
      <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-[60px] opacity-20 transition-colors duration-500 ${isReady ? 'bg-emerald-600' : 'bg-gray-800'}`} />

      {/* 状态 Badge */}
      <div className="absolute top-4 right-4 z-20">
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border backdrop-blur-md text-[9px] font-bold tracking-wider ${currentStatus.color}`}>
          {currentStatus.icon}
          {currentStatus.label}
        </div>
      </div>

      {/* 内容区域 */}
      <div className="absolute bottom-4 left-5 z-10 w-full pr-5">
        
        <h2 className={`text-xl font-black tracking-tight leading-none mb-1 font-sans transition-colors ${isReady ? 'text-white group-hover:text-emerald-100' : 'text-gray-500'}`}>
            {t.home.simulation}
        </h2>

        {/* 🔥 修复：只要有 theme 就显示，不再依赖 isReady */}
        {theme ? (
            <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="mb-3 flex items-center gap-1.5"
            >
                {/* 如果是锁定状态，图标变灰，不转动 */}
                <Disc size={10} className={`${isReady ? 'text-emerald-500 animate-spin-slow' : 'text-gray-600'}`} />
                
                {/* 如果是锁定状态，文字变暗，边框变灰 */}
                <span className={`text-[10px] font-mono tracking-wider uppercase truncate max-w-[180px] px-1.5 py-0.5 rounded border 
                    ${isReady 
                        ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' 
                        : 'text-gray-500 bg-white/5 border-white/5'
                    }`}>
                    {theme}
                </span>
            </motion.div>
        ) : (
            <div className="mb-2" />
        )}
        
        {/* 底部进度/状态栏 */}
        <div className="flex items-center justify-between w-full pr-4">
            <div className="flex flex-col gap-1 w-full max-w-[120px]">
                 <span className={`text-[9px] tracking-[0.1em] font-medium border-l-2 pl-2 ${isReady ? 'text-gray-400 border-emerald-500/50' : 'text-gray-600 border-gray-700'}`}>
                    {currentStatus.text}
                 </span>
                 {!isReady && (
                     <div className="h-1 w-full bg-white/5 rounded-full mt-1 overflow-hidden">
                         <div className="h-full bg-cyan-900/50 transition-all duration-500" style={{ width: `${progress}%` }} />
                     </div>
                 )}
            </div>

            {isReady && (
                <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                    <ArrowUpRight size={12} className="text-white" />
                </div>
            )}
        </div>
      </div>
    </motion.div>
  );
}