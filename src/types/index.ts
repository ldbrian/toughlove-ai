// src/types/index.ts
// ✅ 这个文件只包含类型定义，不包含逻辑代码，绝对不会导致运行时 Bug。

// ==========================================
// 1. 基础类型
// ==========================================
// 1. 扩展支持的语言代码
// zh: 简体, tw: 繁体, en: 英语, ja: 日语, ko: 韩语, fr: 法语, de: 德语, es: 西班牙语, ru: 俄语
export type LangType = 'zh' | 'tw' | 'en' | 'ja' | 'ko' | 'fr' | 'de' | 'es' | 'ru';
export type PersonaId = 'Ash' | 'Rin' | 'Sol' | 'Vee' | 'Echo' | 'System';

export interface MultiLangText {
  zh: string;
  en: string;
  [key: string]: string; // ✅ 允许包含 tw, ja, ko 等其他键，也允许缺失
}

// ==========================================
// 2. 物品与背包 (Loot & Inventory)
// ==========================================
export type RarityType = 'common' | 'rare' | 'epic' | 'legendary';

export interface LootItem {
  id: string;
  name: MultiLangText;        // ✅ 替换原来的 { zh: string; en: string }
  description: MultiLangText; // ✅ 替换原来的 { zh: string; en: string }
  price: number;
  rarity: RarityType;
  type: string; // 'consumable' | 'collectible' 等
  iconSvg?: string;
  sourcePersona?: string; // 允许 string 以兼容旧数据，理想情况是 PersonaId
  trigger_context?: string;
}

// ==========================================
// 3. 通用组件 Props (Modals)
// ==========================================

// 所有的 Modal 都应该至少包含这些
export interface BaseModalProps {
  show: boolean;
  onClose: () => void;
  lang: LangType;
}

// 专注模式 (Focus)
export interface FocusModalProps extends BaseModalProps {
  partnerId: string;
  onReward?: (amount: number) => void;
  handleSend: (text: string, isHidden?: boolean) => void;
}

// 便利贴 (Memo)
export interface MemoModalProps extends BaseModalProps {
  partnerId: string;
  onReward?: (amount: number) => void;
  handleSend: (text: string, isHidden?: boolean) => void;
}

// 背包 (Inventory)
export interface InventoryModalProps extends BaseModalProps {
  partnerId: string;
  // 这里我们定义标准：组件内部只负责展示 LootItem 对象
  inventory: LootItem[]; 
  // 组件修改后，向外传递修改后的列表
  setInventory: (items: LootItem[]) => void;
  handleSend: (text: string, isHidden?: boolean) => void;
}

// ✅ 新增：补充遗漏的心情类型定义
export type MoodType = 'low' | 'anxious' | 'neutral' | 'angry' | 'high';

// ✅ 新增：为了兼容 Console.tsx，导出 PersonaType (可以直接复用 PersonaId)
export type PersonaType = PersonaId;

// ✅ 新增：角色配置标准接口 (Persona Configuration Standard)
export interface PersonaConfig {
  id: string;
  name: string;
  gender: 'Male' | 'Female' | 'Non-binary'; // 性别约束
  avatar: string;
  color: string;
  wallpaper: string;
  
  // IP 核心设定
  ip: {
    title: string;
    likes: string[];
    dislikes: string[];
    bonds: Record<string, string>; // 例如 { Rin: "Rivalry" }
  };

  // LLM 提示词 (最重要的部分)
  prompt: string;

  // 环境感知函数
  envImpact: (env: any) => number;
}