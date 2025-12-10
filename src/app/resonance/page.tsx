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

  // src/app/page.tsx

return (
    // 🔴 修改 1: 去掉 h-screen，改为 h-full。
    // 这样它会自适应 layout 给它的空间，不会强行撑破屏幕。
    // 同时去掉之前的 style padding，改用更直接的 padding class。
    <div 
        className="relative flex flex-col h-full w-full bg-black text-white overflow-hidden" 
        onTouchStart={onTouchStart} 
        onTouchEnd={onTouchEnd}
    >
        {isLocked && <AccessGate onUnlock={handleUnlock} />}
        {/* ... 其他 Modal 组件保持不变 ... */}
        
        {/* 背景层保持不变 */}
        <div className="absolute inset-0 z-0 bg-black">
            {/* ... wallpaper 代码 ... */}
        </div>

        {/* UI 区域 1: Header 保持不变 */}
        <div className="absolute top-0 left-0 right-0 z-50 flex flex-col pointer-events-none bg-black/95">
            {/* ... header 内容 ... */}
        </div>

        {/* UI 区域 2: Main Content */}
        {/* 🔴 修改 2: 这里的 pt-24 可以保留，确保内容不被 Header 遮挡 */}
        <div className="flex-1 relative z-10 flex flex-col items-center justify-center gap-4 pt-24"> 
            
            <div className="w-full mb-2 animate-[fadeIn_0.5s_ease-out_0.5s_forwards]">
                <DailyNewsBar onItemClick={handleNewsClick} />
            </div>
            
            {/* ... 中间的头像和切换按钮保持不变 ... */}
            <div className="absolute inset-x-4 top-[40%] ...">...</div>
            <div className="relative w-48 h-48 z-20 mb-8">...</div>
            
            {/* 🔴 修改 3 (最关键): 给 Console 的容器加 mb-24 (底部外边距)
               mb-24 = 6rem = 96px，足够躲开 Navbar 了。
               如果还不够，可以加到 mb-28 或 mb-32。
            */}
            <div className={`w-full relative z-30 px-6 pt-6 mt-auto mb-28 transition-opacity duration-200 ${isSwitching ? 'opacity-0' : 'opacity-100'}`}>
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