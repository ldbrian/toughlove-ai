// page.tsx - 最终修复后的完整代码

'use client';
import { getDict, getContentText } from '@/lib/i18n/dictionaries';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ChevronLeft, ChevronRight, ChevronDown, 
  MoreVertical, X as XIcon,
  UserPen, Globe, Download, ShoppingBag, RotateCcw, Bug
} from 'lucide-react';
import { LootItem, LangType, PersonaType, MoodType } from '@/types'; // 假设类型已在 types.ts 中定义
import Console from '@/components/Console';
import { DailyNewsBar } from '@/components/DailyNewsBar'; 
import { getLastMessage } from '@/lib/storage';
import { NameModal, FeedbackModal, InstallModal, LangSetupModal } from '@/components/modals/SystemModals';

import { AccessGate } from '@/components/modals/AccessGate'; 
import { OnboardingModal } from '@/components/modals/OnboardingModal';
import { LetterOpenModal } from '@/components/modals/LetterOpenModal';
import { ShopModal } from '@/components/modals/ShopModal'; 
import { InventoryModal } from '@/components/modals/InventoryModal'; 
import { DailyBriefingModal } from '@/components/modals/DailyBriefingModal'; 

import { FocusModal } from '@/components/modals/FocusModal';
import { MemoModal } from '@/components/modals/MemoModal';



// 定义角色常量 (保持一致)
const PERSONAS = {
  Ash: { name: 'Ash', avatar: '/avatars/ash_hero.jpg', color: 'text-cyan-400' },
  Rin: { name: 'Rin', avatar: '/avatars/rin_hero.jpg', color: 'text-purple-400' },
  Sol: { name: 'Sol', avatar: '/avatars/sol_hero.jpg', color: 'text-orange-400' },
  Vee: { name: 'Vee', avatar: '/avatars/vee_hero.jpg', color: 'text-pink-400' },
  Echo: { name: 'Echo', avatar: '/avatars/echo_hero.jpg', color: 'text-slate-400' },
} as const;

// type PersonaType = keyof typeof PERSONAS; // 假设已导入
// type MoodType = 'low' | 'anxious' | 'neutral' | 'angry' | 'high'; // 假设已导入



const WALLPAPER_MAP: Record<string, string> = {
  Ash: '/wallpapers/ash_clinic.jpg',
  Rin: '/wallpapers/rin_room.jpg',
  Sol: '/wallpapers/sol_room.jpg',
  Vee: '/wallpapers/vee_room.jpg',
  Echo: '/wallpapers/echo_room.jpg',
};

const MOOD_OPTIONS: { id: MoodType, label: { zh: string, en: string }, color: string, dotColor: string }[] = [
  { id: 'low', label: { zh: '低落', en: 'Low' }, color: 'text-gray-300 border-gray-500/50 shadow-[0_0_10px_rgba(107,114,128,0.3)]', dotColor: 'bg-gray-400 shadow-[0_0_8px_gray]' },
  { id: 'anxious', label: { zh: '焦虑', en: 'Anxious' }, color: 'text-blue-300 border-blue-500/50 shadow-[0_0_10px_rgba(59,130,246,0.3)]', dotColor: 'bg-blue-400 shadow-[0_0_8px_#3b82f6]' },
  { id: 'neutral', label: { zh: '平稳', en: 'Stable' }, color: 'text-emerald-300 border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.3)]', dotColor: 'bg-emerald-400 shadow-[0_0_8px_#10b981]' },
  { id: 'angry', label: { zh: '暴躁', en: 'Angry' }, color: 'text-red-300 border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.3)]', dotColor: 'bg-red-500 shadow-[0_0_8px_#ef4444]' },
  { id: 'high', label: { zh: '开心', en: 'Happy' }, color: 'text-yellow-300 border-yellow-500/50 shadow-[0_0_10px_rgba(234,179,8,0.3)]', dotColor: 'bg-yellow-400 shadow-[0_0_8px_#eab308]' },
];

const USER_INVENTORY_KEY = 'toughlove_inventory';
const USER_PROFILE_KEY = 'toughlove_user_profile';
const MATCHED_PERSONA_KEY = 'toughlove_matched_persona'; 

// 辅助函数：MetaToast 和 GlobalMenu 保持不变...
interface GlobalMenuProps { onClose: () => void; onEditName: () => void; onSwitchLang: () => void; onInstall: () => void; onShop: () => void; onInventory: () => void; onReset: () => void; onFeedback: () => void; lang: LangType; }
const GlobalMenu = ({ onClose, onEditName, onSwitchLang, onInstall, onShop, onInventory, onReset, onFeedback, lang }: GlobalMenuProps) => {
    const t = getDict(lang); // 获取当前语言字典
  
    return (
      <div className="absolute top-16 right-6 w-48 bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl z-[100] flex flex-col p-1 animate-in fade-in zoom-in-95 duration-200 pointer-events-auto">
          <div className="flex justify-between items-center px-4 py-2 border-b border-white/5">
              <span className="text-xs font-bold text-gray-500">{t.menu.title}</span>
              <button onClick={onClose}><XIcon size={14} className="text-gray-500 hover:text-white" /></button>
          </div>
          <button onClick={onEditName} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-white/5 rounded-xl transition-colors text-left"><UserPen size={16} /> {t.menu.editName}</button>
          <button onClick={onSwitchLang} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-white/5 rounded-xl transition-colors text-left"><Globe size={16} /> {t.menu.lang}</button>
          <button onClick={onInstall} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-white/5 rounded-xl transition-colors text-left"><Download size={16} /> {t.menu.install}</button>
          <button onClick={onShop} className="flex items-center gap-3 px-4 py-3 text-sm text-yellow-500 hover:bg-white/5 rounded-xl transition-colors text-left"><ShoppingBag size={16} /> {t.menu.shop}</button>
          <button onClick={onFeedback} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-white/5 rounded-xl transition-colors text-left"><Bug size={16} /> {t.menu.feedback}</button>
          <button onClick={onReset} className="flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 rounded-xl transition-colors text-left"><RotateCcw size={16} /> {t.menu.reset}</button>
      </div>
    );
  };
const MetaToast = ({ persona, show, onClose, lang }: { persona: string, show: boolean, onClose: () => void, lang: LangType }) => {
  if (!show) return null;
  // @ts-ignore
  const avatar = PERSONAS[persona as keyof typeof PERSONAS]?.avatar || '';
  return (
    <div className="absolute top-20 right-16 z-50 animate-[bounce_2s_infinite] cursor-pointer max-w-[200px]" onClick={onClose}>
        <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[8px] border-b-[#1a1a1a] absolute -top-2 right-6"></div>
        <div className="flex items-center gap-2 bg-[#1a1a1a] border border-[#7F5CFF]/30 px-3 py-2 rounded-xl shadow-[0_4px_15px_rgba(0,0,0,0.5)]">
            <div className="w-5 h-5 rounded-full border border-white/20 overflow-hidden flex-shrink-0">
                <img src={avatar} className="w-full h-full object-cover" />
            </div>
            <span className="text-[10px] text-gray-200 font-bold leading-tight">{lang === 'zh' ? '来选个心情...' : 'Pick a mood...'}</span>
            <div className="p-1 hover:bg-white/10 rounded-full transition-colors flex-shrink-0">
                <XIcon size={10} className="text-gray-500" />
            </div>
        </div>
    </div>
  )
}

export default function ResonancePage() {
  const router = useRouter();

  // 🔥 核心修复 1: 在组件函数体内部初始化状态，确保读取到本地匹配结果
  const ALL_PERSONAS = Object.keys(PERSONAS) as PersonaType[];
  const initialMatchedId = typeof window !== 'undefined' ? localStorage.getItem(MATCHED_PERSONA_KEY) : null;
  const initialPersona = (initialMatchedId && ALL_PERSONAS.includes(initialMatchedId as PersonaType)) 
                         ? (initialMatchedId as PersonaType) 
                         : 'Ash'; // 默认 fallback

  const initialSortedPersonas = initialPersona === 'Ash'
      ? ALL_PERSONAS
      : [initialPersona, ...ALL_PERSONAS.filter(k => k !== initialPersona)];
  
  const [activePersona, setActivePersona] = useState<PersonaType>(initialPersona);
  const [sortedPersonas, setSortedPersonas] = useState<PersonaType[]>(initialSortedPersonas);
  // --------------------------------------------------------------------------

  const [currentMood, setCurrentMood] = useState<MoodType>('neutral');
  const [lang, setLang] = useState<LangType>('zh'); 
  
  const [isMoodOpen, setIsMoodOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [showMenu, setShowMenu] = useState(false); 
  
  const [showNameModal, setShowNameModal] = useState(false);
  const [showShopModal, setShowShopModal] = useState(false); 
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showLangModal, setShowLangModal] = useState(false);
  const [showInventory, setShowInventory] = useState(false); 
  const [showTarot, setShowTarot] = useState(false); 

  const [showFocus, setShowFocus] = useState(false); 
  const [showMemo, setShowMemo] = useState(false);

  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);
  const [isSwitching, setIsSwitching] = useState(false);
  const [memoryText, setMemoryText] = useState<string | null>(null);

  const [tempName, setTempName] = useState('');
  const [userName, setUserName] = useState('Traveler');
  
  const [userBalance, setUserBalance] = useState(100);
  
  const [inventoryItems, setInventoryItems] = useState<LootItem[]>([]); 

  const touchStart = useRef<number | null>(null);

  const [isLocked, setIsLocked] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showLetter, setShowLetter] = useState(false);

  const hydrateInventory = (ids: string[]): LootItem[] => {
    return ids.map(id => ({
        id,
        name: { zh: id, en: id }, 
        description: { zh: '...', en: '...' },
        price: 0,
        rarity: 'common',
        type: 'consumable',
        sourcePersona: undefined, 
        trigger_context: undefined, 
    }));
  };

  useEffect(() => {
    // 数据同步中心
    const syncData = () => {
        const lastMsg = getLastMessage(activePersona); 
        
        // 修复 Console 遮挡: 文本截断增强
        const truncatedMsg = lastMsg && lastMsg.length > 60 
            ? lastMsg.substring(0, 57).trim() + '...' 
            : lastMsg;
            
        setMemoryText(truncatedMsg); 
        loadInventory();
        const savedBalance = localStorage.getItem('toughlove_user_rin');
        if (savedBalance) setUserBalance(parseInt(savedBalance));
    };

    syncData();

    // 门禁检查
    const hasToken = localStorage.getItem('toughlove_access_token');
    if (hasToken === 'GRANTED') {
        setIsLocked(false);
        checkFlow(); 
    }

    const savedName = localStorage.getItem('toughlove_user_name');
    if (savedName) setUserName(savedName);
    
    const savedLang = localStorage.getItem('toughlove_lang_preference');
    if (savedLang) setLang(savedLang as LangType);

    const toastDismissed = localStorage.getItem('toughlove_toast_dismissed');
    if (!toastDismissed) setShowToast(true);

    window.addEventListener('focus', syncData);
    // ⚠️ 依赖 activePersona，以确保状态变化时能重新同步聊天记录/库存。
    return () => window.removeEventListener('focus', syncData);

  }, [activePersona]); 

  const loadInventory = () => {
      const savedInv = localStorage.getItem(USER_INVENTORY_KEY);
      if (savedInv) {
          const ids = JSON.parse(savedInv);
          setInventoryItems(hydrateInventory(ids));
      }
  };

  const checkFlow = () => {
      const hasProfile = localStorage.getItem(USER_PROFILE_KEY);
      if (!hasProfile) {
          setShowOnboarding(true);
          return;
      }

      const matched = localStorage.getItem(MATCHED_PERSONA_KEY);
      
      if (matched) {
          const winner = matched as PersonaType;
          
          // 🏆 核心修复：强制纠正 activePersona 状态
          // 如果 LocalStorage 有匹配结果，且当前 activePersona 不是它，则强制更新。
          if (activePersona !== winner) {
              // ⚠️ 这一步是为了对抗任何外部（如 Ash 默认值）的覆盖。
             setActivePersona(winner); 
          }
          
          // 更新排序列表
          if (sortedPersonas[0] !== winner) {
              const others = ALL_PERSONAS.filter(k => k !== winner) as PersonaType[];
              setSortedPersonas([winner, ...others]); 
          }
      }

      loadInventory(); 
      const savedInv = localStorage.getItem(USER_INVENTORY_KEY);
      const currentInv: string[] = savedInv ? JSON.parse(savedInv) : [];
      if (!currentInv.includes('future_letter')) {
          setShowLetter(true);
      }
  };

  const handleUnlock = () => {
      setIsLocked(false);
      setTimeout(checkFlow, 500); 
  };

  const handleOnboardingFinish = (profile: any) => {
    
      localStorage.removeItem(MATCHED_PERSONA_KEY);
      
      localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
      
      if (
        profile.dominant &&
        typeof profile.dominant === 'string' &&
        (Object.keys(PERSONAS) as PersonaType[]).includes(profile.dominant as PersonaType)
      ) {
          const winner = profile.dominant as PersonaType;
          localStorage.setItem(MATCHED_PERSONA_KEY, winner); 
          
          // ✅ 关键修复：直接在内存中更新状态
          const others = ALL_PERSONAS.filter(k => k !== winner);
          setSortedPersonas([winner, ...others]);
          setActivePersona(winner); 
      }
      
      setShowOnboarding(false);
      setShowLetter(true); // 完成 Onboarding 后直接进入信件环节
  };

  const handleLetterOpen = () => {
      const savedInv = localStorage.getItem(USER_INVENTORY_KEY);
      const currentInv: string[] = savedInv ? JSON.parse(savedInv) : [];
      if (!currentInv.includes('future_letter')) {
          const newInv = [...currentInv, 'future_letter'];
          localStorage.setItem(USER_INVENTORY_KEY, JSON.stringify(newInv));
          loadInventory(); 
      }
      setShowLetter(false);
  };

  const handleBalanceUpdate = (newBalance: number) => {
      setUserBalance(newBalance);
      loadInventory();
  };
  
  const handleReward = (amount: number) => {
      const newBalance = userBalance + amount;
      setUserBalance(newBalance);
      localStorage.setItem('toughlove_user_rin', newBalance.toString());
      loadInventory();
  };

  const handleSend = (text: string, isHidden: boolean = false) => {
      const pId = activePersona.toLowerCase();
      const storageKey = `toughlove_chat_${pId}`;
      const history = JSON.parse(localStorage.getItem(storageKey) || '[]');
      
      const newMessage = { role: 'user', content: text };
      const newHistory = [...history, newMessage];
      
      localStorage.setItem(storageKey, JSON.stringify(newHistory));
      setMemoryText(text);
  };

  const handleTarotCollect = () => {
      loadInventory(); 
  };

  const handleOpenLangMenu = () => {
    setShowMenu(false);
    setShowLangModal(true);
  };

  // ✅ 新增：真正切换语言的函数 (由弹窗调用)
  const handleLangConfirm = (selectedLang: LangType) => {
    setLang(selectedLang);
    localStorage.setItem('toughlove_lang_preference', selectedLang);
    setShowLangModal(false);
    window.dispatchEvent(new Event('toughlove_lang_change'));
  };

  const handleFullReset = () => {
    if(confirm(getDict(lang).menu.resetConfirm)) { 
        Object.keys(localStorage).forEach(key => {
            if(key.startsWith('toughlove_')) {
                localStorage.removeItem(key);
            }
        });
        window.location.reload(); 
    } 
  };

  const handleCloseToast = () => { setShowToast(false); localStorage.setItem('toughlove_toast_dismissed', 'true'); };
  
  const cyclePersona = (direction: 'next' | 'prev') => {
    if (isSwitching) return;
    setIsSwitching(true);
    setSlideDirection(direction === 'next' ? 'right' : 'left');
    
    const keys = sortedPersonas; 
    const idx = keys.indexOf(activePersona);
    
    setTimeout(() => {
        if (direction === 'next') setActivePersona(keys[(idx + 1) % keys.length]);
        else setActivePersona(keys[(idx - 1 + keys.length) % keys.length]);
    }, 150);
    setTimeout(() => { setSlideDirection(null); setIsSwitching(false); }, 300);
  };

  const onTouchStart = (e: React.TouchEvent) => { touchStart.current = e.targetTouches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
      if (!touchStart.current) return;
      if (Math.abs(touchStart.current - e.changedTouches[0].clientX) > 30) cyclePersona(touchStart.current - e.changedTouches[0].clientX > 0 ? 'next' : 'prev');
      touchStart.current = null;
  };

  const handleConsoleAction = (actionId: string, label: string, contextText: string) => {
    if (actionId === 'focus_mode' || actionId === 'timer') {
        setShowFocus(true);
        return;
    }
    if (actionId === 'memo' || actionId === 'note') {
        setShowMemo(true);
        return;
    }
    const params = new URLSearchParams();
    params.set('action', actionId);
    params.set('text', label);
    if (contextText) params.set('context', contextText);
    router.push(`/chat/${activePersona}?${params.toString()}`);
  };

  const handleContinueChat = () => router.push(`/chat/${activePersona}`);
  
  const handleNewsClick = (status: any) => {
      router.push(`/chat/${status.persona}?newsContent=${encodeURIComponent(status.content)}`);
  };

  const currentMoodObj = MOOD_OPTIONS.find(m => m.id === currentMood);
  const safePersona = PERSONAS[activePersona as keyof typeof PERSONAS] || PERSONAS['Ash'];

  return (
    // 🔥 修复 Console 遮挡 1: 移除冗余 class，使用 style 属性确保安全区域留白
    <div 
        className="relative flex flex-col h-screen w-full bg-black text-white overflow-hidden" 
        onTouchStart={onTouchStart} 
        onTouchEnd={onTouchEnd}
        style={{
            // 🏆 稳健修复：增大 base padding (16rem = 64 * 0.25rem) 并加上 env() 变量
            paddingBottom: 'calc(16rem + env(safe-area-inset-bottom))' 
        }}
    >
        {isLocked && <AccessGate onUnlock={handleUnlock} />}
        <OnboardingModal show={showOnboarding} onFinish={handleOnboardingFinish} lang={lang} />
        <LetterOpenModal show={showLetter} onOpen={handleLetterOpen} />
        <ShopModal show={showShopModal} onClose={() => setShowShopModal(false)} userRin={userBalance} onBalanceUpdate={handleBalanceUpdate} lang={lang} />
        
        <FocusModal 
            show={showFocus} 
            onClose={() => setShowFocus(false)} 
            lang={lang} 
            partnerId={activePersona} 
            onReward={handleReward}
            handleSend={handleSend}
        />
        
        <MemoModal 
            show={showMemo} 
            onClose={() => setShowMemo(false)} 
            lang={lang} 
            partnerId={activePersona}
            onReward={handleReward}
            handleSend={handleSend}
        />

        {showInventory && (
            <InventoryModal 
                show={showInventory} 
                onClose={() => setShowInventory(false)} 
                partnerId={activePersona}
                lang={lang} 
                inventory={inventoryItems} 
                setInventory={(newItems: LootItem[]) => {
                    const newIds = newItems.map(item => item.id);
                    setInventoryItems(newItems);
                    localStorage.setItem(USER_INVENTORY_KEY, JSON.stringify(newIds));
                }}
                handleSend={handleSend}
            />
        )}

        <DailyBriefingModal 
            show={showTarot} 
            onClose={() => setShowTarot(false)} 
            lang={lang} 
            onCollect={handleTarotCollect}
            forcedSpeaker={activePersona}
            partnerId={activePersona}
        />

        <NameModal show={showNameModal} onClose={() => setShowNameModal(false)} tempName={tempName} setTempName={setTempName} onSave={() => { setUserName(tempName); localStorage.setItem('toughlove_user_name', tempName); setShowNameModal(false); }} ui={{ title: lang === 'zh' ? '修改昵称' : 'Edit Name', placeholder: 'Name', cancel: 'Cancel', save: 'Save' }} />
        <InstallModal show={showInstallModal} onClose={() => setShowInstallModal(false)} lang={lang} />
        <FeedbackModal show={showFeedbackModal} onClose={() => setShowFeedbackModal(false)} text="" setText={()=>{}} onSubmit={()=>{ setShowFeedbackModal(false); alert(lang === 'zh' ? '已收到反馈' : 'Feedback sent'); }} lang={lang} />
        <LangSetupModal 
            show={showLangModal} 
            lang={lang} 
            onConfirm={handleLangConfirm} 
        />
        <div className="absolute inset-0 z-0 bg-black">
            {Object.keys(WALLPAPER_MAP).map((pKey) => (
                <div key={pKey} className={`absolute inset-0 bg-cover bg-center transition-opacity duration-700 ease-in-out ${activePersona === pKey ? 'opacity-50' : 'opacity-0'} scale-105`} style={{ backgroundImage: `url(${WALLPAPER_MAP[pKey]})` }} />
            ))}
            <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black/95"></div>
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-15 mix-blend-overlay pointer-events-none"></div>
        </div>

        {/* UI 区域 1: Header (保持不变) */}
        <div className="absolute top-0 left-0 right-0 z-50 flex flex-col pointer-events-none bg-black/95">
            <div className="flex justify-between items-center px-6 py-4 pointer-events-auto bg-gradient-to-b from-black/90 to-transparent">
                <div className="flex flex-col gap-0.5 justify-center h-9">
                    <h1 className="text-xl font-black italic tracking-tighter text-white drop-shadow-md">TOUGH.</h1>
                    <span className="text-[8px] tracking-[0.3em] text-gray-400 uppercase opacity-70">RESONANCE V2.9</span>
                </div>
                <div className="flex items-center gap-3 relative">
                    <button onClick={() => { setIsMoodOpen(!isMoodOpen); setShowToast(false); setShowMenu(false); }} className="flex items-center gap-2 pl-3 pr-2 h-9 bg-white/5 border border-white/10 backdrop-blur-md rounded-full hover:bg-white/10 transition-all shadow-lg active:scale-95">
                        <div className={`w-2 h-2 rounded-full ${currentMoodObj?.dotColor || 'bg-white'}`}></div>
                        <span className="text-[10px] font-bold uppercase text-gray-200 tracking-wider"><span className="text-[10px] font-bold uppercase text-gray-200 tracking-wider">
  {getContentText(currentMoodObj?.label, lang)}
</span></span>
                        <ChevronDown size={14} className={`text-gray-400 transition-transform duration-300 ${isMoodOpen ? 'rotate-180' : ''}`} />
                    </button>
                    <button onClick={() => { setShowMenu(!showMenu); setIsMoodOpen(false); }} className="w-9 h-9 flex items-center justify-center bg-white/5 rounded-full hover:bg-white/10 backdrop-blur-md border border-white/5 shadow-lg active:scale-95 transition-all">
                        <MoreVertical size={18} className="text-gray-200"/>
                    </button>
                    {showMenu && (
                        <GlobalMenu 
                            lang={lang}
                            onClose={() => setShowMenu(false)}
                            onEditName={() => { setShowMenu(false); setTempName(userName); setShowNameModal(true); }}
                            onSwitchLang={handleOpenLangMenu}
                            onInstall={() => { setShowMenu(false); setShowInstallModal(true); }}
                            onShop={() => { setShowMenu(false); setShowShopModal(true); }} 
                            onInventory={() => { setShowMenu(false); setShowInventory(true); }} 
                            onFeedback={() => { setShowMenu(false); setShowFeedbackModal(true); }}
                            onReset={handleFullReset}
                        />
                    )}
                </div>
            </div>
            
            <div className="pointer-events-auto transition-opacity duration-300 mt-2">
                <MetaToast persona={activePersona} show={showToast && !isMoodOpen} onClose={handleCloseToast} lang={lang} />
            </div>

            <div className={`pointer-events-auto mx-4 overflow-hidden transition-all duration-300 ease-out ${isMoodOpen ? 'max-h-24 opacity-100 translate-y-0' : 'max-h-0 opacity-0 -translate-y-2'} -mt-4`}>
                <div className="flex bg-black/80 backdrop-blur-xl border border-white/10 rounded-full p-1.5 shadow-2xl gap-2 ring-1 ring-white/5">
                    {MOOD_OPTIONS.map((mood) => {
                        const isActive = currentMood === mood.id;
                        return (
                            <button key={mood.id} onClick={() => { setCurrentMood(mood.id); handleCloseToast(); setTimeout(() => setIsMoodOpen(false), 300); }} className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-full transition-all duration-300 border ${isActive ? `${mood.color} scale-105 z-10` : 'bg-transparent border-transparent text-gray-500 hover:bg-white/5 hover:text-gray-300'}`}>
                                {getContentText(mood.label, lang)}
                            </button>
                        )
                    })}
                </div>
            </div>
        </div>

        {/* UI 区域 2: Main Content */}
        <div className="flex-1 relative z-10 flex flex-col items-center justify-center gap-4 pt-24"> 
            <div className="w-full mb-2 animate-[fadeIn_0.5s_ease-out_0.5s_forwards]">
                <DailyNewsBar onItemClick={handleNewsClick} />
            </div>
            <div className="absolute inset-x-4 top-[40%] -translate-y-1/2 flex justify-between items-center pointer-events-none">
                <button onClick={() => cyclePersona('prev')} className="pointer-events-auto p-2 hover:bg-white/5 rounded-full transition-colors active:scale-95"><ChevronLeft size={32} className="text-white/40 hover:text-white/80" /></button>
                <button onClick={() => cyclePersona('next')} className="pointer-events-auto p-2 hover:bg-white/5 rounded-full transition-colors active:scale-95"><ChevronRight size={32} className="text-white/40 hover:text-white/80" /></button>
            </div>
            <div className="relative w-48 h-48 z-20 mb-8">
                <div className="absolute -inset-4 rounded-full border border-white/5 bg-gradient-to-b from-white/5 to-transparent animate-[spin_10s_linear_infinite] opacity-50"></div>
                <div className="w-full h-full rounded-full overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.6)] border-[1px] border-white/20 bg-black relative z-10 ring-1 ring-white/10">
                     <div key={activePersona} className={`w-full h-full ${slideDirection ? (slideDirection === 'right' ? 'animate-[slideInRight_0.3s]' : 'animate-[slideInLeft_0.3s]') : ''}`}>
                     <img src={safePersona.avatar} className="w-full h-full object-cover scale-110" />
                     </div>
                     <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent mix-blend-overlay"></div>
                </div>
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center z-30 w-max">
                     <div className="px-3 py-0.5 bg-black/80 backdrop-blur-md border border-white/10 rounded-full shadow-lg mb-1">
                         <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${safePersona.color}`}>
                         {safePersona.name}
                         </span>
                     </div>
                </div>
            </div>
            
            {/* 🔥 修复 Console 遮挡 2: 减小 pt-12 到 pt-6，收紧 Console 区域 */}
            <div className={`w-full relative z-30 px-6 pt-6 mt-auto transition-opacity duration-200 ${isSwitching ? 'opacity-0' : 'opacity-100'}`}>
                <Console 
                    key={activePersona} 
                    currentRole={activePersona}
                    currentMood={currentMood}
                    onAction={handleConsoleAction}
                    customText={memoryText} 
                    onContinue={handleContinueChat}
                    lang={lang}
                    inventoryItems={inventoryItems.map(i => i.id)} 
                />
            </div>
        </div>
    </div>
  );
}