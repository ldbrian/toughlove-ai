import { Message } from 'ai'; // 或者定义简单的 type Message = { role: string, content: string }

const STORAGE_PREFIX = 'toughlove_chat_';

export const getMemory = (personaId: string): any[] => {
  if (typeof window === 'undefined') return [];
  const key = `${STORAGE_PREFIX}${personaId.toLowerCase()}`;
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

export const saveMemory = (personaId: string, messages: any[]) => {
  if (typeof window === 'undefined') return;
  const key = `${STORAGE_PREFIX}${personaId.toLowerCase()}`;
  localStorage.setItem(key, JSON.stringify(messages));
};

export const getLastMessage = (personaId: string): string | null => {
  const history = getMemory(personaId);
  if (history.length === 0) return null;
  const lastMsg = history[history.length - 1];
  return lastMsg.role === 'assistant' ? lastMsg.content : null;
};