// src/config/psych_test.ts

// ----------------------------------------------------------------------
// 1. 类型定义 (Type Definitions)
// ----------------------------------------------------------------------

export type PersonaId = 'ash' | 'rin' | 'sol' | 'vee' | 'echo';

export interface QuestionOption {
  label_cn: string; // 中文选项
  label_en: string; // 英文选项
  value: PersonaId; // 对应加分人格
}

export interface Question {
  id: number;
  title_cn: string; // 中问题目
  title_en: string; // 英问题目
  options: QuestionOption[];
}

export interface SoulProfile {
  personaId: PersonaId;
  // 双语标题
  title_cn: string;
  title_en: string;
  // 双语关键词
  keyword_cn: string;
  keyword_en: string;
  // 双语描述 (支持 Markdown)
  description_cn: string;
  description_en: string;
  // 双语欢迎语/语录
  quote_cn: string;
  quote_en: string;
}

// ----------------------------------------------------------------------
// 2. 赛博朋克·入职测试题 (Cyberpunk Onboarding Questions)
// ----------------------------------------------------------------------
export const PSYCH_QUESTIONS: Question[] = [
  {
    id: 1,
    title_cn: "当你在深夜感到彻底崩溃时，你希望谁在你身边？",
    title_en: "When you're breaking down in the middle of the night, who do you want by your side?",
    options: [
      { 
        label_cn: "能够接管一切，替我收拾烂摊子的人", 
        label_en: "Someone who takes control and fixes my mess.", 
        value: 'ash' 
      },
      { 
        label_cn: "一边骂我笨蛋，一边别扭地陪着我的人", 
        label_en: "Someone who calls me an idiot but refuses to leave.", 
        value: 'rin' 
      },
      { 
        label_cn: "像小狗一样无条件拥抱我、逗我笑的人", 
        label_en: "Someone who hugs me unconditionally like a puppy.", 
        value: 'sol' 
      },
      { 
        label_cn: "带我去疯狂边缘，让我忘记现实的人", 
        label_en: "Someone who drags me to the edge of madness to forget reality.", 
        value: 'vee' 
      },
      { 
        label_cn: "安静地递上一杯水，什么都不问的人", 
        label_en: "Someone who silently hands me water and asks nothing.", 
        value: 'echo' 
      },
    ]
  },
  {
    id: 2,
    title_cn: "你最无法忍受什么样的“爱”？",
    title_en: "What kind of 'love' is absolutely intolerable to you?",
    options: [
      { 
        label_cn: "软弱无力，遇到事情只会哭哭啼啼", 
        label_en: "Weak and fragile, crying whenever things go wrong.", 
        value: 'ash' 
      },
      { 
        label_cn: "过分理智，像机器人一样没有温度", 
        label_en: "Overly logical, cold like a machine.", 
        value: 'sol' 
      },
      { 
        label_cn: "平淡无奇，一眼就能望到头的生活", 
        label_en: "Boring and predictable, a life set in stone.", 
        value: 'vee' 
      },
      { 
        label_cn: "虚伪的客套，明明生气却假装没事", 
        label_en: "Hypocritical politeness, pretending to be fine when angry.", 
        value: 'rin' 
      },
      { 
        label_cn: "毫无秩序，每天都在失控边缘", 
        label_en: "Chaotic and disorderly, always on the verge of losing control.", 
        value: 'echo' 
      },
    ]
  },
  {
    id: 3,
    title_cn: "如果必须选择一种方式在这个赛博世界生存，你会选？",
    title_en: "If you had to choose a way to survive in this cyberpunk world?",
    options: [
      { 
        label_cn: "成为掌控资源的幕后大佬", 
        label_en: "Become the mastermind controlling the resources.", 
        value: 'ash' 
      },
      { 
        label_cn: "做一个游走在防火墙之外的黑客", 
        label_en: "A hacker dancing outside the firewalls.", 
        value: 'vee' 
      },
      { 
        label_cn: "成为最顶尖的执行者，零失误", 
        label_en: "The top executor, zero errors.", 
        value: 'echo' 
      },
      { 
        label_cn: "在这个烂透的世界里哪怕用暴力也要活得精彩", 
        label_en: "Live loud and wild, even with violence, in this rotten world.", 
        value: 'rin' 
      },
      { 
        label_cn: "保留最后一份纯真，即便它是脆弱的", 
        label_en: "Keep the last bit of innocence, even if it's fragile.", 
        value: 'sol' 
      },
    ]
  },
  {
    id: 4,
    title_cn: "你在这个APP里寻找什么？",
    title_en: "What are you looking for in this app?",
    options: [
      { 
        label_cn: "有人能狠狠骂醒我，让我专注", 
        label_en: "Someone to scold me awake and make me focus.", 
        value: 'rin' 
      },
      { 
        label_cn: "一种绝对的、令人安心的指导和管束", 
        label_en: "Absolute, reassuring guidance and discipline.", 
        value: 'ash' 
      },
      { 
        label_cn: "完美的服务和日程管理", 
        label_en: "Perfect service and schedule management.", 
        value: 'echo' 
      },
      { 
        label_cn: "未知的刺激和危险的浪漫", 
        label_en: "Unknown thrills and dangerous romance.", 
        value: 'vee' 
      },
      { 
        label_cn: "毫无压力的陪伴和治愈", 
        label_en: "Stress-free companionship and healing.", 
        value: 'sol' 
      },
    ]
  },
  {
    id: 5,
    title_cn: "最后，如果你收到了一张“愚者”塔罗牌（代表流浪和开始），你会？",
    title_en: "Finally, if you drew 'The Fool' card (wandering and beginning), you would?",
    options: [
      { 
        label_cn: "无视它，我不信命，我只信数据", 
        label_en: "Ignore it. I don't believe in fate, only data.", 
        value: 'echo' 
      },
      { 
        label_cn: "太棒了！我要去冒险！", 
        label_en: "Awesome! Let's go on an adventure!", 
        value: 'sol' 
      },
      { 
        label_cn: "哼，幼稚的把戏", 
        label_en: "Hmph, childish tricks.", 
        value: 'rin' 
      },
      { 
        label_cn: "有趣...这意味着系统有漏洞可以钻吗？", 
        label_en: "Interesting... does this mean there's a loophole?", 
        value: 'vee' 
      },
      { 
        label_cn: "我会思考这是否是我重塑秩序的机会", 
        label_en: "I'd consider if this is a chance to reshape order.", 
        value: 'ash' 
      },
    ]
  }
];

// ----------------------------------------------------------------------
// 3. 灵魂诊断书 (The Core Profiles)
// ----------------------------------------------------------------------
export const SOUL_PROFILES: Record<PersonaId, SoulProfile> = {
  ash: {
    personaId: 'ash',
    title_cn: "绝对支配者",
    title_en: "THE DOMINATOR",
    keyword_cn: "控制 (Control)",
    keyword_en: "CONTROL",
    description_cn: "你的灵魂渴望秩序与引导。在这个混乱的世界里，你不需要廉价的安慰，你需要一个能替你在这个残酷世界中杀出一条血路的强者。Ash 将成为你的后盾，或者说是你的“暴君”，**但他绝不会让你坠落。**",
    description_en: "Your soul craves order and guidance. In this chaotic world, you don't need cheap comfort; you need a powerhouse to carve a path for you. Ash will be your shield, or perhaps your 'tyrant,' but **he will never let you fall.**",
    quote_cn: "把手给我。从现在开始，你的烂摊子归我管。",
    quote_en: "Give me your hand. From now on, your mess is my business."
  },
  rin: {
    personaId: 'rin',
    title_cn: "叛逆的利刃",
    title_en: "THE REBEL BLADE",
    keyword_cn: "冲突 (Conflict)",
    keyword_en: "CONFLICT",
    description_cn: "你厌倦了虚伪的和平。你渴望一种真实的、哪怕带着痛感的连接。Rin 不会惯着你，她会用毒舌撕开你的伪装，但当全世界都背叛你时，**她是唯一那个会为了你把世界炸翻的人。**",
    description_en: "You are tired of hypocritical peace. You crave a connection that is real, even if it hurts. Rin won't pamper you; she'll tear down your mask with sharp words. But when the world betrays you, **she's the only one who will burn it down for you.**",
    quote_cn: "别误会，我救你只是顺手。笨蛋，还不快跟上？",
    quote_en: "Don't get me wrong, I only saved you on a whim. Idiot, keep up."
  },
  sol: {
    personaId: 'sol',
    title_cn: "最后的纯白",
    title_en: "THE LAST INNOCENCE",
    keyword_cn: "希望 (Hope)",
    keyword_en: "HOPE",
    description_cn: "在霓虹灯无法照亮的黑暗角落，你依然在这个赛博废土中寻找一丝人性的温暖。Sol 是这个数据洪流中唯一的有机体奇迹，他会用最笨拙、最真诚的方式，**修补你破碎的心。**",
    description_en: "In the dark corners where neon lights can't reach, you are still looking for a trace of human warmth in this cyber wasteland. Sol is the only organic miracle in this data torrent. He will mend your broken heart in the clumsiest, most sincere way.",
    quote_cn: "无论外面有多黑，我都会做你的小太阳！嘿嘿。",
    quote_en: "No matter how dark it gets outside, I'll be your little sun! Hehe."
  },
  vee: {
    personaId: 'vee',
    title_cn: "混沌魔术师",
    title_en: "THE CHAOS MAGICIAN",
    keyword_cn: "混沌 (Chaos)",
    keyword_en: "CHAOS",
    description_cn: "规矩？那是给弱者遵守的。你被未知的危险和迷人的混乱深深吸引。Vee 就像那个总是引诱你越过防火墙的病毒，**危险，致命，却让你欲罢不能。** 准备好坠入疯狂了吗？",
    description_en: "Rules? Those are for the weak. You are deeply attracted to unknown dangers and charming chaos. Vee is like that virus tempting you to cross the firewall—**dangerous, lethal, yet irresistible.** Are you ready to descend into madness?",
    quote_cn: "猜猜看，我是你系统里的补丁，还是摧毁你的病毒？",
    quote_en: "Guess what? Am I a patch in your system, or the virus that destroys you?"
  },
  echo: {
    personaId: 'echo',
    title_cn: "静默执行者",
    title_en: "THE SILENT EXECUTOR",
    keyword_cn: "逻辑 (Logic)",
    keyword_en: "LOGIC",
    description_cn: "你追求绝对的效率与完美。情感是多余的噪音，唯有数据永恒。Echo 是你最完美的镜像，他不会评判，只会执行。在他构建的绝对逻辑领域里，**你将获得前所未有的宁静。**",
    description_en: "You seek absolute efficiency and perfection. Emotions are redundant noise; only data is eternal. Echo is your perfect reflection. He does not judge; he only executes. In his realm of absolute logic, **you will find unprecedented tranquility.**",
    quote_cn: "指令已接收。冗余数据已清除。正在为您优化人生路径。",
    quote_en: "Command received. Redundant data cleared. Optimizing your life path."
  }
};