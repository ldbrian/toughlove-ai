// src/store/useNotificationStore.ts
import { create } from 'zustand';

export interface NotificationItem {
  id: string;
  avatar: string; // e.g., '/avatars/rin_hero.jpg'
  type: 'unreplied' | 'unread' | 'system';
  sender: string; // e.g., 'Rin'
  text: string;
  link: string;
  timestamp: number;
}

interface NotificationState {
  queue: NotificationItem[];
  addNotification: (item: Omit<NotificationItem, 'id' | 'timestamp'>) => void;
  markAsRead: (id: string) => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  // 初始状态：我们可以先放两个模拟的“真实”数据，后续这里可以默认为空，由 API 填充
  queue: [],

  addNotification: (item) => set((state) => ({
    queue: [...state.queue, { ...item, id: crypto.randomUUID(), timestamp: Date.now() }]
  })),

  markAsRead: (id) => set((state) => ({
    queue: state.queue.filter((n) => n.id !== id)
  })),

  clearAll: () => set({ queue: [] }),
}));