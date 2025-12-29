// src/store/useCapsuleStore.ts
import { create } from 'zustand';

type CapsuleType = 'system' | 'error' | 'success' | 'warning' | 'ash' | 'rin' | 'sol' | 'vee';

interface CapsuleState {
  isVisible: boolean;
  message: string;
  type: CapsuleType;
  actionLabel?: string;
  onAction?: () => void;
  
  // Actions
  trigger: (msg: string, type?: CapsuleType, actionLabel?: string, onAction?: () => void) => void;
  dismiss: () => void;
}

export const useCapsuleStore = create<CapsuleState>((set) => ({
  isVisible: false,
  message: '',
  type: 'system',
  actionLabel: undefined,
  onAction: undefined,

  trigger: (msg, type = 'system', actionLabel, onAction) => {
    // 1. 立即显示
    set({ isVisible: true, message: msg, type, actionLabel, onAction });

    // 2. 5秒后自动消失 (除非用户交互)
    setTimeout(() => {
      set((state) => {
        // 防止覆盖了新的消息
        if (state.message === msg) {
          return { isVisible: false };
        }
        return {};
      });
    }, 5000);
  },

  dismiss: () => set({ isVisible: false }),
}));