import { Message } from 'ai';
import { PersonaType } from './constants';

const STORAGE_PREFIX = 'toughlove_memory_';
const VOICE_IDS_PREFIX = 'toughlove_voice_ids_'; // 🔥 新增：语音记录 Key

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

// 🔥 新增：获取已生成的语音消息 ID 列表
export function getVoiceIds(persona: PersonaType): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(`${VOICE_IDS_PREFIX}${persona}`);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

// 🔥 新增：保存语音消息 ID 列表
export function saveVoiceIds(persona: PersonaType, ids: string[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${VOICE_IDS_PREFIX}${persona}`, JSON.stringify(ids));
  } catch (e) {
    console.error("Voice IDs Save Failed:", e);
  }
}

// 清除记忆 (同步清除语音记录)
export function clearMemory(persona: PersonaType) {
  localStorage.removeItem(`${STORAGE_PREFIX}${persona}`);
  localStorage.removeItem(`${VOICE_IDS_PREFIX}${persona}`);
}