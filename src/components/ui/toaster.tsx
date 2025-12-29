'use client';

import { Toaster as Sonner } from 'sonner';

export function Toaster() {
  return (
    <Sonner
      position="top-center" // 消息从顶部弹出，符合移动端习惯
      toastOptions={{
        // 自定义默认样式，覆盖库的默认白底
        classNames: {
          toast: 'group toast group-[.toaster]:bg-black/90 group-[.toaster]:text-gray-200 group-[.toaster]:border-white/10 group-[.toaster]:shadow-xl group-[.toaster]:backdrop-blur-md group-[.toaster]:rounded-2xl group-[.toaster]:font-sans',
          description: 'group-[.toaster]:text-gray-500',
          actionButton: 'group-[.toaster]:bg-cyan-600 group-[.toaster]:text-white',
          cancelButton: 'group-[.toaster]:bg-gray-800 group-[.toaster]:text-gray-400',
        },
      }}
    />
  );
}