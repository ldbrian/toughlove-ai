'use client';

import { Flame, Play } from 'lucide-react';
import { useAppLanguage } from '@/hooks/useAppLanguage';

export function FocusWidget() {
  const { t } = useAppLanguage();
  return (
    <div className="w-full h-full relative group cursor-pointer overflow-hidden rounded-[1.5rem] bg-[#080808] border border-white/5 hover:border-orange-500/30 transition-colors">
      
      {/* 动态背景：Sol 的能量场 */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-900/10 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
      
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4">
        {/* 核心图标 */}
        <div className="w-12 h-12 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center group-hover:scale-110 group-hover:bg-orange-500/20 transition-all duration-300">
          <Flame size={20} className="text-orange-500 fill-orange-500/20" />
        </div>
        
        <div className="text-center space-y-0.5">
          <h3 className="text-sm font-bold text-gray-200 uppercase tracking-wider">{t.home.focus}</h3>
          <p className="text-[9px] text-orange-500/60 font-mono">{t.home.solProtocol}</p>
        </div>
      </div>

      {/* 交互提示 */}
      <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <Play size={10} className="text-orange-400 fill-current" />
      </div>
    </div>
  );
}