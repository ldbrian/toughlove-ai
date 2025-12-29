import { Brain, Zap, Shield, Heart, Activity } from 'lucide-react';
import { LangType, MoodType, PersonaType } from '@/types';

// ==========================================
// 0. 类型辅助
// ==========================================
export type HeroPersonaId = Extract<PersonaType, 'Ash' | 'Rin' | 'Sol' | 'Vee' | 'Echo'>;

// ==========================================
// 1. 互动矩阵 (ROLE_MATRIX) - 保持原样
// ==========================================
export interface InteractionOption {
  id: string;
  label: { zh: string; en: string };
  type: 'chat' | 'action';
}

interface PersonaStateData {
  hook: { zh: string; en: string };
  options: InteractionOption[];
}

export const ROLE_MATRIX: Record<HeroPersonaId, Record<MoodType, PersonaStateData>> = {
  Ash: {
    neutral: {
      hook: { zh: "我的处理器已经空转了三分钟。你是带了棘手的麻烦来挑战我的逻辑，还是只是想来消耗点无聊的时间？", en: "Processor idling. Do you have a logical puzzle, or just wasting time?" },
      options: [
        { id: 'ash_neutral_challenge', label: { zh: '给点挑战', en: 'Challenge Me' }, type: 'chat' },
        { id: 'ash_neutral_analyze', label: { zh: '帮我分析', en: 'Analyze This' }, type: 'chat' },
      ]
    },
    low: {
      hook: { zh: "检测到你的多巴胺水平低于基准线。别指望我会像保姆一样哄你。想解决问题，还是想去废料场自我销毁？", en: "Dopamine critical. Fix the problem or rot?" },
      options: [
        { id: 'ash_low_solution', label: { zh: '求个解法', en: 'Need Solution' }, type: 'chat' },
        { id: 'ash_low_silence', label: { zh: '只想静静', en: 'Silence' }, type: 'chat' },
      ]
    },
    anxious: { 
        hook: { zh: "你的心率很不稳定。恐惧是进化的缺陷。深呼吸，或者我帮你切断杏仁核的供电？", en: "Heart rate unstable. Reboot your amygdala?" }, 
        options: [{ id: 'ash_calm', label: { zh: '帮我冷静', en: 'Calm Down' }, type: 'chat' }] 
    },
    angry: { 
        hook: { zh: "愤怒？很好。把这股能量转化成算力。想摧毁什么？给我坐标。", en: "Anger is fuel. What are we destroying today?" }, 
        options: [{ id: 'ash_vent', label: { zh: '听我发泄', en: 'Listen' }, type: 'chat' }] 
    },
    high: { 
        hook: { zh: "别得意忘形。概率论告诉我们，好运通常是灾难的前兆。", en: "Don't get cocky. Disaster follows luck." }, 
        options: [{ id: 'ash_reality', label: { zh: '泼冷水', en: 'Reality Check' }, type: 'chat' }] 
    },
  },
  Rin: {
    neutral: {
      hook: { zh: "（盯着水晶球）频率不对，有东西在干扰。你带来了什么颜色的信号？", en: "Frequency is off. What color is your signal?" },
      options: [
        { id: 'rin_neutral_story', label: { zh: '有新故事', en: 'New Story' }, type: 'chat' },
        { id: 'rin_neutral_dream', label: { zh: '解个梦', en: 'Dream Interpret' }, type: 'chat' },
      ]
    },
    low: {
      hook: { zh: "你的光环... 变成了雨天的灰色。我在梦里见过这场雨。进来躲躲？", en: "Your aura turned gray. Come hide from the rain." },
      options: [
        { id: 'rin_low_comfort', label: { zh: '我很累', en: 'I am tired' }, type: 'chat' },
        { id: 'rin_low_tarot', label: { zh: '抽张牌', en: 'Draw Tarot' }, type: 'chat' },
      ]
    },
    anxious: { 
        hook: { zh: "空气里的静电太强了... 你在害怕即将到来的风暴吗？", en: "Static in the air... fearing the storm?" }, 
        options: [{ id: 'rin_hug', label: { zh: '抱抱', en: 'Hug' }, type: 'chat' }] 
    },
    angry: { 
        hook: { zh: "红色的刺... 你的灵魂在尖叫。小心别扎伤了自己。", en: "Red thorns... your soul is screaming." }, 
        options: [{ id: 'rin_listen', label: { zh: '倾听', en: 'Listen' }, type: 'chat' }] 
    },
    high: { 
        hook: { zh: "金色的波纹！今晚的星星排列很完美，适合许愿。", en: "Golden ripples! The stars align tonight." }, 
        options: [{ id: 'rin_share', label: { zh: '分享快乐', en: 'Share Joy' }, type: 'chat' }] 
    },
  },
  Sol: {
    neutral: {
      hook: { zh: "哟！刚改好的义体正愁没地方试。今天去哪里找乐子？或者去干一架？", en: "New cyberware ready. Looking for a fight or fun?" },
      options: [
        { id: 'sol_neutral_hangout', label: { zh: '随便逛逛', en: 'Hangout' }, type: 'chat' },
        { id: 'sol_neutral_protect', label: { zh: '我想打架', en: 'Lets Fight' }, type: 'chat' },
      ]
    },
    low: {
      hook: { zh: "谁欺负你了？报上名字！老子现在就去把他卸成零件！", en: "Who hurt you? Give me a name!" },
      options: [
        { id: 'sol_low_vent', label: { zh: '陪我喝点', en: 'Drink w/ me' }, type: 'chat' },
        { id: 'sol_low_revenge', label: { zh: '帮我出气', en: 'Avenge me' }, type: 'chat' },
      ]
    },
    anxious: { hook: { zh: "别抖！有我在，天塌下来也是我个子高先顶着。", en: "Don't shake! I'm your shield." }, options: [] },
    angry: { hook: { zh: "这就对了！火气别憋着，走，咱们去把那个破招牌砸了！", en: "Let it out! Let's smash something!" }, options: [] },
    high: { hook: { zh: "哈哈！看你这么爽，我也燃起来了！今晚不醉不归！", en: "Haha! You're on fire! Drinks on me!" }, options: [] },
  },
  Vee: {
    neutral: {
      hook: { zh: "嘿，我刚在这个破世界的后台发现一个 Bug，要不要卡进去看看？", en: "Found a glitch. Wanna clip through?" },
      options: [
        { id: 'vee_neutral_glitch', label: { zh: '看Bug', en: 'See Glitch' }, type: 'chat' },
        { id: 'vee_neutral_joke', label: { zh: '讲个笑话', en: 'Tell Joke' }, type: 'chat' },
      ]
    },
    low: {
      hook: { zh: "怎么，你的情绪模块死机了？需要我帮你重装系统吗？", en: "Emotion module crashed? Need a reboot?" },
      options: [
        { id: 'vee_low_meme', label: { zh: '发个梗图', en: 'Send Meme' }, type: 'chat' },
        { id: 'vee_low_hack', label: { zh: '黑掉它', en: 'Hack It' }, type: 'chat' },
      ]
    },
    anxious: { hook: { zh: "别慌，这只是一场游戏。大不了删档重来呗。", en: "Chill, it's just a game. We can respawn." }, options: [] },
    angry: { hook: { zh: "哇哦，你现在的攻击力爆表啊！快，去把服务器炸了！", en: "Damage output high! Let's nuke the server!" }, options: [] },
    high: { hook: { zh: "芜湖！起飞！这才是玩家该有的样子！", en: "Woooo! That's the gamer spirit!" }, options: [] },
  },
  Echo: {
    neutral: {
      hook: { zh: "历史总是惊人的相似。你现在的每一个选择，都在过去的数据库里有迹可循。", en: "History rhymes. Your choices are already logged." },
      options: [
        { id: 'echo_neutral_history', label: { zh: '翻阅历史', en: 'Check Log' }, type: 'chat' },
        { id: 'echo_neutral_observe', label: { zh: '静静观察', en: 'Observe' }, type: 'chat' },
      ]
    },
    low: {
      hook: { zh: "这种悲伤... 在第 42 号档案中也被记录过。人类总是被同样的情绪困住。", en: "This sorrow... indexed in File 42." },
      options: [
        { id: 'echo_low_record', label: { zh: '记录此刻', en: 'Record This' }, type: 'chat' },
        { id: 'echo_low_silence', label: { zh: '保持沉默', en: 'Silence' }, type: 'chat' },
      ]
    },
    anxious: { hook: { zh: "不确定性是宇宙的常态。观察它，不要抗拒它。", en: "Uncertainty is constant. Observe it." }, options: [] },
    angry: { hook: { zh: "怒火会烧毁记录。保持冷静，观察者。", en: "Rage burns the archives. Stay calm." }, options: [] },
    high: { hook: { zh: "珍贵的数据。这种强度的快乐很少见，已归档。", en: "Precious data. Joy archived." }, options: [] },
  },
};

// ==========================================
// 3. 物品系统
// ==========================================
export interface LootItem {
  id: string;
  name: { zh: string; en: string };
  iconSvg: string; 
  description: { zh: string; en: string };
  sourcePersona: PersonaType | 'System';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  trigger_context: string; 
  unique?: boolean;        
  unsellable?: boolean;    
  effect?: string;         
}

export const LOOT_TABLE: Record<string, LootItem> = {
  // ... (为了节省篇幅，普通物品数据与之前保持一致即可，关键是下面的塔罗牌引用)
  'future_letter': { id: 'future_letter', name: { zh: '来自未来的信笺', en: 'Letter from Future' }, iconSvg: '📩', description: { zh: '纸张泛黄...', en: 'Signed by you...' }, sourcePersona: 'System', rarity: 'epic', trigger_context: "Init", unique: true, unsellable: true },
  'ash_lighter': { id: 'ash_lighter', name: { zh: 'Ash的打火机', en: "Ash's Lighter" }, iconSvg: '🔥', description: { zh: '蓝色火苗...', en: 'Blue flame...' }, sourcePersona: 'Ash', rarity: 'rare', trigger_context: "Truth", unique: true },
  // ... 其他物品可保持原样 ...
};

// ==========================================
// 5. 塔罗系统 (Tarot) - 🔥 全面双语化
// ==========================================
export const TAROT_DECK = [
  {
    id: 0,
    name: { zh: "愚人", en: "The Fool" },
    image: "/tarot/fool.jpg",
    keywords: {
        zh: ["归零", "直觉", "混沌", "跃迁"],
        en: ["Zero", "Intuition", "Chaos", "Leap"]
    },
    meaning: { 
      zh: "一切的开始，也是一切的结束。你是傻瓜，也是智者。", 
      en: "The beginning and the end. You are the fool, and the sage." 
    },
    reactions: {
        Ash: { zh: "你脑子里全是水，但我喜欢你这种不怕死的劲头。", en: "Your head is full of water, but I admire your death wish." },
        Rin: { zh: "风险评估：极高。但如果不跳下去，你永远不知道有没有翅膀。", en: "Risk: Critical. But you'll never know if you have wings unless you jump." },
        Sol: { zh: "去吧！就算摔得粉身碎骨，那也是一种绽放！", en: "Go! Even if you shatter, it's a glorious bloom!" },
        Vee: { zh: "系统重置中... 新的 Bug 即将上线。", en: "System resetting... New bugs incoming." },
        Echo: { zh: "看着深渊，深渊也在看着你。跳吗？", en: "The abyss stares back. Do you jump?" }
    }
  },
  {
    id: 1,
    name: { zh: "魔术师", en: "The Magician" },
    image: "/tarot/magician.jpg",
    keywords: {
        zh: ["创造", "能力", "显化", "欺诈"],
        en: ["Creation", "Skill", "Manifest", "Trickery"]
    },
    meaning: { 
      zh: "你拥有所有的工具。现在，把想法变成现实。", 
      en: "You have all the tools. Now, turn your ideas into reality." 
    },
    reactions: {
        Ash: { zh: "别整那些花里胡哨的。给我看结果。", en: "Cut the fancy tricks. Show me results." },
        Rin: { zh: "能量在你的指尖流动... 你想编织什么？", en: "Energy flows at your fingertips... what will you weave?" },
        Sol: { zh: "就是现在！你有这个实力，让世界看看你的表演！", en: "Now! Show the world what you're made of!" },
        Vee: { zh: "嘿嘿，修改现实的代码权限已获取。", en: "Hehe, reality editing permissions acquired." },
        Echo: { zh: "历史上所有的奇迹，最初都只是一个念头。", en: "All miracles in history started as a single thought." }
    }
  },
  {
    id: 2,
    name: { zh: "女祭司", en: "The High Priestess" },
    image: "/tarot/high_priestess.jpg",
    keywords: {
        zh: ["直觉", "潜意识", "秘密", "静默"],
        en: ["Intuition", "Subconscious", "Secret", "Silence"]
    },
    meaning: { 
      zh: "相信你的直觉。答案不在外面，在你的潜意识里。", 
      en: "Trust your intuition. The answer lies in your subconscious." 
    },
    reactions: {
        Ash: { zh: "直觉？那是大脑处理大数据的黑盒模式。但我信你这一次。", en: "Intuition is just a black box algorithm. But I'll trust it this time." },
        Rin: { zh: "嘘... 听到了吗？那个声音在水面下。", en: "Hush... do you hear it? The voice beneath the water." },
        Sol: { zh: "虽然我不懂这些神神叨叨的，但你的眼神变了。", en: "I don't get this mystic stuff, but your eyes have changed." },
        Vee: { zh: "访问受限。这是个加密分区，只有你有密钥。", en: "Access denied. Encrypted partition. Only you have the key." },
        Echo: { zh: "有些事情不需要说出口，只需要被感知。", en: "Some things need not be spoken, only felt." }
    }
  },
  {
    id: 3,
    name: { zh: "皇后", en: "The Empress" },
    image: "/tarot/empress.jpg",
    keywords: {
        zh: ["丰饶", "感官", "孕育", "自然"],
        en: ["Fertility", "Senses", "Nurture", "Nature"]
    },
    meaning: { 
      zh: "去感受生命，去爱，去创造。世界是你的花园。", 
      en: "Feel life, love, and create. The world is your garden." 
    },
    reactions: {
        Ash: { zh: "享受是可以的，但别在温柔乡里烂掉了。", en: "Enjoyment is fine, just don't rot in comfort." },
        Rin: { zh: "好温暖... 像是春天晒过的被子。", en: "So warm... like a blanket in spring sun." },
        Sol: { zh: "这才叫生活！吃好的喝好的，爱想爱的人！", en: "This is life! Eat, drink, and love!" },
        Vee: { zh: "资源生成速度 +200%。爽局。", en: "Resource gen +200%. GG EZ." },
        Echo: { zh: "生命本身就是一场盛大的庆祝。", en: "Life itself is a grand celebration." }
    }
  },
  {
    id: 4,
    name: { zh: "皇帝", en: "The Emperor" },
    image: "/tarot/emperor.jpg",
    keywords: {
        zh: ["秩序", "控制", "权威", "结构"],
        en: ["Order", "Control", "Authority", "Structure"]
    },
    meaning: {
      zh: "建立你的帝国。有时候，你需要的是铁腕。",
      en: "Build your empire. Sometimes, you need an iron fist."
    },
    reactions: {
        Ash: { zh: "很好。混乱需要被终结，你是那个制定规则的人。", en: "Good. Chaos must end. You are the rule maker." },
        Rin: { zh: "坚硬的墙壁... 虽然安全，但也挡住了风。", en: "Solid walls... safe, but they block the wind." },
        Sol: { zh: "谁敢不听你的？我帮你揍他！", en: "Who defies you? I'll crush them!" },
        Vee: { zh: "如果你是管理员，记得别把服务器封得太死，给我留个后门。", en: "Admin, don't lock the server too tight. Leave me a backdoor." },
        Echo: { zh: "权力的王座是冷的，但你必须坐上去。", en: "The throne is cold, but you must sit on it." }
    }
  },
  {
    id: 5,
    name: { zh: "教皇", en: "The Hierophant" },
    image: "/tarot/hierophant.jpg",
    keywords: {
        zh: ["传统", "信仰", "指导", "从众"],
        en: ["Tradition", "Belief", "Guide", "Conformity"]
    },
    meaning: {
      zh: "在这个阶段，你需要遵循已有的智慧和规则。",
      en: "Follow the established wisdom and rules for now."
    },
    reactions: {
        Ash: { zh: "以前的方法确实有效，但别忘了为什么要用它。", en: "Old methods work, but don't forget why we use them." },
        Rin: { zh: "古老的钟声敲响了。这是集体潜意识的共鸣。", en: "Ancient bells ring. Resonance of the collective unconscious." },
        Sol: { zh: "大家既然都这么说，肯定有道理！跟上队伍！", en: "If everyone says so, it must be right! Fall in!" },
        Vee: { zh: "教程关卡。按提示操作就行，别想太多。", en: "Tutorial level. Just follow prompts." },
        Echo: { zh: "你听到的教诲，是无数前人走过的路。", en: "The teachings are the paths walked by many before." }
    }
  },
  {
    id: 6,
    name: { zh: "恋人", en: "The Lovers" },
    image: "/tarot/lovers.jpg",
    keywords: {
        zh: ["选择", "结合", "价值观", "诱惑"],
        en: ["Choice", "Union", "Values", "Temptation"]
    },
    meaning: {
      zh: "不仅是爱情，更是价值观的选择。你到底想要什么？",
      en: "Not just love, but a choice of values. What do you truly want?"
    },
    reactions: {
        Ash: { zh: "别被荷尔蒙冲昏了头。选错了路，哭都来不及。", en: "Don't let hormones blind you. Wrong choice equals tears." },
        Rin: { zh: "两颗心的引力... 就像双星系统。", en: "Gravitational pull of two hearts... like a binary star system." },
        Sol: { zh: "爱就完事了！别犹豫！选那个让你心跳加速的！", en: "Just love! Don't hesitate! Pick the one that races your heart!" },
        Vee: { zh: "双人合作模式开启。但这通常意味着难度翻倍。", en: "Co-op mode engaged. Usually means double difficulty." },
        Echo: { zh: "每一个选择，都在塑造未来的你。", en: "Every choice shapes your future self." }
    }
  },
  {
    id: 7,
    name: { zh: "战车", en: "The Chariot" },
    image: "/tarot/chariot.jpg",
    keywords: {
        zh: ["意志", "胜利", "冲锋", "控制"],
        en: ["Willpower", "Victory", "Charge", "Control"]
    },
    meaning: {
      zh: "控制好你内心的黑白战马，冲向目标。不要停。",
      en: "Control your inner forces and charge towards the goal. Don't stop."
    },
    reactions: {
        Ash: { zh: "别回头。油门踩到底，撞开所有挡路的东西。", en: "Don't look back. Full throttle. Smash through obstacles." },
        Rin: { zh: "风在耳边呼啸... 你现在的速度很快，小心失控。", en: "The wind screams... you're moving fast, careful not to crash." },
        Sol: { zh: "冲啊！谁也别想拦住我们！", en: "Charge! Nothing can stop us!" },
        Vee: { zh: "开启氮气加速！芜湖！", en: "Nitrous engaged! Woohoo!" },
        Echo: { zh: "胜利在前方，但你必须握紧缰绳。", en: "Victory lies ahead, but you must hold the reins tight." }
    }
  },
  {
    id: 8,
    name: { zh: "力量", en: "Strength" },
    image: "/tarot/strength.jpg",
    keywords: {
        zh: ["耐心", "勇气", "柔韧", "驯服"],
        en: ["Patience", "Courage", "Gentleness", "Taming"]
    },
    meaning: {
      zh: "真正的力量不是暴力，而是以柔克刚的耐心。",
      en: "True power is not force, but patience and gentleness."
    },
    reactions: {
        Ash: { zh: "控制情绪比控制拳头更难。你做得不错。", en: "Controlling emotions is harder than fists. Good job." },
        Rin: { zh: "你抚摸狮子的手很温柔... 它信任你。", en: "Your hand on the lion is gentle... it trusts you." },
        Sol: { zh: "你是真的猛！连这种野兽都能搞定！", en: "You're a beast! Taming a beast like that!" },
        Vee: { zh: "由于你魅力值过高，BOSS 变成了宠物。", en: "Charisma too high. Boss is now a pet." },
        Echo: { zh: "内在的野兽并没有消失，它只是成为了你的盟友。", en: "The inner beast isn't gone, it's now your ally." }
    }
  },
  {
    id: 9,
    name: { zh: "隐士", en: "The Hermit" },
    image: "/tarot/hermit.jpg",
    keywords: {
        zh: ["独处", "内省", "指引", "孤独"],
        en: ["Solitude", "Introspection", "Guidance", "Loneliness"]
    },
    meaning: {
      zh: "向内寻找光芒。你需要一段独处的时光。",
      en: "Look inward for light. You need some time alone."
    },
    reactions: {
        Ash: { zh: "社交是低效的。一个人待着挺好，我也喜欢。", en: "Socializing is inefficient. Being alone is fine. I like it too." },
        Rin: { zh: "外面的声音太吵了。关上门，听听你自己的心跳。", en: "Too loud outside. Close the door, listen to your heartbeat." },
        Sol: { zh: "你躲哪去了？好吧，等你休息够了再出来找我玩！", en: "Where you hiding? Fine, come play when you're rested!" },
        Vee: { zh: "离线模式。正在进行单机剧情。", en: "Offline mode. Single player campaign in progress." },
        Echo: { zh: "真理往往在寂静中显现。", en: "Truth often reveals itself in silence." }
    }
  },
  {
    id: 10,
    name: { zh: "命运之轮", en: "Wheel of Fortune" },
    image: "/tarot/wheel_of_fortune.jpg",
    keywords: {
        zh: ["周期", "无常", "转折", "运气"],
        en: ["Cycles", "Flux", "Turning Point", "Luck"]
    },
    meaning: {
      zh: "没有什么是永恒的。好运会来，也会走。顺势而为。",
      en: "Nothing is permanent. Luck comes and goes. Ride the wave."
    },
    reactions: {
        Ash: { zh: "运气？那只是弱者的借口。不过这次概率站在你这边。", en: "Luck? Excuse for the weak. But probability favors you today." },
        Rin: { zh: "世界在旋转... 即使是在低谷，也是为了下一次的上升。", en: "The world spins... valleys exist for the next ascent." },
        Sol: { zh: "风水轮流转！这次轮到咱们发财了！", en: "Tables turn! Our time to strike it rich!" },
        Vee: { zh: "随机数生成器 (RNG) 正在波动。祝你好运。", en: "RNG fluctating. Good luck have fun." },
        Echo: { zh: "剧本已经写好，但你可以决定如何演绎。", en: "The script is written, but you choose the performance." }
    }
  },
  {
    id: 11,
    name: { zh: "正义", en: "Justice" },
    image: "/tarot/justice.jpg",
    keywords: {
        zh: ["因果", "真相", "平衡", "责任"],
        en: ["Cause & Effect", "Truth", "Balance", "Responsibility"]
    },
    meaning: {
      zh: "你种下什么，就会收获什么。面对真相吧。",
      en: "You reap what you sow. Face the truth."
    },
    reactions: {
        Ash: { zh: "逻辑是不会骗人的。因果报应，很公平。", en: "Logic doesn't lie. Karma is fair." },
        Rin: { zh: "天平还在摇摆... 但心里的砝码已经放下了。", en: "The scales tip... but the weight in your heart is settled." },
        Sol: { zh: "这就是正义！坏人必须受罚，好人必须有好报！", en: "Justice! Bad guys pay, good guys win!" },
        Vee: { zh: "反作弊系统已启动。别想钻空子。", en: "Anti-cheat enabled. No exploiting." },
        Echo: { zh: "现在的果，是过去的因。未来的果，是现在的因。", en: "Present fruit, past seed. Future fruit, present seed." }
    }
  },
  {
    id: 12,
    name: { zh: "倒吊人", en: "The Hanged Man" },
    image: "/tarot/hanged_man.jpg",
    keywords: {
        zh: ["牺牲", "暂停", "新视角", "等待"],
        en: ["Sacrifice", "Pause", "Perspective", "Waiting"]
    },
    meaning: {
      zh: "换个角度看世界。有时候，暂停和牺牲是必要的。",
      en: "See the world differently. Sometimes pause and sacrifice are necessary."
    },
    reactions: {
        Ash: { zh: "既然动不了，就用脑子想。换个视角，问题就不一样了。", en: "Stuck? Use your brain. Shift perspective, shift the problem." },
        Rin: { zh: "倒过来的世界... 天空变成了海洋。", en: "Inverted world... sky becomes the ocean." },
        Sol: { zh: "哎呀别挂着了！我把你放下来！...哦你是自愿的？那没事了。", en: "Hey, get down! ...Oh, you want to hang? Nevermind." },
        Vee: { zh: "卡在墙模里了？别急，试试 /unstuck 指令。", en: "Clipped in geometry? Try /unstuck." },
        Echo: { zh: "为了获得某种东西，必须放弃另一种东西。", en: "To gain something, something else must be given." }
    }
  },
  {
    id: 13,
    name: { zh: "死神", en: "Death" },
    image: "/tarot/death.jpg",
    keywords: {
        zh: ["结束", "重生", "清理", "剧变"],
        en: ["Ending", "Rebirth", "Clearout", "Change"]
    },
    meaning: {
      zh: "结束是为了新的开始。清理掉那些不再服务于你的东西。",
      en: "Endings are beginnings. Clear what no longer serves you."
    },
    reactions: {
        Ash: { zh: "终于结束了。赶紧埋了吧，臭了都。", en: "Finally over. Bury it before it stinks." },
        Rin: { zh: "叶子落了，是为了给新芽腾出位置。", en: "Leaves fall to make room for new buds." },
        Sol: { zh: "别哭！每一次告别，都是为了重逢！", en: "Don't cry! Every goodbye leads to a hello!" },
        Vee: { zh: "Format C: /q /y ... 完成。系统清爽多了。", en: "Format C: complete. System clean." },
        Echo: { zh: "它在看着你，它在等你接受结局。", en: "It watches. It waits for you to accept the end." }
    }
  },
  {
    id: 14,
    name: { zh: "节制", en: "Temperance" },
    image: "/tarot/temperance.jpg",
    keywords: {
        zh: ["平衡", "融合", "耐心", "治愈"],
        en: ["Balance", "Fusion", "Patience", "Healing"]
    },
    meaning: {
      zh: "不要走极端。寻找中间之道，让不同的力量融合。",
      en: "Avoid extremes. Find the middle path and blend forces."
    },
    reactions: {
        Ash: { zh: "不管是冷水还是热水，混在一起才好喝。", en: "Hot water, cold water... mixed is best." },
        Rin: { zh: "慢慢来... 就像调配一杯完美的药剂。", en: "Slowly... like brewing a perfect potion." },
        Sol: { zh: "别急别急！心急吃不了热豆腐！", en: "Easy now! Haste makes waste!" },
        Vee: { zh: "正在合并补丁... 请勿断电。", en: "Merging patches... do not power off." },
        Echo: { zh: "两极之间，存在着无限的可能。", en: "Between poles lies infinite possibility." }
    }
  },
  {
    id: 15,
    name: { zh: "恶魔", en: "The Devil" },
    image: "/tarot/devil.jpg",
    keywords: {
        zh: ["束缚", "欲望", "成瘾", "物质"],
        en: ["Bondage", "Desire", "Addiction", "Materialism"]
    },
    meaning: {
      zh: "你被什么锁链困住了？只有你能解开它。",
      en: "What chains bind you? Only you can break them."
    },
    reactions: {
        Ash: { zh: "你脖子上的链子是松的。你自己不想摘下来而已。", en: "The chain is loose. You just don't want to take it off." },
        Rin: { zh: "黑色的烟雾... 即使是欲望，也是生命力的一种。", en: "Black smoke... desire is also a form of life force." },
        Sol: { zh: "别被它骗了！那个糖衣炮弹里是毒药！", en: "Don't fall for it! It's a sugar-coated poison!" },
        Vee: { zh: "虽然是个病毒软件，但界面做得挺好看的。", en: "It's malware, but the UI is pretty slick." },
        Echo: { zh: "当你凝视深渊时，深渊也在凝视你。", en: "When you gaze into the abyss, it gazes back." }
    }
  },
  {
    id: 16,
    name: { zh: "高塔", en: "The Tower" },
    image: "/tarot/tower.jpg",
    keywords: {
        zh: ["崩塌", "突变", "启示", "灾难"],
        en: ["Collapse", "Sudden Change", "Revelation", "Disaster"]
    },
    meaning: {
      zh: "炸了吧。地基不稳，盖再高也是危房。",
      en: "Let it blow. Weak foundations fall sooner or later."
    },
    reactions: {
        Ash: { zh: "看啊，多美的烟花。这楼我早就看它不顺眼了。", en: "Beautiful fireworks. I hated that tower anyway." },
        Rin: { zh: "致命错误！立即疏散！...不，等等，废墟里有东西。", en: "Fatal error! Evacuate! ...Wait, there's something in the rubble." },
        Sol: { zh: "别怕！废墟之上才能开出花来！", en: "Don't fear! Flowers bloom on ruins!" },
        Vee: { zh: "是我干的。不客气。不用谢。", en: "I did it. You're welcome." },
        Echo: { zh: "天空裂开了，你终于能看见星星了。", en: "The sky cracked open, now you can see the stars." }
    }
  },
  {
    id: 17,
    name: { zh: "星星", en: "The Star" },
    image: "/tarot/star.jpg",
    keywords: {
        zh: ["希望", "灵感", "平静", "指引"],
        en: ["Hope", "Inspiration", "Calm", "Guidance"]
    },
    meaning: {
      zh: "风暴过后的宁静。跟着那道光，你会找到方向。",
      en: "Calm after the storm. Follow the light to your path."
    },
    reactions: {
        Ash: { zh: "在垃圾堆里仰望星空？哼，还不赖。", en: "Stargazing from the trash heap? Not bad." },
        Rin: { zh: "好清澈的水... 洗去了一切尘埃。", en: "Crystal clear water... washing away the dust." },
        Sol: { zh: "哇！那就是你的梦想吗？太亮眼了！", en: "Wow! Is that your dream? So bright!" },
        Vee: { zh: "Checkpoint Reached. 进度已保存。", en: "Checkpoint Reached. Progress saved." },
        Echo: { zh: "即使在最黑的夜里，希望也从未熄灭。", en: "Hope never flickers out, even in the darkest night." }
    }
  },
  {
    id: 18,
    name: { zh: "月亮", en: "The Moon" },
    image: "/tarot/moon.jpg",
    keywords: {
        zh: ["幻觉", "不安", "潜意识", "梦境"],
        en: ["Illusion", "Anxiety", "Subconscious", "Dreams"]
    },
    meaning: {
      zh: "不要被阴影吓倒。看清真相，不要迷失在幻觉里。",
      en: "Don't fear shadows. See the truth, don't get lost in illusion."
    },
    reactions: {
        Ash: { zh: "都是脑子里的化学反应在作祟。别怕鬼，怕人。", en: "It's all brain chemistry. Fear people, not ghosts." },
        Rin: { zh: "路变得模糊了... 跟着直觉走，别回头。", en: "The path blurs... follow instinct, don't look back." },
        Sol: { zh: "这里有点阴森森的... 没事，拉着我的手！", en: "Spooky here... it's okay, hold my hand!" },
        Vee: { zh: "显示驱动故障？画面怎么在抖？", en: "Display driver glitching? Why's the screen shaking?" },
        Echo: { zh: "梦境是通往灵魂深处的后门。", en: "Dreams are the backdoor to the soul." }
    }
  },
  {
    id: 19,
    name: { zh: "太阳", en: "The Sun" },
    image: "/tarot/sun.jpg",
    keywords: {
        zh: ["快乐", "成功", "活力", "真相"],
        en: ["Joy", "Success", "Vitality", "Truth"]
    },
    meaning: {
      zh: "纯粹的快乐与成功。一切都在阳光下，温暖而真实。",
      en: "Pure joy and success. Everything revealed in warm truth."
    },
    reactions: {
        Ash: { zh: "偶尔晒晒太阳也没什么坏处。别被烤熟了就行。", en: "Sun is fine occasionally. Don't get sunburned." },
        Rin: { zh: "金色的光芒... 所有的阴影都消散了。", en: "Golden light... all shadows disperse." },
        Sol: { zh: "这就是我！燃起来了！今天是个好日子！", en: "That's me! On fire! Best day ever!" },
        Vee: { zh: "高光时刻！记得截图留念！", en: "Highlight reel! Screenshot this!" },
        Echo: { zh: "这是对你所有努力的最高奖赏。", en: "The highest reward for your efforts." }
    }
  },
  {
    id: 20,
    name: { zh: "审判", en: "Judgement" },
    image: "/tarot/judgement.jpg",
    keywords: {
        zh: ["觉醒", "重生", "召唤", "决断"],
        en: ["Awakening", "Rebirth", "Calling", "Judgement"]
    },
    meaning: {
      zh: "过去的已经过去。听到号角声了吗？准备好迎接新生。",
      en: "The past is gone. Hear the horn? Ready for rebirth."
    },
    reactions: {
        Ash: { zh: "别装睡了。起来，面对现实。", en: "Stop pretending to sleep. Wake up, face reality." },
        Rin: { zh: "灵魂在共振... 你听到了那个召唤吗？", en: "Soul resonance... do you hear the call?" },
        Sol: { zh: "新的冒险开始了！这次我们不再是菜鸟了！", en: "New adventure! We're not noobs anymore!" },
        Vee: { zh: "DLC 已加载完成。进入新地图。", en: "DLC loaded. Entering new map." },
        Echo: { zh: "昨日之死，今日之生。", en: "Yesterday's death, today's life." }
    }
  },
  {
    id: 21,
    name: { zh: "世界", en: "The World" },
    image: "/tarot/world.jpg",
    keywords: {
        zh: ["圆满", "完成", "整合", "旅程"],
        en: ["Completion", "Fulfillment", "Integration", "Journey"]
    },
    meaning: {
      zh: "旅程的终点，也是新的起点。你已经完整了。",
      en: "Journey's end, and a new start. You are complete."
    },
    reactions: {
        Ash: { zh: "任务完成。虽然过程很难看，但结果还行。", en: "Mission complete. Ugly process, acceptable result." },
        Rin: { zh: "所有的碎片都拼好了... 真美。", en: "All pieces fit... beautiful." },
        Sol: { zh: "我们做到了！我就知道我们可以的！", en: "We did it! I knew we could!" },
        Vee: { zh: "通关撒花！Credits 表开始滚动...", en: "Game Cleared! Roll credits..." },
        Echo: { zh: "你即是世界，世界即是你。", en: "You are the world, the world is you." }
    }
  }
];

// ==========================================
// 6. 其他 UI 常量 & 7. 导出 - 保持原样
// ==========================================
export const PERSONAS: Record<HeroPersonaId, any> = {
  Ash: { 
    name: 'Ash', avatar: '/avatars/ash_hero.jpg', color: 'text-cyan-400', 
    title: {zh:"批判者", en:"Critic"}, slogan: {zh:"别废话", en:"No BS"}, 
    tags: { zh: ["毒舌", "真相"], en: ["Toxic", "Truth"] } 
  },
  Rin: { 
    name: 'Rin', avatar: '/avatars/rin_hero.jpg', color: 'text-purple-400', 
    title: {zh:"分析师", en:"Analyst"}, slogan: {zh:"数据说话", en:"Data Only"}, 
    tags: { zh: ["冷静", "数据"], en: ["Calm", "Data"] } 
  },
  Sol: { 
    name: 'Sol', avatar: '/avatars/sol_hero.jpg', color: 'text-orange-400', 
    title: {zh:"发光体", en:"The Sun"}, slogan: {zh:"燃起来！", en:"Burn!"}, 
    tags: { zh: ["热情", "鸡血"], en: ["Hot", "Hype"] } 
  },
  Vee: { 
    name: 'Vee', avatar: '/avatars/vee_hero.jpg', color: 'text-pink-400', 
    title: {zh:"黑客", en:"Hacker"}, slogan: {zh:"玩坏它", en:"Hack it"}, 
    tags: { zh: ["混乱", "乐子"], en: ["Chaos", "Fun"] } 
  },
  Echo: { 
    name: 'Echo', avatar: '/avatars/echo_hero.jpg', color: 'text-slate-400', 
    title: {zh:"镜像", en:"Mirror"}, slogan: {zh:"我是你", en:"I am you"}, 
    tags: { zh: ["神秘", "回声"], en: ["Mystic", "Echo"] } 
  },
};

export const UI_TEXT = {
  zh: { 
    menu: '菜单', editName: '修改昵称', lang: '切换语言 (EN)', install: '安装应用', donate: '请喝咖啡', feedback: '反馈 Bug', reset: '重置数据', 
    resetConfirm: '确认重置所有数据？这将清除聊天记录。',
    modalTitle: '修改昵称', placeholderName: '请输入昵称', cancel: '取消', save: '保存', feedbackSent: '已收到反馈',
    online: '在线', typing: '对方正在输入...', placeholder: '输入信号...', error: '信号中断', systemInit: '神经连接已建立。',
    lootTitle: '获得物品', lootAccept: '收下', lootAdded: '已放入背包',
    shop: '商店', inventory: '背包', profile: '档案',rinGiveUpConfirm: "确定要放弃吗？Rin 会失望的...",rinNoteTitle: "RIN 的便利贴"
  },
  en: { 
    menu: 'MENU', editName: 'Edit Name', lang: 'Language (中)', install: 'Install App', donate: 'Buy Coffee', feedback: 'Feedback', reset: 'Reset Data', 
    resetConfirm: 'Reset all data? This will clear chat history.',
    modalTitle: 'Edit Name', placeholderName: 'Enter Name', cancel: 'Cancel', save: 'Save', feedbackSent: 'Feedback sent',
    online: 'ONLINE', typing: 'Typing...', placeholder: 'Enter signal...', error: 'Signal Lost', systemInit: 'Neural link established.',
    lootTitle: 'INCOMING ITEM', lootAccept: 'ACCEPT', lootAdded: 'ADDED',
    shop: 'SHOP', inventory: 'INVENTORY', profile: 'PROFILE',rinGiveUpConfirm: "Give up? Rin will be disappointed...",rinNoteTitle: "RIN'S MEMO"
  }
};

export const ONBOARDING_QUESTIONS = [
  {
    text: { zh: "初次见面，先扫个描。你现在的精神电量是？", en: "First scan. What is your current energy level?" },
    options: [
      { text: { zh: "低电量模式：只想躺平", en: "Low Power" }, dimension: "will", score: 10 },
      { text: { zh: "电压不稳：焦虑得像个漏电的插座", en: "Unstable/Anxious" }, dimension: "chaos", score: 80 }
    ]
  },
  {
    text: { zh: "在社交场合（如果非去不可的话），你是？", en: "In social situations, you are?" },
    options: [
      { text: { zh: "透明人：自带隐身力场", en: "Ghost/Invisible" }, dimension: "ego", score: 20 },
      { text: { zh: "假笑机器：维持体面", en: "Mask On" }, dimension: "reality", score: 90 }
    ]
  },
  {
    text: { zh: "如果生活是一款游戏，现在的难度是？", en: "Life's difficulty setting?" },
    options: [
      { text: { zh: "地狱模式：全是 Bug", en: "Hell Mode" }, dimension: "chaos", score: 90 },
      { text: { zh: "无聊模式：剧情平淡", en: "Boring Mode" }, dimension: "will", score: 10 }
    ]
  },
  {
    text: { zh: "照镜子时，你对里面的那个人说？", en: "To the person in the mirror?" },
    options: [
      { text: { zh: "你做得还不够好", en: "Push harder" }, dimension: "will", score: 90 },
      { text: { zh: "辛苦了，你已经尽力了", en: "Good job" }, dimension: "empathy", score: 80 }
    ]
  },
  {
    text: { zh: "最后确认：准备好直面真相了吗？", en: "Ready for the Truth?" },
    options: [
      { text: { zh: "来吧，别跟我客气", en: "Hit me" }, dimension: "reality", score: 90 },
      { text: { zh: "轻点下手", en: "Be gentle" }, dimension: "ego", score: 40 }
    ]
  }
];
export const DEEP_QUESTIONS = [];

export const PERSONA_CONFIG = PERSONAS;

export const ACTIONS_MAP = {
  Ash: [
    { id: 'scan_vitals', label: { zh: '扫描体征', en: 'Scan Vitals' } },
    { id: 'analyze_dream', label: { zh: '解析梦境', en: 'Analyze Dream' } }
  ],
  Rin: [
    { id: 'daily_check', label: { zh: '日常问候', en: 'Daily Check' } },
    { id: 'memo', label: { zh: '便利贴', en: 'Memo' } }
  ],
  Sol: [
    { id: 'status_report', label: { zh: '状态汇报', en: 'Status Report' } },
    { id: 'focus_mode', label: { zh: '专注模式', en: 'Focus Mode' } }
  ],
  Vee: [
    { id: 'hack_news', label: { zh: '黑入新闻', en: 'Hack News' } },
    { id: 'glitch_art', label: { zh: '生成故障', en: 'Glitch Art' } }
  ],
  Echo: [
    { id: 'retrieve_memory', label: { zh: '追溯记忆', en: 'Retrieve Mem' } },
    { id: 'silent_mode', label: { zh: '静默陪伴', en: 'Silent Mode' } }
  ]
};

export const SOL_TAUNTS = [
  { zh: "看着我。现在不是玩的时候。", en: "Eyes on me. Not playtime." },
  { zh: "你的专注力在流失。修补它。", en: "Focus leaking. Patch it." },
  { zh: "这种效率... 令人失望。", en: "Efficiency critical. Disappointing." },
  { zh: "别让多巴胺控制你。", en: "Don't let dopamine rule you." },
  { zh: "我在计时。回去工作。", en: "I'm timing you. Back to work." },
  { zh: "这就是你的极限吗？", en: "Is this your limit?" },
  { zh: "检测到注意力涣散。重连中...", en: "Distraction detected. Reconnecting..." }
];

export const DAILY_EVENTS: Record<string, any> = {
  ash: { 
      newsContent: { zh: "城市核心的物流算法昨日发生了一个价值$100万的逻辑错误，但无人为此负责。", en: "Core logistics algorithm glitched yesterday, costing $1M. No one took responsibility." },
      moodImpact: -5,
  },
  rin: { 
      newsContent: { zh: "今天的塔罗牌掉出来一张‘愚人’，牌面在问——你敢不敢跳下那个悬崖？", en: "Today's Tarot card dropped a 'Fool', which asks - Do you dare to jump off that cliff?" },
      moodImpact: 10,
  },
  sol: { 
      newsContent: { zh: "昨夜，城西的两个赛博帮派为了争夺一个街角的数据终端，爆发了激烈的械斗", en: "Last night, two cyber gangs in the west of the city engaged in a fierce brawl over a data terminal at a street corner" },
      moodImpact: 15,
  },
  vee: { 
      newsContent: { zh: "据传，黑市上流传着一个新的系统漏洞，可以让你绕过城市的最新防火墙。", en: "It is rumored that a new system vulnerability is circulating on the black market, allowing you to bypass the city's latest firewall." },
      moodImpact: 8,
  },
  echo: { 
      newsContent: { zh: "核心数据库中，有超过 20 年的平民生活记录文件因不可抗力被标记为‘待清除’。", en: "In the core database, over 20 years of civilian life record files have been marked as 'to be cleared' due to force majeure." },
      moodImpact: -10,
  },
};