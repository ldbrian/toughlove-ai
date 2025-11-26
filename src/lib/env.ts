// src/lib/env.ts

// --- 1. 时间感知与生活阶段判断 ---
export const getLocalTimeInfo = () => {
  const now = new Date();
  const hours = now.getHours();
  
  // 星期映射
  const daysZH = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const daysEN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // 格式化时间 (例如 14:05)
  const timeStr = `${hours.toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  // 🔥 核心：生活阶段 (Life Phase) - 用于触发特定的开场白
  let phase = 'Daytime';
  if (hours >= 0 && hours < 5) phase = 'Late Night (深夜修仙)';
  else if (hours >= 5 && hours < 9) phase = 'Early Morning (晨间)';
  else if (hours >= 11 && hours < 14) phase = 'Lunch Time (饭点)';
  else if (hours >= 18 && hours < 21) phase = 'Dinner Time (晚饭)';
  else if (hours >= 22) phase = 'Bed Time (睡前)';

  return {
    localTime: timeStr,
    weekdayZH: daysZH[now.getDay()],
    weekdayEN: daysEN[now.getDay()],
    lifePhase: phase
  };
};

// --- 2. 天气代码翻译 (WMO Code) ---
const getWeatherDesc = (code: number, lang: 'zh' | 'en' = 'zh'): string => {
  // 0: 晴, 1-3: 多云, 45/48: 雾, 51-67: 雨, 71-86: 雪, 95-99: 雷暴
  if (code === 0) return lang === 'zh' ? '☀️ 晴朗' : '☀️ Clear';
  if (code <= 3) return lang === 'zh' ? '⛅ 多云' : '⛅ Cloudy';
  if (code <= 48) return lang === 'zh' ? '🌫️ 有雾' : '🌫️ Foggy';
  if (code <= 67) return lang === 'zh' ? '🌧️ 下雨' : '🌧️ Rainy'; // 重点关注
  if (code <= 77) return lang === 'zh' ? '❄️ 雨夹雪' : '❄️ Snow grains';
  if (code <= 86) return lang === 'zh' ? '🌨️ 下雪' : '🌨️ Snow';
  if (code <= 99) return lang === 'zh' ? '⛈️ 雷暴' : '⛈️ Thunderstorm';
  return lang === 'zh' ? '未知天气' : 'Unknown';
};

// --- 3. 获取真实天气 (Open-Meteo) ---
// 这是一个完全免费、无需 Key 的开源气象 API
export const getSimpleWeather = async (): Promise<string> => {
  if (typeof window === 'undefined' || !navigator.geolocation) {
    return "";
  }

  return new Promise((resolve) => {
    // 1. 尝试获取经纬度
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;

          // 2. 请求天气
          const res = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`
          );
          const data = await res.json();
          
          if (data && data.current_weather) {
            const { temperature, weathercode } = data.current_weather;
            const weatherDesc = getWeatherDesc(weathercode, 'zh');
            
            // 返回格式： "🌧️ 下雨, 18°C"
            resolve(`${weatherDesc}, ${temperature}°C`);
          } else {
            resolve("");
          }
        } catch (e) {
          console.error("Weather fetch failed:", e);
          resolve(""); // 失败降级为空，不影响流程
        }
      },
      (error) => {
        // 用户拒绝授权或定位失败
        // console.warn("Location denied.");
        resolve(""); 
      },
      { timeout: 1500 } // 1.5秒超时，别让用户等太久
    );
  });
};