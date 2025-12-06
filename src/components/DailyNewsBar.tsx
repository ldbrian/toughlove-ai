import React, { useState, useEffect } from 'react';
import { generateDailyFeed, DailyStatus } from '@/lib/dailyGenerator';
import { PERSONAS } from '@/lib/constants';
import { ChevronRight } from 'lucide-react';

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
    const today = new Date().toISOString().split('T')[0]; // 获取 "2023-12-06" 格式日期
    const savedRaw = localStorage.getItem(STORAGE_KEY);
    
    let validData: DailyStatus[] = [];

    if (savedRaw) {
      try {
        const saved: StoredFeed = JSON.parse(savedRaw);
        if (saved.date === today) {
          // 如果缓存是今天的，直接用
          validData = saved.data;
        }
      } catch (e) {
        console.error('Daily feed parse error', e);
      }
    }

    // 如果没有有效缓存，生成新的并保存
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
  // 防御性检查：防止 Persona 数据丢失导致报错
  const pData = PERSONAS[currentItem.persona];
  if (!pData) return null;

  const isEvent = currentItem.type === 'event';

  return (
    <div className="w-full px-6 flex justify-center">
      <button
        onClick={() => onItemClick(currentItem)}
        className="
          relative w-full max-w-[340px] h-12 
          bg-white/5 border border-white/10 backdrop-blur-md 
          rounded-full flex items-center px-2 pr-4 gap-3 
          overflow-hidden shadow-lg active:scale-95 transition-all
        "
      >
        {/* 左侧：头像 */}
        <div className="relative flex-shrink-0 z-10">
          <div className={`w-8 h-8 rounded-full border border-white/20 overflow-hidden transition-all duration-500 ${isAnimating ? 'scale-90 opacity-50' : 'scale-100 opacity-100'}`}>
            <img src={pData.avatar} alt={currentItem.persona} className="w-full h-full object-cover" />
          </div>
          <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-black flex items-center justify-center text-[6px] font-bold ${isEvent ? 'bg-red-500 text-white' : 'bg-gray-500 text-gray-200'}`}>
             {isEvent ? '!' : '•'}
          </div>
        </div>

        {/* 中间：滚动内容区 */}
        <div className="flex-1 h-full relative overflow-hidden flex items-center">
            <div 
                key={`${currentIndex}-${currentItem.persona}`} // 确保 key 唯一以触发动画
                className="flex flex-col items-start w-full animate-[slideUpFade_0.5s_ease-out]"
            >
                <div className="flex items-center gap-2 mb-0.5 w-full">
                    <span className={`text-[10px] font-black uppercase tracking-wider ${pData.color}`}>
                        @{currentItem.persona}
                    </span>
                    <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-white/10 text-gray-300 font-mono">
                        {currentItem.moodLabel}
                    </span>
                </div>
                
                <p className="text-[11px] text-gray-200 leading-tight w-full truncate opacity-90 text-left">
                    {currentItem.content.replace(/\[.*?\]/, '').trim()}
                </p>
            </div>
        </div>

        <ChevronRight size={14} className="text-white/20 flex-shrink-0" />
      </button>
    </div>
  );
};