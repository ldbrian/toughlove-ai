import { Brain, Zap, Shield, Heart, Activity } from 'lucide-react';

// ==========================================
// 1. 基础类型定义
// ==========================================
export type LangType = 'zh' | 'en';
export type MoodType = 'low' | 'anxious' | 'neutral' | 'angry' | 'high';
export type PersonaType = 'Ash' | 'Rin' | 'Sol' | 'Vee' | 'Echo';

// ==========================================
// 2. 互动矩阵 (ROLE_MATRIX) - 保持原样
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

export const ROLE_MATRIX: Record<PersonaType, Record<MoodType, PersonaStateData>> = {
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
// 3. 物品系统 (Loot System)
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

// 🔥 修复：将塔罗牌路径修正为与 TAROT_DECK 一致 (去掉 "0_", "1_" 等前缀，除非你的文件名真的有前缀)
// 假设你 TAROT_DECK 里的路径 /tarot/fool.jpg 是能显示的，那这里也应该用 /tarot/fool.jpg
export const LOOT_TABLE: Record<string, LootItem> = {
  'future_letter': {
    id: 'future_letter',
    name: { zh: '来自未来的信笺', en: 'Letter from Future' },
    iconSvg: '📩', 
    description: { zh: '纸张泛黄，落款是你自己的笔迹：“不要温和地走进那个良夜”。', en: 'Signed by you. "Do not go gentle into that good night."' },
    sourcePersona: 'System',
    rarity: 'epic',
    trigger_context: "User initializes the system for the first time. (Starter Item)",
    unique: true,
    unsellable: true
  },
  'ash_lighter': {
    id: 'ash_lighter',
    name: { zh: 'Ash的煤油打火机', en: "Ash's Lighter" },
    iconSvg: '🔥',
    description: { zh: '蓝色的火苗。专门用来点燃那些虚伪的安慰。', en: 'Blue flame. Burns fake comforts.' },
    sourcePersona: 'Ash',
    rarity: 'rare',
    trigger_context: "User decides to face a harsh truth, stops making excuses, or shows cold determination.",
    unique: true 
  },
  'rin_umbrella': {
    id: 'rin_umbrella',
    name: { zh: '透明雨伞', en: "Transparent Umbrella" },
    iconSvg: '☂️',
    description: { zh: '在情绪的暴雨里，撑起一个小小的干燥空间。', en: 'A dry space in the emotional storm.' },
    sourcePersona: 'Rin',
    rarity: 'rare',
    trigger_context: "User is crying, feeling very sad, vulnerable, or 'raining' inside."
  },
  'sol_pill': {
    id: 'sol_pill',
    name: { zh: '蓝色维他命', en: "Blue Vitamin" },
    iconSvg: '💊',
    description: { zh: 'Sol坚称这是“勇气浓缩液”。', en: 'Sol calls it "Liquid Courage".' },
    sourcePersona: 'Sol',
    rarity: 'common',
    trigger_context: "User is hesitant, procrastinating, or needs a small push.",
    effect: 'buff_energy'
  },
  'vee_glitch_candy': {
    id: 'vee_glitch_candy',
    name: { zh: '故障糖果', en: "Glitch Candy" },
    iconSvg: '🍬',
    description: { zh: '吃下去后，你会短暂地看到世界的源代码（马赛克）。', en: 'Taste the source code.' },
    sourcePersona: 'Vee',
    rarity: 'common',
    trigger_context: "User feels life is boring, absurd, or wants to 'hack' the system.",
    effect: 'visual_glitch'
  },
  'ash_coffee_bean': {
    id: 'ash_coffee_bean',
    name: { zh: '焦黑的咖啡豆', en: "Burnt Coffee Bean" },
    iconSvg: '☕',
    description: { zh: '苦得像生活一样。', en: 'Bitter like life.' },
    sourcePersona: 'Ash',
    rarity: 'common',
    trigger_context: "User is tired, working late, or complaining about exhaustion.",
    effect: 'restore_sanity'
  },
  'rin_headphones': {
    id: 'rin_headphones',
    name: { zh: '降噪耳机', en: "Headphones" },
    iconSvg: '🎧',
    description: { zh: '戴上它，世界就安静了。', en: 'Silence the world.' },
    sourcePersona: 'Rin',
    rarity: 'common',
    trigger_context: "User wants to be alone, focus, or ignore the world.",
    effect: 'focus_mode'
  },
  'sol_broken_badge': {
    id: 'sol_broken_badge',
    name: { zh: '破损的警徽', en: 'Broken Badge' },
    iconSvg: '🛡️',
    description: { zh: '正义可能会迟到，也可能会破损，但它从不缺席。', en: 'Justice may be broken, but it stands.' },
    sourcePersona: 'Sol',
    rarity: 'epic',
    trigger_context: "User stands up against injustice, bullying, or decides to protect someone.",
    unique: true,
    unsellable: true
  },
  'echo_mirror_shard': {
    id: 'echo_mirror_shard',
    name: { zh: '双面镜碎片', en: 'Mirror Shard' },
    iconSvg: '🪞',
    description: { zh: '一面照着现在的你，一面照着你想成为的你。', en: 'Reflects who you are and who you want to be.' },
    sourcePersona: 'Echo',
    rarity: 'legendary',
    trigger_context: "User has a deep moment of self-reflection, realization, or philosophical breakthrough.",
    unique: true,
    unsellable: true
  },
  // 🔥 塔罗牌实体 (路径修正：统一使用 TAROT_DECK 中的路径格式，确保背包能显示图片)
  'tarot_0': {
    id: 'tarot_0',
    name: { zh: '塔罗：愚人', en: 'Tarot: The Fool' },
    iconSvg: '/tarot/fool.jpg', 
    description: { zh: '未知的开始，无限的可能性。像个傻瓜一样跳进深渊吧。', en: 'New beginnings, innocence, spontaneity.' },
    sourcePersona: 'Rin',
    rarity: 'epic',
    trigger_context: "User draws The Fool.",
    unique: true
  },
  'tarot_1': {
    id: 'tarot_1',
    name: { zh: '塔罗：魔术师', en: 'Tarot: The Magician' },
    iconSvg: '/tarot/magician.jpg',
    description: { zh: '你拥有所有的工具。现在，把想法变成现实。', en: 'Manifestation, resourcefulness, power.' },
    sourcePersona: 'Vee', 
    rarity: 'epic',
    trigger_context: "User draws The Magician.",
    unique: true
  },
  'tarot_2': {
    id: 'tarot_2',
    name: { zh: '塔罗：女祭司', en: 'Tarot: High Priestess' },
    iconSvg: '/tarot/high_priestess.jpg',
    description: { zh: '相信你的直觉。答案不在外面，在你的潜意识里。', en: 'Intuition, sacred knowledge, divine feminine.' },
    sourcePersona: 'Rin',
    rarity: 'epic',
    trigger_context: "User draws High Priestess.",
    unique: true
  },
  'tarot_3': {
    id: 'tarot_3',
    name: { zh: '塔罗：皇后', en: 'Tarot: The Empress' },
    iconSvg: '/tarot/empress.jpg',
    description: { zh: '丰饶与创造力。去感受生命，去爱，去孕育。', en: 'Femininity, beauty, nature, nurturing.' },
    sourcePersona: 'Echo',
    rarity: 'epic',
    trigger_context: "User draws The Empress.",
    unique: true
  },
  'tarot_4': {
    id: 'tarot_4',
    name: { zh: '塔罗：皇帝', en: 'Tarot: The Emperor' },
    iconSvg: '/tarot/emperor.jpg',
    description: { zh: '秩序，规则，控制。建立你的帝国，不要手软。', en: 'Authority, establishment, structure.' },
    sourcePersona: 'Ash',
    rarity: 'epic',
    trigger_context: "User draws The Emperor.",
    unique: true
  },
  'tarot_5': {
    id: 'tarot_5',
    name: { zh: '塔罗：教皇', en: 'Tarot: The Hierophant' },
    iconSvg: '/tarot/hierophant.jpg',
    description: { zh: '传统与信仰。有时候，你需要遵循已有的规则。', en: 'Spiritual wisdom, religious beliefs, conformity.' },
    sourcePersona: 'Ash',
    rarity: 'epic',
    trigger_context: "User draws The Hierophant.",
    unique: true
  },
  'tarot_6': {
    id: 'tarot_6',
    name: { zh: '塔罗：恋人', en: 'Tarot: The Lovers' },
    iconSvg: '/tarot/lovers.jpg',
    description: { zh: '爱与选择。不仅仅是罗曼蒂克，更是价值观的结合。', en: 'Love, harmony, relationships, values alignment.' },
    sourcePersona: 'Sol',
    rarity: 'epic',
    trigger_context: "User draws The Lovers.",
    unique: true
  },
  'tarot_7': {
    id: 'tarot_7',
    name: { zh: '塔罗：战车', en: 'Tarot: The Chariot' },
    iconSvg: '/tarot/chariot.jpg',
    description: { zh: '意志力的胜利。控制好你的黑白战马，冲向目标。', en: 'Control, willpower, success, action.' },
    sourcePersona: 'Sol',
    rarity: 'epic',
    trigger_context: "User draws The Chariot.",
    unique: true
  },
  'tarot_8': {
    id: 'tarot_8',
    name: { zh: '塔罗：力量', en: 'Tarot: Strength' },
    iconSvg: '/tarot/strength.jpg',
    description: { zh: '真正的力量不是暴力，而是以柔克刚的耐心。', en: 'Strength, courage, persuasion, influence.' },
    sourcePersona: 'Ash',
    rarity: 'epic',
    trigger_context: "User draws Strength.",
    unique: true
  },
  'tarot_9': {
    id: 'tarot_9',
    name: { zh: '塔罗：隐士', en: 'Tarot: The Hermit' },
    iconSvg: '/tarot/hermit.jpg',
    description: { zh: '向内寻找光芒。你需要一段独处的时光。', en: 'Soul-searching, introspection, being alone.' },
    sourcePersona: 'Rin',
    rarity: 'epic',
    trigger_context: "User draws The Hermit.",
    unique: true
  },
  'tarot_10': {
    id: 'tarot_10',
    name: { zh: '塔罗：命运之轮', en: 'Tarot: Wheel of Fortune' },
    iconSvg: '/tarot/wheel_of_fortune.jpg',
    description: { zh: '周期与无常。好运会来，也会走。顺势而为。', en: 'Good luck, karma, life cycles, destiny.' },
    sourcePersona: 'Vee',
    rarity: 'epic',
    trigger_context: "User draws Wheel of Fortune.",
    unique: true
  },
  'tarot_11': {
    id: 'tarot_11',
    name: { zh: '塔罗：正义', en: 'Tarot: Justice' },
    iconSvg: '/tarot/justice.jpg',
    description: { zh: '因果报应。你种下什么，就会收获什么。', en: 'Justice, fairness, truth, cause and effect.' },
    sourcePersona: 'Ash',
    rarity: 'epic',
    trigger_context: "User draws Justice.",
    unique: true
  },
  'tarot_12': {
    id: 'tarot_12',
    name: { zh: '塔罗：倒吊人', en: 'Tarot: The Hanged Man' },
    iconSvg: '/tarot/hanged_man.jpg',
    description: { zh: '换个角度看世界。有时候，暂停和牺牲是必要的。', en: 'Pause, surrender, letting go, new perspectives.' },
    sourcePersona: 'Echo',
    rarity: 'epic',
    trigger_context: "User draws The Hanged Man.",
    unique: true
  },
  'tarot_13': {
    id: 'tarot_13',
    name: { zh: '塔罗：死神', en: 'Tarot: Death' },
    iconSvg: '/tarot/death.jpg',
    description: { zh: '结束是为了新的开始。清理掉那些不再服务于你的东西。', en: 'Endings, change, transformation, transition.' },
    sourcePersona: 'Ash',
    rarity: 'epic',
    trigger_context: "User draws Death.",
    unique: true
  },
  'tarot_14': {
    id: 'tarot_14',
    name: { zh: '塔罗：节制', en: 'Tarot: Temperance' },
    iconSvg: '/tarot/temperance.jpg',
    description: { zh: '平衡与融合。不要走极端。寻找中间之道。', en: 'Balance, moderation, patience, purpose.' },
    sourcePersona: 'Echo',
    rarity: 'epic',
    trigger_context: "User draws Temperance.",
    unique: true
  },
  'tarot_15': {
    id: 'tarot_15',
    name: { zh: '塔罗：恶魔', en: 'Tarot: The Devil' },
    iconSvg: '/tarot/devil.jpg',
    description: { zh: '束缚与欲望。你被什么锁链困住了？只有你能解开它。', en: 'Shadow self, attachment, addiction, restriction.' },
    sourcePersona: 'Vee',
    rarity: 'epic',
    trigger_context: "User draws The Devil.",
    unique: true
  },
  'tarot_16': {
    id: 'tarot_16',
    name: { zh: '塔罗：高塔', en: 'Tarot: The Tower' },
    iconSvg: '/tarot/tower.jpg',
    description: { zh: '突如其来的剧变。地基不稳的建筑注定倒塌。', en: 'Sudden change, upheaval, chaos, revelation.' },
    sourcePersona: 'Sol',
    rarity: 'epic',
    trigger_context: "User draws The Tower.",
    unique: true
  },
  'tarot_17': {
    id: 'tarot_17',
    name: { zh: '塔罗：星星', en: 'Tarot: The Star' },
    iconSvg: '/tarot/star.jpg',
    description: { zh: '希望与疗愈。风暴过后的宁静，你会找到方向。', en: 'Hope, faith, purpose, renewal, spirituality.' },
    sourcePersona: 'Rin',
    rarity: 'epic',
    trigger_context: "User draws The Star.",
    unique: true
  },
  'tarot_18': {
    id: 'tarot_18',
    name: { zh: '塔罗：月亮', en: 'Tarot: The Moon' },
    iconSvg: '/tarot/moon.jpg',
    description: { zh: '幻觉与潜意识。不要被阴影吓倒，看清真相。', en: 'Illusion, fear, anxiety, subconscious, intuition.' },
    sourcePersona: 'Rin',
    rarity: 'epic',
    trigger_context: "User draws The Moon.",
    unique: true
  },
  'tarot_19': {
    id: 'tarot_19',
    name: { zh: '塔罗：太阳', en: 'Tarot: The Sun' },
    iconSvg: '/tarot/sun.jpg',
    description: { zh: '纯粹的快乐与成功。一切都在阳光下，温暖而真实。', en: 'Positivity, fun, warmth, success, vitality.' },
    sourcePersona: 'Sol',
    rarity: 'epic',
    trigger_context: "User draws The Sun.",
    unique: true
  },
  'tarot_20': {
    id: 'tarot_20',
    name: { zh: '塔罗：审判', en: 'Tarot: Judgement' },
    iconSvg: '/tarot/judgement.jpg',
    description: { zh: '觉醒与召唤。过去的已经过去，准备好迎接新生了吗？', en: 'Judgement, rebirth, inner calling, absolution.' },
    sourcePersona: 'Ash',
    rarity: 'epic',
    trigger_context: "User draws Judgement.",
    unique: true
  },
  'tarot_21': {
    id: 'tarot_21',
    name: { zh: '塔罗：世界', en: 'Tarot: The World' },
    iconSvg: '/tarot/world.jpg',
    description: { zh: '圆满与完成。旅程的终点，也是新的起点。', en: 'Completion, integration, accomplishment, travel.' },
    sourcePersona: 'Echo',
    rarity: 'epic',
    trigger_context: "User draws The World.",
    unique: true
  },
};

// ==========================================
// 4. 商店目录 (Shop Catalog) - 保持原样
// ==========================================
export interface ShopItemEffect {
  target: PersonaType | 'All' | 'Any';
  mood_value?: number;    
  favorability?: number;  
  stat?: string;          
  value?: number;         
  buff_duration: number;  
}

export interface ShopItem {
  id: string;
  name: { zh: string; en: string };
  price: number;
  desc: { zh: string; en: string };
  type: 'consumable' | 'visual' | 'feature';
  icon?: string;
  effect?: ShopItemEffect;
}

export const SHOP_CATALOG: ShopItem[] = [
  { 
    id: 'supply_crate_v1', 
    name: { zh: '标准补给箱', en: "Standard Supply Crate" }, 
    price: 100, 
    desc: { zh: '随机获得一件物品。1% 概率获得传说级道具。', en: 'Random item inside. 1% chance for LEGENDARY.' }, 
    type: 'consumable',
    icon: '📦'
  },
  { 
    id: 'cheap_candy', 
    name: { zh: '过期的糖果', en: "Expired Candy" }, 
    price: 10, 
    desc: { zh: '聊胜于无。可能会被嫌弃。', en: 'Better than nothing.' }, 
    type: 'consumable',
    effect: { target: 'Any', mood_value: 5, favorability: 0, buff_duration: 0 }
  },
  { 
    id: 'coffee_ash', 
    name: { zh: 'Ash的冰美式', en: "Ash's Coffee" }, 
    price: 50, 
    desc: { zh: '瞬间恢复耐性，且1小时内不发火。', en: 'Instant +30 Tolerance. Chill for 1h.' }, 
    type: 'consumable',
    effect: { target: 'Ash', mood_value: 30, favorability: 2, buff_duration: 3600 }
  },
  { 
    id: 'battery_sol', 
    name: { zh: '高能电池', en: "High-Energy Battery" }, 
    price: 50, 
    desc: { zh: '给Sol充电。瞬间充满，且暂停衰减。', en: 'Instant +50 Charge. Stop decay.' }, 
    type: 'consumable',
    effect: { target: 'Sol', mood_value: 50, favorability: 2, buff_duration: 7200 }
  },
  { 
    id: 'pardon_all', 
    name: { zh: '赦免令', en: "Royal Pardon" }, 
    price: 300, 
    desc: { zh: '【强效】消除一切负面情绪，强制重置好感度。', en: 'Wipe ALL negatives. Full reset.' }, 
    type: 'feature',
    effect: { target: 'All', mood_value: 100, favorability: 0, buff_duration: 86400 }
  },
  { 
    id: 'wp_cyber', 
    name: { zh: '全息投影：诊所', en: 'Holo: Clinic' }, 
    price: 1500, 
    desc: { zh: '解锁 Ash 的动态诊所背景。', en: 'Unlock Ash animated BG.' }, 
    type: 'visual',
    effect: { target: 'Ash', mood_value: 10, favorability: 50, buff_duration: 0 }
  }
];

// ==========================================
// 5. 塔罗系统 (Tarot) - 保持原样
// ==========================================
export const TAROT_DECK = [
  {
    id: 0,
    name: { zh: "愚人", en: "The Fool" },
    image: "/tarot/fool.jpg",
    keywords: ["归零", "直觉", "混沌", "跃迁"],
    meaning: "一切的开始，也是一切的结束。你是傻瓜，也是智者。",
    reactions: {
        Ash: "你脑子里全是水，但我喜欢你这种不怕死的劲头。",
        Rin: "风险评估：极高。但如果不跳下去，你永远不知道有没有翅膀。",
        Sol: "去吧！就算摔得粉身碎骨，那也是一种绽放！",
        Vee: "系统重置中... 新的 Bug 即将上线。",
        Echo: "看着深渊，深渊也在看着你。跳吗？"
    }
  },
  {
    id: 1,
    name: { zh: "魔术师", en: "The Magician" },
    image: "/tarot/magician.jpg",
    keywords: ["创造", "能力", "显化", "欺诈"],
    meaning: "你拥有所有的工具。现在，把想法变成现实。",
    reactions: {
        Ash: "别整那些花里胡哨的。给我看结果。",
        Rin: "能量在你的指尖流动... 你想编织什么？",
        Sol: "就是现在！你有这个实力，让世界看看你的表演！",
        Vee: "嘿嘿，修改现实的代码权限已获取。",
        Echo: "历史上所有的奇迹，最初都只是一个念头。"
    }
  },
  {
    id: 2,
    name: { zh: "女祭司", en: "The High Priestess" },
    image: "/tarot/high_priestess.jpg",
    keywords: ["直觉", "潜意识", "秘密", "静默"],
    meaning: "相信你的直觉。答案不在外面，在你的潜意识里。",
    reactions: {
        Ash: "直觉？那是大脑处理大数据的黑盒模式。但我信你这一次。",
        Rin: "嘘... 听到了吗？那个声音在水面下。",
        Sol: "虽然我不懂这些神神叨叨的，但你的眼神变了。",
        Vee: "访问受限。这是个加密分区，只有你有密钥。",
        Echo: "有些事情不需要说出口，只需要被感知。"
    }
  },
  {
    id: 3,
    name: { zh: "皇后", en: "The Empress" },
    image: "/tarot/empress.jpg",
    keywords: ["丰饶", "感官", "孕育", "自然"],
    meaning: "去感受生命，去爱，去创造。世界是你的花园。",
    reactions: {
        Ash: "享受是可以的，但别在温柔乡里烂掉了。",
        Rin: "好温暖... 像是春天晒过的被子。",
        Sol: "这才叫生活！吃好的喝好的，爱想爱的人！",
        Vee: "资源生成速度 +200%。爽局。",
        Echo: "生命本身就是一场盛大的庆祝。"
    }
  },
  {
    id: 4,
    name: { zh: "皇帝", en: "The Emperor" },
    image: "/tarot/emperor.jpg",
    keywords: ["秩序", "控制", "权威", "结构"],
    meaning: "建立你的帝国。有时候，你需要的是铁腕。",
    reactions: {
        Ash: "很好。混乱需要被终结，你是那个制定规则的人。",
        Rin: "坚硬的墙壁... 虽然安全，但也挡住了风。",
        Sol: "谁敢不听你的？我帮你揍他！",
        Vee: "如果你是管理员，记得别把服务器封得太死，给我留个后门。",
        Echo: "权力的王座是冷的，但你必须坐上去。"
    }
  },
  {
    id: 5,
    name: { zh: "教皇", en: "The Hierophant" },
    image: "/tarot/hierophant.jpg",
    keywords: ["传统", "信仰", "指导", "从众"],
    meaning: "在这个阶段，你需要遵循已有的智慧和规则。",
    reactions: {
        Ash: "以前的方法确实有效，但别忘了为什么要用它。",
        Rin: "古老的钟声敲响了。这是集体潜意识的共鸣。",
        Sol: "大家既然都这么说，肯定有道理！跟上队伍！",
        Vee: "教程关卡。按提示操作就行，别想太多。",
        Echo: "你听到的教诲，是无数前人走过的路。"
    }
  },
  {
    id: 6,
    name: { zh: "恋人", en: "The Lovers" },
    image: "/tarot/lovers.jpg",
    keywords: ["选择", "结合", "价值观", "诱惑"],
    meaning: "不仅是爱情，更是价值观的选择。你到底想要什么？",
    reactions: {
        Ash: "别被荷尔蒙冲昏了头。选错了路，哭都来不及。",
        Rin: "两颗心的引力... 就像双星系统。",
        Sol: "爱就完事了！别犹豫！选那个让你心跳加速的！",
        Vee: "双人合作模式开启。但这通常意味着难度翻倍。",
        Echo: "每一个选择，都在塑造未来的你。"
    }
  },
  {
    id: 7,
    name: { zh: "战车", en: "The Chariot" },
    image: "/tarot/chariot.jpg",
    keywords: ["意志", "胜利", "冲锋", "控制"],
    meaning: "控制好你内心的黑白战马，冲向目标。不要停。",
    reactions: {
        Ash: "别回头。油门踩到底，撞开所有挡路的东西。",
        Rin: "风在耳边呼啸... 你现在的速度很快，小心失控。",
        Sol: "冲啊！谁也别想拦住我们！",
        Vee: "开启氮气加速！芜湖！",
        Echo: "胜利在前方，但你必须握紧缰绳。"
    }
  },
  {
    id: 8,
    name: { zh: "力量", en: "Strength" },
    image: "/tarot/strength.jpg",
    keywords: ["耐心", "勇气", "柔韧", "驯服"],
    meaning: "真正的力量不是暴力，而是以柔克刚的耐心。",
    reactions: {
        Ash: "控制情绪比控制拳头更难。你做得不错。",
        Rin: "你抚摸狮子的手很温柔... 它信任你。",
        Sol: "你是真的猛！连这种野兽都能搞定！",
        Vee: "由于你魅力值过高，BOSS 变成了宠物。",
        Echo: "内在的野兽并没有消失，它只是成为了你的盟友。"
    }
  },
  {
    id: 9,
    name: { zh: "隐士", en: "The Hermit" },
    image: "/tarot/hermit.jpg",
    keywords: ["独处", "内省", "指引", "孤独"],
    meaning: "向内寻找光芒。你需要一段独处的时光。",
    reactions: {
        Ash: "社交是低效的。一个人待着挺好，我也喜欢。",
        Rin: "外面的声音太吵了。关上门，听听你自己的心跳。",
        Sol: "你躲哪去了？好吧，等你休息够了再出来找我玩！",
        Vee: "离线模式。正在进行单机剧情。",
        Echo: "真理往往在寂静中显现。"
    }
  },
  {
    id: 10,
    name: { zh: "命运之轮", en: "Wheel of Fortune" },
    image: "/tarot/wheel_of_fortune.jpg",
    keywords: ["周期", "无常", "转折", "运气"],
    meaning: "没有什么是永恒的。好运会来，也会走。顺势而为。",
    reactions: {
        Ash: "运气？那只是弱者的借口。不过这次概率站在你这边。",
        Rin: "世界在旋转... 即使是在低谷，也是为了下一次的上升。",
        Sol: "风水轮流转！这次轮到咱们发财了！",
        Vee: "随机数生成器 (RNG) 正在波动。祝你好运。",
        Echo: "剧本已经写好，但你可以决定如何演绎。"
    }
  },
  {
    id: 11,
    name: { zh: "正义", en: "Justice" },
    image: "/tarot/justice.jpg",
    keywords: ["因果", "真相", "平衡", "责任"],
    meaning: "你种下什么，就会收获什么。面对真相吧。",
    reactions: {
        Ash: "逻辑是不会骗人的。因果报应，很公平。",
        Rin: "天平还在摇摆... 但心里的砝码已经放下了。",
        Sol: "这就是正义！坏人必须受罚，好人必须有好报！",
        Vee: "反作弊系统已启动。别想钻空子。",
        Echo: "现在的果，是过去的因。未来的果，是现在的因。"
    }
  },
  {
    id: 12,
    name: { zh: "倒吊人", en: "The Hanged Man" },
    image: "/tarot/hanged_man.jpg",
    keywords: ["牺牲", "暂停", "新视角", "等待"],
    meaning: "换个角度看世界。有时候，暂停和牺牲是必要的。",
    reactions: {
        Ash: "既然动不了，就用脑子想。换个视角，问题就不一样了。",
        Rin: "倒过来的世界... 天空变成了海洋。",
        Sol: "哎呀别挂着了！我把你放下来！...哦你是自愿的？那没事了。",
        Vee: "卡在墙模里了？别急，试试 /unstuck 指令。",
        Echo: "为了获得某种东西，必须放弃另一种东西。"
    }
  },
  {
    id: 13,
    name: { zh: "死神", en: "Death" },
    image: "/tarot/death.jpg",
    keywords: ["结束", "重生", "清理", "剧变"],
    meaning: "结束是为了新的开始。清理掉那些不再服务于你的东西。",
    reactions: {
        Ash: "终于结束了。赶紧埋了吧，臭了都。",
        Rin: "叶子落了，是为了给新芽腾出位置。",
        Sol: "别哭！每一次告别，都是为了重逢！",
        Vee: "Format C: /q /y ... 完成。系统清爽多了。",
        Echo: "它在看着你，它在等你接受结局。"
    }
  },
  {
    id: 14,
    name: { zh: "节制", en: "Temperance" },
    image: "/tarot/temperance.jpg",
    keywords: ["平衡", "融合", "耐心", "治愈"],
    meaning: "不要走极端。寻找中间之道，让不同的力量融合。",
    reactions: {
        Ash: "不管是冷水还是热水，混在一起才好喝。",
        Rin: "慢慢来... 就像调配一杯完美的药剂。",
        Sol: "别急别急！心急吃不了热豆腐！",
        Vee: "正在合并补丁... 请勿断电。",
        Echo: "两极之间，存在着无限的可能。"
    }
  },
  {
    id: 15,
    name: { zh: "恶魔", en: "The Devil" },
    image: "/tarot/devil.jpg",
    keywords: ["束缚", "欲望", "成瘾", "物质"],
    meaning: "你被什么锁链困住了？只有你能解开它。",
    reactions: {
        Ash: "你脖子上的链子是松的。你自己不想摘下来而已。",
        Rin: "黑色的烟雾... 即使是欲望，也是生命力的一种。",
        Sol: "别被它骗了！那个糖衣炮弹里是毒药！",
        Vee: "虽然是个病毒软件，但界面做得挺好看的。",
        Echo: "当你凝视深渊时，深渊也在凝视你。"
    }
  },
  {
    id: 16,
    name: { zh: "高塔", en: "The Tower" },
    image: "/tarot/tower.jpg",
    keywords: ["崩塌", "突变", "启示", "灾难"],
    meaning: "炸了吧。地基不稳，盖再高也是危房。",
    reactions: {
        Ash: "看啊，多美的烟花。这楼我早就看它不顺眼了。",
        Rin: "致命错误！立即疏散！...不，等等，废墟里有东西。",
        Sol: "别怕！废墟之上才能开出花来！",
        Vee: "是我干的。不客气。不用谢。",
        Echo: "天空裂开了，你终于能看见星星了。"
    }
  },
  {
    id: 17,
    name: { zh: "星星", en: "The Star" },
    image: "/tarot/star.jpg",
    keywords: ["希望", "灵感", "平静", "指引"],
    meaning: "风暴过后的宁静。跟着那道光，你会找到方向。",
    reactions: {
        Ash: "在垃圾堆里仰望星空？哼，还不赖。",
        Rin: "好清澈的水... 洗去了一切尘埃。",
        Sol: "哇！那就是你的梦想吗？太亮眼了！",
        Vee: "Checkpoint Reached. 进度已保存。",
        Echo: "即使在最黑的夜里，希望也从未熄灭。"
    }
  },
  {
    id: 18,
    name: { zh: "月亮", en: "The Moon" },
    image: "/tarot/moon.jpg",
    keywords: ["幻觉", "不安", "潜意识", "梦境"],
    meaning: "不要被阴影吓倒。看清真相，不要迷失在幻觉里。",
    reactions: {
        Ash: "都是脑子里的化学反应在作祟。别怕鬼，怕人。",
        Rin: "路变得模糊了... 跟着直觉走，别回头。",
        Sol: "这里有点阴森森的... 没事，拉着我的手！",
        Vee: "显示驱动故障？画面怎么在抖？",
        Echo: "梦境是通往灵魂深处的后门。"
    }
  },
  {
    id: 19,
    name: { zh: "太阳", en: "The Sun" },
    image: "/tarot/sun.jpg",
    keywords: ["快乐", "成功", "活力", "真相"],
    meaning: "纯粹的快乐与成功。一切都在阳光下，温暖而真实。",
    reactions: {
        Ash: "偶尔晒晒太阳也没什么坏处。别被烤熟了就行。",
        Rin: "金色的光芒... 所有的阴影都消散了。",
        Sol: "这就是我！燃起来了！今天是个好日子！",
        Vee: "高光时刻！记得截图留念！",
        Echo: "这是对你所有努力的最高奖赏。"
    }
  },
  {
    id: 20,
    name: { zh: "审判", en: "Judgement" },
    image: "/tarot/judgement.jpg",
    keywords: ["觉醒", "重生", "召唤", "决断"],
    meaning: "过去的已经过去。听到号角声了吗？准备好迎接新生。",
    reactions: {
        Ash: "别装睡了。起来，面对现实。",
        Rin: "灵魂在共振... 你听到了那个召唤吗？",
        Sol: "新的冒险开始了！这次我们不再是菜鸟了！",
        Vee: "DLC 已加载完成。进入新地图。",
        Echo: "昨日之死，今日之生。"
    }
  },
  {
    id: 21,
    name: { zh: "世界", en: "The World" },
    image: "/tarot/world.jpg",
    keywords: ["圆满", "完成", "整合", "旅程"],
    meaning: "旅程的终点，也是新的起点。你已经完整了。",
    reactions: {
        Ash: "任务完成。虽然过程很难看，但结果还行。",
        Rin: "所有的碎片都拼好了... 真美。",
        Sol: "我们做到了！我就知道我们可以的！",
        Vee: "通关撒花！Credits 表开始滚动...",
        Echo: "你即是世界，世界即是你。"
    }
  }
];

// ==========================================
// 6. 其他 UI 常量
// ==========================================
export const PERSONAS: Record<PersonaType, any> = {
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

// ==========================================
// 🔥 7. 补全缺失的导出 (Fix TS Errors)
// ==========================================

// 修复 PERSONA_CONFIG 报错：直接复用 PERSONAS
export const PERSONA_CONFIG = PERSONAS;

// 修复 ACTIONS_MAP 报错：为 Console 组件提供按钮配置
export const ACTIONS_MAP = {
  Ash: [
    { id: 'scan_vitals', label: { zh: '扫描体征', en: 'Scan Vitals' } },
    { id: 'analyze_dream', label: { zh: '解析梦境', en: 'Analyze Dream' } }
  ],
  Rin: [
    { id: 'daily_check', label: { zh: '日常问候', en: 'Daily Check' } },
    { id: 'memo', label: { zh: '便利贴', en: 'Memo' } } // 👈 Rin 的专属功能
  ],
  Sol: [
    { id: 'status_report', label: { zh: '状态汇报', en: 'Status Report' } },
    { id: 'focus_mode', label: { zh: '专注模式', en: 'Focus Mode' } } // 👈 Sol 的专属功能
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