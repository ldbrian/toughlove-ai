'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useCapsuleStore } from '@/store/useCapsuleStore';
import { X, ChevronRight, Terminal, Zap, Heart, AlertTriangle } from 'lucide-react';

export function GlobalCapsule() {
  const { isVisible, message, type, actionLabel, onAction, dismiss } = useCapsuleStore();

  // 根据类型配置视觉风格
  const getConfig = () => {
    switch (type) {
      case 'error': return { icon: <X size={14} />, color: 'bg-red-500', text: 'text-red-100', border: 'border-red-500/30' };
      case 'success': return { icon: <Heart size={14} />, color: 'bg-green-500', text: 'text-green-100', border: 'border-green-500/30' };
      case 'ash': return { icon: <Terminal size={14} />, color: 'bg-cyan-600', text: 'text-cyan-100', border: 'border-cyan-500/30' };
      case 'sol': return { icon: <Zap size={14} />, color: 'bg-orange-500', text: 'text-orange-100', border: 'border-orange-500/30' };
      default: return { icon: <Terminal size={14} />, color: 'bg-zinc-800', text: 'text-zinc-200', border: 'border-zinc-700/50' };
    }
  };

  const config = getConfig();

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed top-6 z-[100] w-full flex justify-center pointer-events-none">
          <motion.div
            initial={{ y: -50, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -50, opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className={`pointer-events-auto flex items-center gap-3 pl-3 pr-2 py-2 rounded-full backdrop-blur-md shadow-2xl border ${config.border} bg-[#0a0a0a]/90 max-w-[90vw] md:max-w-md`}
          >
            {/* Icon Badge */}
            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${config.color} text-white shadow-lg`}>
              {config.icon}
            </div>

            {/* Message */}
            <span className={`text-xs font-medium truncate max-w-[200px] md:max-w-[260px] ${config.text}`}>
              {message}
            </span>

            {/* Action Button (Optional) */}
            {actionLabel && onAction && (
              <button
                onClick={() => { onAction(); dismiss(); }}
                className="flex items-center gap-1 px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-[10px] font-bold text-white transition-colors ml-1"
              >
                {actionLabel}
                <ChevronRight size={10} />
              </button>
            )}

            {/* Dismiss Button */}
            {!actionLabel && (
              <button 
                onClick={dismiss}
                className="p-1 rounded-full hover:bg-white/10 text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <X size={12} />
              </button>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}