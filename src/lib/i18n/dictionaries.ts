// src/lib/i18n/dictionaries.ts
import { LangType } from '@/types';

// 定义基础字典类型（以英文为准）
const baseEn = {
  common: {
    confirm: 'Confirm',
    cancel: 'Cancel',
    save: 'Save',
    send: 'Send',
    loading: 'Loading...',
    later: 'Later',
    copy: 'Copy',
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
    resonance: 'RESONANCE', // 共鸣
    mirror: 'MIRROR',       // 镜面
    shop: 'SHOP',         // 商店
    terminal: 'TERMINAL',   // 终端
  },
  // ✅ 新增终端页面字典
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
    daily_tarot: 'Daily Tarot'
  }
};

export type Dictionary = typeof baseEn;

// 简体中文
const zh: Dictionary = {
  common: { confirm: '确认', cancel: '取消', save: '保存', send: '发送', loading: '加载中...', later: '稍后再说', copy: '复制' },
  menu: { title: '菜单', editName: '修改昵称', lang: '切换语言', install: '安装应用', shop: '黑市商店', feedback: '反馈 Bug', reset: '重置数据', resetConfirm: '⚠️ 警告：这将清除所有聊天记录、背包和关系数据，一切归零。确定执行吗？', donate: '请喝咖啡' },
  modal: {
    focus: { title: '专注协议', desc: '检测到你在逃避困难任务。Sol 建议立即开启专注模式。', start: '开启专注 (25m)' },
    lang: { title: '选择语言 / SELECT LANGUAGE' },
    name: { title: '修改昵称', placeholder: '请输入代号' },
    donate: { title: '请我喝咖啡', desc: '开发不易。你的支持能让服务器再苟延残喘几天。', bribe: (name) => `贿赂 ${name} (虚拟)`, external: 'Buymeacoffee.com' },
    feedback: { title: '反馈 / 吐槽', placeholder: '发现 Bug？或者单纯想骂产品经理？', sent: '已收到反馈' },
    install: { title: '安装到主屏幕', desc: 'Safari 限制了自动安装。请手动添加：', step1: '1. 点击底部「分享」按钮', step2: '2. 选择「添加到主屏幕」' }
  },
  status: { online: '在线', typing: '对方正在输入...', error: '信号中断', init: '神经连接已建立。' },nav: {
    resonance: '共鸣',
    mirror: '镜面',
    shop: '商店',
    terminal: '终端',
  },terminal: {
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
  }
};

// 繁体中文 (自动回退示例，你可以后续慢慢填)
const tw: Dictionary = {
  ...zh, // 继承简体
  common: { ...zh.common, confirm: '確認', cancel: '取消', save: '保存', send: '發送' },
  menu: { ...zh.menu, title: '選單', shop: '黑市商店', feedback: '回報 Bug' },
  // ... 其他部分如未覆盖，则使用 zh 的值
};

// 日语 (部分翻译示例)
const ja: Dictionary = {
  ...baseEn,
  common: { confirm: '確認', cancel: 'キャンセル', save: '保存', send: '送信', loading: '読込中...', later: 'あとで', copy: 'コピー' },
  menu: { ...baseEn.menu, title: 'メニュー', shop: '闇市', lang: '言語設定' },
  status: { ...baseEn.status, online: 'オンライン', typing: '入力中...', init: 'ニューラルリンク確立。' }
};

// 其他语言 (韩语、法语等) 暂时全部回退到英文 (baseEn)
// 这样你可以先把 key 建好，应用不会崩，以后慢慢改
const en: Dictionary = baseEn;
const ko = { ...baseEn };
const fr = { ...baseEn };
const de = { ...baseEn };
const es = { ...baseEn };
const ru = { ...baseEn };

// 字典映射表
const dictionaries: Record<LangType, Dictionary> = { zh, tw, en, ja, ko, fr, de, es, ru };

// 核心工具函数：获取字典 (带 Fallback)
export const getDict = (lang: LangType): Dictionary => {
  return dictionaries[lang] || baseEn;
};

// 🔥 极其重要的辅助函数：获取数据文本 (解决 LootItem 可能没有法语翻译的问题)
export const getContentText = (contentObj: any, lang: LangType): string => {
  if (!contentObj) return '';
  // 1. 尝试获取目标语言
  if (contentObj[lang]) return contentObj[lang];
  // 2. 如果是繁体，尝试回退到简体
  if (lang === 'tw' && contentObj['zh']) return contentObj['zh'];
  // 3. 尝试回退到英语
  if (contentObj['en']) return contentObj['en'];
  // 4. 尝试回退到中文
  if (contentObj['zh']) return contentObj['zh'];
  
  // 5. 实在没有，返回第一个可用的值或空字符串
  return Object.values(contentObj)[0] as string || '';
};