'use client';

import { useState, useEffect, useRef } from 'react';
import { X, ThumbsUp, ThumbsDown, MessageCircle, ArrowRight, Sparkles, Quote, Share2 } from 'lucide-react';
import { TAROT_DECK, PERSONAS, PersonaType } from '@/lib/constants';
import html2canvas from 'html2canvas';

// 辅助：获取今日主讲人
const getDominantPersona = (): PersonaType => {
  if (typeof window === 'undefined') return 'Ash';
  const candidates: PersonaType[] = ['Ash', 'Rin', 'Sol', 'Vee'];
  return candidates[Math.floor(Math.random() * candidates.length)];
};

export const DailyBriefingModal = ({ show, onClose, onJumpToChat, lang }: any) => {
  
  const [step, setStep] = useState<'feedback' | 'shuffle' | 'reveal'>('feedback');
  const [card, setCard] = useState<typeof TAROT_DECK[0] | null>(null);
  const [speaker, setSpeaker] = useState<PersonaType>('Ash');
  const [lastBriefing, setLastBriefing] = useState<any>(null);
  
  // 分享模式状态
  const [isSharing, setIsSharing] = useState(false);
  const shareRef = useRef<HTMLDivElement>(null);
  const [loadingText, setLoadingText] = useState("");

  // 初始化检查
  useEffect(() => {
    if (show) {
      const savedLast = localStorage.getItem('toughlove_last_briefing_card');
      if (savedLast) {
        try {
            const parsed = JSON.parse(savedLast);
            const today = new Date().toLocaleDateString();
            
            // 如果已存的日期是今天，直接显示结果（Review Mode）
            if (parsed.date === today) {
                const foundCard = TAROT_DECK.find(c => c.name.zh === parsed.name.zh || c.name.zh === parsed.name);
                if (foundCard) {
                    setCard(foundCard);
                    setSpeaker(parsed.speaker || 'Ash');
                    setStep('reveal');
                    return;
                }
            }
            
            // 否则进入昨日复盘流程
            setLastBriefing(parsed);
            setStep('feedback');
        } catch(e) {
            startShuffleProcess();
        }
      } else {
        startShuffleProcess();
      }
    }
  }, [show]);

  // 🔥 新增：获取昨日卡牌图片的辅助函数
  const getLastCardImage = () => {
    if (!lastBriefing) return null;
    // 兼容旧数据（可能是字符串）和新数据（对象）
    const nameZh = typeof lastBriefing.name === 'string' ? lastBriefing.name : lastBriefing.name.zh;
    const found = TAROT_DECK.find(c => c.name.zh === nameZh);
    // 如果找不到（比如新增了卡牌但本地存的是旧名），给个默认图或背面图
    return found ? found.image : "https://images.unsplash.com/photo-1636412929876-47dfd2ce4415?q=80&w=1000&auto=format&fit=crop";
  };

  // 启动洗牌流程
  const startShuffleProcess = () => {
    setStep('shuffle');
    
    const steps = lang === 'zh' 
      ? ["正在链接潜意识...", "五维议会集结中...", "正在抽取今日剧本..."]
      : ["Linking Subconscious...", "Assembling Council...", "Drafting Daily Script..."];
    
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
    const dominant = getDominantPersona();
    
    setCard(randomCard);
    setSpeaker(dominant);
    
    localStorage.setItem('toughlove_last_briefing_card', JSON.stringify({
      name: randomCard.name,
      date: new Date().toLocaleDateString(),
      speaker: dominant
    }));
    
    setStep('reveal');
  };

  const handleFeedback = (isAccurate: boolean) => {
    console.log(`User feedback: ${isAccurate}`);
    startShuffleProcess(); 
  };

  const handleJump = () => {
    if (!card) return;
    const reaction = (card.reactions as any)[speaker];
    
    const payload = {
      persona: speaker,
      systemContext: `[EVENT_TRIGGER]: User just drew Tarot Card 【${card.name.zh} (${card.name.en})】.
        Card Meaning: ${card.meaning}
        Your Preset Reaction was: "${reaction}"
        User Action: Clicked card to discuss with you.
        GOAL: Continue the conversation naturally based on this card.`,
      visibleReaction: reaction
    };
    onJumpToChat(payload);
    onClose();
  };

  const handleShare = async () => {
    if (!shareRef.current) return;
    setIsSharing(true); 
    try {
      await new Promise(r => setTimeout(r, 100));
      const canvas = await html2canvas(shareRef.current, {
        backgroundColor: '#000000', 
        scale: 3, 
        useCORS: true
      } as any);
      const url = canvas.toDataURL("image/png");
      const a = document.createElement('a');
      a.href = url;
      a.download = `ToughLove_Fate_${new Date().toISOString().slice(0,10)}.png`;
      a.click();
    } catch (e) {
      console.error("Share failed", e);
    } finally {
      setIsSharing(false);
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
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-[#000]/98 backdrop-blur-3xl animate-[fadeIn_0.5s_ease-out]">
      
      {!isSharing && (
        <button onClick={onClose} className="absolute top-6 right-6 p-2 text-gray-500 hover:text-white transition-colors z-50 rounded-full hover:bg-white/10">
          <X size={24} />
        </button>
      )}

      {/* --- 阶段 1: 复盘 --- */}
      {step === 'feedback' && lastBriefing && (
        <div className="text-center space-y-8 animate-[slideUp_0.3s_ease-out] max-w-xs relative px-4">
          
          {/* 🔥 修改点：不再显示 Echo 头像，改为显示昨日卡牌 */}
          <div className="relative mx-auto">
             <div className="absolute inset-0 bg-indigo-500/30 blur-[40px] rounded-full"></div>
             {/* 卡牌容器：2:3 比例，圆角矩形 */}
             <div className="w-32 aspect-[2/3] mx-auto rounded-xl border border-white/15 overflow-hidden shadow-[0_0_50px_rgba(99,102,241,0.3)] relative z-10 transform rotate-[-2deg] hover:rotate-0 transition-all duration-500">
                <img 
                    src={getLastCardImage() || ""} 
                    className="w-full h-full object-cover opacity-90" 
                    alt="Yesterday's Card"
                />
                {/* 增加一个暗角渐变，让文字更清晰 */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                <div className="absolute bottom-3 left-0 right-0 text-center">
                    <span className="text-[10px] text-indigo-200 font-bold uppercase tracking-widest border-b border-indigo-500/50 pb-0.5">Yesterday</span>
                </div>
             </div>
          </div>

          <div>
            <h3 className="text-xl font-bold text-white mb-2 tracking-wider">
               {lang === 'zh' ? '星轨校准' : 'Fate Calibration'}
            </h3>
            <p className="text-sm text-gray-400 leading-relaxed font-serif">
              昨天的剧本是 <br/>
              <span className="text-indigo-400 font-bold text-lg mx-1 inline-block mt-1">
                {lang === 'zh' ? (lastBriefing.name.zh || lastBriefing.name) : (lastBriefing.name.en || lastBriefing.name)}
              </span>
              <br/><br/>
              {lang === 'zh' ? '如果满分是 100，它有多准？' : 'Was it accurate?'}
            </p>
          </div>

          <div className="flex gap-6 justify-center">
            <button onClick={() => handleFeedback(false)} className="group flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-white/5 group-hover:bg-red-500/20 text-gray-500 group-hover:text-red-400 transition-all border border-white/10 group-hover:border-red-500/50 flex items-center justify-center">
                    <ThumbsDown size={24} />
                </div>
                <span className="text-[10px] text-gray-600 group-hover:text-red-500/70 tracking-widest">NOPE</span>
            </button>
            <button onClick={() => handleFeedback(true)} className="group flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-white/5 group-hover:bg-green-500/20 text-gray-500 group-hover:text-green-400 transition-all border border-white/10 group-hover:border-green-500/50 flex items-center justify-center">
                    <ThumbsUp size={24} />
                </div>
                <span className="text-[10px] text-gray-600 group-hover:text-green-500/70 tracking-widest">SPOT ON</span>
            </button>
          </div>
        </div>
      )}

      {/* --- 阶段 2: 洗牌 --- */}
      {step === 'shuffle' && (
        <div className="flex flex-col items-center gap-8 animate-pulse px-4 text-center">
          <div className="relative">
             <div className="absolute inset-0 bg-indigo-600 blur-[80px] opacity-40"></div>
             <div className="w-40 h-64 bg-gradient-to-tr from-[#0f0f0f] to-[#1a1a1a] rounded-xl border border-white/10 flex items-center justify-center relative z-10 shadow-2xl animate-[spin_4s_linear_infinite]">
                <div className="w-24 h-24 rounded-full border-2 border-dashed border-white/10 flex items-center justify-center">
                    <Sparkles className="text-indigo-500/80" size={32} />
                </div>
             </div>
          </div>
          <div className="space-y-2">
             <p className="text-sm font-bold text-white tracking-[0.2em] uppercase min-h-[20px]">
               {loadingText}
             </p>
             <div className="flex justify-center gap-1">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{animationDelay:'0s'}}></span>
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{animationDelay:'0.2s'}}></span>
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{animationDelay:'0.4s'}}></span>
             </div>
          </div>
        </div>
      )}

      {/* --- 阶段 3: 揭示 (保持不变) --- */}
      {step === 'reveal' && card && (
        <div className="relative w-full h-full flex flex-col items-center justify-center p-6 animate-[scaleIn_0.4s_cubic-bezier(0.16,1,0.3,1)]">
          
          <div ref={shareRef} className="relative p-6 pb-6 rounded-3xl bg-[#000000] flex flex-col items-center border border-white/10 shadow-2xl min-w-[320px] max-w-sm">
              
              <div className="w-full flex justify-between items-center mb-6 border-b border-white/5 pb-3">
                  <div className="flex flex-col text-left">
                      <span className="text-[10px] text-indigo-400 font-bold tracking-[0.2em] uppercase">Today's Script</span>
                      <span className="text-[8px] text-gray-500">{lang === 'zh' ? '此乃今日之命运' : 'Your Fate Awaits'}</span>
                  </div>
                  <div className="text-[8px] text-gray-600 font-mono">{new Date().toLocaleDateString()}</div>
              </div>

              <div className="relative mb-6 group perspective-1000 w-full">
                 <div className="w-full aspect-[2/3] bg-[#080808] border border-white/15 rounded-xl relative overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.5)] flex flex-col items-center transition-transform duration-500 hover:scale-[1.02]">
                    <div className="absolute inset-0">
                        <img 
                            src={getCardImage()} 
                            alt={card.name.en} 
                            className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-700" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/30"></div>
                    </div>

                    <div className="relative z-10 w-full h-full flex flex-col justify-end px-6 pb-6 text-center">
                        <h2 className="text-3xl font-black text-white mb-1 tracking-wide drop-shadow-lg">{card.name.zh}</h2>
                        <div className="w-6 h-0.5 bg-indigo-500 mx-auto mb-2 shadow-[0_0_10px_#6366f1]"></div>
                        <p className="text-[10px] text-indigo-200 font-mono uppercase tracking-widest">{card.name.en}</p>
                    </div>
                 </div>
              </div>

              <div className={`w-full bg-[#111]/80 backdrop-blur-md border ${getSpeakerColor()} rounded-xl p-5 relative shadow-lg`}>
                 <div className="absolute -top-4 left-4 w-10 h-10 rounded-full border-2 border-[#000] overflow-hidden shadow-lg bg-black">
                     <img src={PERSONAS[speaker].avatar} className="w-full h-full object-cover" />
                 </div>
                 <div className="pl-8">
                     <div className="text-[9px] font-bold text-gray-500 mb-1 uppercase tracking-widest flex items-center gap-2">
                        {speaker} 
                        <span className="w-1 h-1 bg-white/30 rounded-full"></span>
                        <span className="text-indigo-400">{lang === 'zh' ? '剧本解读' : 'Reaction'}</span>
                     </div>
                     <p className="text-xs text-gray-200 font-medium leading-relaxed">
                        "{(card.reactions as any)[speaker] || '...'}"
                     </p>
                 </div>
              </div>

              <div className="w-full mt-6 pt-3 border-t border-dashed border-white/10 flex justify-between items-center opacity-60">
                  <div className="text-left">
                      <p className="text-[8px] tracking-[0.2em] text-white font-black uppercase">TOUGHLOVE.ONLINE</p>
                  </div>
                  <div className="w-8 h-8 bg-white p-0.5 rounded flex items-center justify-center overflow-hidden">
                      <img 
                        src="/qrcode.png" 
                        onError={(e) => (e.currentTarget.src = '/icon.png')} 
                        alt="QR" 
                        className="w-full h-full object-contain" 
                      />
                  </div>
              </div>
          </div>

          <div className="w-full max-w-sm mt-6 flex gap-3">
             <button 
                onClick={handleJump}
                className="flex-1 py-4 rounded-full bg-white text-black font-black text-sm tracking-widest flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:scale-105 transition-transform active:scale-95"
             >
                <MessageCircle size={18} className="fill-black" />
                {lang === 'zh' ? `找他聊聊` : `Chat`}
             </button>
             <button 
                onClick={handleShare}
                className="px-5 py-4 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-sm flex items-center justify-center transition-colors border border-white/5"
                title="保存护身符"
             >
                <Share2 size={18} />
             </button>
          </div>
          
          <div className="mt-4 text-center">
             <button className="text-[10px] text-gray-600 hover:text-gray-400 transition-colors border-b border-transparent hover:border-gray-600 pb-0.5" onClick={onClose}>
                跳过，我只想一个人静静
             </button>
          </div>

        </div>
      )}
    </div>
  );
};