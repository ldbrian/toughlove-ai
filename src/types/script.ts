// src/types/script.ts
import { MultiLangText, LootItem, LangType } from './index';

// 场景节点：剧本杀的每一个“房间”或“阶段”
export interface ScriptScene {
  id: string;
  name: MultiLangText;
  description: MultiLangText; // 环境描写，会注入给 AI
  backgroundImage?: string;   // 沉浸式背景
  
  // 只有在这个场景能触发的特殊行动
  actions?: {
    label: MultiLangText;
    type: 'search' | 'move' | 'speak';
    targetId?: string; // 如果是 move，填目标场景 ID
    payload?: string;  // 如果是 speak，填强制发送的文本
  }[];

  // 隐藏在这个场景的线索 ID (对应 LootItem)
  hiddenLoot?: string[];
}

// 剧本元数据
export interface ScriptMetadata {
  id: string;
  title: MultiLangText;
  intro: MultiLangText; // 开场白
  coverImage: string;
  difficulty: 'Easy' | 'Hard' | 'Nightmare';
  
  // DM (主持人) 的人设指令
  dmPersona: string; 
}

// 运行时状态 (Save Data)
export interface GameState {
  currentSceneId: string;
  history: { role: 'user' | 'assistant' | 'system'; content: string }[];
  inventory: LootItem[]; // 玩家搜证获得的物品
  flags: Record<string, boolean>; // 逻辑开关，如 has_met_boss: true
  isGameOver: boolean;
}