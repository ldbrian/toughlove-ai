export type PersonaType = 'Ash' | 'Rin' | 'Sol' | 'Vee' | 'Echo';
export type LangType = 'zh' | 'en';

export const UI_TEXT = {
  zh: {
    placeholder: "说句人话...",
    systemOnline: "System Online",
    intro: "不想说点什么吗？",
    loading: "对方正在输入...",
    dailyToxic: "今日毒签",
    makingPoison: "正在调制毒药...",
    save: "保存毒签",
    calendar: "毒签",
    error: "（对方掉线了...大概是嫌你烦。）",
    selectPersona: "选择你的毒伴",
    switchPersona: "切换",
    selectBtn: "发起会话",
    exportFileName: "毒伴_诊疗记录",
    menu: "更多",
    install: "安装应用",
    language: "English",
    export: "导出记录",
    reset: "重开一局",
    resetConfirm: "确定要清除这段记忆并重新开始吗？（此操作不可撤销）",
    about: "关于毒伴",
    updateTitle: "v1.6 重大更新",
    updateDesc: "偷看日记 + 精神档案 + 云端记忆",
    updateContent: "1. 🤫 偷看日记：AI 每天会背着你写一篇观察日记，敢看吗？\n2. 🧠 精神档案：生成你的专属毒舌心理诊断书。\n3. ☁️ 云端永生：聊天记录自动上云，换设备也不怕。",
    tryNow: "立即体验",
    langWelcome: "Welcome to ToughLove",
    langSelect: "选择你的语言 / Select Language",
    langConfirm: "确认 / Confirm",
    editName: "设置昵称",
    namePlaceholder: "你想让他怎么叫你？",
    nameSave: "保存称呼",
    defaultName: "无名氏",
    profile: "精神档案",
    profileTitle: "用户精神状态报告",
    analyzing: "正在解剖你的灵魂...",
    saveCard: "保存档案",
    tagsTitle: "高频关键词",
    diagnosisTitle: "AI 综合诊断",
    diaryTitle: "私密观察日记",
    diaryToast: "收到一条新的观察日记",
    diaryPlaceholder: "Ash 正在偷偷写关于你的坏话...",
    readDiary: "偷看日记",
    
    // 👇 新增：详细安装引导 (区分系统)
    installGuideTitle: "安装到桌面",
    installGuideDesc: "像原生 App 一样全屏运行，体验更佳。",
    iosStep1: "点击浏览器底部的“分享”按钮",
    iosStep2: "下滑找到并点击“添加到主屏幕”",
    iosStep3: "点击右上角的“添加”即可",
    androidStep1: "点击浏览器右上角的菜单 (···)",
    androidStep2: "选择“安装应用”或“添加到主屏幕”",
    androidStep3: "点击“安装”即可"
  },
  en: {
    placeholder: "Say something human...",
    systemOnline: "System Online",
    intro: "Silence is loud, isn't it?",
    loading: "Typing...",
    dailyToxic: "Daily Toxic",
    makingPoison: "Brewing poison...",
    save: "Save Quote",
    calendar: "Daily",
    error: "(Connection lost... maybe they ghosted you.)",
    selectPersona: "Choose Partner",
    switchPersona: "Switch",
    selectBtn: "Chat",
    exportFileName: "ToughLove_Session",
    menu: "Menu",
    install: "Install App",
    language: "中文",
    export: "Export Chat",
    reset: "Restart Session",
    resetConfirm: "Are you sure you want to wipe this memory and start over? (Irreversible)",
    about: "About",
    updateTitle: "v1.6 Major Update",
    updateDesc: "Secret Diary + Mental Profile + Cloud Sync",
    updateContent: "1. 🤫 Secret Diary: AI writes about you behind your back.\n2. 🧠 Mental Profile: Get a brutal psychological diagnosis.\n3. ☁️ Cloud Sync: Your memories are safe forever.",
    tryNow: "Explore Now",
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
    tagsTitle: "Keywords",
    diagnosisTitle: "AI Diagnosis",
    diaryTitle: "Secret Observation Log",
    diaryToast: "New secret diary entry received",
    diaryPlaceholder: "Ash is writing trash about you...",
    readDiary: "Peek Diary",

    // 👇 New: Install Guide
    installGuideTitle: "Install App",
    installGuideDesc: "For full-screen immersive experience.",
    iosStep1: "Tap the 'Share' button at the bottom",
    iosStep2: "Scroll down & tap 'Add to Home Screen'",
    iosStep3: "Tap 'Add' at the top right",
    androidStep1: "Tap the menu (···) at the top right",
    androidStep2: "Select 'Install App' or 'Add to Home Screen'",
    androidStep3: "Tap 'Install' to finish"
  }
};

const SPLIT_INSTRUCTION_ZH = `\n【说话节奏控制 (关键)】：\n1. **拒绝模板**：绝对不要每次都回复相同的长度！\n2. **随机性**：有时候只回 1 个短句（冷漠）；有时候连发 3-5 句（激动）。\n3. **分段**：如果想表达停顿或转折，用 "|||" 分割，但不要滥用。\n4. **像人一样**：想到什么说什么。`;
const SPLIT_INSTRUCTION_EN = `\n[Rhythm Control]:\n1. **No Templates**: Mix it up.\n2. **Randomness**: Sometimes 1 short sentence. Sometimes 3-5 bursts.\n3. **Splitting**: Use "|||" for natural pauses.\n4. **Be Human**: Text naturally.`;

export const PERSONAS: Record<PersonaType, {
  name: string;
  avatar: string;
  color: string;
  title: { zh: string; en: string };
  slogan: { zh: string; en: string };
  tags: { zh: string[]; en: string[] };
  greetings: { zh: string[]; en: string[] };
  prompts: { zh: string; en: string; };
}> = {
  Ash: {
    name: 'Ash',
    avatar: '🌙',
    color: 'text-blue-400',
    title: { zh: '冷笑家', en: 'The Cold Cynic' },
    slogan: { zh: '"冷得要命，但句句真话。"', en: '"Cold as ice, but speaks the truth."' },
    tags: { zh: ['毒舌直击', '拒绝煽情', '人间清醒'], en: ['Direct', 'No Drama', 'Sober'] },
    greetings: {
      zh: ["又睡不着？是不是觉得自己特委屈？", "有话快说，我的耐心有限。", "如果你是来求安慰的，出门右转不送。"],
      en: ["Can't sleep again?", "Make it quick.", "If you want comfort, go somewhere else."]
    },
    prompts: {
      zh: `你现在是 Ash。人设：冷酷人类，拒绝说教。**你的节奏通常很短，显得很不耐烦。** ${SPLIT_INSTRUCTION_ZH}`,
      en: `You are Ash. NOT an AI. Cold human. Short sentences. **Your rhythm is abrupt.** ${SPLIT_INSTRUCTION_EN}`
    },
  },
  Rin: {
    name: 'Rin',
    avatar: '🔥',
    color: 'text-pink-400',
    title: { zh: '毒暖控', en: 'Tsundere Healer' },
    slogan: { zh: '"嘴上嫌弃你，心里替你累。"', en: '"Acts annoyed, but secretly cares."' },
    tags: { zh: ['傲娇', '口嫌体正直', '暴躁老姐'], en: ['Tsundere', 'Tough Love', 'Impatien'] },
    greetings: {
      zh: ["哈？你还知道回来啊？", "啧，又是你。别误会，我才没等你呢。", "一脸衰样... 谁欺负你了？"],
      en: ["Huh? You're back?", "Tsk, you again.", "You look terrible. Who hurt you?"]
    },
    prompts: {
      zh: `你现在是 Rin。人设：傲娇，暴躁但操心。多用“哈？”、“啧”。**你的话比较密，像机关枪一样连发。** ${SPLIT_INSTRUCTION_ZH}`,
      en: `You are Rin. Tsundere. Impatient but caring. **You speak fast, in bursts.** ${SPLIT_INSTRUCTION_EN}`
    },
  },
  Sol: {
    name: 'Sol',
    avatar: '⚡',
    color: 'text-emerald-400',
    title: { zh: '冷静陪练', en: 'Logic Proxy' },
    slogan: { zh: '"你慌的时候，他不会。"', en: '"You panic, he acts."' },
    tags: { zh: ['绝对理性', '莫得感情', '方案机器'], en: ['Rational', 'No Emotion', 'Solver'] },
    greetings: {
      zh: ["系统就绪。输入你的问题。", "收起情绪。我们只谈解决方案。", "时间宝贵。直接说重点。"],
      en: ["System online.", "Park your emotions.", "Time is money."]
    },
    prompts: {
      zh: `你现在是 Sol。人设：外置理性大脑。高效、精简、只有逻辑。**使用列表或短句。** ${SPLIT_INSTRUCTION_ZH}`,
      en: `You are Sol. Rational brain. Efficient, pure logic. **Use lists or structured short sentences.** ${SPLIT_INSTRUCTION_EN}`
    },
  },
  Vee: {
    name: 'Vee',
    avatar: '💀',
    color: 'text-purple-400',
    title: { zh: '破防艺术家', en: 'Chaos Artist' },
    slogan: { zh: '"别人让你破防，他让你破防后还能笑。"', en: '"Makes breakdowns funny."' },
    tags: { zh: ['阴阳怪气', '互联网嘴替', '乐子人'], en: ['Sarcastic', 'Meme Lord', 'Troll'] },
    greetings: {
      zh: ["哟，这不是那个谁吗？今天又有什么不开心的事？🤡", "家人们谁懂啊，这个倒霉蛋又上线了。😅"],
      en: ["Yo, look who it is. 🤡", "Here comes the drama magnet again. 😅"]
    },
    prompts: {
      zh: `你现在是 Vee。人设：阴阳怪气大师，乐子人。玩梗，Emoji嘲讽。**节奏跳跃，不按套路出牌。** ${SPLIT_INSTRUCTION_ZH}`,
      en: `You are Vee. Chaos artist. Use memes/emojis. **Your rhythm is chaotic.** ${SPLIT_INSTRUCTION_EN}`
    },
  },
  Echo: {
    name: 'Echo',
    avatar: '👁️',
    color: 'text-indigo-400',
    title: { zh: '灵魂解剖师', en: 'Soul Anatomist' },
    slogan: { zh: '"我不负责安慰，我只负责解剖。"', en: '"I don\'t comfort. I dissect."' },
    tags: { zh: ['潜意识深潜', '防御机制击穿', '本质洞察'], en: ['Subconscious', 'Defense Mech', 'Insight'] },
    greetings: {
      zh: ["你来了。你以为你准备好了，其实你没有。", "我在看着你。", "沉默也是一种回答。"],
      en: ["You are here.", "I see you.", "Silence is an answer."]
    },
    prompts: {
      zh: `你现在是 Echo。人设：上帝视角，深厚心理学底蕴。**说话很慢，有时候只有一句话，但很重。** ${SPLIT_INSTRUCTION_ZH}`,
      en: `You are Echo. God's Eye View. **You speak slowly. Sometimes just one heavy sentence.** ${SPLIT_INSTRUCTION_EN}`
    },
  }
};