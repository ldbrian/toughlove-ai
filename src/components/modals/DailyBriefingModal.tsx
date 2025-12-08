import { useState, useEffect } from 'react';
import { X, Sparkles, Download, Clock } from 'lucide-react';
import { TAROT_DECK, LangType } from '@/lib/constants';

interface DailyBriefingModalProps {
  show: boolean;
  onClose: () => void;
  lang: LangType;
  onJumpToChat?: (payload: any) => void; 
  forcedSpeaker?: string;
  // 🔥 新增回调
  onCollect?: () => void;
}

const STORAGE_KEY = 'toughlove_daily_tarot_log';

export const DailyBriefingModal = ({ show, onClose, lang, onCollect }: DailyBriefingModalProps) => {
  const [step, setStep] = useState<'SHUFFLE' | 'DRAW' | 'REVEAL' | 'REVIEW'>('SHUFFLE');
  const [selectedCard, setSelectedCard] = useState<any>(null);
  const [isFlipping, setIsFlipping] = useState(false);

  useEffect(() => {
    if (show) {
      checkDailyStatus();
    }
  }, [show]);

  const checkDailyStatus = () => {
    const today = new Date().toISOString().split('T')[0];
    const savedLog = localStorage.getItem(STORAGE_KEY);
    
    if (savedLog) {
        const log = JSON.parse(savedLog);
        if (log.date === today && log.cardId !== undefined) {
            const card = TAROT_DECK.find(c => c.id === log.cardId);
            setSelectedCard(card);
            setStep('REVIEW');
            return;
        }
    }

    setStep('SHUFFLE');
    setSelectedCard(null);
    setTimeout(() => setStep('DRAW'), 1200);
  };

  const handleDraw = () => {
    if (step !== 'DRAW') return;

    const randomCard = TAROT_DECK[Math.floor(Math.random() * TAROT_DECK.length)];
    setSelectedCard(randomCard);
    setIsFlipping(true);

    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
        date: today,
        cardId: randomCard.id
    }));
    
    setTimeout(() => {
        setStep('REVEAL');
        setIsFlipping(false);
    }, 600);
  };

  const handleCollect = () => {
    if (!selectedCard) return;

    // 逻辑：清空旧塔罗，存入新塔罗
    const newLootId = `tarot_${selectedCard.id}`;
    const savedInv = localStorage.getItem('toughlove_inventory');
    let currentInv: string[] = savedInv ? JSON.parse(savedInv) : [];

    currentInv = currentInv.filter(id => !id.startsWith('tarot_'));
    if (!currentInv.includes(newLootId)) {
        currentInv.push(newLootId);
    }

    localStorage.setItem('toughlove_inventory', JSON.stringify(currentInv));
    if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
    
    // 🔥 通知父组件刷新状态
    if (onCollect) onCollect();

    onClose();
  };

  if (!show) return null;

  // ... (UI 渲染部分保持不变，直接复用上一次的代码即可，或者你需要我再完整发一遍？为了节省 token 我就不重复发 UI 部分了，逻辑改动只有 handleCollect)
  // 为了确保你方便复制，这里还是提供完整的 UI 返回结构
  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 animate-in fade-in duration-300">
      
      {step !== 'SHUFFLE' && !isFlipping && (
          <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors z-50">
            <X size={20} className="text-white" />
          </button>
      )}

      <div className="flex flex-col items-center justify-center w-full max-w-md text-center relative">
        <div className="mb-8 space-y-2 h-16"> 
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-[10px] font-bold tracking-widest uppercase">
                <Sparkles size={12} /> {lang === 'zh' ? '每日命运' : 'DAILY FATE'}
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight animate-[fadeIn_0.5s]">
                {step === 'SHUFFLE' && (lang === 'zh' ? '正在洗牌...' : 'SHUFFLING...')}
                {step === 'DRAW' && (lang === 'zh' ? '抽取你的暗示' : 'DRAW YOUR CARD')}
                {(step === 'REVEAL' || step === 'REVIEW') && selectedCard && (lang === 'zh' ? selectedCard.name.zh : selectedCard.name.en)}
            </h2>
        </div>

        <div className="relative w-64 h-96 mb-8 perspective-1000 flex-shrink-0">
            {step === 'SHUFFLE' && (
                <div className="absolute inset-0 w-full h-full">
                    {[0, 1, 2].map((i) => (
                        <div key={i} className="absolute inset-0 bg-gradient-to-br from-[#2a2a2a] to-[#111] border border-white/10 rounded-xl shadow-2xl animate-[pulse_1s_infinite]" 
                             style={{ 
                                 transform: `translate(${i * 4}px, ${i * 4}px) rotate(${i * 2}deg)`,
                                 zIndex: 10 - i
                             }}>
                             <div className="absolute inset-0 flex items-center justify-center opacity-10">
                                 <Sparkles size={48} />
                             </div>
                        </div>
                    ))}
                </div>
            )}

            {step === 'DRAW' && (
                <div 
                    onClick={handleDraw}
                    className="absolute inset-0 w-full h-full bg-gradient-to-br from-[#7F5CFF] to-[#3b218f] border-2 border-white/20 rounded-xl shadow-[0_0_30px_rgba(127,92,255,0.3)] flex items-center justify-center cursor-pointer hover:scale-[1.02] transition-transform duration-300 group z-20"
                >
                    <div className="absolute inset-2 border border-white/20 border-dashed rounded-lg flex items-center justify-center">
                        <span className="text-4xl animate-bounce">👆</span>
                    </div>
                    <div className="absolute bottom-6 text-xs font-bold tracking-widest text-white/50 group-hover:text-white transition-colors">
                        TAP TO REVEAL
                    </div>
                </div>
            )}

            {(step === 'REVEAL' || step === 'REVIEW' || isFlipping) && selectedCard && (
                <div className={`absolute inset-0 w-full h-full transition-all duration-500 transform-style-3d z-30 ${isFlipping ? 'rotate-y-180 opacity-0 scale-90' : 'opacity-100 scale-100'}`}>
                    <div className="w-full h-full bg-black rounded-xl overflow-hidden border-2 border-purple-500 shadow-[0_0_50px_rgba(168,85,247,0.4)] relative">
                        <img src={selectedCard.image} className="w-full h-full object-cover" alt="tarot" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90"></div>
                        <div className="absolute bottom-0 left-0 right-0 p-6 text-left">
                            <p className="text-purple-400 text-xs font-bold tracking-widest mb-1 uppercase">
                                {selectedCard.keywords.join(' / ')}
                            </p>
                            <p className="text-gray-200 text-sm leading-relaxed font-medium">
                                {selectedCard.meaning}
                            </p>
                        </div>
                        {step === 'REVIEW' && (
                            <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 rounded text-[9px] text-gray-400 flex items-center gap-1 border border-white/10">
                                <Clock size={10} /> {lang === 'zh' ? '今日已抽' : 'Daily Record'}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>

        {(step === 'REVEAL' || step === 'REVIEW') && (
            <button 
                onClick={handleCollect}
                className="w-full max-w-xs py-4 bg-white text-black font-black text-sm tracking-widest rounded-xl hover:bg-gray-200 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
            >
                {step === 'REVIEW' ? (
                    lang === 'zh' ? '关闭' : 'CLOSE'
                ) : (
                    <>
                        <Download size={18} />
                        {lang === 'zh' ? '收入背包' : 'COLLECT CARD'}
                    </>
                )}
            </button>
        )}

      </div>
    </div>
  );
};