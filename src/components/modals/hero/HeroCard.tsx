// src/components/modals/hero/HeroCard.tsx
import { HeroFeedItem, FeedType } from '@prisma/client'; // ✅ 现在这里不会报错了
import { cn } from '@/lib/utils';
// 假设你用了 framer-motion，如果没有可以去掉 motion
import { motion } from 'framer-motion'; 

interface HeroCardProps {
  item: HeroFeedItem & {
    visualConfig: any; // 暂时用 any，或者定义具体的 VisualConfig 类型
  };
  onClick?: () => void;
}

export function HeroCard({ item, onClick }: HeroCardProps) {
  const isTabloid = item.type === FeedType.TABLOID;
  const isEditorial = item.type === FeedType.EDITORIAL;

  return (
    <motion.div 
      whileHover={{ scale: 1.02 }}
      className={cn(
        "relative w-full overflow-hidden rounded-xl border transition-all cursor-pointer group",
        isTabloid ? "border-neon-pink/50 bg-zinc-900" : "border-zinc-800 bg-black"
      )}
      onClick={onClick}
    >
      {/* Background Image Area */}
      <div 
        className="h-48 w-full bg-cover bg-center relative"
        style={{ 
          backgroundImage: item.visualConfig?.bgImage ? `url(${item.visualConfig.bgImage})` : undefined,
          backgroundColor: item.visualConfig?.primaryColor || '#111' 
        }}
      >
        {/* Tabloid Glitch Overlay */}
        {isTabloid && (
           <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent mix-blend-hard-light opacity-80" />
        )}
        
        {/* Type Badge */}
        <div className="absolute top-4 left-4">
          <span className={cn(
            "text-[10px] font-bold uppercase tracking-widest px-2 py-1 border",
            isTabloid 
              ? "bg-neon-pink text-black border-neon-pink" 
              : "bg-black/50 text-zinc-300 border-zinc-600 backdrop-blur-md"
          )}>
            {item.type}
          </span>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-5 relative">
        <h2 className={cn(
          "text-xl font-bold mb-2 leading-tight",
          isTabloid ? "font-mono text-neon-blue" : "font-sans text-zinc-100"
        )}>
          {item.title}
        </h2>
        <p className="text-zinc-400 text-sm line-clamp-2">
          {item.content}
        </p>
        
        {/* Decoration for Tabloid */}
        {isTabloid && (
          <div className="absolute bottom-2 right-2 text-[10px] text-neon-pink/50 font-mono">
            ERR_0X99
          </div>
        )}
      </div>
    </motion.div>
  );
}