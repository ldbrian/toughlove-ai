'use client';

import { CloudRain, ArrowUpRight, Mail } from 'lucide-react';
import { useAppLanguage } from '@/hooks/useAppLanguage';

interface StickyNoteProps {
  content?: string;
  isRevealed?: boolean; 
  onClick?: () => void;
}

export function StickyNote({ content, isRevealed = false, onClick }: StickyNoteProps) {
  const { lang } = useAppLanguage();

  // 定义内部文案字典
  const txt = {
      zh: {
          labelRevealed: "Rin 的便签",
          labelHidden: "收到新消息",
          maskText: "* 内容已折叠 *",
          hintText: "留给你的...",
          actionRevealed: "查看详情",
          actionHidden: "点击揭开",
          defaultContent: "听听雨声..."
      },
      en: {
          labelRevealed: "Rin's Note",
          labelHidden: "New Message",
          maskText: "* Hidden Content *",
          hintText: "Something for you...",
          actionRevealed: "View details",
          actionHidden: "Tap to open",
          defaultContent: "Listen to the rain..."
      }
  }[lang === 'zh' ? 'zh' : 'en'];

  // 处理内容为空的情况
  const finalContent = content || txt.defaultContent;

  return (
    <div 
      onClick={onClick}
      className="w-full h-full relative group cursor-pointer overflow-hidden rounded-[1.5rem] bg-[#1a1625] border border-white/10 hover:border-purple-500/40 transition-all duration-500 shadow-xl"
    >
      {/* 1. 顶部胶带效果 (Tape) */}
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-12 h-8 bg-white/10 backdrop-blur-sm -rotate-2 border-l border-r border-white/5 opacity-50 z-20" />

      {/* 2. 背景氛围 (Rin's Vibe) */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-[#0f0a1e] to-black opacity-80" />
      <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />
      
      {/* 3. 装饰元素：未读显示信封，已读显示雨滴 */}
      <div className="absolute top-4 right-4 opacity-50 group-hover:opacity-100 transition-opacity">
         {!isRevealed ? (
            <Mail size={14} className="text-purple-300 animate-pulse" />
         ) : (
            <CloudRain size={14} className="text-purple-400" />
         )}
      </div>

      {/* 4. 内容区域 */}
      <div className="absolute inset-0 p-5 flex flex-col justify-between z-10">
        
        {/* 标题 */}
        <div className="flex items-center gap-2 opacity-60">
            <div className={`w-1.5 h-1.5 rounded-full bg-purple-500 ${!isRevealed && 'animate-ping'}`} />
            <span className="text-[9px] font-bold text-purple-200 tracking-widest uppercase">
                {isRevealed ? txt.labelRevealed : txt.labelHidden}
            </span>
        </div>

        {/* 核心文字 */}
        <div className="flex-1 flex items-center">
            {isRevealed ? (
                // === 状态 A: 已揭开 (显示具体任务) ===
                <p className="text-lg leading-tight text-gray-200 font-serif italic opacity-90 group-hover:text-purple-100 transition-colors line-clamp-2" style={{ textShadow: '0 0 10px rgba(168,85,247,0.3)' }}>
                   "{finalContent}"
                </p>
            ) : (
                // === 状态 B: 未揭开 (显示神秘邀请) ===
                <div className="space-y-1">
                    <p className="text-sm text-purple-200/50 font-sans tracking-widest uppercase scale-y-90 origin-left blur-[0.5px]">
                        {txt.maskText}
                    </p>
                    <p className="text-lg text-gray-400 font-serif italic opacity-60">
                        "{txt.hintText}"
                    </p>
                </div>
            )}
        </div>

        {/* 底部交互提示 */}
        <div className="flex items-center justify-between mt-2">
            <span className="text-[9px] text-gray-600 font-mono group-hover:text-purple-400/50 transition-colors">
                {isRevealed ? txt.actionRevealed : txt.actionHidden}
            </span>
            <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-purple-500/20 transition-all transform translate-x-2 group-hover:translate-x-0 opacity-0 group-hover:opacity-100">
                <ArrowUpRight size={12} className="text-purple-300" />
            </div>
        </div>
      </div>
    </div>
  );
}