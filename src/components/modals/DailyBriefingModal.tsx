

import { useState, useEffect } from 'react';
import { X, ThumbsUp, ThumbsDown, MessageCircle, Sparkles, Share2 } from 'lucide-react';
import { TAROT_DECK, PERSONAS, PersonaType } from '@/lib/constants';

// 辅助：获取今日主讲人
const getDominantPersona = (): PersonaType => {
  if (typeof window === 'undefined') return 'Ash';
  const candidates: PersonaType[] = ['Ash', 'Rin', 'Sol', 'Vee'];
  return candidates[Math.floor(Math.random() * candidates.length)];
};

interface DailyBriefingProps {
  show: boolean;
  onClose: () => void;
  onJumpToChat: (payload: any) => void;
  lang: string;
  onDataLoaded?: (data: any) => void;
  onDownloadPoster?: () => void;
  // 🔥 新增：允许父组件强制指定谁来讲（用于新用户引导）
  forcedSpeaker?: PersonaType | null; 
}

export const DailyBriefingModal = ({ 
  show, 
  onClose, 
  onJumpToChat, 
  lang, 
  onDataLoaded, 
  onDownloadPoster,
  forcedSpeaker // <--- 接收这个新参数
}: DailyBriefingProps) => {
  
  const [step, setStep] = useState<'feedback' | 'shuffle' | 'reveal'>('feedback');
  const [card, setCard] = useState<typeof TAROT_DECK[0] | null>(null);
  const [speaker, setSpeaker] = useState<PersonaType>('Ash');
  const [lastBriefing, setLastBriefing] = useState<any>(null);
  const [loadingText, setLoadingText] = useState("");

  // 初始化检查
  useEffect(() => {
    if (show) {
      // 如果有强制指定的主讲人（新用户场景），直接跳过复盘，开始洗牌
      if (forcedSpeaker) {
        startShuffleProcess();
        return;
      }

      const savedLast = localStorage.getItem('toughlove_last_briefing_card');
      if (savedLast) {
        try {
            const parsed = JSON.parse(savedLast);
            const today = new Date().toLocaleDateString();
            
            if (parsed.date === today) {
                const foundCard = TAROT_DECK.find(c => c.name.zh === parsed.name.zh || c.name.zh === parsed.name);
                if (foundCard) {
                    setCard(foundCard);
                    const currentSpeaker = parsed.speaker || 'Ash';
                    setSpeaker(currentSpeaker);
                    setStep('reveal');
                    syncToPoster(foundCard, currentSpeaker);
                    return;
                }
            }
            setLastBriefing(parsed);
            setStep('feedback');
        } catch(e) {
            startShuffleProcess();
        }
      } else {
        startShuffleProcess();
      }
    }
  }, [show, forcedSpeaker]); // 依赖增加 forcedSpeaker

  // ... (syncToPoster 和 getLastCardImage 函数保持不变) ...
  const syncToPoster = (currentCard: any, currentSpeaker: PersonaType) => {
    if (onDataLoaded) {
      onDataLoaded({
        content: (currentCard.reactions as any)[currentSpeaker], 
        share_quote: currentCard.meaning, 
        image: currentCard.image,
        name: lang === 'zh' ? currentCard.name.zh : currentCard.name.en,
        speaker: currentSpeaker,
        date: new Date().toLocaleDateString()
      });
    }
  };

  const getLastCardImage = () => {
    if (!lastBriefing) return null;
    const nameZh = typeof lastBriefing.name === 'string' ? lastBriefing.name : lastBriefing.name.zh;
    const found = TAROT_DECK.find(c => c.name.zh === nameZh);
    return found ? found.image : null;
  };
  // ... (以上函数保持不变)

  const startShuffleProcess = () => {
    setStep('shuffle');
    const steps = lang === 'zh' 
      ? ["链接潜意识...", "五维议会集结...", "抽取命运剧本..."]
      : ["Linking Subconscious...", "Assembling Council...", "Drafting Fate..."];
    let i = 0;
    setLoadingText(steps[0]);
    const interval = setInterval(() => {
        i++;
        if (i < steps.length) {
            setLoadingText(steps[i]);
        } else {
            clearInterval(interval);
            finishShuffle();
        }
    }, 800);
  };

  const finishShuffle = () => {
    const randomCard = TAROT_DECK[Math.floor(Math.random() * TAROT_DECK.length)];
    
    // 🔥 核心修改：如果 forcedSpeaker 存在，优先使用它；否则才随机
    const dominant = forcedSpeaker || getDominantPersona();
    
    setCard(randomCard);
    setSpeaker(dominant);
    
    localStorage.setItem('toughlove_last_briefing_card', JSON.stringify({
      name: randomCard.name,
      date: new Date().toLocaleDateString(),
      speaker: dominant
    }));
    
    setStep('reveal');
    syncToPoster(randomCard, dominant);
  };
  
  // ... (剩下的 handleFeedback, handleJump, handleShare, getSpeakerColor, getCardImage, return JSX 等所有代码保持不变) ...
  // (为节省篇幅，这里不重复粘贴下方未修改的 UI 代码，请保留原样)
  
  const handleFeedback = (isAccurate: boolean) => {
    startShuffleProcess(); 
  };

  const handleJump = () => {
    if (!card) return;
    const reaction = (card.reactions as any)[speaker];
    
    const payload = {
      persona: speaker,
      systemContext: `[EVENT_TRIGGER]: User just drew Tarot Card 【${card.name.zh} (${card.name.en})】.
        Card Meaning: ${card.meaning}
        User Action: Clicked card to discuss.`,
      visibleReaction: reaction
    };
    onJumpToChat(payload);
    onClose();
  };

  const handleShare = () => {
    if (onDownloadPoster) {
      onDownloadPoster();
    }
  };

  const getSpeakerColor = () => {
    switch(speaker) {
        case 'Ash': return 'border-blue-500/30 text-blue-400';
        case 'Rin': return 'border-pink-500/30 text-pink-400';
        case 'Sol': return 'border-emerald-500/30 text-emerald-400';
        case 'Vee': return 'border-purple-500/30 text-purple-400';
        default: return 'border-white/20 text-gray-400';
    }
  };

  const getCardImage = () => {
    if (card?.image) return card.image;
    return "https://images.unsplash.com/photo-1636412929876-47dfd2ce4415?q=80&w=1000&auto=format&fit=crop";
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-[#000]/95 backdrop-blur-xl animate-[fadeIn_0.5s_ease-out]">
      <button onClick={onClose} className="absolute top-6 right-6 p-2 text-gray-500 hover:text-white transition-colors z-50 rounded-full hover:bg-white/10">
          <X size={24} />
      </button>

      {/* --- 阶段 1: 复盘 --- */}
      {step === 'feedback' && lastBriefing && !forcedSpeaker && ( 
         /* 🔥 注意：如果是新用户引导(forcedSpeaker)，不显示复盘，直接洗牌 */
        <div className="text-center space-y-8 animate-[slideUp_0.3s_ease-out] max-w-xs px-4">
           {/* ... 原有复盘 UI 代码 ... */}
           <div className="relative mx-auto w-32 aspect-[2/3]">
             <div className="absolute inset-0 bg-indigo-500/20 blur-[30px] rounded-full"></div>
             <div className="w-full h-full rounded-lg border border-white/10 overflow-hidden relative z-10 transform rotate-[-2deg]">
                <img src={getLastCardImage() || ""} className="w-full h-full object-cover opacity-80" />
             </div>
          </div>
          <div>
            <h3 className="text-xl font-bold text-white mb-2">{lang === 'zh' ? '星轨校准' : 'Calibration'}</h3>
            <p className="text-sm text-gray-400">
              昨日剧本：<span className="text-indigo-400 font-bold">{lang === 'zh' ? (lastBriefing.name.zh || lastBriefing.name) : lastBriefing.name.en}</span>
              <br/>准吗？
            </p>
          </div>
          <div className="flex gap-6 justify-center">
            <button onClick={() => handleFeedback(false)} className="p-4 bg-white/5 rounded-full hover:bg-white/10 transition-colors"><ThumbsDown size={20} /></button>
            <button onClick={() => handleFeedback(true)} className="p-4 bg-white/5 rounded-full hover:bg-white/10 transition-colors"><ThumbsUp size={20} /></button>
          </div>
        </div>
      )}

      {/* --- 阶段 2: 洗牌 (UI代码不变) --- */}
      {step === 'shuffle' && (
        <div className="flex flex-col items-center gap-6 animate-pulse px-4">
           <div className="w-32 h-48 bg-white/5 rounded-lg border border-white/10 flex items-center justify-center animate-[spin_3s_linear_infinite]">
              <Sparkles className="text-indigo-500" size={32} />
           </div>
           <p className="text-sm font-bold text-white tracking-[0.2em]">{loadingText}</p>
        </div>
      )}

      {/* --- 阶段 3: 揭示 (UI代码不变) --- */}
      {step === 'reveal' && card && (
        <div className="relative w-full max-w-sm p-6 flex flex-col items-center animate-[scaleIn_0.4s_ease-out]">
          {/* ... 原有 Card UI ... */}
          <div className="relative w-full aspect-[2/3] mb-6 group perspective-1000">
              <div className="w-full h-full rounded-2xl border border-white/20 relative overflow-hidden shadow-2xl transition-transform duration-500 group-hover:scale-[1.02]">
                  <img src={getCardImage()} className="w-full h-full object-cover opacity-90" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent"></div>
                  <div className="absolute bottom-6 left-0 w-full text-center">
                      <h2 className="text-3xl font-black text-white mb-1 drop-shadow-md">{card.name.zh}</h2>
                      <p className="text-[10px] text-indigo-300 font-mono uppercase tracking-widest">{card.name.en}</p>
                  </div>
              </div>
          </div>

          <div className={`w-full bg-[#111]/90 backdrop-blur-md border ${getSpeakerColor()} rounded-xl p-5 mb-6 shadow-lg`}>
             <div className="flex items-center gap-3 mb-2">
                 <div className="w-6 h-6 rounded-full overflow-hidden border border-white/30">
                     <img src={PERSONAS[speaker].avatar} className="w-full h-full object-cover" />
                 </div>
                 <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{speaker} 的解读</span>
             </div>
             <p className="text-sm text-gray-200 leading-relaxed">
                "{(card.reactions as any)[speaker]}"
             </p>
          </div>

          <div className="w-full flex gap-3">
             <button onClick={handleJump} className="flex-1 py-3.5 bg-white text-black font-bold rounded-full text-sm hover:bg-gray-200 transition-colors flex items-center justify-center gap-2">
                <MessageCircle size={16} /> 聊聊
             </button>
             <button onClick={handleShare} className="px-6 py-3.5 bg-white/10 border border-white/10 text-white font-bold rounded-full hover:bg-white/20 transition-colors flex items-center justify-center gap-2">
                <Share2 size={16} /> 保存护身符
             </button>
          </div>
        </div>
      )}
    </div>
  );
};