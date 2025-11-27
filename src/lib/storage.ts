import { Message } from 'ai';
import { PersonaType } from './constants';

const STORAGE_PREFIX = 'toughlove_memory_';
const VOICE_IDS_PREFIX = 'toughlove_voice_ids_'; // 🔥 新增 Key

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

export function saveMemory(persona: PersonaType, messages: Message[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${persona}`, JSON.stringify(messages));
  } catch (e) {
    console.error("Memory Save Failed:", e);
  }
}

// 🔥 新增：语音ID持久化
export function getVoiceIds(persona: PersonaType): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(`${VOICE_IDS_PREFIX}${persona}`);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

export function saveVoiceIds(persona: PersonaType, ids: string[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${VOICE_IDS_PREFIX}${persona}`, JSON.stringify(ids));
  } catch (e) {
    console.error("Voice IDs Save Failed:", e);
  }
}

export function clearMemory(persona: PersonaType) {
  localStorage.removeItem(`${STORAGE_PREFIX}${persona}`);
  localStorage.removeItem(`${VOICE_IDS_PREFIX}${persona}`);
}