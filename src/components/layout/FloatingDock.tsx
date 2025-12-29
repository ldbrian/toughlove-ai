// src/components/layout/FloatingDock.tsx
'use client';

import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Home, MessageSquare, Sparkles, ShoppingBag, User 
} from 'lucide-react';
import { useAppLanguage } from '@/hooks/useAppLanguage';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export function FloatingDock() {
  // 1. 所有 Hooks 必须无条件按顺序执行
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useAppLanguage();
  const [activeTab, setActiveTab] = useState('home');
  const [isVisible, setIsVisible] = useState(true);

  // 2. useEffect 必须放在 return 之前
  useEffect(() => {
    const handleToggle = (e: Event) => {
        const customEvent = e as CustomEvent;
        // e.detail.visible 决定显隐
        if (customEvent.detail && typeof customEvent.detail.visible === 'boolean') {
            setIsVisible(customEvent.detail.visible);
        }
    };
    window.addEventListener('toggle-dock', handleToggle);
    return () => window.removeEventListener('toggle-dock', handleToggle);
  }, []);

  // 3. 计算是否需要根据路径隐藏 (Logic)
  // 如果在聊天室详情页 (路径以 /chat/ 开头) 或 Feed 详情页，则隐藏
  // 注意：pathname 有可能为 null，加个空字符串保护
  const currentPath = pathname || '';
  const shouldHideByPath = currentPath.startsWith('/chat/') || currentPath.startsWith('/feed/');

  // 4. 所有 Hook 执行完毕，现在可以根据条件 return 了
  if (!isVisible || shouldHideByPath) {
      return null;
  }

  const tabs = [
    { id: 'home', icon: Home, label: 'HOME', path: '/' },
    { id: 'chat', icon: MessageSquare, label: 'CHAT', path: '/chat' },
    { id: 'memo', icon: Sparkles, label: 'MEMO', path: '/memories' },
    { id: 'shop', icon: ShoppingBag, label: 'SHOP', path: '/shop' },
    { id: 'me',   icon: User, label: 'ME',   path: '/profile' },
  ];

  return (
    <div className="w-full flex items-center justify-between px-8 py-4 bg-[#121212]/90 backdrop-blur-xl border border-white/10 rounded-[1.5rem] shadow-2xl">
      {tabs.map((tab) => {
        const isActive = currentPath === tab.path || (tab.id === 'home' && currentPath === '/');
        
        return (
          <Link
    key={tab.id}
    href={tab.path} // 替换 onClick={() => router.push(...)}
    className="relative group flex flex-col items-center justify-center w-10 h-10 shrink-0"
  >
    {isActive && (
      <motion.div
        layoutId="activeTab"
        className="absolute inset-[-4px] bg-white/10 rounded-xl"
        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
      />
    )}
    
    <tab.icon 
      size={24}
      strokeWidth={1.5}
      className={`relative z-10 transition-colors duration-300 ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-300'}`} 
    />
    
    {isActive && (
        <span className="absolute -bottom-2 w-1 h-1 bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
    )}
  </Link>
        );
      })}
    </div>
  );
}