'use client';

import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

interface ScreenFrameProps {
  children: ReactNode;
  nav: ReactNode;
}

export function ScreenFrame({ children, nav }: ScreenFrameProps) {
  const pathname = usePathname();
  
  // 🔥 核心逻辑：判断是否为“宽屏模式”页面
  // 在这里添加所有你需要全屏显示的路径
  const isWidePage = pathname?.startsWith('/status') || pathname?.startsWith('/admin') || pathname?.startsWith('/monitor');

  return (
    <div className={`
      w-full min-h-screen bg-slate-950 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative flex flex-col transition-all duration-500 ease-in-out
      ${isWidePage ? 'max-w-full' : 'max-w-md border-x border-slate-800/50'}
    `}>
      
      {/* 主内容区 */}
      <main className="flex-1 relative overflow-hidden flex flex-col">
        {children}
      </main>

      {/* 底部导航：只有在非宽屏模式（手机模式）下才显示
          控制台通常不需要底部导航，因为它有自己的 Header 和操作流
      */}
      {!isWidePage && nav}
      
    </div>
  );
}