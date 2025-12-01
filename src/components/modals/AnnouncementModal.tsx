// src/components/modals/AnnouncementModal.tsx
import { useState } from 'react';
import { ShieldAlert, Terminal, ChevronRight } from 'lucide-react';

interface AnnouncementModalProps {
  show: boolean;
  onClose: () => void;
}

export const AnnouncementModal = ({ show, onClose }: AnnouncementModalProps) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/98 backdrop-blur-xl p-6 animate-[fadeIn_0.3s_ease-out]">
      <div className="w-full max-w-sm border border-red-900/50 bg-[#0a0a0a] rounded-xl p-8 shadow-[0_0_50px_rgba(220,38,38,0.2)] relative overflow-hidden">
        
        {/* 背景装饰：扫描线效果 */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10 pointer-events-none"></div>
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-600 to-transparent opacity-50"></div>

        <div className="relative z-10 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3 text-red-500 mb-8">
            <ShieldAlert size={24} className="animate-pulse" />
            <span className="font-mono font-bold tracking-[0.2em] text-xs uppercase">SYSTEM_OVERRIDE</span>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-black text-white tracking-wide leading-tight">
            你的现实<br />
            <span className="text-red-500">已被重构</span>
          </h2>

          {/* Body Content */}
          <div className="space-y-4 text-sm text-gray-400 font-mono leading-relaxed border-l-2 border-red-900/30 pl-4 my-6">
            <p>
              <strong className="text-gray-200">[Fate]:</strong> 命运不再是随机数。每日晨报协议已生效。
            </p>
            <p>
              <strong className="text-gray-200">[Price]:</strong> 情绪有了标价。想让 Ash 闭嘴？准备好你的 Rin。
            </p>
            <p>
              <strong className="text-gray-200">[Void]:</strong> v2.3.0 视觉层已覆盖。
            </p>
          </div>

          <p className="text-xs text-red-400/60 italic">
            "敢进来看看你的结局吗？"
          </p>

          {/* Action Button */}
          <button 
            onClick={onClose}
            className="w-full group relative py-4 bg-red-600 hover:bg-red-700 text-white font-bold text-sm tracking-widest uppercase transition-all overflow-hidden clip-path-polygon"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            <span className="relative flex items-center justify-center gap-2">
               直面命运 (ENTER) <ChevronRight size={14} />
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};