'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCcw, ArrowRight, Sparkles, Zap, Box, MessageSquareDashed, Ghost } from 'lucide-react';
import { useAppLanguage } from '@/hooks/useAppLanguage';

import { SimulationCard, SimStatus } from '@/components/features/simulation/SimulationCard';
import { DailyCalibration } from '@/components/features/calibration/DailyCalibration';
import FeedDetailModal from '@/components/feed/FeedDetailModal';

// 引入模态框
import { FocusModal } from '@/components/modals/FocusModal';
import { MemoModal } from '@/components/modals/MemoModal';
import { LetterOpenModal } from '@/components/modals/LetterOpenModal';
import { LetterContentModal } from '@/components/modals/LetterContentModal'; // 🔥 新增引用
import { TreeHollowModal } from '@/components/modals/TreeHollowModal'; 
import { SleepSignalModal } from '@/components/modals/SleepSignalModal'; 
import { DailyBriefingModal } from '@/components/modals/DailyBriefingModal'; 

import { TASK_POOL } from '@/config/tasks'; 
import { DEMO_SCRIPT_META } from '@/data/demo-script'; 
import { memoryService } from '@/services/memoryService'; 
import { createClient } from '@/utils/supabase/client'; 

export interface FeedItem {
    id: string;
    type: 'editorial' | 'news' | 'social_proof';
    bgImage: string;
    label: string;
    title: string | { zh: string; en: string };
    content: string | { zh: string; en: string };
    action: string | { zh: string; en: string };
    link: string;
    color: string;
    meta?: string;
    personaName?: string; 
    comments?: any[];
}

interface HomeClientProps {
    initialFeed: FeedItem[];
    dailyQuestion: any;
}

export default function HomeClient({ initialFeed, dailyQuestion }: HomeClientProps) {
  const router = useRouter();
  const { t, lang } = useAppLanguage();
  
  // 状态
  const [simStatus] = useState<SimStatus>('LIVE');
  
  // 塔罗牌增强状态
  const [hasTarot, setHasTarot] = useState(false);
  const [tarotCardName, setTarotCardName] = useState<string>(''); 
  const [tarotCardImage, setTarotCardImage] = useState<string>(''); 
  const [tarotKeyword, setTarotKeyword] = useState<string>(''); 
  
  const [feedIndex, setFeedIndex] = useState(0);
  const [selectedFeed, setSelectedFeed] = useState<FeedItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 模态框状态
  const [showFocus, setShowFocus] = useState(false);
  const [showMemo, setShowMemo] = useState(false);
  const [showLetter, setShowLetter] = useState(false); // 信封状态
  const [showLetterContent, setShowLetterContent] = useState(false); // 🔥 信纸状态
  const [showTreeHollow, setShowTreeHollow] = useState(false); 
  const [showSleepSignal, setShowSleepSignal] = useState(false);
  const [showTarotModal, setShowTarotModal] = useState(false); 

  // 身份初始化
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [userId, setUserId] = useState<string>(''); 

  // 组件预览内容
  const [memoPreview, setMemoPreview] = useState("Loading...");

  // 数据
  const [syncRate, setSyncRate] = useState(50);
  const [shardCount, setShardCount] = useState(0);

  const feedData = initialFeed && initialFeed.length > 0 ? initialFeed : [];

  const getLocalizedContent = (content: any) => {
    if (!content) return '';
    if (typeof content === 'string') return content;
    return lang === 'zh' ? (content.zh || content.en) : (content.en || content.zh);
  };

  // --- Auth & Init Logic ---
  useEffect(() => {
    const initAuth = async () => {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        
        let currentUserId = '';

        if (!session) {
            // 匿名登录
            const { data: anonData } = await supabase.auth.signInAnonymously();
            if (anonData?.session?.user) {
                currentUserId = anonData.session.user.id;
            }
        } else {
            currentUserId = session.user.id;
        }

        if (currentUserId) {
            setUserId(currentUserId);
            
            // 🔥 核心修改：不再由前端直接写库，而是请求 API 
            // 这样可以绕过 Supabase RLS 权限问题
            try {
                await fetch('/api/auth/sync', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: currentUserId })
                });
            } catch (err) {
                console.error("Auth Sync API Failed:", err);
            }
        }

        setIsAuthReady(true);
    };
    initAuth();
  }, []);

  useEffect(() => {
    if (!isAuthReady) return;
    async function checkFirstLogin() {
      try {
        const hasLetter = await memoryService.hasItem('future_letter');
        if (!hasLetter) setTimeout(() => setShowLetter(true), 1000);
      } catch (e) { console.error(e); }
    }
    checkFirstLogin();
  }, [isAuthReady]);

  // 🔥 修改处理逻辑：关闭信封 -> 打开信纸
  const handleReceiveLetter = async () => {
    // 1. 关闭信封动画
    setShowLetter(false);
    
    // 2. 延迟显示信纸 (让信封先消失)
    setTimeout(() => {
        setShowLetterContent(true);
    }, 600);

    // 3. 后台记录
    await memoryService.addArtifactToInventory('future_letter');
    await memoryService.unlockAchievement('hello_world');
  };

  useEffect(() => {
    if (feedData.length <= 1 || isModalOpen) return;
    const timer = setInterval(() => setFeedIndex(prev => (prev + 1) % feedData.length), 10000);
    return () => clearInterval(timer);
  }, [feedData.length, isModalOpen]);

  // 塔罗牌状态检查
  useEffect(() => {
    const refreshTarotState = () => {
        const today = new Date().toDateString();
        const lastDraw = localStorage.getItem('toughlove_daily_tarot_log'); 
        
        if (lastDraw) {
            try {
                const log = JSON.parse(lastDraw);
                if (log.date === today) {
                    setHasTarot(true);
                    if (log.cardName) setTarotCardName(log.cardName);
                    
                    if (log.result) {
                        const cardData = JSON.parse(log.result);
                        if (cardData.image) setTarotCardImage(cardData.image);
                        
                        const kws = lang === 'zh' ? cardData.keywords?.zh : cardData.keywords?.en;
                        if (kws && kws.length > 0) setTarotKeyword(kws[0]);
                    }
                }
            } catch (e) { console.error(e); }
        }
    };
    
    refreshTarotState();
    window.addEventListener('storage', refreshTarotState);
    return () => window.removeEventListener('storage', refreshTarotState);
  }, [lang]);

  useEffect(() => {
    const pool = [...(TASK_POOL.common || []), ...(TASK_POOL.rin || [])];
    if (pool.length > 0) {
        const randomTask = pool[Math.floor(Math.random() * pool.length)];
        setMemoPreview(lang === 'zh' ? randomTask.title.zh : randomTask.title.en);
    }
    
    const savedAssets = localStorage.getItem('toughlove_user_assets');
    if (savedAssets) {
        const assets = JSON.parse(savedAssets);
        setSyncRate(assets.syncRate || 50);
        setShardCount(assets.shardCount || 0);
    }
  }, [lang]);

  const handleCalibrationComplete = (newSync: number, newShards: number) => {
      setSyncRate(newSync);
      setShardCount(newShards);
      localStorage.setItem('toughlove_user_assets', JSON.stringify({ syncRate: newSync, shardCount: newShards }));
  };

  const handleActionCallback = (text: string) => {
     console.log('Action:', text);
     if (navigator.vibrate) navigator.vibrate(20);
  };

  const handleSleepSignal = () => {
      if (navigator.vibrate) navigator.vibrate([50]);
      setShowSleepSignal(true);
  };

  const handleViewLog = (item: FeedItem) => {
    setSelectedFeed(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedFeed(null), 300);
  };

  const getTranslatedLabel = (l: string) => {
    if (l === 'SYSTEM') return t.home.system;
    if (l === 'GLITCH') return t.home.glitch;
    if (l === 'COMMUNITY') return t.home.community;
    if (l === "ASH'S LOGIC") return t.home.ashLogic;
    return l;
  };

  const currentFeed = feedData[feedIndex] || { 
      id: 'fallback', 
      type: 'editorial', 
      bgImage: null, 
      color: 'text-gray-500', 
      label: 'LOADING', 
      title: '...', 
      content: 'System Initializing...', 
      action: 'WAIT', 
      link: '/' 
  };

  const scriptTheme = lang === 'zh' ? DEMO_SCRIPT_META.title.zh : DEMO_SCRIPT_META.title.en;

  if (!isAuthReady) {
      return (
          <div className="min-h-screen bg-[#050505] flex items-center justify-center">
              <div className="flex flex-col items-center gap-4 animate-pulse">
                  <Box className="text-cyan-500" size={32} />
                  <p className="text-xs font-mono text-cyan-500/70 tracking-widest">ESTABLISHING LINK...</p>
              </div>
          </div>
      );
  }

  return (
    <div className="min-h-full bg-transparent text-gray-200 font-sans relative flex flex-col pb-32">
      <div className="fixed inset-0 z-[-1] bg-[#050505]" />
      <div className={`absolute top-0 left-0 w-full h-[60vh] bg-gradient-to-b from-${currentFeed.color.split('-')[1]}-900/20 to-transparent pointer-events-none transition-colors duration-1000`} />

      {/* 1. Hero Feed */}
      <section className="relative w-full h-[25vh] min-h-[280px] flex flex-col justify-end overflow-hidden group">
         <AnimatePresence mode='wait'>
            <motion.div key={currentFeed.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }} className="absolute inset-0 z-0">
                <div className="absolute inset-0 w-full h-full">
                {currentFeed.bgImage && (
                    <img 
                        src={currentFeed.bgImage} 
                        alt="bg" 
                        className="w-full h-full object-cover object-[20%_center] opacity-90" 
                        // 🔥 问题就在这个 style 属性，导致图片显示不全
                        style={{ maskImage: 'linear-gradient(to right, black 30%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to right, black 30%, transparent 100%)' }} 
                    />
                )}
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/20 to-transparent" />
            </motion.div>
         </AnimatePresence>
         <div className="relative z-10 px-6 pb-6 w-full flex flex-col items-end text-right">
             <button onClick={(e) => { e.stopPropagation(); setFeedIndex(prev => (prev + 1) % feedData.length); }} className="mb-4 p-2 rounded-full text-white/20 hover:text-white hover:bg-white/10 transition-all active:rotate-180 z-20">
                 <RefreshCcw size={16} />
             </button>
             <motion.div key={currentFeed.id + 'label'} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className={`mb-1 flex items-center gap-2 ${currentFeed.color}`}>
                 <span className="text-[9px] font-black uppercase tracking-[0.2em]">{getTranslatedLabel(currentFeed.label)}</span>
             </motion.div>
             <motion.h2 key={currentFeed.id + 'title'} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-lg font-bold text-white mb-1.5 max-w-[85%] leading-tight">
                 {getLocalizedContent(currentFeed.title)}
             </motion.h2>
             <div className="relative max-w-[90%] md:max-w-[70%]">
                 <motion.p key={currentFeed.id + 'content'} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`text-xs text-gray-300 font-medium leading-relaxed drop-shadow-xl line-clamp-2`}>
                     {getLocalizedContent(currentFeed.content)}
                 </motion.p>
             </div>
             <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleViewLog(currentFeed as any)} className={`mt-4 flex items-center gap-2 px-5 py-2 rounded-full bg-white text-black font-bold text-[10px] shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] transition-all`}>
                 <span>{getLocalizedContent(currentFeed.action)}</span>
                 <ArrowRight size={12} />
             </motion.button>
         </div>
      </section>

      {/* 2. Calibration */}
      <div className="px-5 mt-4 mb-4">
          <DailyCalibration question={dailyQuestion} currentSyncRate={syncRate} currentShards={shardCount} onComplete={handleCalibrationComplete} />
      </div>

      {/* 3. BENTO GRID */}
      <section className="w-full px-5 grid grid-cols-2 gap-3 min-h-[460px] animate-in slide-in-from-bottom-8 duration-700">
          
          {/* LEFT COLUMN */}
          <div className="flex flex-col gap-3 h-full">
              
              {/* [Row 1] Tarot */}
              <motion.div 
                 whileTap={{ scale: 0.98 }}
                 onClick={() => setShowTarotModal(true)}
                 className={`relative flex-[2] rounded-[1.5rem] flex flex-col items-center justify-center overflow-hidden group cursor-pointer shadow-2xl transition-all duration-500 ${hasTarot ? 'shadow-purple-500/20' : 'shadow-purple-900/20 bg-[#0f0a1e] ring-1 ring-white/10'}`}
              >
                  {hasTarot && tarotCardImage ? (
                      // 已抽卡
                      <>
                        <div className="absolute inset-0 w-full h-full overflow-hidden rounded-[1.5rem]">
                            <img src={tarotCardImage} alt="Tarot" className="w-full h-full object-cover opacity-90 group-hover:scale-110 transition-transform duration-700 ease-out" />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent" />
                        
                        <div className="relative z-10 flex flex-col items-center mt-auto mb-6 w-full px-4">
                            <h3 className="text-white text-sm font-bold font-serif tracking-wide mb-1 uppercase drop-shadow-md">
                                {tarotCardName || t.home.fate}
                            </h3>
                            {tarotKeyword && (
                                <span className="text-[9px] text-purple-200/80 font-mono tracking-widest uppercase bg-purple-900/30 px-2 py-0.5 rounded border border-purple-500/20">
                                    {tarotKeyword}
                                </span>
                            )}
                        </div>
                        <div className="absolute inset-0 border border-white/10 rounded-[1.5rem] group-hover:border-purple-500/30 transition-colors pointer-events-none" />
                      </>
                  ) : (
                      // 未抽卡
                      <>
                        <div className="absolute inset-0 bg-gradient-to-br from-[#1a103c] via-[#120b22] to-black" />
                        <div className="relative z-10 flex flex-col items-center gap-3">
                            <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.15)] group-hover:scale-110 group-hover:bg-white/10 transition-all duration-500">
                                 <Sparkles size={24} className="text-purple-300/80 group-hover:text-white transition-colors" />
                            </div>
                            <div className="flex flex-col items-center gap-0.5">
                                <h3 className="text-xs font-bold text-purple-100 tracking-[0.2em]">{t.home.tarot || 'TAROT'}</h3>
                                <span className="text-[9px] text-purple-400/50 font-mono">{t.home.dailyFate || 'Daily Fate'}</span>
                            </div>
                        </div>
                      </>
                  )}
              </motion.div>

              {/* [Row 2] Tree Hollow */}
              <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowTreeHollow(true)}
                  className="flex-[1.5] w-full relative rounded-2xl bg-[#0a1014] border border-emerald-500/10 flex flex-col items-center justify-center gap-1 overflow-hidden group hover:border-emerald-500/30 transition-all"
              >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_var(--tw-gradient-stops))] from-emerald-900/30 to-transparent opacity-60" />
                  
                  <div className="absolute top-2 left-4 w-1 h-1 bg-emerald-500/30 rounded-full animate-pulse" />
                  <div className="absolute bottom-4 right-6 w-1.5 h-1.5 bg-emerald-500/20 rounded-full animate-bounce delay-700" />

                  <Ghost size={22} className="text-emerald-500/60 group-hover:text-emerald-400 transition-colors mb-1 relative z-10" />
                  <span className="text-[10px] font-bold text-emerald-100/90 tracking-widest uppercase relative z-10">{t.home.treeHollow}</span>
                  <span className="text-[8px] text-emerald-500/40 font-mono scale-90 relative z-10">{t.home.echoListening}</span>
              </motion.button>

              {/* [Row 3] Focus */}
              <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowFocus(true)} 
                  className="h-12 w-full relative rounded-xl bg-orange-950/20 border border-orange-500/10 flex items-center justify-center gap-2 overflow-hidden hover:bg-orange-900/20 transition-colors"
              >
                  <Zap size={12} className="text-orange-400" />
                  <span className="text-[10px] font-bold text-orange-200">{t.home.focus}</span>
              </motion.button>
          </div>

          {/* RIGHT COLUMN */}
          <div className="flex flex-col gap-3 h-full">
              
              {/* [Row 1] Simulation */}
              <div className="flex-[2] min-h-0" onClick={() => shardCount >= 5 && router.push('/simulation')}>
                 <div className="h-full w-full">
                    <SimulationCard 
                        status={simStatus} 
                        shardCount={shardCount} 
                        theme={scriptTheme} 
                    />
                 </div>
              </div>

              {/* [Row 2] Sleep Signal */}
              <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSleepSignal}
                  className="flex-[1.5] w-full relative rounded-2xl bg-[#080a14] border border-blue-500/10 flex flex-col items-center justify-center gap-1 overflow-hidden group hover:border-blue-500/30 transition-all"
              >
                   <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-900/30 to-transparent opacity-60" />
                   
                   <div className="flex items-end gap-1 h-3 mb-2 opacity-60 group-hover:opacity-100 transition-opacity">
                       <div className="w-1 bg-blue-400 rounded-full animate-[pulse_1s_ease-in-out_infinite] h-full" />
                       <div className="w-1 bg-blue-400 rounded-full animate-[pulse_1.5s_ease-in-out_infinite] h-[60%]" />
                       <div className="w-1 bg-blue-400 rounded-full animate-[pulse_0.8s_ease-in-out_infinite] h-[80%]" />
                       <div className="w-1 bg-blue-400 rounded-full animate-[pulse_1.2s_ease-in-out_infinite] h-[40%]" />
                   </div>

                   <span className="text-[10px] font-bold text-blue-100/90 tracking-widest uppercase relative z-10">{t.home.sleepSignal}</span>
                   <span className="text-[8px] text-blue-400/40 font-mono scale-90 relative z-10">{t.home.healingFreq}</span>
              </motion.button>

              {/* [Row 3] Sticky Note */}
              <div className="h-12 w-full" onClick={() => { setShowMemo(true); }}>
                  <div className="w-full h-full rounded-xl bg-[#1a1a1a] border border-white/5 flex items-center justify-center gap-2 cursor-pointer hover:bg-[#222] px-3 group">
                      <MessageSquareDashed size={14} className="text-gray-600 group-hover:text-gray-400 transition-colors" />
                      <span className="text-[10px] font-medium text-gray-500 group-hover:text-gray-300 truncate max-w-full transition-colors">
                          {memoPreview || t.home.memo}
                      </span>
                  </div>
              </div>
          </div>
      </section>

      {/* Modals */}
      <FeedDetailModal isOpen={isModalOpen} onClose={handleCloseModal} feedItem={selectedFeed as any} />
      <FocusModal show={showFocus} onClose={() => setShowFocus(false)} lang={lang} partnerId="sol" handleSend={handleActionCallback} />
      <MemoModal show={showMemo} onClose={() => setShowMemo(false)} lang={lang} partnerId="rin" handleSend={handleActionCallback} />
      
      <TreeHollowModal 
        show={showTreeHollow} 
        onClose={() => setShowTreeHollow(false)} 
        lang={lang} 
        partnerId="echo" 
        userId={userId} 
      />
      
      <SleepSignalModal 
        show={showSleepSignal} 
        onClose={() => setShowSleepSignal(false)} 
        lang={lang} 
      />

      <DailyBriefingModal 
        show={showTarotModal} 
        onClose={() => setShowTarotModal(false)} 
        lang={lang} 
        onCollect={() => {
            window.dispatchEvent(new Event('storage'));
        }}
      />

      {showLetter && <LetterOpenModal onReceive={handleReceiveLetter} />}
      <LetterContentModal show={showLetterContent} onClose={() => setShowLetterContent(false)} />
    </div>
  );
}