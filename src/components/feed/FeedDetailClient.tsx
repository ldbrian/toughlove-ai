'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Heart, Terminal, MessageCircle, ThumbsUp, Sparkles, Zap, Smile, ThumbsDown } from 'lucide-react';
import { HeroItemWithComments } from '@/lib/service/hero';
import { useNotificationStore } from '@/store/useNotificationStore';

const AVATAR_MAP: Record<string, string> = {
    Ash: '/avatars/ash_hero.jpg',
    Vee: '/avatars/vee_hero.jpg',
    Sol: '/avatars/sol_hero.jpg',
    Rin: '/avatars/rin_hero.jpg',
    Echo: '/avatars/echo_hero.jpg',
    ASH: '/avatars/ash_hero.jpg', 
    VEE: '/avatars/vee_hero.jpg',
    SOL: '/avatars/sol_hero.jpg',
    RIN: '/avatars/rin_hero.jpg',
    ECHO: '/avatars/echo_hero.jpg',
};

const STANCE_CONFIG: Record<string, any> = {
    AGREE: { icon: ThumbsUp, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20', label: '赞同' },
    DISAGREE: { icon: ThumbsDown, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', label: '反对' },
    NEUTRAL: { icon: MessageCircle, color: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500/20', label: '中立' },
    JOKING: { icon: Smile, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', label: '调侃' },
    SARCASTIC: { icon: Zap, color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/20', label: '嘲讽' },
};

interface FeedDetailProps {
    item: HeroItemWithComments;
}

export default function FeedDetailClient({ item }: FeedDetailProps) {
    const router = useRouter();
    const { addNotification } = useNotificationStore();
    
    const [liked, setLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(0);
    const [likedComments, setLikedComments] = useState<Record<string, boolean>>({});
    
    const comments = item.comments || [];
    const visual = item.visualConfig as any || {};
    const authorName = visual.author || 'System';
    const primaryColor = visual.primaryColor || '#22d3ee';

    useEffect(() => {
        setLikeCount(item.id.charCodeAt(0) * 12 + item.id.charCodeAt(item.id.length - 1));
    }, [item]);

    const handleArticleLike = () => {
        if (liked) return;
        setLiked(true);
        setLikeCount(prev => prev + 1);
        if (navigator.vibrate) navigator.vibrate([20, 30]);

        addNotification({
            avatar: AVATAR_MAP[authorName] || AVATAR_MAP['Ash'],
            sender: authorName,
            type: 'system',
            text: `收到你的共鸣。要聊聊这个话题吗？`,
            link: `/chat/${authorName.toLowerCase()}`
        });
    };

    const handleCommentLike = (comment: any) => {
        if (likedComments[comment.id]) return; 
        
        if (navigator.vibrate) navigator.vibrate(50);
        setLikedComments(prev => ({ ...prev, [comment.id]: true }));

        addNotification({
            avatar: AVATAR_MAP[comment.personaName] || AVATAR_MAP['Ash'],
            sender: comment.personaName,
            type: 'system',
            text: `你也这么觉得？那我们是同一战线的。`, 
            link: comment.actionLink || `/chat/${comment.personaName.toLowerCase()}`
        });
    };

    return (
        <div className="min-h-full bg-[#050505] text-gray-200 font-sans pb-24 relative flex flex-col">
            
            {/* 🟢 修复版返回按钮
               - 使用标准的 <button>
               - fixed top-8 left-5: 经典左上角位置
               - !w-10 !h-10: 强制宽高，防止变形
               - z-50: 确保在图片之上
            */}
            <button 
                onClick={() => router.back()}
                className="fixed top-8 left-5 z-50 !w-10 !h-10 !p-0 !rounded-full flex items-center justify-center bg-black/40 backdrop-blur-md border border-white/10 text-white shadow-xl hover:bg-white/10 active:scale-95 transition-all"
            >
                <ArrowLeft size={20} />
            </button>

            {/* Header Image */}
            <div className="relative w-full h-[28vh] min-h-[220px] shrink-0">
                 <img 
                    src={visual.bgImage || '/avatars/ash_hero.jpg'} 
                    className="w-full h-full object-cover object-center opacity-70" 
                    alt="cover"
                 />
                 <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-[#050505]" />
            </div>

            {/* Content Body */}
            <div className="flex-1 px-5 -mt-12 relative z-10">
                
                {/* Meta & Title */}
                <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                        <span 
                            className="px-2 py-0.5 rounded text-[10px] font-black tracking-widest uppercase border backdrop-blur-md shadow-lg"
                            style={{ color: primaryColor, borderColor: `${primaryColor}40`, backgroundColor: 'rgba(0,0,0,0.6)' }}
                        >
                            {item.type} LOG
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono flex items-center gap-1 bg-black/40 px-2 py-0.5 rounded backdrop-blur-md">
                            BY <span className="text-white font-bold">{authorName.toUpperCase()}</span>
                        </span>
                    </div>

                    <motion.h1 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-2xl font-bold text-white leading-tight drop-shadow-xl"
                    >
                        {item.title}
                    </motion.h1>
                </div>

                {/* Article Content */}
                <motion.article 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="prose prose-invert prose-sm max-w-none text-gray-300 leading-relaxed space-y-4 tracking-wide font-light border-b border-white/5 pb-8 mb-8"
                >
                    {item.content.split('\n').map((p, idx) => (
                        <p key={idx} className={p.length < 20 && idx === 0 ? "font-bold text-base text-gray-100" : ""}>
                            {p}
                        </p>
                    ))}
                    
                    <div className="flex items-center justify-between pt-4">
                        <button 
                            onClick={handleArticleLike} 
                            className={`group flex items-center gap-2 px-4 py-2 rounded-full border transition-all active:scale-95 ${liked ? 'bg-pink-500/20 border-pink-500 text-pink-500' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}
                        >
                            <Heart size={16} className={`transition-transform ${liked ? "fill-current scale-110" : "group-hover:scale-110"}`} />
                            <span className="text-xs font-bold">{likeCount}</span>
                        </button>
                        <span className="text-[10px] text-gray-600 font-mono">
                             {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                    </div>
                </motion.article>

                {/* Comments */}
                <div className="pb-10">
                    <div className="flex items-center justify-between mb-5 opacity-80">
                        <div className="flex items-center gap-2">
                            <Terminal size={12} className="text-gray-400" />
                            <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-gray-400">ECHO CHAMBER</span>
                        </div>
                        <span className="text-[9px] text-gray-600 bg-white/5 px-2 py-0.5 rounded-full">{comments.length} REPLIES</span>
                    </div>
                    
                    <div className="space-y-4">
                        {comments.length > 0 ? comments.map((comment: any) => {
                            const stance = STANCE_CONFIG[comment.stance] || STANCE_CONFIG['NEUTRAL'];
                            const Icon = stance.icon;
                            const isCommentLiked = likedComments[comment.id];

                            return (
                                <motion.div 
                                    key={comment.id} 
                                    initial={{ opacity: 0, y: 10 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    className="flex gap-3"
                                >
                                    <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10 shrink-0 mt-1 shadow-lg bg-gray-800">
                                        <img src={AVATAR_MAP[comment.personaName] || '/avatars/ash_hero.jpg'} className="w-full h-full object-cover" />
                                    </div>
                                    
                                    <div className="flex-1 bg-[#121212] border border-white/5 rounded-2xl p-3.5 rounded-tl-none relative group hover:border-white/10 transition-colors">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="text-[11px] font-bold text-gray-200">{comment.personaName}</span>
                                            <div className={`flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded border ${stance.bg} ${stance.border} ${stance.color}`}>
                                                <Icon size={8} />
                                                <span>{stance.label}</span>
                                            </div>
                                        </div>

                                        <p className="text-xs text-gray-400 leading-relaxed mb-3 font-medium">
                                            {comment.content}
                                        </p>
                                        
                                        <div className="flex justify-end">
                                            <button 
                                                onClick={() => handleCommentLike(comment)}
                                                className={`
                                                    relative overflow-hidden flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-bold transition-all active:scale-95
                                                    ${isCommentLiked 
                                                        ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-400' 
                                                        : 'bg-white/5 border-white/10 text-gray-500 hover:bg-white/10 hover:text-gray-300'
                                                    }
                                                `}
                                            >
                                                {isCommentLiked ? (
                                                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                                        <Sparkles size={10} className="fill-cyan-400" />
                                                    </motion.div>
                                                ) : (
                                                    <ThumbsUp size={10} />
                                                )}
                                                <span>{isCommentLiked ? '已共鸣' : '赞同观点'}</span>
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        }) : (
                            <div className="text-center py-6 border border-dashed border-white/10 rounded-xl">
                                <span className="text-[10px] text-gray-600 font-mono">// NO SIGNAL DETECTED</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}