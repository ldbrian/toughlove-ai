'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Zap, Triangle, Package } from 'lucide-react';


export function BottomNav() {
  const pathname = usePathname();

  const tabs = [
    {
      name: '共鸣',
      href: '/resonance',
      icon: Zap,
      activeColor: 'text-cyan-400',
    },
    {
      name: '镜面',
      href: '/mirror',
      icon: Triangle, // 倒三角，象征碎片
      activeColor: 'text-fuchsia-500', 
    },
    {
      name: '终端',
      href: '/terminal',
      icon: Package,
      activeColor: 'text-emerald-400',
    }
  ];

  // 如果是在具体聊天页面，隐藏底部栏 (沉浸模式)
  if (pathname.includes('/chat/')) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 w-full max-w-md mx-auto">
      {/* 渐变遮罩，防断层 */}
      <div className="h-12 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none" />
      
      <nav className="bg-slate-950/90 backdrop-blur-md border-t border-slate-800 pb-6 pt-3">
        <div className="flex justify-around items-center h-12">
          {tabs.map((tab) => {
            // 简单的匹配逻辑：只要路径以该 href 开头就算选中
            // 特殊处理：如果是根路径 '/' 视为选中第一个
            const isActive = pathname.startsWith(tab.href) || (tab.href === '/resonance' && pathname === '/');
            const Icon = tab.icon;

            return (
              <Link 
                key={tab.name} 
                href={tab.href}
                className="flex-1 group"
              >
                <div className={`flex flex-col items-center justify-center gap-1 transition-all duration-300 ${
                  isActive ? tab.activeColor : "text-slate-600 hover:text-slate-400"
                }`}>
                  
                  <div className={`relative p-1 transition-transform ${isActive ? 'scale-110' : ''}`}>
                    <Icon 
                      size={24} 
                      strokeWidth={isActive ? 2.5 : 2}
                      className={tab.name === '镜面' && isActive ? "drop-shadow-[0_0_8px_rgba(217,70,239,0.6)]" : ""}
                    />
                    {/* 镜面 Tab 的呼吸小红点 (预留) */}
                    {tab.name === '镜面' && (
                       <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full animate-ping hidden" /> 
                    )}
                  </div>

                  <span className="text-[10px] font-mono tracking-wider uppercase scale-90">
                    {tab.name}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}