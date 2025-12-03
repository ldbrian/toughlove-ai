import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CSPostHogProvider } from './providers'; 
import { ServiceWorkerRegister } from '@/components/ServiceWorkerRegister';

const inter = Inter({ subsets: ["latin"] });

// 🔥 [1] 配置视口 (PWA 必备: 禁止缩放，全屏体验)
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#050505", // 状态栏颜色
};

// 🔥 [2] 配置元数据 (图标与安装)
export const metadata: Metadata = {
  title: "透 · TOUGH",
  description: "人间清醒的赛博棱镜",
  manifest: "/manifest.json", // 👈 指向第二步创建的文件
  icons: {
    icon: "/icons/icon-512.png",
    shortcut: "/icons/icon-512.png",
    apple: "/icons/icon-512.png", // 👈 iOS 桌面图标
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "TOUGH",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh">
      <CSPostHogProvider>
        <body className={`${inter.className} antialiased bg-[#050505] text-gray-100`}>
           <ServiceWorkerRegister />
           {children}
        </body>
      </CSPostHogProvider>
    </html>
  );
}