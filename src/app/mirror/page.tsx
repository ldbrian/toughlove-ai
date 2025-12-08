'use client';

import { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, Database } from 'lucide-react';
import MirrorClient from './MirrorClient'; 
// 引入常量以获取角色列表
import { PERSONAS } from '@/lib/constants';

// 模拟的情绪关键词库
const EMOTION_KEYWORDS: Record<string, string[]> = {
  anxiety: ['担心', '害怕', '焦虑', '不安', 'fear', 'anxious', 'worry', '死', '黑暗'],
  rage: ['生气', '愤怒', '滚', '讨厌', 'hate', 'angry', 'destroy', 'stupid', '怒'],
  joy: ['开心', '喜欢', '爱', '哈哈', 'love', 'happy', 'great', 'fun', '笑'],
  calm: ['平静', '安静', '睡', '休息', 'calm', 'sleep', 'peace', '稳'],
};

export default function MirrorPage() {
  const [shards, setShards] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 模拟从“神经云端”同步数据的过程
    setTimeout(() => {
      generateShardsFromMemory();
      setIsLoading(false);
    }, 800);
  }, []);

  // 🔥 核心逻辑：从 localStorage 的聊天记录中“挖掘”碎片
  const generateShardsFromMemory = () => {
    const allShards: any[] = [];
    const keys = Object.keys(PERSONAS); // ['Ash', 'Rin', ...]

    keys.forEach(personaKey => {
        const memoryKey = `toughlove_chat_${personaKey.toLowerCase()}`;
        const savedMemory = localStorage.getItem(memoryKey);
        
        if (savedMemory) {
            const messages = JSON.parse(savedMemory);
            // 筛选出有价值的对话 (比如字数 > 10 的 AI 回复)
            // 倒序遍历，取最新的
            messages.slice().reverse().forEach((msg: any, idx: number) => {
                if (msg.role === 'assistant' && msg.content.length > 15) {
                    // 简单的“情绪分析”算法
                    let emotion = 'neutral';
                    let weight = 50;
                    
                    for (const [emo, keywords] of Object.entries(EMOTION_KEYWORDS)) {
                        if (keywords.some(k => msg.content.toLowerCase().includes(k))) {
                            emotion = emo;
                            weight = 80 + Math.random() * 20; // 命中关键词则权重高
                            break;
                        }
                    }

                    // 只有高权重的或者随机的一些普通对话会形成结晶
                    if (weight > 60 || Math.random() > 0.7) {
                        allShards.push({
                            id: `${personaKey}-${idx}`,
                            content: msg.content.replace(/\[.*?\]/g, '').slice(0, 60) + '...', // 截断并清洗 Tag
                            emotion,
                            weight,
                            // 模拟一个日期 (实际项目中应该在消息里存时间戳)
                            dateStr: new Date().toISOString().slice(5, 10).replace('-', '.') 
                        });
                    }
                }
            });
        }
    });

    // 只展示最新的 20 个碎片，营造稀缺感
    setShards(allShards.slice(0, 20));
  };

  return (
    <div className="min-h-screen bg-[#050505] text-slate-200 relative overflow-hidden font-sans">
      
      {/* 背景光晕 */}
      <div className="fixed top-0 left-0 w-full h-96 bg-fuchsia-900/10 blur-[100px] pointer-events-none" />
      <div className="fixed inset-0 bg-[url('/noise.png')] opacity-10 pointer-events-none"></div>

      <div className="p-6 pt-16 relative z-10">
        <header className="mb-10 flex justify-between items-end border-b border-white/10 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
                <Sparkles size={16} className="text-fuchsia-500 animate-pulse" />
                <h1 className="text-3xl font-black italic tracking-tighter text-white" style={{textShadow: '0 0 20px rgba(217,70,239,0.3)'}}>
                MIRROR
                </h1>
            </div>
            <p className="text-[10px] text-fuchsia-300/50 font-mono tracking-widest pl-1 uppercase">
              Memory Crystallization System
            </p>
          </div>
          
          <div className="text-right">
             {isLoading ? (
                 <div className="flex items-center gap-2 text-xs text-gray-500 animate-pulse">
                     <RefreshCw size={12} className="animate-spin" /> SYNCING...
                 </div>
             ) : (
                 <>
                    <div className="text-2xl font-bold font-mono text-fuchsia-500">{shards.length}</div>
                    <div className="text-[10px] text-gray-500 tracking-widest">FRAGMENTS</div>
                 </>
             )}
          </div>
        </header>

        {/* 渲染客户端组件 */}
        <MirrorClient shards={shards} />
        
        {/* 空状态下的提示 */}
        {!isLoading && shards.length === 0 && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center opacity-50">
                <Database size={48} className="mx-auto mb-4 text-gray-700" />
                <p className="text-xs text-gray-500 tracking-widest">NO MEMORY DATA FOUND</p>
                <p className="text-[10px] text-gray-600 mt-2">Go chat with them to create memories.</p>
            </div>
        )}
      </div>
    </div>
  );
}