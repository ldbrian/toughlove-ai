import { useState, useEffect } from 'react';
import { X, Sparkles, Download, Clock, Share2 } from 'lucide-react';
import { LangType } from '@/types';
import { useContent } from '@/contexts/ContentContext';
import { ShareModal } from '@/components/shared/ShareModal';

// 🔥 1. 升级接口定义：严格匹配双语结构
interface TarotCardData {
  id: string;
  name: { zh: string; en: string };
  image: string;
  // 必须是双语对象
  desc: { zh: string; en: string }; 
  // 关键词也支持双语
  keywords: { zh: string[]; en: string[] }; 
}

interface DailyBriefingModalProps {
  show: boolean;
  onClose: () => void;
  lang: LangType;
  onJumpToChat?: (payload: any) => void; 
  forcedSpeaker?: string;
  onCollect?: () => void;
  partnerId: string;
}

const STORAGE_KEY = 'toughlove_daily_tarot_log';

export const DailyBriefingModal = ({ show, onClose, lang, onCollect }: DailyBriefingModalProps) => {
  const { tarotDeck } = useContent(); 
  const [step, setStep] = useState<'LOADING' | 'SHUFFLE' | 'DRAW' | 'REVEAL' | 'REVIEW'>('LOADING');
  const [selectedCard, setSelectedCard] = useState<TarotCardData | null>(null);
  const [isFlipping, setIsFlipping] = useState(false);
  
  const [showShare, setShowShare] = useState(false);

  // 辅助：获取本地图片文件名
  const getTarotFilename = (id: string) => {
      const map: Record<string, string> = {
          '0': 'fool.jpg', '1': 'magician.jpg', '2': 'high_priestess.jpg', '3': 'empress.jpg',
          '4': 'emperor.jpg', '5': 'hierophant.jpg', '6': 'lovers.jpg', '7': 'chariot.jpg',
          '8': 'strength.jpg', '9': 'hermit.jpg', '10': 'wheel_of_fortune.jpg', '11': 'justice.jpg',
          '12': 'hanged_man.jpg', '13': 'death.jpg', '14': 'temperance.jpg', '15': 'devil.jpg',
          '16': 'tower.jpg', '17': 'star.jpg', '18': 'moon.jpg', '19': 'sun.jpg',
          '20': 'judgement.jpg', '21': 'world.jpg'
      };
      const cleanId = String(id).replace(/^tarot_/, '');
      return map[cleanId] || 'fool.jpg';
  };

  // 🔥 2. 数据清洗函数
  const normalizeCard = (raw: any): TarotCardData => {
      if (!raw) return { 
          id: 'unknown', 
          name: {zh:'?',en:'?'}, 
          image: '', 
          desc: {zh:'...',en:'...'}, 
          keywords: {zh:[], en:[]} 
      };
      
      const nameObj = {
          zh: raw.name_zh || raw.name?.zh || '未知',
          en: raw.name_en || raw.name?.en || 'Unknown'
      };

      const descObj = {
          zh: raw.desc_zh || raw.description_zh || raw.desc?.zh || raw.meaning?.zh || '暂无解读...',
          en: raw.desc_en || raw.description_en || raw.desc?.en || raw.meaning?.en || 'No description available.'
      };

      let keysZh: string[] = [];
      let keysEn: string[] = [];

      if (Array.isArray(raw.keywords)) keysZh = raw.keywords;
      else if (typeof raw.keywords === 'string') keysZh = [raw.keywords]; 
      else if (raw.metadata?.keywords) keysZh = raw.metadata.keywords;

      if (Array.isArray(raw.keywords_en)) keysEn = raw.keywords_en;
      else if (typeof raw.keywords_en === 'string') keysEn = [raw.keywords_en];

      if (keysZh.length === 0) keysZh = ['命运'];
      if (keysEn.length === 0) keysEn = ['Fate'];

      let imgSrc = raw.image_url || raw.image || '';
      if (!imgSrc || !imgSrc.includes('/')) {
          if (raw.id !== undefined) {
             imgSrc = `/tarot/${getTarotFilename(raw.id)}`; 
          }
      }

      return {
          id: raw.id,
          name: nameObj,
          image: imgSrc,
          desc: descObj,
          keywords: { zh: keysZh, en: keysEn }
      };
  };

  // 🔥 3. 核心修复：依赖项增加 tarotDeck，并处理数据未加载的情况
  useEffect(() => {
    if (show) {
      checkDailyStatus();
    }
  }, [show, tarotDeck]); // <--- 关键：当牌组加载完毕后，会再次触发检查

  const checkDailyStatus = () => {
    // 🛡️ 防御：如果牌组还没从 DB 加载回来，先不要做决定，保持 LOADING
    if (!tarotDeck || tarotDeck.length === 0) {
        return; 
    }

    // 🕒 时区修复：使用本地日期，而不是 UTC
    const today = new Date().toLocaleDateString(); 
    const savedLog = localStorage.getItem(STORAGE_KEY);
    
    if (savedLog) {
        try {
            const log = JSON.parse(savedLog);
            // 检查是否是今天，并且记录了 cardId
            if (log.date === today && log.cardId !== undefined) {
                // 强制类型转换 String 比较，防止 '0' !== 0
                const raw = tarotDeck.find((c:any) => String(c.id) === String(log.cardId));
                
                if (raw) {
                    setSelectedCard(normalizeCard(raw));
                    setStep('REVIEW'); // 命中今日记录，直接进 REVIEW
                    return; 
                }
            }
        } catch (e) {
            console.error("Log parse error", e);
        }
    }

    // 如果没有今日记录，或者解析失败，进入洗牌流程
    setStep('SHUFFLE');
    setSelectedCard(null);
    setTimeout(() => setStep('DRAW'), 1200);
  };

  const handleDraw = () => {
    if (step !== 'DRAW') return;
    if (!tarotDeck || tarotDeck.length === 0) return;

    const randomRaw = tarotDeck[Math.floor(Math.random() * tarotDeck.length)];
    const card = normalizeCard(randomRaw);
    
    setSelectedCard(card);
    setIsFlipping(true);

    // 🕒 时区修复：保存时也用本地日期
    const today = new Date().toLocaleDateString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
        date: today,
        cardId: randomRaw.id
    }));
    
    setTimeout(() => {
        setStep('REVEAL');
        setIsFlipping(false);
    }, 600);
  };

  const handleCollect = () => {
    if (!selectedCard) return;

    const strId = String(selectedCard.id);
    const newLootId = strId.startsWith('tarot_') ? strId : `tarot_${strId}`;

    const savedInv = localStorage.getItem('toughlove_inventory');
    let currentInv: string[] = savedInv ? JSON.parse(savedInv) : [];

    currentInv = currentInv.filter(id => !id.startsWith('tarot_'));
    if (!currentInv.includes(newLootId)) {
        currentInv.push(newLootId);
    }

    localStorage.setItem('toughlove_inventory', JSON.stringify(currentInv));
    if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
    if (onCollect) onCollect();
    onClose();
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 animate-in fade-in duration-300">
      
      {step !== 'SHUFFLE' && step !== 'LOADING' && !isFlipping && (
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
                {step === 'LOADING' && (lang === 'zh' ? '正在连接命运...' : 'CONNECTING FATE...')}
                {step === 'SHUFFLE' && (lang === 'zh' ? '正在洗牌...' : 'SHUFFLING...')}
                {step === 'DRAW' && (lang === 'zh' ? '抽取你的暗示' : 'DRAW YOUR CARD')}
                {(step === 'REVEAL' || step === 'REVIEW') && selectedCard && (lang === 'zh' ? selectedCard.name.zh : selectedCard.name.en)}
            </h2>
        </div>

        <div className="relative w-64 h-96 mb-8 perspective-1000 flex-shrink-0">
            {(step === 'SHUFFLE' || step === 'LOADING') && (
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
                        <img 
                            src={selectedCard.image} 
                            className="w-full h-full object-cover" 
                            alt="tarot" 
                            onError={(e) => {
                                console.error('Image load failed:', selectedCard.image);
                                e.currentTarget.style.display = 'none'; 
                            }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90"></div>
                        <div className="absolute bottom-0 left-0 right-0 p-6 text-left">
                            <p className="text-purple-400 text-xs font-bold tracking-widest mb-1 uppercase">
                                {lang === 'zh' 
                                    ? (selectedCard.keywords.zh[0] || '神秘') 
                                    : (selectedCard.keywords.en[0] || 'MYSTERY')}
                            </p>
                            <p className="text-gray-200 text-sm leading-relaxed font-medium">
                                {lang === 'zh' ? selectedCard.desc.zh : selectedCard.desc.en}
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

        {(step === 'REVEAL' || step === 'REVIEW') && selectedCard && (
            <div className="w-full max-w-xs flex flex-col gap-3">
                <button 
                    onClick={() => setShowShare(true)}
                    className="w-full py-3 border border-white/20 bg-white/5 text-white font-bold text-xs tracking-widest rounded-xl hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
                >
                    <Share2 size={16} />
                    {lang === 'zh' ? '分享命运' : 'SHARE FATE'}
                </button>

                <button 
                    onClick={handleCollect}
                    className="w-full py-4 bg-white text-black font-black text-sm tracking-widest rounded-xl hover:bg-gray-200 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
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

                <ShareModal 
                    show={showShare}
                    onClose={() => setShowShare(false)}
                    type="tarot"
                    lang={lang}
                    data={{
                        lang: lang,
                        card: lang === 'zh' ? selectedCard.name.zh : selectedCard.name.en,
                        keyword: lang === 'zh' ? (selectedCard.keywords.zh[0] || '命运') : (selectedCard.keywords.en[0] || 'FATE'),
                        desc_zh: selectedCard.desc.zh,
                        desc_en: selectedCard.desc.en,
                        img: getTarotFilename(selectedCard.id)
                    }}
                />
            </div>
        )}

      </div>
    </div>
  );
};