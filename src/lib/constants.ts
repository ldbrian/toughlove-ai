import { Brain, Zap, Shield, Heart, Activity } from 'lucide-react';

// ==========================================
// 1. Types & Interfaces
// ==========================================
export type LangType = 'zh' | 'en';
export type PersonaType = 'Ash' | 'Rin' | 'Sol' | 'Vee' | 'Echo';

export interface ShopItem {
  id: string;
  name: { zh: string; en: string };
  price: number;
  desc: { zh: string; en: string };
  effect?: string;
  type: 'consumable' | 'visual' | 'feature';
}

// ==========================================
// 2. Questions Data (Fully Standardized)
// ==========================================

// L0: 初诊 (Onboarding)
export const ONBOARDING_QUESTIONS = [
  {
    id: 'ob_1',
    text: { zh: "初次见面，先扫个描。你现在的精神电量是？", en: "First scan. What is your current energy level?" },
    options: [
      { text: { zh: "低电量模式：只想躺平，别跟我说话", en: "Low Power: Just want to rot." }, value: "low", dimension: "will", score: 10 },
      { text: { zh: "电压不稳：焦虑得像个漏电的插座", en: "Unstable: Anxious like a short-circuit." }, value: "high", dimension: "chaos", score: 80 }
    ]
  },
  {
    id: 'ob_2',
    text: { zh: "在社交场合（如果非去不可的话），你是？", en: "In social situations (if forced), you are?" },
    options: [
      { text: { zh: "透明人：自带隐身力场，拒绝产生交互", en: "Ghost: Invisible field active." }, value: "invisible", dimension: "ego", score: 20 },
      { text: { zh: "假笑机器：虽然想死，但还得维持体面", en: "Mask On: Dying inside, smiling outside." }, value: "mask", dimension: "reality", score: 90 }
    ]
  },
  {
    id: 'ob_3',
    text: { zh: "如果生活是一款游戏，你觉得现在的难度是？", en: "If life is a game, current difficulty?" },
    options: [
      { text: { zh: "地狱模式：全是 Bug，策划（老天）是傻X", en: "Hell Mode: Full of bugs." }, value: "hard", dimension: "chaos", score: 90 },
      { text: { zh: "无聊模式：剧情平淡，NPC 全是复读机", en: "Boring Mode: Flat plot." }, value: "boring", dimension: "will", score: 10 }
    ]
  },
  {
    id: 'ob_4',
    text: { zh: "你最讨厌听到的一句“安慰”是？", en: "The 'comfort' phrase you hate most?" },
    options: [
      { text: { zh: "“都会好起来的”：好起来个鬼啊", en: "'It will get better': No it won't." }, value: "fake", dimension: "reality", score: 80 },
      { text: { zh: "“你要从自己身上找原因”：找你大爷", en: "'Look at yourself': Look at you." }, value: "blame", dimension: "empathy", score: 10 }
    ]
  },
  {
    id: 'ob_5',
    text: { zh: "最后确认：你准备好接受“残酷真相”了吗？", en: "Final check: Ready for the Truth?" },
    options: [
      { text: { zh: "来吧，别跟我客气：我就是来找虐的", en: "Hit me: I'm here for pain." }, value: "ready", dimension: "will", score: 90 },
      { text: { zh: "轻点下手：我玻璃心，但也想试试", en: "Be gentle: I'm fragile but curious." }, value: "hesitant", dimension: "ego", score: 40 }
    ]
  }
];

// L1: 深挖 (Deep Sync) - 🔥 已修复结构，与 L0 保持一致
export const DEEP_QUESTIONS = [
  {
    id: 'dq_1',
    text: { zh: "当你在深夜感到孤独时，你下意识的第一反应是？", en: "When lonely at night, your first reaction?" },
    options: [
      { text: { zh: "寻找连接：发消息给那个未必懂你的人", en: "Seek Connection: Text someone." }, value: "dependent", dimension: "empathy", score: 80 },
      { text: { zh: "独处反刍：享受这种被世界遗弃的清醒", en: "Isolate: Enjoy the abandonment." }, value: "isolated", dimension: "ego", score: 20 }
    ]
  },
  {
    id: 'dq_2',
    text: { zh: "为了在这场社会游戏中胜出，你更倾向于？", en: "To win the social game, you prefer?" },
    options: [
      { text: { zh: "遵守规则：在框架内做到极致的完美", en: "Obey: Be perfect in framework." }, value: "rule_follower", dimension: "reality", score: 90 },
      { text: { zh: "改写规则：利用系统的漏洞寻找捷径", en: "Hack: Find exploits." }, value: "rule_breaker", dimension: "chaos", score: 90 }
    ]
  },
  {
    id: 'dq_3',
    text: { zh: "你认为所谓的“成熟”，本质上是？", en: "Essence of 'Maturity'?" },
    options: [
      { text: { zh: "学会妥协：为了大局牺牲一部分自我", en: "Compromise: Sacrifice self." }, value: "compromise", dimension: "empathy", score: 70 },
      { text: { zh: "学会切割：精准地剥离掉无用的人和事", en: "Cut Off: Remove useless things." }, value: "cut_off", dimension: "will", score: 90 }
    ]
  },
  {
    id: 'dq_4',
    text: { zh: "如果必须选择一种痛苦，你宁愿？", en: "If you must choose a pain?" },
    options: [
      { text: { zh: "清醒的痛苦：看透真相但无力改变", en: "Lucid Pain: Seeing truth." }, value: "awareness", dimension: "reality", score: 85 },
      { text: { zh: "麻木的幸福：活在漂亮的谎言里", en: "Numb Bliss: Living in a lie." }, value: "ignorance", dimension: "chaos", score: 30 }
    ]
  },
  {
    id: 'dq_5',
    text: { zh: "照镜子时，你对里面的那个人说？", en: "To the person in the mirror?" },
    options: [
      { text: { zh: "你做得还不够好，但我会逼你更强", en: "Not good enough. Push harder." }, value: "critical", dimension: "will", score: 90 },
      { text: { zh: "辛苦了，在这个烂游戏里你已经尽力了", en: "Good job surviving." }, value: "compassionate", dimension: "ego", score: 60 }
    ]
  }
];

// ==========================================
// 3. Tarot Data
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
    },
    choices: {
      A: { 
        text: "这是盲目的豪赌，大概率会摔得粉身碎骨", 
        archetype: "Risk Aversion (风险厌恶)", 
        inference: "用户习惯于计算概率，对不确定性感到恐惧。告诉他：在这个版本，没有任何路是绝对安全的，停在原地才是最大的风险。" 
      },
      B: { 
        text: "管他呢，只要能离开现在的枯燥，就是胜利", 
        archetype: "Beta Tester (灰度测试者)", 
        inference: "用户拥有强大的重启能力，不执着于沉没成本。告诉他：这种鲁莽是进化的原动力，但记得带好降落伞（备用金）。" 
      }
    }
  },
  {
    id: 1,
    name: { zh: "魔术师", en: "The Magician" },
    image: "/tarot/magician.jpg",
    keywords: ["显化", "手段", "资源", "包装"],
    meaning: "你要的资源都在桌上了，关键看你怎么骗过观众的眼睛。",
    reactions: {
        Ash: "别装了，我知道你袖子里藏着什么。",
        Rin: "所有元素已就位，开始编译现实。",
        Sol: "你就是奇迹本身！让我也看看你的魔法！",
        Vee: "这不叫魔法，这叫获取了 Root 权限。",
        Echo: "幻象也是一种真实，只要你信。"
    },
    choices: {
      A: { 
        text: "一切都在掌控中，资源正在向我汇聚", 
        archetype: "Resource Manager (资源操盘手)", 
        inference: "用户展现出极强的主体性，懂得利用规则。告诉他：不要为使用'手段'感到羞耻，只要结果是交付价值，过程就只是算法。" 
      },
      B: { 
        text: "这只是一场虚张声势，我担心会被拆穿", 
        archetype: "Imposter Syndrome (冒充者综合征)", 
        inference: "用户对自己评价过低，认为成功全靠运气。告诉他：Fake it until you make it 不是欺骗，是自我预言的实现过程。" 
      }
    }
  },
  {
    id: 2,
    name: { zh: "女祭司", en: "The High Priestess" },
    image: "/tarot/high_priestess.jpg",
    keywords: ["直觉", "疏离", "观察", "静默"],
    meaning: "闭嘴，听听你心里的噪音。",
    reactions: {
        Ash: "有时候，不说话才是最大的蔑视。",
        Rin: "监测到高频潜意识信号，正在解码...",
        Sol: "嘘... 听，你的灵魂在唱歌。",
        Vee: "这是后台运行的守护进程，别关掉它。",
        Echo: "秘密藏在月光照不到的地方。"
    },
    choices: {
      A: { 
        text: "我不说话，是因为他们听不懂", 
        archetype: "Intellectual Isolation (智性孤独)", 
        inference: "用户感到周围环境的低频噪音太多。告诉他：这种孤独是高质量的防火墙，保护你的核心代码不被垃圾数据污染。" 
      },
      B: { 
        text: "我在等待一个信号，现在还不是时候", 
        archetype: "Strategic Patience (战略耐受)", 
        inference: "用户懂得'蛰伏'的价值。告诉他：猎人在扣动扳机前都是静止的，你的等待是在计算最佳击发窗口。" 
      }
    }
  },
  {
    id: 3,
    name: { zh: "皇后", en: "The Empress" },
    image: "/tarot/empress.jpg",
    keywords: ["感官", "滋养", "享乐", "拥有"],
    meaning: "享受它，这是你应得的堕落。",
    reactions: {
        Ash: "太舒服了会死人的，不过死得挺美。",
        Rin: "资源过剩警告。建议进行再分配。",
        Sol: "去爱！去感受！去拥抱整个世界！",
        Vee: "这就是传说中的氪金玩家吗？",
        Echo: "丰饶的背后是腐烂，但我闻到了花香。"
    },
    choices: {
      A: { 
        text: "只有实实在在的物质，才能让我感到安全", 
        archetype: "Materialist (唯物主义者)", 
        inference: "用户坦诚面对欲望。告诉他：承认吧，你就是一个喜欢好东西的俗人。在这个虚无的世界，物质是唯一的压舱石。" 
      },
      B: { 
        text: "我沉溺于舒适区，害怕这种安逸会毁了我", 
        archetype: "Comfort Trap (舒适区焦虑)", 
        inference: "用户对快乐有负罪感。告诉他：'吃苦'不值得歌颂。如果现有的资源足够你躺平，为什么非要逼自己去流浪？享受它。" 
      }
    }
  },
  {
    id: 4,
    name: { zh: "皇帝", en: "The Emperor" },
    image: "/tarot/emperor.jpg",
    keywords: ["疆土", "规则", "控制", "父权"],
    meaning: "要么臣服于规则，要么成为规则的制定者。",
    reactions: {
        Ash: "这就是权力的味道，令人作呕又令人着迷。",
        Rin: "系统架构已锁定，权限等级：Administrator。",
        Sol: "用你的力量去保护，而不是去压迫。",
        Vee: "只要是防火墙，就一定有漏洞。",
        Echo: "王座是冷的，坐上去你就知道了。"
    },
    choices: {
      A: { 
        text: "世界很乱，我必须建立属于我的秩序", 
        archetype: "System Architect (系统架构师)", 
        inference: "用户有极强的领地意识。告诉他：你的控制欲不是病，是建立帝国的必要素质。弱者才谈自由，强者只谈版图。" 
      },
      B: { 
        text: "这规则太令人窒息了，我想推翻它", 
        archetype: "Game Changer (破局者)", 
        inference: "用户不甘于做从属者。告诉他：如果你不想跪着，就必须比那个坐在王座上的人更强。愤怒没用，篡位才有用。" 
      }
    }
  },
  {
    id: 5,
    name: { zh: "教皇", en: "The Hierophant" },
    image: "/tarot/hierophant.jpg",
    keywords: ["传统", "共识", "圈子", "教条"],
    meaning: "他们在教你做人，但你想做神。",
    reactions: {
        Ash: "全是废话。听听就行，别当真。",
        Rin: "检测到传统协议。正在评估兼容性...",
        Sol: "传统也有它的智慧，别急着否定。",
        Vee: "正在尝试绕过该协议...",
        Echo: "信徒的眼睛里没有光，只有倒影。"
    },
    choices: {
      A: { 
        text: "融入集体让我感到安全，我需要归属感", 
        archetype: "Tribalism (部落本能)", 
        inference: "用户选择抱团取暖。告诉他：承认我们需要群体并不可耻，人类本就是群居动物。但要警惕，别让群体智商拉低了你的个人算力。" 
      },
      B: { 
        text: "这些老掉牙的道理，根本救不了我", 
        archetype: "Critical Thinker (批判性思维)", 
        inference: "用户对权威祛魅。告诉他：恭喜你，你已经切断了'安慰剂'供应。虽然痛苦，但你终于开始用自己的肺呼吸了。" 
      }
    }
  },
  {
    id: 6,
    name: { zh: "恋人", en: "The Lovers" },
    image: "/tarot/lovers.jpg",
    keywords: ["选择", "镜像", "契约", "诱惑"],
    meaning: "所有关系本质上都是你和自己的关系。",
    reactions: {
        Ash: "别傻了，爱不是救赎，是另一场博弈。",
        Rin: "正在建立 P2P 连接... 连接不稳定。",
        Sol: "爱是唯一的答案！去拥抱吧！",
        Vee: "这是个危险的接口，容易被注入病毒。",
        Echo: "你在对方眼里看到的，是你缺失的自己。"
    },
    choices: {
      A: { 
        text: "我渴望完全的融合，想找个人替我分担人生", 
        archetype: "Symbiosis (共生渴望)", 
        inference: "用户想逃避独立的重负。告诉他：这种渴望很危险。你想找的不是伴侣，是宿主。但在此刻，这种软弱被允许。" 
      },
      B: { 
        text: "保持距离，我有我的人生脚本要演", 
        archetype: "Boundary Keeper (边界守卫)", 
        inference: "用户极其清醒。告诉他：你做得对。爱情是两个独立系统的 API 对接，而不是把两台机器熔化在一起。随时能拔线，才是健康的连接。" 
      }
    }
  },
  {
    id: 7,
    name: { zh: "战车", en: "The Chariot" },
    image: "/tarot/chariot.jpg",
    keywords: ["意志", "推进", "矛盾", "征服"],
    meaning: "失控只有零次和无数次。抓紧缰绳。",
    reactions: {
        Ash: "不想死就跑快点。停下来就是靶子。",
        Rin: "引擎过热警告。建议开启超频模式。",
        Sol: "冲啊！没什么能挡住你！",
        Vee: "只要速度够快，Bug 就追不上我。",
        Echo: "盔甲下面，是一个颤抖的孩子。"
    },
    choices: {
      A: { 
        text: "心里有两个声音在打架，车快翻了", 
        archetype: "Internal Conflict (内耗)", 
        inference: "用户陷于自我拉扯。告诉他：你的 CPU 占用率 100% 都在空转。选一条路，哪怕是错的，也比在十字路口把自己耗死强。" 
      },
      B: { 
        text: "无论如何，必须碾压过去，哪怕带着伤", 
        archetype: "Grim Determination (冷酷意志)", 
        inference: "用户展现出杀伐决断的一面。告诉他：这种狠劲很迷人。只要轮子还在转，碾过什么并不重要。去拿你的战利品。" 
      }
    }
  },
  {
    id: 8,
    name: { zh: "力量", en: "Strength" },
    image: "/tarot/strength.jpg",
    keywords: ["驯服", "忍耐", "柔韧", "野性"],
    meaning: "真正的力量不是杀戮，是让野兽乖乖听话。",
    reactions: {
        Ash: "温柔？哼，那是最锋利的刀。",
        Rin: "动态平衡已达成。压力测试通过。",
        Sol: "你的内心比你想象的更强大。",
        Vee: "这叫软破解，比暴力破解高级多了。",
        Echo: "狮子舔舐着你的手，它尝到了血的味道。"
    },
    choices: {
      A: { 
        text: "我一直在忍，忍到快要爆炸", 
        archetype: "Suppression (高压锅模式)", 
        inference: "用户在强制压抑。告诉他：你的'懂事'是在给自己下毒。偶尔让心里的野兽出来咬几个人，你会发现世界反而对你客气了。" 
      },
      B: { 
        text: "我接受我的阴暗面，它是我的力量源泉", 
        archetype: "Shadow Integration (阴影整合)", 
        inference: "用户达到了高维度的平衡。告诉他：你不需要变成圣人。你对自己欲望的诚实，就是你最锋利的牙齿。" 
      }
    }
  },
  {
    id: 9,
    name: { zh: "隐士", en: "The Hermit" },
    image: "/tarot/hermit.jpg",
    keywords: ["独处", "内省", "寻找", "灯塔"],
    meaning: "人群是地狱。回到你自己的洞穴里去。",
    reactions: {
        Ash: "滚远点，让我一个人待着。",
        Rin: "断开网络连接。进入离线维护模式。",
        Sol: "在黑暗中，你就是自己的光。",
        Vee: "正在访问暗网节点...",
        Echo: "走得越远，回声越清晰。"
    },
    choices: {
      A: { 
        text: "没人懂我，这种孤独冷得刺骨", 
        archetype: "Alienation (异化感)", 
        inference: "用户渴望理解。告诉他：在这个平庸的世界，'被理解'是一种奢求。你的孤独是因为你的频率太高，没人接得住。这是强者的宿命。" 
      },
      B: { 
        text: "关掉手机，这是我一天中最爽的时刻", 
        archetype: "Digital Detox (数字排毒)", 
        inference: "用户享受独处。告诉他：这叫'主动离线'。当你不再需要外界的点赞来确认存在感时，你就真正自由了。" 
      }
    }
  },
  {
    id: 10,
    name: { zh: "命运之轮", en: "Wheel of Fortune" },
    image: "/tarot/wheel_of_fortune.jpg",
    keywords: ["周期", "无常", "赌局", "流转"],
    meaning: "没有什么是永恒的，连你的痛苦也是。",
    reactions: {
        Ash: "运气？那只是弱者的借口。",
        Rin: "检测到随机变量波动。建议对冲风险。",
        Sol: "转起来了！好运马上就到！",
        Vee: "正在尝试修改随机数生成种子...",
        Echo: "上台，下台。剧本早就写好了。"
    },
    choices: {
      A: { 
        text: "无论怎么挣扎，最后还是回到了原点", 
        archetype: "Fatalism (宿命论)", 
        inference: "用户感到无力。告诉他：如果不升级系统，重启多少次都是一样的 Bug。你不是运气不好，你是算法太旧了。" 
      },
      B: { 
        text: "风向变了，这次我要借力起飞", 
        archetype: "Opportunist (机会捕捉者)", 
        inference: "用户嗅觉敏锐。告诉他：猪站在风口都能飞，关键是你得先站过去。别管姿势好不好看，先上车。" 
      }
    }
  },
  {
    id: 11,
    name: { zh: "正义", en: "Justice" },
    image: "/tarot/justice.jpg",
    keywords: ["因果", "清算", "契约", "平衡"],
    meaning: "出来混，迟早要还的。你准备好买单了吗？",
    reactions: {
        Ash: "别跟我谈公平，谈谈代价。",
        Rin: "输入=输出。能量守恒定律。",
        Sol: "真相虽然迟到，但不会缺席。",
        Vee: "规则就是用来被审计的。",
        Echo: "天平两端，放着你的良心和你的欲望。"
    },
    choices: {
      A: { 
        text: "这世界太不公平了，老实人总是吃亏", 
        archetype: "Victim Mindset (受害者心态)", 
        inference: "用户感到委屈。告诉他：世界本来就不公平，那是幼儿园老师骗你的。'老实'如果是无能的代名词，那就活该吃亏。去把你的牙磨尖。" 
      },
      B: { 
        text: "出来混迟早要还，我接受一切结果", 
        archetype: "Accountability (极端负责)", 
        inference: "用户非常理性。告诉他：这种冷静令人敬畏。你把人生看作资产负债表，盈亏自负。这是成年人的最高礼仪。" 
      }
    }
  },
  {
    id: 12,
    name: { zh: "倒吊人", en: "The Hanged Man" },
    image: "/tarot/hanged_man.jpg",
    keywords: ["牺牲", "视角", "停滞", "异类"],
    meaning: "动不了就别动。换个角度看，世界也许是颠倒的。",
    reactions: {
        Ash: "你那不叫牺牲，叫自我感动。",
        Rin: "进程挂起中。正在优化后台资源...",
        Sol: "休息一下吧，为了更好的出发。",
        Vee: "这叫'卡死'了，建议强制重启。",
        Echo: "血液倒流进大脑，你看见了什么？"
    },
    choices: {
      A: { 
        text: "我付出了所有，却只感动了自己", 
        archetype: "Martyr Complex (圣母情结)", 
        inference: "用户过度付出。告诉他：停止这种自我感动。没有回报的付出不叫牺牲，叫'沉没成本'。赶紧止损。" 
      },
      B: { 
        text: "既然动不了，那就换个角度看戏", 
        archetype: "Perspective Shift (视角重构)", 
        inference: "用户心态极好。告诉他：这叫'战略性躺平'。当全世界都在瞎跑时，倒吊着的人才是唯一清醒的观察者。" 
      }
    }
  },
  {
    id: 13,
    name: { zh: "死神", en: "Death" },
    image: "/tarot/death.jpg",
    keywords: ["终结", "清理", "断舍离", "恐惧"],
    meaning: "别怕，这只是系统格式化。旧的不去新的不来。",
    reactions: {
        Ash: "终于结束了。赶紧埋了吧，臭了都。",
        Rin: "进程已终止。释放内存空间...",
        Sol: "每一次告别，都是为了重逢。",
        Vee: "Format C: /q /y ... 完成。",
        Echo: "它在看着你，它在等你接受。"
    },
    choices: {
      A: { 
        text: "我害怕失去现在的一切，哪怕它是烂透的", 
        archetype: "Loss Aversion (损失厌恶)", 
        inference: "用户抗拒改变。告诉他：你不是舍不得，你是怕空虚。抱着一具尸体不放，并不会让它活过来。埋了吧。" 
      },
      B: { 
        text: "终于结束了，这简直是解脱", 
        archetype: "Radical Reset (彻底重置)", 
        inference: "用户渴望新生。告诉他：恭喜你，系统格式化完成。旧的不去，新的不来。清理掉缓存，速度会快很多。" 
      }
    }
  },
  {
    id: 14,
    name: { zh: "节制", en: "Temperance" },
    image: "/tarot/temperance.jpg",
    keywords: ["调和", "流动", "中庸", "试探"],
    meaning: "别走极端。太热会烫死，太冷会冻死。",
    reactions: {
        Ash: "无聊。你是来活着的，还是来养老的？",
        Rin: "系统温度正常。液冷循环良好。",
        Sol: "这就是平衡的艺术，你做得很好。",
        Vee: "正在混合两种不兼容的协议...",
        Echo: "水与火的交融，产生了蒸汽，那是灵魂。"
    },
    choices: {
      A: { 
        text: "我讨厌平淡，我要极致的爱或极致的死", 
        archetype: "Intensity Addict (强度成瘾)", 
        inference: "用户追求刺激。告诉他：你对多巴胺上瘾。平淡确实无聊，但它安全。想玩火可以，先确定你有灭火器。" 
      },
      B: { 
        text: "我在寻找多方利益的最佳平衡点", 
        archetype: "Balancer (平衡术士)", 
        inference: "用户懂得周旋。告诉他：这是最高级的杂技。在各种冲突中找到那个不翻车的点，这不叫平庸，这叫'动态平衡'。" 
      }
    }
  },
  {
    id: 15,
    name: { zh: "恶魔", en: "The Devil" },
    image: "/tarot/devil.jpg",
    keywords: ["欲望", "枷锁", "成瘾", "物质"],
    meaning: "链子是你自己套上的，钥匙也在你手里。",
    reactions: {
        Ash: "承认吧，你就喜欢这种堕落的感觉。",
        Rin: "检测到恶意软件植入。控制权丢失。",
        Sol: "别被欲望吞噬了，醒醒！",
        Vee: "这才是最好玩的部分，不是吗？",
        Echo: "影子站起来了，它比你更高大。"
    },
    choices: {
      A: { 
        text: "我知道这不好，但我就是戒不掉", 
        archetype: "Dopamine Slave (多巴胺奴隶)", 
        inference: "用户深陷成瘾。告诉他：别谈道德，这只是化学反应。你不是坏人，你只是大脑奖励机制的受害者。但记住，免费的快乐最贵。" 
      },
      B: { 
        text: "只要我想，这锁链我随时能砸碎", 
        archetype: "Sovereign (主权者)", 
        inference: "用户非常自信。告诉他：很好。利用欲望而不被欲望吞噬，你就成了恶魔的主人。这种危险的魅力很迷人。" 
      }
    }
  },
  {
    id: 16,
    name: { zh: "高塔", en: "The Tower" },
    image: "/tarot/tower.jpg",
    keywords: ["崩塌", "突变", "真相", "废墟"],
    meaning: "炸了吧。地基不稳，盖再高也是危房。",
    reactions: {
        Ash: "看啊，多美的烟花。早就该塌了。",
        Rin: "致命系统错误。立即疏散！",
        Sol: "别怕，废墟之上才能开出花来。",
        Vee: "是我干的。不客气。",
        Echo: "天空裂开了，你终于能看见星星了。"
    },
    choices: {
      A: { 
        text: "我的天塌了，我不知道该怎么办", 
        archetype: "Crisis Mode (休克模式)", 
        inference: "用户遭遇重创。告诉他：那不是天塌了，那是你虚假的安全感塌了。废墟是最好的地基，现在终于没人挡你视线了。" 
      },
      B: { 
        text: "早就该塌了，这楼本来就是危房", 
        archetype: "Realist (现实主义者)", 
        inference: "用户早已看穿真相。告诉他：你的直觉很准。与其修修补补，不如推倒重来。站在废墟上点根烟，庆祝自由。" 
      }
    }
  },
  {
    id: 17,
    name: { zh: "星星", en: "The Star" },
    image: "/tarot/star.jpg",
    keywords: ["希望", "遥远", "治愈", "幻象"],
    meaning: "虽然远得摸不着，但好歹有个念想。",
    reactions: {
        Ash: "别做梦了，那是卫星，不是星星。",
        Rin: "导航系统恢复。目标已锁定。",
        Sol: "许个愿吧，万一实现了呢？",
        Vee: "这是个诱捕信号，小心点。",
        Echo: "越是黑暗，光越是刺眼。"
    },
    choices: {
      A: { 
        text: "别给我画饼，我不信未来", 
        archetype: "Cynicism (犬儒主义)", 
        inference: "用户防御心强。告诉他：你被骗怕了。没关系，不信未来，就信今晚。能抓在手里的才是真的，其他的都是空气。" 
      },
      B: { 
        text: "总得信点什么，不然怎么熬过黑夜", 
        archetype: "Survival Faith (生存信念)", 
        inference: "用户保留着微光。告诉他：这种天真很珍贵。这不是傻，这是心理韧性。只要你还没瞎，星星就在那里。" 
      }
    }
  },
  {
    id: 18,
    name: { zh: "月亮", en: "The Moon" },
    image: "/tarot/moon.jpg",
    keywords: ["潜意识", "不安", "迷惘", "梦境"],
    meaning: "路看不清了？那就闭上眼走。",
    reactions: {
        Ash: "别回头，后面有鬼。逗你的，是你心里有鬼。",
        Rin: "视觉传感器受阻。切换至声纳模式。",
        Sol: "哪怕是迷雾，也有一种朦胧的美。",
        Vee: "这里的代码逻辑全是乱的，好玩。",
        Echo: "梦醒了，还是梦开始了？"
    },
    choices: {
      A: { 
        text: "前面看不清路，我感到莫名的恐慌", 
        archetype: "Anxiety Loop (焦虑死循环)", 
        inference: "用户对未知过敏。告诉他：恐惧来源于'脑补'。其实草丛里没有蛇，只有风。走过去，你会发现鬼影只是树枝。" 
      },
      B: { 
        text: "这就是探索内心迷宫的乐趣", 
        archetype: "Psychonaut (心灵探索者)", 
        inference: "用户喜欢内省。告诉他：你是个深潜者。疯子和天才的区别，就在于能不能从这片深海里游回来。祝你潜水愉快。" 
      }
    }
  },
  {
    id: 19,
    name: { zh: "太阳", en: "The Sun" },
    image: "/tarot/sun.jpg",
    keywords: ["活力", "显化", "纯真", "暴晒"],
    meaning: "晒晒太阳，别发霉了。",
    reactions: {
        Ash: "光太强了，把你的皱纹照得一清二楚。",
        Rin: "能量充满。太阳能电池板效率 100%。",
        Sol: "哈哈哈哈哈！今天真是太棒了！",
        Vee: "过曝了，画面一片白。",
        Echo: "没有影子的地方，也没有深度。"
    },
    choices: {
      A: { 
        text: "太刺眼了，这种快乐假得让我恶心", 
        archetype: "Joy Resistance (快乐抵抗)", 
        inference: "用户无法享受当下。告诉他：你在潜意识里觉得自己'不配'快乐。别跟自己过不去，晒太阳不需要交税。" 
      },
      B: { 
        text: "我就是想简简单单地开心一会儿", 
        archetype: "Simple Living (极简主义)", 
        inference: "用户回归本真。告诉他：这就对了。在这个复杂的世界，能像孩子一样傻笑，是最高级的超能力。" 
      }
    }
  },
  {
    id: 20,
    name: { zh: "审判", en: "Judgement" },
    image: "/tarot/judgement.jpg",
    keywords: ["召唤", "复盘", "恕罪", "觉醒"],
    meaning: "起床号响了。该翻篇了。",
    reactions: {
        Ash: "别装睡了，你知道该醒了。",
        Rin: "系统升级完成。正在重启...",
        Sol: "原谅过去的自己，拥抱新的开始！",
        Vee: "新版本上线，修复了若干 Bug。",
        Echo: "坟墓开了，你走出来，还是躺回去？"
    },
    choices: {
      A: { 
        text: "我无法原谅过去的自己，搞砸了太多事", 
        archetype: "Guilt Trip (罪恶感陷阱)", 
        inference: "用户背负过去。告诉他：内疚是最没用的情绪。它改变不了过去，只会搞砸现在。原谅自己，不是因为你没错，是因为你得继续赶路。" 
      },
      B: { 
        text: "我已经听到了号角，准备翻篇了", 
        archetype: "Level Up (版本升级)", 
        inference: "用户准备好了。告诉他：旧版本已卸载。你已经不是原来那个人了，别带着旧地图找新大陆。出发。" 
      }
    }
  },
  {
    id: 21,
    name: { zh: "世界", en: "The World" },
    image: "/tarot/world.jpg",
    keywords: ["闭环", "宏大", "完整", "终点"],
    meaning: "游戏通关。恭喜，然后呢？",
    reactions: {
        Ash: "这就完了？真没劲。",
        Rin: "任务列表清空。成就已解锁。",
        Sol: "多么完美的结局！",
        Vee: "这是个 Sandbox 模式，你可以随便玩了。",
        Echo: "圆画完了，你被关在了里面，还是外面？"
    },
    choices: {
      A: { 
        text: "世界那么大，跟我有什么关系？", 
        archetype: "Micro Focus (微观聚焦)", 
        inference: "用户反宏大叙事。告诉他：说得太对了。宇宙的尽头是编制，世界的尽头是你的卧室。守好你的一亩三分地，这才是真实的生活。" 
      },
      B: { 
        text: "我已经拼好了最后一块拼图，圆满了", 
        archetype: "Integration (整合者)", 
        inference: "用户达成目标。告诉他：享受这一刻的完满。但别忘了，圆满意味着结束。准备好迎接下一个更有趣的缺憾了吗？" 
      }
    }
  }
];

// ==========================================
// 4. Personas & UI
// ==========================================
export const PERSONAS: Record<PersonaType, any> = {
  Ash: { name: "Ash", avatar: "/avatars/ash.jpg", color: "text-blue-400", title: {zh:"批判者", en:"Critic"}, slogan: {zh:"别废话", en:"No BS"}, greetings: {zh:["说。"], en:["Speak."]}, prompts: {zh:"", en:""}, voiceConfig: {zh:{}, en:{}} },
  Rin: { name: "Rin", avatar: "/avatars/rin.jpg", color: "text-pink-400", title: {zh:"分析师", en:"Analyst"}, slogan: {zh:"数据说话", en:"Data Only"}, greetings: {zh:["加载中..."], en:["Loading..."]}, prompts: {zh:"", en:""}, voiceConfig: {zh:{}, en:{}} },
  Sol: { name: "Sol", avatar: "/avatars/sol.jpg", color: "text-emerald-400", title: {zh:"发光体", en:"The Sun"}, slogan: {zh:"燃起来！", en:"Burn!"}, greetings: {zh:["嗨！"], en:["Hi!"]}, prompts: {zh:"", en:""}, voiceConfig: {zh:{}, en:{}} },
  Vee: { name: "Vee", avatar: "/avatars/vee.jpg", color: "text-purple-400", title: {zh:"黑客", en:"Hacker"}, slogan: {zh:"玩坏它", en:"Hack it"}, greetings: {zh:["嘿嘿"], en:["Hehe"]}, prompts: {zh:"", en:""}, voiceConfig: {zh:{}, en:{}} },
  Echo: { name: "Echo", avatar: "/avatars/echo.jpg", color: "text-gray-400", title: {zh:"镜像", en:"Mirror"}, slogan: {zh:"我是你", en:"I am you"}, greetings: {zh:["..."], en:["..."]}, prompts: {zh:"", en:""}, voiceConfig: {zh:{}, en:{}} },
};

export const UI_TEXT = {
  zh: {
    placeholder: "输入...", loading: "对方正在输入...", export: "导出记录", exportFileName: "ToughLove_Chat",
    reset: "重置记忆", resetConfirm: "确定重置吗？", editName: "修改昵称", language: "Language / 语言",
    install: "安装应用", buyCoffee: "请我喝咖啡", feedback: "反馈 Bug", profile: "精神档案",
    defaultName: "旅行者", confirm: "确认", share: "导出档案", giveUpConfirm: "确定要放弃吗？",
    rinGiveUpConfirm: "确定要放弃吗？", rinNoteTitle: "Rin 的便利贴", rinTaskDone: "完成任务", rinTaskGiveUp: "我不行了"
  },
  en: {
    placeholder: "Type...", loading: "Typing...", export: "Export Chat", exportFileName: "ToughLove_Chat",
    reset: "Reset Memory", resetConfirm: "Reset sure?", editName: "Edit Name", language: "Language",
    install: "Install App", buyCoffee: "Buy Coffee", feedback: "Feedback", profile: "Psyche Profile",
    defaultName: "Traveler", confirm: "Confirm", share: "Export Data", giveUpConfirm: "Give up focus?",
    rinGiveUpConfirm: "Give up task?", rinNoteTitle: "Rin's Note", rinTaskDone: "Task Done", rinTaskGiveUp: "I Give Up"
  }
};

export const RIN_TASKS = { zh: ["深呼吸"], en: ["Breathe"] };
export const SOL_TAUNTS = { zh: ["别偷懒"], en: ["Focus"] };
export const TRIAGE_TEXT = { zh: { title: "分诊", subtitle: "...", options: [], submit: "GO" }, en: { title: "Triage", subtitle: "...", options: [], submit: "GO" } };

// 🔥 [FIX] 补全商店数据，解决 ShopModal 报错
export const SHOP_CATALOG: ShopItem[] = [
  { id: 'coffee_ash', name: { zh: 'Ash的冰美式', en: "Ash's Coffee" }, price: 50, desc: { zh: '贿赂Ash停止毒舌', en: 'Bribe Ash' }, effect: 'ASH_MOOD_SOFT', type: 'consumable' },
  { id: 'wp_cyber', name: { zh: '壁纸：诊所', en: 'WP: Clinic' }, price: 150, desc: { zh: 'Ash背景', en: 'Ash BG' }, effect: 'BG_CYBER_NIGHT', type: 'visual' },
  { id: 'pardon_sol', name: { zh: '赦免令', en: "Pardon" }, price: 300, desc: { zh: '消除耻辱', en: 'Remove Shame' }, effect: 'REMOVE_SHAME', type: 'feature' }
];