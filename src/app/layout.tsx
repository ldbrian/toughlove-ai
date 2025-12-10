import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { BottomNav } from "@/components/layout/BottomNav";
import { ContentProvider } from '@/contexts/ContentContext';


const inter = Inter({ subsets: ["latin"] });

// 1. Metadata (标题、描述)
export const metadata: Metadata = {
  title: "透 · TOUGH",
  description: "Cyberpunk Emotional Companion",
};

// 2. 🔥 关键修复：Viewport 必须单独导出！
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // 禁止缩放，像原生 App
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* 3. 视觉样式强制修正 
         flex justify-center: 让手机容器居中
         bg-black: 网页背景纯黑
      */}
      <body className={`${inter.className} bg-black min-h-screen flex justify-center overflow-hidden`}>
        
        {/* --- 手机容器 (Mobile Frame) --- 
            max-w-md: 限制最大宽度 (约 450px)
            w-full: 在手机上占满
            shadow-2xl: 给两边加阴影，增加立体感
        */}
        <div className="w-full max-w-md bg-slate-950 min-h-screen shadow-[0_0_50px_rgba(0,0,0,0.5)] relative flex flex-col border-x border-slate-800/50">
          
          {/* 主内容区 */}
          <main className="flex-1 relative overflow-hidden">
          <ContentProvider>
            {children}
          </ContentProvider>
          </main>

          {/* 底部导航 */}
          <BottomNav />
          
        </div>

      </body>
    </html>
  );
}