

import { Wallet, Sparkles } from "lucide-react";

interface ShopButtonProps {
  onClick: () => void;
  balance?: number; // 可选：传入当前余额显示
  variant?: "sidebar" | "header"; // 支持两种样式
}

export default function ShopButton({ onClick, balance, variant = "sidebar" }: ShopButtonProps) {
  
  if (variant === "header") {
    return (
      <button
        onClick={onClick}
        className="group relative flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-1.5 text-xs font-medium text-purple-200 hover:bg-purple-500/20 hover:border-purple-500/50 transition-all"
      >
        <Sparkles size={14} className="text-purple-400 group-hover:animate-spin-slow" />
        <span>充值中心</span>
        {balance !== undefined && (
          <span className="ml-1 border-l border-white/10 pl-2 text-white/60">
            {balance} Rin
          </span>
        )}
      </button>
    );
  }

  // Sidebar 样式 (默认)
  return (
    <button
      onClick={onClick}
      className="group w-full relative flex items-center gap-3 rounded-lg px-3 py-3 text-sm text-gray-400 hover:bg-white/5 hover:text-white transition-all"
    >
      <div className="relative">
        <Wallet size={18} className="group-hover:text-purple-400 transition-colors" />
        {/* 动态小红点/呼吸灯，提示有促销 */}
        <span className="absolute -right-0.5 -top-0.5 flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-purple-400 opacity-75"></span>
          <span className="relative inline-flex h-2 w-2 rounded-full bg-purple-500"></span>
        </span>
      </div>
      
      <div className="flex flex-1 items-center justify-between">
        <span className="font-medium">钱包 / 充值</span>
        {balance !== undefined && (
           <span className="text-xs font-mono text-purple-400/80">{balance} R</span>
        )}
      </div>
      
      {/* 悬停时的光效背景 (可选) */}
      <div className="absolute inset-0 -z-10 rounded-lg bg-gradient-to-r from-purple-500/0 via-purple-500/5 to-purple-500/0 opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  );
}