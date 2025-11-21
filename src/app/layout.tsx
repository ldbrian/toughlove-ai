import type { Metadata, Viewport } from "next";
import "./globals.css";

// 1. PWA 视口配置 (禁止缩放，全屏体验)
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#050505",
};

// 2. 元数据配置 (图标、标题、Manifest)
export const metadata: Metadata = {
  title: "毒伴 ToughLove AI",
  description: "反鸡汤式情绪陪伴 AI",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' }, // 优先用 SVG
      { url: '/icon.png', type: 'image/png' },     // 备用 PNG
    ],
    apple: [
      { url: '/icon.png' }, // iOS 桌面图标强制用 PNG
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "毒伴",
  },
};

// 3. 👇 刚才报错就是因为少了下面这个默认导出的函数
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh">
      <body className="antialiased bg-[#050505] text-gray-100">
        {children}
      </body>
    </html>
  );
}