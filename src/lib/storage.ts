import { Message } from 'ai';
import { PersonaType } from './constants';

const STORAGE_PREFIX = 'toughlove_memory_';

// 获取某个人格的聊天记录
export function getMemory(persona: PersonaType): Message[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const data = localStorage.getItem(`${STORAGE_PREFIX}${persona}`);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Memory Load Failed:", e);
    return [];
  }
}

// 保存某个人格的聊天记录
export function saveMemory(persona: PersonaType, messages: Message[]) {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${persona}`, JSON.stringify(messages));
  } catch (e) {
    console.error("Memory Save Failed:", e);
  }
}

// 清除记忆 (可选，用于调试或重置)
export function clearMemory(persona: PersonaType) {
  localStorage.removeItem(`${STORAGE_PREFIX}${persona}`);
}
