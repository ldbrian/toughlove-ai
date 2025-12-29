// src/types/index.ts

// 1. 基础与语言
export type LangType = 'zh' | 'tw' | 'en' | 'ja' | 'ko' | 'fr' | 'de' | 'es' | 'ru';

// ⚠️ 注意：这里我保留了你原有的定义。
// 如果你的 SleepSignalModal 用的是小写 'ash'，而这里是大写 'Ash'，
// 你可能需要把这里改成小写，或者在组件里做映射。
// 目前先保持兼容：
export type PersonaId = 'Ash' | 'Rin' | 'Sol' | 'Vee' | 'Echo' | 'System' | 'ash' | 'rin' | 'sol' | 'echo'; 

export type MoodType = 'low' | 'anxious' | 'neutral' | 'angry' | 'high';

export interface MultiLangText {
  zh: string;
  en: string;
  [key: string]: string;
}

// 确保这个导出了
export type PersonaType = PersonaId;

// 🔥🔥🔥 核心修复：补全 MemoModalProps 缺少的字段 🔥🔥🔥
export interface MemoModalProps {
  show: boolean;
  onClose: () => void;
  // 新增字段
  lang: LangType;
  partnerId: PersonaId;
  initialNote?: string; 
  onReward?: () => void;
  handleSend?: (note: string) => Promise<void> | void;
}

// 2. 聊天核心
export interface ChatMessage {
  id: string; 
  role: 'user' | 'assistant' | 'system';
  content: string;
  isHidden?: boolean; 
  timestamp?: number;
}

// 3. 角色配置
export interface PersonaConfig {
  id: string;
  name: string;
  description: string;
  gender: 'Male' | 'Female' | 'Non-binary';
  avatar: string;
  color: string;
  wallpaper: string;
  ip: {
    title: string;
    likes: string[];
    dislikes: string[];
    bonds: Record<string, string>;
  };
  prompt: string;
  envImpact: (env: any) => number;
}

// 4. 物品
export type RarityType = 'common' | 'rare' | 'epic' | 'legendary';

export interface LootItem {
  id: string;
  name: MultiLangText;
  description: MultiLangText;
  price: number;
  rarity: RarityType;
  type: string;
  iconSvg?: string;
  sourcePersona?: string;
}

// 5. 统计
export interface StatsType {
    bond: number;
    chatCount: number;
    eventCount: number;
}

// 6. 通用 Modal Props
export interface BaseModalProps {
  show: boolean;
  onClose: () => void;
  lang: LangType;
}