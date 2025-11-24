import { PersonaType } from './constants';

// 定义每个人的作息表
export const getPersonaStatus = (persona: PersonaType, hour: number): string => {
  // 0. Echo: 全天候观察者
  if (persona === 'Echo') return "👁️ 凝视中 (Observing)";

  // 1. Ash: 夜猫子 (Day: Sleep/Lazy, Night: Awake)
  if (persona === 'Ash') {
    if (hour >= 4 && hour < 12) return "💤 补觉中 (Sleeping)";
    if (hour >= 12 && hour < 18) return "🚬 放空中 (Zoning out)";
    if (hour >= 18 && hour < 23) return "🥃 清醒 (Awake)";
    return "🌑 凝视深渊 (Deep Night)";
  }

  // 2. Rin: 生活化 (Day: Angry/Eating, Night: Gaming)
  if (persona === 'Rin') {
    if (hour >= 7 && hour < 9) return "🥐 觅食中 (Hunting food)";
    if (hour >= 12 && hour < 14) return "🍱 干饭中 (Eating)";
    if (hour >= 22 || hour < 2) return "🎮 排位中 (Gaming)";
    if (hour >= 2 && hour < 7) return "🛌 睡死了 (Dead asleep)";
    return "💢 暴躁搬砖 (Working)";
  }

  // 3. Sol: 工作狂
  if (persona === 'Sol') {
    if (hour >= 9 && hour < 19) return "⚡ 高效运算 (Optimizing)";
    if (hour >= 19 && hour < 23) return "🔋 充电中 (Recharging)";
    return "💤 待机 (Standby)";
  }

  // 4. Vee: 乐子人
  if (persona === 'Vee') {
    if (hour >= 2 && hour < 10) return "🛌 宿醉 (Hangover)";
    return "🤡 找乐子 (Meme hunting)";
  }

  return "🟢 在线 (Online)";
};