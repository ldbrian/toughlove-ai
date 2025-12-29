import { 
    Sword, Shield, Zap, Heart, Skull, Cpu, Disc, FileText, 
    Syringe, Pill, Ghost, Flame, Droplet, Eye, Key, Lock, 
    Map, Compass, Anchor, Feather, Box, Terminal, ShieldAlert, Fingerprint
  } from 'lucide-react';
  
  // 1. 图标映射 (Rin 的素材箱)
  export const LOOT_ICON_MAP: Record<string, any> = {
    'weapon': Sword, 'armor': Shield, 'energy': Zap, 'health': Heart, 
    'death': Skull, 'chip': Cpu, 'data': Disc, 'doc': FileText, 
    'drug': Syringe, 'pill': Pill, 'spirit': Ghost, 'fire': Flame, 
    'water': Droplet, 'vision': Eye, 'key': Key, 'lock': Lock, 
    'map': Map, 'explore': Compass, 'misc': Anchor, 'art': Feather,
    'box': Box, 'hack': Terminal, 'security': ShieldAlert, 'bio': Fingerprint
  };
  
  // 2. 预设背景池 (确保路径存在，否则用占位图)
  export const BACKGROUND_POOL = [
    '/wallpapers/ash_clinic.jpg', '/wallpapers/rin_room.jpg',
    '/wallpapers/sol_room.jpg', '/wallpapers/vee_room.jpg',
    '/wallpapers/echo_room.jpg', '/wallpapers/city_rain.jpg', 
    '/wallpapers/cyber_slum.jpg'
  ];
  
  // 3. 词库：用于组合生成无限话题
  const TOPIC_SEGMENTS = {
    prefixes: ["揭秘", "突发", "深度报道", "伦理危机", "技术丑闻", "街头传闻", "公司内幕", "红色警报"],
    subjects: ["义体医生", "荒坂塔", "贫民窟", "AI伴侣", "记忆黑市", "合成肉工厂", "地下赛车", "脑机接口", "赛博精神病", "能源网络"],
    suffixes: ["大罢工", "数据泄露", "集体过载", "的阴谋", "是否拥有灵魂？", "背后的血腥真相", "强制升级令", "驱逐计划", "的末日预言"]
  };
  
  // 4. 词库：物品形容词
  const ITEM_ADJECTIVES = ["损坏的", "加密的", "沾血的", "非法的", "军用级", "生锈的", "未完成的", "发光的", "复古的", "被诅咒的"];
  
  // 🧠 智能函数：生成随机话题
  export const generateRandomTopic = () => {
    const p = TOPIC_SEGMENTS.prefixes[Math.floor(Math.random() * TOPIC_SEGMENTS.prefixes.length)];
    const s = TOPIC_SEGMENTS.subjects[Math.floor(Math.random() * TOPIC_SEGMENTS.subjects.length)];
    const x = TOPIC_SEGMENTS.suffixes[Math.floor(Math.random() * TOPIC_SEGMENTS.suffixes.length)];
    return `${p}：${s}${x}`;
  };
  
  // 🧠 智能函数：根据话题生成相关物品
  const generateRelevantLoot = (topic: string) => {
    let type = "misc";
    let baseName = "未知物体";
    
    const t = topic || ""; // 防空
  
    if (t.includes("医") || t.includes("肉") || t.includes("血")) {
       type = Math.random() > 0.5 ? "drug" : "health";
       baseName = type === "drug" ? "肾上腺素" : "急救凝胶";
    } else if (t.includes("AI") || t.includes("数据") || t.includes("记忆") || t.includes("黑市")) {
       type = "data";
       baseName = "记忆芯片";
    } else if (t.includes("警") || t.includes("暴") || t.includes("杀")) {
       type = "weapon";
       baseName = "弹壳";
    } else if (t.includes("能") || t.includes("电") || t.includes("网")) {
       type = "energy";
       baseName = "高能电池";
    } else if (t.includes("塔") || t.includes("公司") || t.includes("内幕")) {
       type = "doc";
       baseName = "绝密文件";
    } else if (t.includes("脑") || t.includes("接口")) {
       type = "chip";
       baseName = "神经链接器";
    }
  
    const adjective = ITEM_ADJECTIVES[Math.floor(Math.random() * ITEM_ADJECTIVES.length)];
    return {
      id: `loot_${Date.now()}`,
      name: `${adjective}${baseName}`,
      icon: type,
      rarity: ["common", "rare", "epic", "legendary"][Math.floor(Math.random() * 4)],
      price: Math.floor(Math.random() * 500) + 50
    };
  };
  
  // 🔥 核心接口：生成数据
  export const mockAiGenerate = async (type: 'feed' | 'script', topicInput?: string) => {
    // 模拟网络延迟
    await new Promise(r => setTimeout(r, 800)); 
  
    const topic = topicInput || generateRandomTopic();
    const randomBg = BACKGROUND_POOL[Math.floor(Math.random() * BACKGROUND_POOL.length)];
    const dynamicLoot = generateRelevantLoot(topic);
  
    // 返回符合前端预期的数据结构
    if (type === 'feed') {
      return {
        title: topic.split('：')[1] || topic, 
        content: `[Ash]: "关于 ${topic}，我早已预料到这一天。"\n[Rin]: "哇，如果是真的，那我的库存又要涨价了！"\n[Sol]: "这是一个危险的信号，建议加强防火墙。"`,
        bgImage: randomBg,
        loot: dynamicLoot
      };
    }
    
    if (type === 'script') {
      return {
        id: `script_${Date.now()}`,
        title: topic,
        intro: `关于“${topic}”的事件正在持续发酵。你被卷入了漩涡中心...`,
        coverImage: randomBg,
        difficulty: ["Easy", "Hard", "Nightmare"][Math.floor(Math.random() * 3)],
        scenes: [
          { 
            id: 'start', 
            name: '事件现场', 
            description: `你来到了${topic}的核心区域。空气中弥漫着紧张的味道。`,
            actions: [
               { label: { zh: '深入调查', en: 'Investigate' }, type: 'speak', payload: `[System]: 你决定深入调查关于${dynamicLoot.name}的线索。` },
               { label: { zh: '转身离开', en: 'Leave' }, type: 'speak', payload: '[System]: 此地不宜久留。' }
            ]
          }
        ]
      };
    }
  };