import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, RefreshCw } from 'lucide-react';
import { LangType } from '@/types';
import { createClient } from '@/utils/supabase/client';
import { memoryService } from '@/services/memoryService';

// 🔥 核心修复：对齐最新的 Prisma Schema
interface DbTarotCard {
    id: number;
    // Prisma 中定义为 Json，这里定义为具体对象结构
    name: { zh: string; en: string }; 
    image: string; // 数据库列名是 image，不是 image_url
    meaning: { zh: string; en: string };
    keywords: { zh: string[]; en: string[] }; // 关键词也是双语对象
    reactions: any;
}

interface TarotDrawModalProps {
    show: boolean;
    onClose: () => void;
    lang: LangType;
}

export const TarotDrawModal = ({ show, onClose, lang }: TarotDrawModalProps) => {
    const [state, setState] = useState<'IDLE' | 'FETCHING' | 'SHUFFLING' | 'DRAWN' | 'REVEALED'>('IDLE');
    const [deck, setDeck] = useState<DbTarotCard[]>([]);
    const [selectedCard, setSelectedCard] = useState<DbTarotCard | null>(null);
    const [error, setError] = useState<string | null>(null);

    const supabase = createClient();

    useEffect(() => {
        if (show) {
            setState('IDLE');
            setSelectedCard(null);
            setError(null);
            fetchDeck();
        }
    }, [show]);

    const fetchDeck = async () => {
        try {
            setState('FETCHING');
            // 直接 select * 即可，Supabase 会自动处理 JSON 列
            const { data, error } = await supabase
                .from('tarot_cards')
                .select('*');

            if (error) throw error;
            if (!data || data.length === 0) throw new Error('No cards found in DB');

            setDeck(data as unknown as DbTarotCard[]);
            setState('IDLE');
        } catch (err: any) {
            console.error('Failed to fetch tarot:', err);
            setError('Database Connection Failed');
        }
    };

    const handleDraw = () => {
        if (state !== 'IDLE' || deck.length === 0) return;
        
        setState('SHUFFLING');
        if (navigator.vibrate) navigator.vibrate(50);

        setTimeout(() => {
            const randomCard = deck[Math.floor(Math.random() * deck.length)];
            setSelectedCard(randomCard);
            setState('DRAWN');
            
            setTimeout(() => {
                setState('REVEALED');
                if (navigator.vibrate) navigator.vibrate([50, 100]);
                
                // 保存日志到本地 (适配新的对象结构)
                const log = {
                    date: new Date().toDateString(),
                    cardName: lang === 'zh' ? randomCard.name.zh : randomCard.name.en,
                    result: JSON.stringify(randomCard),
                    timestamp: Date.now()
                };
                localStorage.setItem('toughlove_daily_tarot_log', JSON.stringify(log));
                
                // 保存到数据库 (Inventory)
                memoryService.addTarotToInventory(randomCard.id).catch(console.error);
                
                // 通知首页刷新状态
                window.dispatchEvent(new Event('storage'));
            }, 800); 
        }, 1500);
    };

    if (!show) return null;

    // 辅助获取当前语言内容
    const currentName = selectedCard ? (lang === 'zh' ? selectedCard.name.zh : selectedCard.name.en) : '';
    const currentMeaning = selectedCard ? (lang === 'zh' ? selectedCard.meaning.zh : selectedCard.meaning.en) : '';
    const currentKeywords = selectedCard ? (lang === 'zh' ? selectedCard.keywords.zh : selectedCard.keywords.en) : [];

    return (
        <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center font-sans touch-none">
            <button onClick={onClose} className="absolute top-6 right-6 p-4 text-gray-500 hover:text-white z-20">
                <X size={24} />
            </button>

            <AnimatePresence mode='wait'>
                {error && (
                    <motion.div initial={{opacity:0}} animate={{opacity:1}} className="text-red-500 font-mono text-xs">
                        [SYSTEM ERROR]: {error} <br/> 请检查数据库连接或运行 Seed 脚本。
                    </motion.div>
                )}

                {(state === 'IDLE' || state === 'SHUFFLING' || state === 'FETCHING') && !error && (
                    <motion.div 
                        key="deck"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
                        className="relative cursor-pointer group"
                        onClick={handleDraw}
                    >
                        <div className={`w-64 h-[24rem] rounded-xl border-2 border-white/10 bg-zinc-900 shadow-2xl transition-all duration-500 flex items-center justify-center ${state === 'SHUFFLING' ? 'animate-pulse' : 'group-hover:border-purple-500/50'}`}>
                            {state === 'FETCHING' ? (
                                <RefreshCw className="text-white/20 animate-spin" size={40} />
                            ) : (
                                <Sparkles className="text-purple-500/30" size={60} />
                            )}
                        </div>
                        <p className="text-center mt-8 text-xs font-mono text-gray-500 tracking-[0.3em] uppercase animate-pulse">
                            {state === 'FETCHING' ? 'SYNCING...' : state === 'SHUFFLING' ? 'SHUFFLING...' : 'TAP TO DRAW'}
                        </p>
                    </motion.div>
                )}

                {state === 'REVEALED' && selectedCard && (
                    <motion.div 
                        key="card"
                        initial={{ opacity: 0, rotateY: 90 }}
                        animate={{ opacity: 1, rotateY: 0 }}
                        className="flex flex-col items-center max-w-md w-full px-8"
                    >
                        <div className="w-64 h-[24rem] rounded-xl border border-white/20 overflow-hidden shadow-[0_0_50px_rgba(168,85,247,0.2)] mb-8 bg-zinc-900 relative">
                            {/* 🔥 修正：使用 image 字段 */}
                            <img src={selectedCard.image} alt="Tarot" className="w-full h-full object-cover" />
                            <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/90 to-transparent pt-12 text-center">
                                <h2 className="text-xl font-bold text-white font-serif tracking-widest">
                                    {currentName}
                                </h2>
                            </div>
                        </div>

                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-center space-y-4"
                        >
                            <p className="text-sm text-gray-300 italic leading-relaxed font-serif opacity-80">
                                "{currentMeaning}"
                            </p>
                            
                            <div className="flex flex-wrap gap-2 justify-center mt-2 opacity-50">
                                {Array.isArray(currentKeywords) && currentKeywords.map((kw, i) => (
                                    <span key={i} className="text-[9px] px-2 py-1 rounded border border-white/10 uppercase tracking-wider">
                                        {kw}
                                    </span>
                                ))}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};