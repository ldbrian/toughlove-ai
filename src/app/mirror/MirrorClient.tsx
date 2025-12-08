'use client';

import { useState } from 'react';
import { Triangle, X, Maximize2, Hash } from 'lucide-react';

// 定义从 Server 传过来的数据类型
type ShardData = {
  id: string;
  content: string;
  emotion: string;
  weight: number;
  dateStr: string; // 格式化后的日期
};

// 视觉配置 (复用之前的)
const EMOTION_THEMES: Record<string, any> = {
  anxiety: {
    bg: 'from-red-950/80 to-slate-950',
    shadow: 'drop-shadow-[0_0_1px_rgba(248,113,113,0.8)]',
    text: 'text-red-200',
    accent: 'bg-red-500',
  },
  rage: {
    bg: 'from-orange-950/80 to-slate-950',
    shadow: 'drop-shadow-[0_0_1px_rgba(251,146,60,0.8)]',
    text: 'text-orange-200',
    accent: 'bg-orange-500',
  },
  joy: {
    bg: 'from-yellow-950/80 to-slate-950',
    shadow: 'drop-shadow-[0_0_1px_rgba(250,204,21,0.8)]',
    text: 'text-yellow-200',
    accent: 'bg-yellow-500',
  },
  calm: {
    bg: 'from-cyan-950/80 to-slate-950',
    shadow: 'drop-shadow-[0_0_1px_rgba(34,211,238,0.8)]',
    text: 'text-cyan-200',
    accent: 'bg-cyan-500',
  },
  // 默认 fallback
  neutral: {
    bg: 'from-slate-900/80 to-slate-950',
    shadow: 'drop-shadow-[0_0_1px_rgba(148,163,184,0.5)]',
    text: 'text-slate-300',
    accent: 'bg-slate-500',
  }
};

const SHARD_SHAPES = [
  'polygon(0 0, 100% 0, 100% 80%, 80% 100%, 0 100%)',
  'polygon(20% 0, 100% 0, 100% 100%, 0 100%, 0 20%)',
  'polygon(0 0, 100% 0, 100% 100%, 20% 100%, 0 80%)',
  'polygon(0 0, 80% 0, 100% 20%, 100% 100%, 0 100%)',
];

export default function MirrorClient({ shards }: { shards: ShardData[] }) {
  const [selectedShard, setSelectedShard] = useState<ShardData | null>(null);

  if (shards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-slate-600 space-y-4">
        <div className="w-16 h-16 border border-dashed border-slate-700 rounded-full flex items-center justify-center animate-pulse">
           <Hash size={24} />
        </div>
        <div className="text-xs font-mono">NO_SIGNAL_DETECTED</div>
        <p className="text-xs text-slate-500 max-w-[200px] text-center">
          与 AI 深入对话，诱发高权重情绪，此处将生成记忆结晶。
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="columns-2 gap-4 space-y-4 pb-24">
        {shards.map((shard, index) => {
          // 安全访问 emotion，防止数据库里存了奇怪的值
          const theme = EMOTION_THEMES[shard.emotion] || EMOTION_THEMES['neutral'];
          const shape = SHARD_SHAPES[index % SHARD_SHAPES.length];

          return (
            <div 
              key={shard.id}
              onClick={() => setSelectedShard(shard)}
              className={`break-inside-avoid mb-4 group cursor-pointer transition-transform hover:scale-[1.02] ${theme.shadow}`}
              style={{ filter: theme.shadow }}
            >
              <div 
                className={`relative p-4 h-full bg-gradient-to-br ${theme.bg} backdrop-blur-md`}
                style={{ 
                  clipPath: shape, 
                  minHeight: index % 2 === 0 ? '160px' : '120px' 
                }}
              >
                <div className="flex justify-between items-start mb-3 opacity-60">
                  <span className="font-mono text-[10px] tracking-wider border border-white/20 px-1.5 py-0.5 rounded-sm">
                    {shard.dateStr}
                  </span>
                  {shard.weight > 80 && (
                    <div className={`w-1.5 h-1.5 rounded-full ${theme.accent} animate-pulse`} />
                  )}
                </div>
                
                <p className={`text-xs leading-relaxed font-medium line-clamp-5 ${theme.text} opacity-90`}>
                  {shard.content}
                </p>

                <div className="absolute top-0 left-0 w-full h-[1px] bg-white/10" />
                <div className="absolute bottom-0 right-0 w-8 h-8 bg-gradient-to-tl from-white/10 to-transparent" />
              </div>
            </div>
          );
        })}
      </div>

      {/* 弹窗 */}
      {selectedShard && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-200" onClick={() => setSelectedShard(null)}>
          <div 
            className="w-full max-w-sm bg-slate-900 p-1 relative"
            style={{ filter: (EMOTION_THEMES[selectedShard.emotion] || EMOTION_THEMES.neutral).shadow }}
            onClick={(e) => e.stopPropagation()} 
          >
            <div 
              className={`bg-slate-900 p-8 relative`}
              style={{ clipPath: 'polygon(10% 0, 100% 0, 100% 90%, 90% 100%, 0 100%, 0 10%)' }}
            >
              <button onClick={() => setSelectedShard(null)} className="absolute top-4 right-4 text-slate-500 hover:text-white">
                <X size={24} />
              </button>

              <div className="flex items-center gap-2 mb-6 text-fuchsia-500">
                <Hash size={16} />
                <span className="font-mono text-xs">FRAGMENT_LOG</span>
              </div>

              <p className="text-lg font-bold leading-relaxed mb-8 text-slate-200">
                "{selectedShard.content}"
              </p>

              <div className="grid grid-cols-2 gap-4 text-xs font-mono text-slate-500 border-t border-slate-800 pt-6">
                <div>
                  <span className="block text-slate-700 mb-1">DATE</span>
                  {selectedShard.dateStr}.2025
                </div>
                <div>
                  <span className="block text-slate-700 mb-1">EMOTION</span>
                  <span className={(EMOTION_THEMES[selectedShard.emotion] || EMOTION_THEMES.neutral).text}>
                    {selectedShard.emotion.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}