// src/lib/i18n/dictionaries.ts
import { LangType } from '@/types';

// ✅ 1. 导出 baseEn
export const baseEn = {
  common: {
    confirm: 'Confirm',
    cancel: 'Cancel',
    save: 'Save',
    send: 'Send',
    loading: 'Loading...',
    later: 'Later',
    copy: 'Copy',
    unknown: 'Unknown',
  },
  menu: {
    title: 'MENU',
    editName: 'Edit Name',
    lang: 'Language',
    install: 'Install App',
    shop: 'Black Market',
    feedback: 'Feedback',
    reset: 'Reset Data',
    resetConfirm: '⚠️ WARNING: This will wipe ALL chat history. Proceed?',
    donate: 'Buy Coffee',
  },
  // 🔥 新增：首页专用字典
  home: {
    system: 'SYSTEM',
    glitch: 'GLITCH',
    community: 'COMMUNITY',
    ashLogic: "ASH'S LOGIC",
    reveal: 'REVEALED',
    tarot: 'TAROT',
    draw: 'Draw Daily Card',
    // --- 新增部分 Start ---
    focus: 'FOCUS MODE',
    solProtocol: "SOL'S PROTOCOL",
    simulation: 'THE SIMULATION',
    locked: 'LOCKED',
    shardsCollected: 'Shards Collected',
    accessGranted: 'ACCESS GRANTED',
    ticketReady: 'Ticket Ready',
    offline: 'OFFLINE',
    maintenance: 'System Maintenance',
    systemOffline: 'System Offline',
    connecting: 'Connecting...',
    retry: 'RETRY',
    dailyFate: 'Daily Fate',
    sleepToast: 'Signal encrypting... Coming soon',
    treeHollow: 'TREE HOLLOW',
    sleepSignal: 'SLEEP SIGNAL',
    memo: 'MEMO',
    echoListening: 'Echo is listening...',
    healingFreq: '432Hz Healing',
    fate: 'FATE',
    // --- 新增部分 End ---
  },
  modal: {
    focus: {
      title: 'FOCUS PROTOCOL',
      desc: 'Laziness detected. Sol suggests initiating Focus Mode immediately.',
      start: 'ENGAGE (25m)',
    },
    lang: {
      title: 'SELECT LANGUAGE',
    },
    name: {
      title: 'Edit Name',
      placeholder: 'CODENAME',
    },
    donate: {
      title: 'Buy Me a Coffee',
      desc: 'Development is hard. Your support keeps the servers alive.',
      bribe: (name: string) => `Bribe ${name} (Virtual)`,
      external: 'Buymeacoffee.com',
    },
    feedback: {
      title: 'Feedback',
      placeholder: 'Found a bug? Or just want to rant?',
      sent: 'Feedback sent',
    },
    install: {
      title: 'Install App',
      desc: 'Safari blocks auto-install. Do it manually:',
      step1: "1. Tap 'Share' button",
      step2: "2. Select 'Add to Home Screen'",
    },
  },
  status: {
    online: 'ONLINE',
    typing: 'Typing...',
    error: 'Signal Lost',
    init: 'Neural link established.',
  },
  nav: {
    resonance: 'RESONANCE',
    mirror: 'MIRROR',
    shop: 'SHOP',
    terminal: 'TERMINAL',
  },
  terminal: {
    assets: 'TOTAL ASSETS',
    inventory: 'INVENTORY',
    psyche: 'PSYCH_DATA',
    id_linked: 'LINKED',
    id_guest: 'GUEST',
    dominant: 'DOMINANT ARCHETYPE',
    metrics: 'PSYCHOMETRICS',
    dim_reality: 'REALITY',
    dim_chaos: 'CHAOS',
    dim_empathy: 'EMPATHY',
    dim_ego: 'EGO',
    security: 'SECURITY',
    device: 'DEVICE',
    online: 'ONLINE',
    unknown_item: 'Unknown Item',
    daily_tarot: 'Daily Tarot',
  },
  inventory: {
    title: 'INVENTORY',
    empty_state: 'Empty Inventory',
    empty_slot: 'EMPTY SLOT',
    owned: 'OWNED',
    btn_use: 'USE ITEM',
    btn_using: 'PROCESSING...',
    select_tip: 'SELECT AN ITEM TO VIEW DETAILS',
    rarity: {
      common: 'COMMON',
      rare: 'RARE',
      epic: 'EPIC',
      legendary: 'LEGENDARY',
    },
    msg_success_mood: 'Mood',
    msg_success_fav: 'Sync',
    system_prefix: '(System)',
  },
  // 🔥 新增：角色展示文案 (UI Display Only)
  personas: {
    ash: {
      role: 'The Rational Tyrant',
      desc: 'High-functioning perfectionist. Hates inefficiency.',
    },
    rin: {
      role: 'The Mystic Streamer',
      desc: 'Believes in fate and connection. Loves rain.',
    },
    vee: {
      role: 'The Rogue Glitch',
      desc: 'Chaotic hacker. Loves memes and breaking rules.',
    },
    sol: {
      role: 'The Guardian',
      desc: 'Protective big brother. Actions speak louder than words.',
    },
    echo: {
      role: 'The Observer',
      desc: 'Quiet keeper of memories. Observes the truth.',
    },
  },

  // 🔥 新增：动态开场白模板
  openings: {
    default: [
      "You're here? Signal established.",
      "Systems nominal. What do you need?",
      "I was just analyzing some data.",
    ],
    weather: {
      rain: "It's raining data out there... stay dry.",
      sunny: "Systems are overheating today.",
    },
    herofeed: "I see you're interested in '{topic}'. Let's discuss it.",
    script_murder: "So, about that case result... '{result}'. Interesting outcome.",
  },
  chat_ui: {
    mood: 'MOOD',
    sync: 'SYNC',
    online: 'ONLINE',
    placeholder: 'Type a message...',
    thinking: 'THINKING...',
  }
  // 🔥🔥🔥 新增板块 End 🔥🔥🔥
};

export type Dictionary = typeof baseEn;

// ✅ 2. 导出 zh (简体中文)
export const zh: Dictionary = {
  common: { confirm: '确认', cancel: '取消', save: '保存', send: '发送', loading: '加载中...', later: '稍后再说', copy: '复制', unknown: '未知' },
  menu: { ...baseEn.menu, title: '菜单', editName: '修改昵称', lang: '切换语言', install: '安装应用', shop: '黑市商店', feedback: '反馈 Bug', reset: '重置数据', resetConfirm: '⚠️ 警告：这将清除所有聊天记录...', donate: '请喝咖啡' },
  home: {
    system: '系统广播',
    glitch: '数据异常',
    community: '社区回响',
    ashLogic: 'ASH 的逻辑',
    reveal: '已揭示',
    tarot: '每日塔罗',
    draw: '抽取今日运势',
    focus: '专注模式',
    solProtocol: 'SOL 的协议',
    simulation: '模拟训练',
    locked: '未解锁',
    shardsCollected: '碎片已收集',
    accessGranted: '准许进入',
    ticketReady: '门票已就绪',
    offline: '系统离线',
    maintenance: '系统维护中',
    systemOffline: '系统离线',
    connecting: '神经链路连接中...',
    retry: '重连',
    dailyFate: '今日运势', // 之前写死了 Daily Fate
    
    treeHollow: '树洞',   // Tree Hollow
    sleepSignal: '助眠信号', // Sleep Signal
    memo: '便签',         // Memo
    sleepToast: '助眠频段加密中... 敬请期待',
    echoListening: 'Echo 正在倾听...',
    healingFreq: '432Hz 疗愈频率',
    fate: '命运',
  },
  // ... (保留原有的 modal, status, nav, terminal) ...
  modal: { ...baseEn.modal, /* 请保持原有的中文翻译，这里省略以节省篇幅 */ },
  status: { online: '在线', typing: '对方正在输入...', error: '信号中断', init: '神经连接已建立。' },
  nav: { resonance: '共鸣', mirror: '镜面', shop: '商店', terminal: '终端' },
  terminal: {
     // ... 保持原有内容 ...
     assets: '总资产',
     inventory: '背包物品',
     psyche: '精神档案',
     id_linked: '已连接',
     id_guest: '访客模式',
     dominant: '主导人格',
     metrics: '心理维度监测',
     dim_reality: '现实感 (REALITY)',
     dim_chaos: '混乱度 (CHAOS)',
     dim_empathy: '共情力 (EMPATHY)',
     dim_ego: '自我意识 (EGO)',
     security: '安全等级',
     device: '设备状态',
     online: '在线',
     unknown_item: '未知物品',
     daily_tarot: '每日塔罗'
  },

  // 🔥🔥🔥 新增中文翻译 Start 🔥🔥🔥
  inventory: {
    title: '物品背包',
    empty_state: '暂无物品',
    empty_slot: '空槽位',
    owned: '持有数量',
    btn_use: '使用物品',
    btn_using: '正在使用...',
    select_tip: '请选择一个物品查看详情',
    rarity: {
      common: '普通',
      rare: '稀有',
      epic: '史诗',
      legendary: '传说',
    },
    msg_success_mood: '心情',
    msg_success_fav: '好感',
    system_prefix: '(系统)',
  },
  personas: {
    ash: {
      role: '理性暴君',
      desc: '高功能的完美主义者，讨厌低效率和借口。',
    },
    rin: {
      role: '神秘主播',
      desc: '相信命运与连接的神秘少女，喜欢雨天。',
    },
    vee: {
      role: '赛博黑客',
      desc: '混乱中立的捣蛋鬼，喜欢梗和打破规则。',
    },
    sol: {
      role: '守护者',
      desc: '充满行动力的大哥，保护欲极强。',
    },
    echo: {
      role: '观察者',
      desc: '沉默的记录员，在这个喧嚣世界中寻找真相。',
    },
  },

  // 🔥 新增：动态开场白模板
  openings: {
    default: [
      "你来了？神经信号已建立。",
      "系统运转正常。找我有什么事？",
      "正好，我正在分析之前的几组数据。",
      "看起来你今天精神不错。"
    ],
    weather: {
      rain: "外面数据流像雨一样倾泻... 记得保持干燥。",
      sunny: "今天的核心温度有点高，适合高负荷运算。",
    },
    // {topic} 会被替换为具体话题
    herofeed: "我也在关注“{topic}”这个话题。你对这件事怎么看？", 
    // {result} 会被替换为游戏结果
    script_murder: "关于刚才那个案件... 听说结局是“{result}”？这倒是出乎意料。",
  },
  chat_ui: {
    mood: '心情',
    sync: '好感',
    online: '在线',
    placeholder: '发送消息...',
    thinking: '思考中...',
  }
  // 🔥🔥🔥 新增中文翻译 End 🔥🔥🔥
};

// 繁体中文
const tw: Dictionary = {
  ...zh,
  common: { ...zh.common, confirm: '確認', cancel: '取消', save: '保存', send: '發送' },
  menu: { ...zh.menu, title: '選單', shop: '黑市商店', feedback: '回報 Bug' },
  home: { ...zh.home, reveal: '已揭示', draw: '抽取今日運勢' }
};

// 日语
const ja: Dictionary = {
  ...baseEn,
  common: { confirm: '確認', cancel: 'キャンセル', save: '保存', send: '送信', loading: '読込中...', later: 'あとで', copy: 'コピー', unknown: '不明' },
  menu: { ...baseEn.menu, title: 'メニュー', shop: '闇市', lang: '言語設定' },
  status: { ...baseEn.status, online: 'オンライン', typing: '入力中...', init: 'ニューラルリンク確立。' }
};

// ✅ 3. 导出 en
export const en: Dictionary = baseEn;
const ko = { ...baseEn };
const fr = { ...baseEn };
const de = { ...baseEn };
const es = { ...baseEn };
const ru = { ...baseEn };

const dictionaries: Record<LangType, Dictionary> = { zh, tw, en, ja, ko, fr, de, es, ru };

export const getDict = (lang: LangType): Dictionary => {
  return dictionaries[lang] || baseEn;
};

export const getContentText = (contentObj: any, lang: LangType): string => {
  if (!contentObj) return '';
  if (contentObj[lang]) return contentObj[lang];
  if (lang === 'tw' && contentObj['zh']) return contentObj['zh'];
  if (contentObj['en']) return contentObj['en'];
  if (contentObj['zh']) return contentObj['zh'];
  return Object.values(contentObj)[0] as string || '';
};