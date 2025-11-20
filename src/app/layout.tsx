import type { Metadata } from "next";
// 👇 这一行是命脉！必须要！
import "./globals.css"; 

export const metadata: Metadata = {
  title: "毒伴 ToughLove AI",
  description: "反鸡汤式情绪陪伴 AI",
};

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