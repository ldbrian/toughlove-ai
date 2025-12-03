import { useState, useEffect } from 'react';
import { X, MessageCircle, Sparkles, Share2, ArrowRight, Brain, Coins } from 'lucide-react';
import { TAROT_DECK, PERSONAS, PersonaType } from '@/lib/constants';

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
  forcedSpeaker?: PersonaType | null;
  onClaimSalary?: (amount: number) => void;
}

export const DailyBriefingModal = ({ 
  show, 
  onClose, 
  onJumpToChat, 
  lang, 
  onDataLoaded, 
  onDownloadPoster,
  forcedSpeaker,
  onClaimSalary
}: DailyBriefingProps) => {
  
  const [step, setStep] = useState<'shuffle' | 'choice' | 'reveal'>('shuffle');
  const [card, setCard] = useState<typeof TAROT_DECK[0] | null>(null);
  const [speaker, setSpeaker] = useState<PersonaType>('Ash');
  const [loadingText, setLoadingText] = useState("");
  const [selectedChoice, setSelectedChoice] = useState<'A' | 'B' | null>(null);

  useEffect(() => {
    if (show) {
      const today = new Date().toLocaleDateString();
      const storageKey = 'toughlove_daily_progress_v2.3';
      const savedData = localStorage.getItem(storageKey);
      
      let hasRecordToday = false;
      
      if (savedData) {
        try {
            const parsed = JSON.parse(savedData);
            if (parsed.date === today && parsed.cardId !== undefined) {
                const savedCard = TAROT_DECK.find(c => c.id === parsed.cardId);
                if (savedCard) {
                    setCard(savedCard);
                    setSpeaker(parsed.speaker || 'Ash');
                    if (parsed.choice) {
                        setSelectedChoice(parsed.choice);
                        setStep('reveal');
                    } else {
                        setStep('choice');
                    }
                    hasRecordToday = true;
                }
            }
        } catch(e) {}
      }

      if (!hasRecordToday || forcedSpeaker) {
        startShuffleSequence(today, storageKey);
      }
    }
  }, [show, forcedSpeaker, lang]);

  const startShuffleSequence = (today: string, storageKey: string) => {
      setStep('shuffle');
      setSelectedChoice(null);
      const dominant = forcedSpeaker || getDominantPersona();
      setSpeaker(dominant);
      const steps = lang === 'zh' ? ["链接潜意识...", "读取深层恐惧...", "生成命运镜像..."] : ["Linking...", "Reading Fears...", "Generating..."];
      let i = 0;
      setLoadingText(steps[0]);
      const interval = setInterval(() => {
        i++;
        if (i < steps.length) { setLoadingText(steps[i]); } else {
            clearInterval(interval);
            const randomCard = TAROT_DECK[Math.floor(Math.random() * TAROT_DECK.length)];
            setCard(randomCard);
            setStep('choice');
            const record = { date: today, cardId: randomCard.id, speaker: dominant, choice: null };
            localStorage.setItem(storageKey, JSON.stringify(record));
        }
      }, 800);
  };

  useEffect(() => {
    if (card && onDataLoaded) {
      onDataLoaded({
        content: selectedChoice ? card.choices[selectedChoice].text : card.meaning, 
        share_quote: card.meaning, 
        image: card.image,
        name: lang === 'zh' ? card.name.zh : card.name.en,
        speaker: speaker,
        date: new Date().toLocaleDateString(),
        archetype: selectedChoice ? card.choices[selectedChoice].archetype : ""
      });
    }
  }, [card, selectedChoice, speaker, onDataLoaded, lang]);

  const checkAndPaySalary = () => {
    const today = new Date().toLocaleDateString();
    const salaryKey = 'toughlove_daily_salary_claimed_v2';
    const lastClaimed = localStorage.getItem(salaryKey);
    if (lastClaimed !== today && step === 'reveal') {
        const total = 50 + (Math.random() > 0.8 ? 30 : 0);
        if (onClaimSalary) onClaimSalary(total);
        localStorage.setItem(salaryKey, today);
        alert(lang === 'zh' ? `【系统结算】\n今日精神校准完成。\n算力入账: +${total} RIN` : `[SETTLEMENT]\nCredits: +${total} RIN`);
    }
  };

  const handleChoice = (choice: 'A' | 'B') => {
    setSelectedChoice(choice);
    setStep('reveal');
    if (card) {
        const today = new Date().toLocaleDateString();
        const storageKey = 'toughlove_daily_progress_v2.3';
        const record = { date: today, cardId: card.id, speaker: speaker, choice: choice };
        localStorage.setItem(storageKey, JSON.stringify(record));
    }
  };

  const handleJump = () => {
    checkAndPaySalary();
    if (!card || !selectedChoice) return;
    const choiceData = card.choices[selectedChoice];
    const payload = {
      persona: speaker,
      visibleReaction: lang === 'zh' ? `关于你选择的“${choiceData.text}”...` : `About your choice "${choiceData.text}"...`,
      archetype: choiceData.archetype,
      systemContext: `[EVENT_TRIGGER]: User drew Tarot Card 【${card.name.en}】. Choice: "${choiceData.text}" (${choiceData.archetype}). Inference: "${choiceData.inference}". INSTRUCTION: Interpret this ruthlessly.`
    };
    onJumpToChat(payload);
    onClose();
  };

  const handleCloseInternal = () => {
      if (step === 'reveal') checkAndPaySalary();
      onClose();
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

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-[#000]/95 backdrop-blur-xl animate-[fadeIn_0.5s_ease-out] p-4">
      <button onClick={handleCloseInternal} className="absolute top-6 right-6 p-2 text-gray-500 hover:text-white transition-colors z-50 rounded-full hover:bg-white/10">
          <X size={24} />
      </button>

      {step === 'shuffle' && (
        <div className="flex flex-col items-center gap-6 animate-pulse px-4">
           <div className="w-32 h-48 bg-white/5 rounded-lg border border-white/10 flex items-center justify-center animate-[spin_3s_linear_infinite]">
              <Sparkles className="text-indigo-500" size={32} />
           </div>
           <p className="text-sm font-bold text-white tracking-[0.2em]">{loadingText}</p>
        </div>
      )}

      {/* --- 抉择阶段 --- */}
      {step === 'choice' && card && (
        <div className="w-full max-w-sm flex flex-col items-center animate-[scaleIn_0.4s_ease-out]">
          <div className="text-center mb-6">
             <h2 className="text-3xl font-black text-white mb-1 drop-shadow-lg tracking-wider">{card.name.zh}</h2>
             <p className="text-xs text-indigo-300 font-mono uppercase tracking-[0.3em] opacity-80">{card.name.en}</p>
          </div>
          <div className="relative w-64 aspect-[3/5] mb-8 rounded-xl border-2 border-white/10 overflow-hidden shadow-[0_0_50px_rgba(127,92,255,0.25)] transition-transform hover:scale-[1.02]">
              <img src={card.image} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none"></div>
          </div>
          <p className="text-sm text-gray-400 mb-4 font-bold text-center animate-pulse">你看到了什么？</p>
          <div className="w-full space-y-3 px-2">
             <button onClick={() => handleChoice('A')} className="w-full p-4 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-indigo-500/50 rounded-xl text-left transition-all active:scale-95 group">
               <div className="flex items-center justify-between"><span className="text-sm text-gray-200 group-hover:text-white font-medium">{card.choices.A.text}</span><ArrowRight size={16} className="text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" /></div>
             </button>
             <button onClick={() => handleChoice('B')} className="w-full p-4 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-indigo-500/50 rounded-xl text-left transition-all active:scale-95 group">
               <div className="flex items-center justify-between"><span className="text-sm text-gray-200 group-hover:text-white font-medium">{card.choices.B.text}</span><ArrowRight size={16} className="text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" /></div>
             </button>
          </div>
        </div>
      )}

      {/* --- 揭示阶段 (🔥 Fix: 卡牌放大至 w-64) --- */}
      {step === 'reveal' && card && selectedChoice && (
        <div className="relative w-full max-w-sm flex flex-col items-center animate-[slideUp_0.4s_ease-out]">
          
          {/* 1. 名字 */}
          <div className="text-center mb-4">
             <h2 className="text-2xl font-bold text-white tracking-widest">{card.name.zh}</h2>
          </div>

          {/* 2. 卡牌 (放大) */}
          <div className="relative w-64 aspect-[3/5] mb-6 rounded-xl border border-white/20 overflow-hidden shadow-2xl">
             <img src={card.image} className="w-full h-full object-cover" />
             {/* 底部遮罩显示 Archetype */}
             <div className="absolute bottom-0 inset-x-0 p-3 bg-black/80 backdrop-blur-md text-center border-t border-white/10">
                 <span className="text-xs font-black text-indigo-300 uppercase tracking-widest">
                   {card.choices[selectedChoice].archetype}
                 </span>
             </div>
          </div>

          {/* 3. AI 引导栏 */}
          <div className={`w-full bg-[#111]/95 backdrop-blur-md border ${getSpeakerColor()} rounded-2xl p-5 mb-6 shadow-xl relative overflow-hidden flex items-start gap-4`}>
             <div className="w-10 h-10 rounded-full overflow-hidden border border-white/30 flex-shrink-0 relative z-10 shadow-lg"><img src={PERSONAS[speaker].avatar} className="w-full h-full object-cover" /></div>
             <div className="relative z-10 flex-1">
                 <p className="text-[10px] text-gray-400 mb-1 uppercase tracking-wider font-bold">{speaker} 的洞察</p>
                 <p className="text-sm text-white font-medium leading-relaxed opacity-90">
                    "{lang === 'zh' ? '这个选择很有意思。它暴露了你现在的弱点。' : 'Interesting choice. It reveals your current weakness.'}"
                 </p>
                 <div className="mt-3 inline-flex items-center gap-1 text-[10px] bg-yellow-500/10 text-yellow-500 px-2 py-1 rounded border border-yellow-500/20">
                    <Coins size={10} /> <span>完成奖励: +50 Rin</span>
                 </div>
             </div>
          </div>

          <div className="w-full flex gap-3 px-2">
             <button onClick={handleJump} className="flex-1 py-4 bg-white text-black font-black rounded-xl text-sm hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.2)] animate-pulse">
                <MessageCircle size={18} /> {lang === 'zh' ? '深入解析' : 'Deep Dive'}
             </button>
             <button onClick={onClose} className="px-6 py-4 bg-white/5 border border-white/10 text-white font-bold rounded-xl hover:bg-white/10 transition-colors flex items-center justify-center gap-2">
                <Share2 size={18} />
             </button>
          </div>
        </div>
      )}
    </div>
  );
};