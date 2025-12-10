'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Zap, Triangle, Package, ShoppingBag } from 'lucide-react';
import { getDict } from '@/lib/i18n/dictionaries';
import { LangType } from '@/types';
// ✅ 引入升级后的商店组件
import { ShopModal } from '@/components/shop/ShopModal';

export function BottomNav() {
  const pathname = usePathname();
  const [lang, setLang] = useState<LangType>('zh');
  const [isShopOpen, setIsShopOpen] = useState(false);
  
  // ✅ 新增：在 BottomNav 管理一个简单的余额状态，传给商店
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    const initData = () => {
        // 1. 同步语言
        const savedLang = localStorage.getItem('toughlove_lang_preference');
        if (savedLang) setLang(savedLang as LangType);

        // 2. 同步余额 (简单的本地读取，实际生产环境可能需要从 API 获取)
        // 假设我们在登录或初始化时把余额存到了 localStorage 的 'toughlove_user_rin' 中
        // 如果没有，默认为 0
        const savedBalance = localStorage.getItem('toughlove_user_rin');
        if (savedBalance) setBalance(parseInt(savedBalance, 10));
    };

    initData();
    
    window.addEventListener('storage', initData);
    window.addEventListener('toughlove_lang_change', initData);
    // ✅ 新增：监听自定义的余额变化事件 (方便其他组件通知更新)
    window.addEventListener('toughlove_balance_update', initData);

    return () => {
        window.removeEventListener('storage', initData);
        window.removeEventListener('toughlove_lang_change', initData);
        window.removeEventListener('toughlove_balance_update', initData);
    };
  }, []);

  // ✅ 处理余额更新（当商店购买/充值成功后回调）
  const handleBalanceUpdate = (newBalance: number) => {
      setBalance(newBalance);
      // 同时更新本地存储，保持同步
      localStorage.setItem('toughlove_user_rin', newBalance.toString());
  };

  const t = getDict(lang);

  interface TabItem {
    name: string;
    href: string;
    icon: any;
    activeColor: string;
    action?: () => void;
  }

  const tabs: TabItem[] = [
    {
      name: t.nav.resonance,
      href: '/resonance',
      icon: Zap,
      activeColor: 'text-cyan-400',
    },
    {
      name: t.nav.mirror,
      href: '/mirror',
      icon: Triangle, 
      activeColor: 'text-fuchsia-500', 
    },
    {
      // 商店入口
      name: (t.nav as any).shop || 'SHOP', 
      href: '#shop',
      icon: ShoppingBag,
      activeColor: 'text-purple-400',
      action: () => setIsShopOpen(true),
    },
    {
      name: t.nav.terminal,
      href: '/terminal',
      icon: Package,
      activeColor: 'text-emerald-400',
    }
  ];

  if (pathname.includes('/chat/')) return null;

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 w-full max-w-md mx-auto">
        <div className="h-12 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none" />
        
        <nav className="bg-slate-950/90 backdrop-blur-md border-t border-slate-800 pb-6 pt-3">
          <div className="flex justify-around items-center h-12">
            {tabs.map((tab) => {
              const isActive = (!tab.action && pathname.startsWith(tab.href)) || 
                               (tab.href === '/resonance' && pathname === '/') ||
                               (tab.href === '#shop' && isShopOpen);
              const Icon = tab.icon;

              const InnerContent = (
                <div className={`flex flex-col items-center justify-center gap-1 transition-all duration-300 ${
                  isActive ? tab.activeColor : "text-slate-600 hover:text-slate-400"
                }`}>
                  <div className={`relative p-1 transition-transform ${isActive ? 'scale-110' : ''}`}>
                    <Icon 
                      size={24} 
                      strokeWidth={isActive ? 2.5 : 2}
                      className={tab.href === '/mirror' && isActive ? "drop-shadow-[0_0_8px_rgba(217,70,239,0.6)]" : ""}
                    />
                    {tab.href === '/mirror' && (
                       <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full animate-ping hidden" /> 
                    )}
                    {tab.href === '#shop' && isActive && (
                       <span className="absolute inset-0 bg-purple-500/20 blur-lg rounded-full" />
                    )}
                  </div>
                  <span className="text-[10px] font-mono tracking-wider uppercase scale-90">
                    {tab.name}
                  </span>
                </div>
              );

              if (tab.action) {
                return (
                  <button 
                    key={tab.href}
                    onClick={tab.action}
                    className="flex-1 group outline-none"
                  >
                    {InnerContent}
                  </button>
                );
              }

              return (
                <Link 
                  key={tab.href}
                  href={tab.href}
                  className="flex-1 group"
                >
                  {InnerContent}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>

      {/* ✅ 修复：传递 ShopModal 所需的所有正确参数 */}
      <ShopModal 
        show={isShopOpen}              // 这里改成了 show
        onClose={() => setIsShopOpen(false)}
        userRin={balance}              // 传入当前余额
        onBalanceUpdate={handleBalanceUpdate} // 传入更新回调
        lang={lang}                    // 传入当前语言
      />
    </>
  );
}