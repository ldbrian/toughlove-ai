// 📂 文件路径: src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ToughLove",
  description: "Cyberpunk AI Companion",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* 这里的 body 只负责全局底色和字体，没有任何 App 组件 */}
      <body className="font-sans antialiased bg-[#050505] text-gray-200 selection:bg-emerald-500/30">
        {children}
      </body>
    </html>
  );
}