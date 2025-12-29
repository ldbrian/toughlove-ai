// 📂 文件路径: src/app/(marketing)/layout.tsx
import { Toaster } from '@/components/ui/toaster'; 

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#050505] relative overflow-hidden">
      {/* 这里可以加一些 H5 专属的背景光效，比如一个红色的光斑 */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-red-900/20 blur-[120px] rounded-full pointer-events-none" />
      
      {/* 主内容区域 */}
      <main className="w-full max-w-md z-10 relative">
        {children}
      </main>
      
      {/* H5 也需要 Toaster 来显示报错，但不需要 DockManager */}
      <Toaster />
    </div>
  );
}