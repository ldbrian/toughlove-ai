import React, { useState, useEffect } from 'react';
import { generateDailyFeed, DailyStatus } from '@/lib/dailyGenerator';
import { PERSONAS } from '@/lib/constants';
import { ChevronRight, Zap, AlertCircle } from 'lucide-react';

interface DailyNewsBarProps {
  onItemClick: (status: DailyStatus) => void;
}

// 定义存储结构
const STORAGE_KEY = 'toughlove_daily_feed_v1';
interface StoredFeed {
  date: string; // YYYY-MM-DD
  data: DailyStatus[];
}

export const DailyNewsBar: React.FC<DailyNewsBarProps> = ({ onItemClick }) => {
  const [feed, setFeed] = useState<DailyStatus[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // 1. 初始化数据 (带持久化缓存)
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const savedRaw = localStorage.getItem(STORAGE_KEY);
    
    let validData: DailyStatus[] = [];

    if (savedRaw) {
      try {
        const saved: StoredFeed = JSON.parse(savedRaw);
        if (saved.date === today) {
          validData = saved.data;
        }
      } catch (e) {
        console.error('Daily feed parse error', e);
      }
    }

    if (validData.length === 0) {
      validData = generateDailyFeed();
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        date: today,
        data: validData
      }));
    }

    setFeed(validData);
  }, []);

  // 2. 自动轮播逻辑
  useEffect(() => {
    if (feed.length === 0) return;
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % feed.length);
        setIsAnimating(false);
      }, 500);
    }, 4000);

    return () => clearInterval(interval);
  }, [feed]);

  if (feed.length === 0) return null;

  const currentItem = feed[currentIndex];
  // @ts-ignore - PERSONAS 类型可能是宽松的
  const pData = PERSONAS[currentItem.persona];
  if (!pData) return null;

  // 🔥 视觉风格计算
  const impact = currentItem.moodImpact || 0;
  let statusStyle = 'bg-gray-500 text-gray-200 border-black'; // 默认
  let containerBorder = 'border-white/10';
  let tagStyle = 'bg-white/10 text-gray-400';
  let icon = null;

  if (impact < 0) {
      // 负面: 红色警报
      statusStyle = 'bg-red-600 text-white border-red-900 animate-pulse';
      containerBorder = 'border-red-500/30 shadow-[0_0_10px_rgba(220,38,38,0.2)]';
      tagStyle = 'bg-red-500/10 text-red-400 border border-red-500/20';
      icon = <AlertCircle size={10} />;
  } else if (impact > 0) {
      // 正面: 金色高光
      statusStyle = 'bg-yellow-500 text-black border-yellow-200';
      containerBorder = 'border-yellow-500/30 shadow-[0_0_10px_rgba(234,179,8,0.2)]';
      tagStyle = 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20';
      icon = <Zap size={10} />;
  }

  return (
    <div className="w-full px-6 flex justify-center">
      <button
        onClick={() => onItemClick(currentItem)}
        className={`
          relative w-full max-w-[340px] h-12 
          bg-[#0a0a0a]/80 backdrop-blur-md 
          rounded-full flex items-center px-2 pr-4 gap-3 
          overflow-hidden shadow-lg active:scale-95 transition-all
          border ${containerBorder}
        `}
      >
        {/* 左侧：头像 */}
        <div className="relative flex-shrink-0 z-10">
          <div className={`w-8 h-8 rounded-full border border-white/10 overflow-hidden transition-all duration-500 ${isAnimating ? 'scale-90 opacity-50' : 'scale-100 opacity-100'}`}>
            <img src={pData.avatar} alt={currentItem.persona} className="w-full h-full object-cover" />
          </div>
          {/* 状态点 */}
          <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center text-[8px] font-bold ${statusStyle}`}>
             {icon || '•'}
          </div>
        </div>

        {/* 中间：滚动内容区 */}
        <div className="flex-1 h-full relative overflow-hidden flex items-center">
            <div 
                key={`${currentIndex}-${currentItem.persona}`} 
                className="flex flex-col items-start w-full animate-[slideUpFade_0.5s_ease-out]"
            >
                <div className="flex items-center gap-2 mb-0.5 w-full">
                    <span className={`text-[10px] font-black uppercase tracking-wider ${pData.color}`}>
                        @{currentItem.persona}
                    </span>
                    <span className={`text-[8px] px-1.5 py-0 rounded-full font-mono flex items-center gap-1 ${tagStyle}`}>
                        {currentItem.moodLabel}
                        {impact !== 0 && <span className="opacity-70">{impact > 0 ? `+${impact}` : impact}</span>}
                    </span>
                </div>
                
                <p className="text-[11px] text-gray-200 leading-tight w-full truncate opacity-90 text-left font-sans">
                    {currentItem.content.replace(/\[.*?\]/, '').trim()}
                </p>
            </div>
        </div>

        <ChevronRight size={14} className="text-white/20 flex-shrink-0" />
      </button>
    </div>
  );
};