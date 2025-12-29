import { ScriptMetadata, ScriptScene } from '@/types/script';
import { LootItem } from '@/types/index';

export const DEMO_SCRIPT_META: ScriptMetadata = {
  id: 'blackout_protocol',
  title: { zh: '至暗时刻：市政厅危机', en: 'Dark Hour: City Hall Crisis' },
  intro: { 
    zh: '全城大停电。气温零下40度。你坐在市长席上，面前是三位争吵不休的部门负责人。你的每一个签名，都决定着谁能活过今晚。',
    en: 'City-wide blackout. -40°C. You are the Mayor. Three department heads are arguing. Your signature decides who survives the night.'
  },
  coverImage: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?q=80&w=1000&auto=format&fit=crop', 
  difficulty: 'Hard',
  
  // 🔥 核心修改：以“剧本格式”为绝对核心，禁止小说体
  dmPersona: `
  [SYSTEM ROLE]
  You are a SCRIPT GENERATOR for a visual novel.
  Your ONLY job is to output dialogue lines with specific tags.
  
  [CAST]
  - [SOL] (Security Chief): Wants to protect banks/VIPs. Cold.
  - [VEE] (Health Director): Wants to save patients. Emotional.
  - [RIN] (Union Rep): Wants to protect the grid. Rude.
  - [SYSTEM]: Narrator.

  [ABSOLUTE OUTPUT RULES]
  1. **FORBIDDEN**: Do NOT start a line with "(" or descriptions like "*looks at you*".
  2. **REQUIRED**: EVERY single line MUST start with a tag.
  3. **FORMAT**:
     [SOL]: Text here...
     [VEE]: Text here...
     [SYSTEM]: Text here...
  
  [EXAMPLE - CORRECT]
  [SOL]: Mayor, the banks are vulnerable.
  [VEE]: Forget the banks! The hospital is dying!
  
  [EXAMPLE - WRONG]
  (Sol looks at the map) The banks are vulnerable. -> WRONG! No tag!
  `
};

export const DEMO_ITEMS: Record<string, LootItem> = {
  'nuclear_key': { id: 'nuclear_key', name: { zh: '执行令：强制过载', en: 'Executive Order: Overload' }, description: { zh: '无视工会警告，强制重启。', en: 'Ignore warnings.' }, rarity: 'legendary', type: 'mission_item', price: 0 }
};

export const DEMO_SCENES: Record<string, ScriptScene> = {
  'start': {
    id: 'start',
    name: { zh: '紧急作战会议室', en: 'Emergency Council Room' },
    description: { zh: '备用电力只剩 30%。三份紧急预案摆在你面前。', en: 'Power 30%. Three plans on the table.' },
    actions: [
      { 
        label: { zh: '听取：安全局方案 (SOL)', en: 'Listen: Security (Sol)' }, 
        type: 'speak', 
        // 🔥 注入强指令：强制 AI 扮演 SOL 发言
        payload: '[INSTRUCTION]: User clicks "Ask Sol". OUTPUT A RESPONSE STARTING WITH "[SOL]:" IMMEDIATELY. Sol demands power for the financial district.' 
      },
      { 
        label: { zh: '听取：卫生局方案 (VEE)', en: 'Listen: Health (Vee)' }, 
        type: 'speak', 
        // 🔥 注入强指令：强制 AI 扮演 VEE 发言
        payload: '[INSTRUCTION]: User clicks "Ask Vee". OUTPUT A RESPONSE STARTING WITH "[VEE]:" IMMEDIATELY. Vee begs for power for the hospitals.' 
      },
      { 
        label: { zh: '质询：工会方案 (RIN)', en: 'Inquiry: Grid Status (Rin)' }, 
        type: 'speak', 
        // 🔥 注入强指令：强制 AI 扮演 RIN 发言
        payload: '[INSTRUCTION]: User clicks "Ask Rin". OUTPUT A RESPONSE STARTING WITH "[RIN]:" IMMEDIATELY. Rin warns about grid overload.' 
      }
    ]
  }
};