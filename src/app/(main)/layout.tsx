// 📂 文件路径: src/app/(main)/layout.tsx
import DockManager from "@/components/DockManager";
import { Toaster } from '@/components/ui/toaster';

export default function MainAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <Toaster />
      <DockManager />
    </>
  );
}