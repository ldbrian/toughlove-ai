import { DAILY_NEWS_DATA } from '@/data/dailyNewsData';
import { PersonaType } from '@/types/index';

export interface DailyStatus {
  persona: PersonaType;
  type: 'routine' | 'event';
  content: string;
  moodLabel: string;
  moodImpact: number; // 🔥 新增：情绪杀伤力数值
}

// 辅助：从文案中提取情绪标签和数值
// 简单粗暴但有效的关键词匹配逻辑
const analyzeImpact = (text: string): { label: string, val: number } => {
  const match = text.match(/\[(.*?)\]/);
  const label = match ? match[1] : '日常';
  
  let val = 0;
  
  // 📉 负面关键词 -> 扣情绪
  if (/暴躁|倒霉|崩溃|故障|厌世|惊吓|悲悯|生气/.test(text)) val = -20;
  else if (/纠结|疏离|低落|疲惫/.test(text)) val = -10;
  
  // 📈 正面关键词 -> 加情绪
  else if (/灵感|幸运|开心|治愈|欧皇|热血|惊喜/.test(text)) val = 15;
  else if (/直觉|洞察|平静/.test(text)) val = 5;
  
  return { label, val };
};

// 核心生成算法
export const generateDailyFeed = (): DailyStatus[] => {
  const personas: PersonaType[] = ['Ash', 'Rin', 'Sol', 'Vee', 'Echo'];
  
  return personas.map(p => {
    const data = DAILY_NEWS_DATA[p as Exclude<PersonaType, 'System'>];
    // 防御性检查：防止数据缺失导致报错
    if (!data) return { persona: p, type: 'routine', content: '...', moodLabel: '未知', moodImpact: 0 };

    // 🎲 概率算法：60% 平淡 (Routine), 40% 事件 (Event)
    const isEvent = Math.random() > 0.6; 
    
    const pool = isEvent ? data.event : data.routine;
    // 随机取一条
    const content = pool[Math.floor(Math.random() * pool.length)];
    
    // 分析情绪影响
    const { label, val } = analyzeImpact(content);
    
    return {
      persona: p,
      type: isEvent ? 'event' : 'routine',
      content: content,
      moodLabel: label,
      // 只有随机事件(Event)才会真正影响情绪，日常琐事(Routine)虽有标签但数值为0
      moodImpact: isEvent ? val : 0 
    };
  });
};