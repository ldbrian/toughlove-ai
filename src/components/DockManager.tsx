'use client';

import { useState, useEffect } from 'react';
// 确保路径正确，如果是默认导出则不需要花括号
import { FloatingDock } from '@/components/layout/FloatingDock'; 

export default function DockManager() {
  // 1. Hook: 状态
  const [showDock, setShowDock] = useState(true);

  // 2. Hook: 副作用 (监听事件)
  // ⚠️ 注意：这个 useEffect 必须每次渲染都“有机会”执行（不能被提前 return 阻断）
  useEffect(() => {
    const handleToggle = (e: Event) => {
      // 强制类型断言，获取自定义事件的数据
      const customEvent = e as CustomEvent;
      if (customEvent.detail && typeof customEvent.detail.visible === 'boolean') {
        setShowDock(customEvent.detail.visible);
      }
    };

    window.addEventListener('toggle-dock', handleToggle);
    return () => window.removeEventListener('toggle-dock', handleToggle);
  }, []);

  // 3. 渲染逻辑 (只在这里 return)
  return (
    <div 
      className={`
        fixed bottom-6 left-0 w-full z-50 px-5 
        transition-opacity duration-300 ease-in-out
        ${showDock ? 'opacity-100' : 'opacity-0 pointer-events-none'}
      `}
    >
       {/* pointer-events-auto 确保即使父容器穿透，这里也能点击 */}
       <div className="pointer-events-auto w-full">
          <FloatingDock />
       </div>
    </div>
  );
}