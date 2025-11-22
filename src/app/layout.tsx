import type { Metadata, Viewport } from "next";
import "./globals.css";
import { CSPostHogProvider } from './providers'; // 👈 引入组件

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#050505",
};

export const metadata: Metadata = {
  title: "毒伴 ToughLove AI",
  description: "反鸡汤式情绪陪伴 AI",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icon.png', type: 'image/png' },
    ],
    apple: [
      { url: '/icon.png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "毒伴",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh">
      {/* 👇 包裹 CSPostHogProvider */}
      <CSPostHogProvider>
        <body className="antialiased bg-[#050505] text-gray-100">
          {children}
        </body>
      </CSPostHogProvider>
    </html>
  );
}