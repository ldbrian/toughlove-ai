// 1. 获取时间与饭点信息
export function getLocalTimeInfo() {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay(); // 0 = 周日
  
    const daysZH = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
    const daysEN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  
    // 定义生活场景 (Lifestyle Phases)
    let lifePhase = "Working/Chilling"; // 默认
    if (hour >= 6 && hour < 10) lifePhase = "Breakfast Time";
    else if (hour >= 11 && hour < 14) lifePhase = "Lunch Time";
    else if (hour >= 14 && hour < 17) lifePhase = "Afternoon Tea";
    else if (hour >= 17 && hour < 21) lifePhase = "Dinner Time";
    else if (hour >= 23 || hour < 4) lifePhase = "Late Night Emo";
  
    return {
      localTime: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      weekdayZH: daysZH[day],
      weekdayEN: daysEN[day],
      lifePhase, // 核心：饭点/深夜状态
      isMondayMorning: day === 1 && hour < 12,
      isFridayNight: day === 5 && hour >= 18
    };
  }
  
  // 2. 获取简易天气 (利用免费公开接口 wttr.in，基于 IP，不需要弹窗授权)
  // 返回格式示例: "Shanghai: Rain +20°C"
  export async function getSimpleWeather(): Promise<string> {
    try {
      // 使用 wttr.in 的简洁文本模式 (?format=3)
      // 格式：City: Condition Temp
      const res = await fetch('https://wttr.in/?format=%l:+%C+%t', { 
        method: 'GET',
        cache: 'no-store' // 稍微缓存一下也行，这里为了实时性
      });
      if (res.ok) {
        const text = await res.text();
        return text.trim();
      }
      return "";
    } catch (e) {
      // 失败了就默默失败，不影响主流程
      return "";
    }
  }