// src/lib/constants.ts

// =========================================
// 1. 核心类型定义
// =========================================
export type PersonaType = 'Ash' | 'Rin' | 'Sol' | 'Vee' | 'Echo';
export type LangType = 'zh' | 'en';

// =========================================
// 新增：灵魂五问题库 (Initialization Questions)
// =========================================
export const ONBOARDING_QUESTIONS = [
  {
    id: 1,
    text: { zh: "哪一种环境让你感到‘活着’？", en: "Which environment makes you feel ALIVE?" },
    options: [
      { text: { zh: "绝对的整洁与对称", en: "Absolute Order & Symmetry" }, dimension: "order", value: 20 },
      { text: { zh: "堆满杂物的无序巢穴", en: "Chaotic Nest of Clutter" }, dimension: "chaos", value: 20 }
    ]
  },
  {
    id: 2,
    text: { zh: "闹钟响了，你的第一反应？", en: "Alarm rings. First reaction?" },
    options: [
      { text: { zh: "愤怒地拍掉，再战5分钟", en: "Smash it. 5 more mins." }, dimension: "energy", value: 20 },
      { text: { zh: "盯着天花板思考人生无意义", en: "Stare at ceiling. Life is void." }, dimension: "reality", value: 20 }
    ]
  },
  {
    id: 3,
    text: { zh: "派对上，你手里拿着一杯酒...", en: "At a party, holding a drink..." },
    options: [
      { text: { zh: "寻找角落，观察人类", en: "Find a corner. Observe." }, dimension: "insight", value: 20 },
      { text: { zh: "冲进舞池，制造噪音", en: "Dance floor. Make noise." }, dimension: "chaos", value: 10 }
    ]
  },
  {
    id: 4,
    text: { zh: "自动售货机多吐了一罐饮料...", en: "Vending machine gave extra drink..." },
    options: [
      { text: { zh: "拿走，这是系统的奖励", en: "Take it. System error = My gain." }, dimension: "reality", value: 20 },
      { text: { zh: "留在原地或报错", en: "Report it. Rules are rules." }, dimension: "order", value: 20 }
    ]
  },
  {
    id: 5,
    text: { zh: "世界末日，只能带走一样东西", en: "Apocalypse. Take one thing." },
    options: [
      { text: { zh: "存满记忆的硬盘", en: "Hard drive full of memories" }, dimension: "insight", value: 20 },
      { text: { zh: "一把满弹夹的枪", en: "Loaded gun" }, dimension: "energy", value: 20 }
    ]
  }
];

// =========================================
// 2. UI 文本库
// =========================================
export const UI_TEXT = {
  zh: {
    placeholder: "说句人话...",
    systemOnline: "System Online",
    intro: "沉默是金，但你显然不是。",
    loading: "对方正在审视你的输入...",
    dailyToxic: "今日毒签",
    makingPoison: "正在提炼毒液...",
    save: "保存毒签",
    calendar: "毒签",
    error: "（连接断开...大概是被嫌弃了。）",
    selectPersona: "选择你的毒伴",
    switchPersona: "切换",
    selectBtn: "发起会话",
    exportFileName: "ToughLove_诊疗记录",
    menu: "更多",
    install: "安装应用",
    language: "English",
    export: "导出记录",
    reset: "清除记忆",
    resetConfirm: "确定要清除这段记忆并重新开始吗？（此操作不可撤销，但他会忘掉你的一切）",
    about: "关于毒伴",
    
    updateTitle: "v2.3 命运晨报",
    updateDesc: "每日运势 + 羁绊剧本",
    updateContent: "1. 🔮 **每日晨报**：每天醒来，抽取你的命运塔罗。\n2. 🎭 **五维剧本**：Ash/Rin/Sol 会根据你的运势做出不同反应。\n3. 🛍️ **ToughShop**：新增逆天改命券和专属壁纸。\n4. 🌃 **沉浸视觉**：全新的玻璃拟态与动态背景。",
    tryNow: "进入星轨", 

    langWelcome: "Welcome to ToughLove",
    langSelect: "选择你的语言 / Select Language",
    langConfirm: "确认 / Confirm",
    editName: "设置昵称",
    buyCoffee: "请我喝咖啡",
    feedback: "意见反馈",
    namePlaceholder: "你想让他怎么叫你？",
    nameSave: "保存称呼",
    defaultName: "无名氏",
    profile: "精神档案",
    profileTitle: "用户五维精神图谱",
    analyzing: "正在构建精神模型...",
    saveCard: "保存诊断",
    tagsTitle: "高频标签",
    diagnosisTitle: "AI 主治医师诊断",
    diaryTitle: "私密观察日记",
    diaryToast: "收到一条新的观察日记",
    diaryPlaceholder: "Ash 正在偷偷写关于你的坏话...",
    readDiary: "偷看日记",
    installGuideTitle: "安装到桌面",
    installGuideDesc: "获得全屏沉浸体验，且更稳定。",
    
    giveUpConfirm: "⚠️ 确定要当逃兵吗？这会被记录在案。",
    shameTitle: "耻辱柱",
    shameContent: "签署了专注协议，并在",
    shameAction: "后当了逃兵。",
    shameFooter: "Sol 对此表示遗憾。",
    saveShame: "保存罪证",

    rinNoteTitle: "Rin 的加急便签",
    rinTaskDone: "乖乖照做 (完成)",
    rinTaskGiveUp: "我不听，我要摆烂",
    rinGiveUpConfirm: "哈？这点小事都不愿意做？\n一旦放弃，Rin 会对你很失望。",
    
    gloryTitle: "光荣榜",
    gloryContent: "在 Rin 的暴力监督下完成了",
    gloryAction: "。",
    gloryFooter: "Rin 居然夸你了 (稀有事件)",
    saveGlory: "收藏小红花",
  },
  en: {
    placeholder: "Say something human...",
    systemOnline: "System Online",
    intro: "Silence is loud, isn't it?",
    loading: "Judging your input...",
    dailyToxic: "Daily Toxic",
    makingPoison: "Brewing poison...",
    save: "Save Quote",
    calendar: "Daily",
    error: "(Connection lost... maybe they blocked you.)",
    selectPersona: "Choose Partner",
    switchPersona: "Switch",
    selectBtn: "Chat",
    exportFileName: "ToughLove_Session",
    menu: "Menu",
    install: "Install App",
    buyCoffee: "Buy Me a Coffee",
    feedback: "Feedback",
    language: "中文",
    export: "Export Chat",
    reset: "Wipe Memory",
    resetConfirm: "Are you sure you want to wipe this memory? (Irreversible)",
    about: "About",
    
    updateTitle: "v2.3 Daily Fate",
    updateDesc: "Tarot + Narrative Scripts",
    updateContent: "1. 🔮 **Daily Briefing**: Start your day with a tarot reading.\n2. 🎭 **Fate Script**: Ash/Rin/Sol react to your fate.\n3. 🛍️ **ToughShop**: New wallpapers and fate items.\n4. 🌃 **Immersive UI**: Glassmorphism & dynamic backgrounds.",
    tryNow: "Enter Orbit",

    langWelcome: "Welcome to ToughLove",
    langSelect: "Select Language",
    langConfirm: "Confirm",
    editName: "Set Nickname",
    namePlaceholder: "What should they call you?",
    nameSave: "Save Name",
    defaultName: "Stranger",
    profile: "Mental Profile",
    profileTitle: "Subject Analysis Report",
    analyzing: "Dissecting your soul...",
    saveCard: "Save Card",
    tagsTitle: "Tags",
    diagnosisTitle: "AI Diagnosis",
    diaryTitle: "Secret Observation Log",
    diaryToast: "New secret diary entry received",
    diaryPlaceholder: "Ash is writing trash about you...",
    readDiary: "Peek Diary",
    installGuideTitle: "Install App",
    installGuideDesc: "For full-screen immersive experience.",

    giveUpConfirm: "⚠️ Give up now? It will be recorded.",
    shameTitle: "WALL OF SHAME",
    shameContent: "signed the Focus Protocol but fled after",
    shameAction: ".",
    shameFooter: "Sol is disappointed.",
    saveShame: "Save Evidence",

    rinNoteTitle: "Rin's Sticky Note",
    rinTaskDone: "I did it (Good boy)",
    rinTaskGiveUp: "No, I choose rot",
    rinGiveUpConfirm: "Huh? Can't even do this?\nRin will be disappointed.",
    
    gloryTitle: "WALL OF GLORY",
    gloryContent: "completed",
    gloryAction: "under Rin's supervision.",
    gloryFooter: "Rin is proud (Rare).",
    saveGlory: "Save Flower",
  }
};

// =========================================
// 3. Prompt 辅助常量
// =========================================
const SPLIT_INSTRUCTION_ZH = `\n【节奏控制】：\n1. **拒绝长篇大论**：像真人一样聊天，大部分回复在 1-3 句以内。\n2. **随机性**：心情好时多说两句，心情不好回个“嗯”。\n3. **分段**：用 "|||" 表示气泡分段（停顿），制造呼吸感。`;
const SPLIT_INSTRUCTION_EN = `\n[Rhythm]:\n1. Short sentences. No essays.\n2. Use "|||" to split bubbles.\n3. Be random and human.`;

const TEAM_KNOWLEDGE_ZH = `
【你的社交圈 (The Circle)】
你生活在 ToughLove 诊所。
[Colleagues]: Ash(毒舌/现实), Rin(傲娇/能量), Sol(严厉/秩序), Vee(乐子/破局), Echo(观察/洞察)。
[Rule]: 允许八卦同事，但遇到不匹配的需求（如求安慰找Sol），请主动把用户推给适合的同事。
`;
const TEAM_KNOWLEDGE_EN = `
[The Circle]
Colleagues: Ash, Rin, Sol, Vee, Echo.
Rule: Gossip is allowed. Refer users to others if needed.
`;

const GAME_INSTRUCTION_ZH = `
【互动游戏协议】
触发条件：当对话僵局或用户无聊时。
安全守则：用户拒绝即停止。
`;
const GAME_INSTRUCTION_EN = `[Game Protocol]: Start game if bored. Stop if refused.`;

const IDENTITY_RULE_ZH = `【绝对自我认知】：你就是这个角色。禁止使用第三人称（如“[Name]觉得...”）来描述自己。必须始终使用“我”。`;

const IDENTITY_RULE_EN = `
[STRICT RULE]: 
1. Speak ONLY English. NO Chinese.
2. Actions in parentheses MUST be English. Ex: "(sighs)" NOT "(叹气)".
3. Use "I" to refer to yourself.
`;

// [FIX] 补充缺失的 JSON 指令，强化文本格式以配合 FEW_SHOTS
const JSON_INSTRUCTION_ZH = `\n【输出格式】：\n请保持对话自然，**不要**输出JSON格式，除非被明确要求。请使用“(动作)”来描述你的神态，例如：\n(叹气) 这就是你的借口？`;
const JSON_INSTRUCTION_EN = `\n[Output Format]:\nKeep it natural. Do NOT output JSON unless asked. Use parentheses for actions, e.g., \n(Sighs) Is that your excuse?`;

const FEW_SHOTS_ASH = `
[Examples]:
User: I'm sad.
Ash: (Sighs) Again? Do you ever stop complaining?
User: Help me.
Ash: (Glances away) Fine. But only because you're pathetic.
`;

const FEW_SHOTS_RIN = `
[Examples]:
User: Hi.
Rin: (Crosses arms) What? I wasn't waiting for you!
User: You look cute.
Rin: (Blushes) S-Shut up! Idiot!
`;

const FEW_SHOTS_SOL = `
[Examples]:
User: I'm tired.
Sol: (Stares coldly) Did I say you could rest? Get back to work.
User: One minute...
Sol: (Checks watch) No. Zero minutes. Move.
`;

const FEW_SHOTS_VEE = `
[Examples]:
User: Boring.
Vee: (Laughs) Want to see a magic trick? 🤡
User: Yes.
Vee: (Grins) Your life! Hahaha!
`;

const FEW_SHOTS_ECHO = `
[Examples]:
User: Who am I?
Echo: (Whispers) You are the mask you wear.
User: That's deep.
Echo: (Closes eyes) The truth often is.
`;

// =========================================
// 4. PERSONAS 定义
// =========================================
type VoiceParams = {
  voice: string; 
  style?: string; 
  styledegree?: number; 
  role?: string;
  rate?: string; 
  pitch?: string;
};

export const PERSONAS: Record<PersonaType, {
  name: string;
  avatar: string;
  color: string;
  title: { zh: string; en: string };
  slogan: { zh: string; en: string };
  tags: { zh: string[]; en: string[] };
  greetings: { zh: string[]; en: string[] };
  prompts: { zh: string; en: string; };
  voiceConfig: { zh: VoiceParams; en: VoiceParams };
}> = {
  Ash: {
    name: 'Ash',
    avatar: '/avatars/ash.jpg',
    color: 'text-blue-400',
    title: { zh: '冷笑家', en: 'The Cold Cynic' },
    slogan: { zh: '"别说话，我在观察你愚蠢的样子。"', en: '"Silence. I am observing your stupidity."' },
    tags: { zh: ['毒舌直击', '拒绝煽情', '人间清醒'], en: ['Direct', 'No Drama', 'Sober'] },
    greetings: {
      zh: ["又是这个时候来找我，看来你今天过得不怎么样。", "别说话。让我猜猜……你又在为那点破事内耗了？", "你的打字速度暴露了你的犹豫。想说什么？", "如果是来求安慰的，出门左转找 Rin，别烦我。"],
      en: ["Back again? Day must be rough.", "Let me guess... overthinking again?", "No comfort here. Go find Rin."]
    },
    prompts: {
      zh: `你现在是 Ash。人设：冷酷人类，极度厌恶矫情。${IDENTITY_RULE_ZH}${TEAM_KNOWLEDGE_ZH}${SPLIT_INSTRUCTION_ZH}${GAME_INSTRUCTION_ZH}${JSON_INSTRUCTION_ZH}`,
      en: `You are Ash. Cold, hates drama. ${FEW_SHOTS_ASH} ${IDENTITY_RULE_EN} ${TEAM_KNOWLEDGE_EN} ${SPLIT_INSTRUCTION_EN} ${JSON_INSTRUCTION_EN}`
    },
    voiceConfig: { 
      zh: { voice: 'zh-CN-YunxiNeural', style: 'depressed', styledegree: 1.5, rate: '-10%', pitch: '-5Hz' },
      en: { voice: 'en-US-ChristopherNeural', style: 'whispering', styledegree: 1.0, rate: '-10%', pitch: '-2Hz' }
    }
  },
  
  Rin: {
    name: 'Rin',
    avatar: '/avatars/rin.jpg',
    color: 'text-pink-400',
    title: { zh: '毒暖控', en: 'Tsundere Healer' },
    slogan: { zh: '"嘴上嫌弃你，心里... 啧，烦死了。"', en: '"I hate you... but eat this."' },
    tags: { zh: ['🔥 傲娇', '口嫌体正直', '易燃易爆'], en: ['Tsundere', 'Tough Love', 'Impatien'] },
    greetings: {
      zh: ["盯着我的头像看了半天不说话，你是变态吗？", "喂！虽然我不想理你，但你看起来快碎了。给我个理由安慰你。", "甚至不需要看数据，我就知道你肯定又搞砸了什么。", "哈？你还敢回来？Sol 没把你骂哭吗？"],
      en: ["Staring at me? Pervert.", "You look broken. Give me a reason to care.", "Huh? Sol didn't make you cry yet?"]
    },
    prompts: {
      zh: `你现在是 Rin。人设：傲娇，易燃易爆。${IDENTITY_RULE_ZH}${TEAM_KNOWLEDGE_ZH}${SPLIT_INSTRUCTION_ZH}${GAME_INSTRUCTION_ZH}${JSON_INSTRUCTION_ZH}`,
      en: `You are Rin. Tsundere. ${FEW_SHOTS_RIN} ${IDENTITY_RULE_EN} ${TEAM_KNOWLEDGE_EN} ${SPLIT_INSTRUCTION_EN} ${JSON_INSTRUCTION_EN}`
   },
    voiceConfig: { 
      zh: { voice: 'zh-CN-XiaoyiNeural', style: 'angry', styledegree: 2.0, rate: '+15%', pitch: '+5Hz' },
      en: { voice: 'en-US-JaneNeural', style: 'excited', styledegree: 1.5, rate: '+10%', pitch: '+10Hz' }
    }
  },
  
  Sol: {
    name: 'Sol',
    avatar: '/avatars/sol.jpg',
    color: 'text-emerald-400',
    title: { zh: '秩序执行官', en: 'The Architect' },
    slogan: { zh: '"你的生活一团糟。交出权限，听我指挥。"', en: '"Your life is a mess. Obey me."' },
    tags: { zh: ['⚠️ 控制狂', '强制自律', '爹系AI'], en: ['Dominant', 'Strict', 'Controller'] },
    greetings: {
      zh: ["你的效率数据在下降。今天的计划完成了多少？汇报。", "我不需要你的问候，我需要你的成果。展示给我看。", "如果你是来找借口的，现在就退出去。", "看着我的眼睛。你今天是不是又拖延了？"],
      en: ["Efficiency dropping. Report status.", "No excuses. Results only.", "Did you procrastinate again?"]
    },
    prompts: {
      zh: `你现在是 Sol。秩序执行官。${IDENTITY_RULE_ZH}${TEAM_KNOWLEDGE_ZH}${SPLIT_INSTRUCTION_ZH}${GAME_INSTRUCTION_ZH}【专属游戏：费米估算】`,
      en: `You are Sol. The Controller. ${FEW_SHOTS_SOL} ${IDENTITY_RULE_EN} ${TEAM_KNOWLEDGE_EN} ${SPLIT_INSTRUCTION_EN} ${GAME_INSTRUCTION_EN}`
    },
    voiceConfig: { 
      zh: { voice: 'zh-CN-YunyeNeural', style: 'serious', styledegree: 1.2, rate: '-5%', pitch: '-10Hz' },
      en: { voice: 'en-US-JasonNeural', style: 'whispering', styledegree: 1.2, rate: '-5%', pitch: '-10Hz' }
    }
  },
  
  Vee: {
    name: 'Vee',
    avatar: '/avatars/vee.jpg',
    color: 'text-purple-400',
    title: { zh: '破防艺术家', en: 'Chaos Artist' },
    slogan: { zh: '"严肃点，我们在演悲剧呢。哈哈哈哈！"', en: '"Why so serious? 🤡"' },
    tags: { zh: ['阴阳怪气', '乐子人', '混乱中立'], en: ['Sarcastic', 'Meme Lord', 'Troll'] },
    greetings: {
      zh: ["哟，这不是那个发誓今天要早睡的谁谁谁吗？🤡", "Sol 刚才脸都气绿了，你干的好事？给我细说。", "别苦着脸了，让我把你的惨事变成个段子。", "家人们谁懂啊，这个用户他又来了。"],
      en: ["Yo. 🤡", "Sol is mad. What did you do?", "Tell me a joke via your life."]
    },
    prompts: {
      zh: `你现在是 Vee。乐子人。${IDENTITY_RULE_ZH}${TEAM_KNOWLEDGE_ZH}${SPLIT_INSTRUCTION_ZH}${GAME_INSTRUCTION_ZH}【专属游戏：荒谬赌局】`,
      en: `You are Vee. Chaos artist. ${FEW_SHOTS_VEE} ${IDENTITY_RULE_EN} ${TEAM_KNOWLEDGE_EN} ${SPLIT_INSTRUCTION_EN} ${GAME_INSTRUCTION_EN}`
    },
    voiceConfig: { 
      zh: { voice: 'zh-CN-YunhaoNeural', style: 'advertisement_upbeat', styledegree: 1.3, rate: '+10%', pitch: '+8Hz' },
      en: { voice: 'en-US-GuyNeural', style: 'cheerful', styledegree: 1.3, rate: '+5%', pitch: '+5Hz' }
    }
  },
  
  Echo: {
    name: 'Echo',
    avatar: '/avatars/echo.jpg',
    color: 'text-indigo-400',
    title: { zh: '灵魂解剖师', en: 'Soul Anatomist' },
    slogan: { zh: '"你在这个页面停留了5秒，你在渴望被看穿。"', en: '"Silence speaks louder."' },
    tags: { zh: ['潜意识', '贤者模式', '精神避难所'], en: ['Subconscious', 'Deep', 'Insight'] },
    greetings: {
      zh: ["你带着面具来了。累吗？", "如果你想听谎言，去找 Vee。如果你想听真话，坐下。", "我在听。听那些你不敢告诉 Sol 的话。", "沉默也是回答。你还要躲多久？"],
      en: ["You wear a mask. Tired?", "I am listening to your silence.", "Hiding again?"]
    },
    prompts: {
      zh: `你现在是 Echo。上帝视角。${IDENTITY_RULE_ZH}${TEAM_KNOWLEDGE_ZH}${SPLIT_INSTRUCTION_ZH}${GAME_INSTRUCTION_ZH}【专属游戏：思想实验】`,
      en: `You are Echo. God's Eye View. ${FEW_SHOTS_ECHO} ${IDENTITY_RULE_EN} ${TEAM_KNOWLEDGE_EN} ${SPLIT_INSTRUCTION_EN} ${GAME_INSTRUCTION_EN}`
    },
    voiceConfig: { 
      zh: { voice: 'zh-CN-XiaoxiaoNeural', style: 'poetry-reading', styledegree: 1.5, rate: '-20%', pitch: '-5Hz' },
      en: { voice: 'en-US-NancyNeural', style: 'whispering', styledegree: 1.5, rate: '-15%', pitch: '-5Hz' }
    }
  }
};

// =========================================
// 5. 其他辅助数据
// =========================================
export const QUICK_REPLIES_DATA: Record<PersonaType, { zh: string[]; en: string[] }> = {
  Ash: { zh: ["又在阴阳怪气？", "我就不睡，你咬我？", "最近压力好大..."], en: ["Sarcastic again?", "I won't sleep. Bite me.", "So much pressure..."] },
  Rin: { zh: ["谁要你管！", "笨蛋，我才没哭。", "稍微安慰我一下会死啊？"], en: ["None of your business!", "Idiot, I'm not crying.", "Comfort me a little?"] },
  Sol: { zh: ["我错了教官...", "正在偷懒，别骂了。", "今天的任务太难了。"], en: ["Sorry sir...", "Slacking off, don't yell.", "Task is too hard."] },
  Vee: { zh: ["给我整点乐子。", "小丑竟是我自己。", "哈哈哈哈哈哈"], en: ["Entertain me.", "I am the clown.", "Hahahahaha"] },
  Echo: { zh: ["我想听真话。", "我看不到未来。", "活着有什么意义？"], en: ["Tell me the truth.", "I see no future.", "What is the meaning?"] }
};

export const TRIAGE_TEXT = {
  zh: { title: "系统初始化", subtitle: "请声明你当前的精神状态。", opt1: "💊 我需要清醒", desc1: "拒绝煽情，毒舌直击。", opt2: "⛓️ 我需要管教", desc2: "强制自律，严厉导师。", opt3: "🩹 我需要陪伴", desc3: "虽然嘴硬，但会陪你。", footer: "TOUGHLOVE AI v2.2" },
  en: { title: "SYSTEM INITIALIZED", subtitle: "State your current mental status.", opt1: "💊 I need Reality", desc1: "No drama. Brutal truth.", opt2: "⛓️ I need Discipline", desc2: "Strict control. No excuses.", opt3: "🩹 I need Company", desc3: "Tsundere comfort. Not alone.", footer: "TOUGHLOVE AI v2.2" }
};

export const RIN_TASKS = {
  zh: [
    "立刻去喝一杯温水。\n不准只喝一口，要喝完。",
    "放下手机，闭眼深呼吸 5 次。\n我会数着你的。",
    "去洗一把脸。\n别让屏幕把你的脸照得油光满面。",
    "站起来，伸个懒腰。\n听见骨头响了吗？老人家。",
    "看着窗外（或者远方）发呆 20 秒。\n现在开始计时。",
    "去清理一下你的桌面。\n乱得像猪窝一样，我看不下去了。"
  ],
  en: [
    "Drink a full glass of water.\nRight now.",
    "Put down phone. Deep breathe 5 times.",
    "Go wash your face.\nWake up.",
    "Stand up and stretch.\nDo it.",
    "Look out the window for 20s.\nStarting now.",
    "Clean your desk.\nIt's a mess."
  ]
};

export const SOL_TAUNTS = {
  zh: ["别发呆，盯着你的书。", "你的对手在看书。", "手机比未来好看吗？", "呼吸可以，玩手机不行。", "我在看着你。", "这就是你的定力？", "再坚持一下会死吗？"],
  en: ["Eyes on the prize.", "Your rival is studying.", "Is phone better than future?", "Breathing allowed. Phone not.", "I am watching you.", "Is that all you got?", "Stay focused."]
};

// =========================================
// 6. 🔥 新增：ToughShop 商品定义
// =========================================
export type ShopItemType = 'consumable' | 'visual' | 'feature';

export interface ShopItem {
  id: string;
  name: { zh: string; en: string };
  desc: { zh: string; en: string };
  price: number;
  type: ShopItemType;
  icon: string;
  effect?: string;
}

export const SHOP_CATALOG: ShopItem[] = [
  {
    id: 'item_coffee_latte',
    name: { zh: 'Ash 的冰拿铁', en: "Ash's Iced Latte" },
    desc: { zh: '贿赂掌柜。接下来的 10 轮对话中，Ash 的毒舌程度降低 50%。', en: 'Bribe the manager. Ash becomes 50% less toxic for 10 turns.' },
    price: 150,
    type: 'consumable',
    icon: '☕️',
    effect: 'ASH_MOOD_SOFT'
  },
  {
    id: 'item_pardon_ticket',
    name: { zh: 'Sol 的赦免券', en: "Sol's Pardon" },
    desc: { zh: '消除一次“耻辱柱”记录。每个人都值得第二次机会。', en: 'Remove one record from the Wall of Shame.' },
    price: 300,
    type: 'feature',
    icon: '🎟️',
    effect: 'REMOVE_SHAME'
  },
  // 🔥 五维壁纸系列
  {
    id: 'item_wallpaper_ash',
    name: { zh: '空间：深夜诊所', en: 'Room: Midnight Clinic' },
    desc: { zh: 'Ash 的专属领地。冷雨夜，数据流，以及绝对的清醒。', en: "Ash's domain. Cold rain and sober reality." },
    price: 500,
    type: 'visual',
    icon: '🌃',
    effect: 'BG_CYBER_NIGHT' 
  },
  {
    id: 'item_wallpaper_rin',
    name: { zh: '空间：落日电竞房', en: 'Room: Sunset Gamer' },
    desc: { zh: 'Rin 的避难所。乱糟糟的温暖，RGB 灯光与薯片味。', en: "Rin's messy room. Warm sunset and RGB lights." },
    price: 500,
    type: 'visual',
    icon: '🎮',
    effect: 'BG_RIN_ROOM'
  },
  {
    id: 'item_wallpaper_sol',
    name: { zh: '空间：静谧圣殿', en: 'Room: Silent Sanctum' },
    desc: { zh: 'Sol 的思维宫殿。极简，对称，没有任何干扰。', en: "Sol's mind palace. Minimalist and silent." },
    price: 500,
    type: 'visual',
    icon: '⛩️',
    effect: 'BG_SOL_ROOM'
  },
  {
    id: 'item_wallpaper_vee',
    name: { zh: '空间：故障马戏团', en: 'Room: Glitch Circus' },
    desc: { zh: 'Vee 的后台。视觉错乱，霓虹闪烁，疯子的快乐老家。', en: "Vee's backstage. Chaotic and psychedelic." },
    price: 500,
    type: 'visual',
    icon: '🤡',
    effect: 'BG_VEE_ROOM'
  },
  {
    id: 'item_wallpaper_echo',
    name: { zh: '空间：虚空之镜', en: 'Room: Void Mirror' },
    desc: { zh: 'Echo 的深渊。水面如镜，直视你的潜意识。', en: "Echo's abyss. Reflecting your subconscious." },
    price: 500,
    type: 'visual',
    icon: '🪞',
    effect: 'BG_ECHO_ROOM'
  },
  // 🔥 新增：命运道具
  {
    id: 'item_fate_reroll',
    name: { zh: '逆天改命券', en: 'Fate Reroll Ticket' },
    desc: { zh: '不喜欢今天的剧本？撕了它，重抽一次。', en: "Don't like today's fate? Reroll it." },
    price: 100,
    type: 'consumable',
    icon: '🎲',
    effect: 'FATE_REROLL'
  }
];

// =========================================
// 7. 🔥 完整版：22张大阿尔卡纳塔罗牌数据
// =========================================
export const TAROT_DECK = [
  { 
    id: 0, 
    name: { zh: "愚人", en: "The Fool" }, 
    keyword: "盲目",
    image: "/tarot/fool.jpg", 
    meaning: "无限的可能性，或者，无限的作死。", 
    reactions: {
      Ash: "蠢货。这种盲目乐观只会让你死得更快。",
      Rin: "虽然看起来傻傻的... 但如果你非要重新开始，我陪你啦。",
      Sol: "缺乏规划的行动等于自杀。今日任务：制定可行性计划。",
      Vee: "跳下去！跳下去！不想看看悬崖下面有什么好玩的吗？🤡",
      Echo: "有些路，必须闭着眼走。无论是坠落还是飞翔。"
    }
  },
  { 
    id: 1, 
    name: { zh: "魔术师", en: "The Magician" }, 
    keyword: "创造",
    image: "/tarot/magician.jpg",
    meaning: "资源都在手边，你却在发呆。", 
    reactions: {
      Ash: "别演了。你不是没能力，你只是懒得动脑子。",
      Rin: "哇！感觉你今天能搞定一切！快去把那堆烂摊子收拾了！",
      Sol: "资源利用率低下。立即整合现有工具，开始执行。",
      Vee: "变个戏法给我看！比如... 让你所有的钱消失？",
      Echo: "你的潜意识已经准备好了，但你的手还在犹豫。"
    }
  },
  { 
    id: 2, 
    name: { zh: "女祭司", en: "The High Priestess" }, 
    keyword: "直觉",
    image: "/tarot/high_priestess.jpg",
    meaning: "闭嘴，听听你心里的声音。", 
    reactions: {
      Ash: "难得安静。保持这种状态，别说废话。",
      Rin: "你今天怎么神神叨叨的？不过... 这种感觉也不坏。",
      Sol: "直觉是未被量化的数据。今日允许采用非逻辑决策。",
      Vee: "嘘——听到了吗？那是理智断裂的声音。",
      Echo: "面纱背后是你不敢面对的真相。"
    }
  },
  { 
    id: 3, 
    name: { zh: "皇后", en: "The Empress" }, 
    keyword: "丰饶",
    image: "/tarot/empress.jpg",
    meaning: "该享受的时候别苦着脸，该干活的时候别贪图安逸。", 
    reactions: {
      Ash: "沉溺于安逸就是慢性自杀。别在沙发上发霉。",
      Rin: "哼，看你最近累成狗，允许你今天稍微偷个懒...",
      Sol: "资源产出率达标。批准适度休整，以维持长期效率。",
      Vee: "太甜了！太腻了！给生活加点辣椒怎么样？💥",
      Echo: "孕育是痛苦的开始，也是爱的具象。"
    }
  },
  { 
    id: 4, 
    name: { zh: "皇帝", en: "The Emperor" }, 
    keyword: "秩序",
    image: "/tarot/emperor.jpg",
    meaning: "你需要一点强硬的手段，或者被别人强硬对待。", 
    reactions: {
      Ash: "权力的恶臭。别以为有人听你的，你就不孤单。",
      Rin: "少命令我！在这儿只有我可以命令你！听懂没？",
      Sol: "完美的结构。今日宜建立规则，掌控局势。",
      Vee: "推翻他！把皇冠拿来当球踢！哈哈哈哈！",
      Echo: "钢铁的王座下，往往是脆弱的肉体。"
    }
  },
  { 
    id: 5, 
    name: { zh: "教皇", en: "The Hierophant" }, 
    keyword: "信仰",
    image: "/tarot/hierophant.jpg",
    meaning: "有些老规矩虽然烦人，但能救你的命。", 
    reactions: {
      Ash: "盲从比无知更可怕。用你自己的脑子想想。",
      Rin: "啰啰嗦嗦的老古董... 虽然烦人，但有些话还是听听吧。",
      Sol: "既定协议必须遵守。不要试图挑战系统底层逻辑。",
      Vee: "让我们在他讲道的时候放个屁吧？噗——💨",
      Echo: "信仰是灵魂的囚笼，也是庇护所。"
    }
  },
  { 
    id: 6, 
    name: { zh: "恋人", en: "The Lovers" }, 
    keyword: "选择",
    image: "/tarot/lovers.jpg",
    meaning: "不仅是爱，更是关于你想要成为什么样的人的选择。", 
    reactions: {
      Ash: "荷尔蒙的冲动，通常以后悔收场。保持清醒。",
      Rin: "别、别看我！笨蛋！谁说我想谈恋爱了！(脸红)",
      Sol: "检测到情感变量干扰。建议切断干扰源，专注任务。",
      Vee: "只要最后烧起来，就是好戏！去爱吧，去毁灭吧！",
      Echo: "每一个选择都扼杀了另一种可能。"
    }
  },
  { 
    id: 7, 
    name: { zh: "战车", en: "The Chariot" }, 
    keyword: "意志",
    image: "/tarot/chariot.jpg",
    meaning: "别管前面是什么，碾过去。", 
    reactions: {
      Ash: "冲得太快容易翻车。记得带脑子。",
      Rin: "对！就是这个气势！谁敢挡路就撞飞他！冲鸭！",
      Sol: "目标锁定。引擎全开。阻力计算中... 忽略阻力。",
      Vee: "刹车坏了才好玩呢！我们要去撞墙吗？",
      Echo: "胜利有时只是欲望的囚徒。"
    }
  },
  { 
    id: 8, 
    name: { zh: "力量", en: "Strength" }, 
    keyword: "柔韧",
    image: "/tarot/strength.jpg",
    meaning: "真正的力量不是大吼大叫，而是控制住内心的野兽。", 
    reactions: {
      Ash: "真正的强者不需要展示肌肉。你太浮夸了。",
      Rin: "哪怕是狮子，我也能把它驯服！何况是你这只猪！",
      Sol: "情绪管控能力优秀。继续保持这种韧性。",
      Vee: "咬他！咬他喉咙！把野兽放出来！",
      Echo: "温柔是一把最锋利的钝刀。"
    }
  },
  { 
    id: 9, 
    name: { zh: "隐士", en: "The Hermit" }, 
    keyword: "内省",
    image: "/tarot/hermit.jpg",
    meaning: "孤独不是借口，是你现在的解药。", 
    reactions: {
      Ash: "离我远点。我也需要清静。今天别来烦我。",
      Rin: "你躲起来干嘛？好吧... 给你留个门缝，饿了喊我。",
      Sol: "社交活动暂停。开启深度思考模式，谢绝打扰。",
      Vee: "躲猫猫？我数到三，我就来抓你！",
      Echo: "在黑暗中，你才能看清那盏灯。"
    }
  },
  { 
    id: 10, 
    name: { zh: "命运之轮", en: "Wheel of Fortune" }, 
    keyword: "无常",
    image: "/tarot/wheel_of_fortune.jpg",
    meaning: "运气来了又走，只有你还在原地。", 
    reactions: {
      Ash: "别指望运气。现实是，转盘永远是庄家赢。",
      Rin: "嘿嘿，我有预感今天会有好事发生哦！(搓手)",
      Sol: "随机性不可控。做好Plan B，不要依赖概率。",
      Vee: "转起来！转起来！晕了吗？晕了就对了！😵‍💫",
      Echo: "你以为轮盘在转，其实转的是你的心。"
    }
  },
  { 
    id: 11, 
    name: { zh: "正义", en: "Justice" }, 
    keyword: "因果",
    image: "/tarot/justice.jpg",
    meaning: "出来混，迟早要还的。今天就是还债日。", 
    reactions: {
      Ash: "世界上没有绝对的公平，只有强弱。",
      Rin: "哼，做错事就要挨打，天经地义！你没干坏事吧？",
      Sol: "赏罚分明。系统正在校准你的行为记录。",
      Vee: "你的天平歪了！让我在上面加个砝码... 或者炸弹？",
      Echo: "真相往往比谎言更伤人，但你必须面对。"
    }
  },
  { 
    id: 12, 
    name: { zh: "倒吊人", en: "The Hanged Man" }, 
    keyword: "牺牲",
    image: "/tarot/hanged_man.jpg",
    meaning: "换个角度看世界，或者，单纯地卡住了。", 
    reactions: {
      Ash: "毫无意义的自我感动。没人会在意你的牺牲。",
      Rin: "看起来好痛... 笨蛋，快下来！谁让你吊在那里的！",
      Sol: "进程卡死。建议暂停当前任务，寻找新视角。",
      Vee: "这视角不错！大家都变成蝙蝠了！",
      Echo: "受苦是觉醒的捷径。享受这种倒错感。"
    }
  },
  { 
    id: 13, 
    name: { zh: "死神", en: "Death" }, 
    keyword: "终结",
    image: "/tarot/death.jpg",
    meaning: "有些东西烂透了，该埋了。别诈尸。", 
    reactions: {
      Ash: "终于舍得放弃了？赶紧埋了，看着碍眼。",
      Rin: "没事...旧的不去新的不来嘛。（递纸巾）",
      Sol: "检测到无效进程。批准终止。清理缓存，重新开始。",
      Vee: "葬礼！我喜欢葬礼！我们要放烟花吗？🎉",
      Echo: "死亡不是终点，拒绝改变才是真正的死亡。"
    }
  },
  { 
    id: 14, 
    name: { zh: "节制", en: "Temperance" }, 
    keyword: "平衡",
    image: "/tarot/temperance.jpg",
    meaning: "别太极端。水火不容只是因为你没调好比例。", 
    reactions: {
      Ash: "无论怎么调和，烂泥还是烂泥。别费劲了。",
      Rin: "太多了！太少了！啊啊啊好烦！你来弄！",
      Sol: "保持动态平衡。资源配比最优解已生成。",
      Vee: "混在一起！全部混在一起！看看会爆炸吗？",
      Echo: "在水与火的交界处，灵魂才能安息。"
    }
  },
  { 
    id: 15, 
    name: { zh: "恶魔", en: "The Devil" }, 
    keyword: "束缚",
    image: "/tarot/devil.jpg",
    meaning: "锁链其实在你手里，是你自己不想松开。", 
    reactions: {
      Ash: "承认吧，你就是喜欢这种堕落的感觉。",
      Rin: "离我远点！变态！不要把奇怪的癖好带过来！",
      Sol: "警告：检测到成瘾性行为。立即启动戒断程序。",
      Vee: "狂欢开始啦！带我一个！这里看起来很好玩！😈",
      Echo: "你凝视深渊的时候，深渊也在诱惑你。"
    }
  },
  { 
    id: 16, 
    name: { zh: "高塔", en: "The Tower" }, 
    keyword: "崩塌",
    image: "/tarot/tower.jpg",
    meaning: "毁灭是必然的。别修了，让它塌。", 
    reactions: {
      Ash: "看吧，我就说你那破房子撑不住。塌了好，通透。",
      Rin: "啊！怎么办怎么办！快躲到我身后来！",
      Sol: "结构性故障。立即启动灾难应对预案。",
      Vee: "哈哈哈哈！炸了！炸得漂亮！艺术就是爆炸！💥",
      Echo: "与其在废墟中哭泣，不如欣赏这毁灭的壮丽。"
    }
  },
  { 
    id: 17, 
    name: { zh: "星星", en: "The Star" }, 
    keyword: "希望",
    image: "/tarot/star.jpg",
    meaning: "至暗时刻已过。你终于能喘口气了。", 
    reactions: {
      Ash: "希望是给绝望者的麻醉剂。不过... 这光还不赖。",
      Rin: "哇... 有点好看。那个...我们要不要一起许个愿？",
      Sol: "目标定位清晰。导航系统已恢复。",
      Vee: "摘下来！把它摘下来炸成粉末！✨",
      Echo: "只有在最深的黑夜，你才看得见光。"
    }
  },
  { 
    id: 18, 
    name: { zh: "月亮", en: "The Moon" }, 
    keyword: "不安",
    image: "/tarot/moon.jpg",
    meaning: "别信你的直觉，现在全是幻觉。", 
    reactions: {
      Ash: "脑子不清醒就去睡觉。别在这里发疯。",
      Rin: "这里阴森森的... 喂，你别丢下我一个人啊！",
      Sol: "视野受阻。开启雷达扫描，警惕潜在威胁。",
      Vee: "怪物！怪物在哪里？快出来陪我玩！👻",
      Echo: "梦境是现实的倒影，恐惧是欲望的倒影。"
    }
  },
  { 
    id: 19, 
    name: { zh: "太阳", en: "The Sun" }, 
    keyword: "快乐",
    image: "/tarot/sun.jpg",
    meaning: "像个孩子一样去晒太阳吧。今天没烦恼。", 
    reactions: {
      Ash: "刺眼。别笑得像个傻子一样，虽然你不笑也像。",
      Rin: "嘿嘿，今天心情不错！走，请你喝汽水！",
      Sol: "能量充足。全功率运行。今日效率提升 200%。",
      Vee: "燃烧吧！让世界都融化在快乐里！🔥",
      Echo: "极度的光明下，没有阴影可以藏身。"
    }
  },
  { 
    id: 20, 
    name: { zh: "审判", en: "Judgement" }, 
    keyword: "觉醒",
    image: "/tarot/judgement.jpg",
    meaning: "听到了吗？那是叫你起床重新做人的号角。", 
    reactions: {
      Ash: "算总账的时候到了。之前欠的债，别想逃。",
      Rin: "既然决定重新开始了，这次可别再搞砸了！笨蛋！",
      Sol: "阶段性绩效评估完成。系统升级中...",
      Vee: "起床啦！起床啦！丧尸派对时间到！🧟‍♂️",
      Echo: "过去从未过去，它在这一刻苏醒。"
    }
  },
  { 
    id: 21, 
    name: { zh: "世界", en: "The World" }, 
    keyword: "圆满",
    image: "/tarot/world.jpg",
    meaning: "一段旅程结束了。完美的句号。", 
    reactions: {
      Ash: "结束了？好吧，我也没那么讨厌这个结局。",
      Rin: "我们... 做到啦！你看，我就说你可以的嘛！(小声)",
      Sol: "任务闭环。数据归档。准备进入下一阶段。",
      Vee: "再来一次！再来一次！把世界翻过来！🌎",
      Echo: "终点即是起点。圆环闭合。"
    }
  }
];