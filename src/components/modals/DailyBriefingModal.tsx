
import { useState, useEffect } from 'react';
import { X, Sparkles, Download, Share2, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LangType } from '@/types';
import { ShareModal } from '@/components/shared/ShareModal';
import { createClient } from '@/utils/supabase/client';
import { memoryService } from '@/services/memoryService';

interface TarotCardData {
  id: string;
  dbId: number;
  name: { zh: string; en: string };
  image: string;
  desc: { zh: string; en: string }; 
  keywords: { zh: string[]; en: string[] }; 
}

interface DailyBriefingModalProps {
  show: boolean;
  onClose: () => void;
  lang: LangType;
  onCollect?: () => void;
}

export const DailyBriefingModal = ({ show, onClose, lang, onCollect }: DailyBriefingModalProps) => {
  // 新增 REVIEW 状态，用于回看
  const [step, setStep] = useState<'LOADING' | 'SHUFFLE' | 'DRAW' | 'REVEAL' | 'REVIEW'>('LOADING');
  const [deck, setDeck] = useState<TarotCardData[]>([]);
  const [selectedCard, setSelectedCard] = useState<TarotCardData | null>(null);
  const [showShare, setShowShare] = useState(false);

  // 1. 初始化逻辑：判断是“新抽”还是“回看”
  useEffect(() => {
    if (show) {
      checkTodayStatus();
    }
  }, [show]);

  const checkTodayStatus = async () => {
      // 检查本地缓存
      const today = new Date().toDateString();
      const lastDraw = localStorage.getItem('toughlove_daily_tarot_log');
      
      let foundToday = false;
      if (lastDraw) {
          try {
              const log = JSON.parse(lastDraw);
              if (log.date === today && log.result) {
                  // 命中缓存：直接进入 REVIEW 模式
                  const savedCard = JSON.parse(log.result);
                  setSelectedCard(savedCard);
                  setStep('REVIEW');
                  foundToday = true;
              }
          } catch (e) { console.error(e); }
      }

      // 如果没抽过，才去拉取牌库准备洗牌
      if (!foundToday) {
          setStep('LOADING');
          fetchDeck();
      }
  };

  const fetchDeck = async () => {
    const supabase = createClient();
    const { data, error } = await supabase.from('tarot_cards').select('*');
    
    if (error || !data) {
        console.error("Failed to fetch deck:", error);
        return;
    }

    const formattedDeck: TarotCardData[] = data.map(card => ({
        id: `tarot_${card.id}`,
        dbId: card.id,
        name: { zh: card.name_zh, en: card.name_en },
        image: card.image_url,
        desc: card.meaning,
        keywords: card.keywords
    }));

    setDeck(formattedDeck);
    // 自动开始洗牌
    setTimeout(() => setStep('SHUFFLE'), 500);
  };

  // 2. 抽卡流程
  const handleDraw = () => {
    if (step !== 'SHUFFLE' || deck.length === 0) return;
    
    if (navigator.vibrate) navigator.vibrate(50);
    setStep('DRAW');
    
    const randomIndex = Math.floor(Math.random() * deck.length);
    const card = deck[randomIndex];
    setSelectedCard(card);

    setTimeout(() => {
        setStep('REVEAL');
        if (navigator.vibrate) navigator.vibrate([50, 100]);
        
        // 🔥 关键修改：只保存数据，不关闭窗口！
        saveResultToStorageAndDB(card);
    }, 1500);
  };

  // 3. 保存逻辑
  const saveResultToStorageAndDB = async (card: TarotCardData) => {
      // 存本地
      const log = {
          date: new Date().toDateString(),
          cardName: lang === 'zh' ? card.name.zh : card.name.en,
          result: JSON.stringify(card),
          timestamp: Date.now()
      };
      localStorage.setItem('toughlove_daily_tarot_log', JSON.stringify(log));

      // 存数据库 (后台静默执行)
      memoryService.addTarotToInventory(card.id).catch(console.error);

      // 通知首页变色，但不关闭模态框
      if (onCollect) onCollect(); 
      window.dispatchEvent(new Event('storage'));
  };

  // 4. 用户点击关闭/收下
  const handleConfirmClose = () => {
      onClose();
      // 延迟重置状态，避免动画跳变
      setTimeout(() => {
          setStep('LOADING');
          setSelectedCard(null);
      }, 300);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center font-sans touch-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-black to-black pointer-events-none" />

        {/* 只有在 Review 或 Loading 模式允许直接关闭，正在抽的时候锁死 */}
        {(step === 'REVIEW' || step === 'LOADING' || step === 'SHUFFLE') && (
            <button onClick={handleConfirmClose} className="absolute top-6 right-6 p-4 text-gray-500 hover:text-white z-20">
                <X size={24} />
            </button>
        )}

        <AnimatePresence mode="wait">
            
            {/* 阶段 1: 洗牌 */}
            {(step === 'SHUFFLE' || step === 'LOADING') && (
                <motion.div 
                    key="shuffle"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.2, filter: "blur(10px)" }}
                    className="relative flex flex-col items-center gap-8 cursor-pointer"
                    onClick={handleDraw}
                >
                    <div className="relative w-64 h-96">
                        {[...Array(3)].map((_, i) => (
                            <motion.div 
                                key={i}
                                animate={{ 
                                    rotate: step === 'SHUFFLE' ? [0, 5, -5, 0] : 0,
                                    y: step === 'SHUFFLE' ? [0, -10, 0] : 0
                                }}
                                transition={{ repeat: Infinity, duration: 2, delay: i * 0.2, ease: "easeInOut" }}
                                className="absolute inset-0 rounded-xl border border-white/10 bg-zinc-900 shadow-2xl"
                                style={{ zIndex: 10 - i, transform: `translateY(${i * 4}px) scale(${1 - i * 0.05})` }}
                            >
                                <div className="w-full h-full bg-[url('/tarot/card_back.jpg')] bg-cover bg-center rounded-xl opacity-80" />
                            </motion.div>
                        ))}
                        
                        <div className="absolute inset-0 rounded-xl border-2 border-purple-500/30 bg-zinc-900 shadow-[0_0_30px_rgba(168,85,247,0.2)] flex items-center justify-center z-20">
                             <div className="w-full h-full bg-[url('/tarot/card_back.jpg')] bg-cover bg-center rounded-xl opacity-90" />
                             <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl backdrop-blur-[1px]">
                                 {step === 'LOADING' ? <RefreshCw className="text-white/50 animate-spin" size={48} /> : <Sparkles className="text-purple-400 animate-pulse" size={64} />}
                             </div>
                        </div>
                    </div>
                    <p className="text-xs font-mono text-purple-300/70 tracking-[0.3em] animate-pulse">
                        {step === 'LOADING' ? 'SYNCING...' : (lang === 'zh' ? '点击抽取命运' : 'TAP TO DRAW FATE')}
                    </p>
                </motion.div>
            )}

            {/* 阶段 2: 结果展示 (REVEAL / REVIEW) */}
            {(step === 'REVEAL' || step === 'REVIEW') && selectedCard && (
                <motion.div 
                    key="reveal"
                    initial={{ opacity: 0, rotateY: 90 }}
                    animate={{ opacity: 1, rotateY: 0 }}
                    transition={{ type: "spring", stiffness: 100, damping: 20 }}
                    className="flex flex-col items-center max-w-md w-full px-6 z-10"
                >
                    <div className="w-72 h-[26rem] rounded-xl border border-white/20 overflow-hidden shadow-[0_0_60px_rgba(168,85,247,0.25)] mb-8 bg-black relative group">
                        <img src={selectedCard.image} alt="Tarot" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-80" />
                        <div className="absolute bottom-0 w-full p-6 text-center">
                            <h2 className="text-3xl font-black text-white font-serif tracking-wide mb-1">
                                {lang === 'zh' ? selectedCard.name.zh : selectedCard.name.en}
                            </h2>
                            <div className="flex flex-wrap gap-2 justify-center mt-2 opacity-80">
                                {(lang === 'zh' ? selectedCard.keywords.zh : selectedCard.keywords.en).map((kw, i) => (
                                    <span key={i} className="text-[10px] px-2 py-0.5 rounded border border-white/20 uppercase tracking-wider text-gray-300 bg-white/5">
                                        {kw}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-center space-y-6 w-full">
                        <p className="text-sm text-gray-300 leading-relaxed italic font-serif px-4 border-l-2 border-purple-500/50 mx-auto max-w-[85%]">
                            "{lang === 'zh' ? selectedCard.desc.zh : selectedCard.desc.en}"
                        </p>

                        <div className="flex gap-4 pt-4 w-full px-4">
                            <button onClick={() => setShowShare(true)} className="flex-1 py-3 bg-white/5 border border-white/10 text-white rounded-xl text-xs font-bold tracking-widest hover:bg-white/10 transition-colors flex items-center justify-center gap-2">
                                <Share2 size={16} />
                                {lang === 'zh' ? '分享' : 'SHARE'}
                            </button>
                            <button onClick={handleConfirmClose} className="flex-[2] py-3 bg-white text-black rounded-xl text-xs font-black tracking-widest hover:bg-gray-200 transition-colors flex items-center justify-center gap-2">
                                <Download size={16} />
                                {/* 如果是刚抽的显示收入，如果是回看显示关闭 */}
                                {step === 'REVEAL' 
                                    ? (lang === 'zh' ? '收入背包' : 'COLLECT') 
                                    : (lang === 'zh' ? '关闭' : 'CLOSE')}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>

        {selectedCard && (
            <ShareModal 
                show={showShare}
                onClose={() => setShowShare(false)}
                type="tarot"
                lang={lang}
                data={{
                    card: lang === 'zh' ? selectedCard.name.zh : selectedCard.name.en,
                    desc_zh: selectedCard.desc.zh,
                    desc_en: selectedCard.desc.en,
                    img: selectedCard.image,
                    keyword: (lang === 'zh' ? selectedCard.keywords.zh[0] : selectedCard.keywords.en[0]) || 'Fate'
                }}
            />
        )}
    </div>
  );
};