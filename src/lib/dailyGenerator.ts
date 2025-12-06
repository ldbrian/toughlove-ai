import { DAILY_NEWS_DATA } from '@/data/dailyNewsData';
import { PersonaType } from '@/lib/constants';

export interface DailyStatus {
  persona: PersonaType;
  type: 'routine' | 'event';
  content: string;
  moodLabel: string; // e.g., "烦躁", "发呆"
}

// 辅助：从字符串中提取 [情绪] 标签 (如果有的化)
// 格式假设: "😡 [暴躁] 今天的咖啡..." -> 提取 "暴躁"
const extractMood = (text: string): string => {
  const match = text.match(/\[(.*?)\]/);
  return match ? match[1] : '日常';
};

// 核心生成算法
export const generateDailyFeed = (): DailyStatus[] => {
  const personas: PersonaType[] = ['Ash', 'Rin', 'Sol', 'Vee', 'Echo'];
  
  return personas.map(p => {
    const data = DAILY_NEWS_DATA[p];
    // 🎲 概率算法：70% 平淡 (Routine), 30% 事件 (Event)
    // 想要稍微热闹点？我们可以调成 60/40
    const isEvent = Math.random() > 0.6; 
    
    const pool = isEvent ? data.event : data.routine;
    // 随机取一条
    const content = pool[Math.floor(Math.random() * pool.length)];
    
    return {
      persona: p,
      type: isEvent ? 'event' : 'routine',
      content: content,
      moodLabel: extractMood(content)
    };
  });
};