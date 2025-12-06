'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useChat } from 'ai/react';
import { Message } from 'ai';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';

// 🔥 引入组件
import Console from '@/components/Console';
import { DailyNewsBar } from '@/components/DailyNewsBar'; // 🔥 新增：每日小报组件

// 图标库
import { 
  Send, ChevronLeft, MoreVertical, 
  Package, Check, X as XIcon, User, ChevronDown, 
  ChevronRight, ShoppingBag, Globe, Download, 
  Coffee, Bug, RotateCcw, UserPen, Mic
} from 'lucide-react';

// 🔥 核心数据
import { 
  PERSONAS, PersonaType, UI_TEXT, LangType, 
  LOOT_TABLE, MoodType 
} from '@/lib/constants';
import { DailyStatus } from '@/lib/dailyGenerator'; // 🔥 新增：类型定义

import { getDeviceId } from '@/lib/utils';
import { getMemory, saveMemory } from '@/lib/storage';

// UI 组件
import { BootScreen } from '@/components/ui/BootScreen';

// Modals
import { DonateModal, NameModal, FeedbackModal, InstallModal } from '@/components/modals/SystemModals';
import { ProfileModal } from '@/components/modals/ProfileModal'; 
import { ShopModal } from '@/components/modals/ShopModal';
import { InventoryModal } from '@/components/modals/InventoryModal';

// ==========================================
// 0. Configuration & Constants
// ==========================================

const WALLPAPER_MAP: Record<PersonaType, string> = {
  Ash: '/wallpapers/ash_clinic.jpg',
  Rin: '/wallpapers/rin_room.jpg',
  Sol: '/wallpapers/sol_room.jpg',
  Vee: '/wallpapers/vee_room.jpg',
  Echo: '/wallpapers/echo_room.jpg',
};

const MOOD_OPTIONS: { id: MoodType, label: { zh: string, en: string }, color: string, dotColor: string }[] = [
  { id: 'low', label: { zh: '低落', en: 'Low' }, color: 'text-gray-300 border-gray-500/50 shadow-[0_0_10px_rgba(107,114,128,0.3)]', dotColor: 'bg-gray-400 shadow-[0_0_8px_gray]' },
  { id: 'anxious', label: { zh: '焦虑', en: 'Anx' }, color: 'text-blue-300 border-blue-500/50 shadow-[0_0_10px_rgba(59,130,246,0.3)]', dotColor: 'bg-blue-400 shadow-[0_0_8px_#3b82f6]' },
  { id: 'neutral', label: { zh: '平稳', en: 'Norm' }, color: 'text-emerald-300 border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.3)]', dotColor: 'bg-emerald-400 shadow-[0_0_8px_#10b981]' },
  { id: 'angry', label: { zh: '暴躁', en: 'Rage' }, color: 'text-red-300 border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.3)]', dotColor: 'bg-red-500 shadow-[0_0_8px_#ef4444]' },
  { id: 'high', label: { zh: '开心', en: 'High' }, color: 'text-yellow-300 border-yellow-500/50 shadow-[0_0_10px_rgba(234,179,8,0.3)]', dotColor: 'bg-yellow-400 shadow-[0_0_8px_#eab308]' },
];

const USER_INVENTORY_KEY = 'toughlove_inventory';
const LANG_PREF_KEY = 'toughlove_lang_preference';

type ViewState = 'lobby' | 'chat'; 

// ==========================================
// 1. Sub-Components
// ==========================================

const LootMessageCard = ({ itemId, onAccept, lang }: { itemId: string, onAccept: () => void, lang: LangType }) => {
  const item = LOOT_TABLE[itemId];
  const [accepted, setAccepted] = useState(false);
  if (!item) return null;
  const handleClick = () => { setAccepted(true); onAccept(); };
  return (
    <div className="my-2 w-full max-w-[260px]">
      <div className={`relative overflow-hidden rounded-xl border ${accepted ? 'border-green-500/30 bg-green-500/5' : 'border-[#7F5CFF]/30 bg-[#7F5CFF]/5'} backdrop-blur-md transition-all duration-500`}>
        <div className={`absolute -top-10 -right-10 w-24 h-24 ${accepted ? 'bg-green-500' : 'bg-[#7F5CFF]'} blur-[50px] opacity-20`} />
        <div className="p-4 flex flex-col items-center gap-3">
          <div className="text-[10px] uppercase tracking-widest opacity-60 font-bold">{lang === 'zh' ? '获得物品' : 'INCOMING ITEM'}</div>
          <div className={`w-16 h-16 flex items-center justify-center transition-transform duration-500 ${accepted ? 'scale-0 opacity-0' : 'scale-100'}`}>
             <img src={item.iconSvg} alt={item.name.en} className="w-full h-full drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] animate-[float_4s_ease-in-out_infinite]" />
          </div>
          <div className="text-center z-10">
            <div className="font-bold text-sm text-gray-100">{lang === 'zh' ? item.name.zh : item.name.en}</div>
            <div className="text-[10px] text-gray-400 mt-1 leading-tight">{lang === 'zh' ? item.description.zh : item.description.en}</div>
          </div>
          {!accepted ? (
            <button onClick={handleClick} className="mt-2 w-full py-2 flex items-center justify-center gap-2 text-xs font-bold bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg transition-all active:scale-95">
              <Package size={14} /> {lang === 'zh' ? '收下' : 'ACCEPT'}
            </button>
          ) : (
            <div className="mt-2 w-full py-2 flex items-center justify-center gap-2 text-xs font-bold text-green-400 bg-green-500/10 rounded-lg animate-[pulse_0.5s_ease-out]">
              <Check size={14} /> {lang === 'zh' ? '已放入背包' : 'ADDED'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const GlobalMenu = ({ onClose, onEditName, onSwitchLang, onInstall, onDonate, onFeedback, onReset, ui }: any) => (
  <div className="absolute top-16 right-6 w-48 bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl z-[100] flex flex-col p-1 animate-[fadeIn_0.1s_ease-out] pointer-events-auto">
      <div className="flex justify-between items-center px-4 py-2 border-b border-white/5">
          <span className="text-xs font-bold text-gray-500">MENU</span>
          <button onClick={onClose}><XIcon size={14} className="text-gray-500 hover:text-white" /></button>
      </div>
      <button onClick={onEditName} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-white/5 rounded-xl transition-colors text-left">
        <UserPen size={16} /> {ui.editName}
      </button>
      <button onClick={onSwitchLang} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-white/5 rounded-xl transition-colors text-left">
        <Globe size={16} /> {ui.language}
      </button>
      <button onClick={onInstall} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-white/5 rounded-xl transition-colors text-left">
        <Download size={16} /> {ui.install}
      </button>
      <button onClick={onDonate} className="flex items-center gap-3 px-4 py-3 text-sm text-yellow-500 hover:bg-white/5 rounded-xl transition-colors text-left">
        <Coffee size={16} /> {ui.buyCoffee}
      </button>
      <button onClick={onFeedback} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-white/5 rounded-xl transition-colors text-left">
        <Bug size={16} /> {ui.feedback}
      </button>
      <button onClick={onReset} className="flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 rounded-xl transition-colors text-left">
        <RotateCcw size={16} /> {ui.reset}
      </button>
  </div>
);

  // 💬 Meta Toast (UI Fixed: Aligned with Mood Selector)
const MetaToast = ({ persona, show, onClose }: { persona: PersonaType, show: boolean, onClose: () => void }) => {
    if (!show) return null;
    return (
      // 修改点 1: top-24 -> top-20 (拉近垂直距离)
      // 修改点 2: right-4 -> right-16 (向左平移，对齐情绪胶囊)
      <div className="absolute top-20 right-16 z-50 animate-[bounce_2s_infinite] cursor-pointer max-w-[200px]" onClick={onClose}>
          
          {/* Triangle Tail */}
          {/* 修改点 3: right-12 -> right-6 (微调小箭头的位置，让它指得更准) */}
          <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[8px] border-b-[#1a1a1a] absolute -top-2 right-6"></div>
          
          <div className="flex items-center gap-2 bg-[#1a1a1a] border border-[#7F5CFF]/30 px-3 py-2 rounded-xl shadow-[0_4px_15px_rgba(0,0,0,0.5)]">
              <div className="w-5 h-5 rounded-full border border-white/20 overflow-hidden flex-shrink-0">
                  <img src={PERSONAS[persona].avatar} className="w-full h-full object-cover" />
              </div>
              <span className="text-[10px] text-gray-200 font-bold leading-tight">来选个心情...</span>
              <div className="p-1 hover:bg-white/10 rounded-full transition-colors flex-shrink-0">
                  <XIcon size={10} className="text-gray-500" />
              </div>
          </div>
      </div>
    )
  }

// 🔥 Resonance Lobby (Integrated Daily News)
interface ResonanceLobbyProps {
  activePersona: PersonaType;
  setActivePersona: (p: PersonaType) => void;
  onConsoleAction: (actionId: string, label: string, contextText: string) => void;
  onContinueChat: () => void;
  // 🔥 新增：小报点击回调
  onNewsClick: (status: DailyStatus) => void;
  lastMessage: string | null;
  lang: LangType;
  onMenu: () => void;
  onOpenInventory: () => void;
  onOpenProfile: () => void;
  onOpenShop: () => void;
  hasNewItem: boolean;
}

const ResonanceLobby = ({ 
    activePersona, setActivePersona, onConsoleAction, onContinueChat, onNewsClick, lastMessage,
    lang, onMenu, onOpenInventory, onOpenProfile, onOpenShop, hasNewItem
}: ResonanceLobbyProps) => {
    
    const [currentMood, setCurrentMood] = useState<MoodType>('neutral');
    const [isMoodOpen, setIsMoodOpen] = useState(false);
    const [showToast, setShowToast] = useState(true); 
    
    const [ignoreHistory, setIgnoreHistory] = useState(false);
    const [isSwitching, setIsSwitching] = useState(false);
    
    const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);
    const touchStart = useRef<number | null>(null);

    useEffect(() => {
        setCurrentMood('neutral'); 
        const timer = setTimeout(() => setIsSwitching(false), 100);
        return () => clearTimeout(timer);
    }, [activePersona]);

    const cyclePersona = (direction: 'next' | 'prev') => {
        setIsSwitching(true);
        setSlideDirection(direction === 'next' ? 'right' : 'left');
        
        const keys = Object.keys(PERSONAS) as PersonaType[];
        const idx = keys.indexOf(activePersona);
        if (direction === 'next') {
            const nextIdx = (idx + 1) % keys.length;
            setActivePersona(keys[nextIdx]);
        } else {
            const prevIdx = (idx - 1 + keys.length) % keys.length;
            setActivePersona(keys[prevIdx]);
        }

        setTimeout(() => {
            setSlideDirection(null);
            setIsSwitching(false); 
        }, 300);
    };

    const onTouchStart = (e: React.TouchEvent) => { touchStart.current = e.targetTouches[0].clientX; };
    const onTouchEnd = (e: React.TouchEvent) => {
        if (!touchStart.current) return;
        const touchEnd = e.changedTouches[0].clientX;
        const distance = touchStart.current - touchEnd;
        if (Math.abs(distance) < 30) return;
        cyclePersona(distance > 0 ? 'next' : 'prev');
        touchStart.current = null;
    };

    const currentMoodObj = MOOD_OPTIONS.find(m => m.id === currentMood);
    const consoleCustomText = (!isSwitching && !ignoreHistory && lastMessage) ? lastMessage : null;

    return (
        <div 
            className="relative flex flex-col h-full w-full max-w-md mx-auto overflow-hidden bg-black text-white"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
        >
            {/* 1. Background */}
            <div className="absolute inset-0 z-0 bg-black">
                {Object.keys(WALLPAPER_MAP).map((pKey) => (
                    <div 
                        key={pKey}
                        className={`absolute inset-0 bg-cover bg-center transition-opacity duration-700 ease-in-out ${activePersona === pKey ? 'opacity-50' : 'opacity-0'} scale-105`} 
                        style={{ backgroundImage: `url(${WALLPAPER_MAP[pKey as PersonaType]})` }} 
                    />
                ))}
                <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black/95"></div>
                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-15 mix-blend-overlay pointer-events-none"></div>
            </div>

            {/* 2. Top HUD */}
            <div className="absolute top-0 left-0 right-0 z-50 flex flex-col pointer-events-none">
                <div className="flex justify-between items-center px-6 py-6 pointer-events-auto bg-gradient-to-b from-black/90 to-transparent">
                    <div className="flex flex-col gap-0.5 justify-center h-9">
                        <h1 className="text-xl font-black italic tracking-tighter text-white drop-shadow-md">TOUGH.</h1>
                        <span className="text-[8px] tracking-[0.3em] text-gray-400 uppercase opacity-70">RESONANCE V2.8.2</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={() => { setIsMoodOpen(!isMoodOpen); setShowToast(false); }} className="flex items-center gap-2 pl-3 pr-2 h-9 bg-white/5 border border-white/10 backdrop-blur-md rounded-full hover:bg-white/10 transition-all shadow-lg active:scale-95">
                            <div className={`w-2 h-2 rounded-full ${currentMoodObj?.dotColor || 'bg-white'}`}></div>
                            <span className="text-[10px] font-bold uppercase text-gray-200 tracking-wider">{currentMoodObj?.label[lang]}</span>
                            <ChevronDown size={14} className={`text-gray-400 transition-transform duration-300 ${isMoodOpen ? 'rotate-180' : ''}`} />
                        </button>
                        <button onClick={onMenu} className="w-9 h-9 flex items-center justify-center bg-white/5 rounded-full hover:bg-white/10 backdrop-blur-md border border-white/5 shadow-lg active:scale-95 transition-all">
                            <MoreVertical size={18} className="text-gray-200"/>
                        </button>
                    </div>
                </div>
                
            
                <div className="pointer-events-auto transition-opacity duration-300 mt-2">
                    <MetaToast persona={activePersona} show={showToast && !isMoodOpen} onClose={() => setShowToast(false)} />
                </div>
                <div className={`pointer-events-auto mx-4 overflow-hidden transition-all duration-300 ease-out ${isMoodOpen ? 'max-h-24 opacity-100 translate-y-0' : 'max-h-0 opacity-0 -translate-y-2'} -mt-4`}>
                    <div className="flex bg-black/80 backdrop-blur-xl border border-white/10 rounded-full p-1.5 shadow-2xl gap-2 ring-1 ring-white/5">
                        {MOOD_OPTIONS.map((mood) => {
                            const isActive = currentMood === mood.id;
                            return (
                                <button 
                                    key={mood.id}
                                    onClick={() => { 
                                        setCurrentMood(mood.id); 
                                        setIgnoreHistory(true); 
                                        setShowToast(false); 
                                        setTimeout(() => setIsMoodOpen(false), 300); 
                                    }} 
                                    className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-full transition-all duration-300 border
                                        ${isActive ? `${mood.color} scale-105 z-10` : 'bg-transparent border-transparent text-gray-500 hover:bg-white/5 hover:text-gray-300'}
                                    `}
                                >
                                    {lang === 'zh' ? mood.label.zh : mood.label.en}
                                </button>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* 3. Middle Section */}
            <div className="flex-1 relative z-10 flex flex-col items-center justify-center pointer-events-none gap-4 pt-12">
                {/* 🔥🔥🔥 新位置：每日小报 (垂直滚动版) */}
                {/* 放在这里，就在 Avatar 的正上方 */}
                <div className="pointer-events-auto z-40 w-full mb-2 animate-[fadeIn_0.5s_ease-out_0.5s_forwards] opacity-0">
                    <DailyNewsBar onItemClick={onNewsClick} />
                </div>
                <div className="absolute inset-x-4 top-[40%] -translate-y-1/2 flex justify-between items-center pointer-events-auto">
                    <button onClick={() => cyclePersona('prev')} className="p-2 hover:bg-white/5 rounded-full transition-colors active:scale-95"><ChevronLeft size={32} className="text-white/40 hover:text-white/80" /></button>
                    <button onClick={() => cyclePersona('next')} className="p-2 hover:bg-white/5 rounded-full transition-colors active:scale-95"><ChevronRight size={32} className="text-white/40 hover:text-white/80" /></button>
                </div>
                
                <div className="relative w-48 h-48 z-20 pointer-events-auto mb-8">
                    <div className="absolute -inset-4 rounded-full border border-white/5 bg-gradient-to-b from-white/5 to-transparent animate-[spin_10s_linear_infinite] opacity-50"></div>
                    <div className="w-full h-full rounded-full overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.6)] border-[1px] border-white/20 bg-black relative z-10 ring-1 ring-white/10">
                         <div key={activePersona} className={`w-full h-full ${slideDirection ? (slideDirection === 'right' ? 'animate-[slideInRight_0.3s]' : 'animate-[slideInLeft_0.3s]') : ''}`}>
                             <img src={PERSONAS[activePersona].avatar} className="w-full h-full object-cover scale-110" />
                         </div>
                         <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent mix-blend-overlay"></div>
                    </div>
                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center z-30 w-max">
                         <div className="px-3 py-0.5 bg-black/80 backdrop-blur-md border border-white/10 rounded-full shadow-lg mb-1">
                             <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${PERSONAS[activePersona].color}`}>
                                 {PERSONAS[activePersona].name}
                             </span>
                         </div>
                    </div>
                </div>
                
                <div className={`pointer-events-auto w-full relative z-30 transition-opacity duration-200 ${isSwitching ? 'opacity-0' : 'opacity-100'}`}>
                    <Console 
                        key={activePersona} 
                        currentRole={activePersona}
                        currentMood={currentMood}
                        onAction={onConsoleAction}
                        customText={consoleCustomText}
                        onContinue={onContinueChat}
                    />
                </div>
            </div>

            {/* Bottom Dock */}
            <div className="relative z-20 flex justify-between items-center px-10 pb-8 w-full max-w-md mx-auto pointer-events-auto">
                    <button onClick={onOpenInventory} className="flex flex-col items-center gap-1 text-gray-500 hover:text-white transition-colors group p-2 relative">
                        <Package size={22} className={hasNewItem ? "text-[#7F5CFF]" : "opacity-60"} />
                        {hasNewItem && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-ping" />}
                    </button>
                    <button onClick={onOpenShop} className="flex flex-col items-center gap-1 text-gray-500 hover:text-white transition-colors group p-2">
                        <ShoppingBag size={22} className="opacity-60" />
                    </button>
                    <button onClick={onOpenProfile} className="flex flex-col items-center gap-1 text-gray-500 hover:text-white transition-colors group p-2">
                        <User size={22} className="opacity-60" />
                    </button>
            </div>
        </div>
    );
};

// ==========================================
// 2. MAIN PAGE COMPONENT
// ==========================================

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [view, setView] = useState<ViewState>('lobby'); 
  const [activePersona, setActivePersona] = useState<PersonaType>('Ash');
  const [lang, setLang] = useState<LangType>('zh');
  
  const [isSwitchingPersona, setIsSwitchingPersona] = useState(false);
  
  // 用于暂存用户 Console 的选择
  const [initAction, setInitAction] = useState<{ id: string; label: string } | null>(null);
  // 🔥 新增：用于暂存小报点击的上下文
  const [pendingNews, setPendingNews] = useState<DailyStatus | null>(null);

  const [showMenu, setShowMenu] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [showInventory, setShowInventory] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  
  const [inventory, setInventory] = useState<string[]>([]); 
  const [hasNewItem, setHasNewItem] = useState(false); 
  
  const [userName, setUserName] = useState("Traveler");
  const [tempName, setTempName] = useState("");
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const ui = UI_TEXT[lang];
  const currentP = PERSONAS[activePersona];

  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages, setInput, append } = useChat({
    api: '/api/chat',
    onFinish: (message) => {
      // Chat complete logic
    }
  });

  const handleSwitchPersona = (p: PersonaType) => {
      setIsSwitchingPersona(true); 
      setMessages([]); 
      setActivePersona(p); 
  };

  // 自动保存记忆 (仅在非切换状态下)
  useEffect(() => {
    if (!isSwitchingPersona && messages.length > 0) {
       saveMemory(activePersona, messages);
       
       const lastMsg = messages[messages.length - 1];
       if (lastMsg.role === 'assistant') {
         const iconRegex = /{{icon:([a-zA-Z0-9_]+)}}/g;
         let match;
         while ((match = iconRegex.exec(lastMsg.content)) !== null) {
           handleUnlockItem(match[1]);
         }
       }
    }
  }, [messages, activePersona, isSwitchingPersona]); 

  // 加载记忆
  useEffect(() => {
    const history = getMemory(activePersona);
    if (history && history.length > 0) {
        setMessages(history);
    } else {
        setMessages([]); 
    }
    setIsSwitchingPersona(false);
  }, [activePersona, setMessages]);


  const handleUnlockItem = (itemId: string) => {
    if (inventory.includes(itemId)) return;
    const newInventory = [...inventory, itemId];
    setInventory(newInventory);
    setHasNewItem(true);
    localStorage.setItem(USER_INVENTORY_KEY, JSON.stringify(newInventory));
  };

  const router = useRouter(); 

  const lastAIMessageRaw = useMemo(() => {
    if (isSwitchingPersona) return null;
    const lastMsg = messages[messages.length - 1];
    return (lastMsg?.role === 'assistant') ? lastMsg.content : null;
  }, [messages, isSwitchingPersona]);

  const handleConsoleAction = (actionId: string, label: string, contextText: string) => {
    const hookMsg: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: contextText,
    };
    
    setMessages(prev => [...prev, hookMsg]);
    setInitAction({ id: actionId, label });
    setView('chat');
  };

  const handleContinueChat = () => {
      setView('chat');
  };

  // 🔥 核心交互 3：点击每日小报
  const handleDailyNewsClick = (status: DailyStatus) => {
    // 1. 如果点击的不是当前人格，先切换 (这会触发 useEffect 加载历史)
    if (activePersona !== status.persona) {
        handleSwitchPersona(status.persona);
    }
    // 2. 将新闻内容暂存，等待 useEffect 注入
    setPendingNews(status);
    // 3. 跳转
    setView('chat');
  };

  // 生成符合人设的“小报回复”
const getNewsReaction = (persona: PersonaType, content: string) => {
    // 去掉 [情绪] 标签，只保留正文
    const cleanContent = content.replace(/\[.*?\]/, '').trim();
    
    switch (persona) {
        case 'Ash':
            return `“${cleanContent}”\n\n看到了？这就是我今天的遭遇。如果你是来嘲笑我的，出门左转；如果是来提供解决方案的，说吧。`;
        case 'Rin':
            return `“${cleanContent}”\n\n感觉到了吗？这个频率... 我刚把这条信号发出去，你就来了。是巧合吗？`;
        case 'Sol':
            return `“${cleanContent}”\n\n嘿！你看到我的状态啦！是不是很那个！快告诉我，你今天过得怎么样？`;
        case 'Vee':
            return `“${cleanContent}”\n\n被你发现了。这服务器的随机事件算法绝对有 Bug。你也遇到这种破事了吗？`;
        case 'Echo':
            return `“${cleanContent}”\n\n你看见了那个瞬间... 每一个瞬间都是未来的倒影。你从中读出了什么？`;
        default:
            return `“${cleanContent}”\n\n你看到了这个？说说你的想法。`;
    }
};

  // 🔥 队列处理：自动发送 (Console & DailyNews)
  useEffect(() => {
    if (view === 'chat') {
        // A. 处理 Console 选项
        if (initAction) {
            append({
                role: 'user',
                content: initAction.label, 
            }, {
                body: { persona: activePersona, language: lang, actionId: initAction.id }
            });
            setInitAction(null);
        }
        
        // B. 处理 Daily News 注入
        // 确保人格已经切换到位 (activePersona === pendingNews.persona)
        if (pendingNews && activePersona === pendingNews.persona && !isSwitchingPersona) {
            const newsMsg: Message = {
                id: Date.now().toString(),
                role: 'assistant',
                // AI 主动发起话题 
                content: getNewsReaction(activePersona, pendingNews.content), 
                createdAt: new Date(),
            };
            
            // 追加到历史记录末尾 (保留之前的记忆)
            setMessages(prev => [...prev, newsMsg]);
            setPendingNews(null); // 清除队列
        }
    }
  }, [view, initAction, pendingNews, activePersona, isSwitchingPersona, append, lang, setMessages]);


  const onFormSubmit = (e: React.FormEvent) => { 
      e.preventDefault(); 
      if (!input.trim()) return;
      handleSubmit(e, { options: { body: { persona: activePersona, language: lang } } }); 
  };

  useEffect(() => {
    if (view === 'chat') {
        setTimeout(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, 100);
    }
  }, [messages, view]);

  useEffect(() => { 
    setMounted(true);
    const savedInv = localStorage.getItem(USER_INVENTORY_KEY);
    if (savedInv) setInventory(JSON.parse(savedInv));
    const savedLang = localStorage.getItem(LANG_PREF_KEY);
    if (savedLang) setLang(savedLang as LangType);
  }, []);

  if (!mounted) return <BootScreen />;

  return (
    <div className="relative flex flex-col h-screen supports-[height:100dvh]:h-[100dvh] bg-[#050505] text-gray-100 font-sans overflow-hidden">
      
      {showMenu && (
        <div className="absolute inset-0 z-[100] pointer-events-none flex justify-center">
            <div className="w-full max-w-md relative h-full">
                <GlobalMenu 
                    onClose={() => setShowMenu(false)}
                    onEditName={() => { setShowMenu(false); setShowNameModal(true); setTempName(userName); }}
                    onSwitchLang={() => { const next = lang === 'zh' ? 'en' : 'zh'; setLang(next); localStorage.setItem(LANG_PREF_KEY, next); }}
                    onInstall={() => { setShowMenu(false); setShowInstallModal(true); }}
                    onDonate={() => { setShowMenu(false); setShowDonateModal(true); }}
                    onFeedback={() => { setShowMenu(false); setShowFeedbackModal(true); }}
                    onReset={() => { if(confirm('Reset?')) { localStorage.clear(); window.location.reload(); } }}
                    ui={ui}
                />
            </div>
        </div>
      )}

      <InventoryModal show={showInventory} onClose={() => {setShowInventory(false); setHasNewItem(false);}} inventoryItems={inventory} lang={lang} />
      <ShopModal show={showShop} onClose={() => setShowShop(false)} userRin={0} onBuy={()=>{}} lang={lang} isBuying={false} />
      <ProfileModal show={showProfile} onClose={() => setShowProfile(false)} data={null} isLoading={false} onDownload={()=>{}} ui={ui} deviceId={getDeviceId()} userName="" />
      
      <NameModal show={showNameModal} onClose={() => setShowNameModal(false)} tempName={tempName} setTempName={setTempName} onSave={() => { setUserName(tempName); localStorage.setItem('toughlove_user_name', tempName); setShowNameModal(false); }} ui={ui} />
      <FeedbackModal show={showFeedbackModal} onClose={() => setShowFeedbackModal(false)} text="" setText={()=>{}} onSubmit={()=>{ setShowFeedbackModal(false); alert('Thanks!'); }} lang={lang} />
      <DonateModal show={showDonateModal} onClose={() => setShowDonateModal(false)} lang={lang} currentP={currentP} onBribe={()=>{}} onExternal={()=>{}} />
      <InstallModal show={showInstallModal} onClose={() => setShowInstallModal(false)} lang={lang} />

      {view === 'lobby' ? (
        <ResonanceLobby 
            activePersona={activePersona} 
            setActivePersona={handleSwitchPersona} 
            onConsoleAction={handleConsoleAction}
            onContinueChat={handleContinueChat}
            onNewsClick={handleDailyNewsClick} // 🔥 传递小报回调
            lastMessage={lastAIMessageRaw} 
            lang={lang}
            onMenu={() => setShowMenu(true)}
            onOpenInventory={() => setShowInventory(true)}
            onOpenProfile={() => setShowProfile(true)}
            onOpenShop={() => setShowShop(true)}
            hasNewItem={hasNewItem}
        />
      ) : (
        <div className="flex flex-col h-full relative animate-[zoomIn_0.3s_ease-out] w-full max-w-md mx-auto overflow-hidden">
            <div className="absolute inset-0 z-0 bg-black">
                 <div className="absolute inset-0 bg-cover bg-center transition-opacity opacity-100" 
                      style={{ backgroundImage: `url(${WALLPAPER_MAP[activePersona]})` }} />
                 <div className="absolute inset-0 bg-black/20" />
                 <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay pointer-events-none"></div>
            </div>

            <header className="flex-none pt-12 pb-2 px-6 relative z-50 w-full bg-gradient-to-b from-black/80 to-transparent">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 pointer-events-auto">
                      <button 
                          onClick={() => setView('lobby')} 
                          className="w-10 h-10 flex items-center justify-center bg-black/30 border border-white/10 rounded-full hover:bg-black/50 backdrop-blur-md transition-all active:scale-95 group"
                      >
                          <ChevronLeft size={20} className="text-white group-hover:-translate-x-0.5 transition-transform" />
                      </button>
                      
                      <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full border border-white/20 overflow-hidden shadow-lg ring-2 ring-black/20">
                              <img src={PERSONAS[activePersona].avatar} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex flex-col">
                              <span className={`text-xs font-black uppercase tracking-widest ${PERSONAS[activePersona].color} drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]`}>
                                  {PERSONAS[activePersona].name}
                              </span>
                              <span className="text-[9px] text-gray-200 font-mono flex items-center gap-1.5 shadow-black drop-shadow-md opacity-90">
                                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_5px_#22c55e]"></span> 
                                  ONLINE
                              </span>
                          </div>
                      </div>
                  </div>

                  <div className="flex items-center gap-3 pointer-events-auto">
                      <button onClick={() => setShowInventory(true)} className="w-10 h-10 flex items-center justify-center bg-black/30 border border-white/10 rounded-full relative active:scale-95 transition-all hover:bg-black/50 backdrop-blur-md">
                          <Package size={18} className={hasNewItem ? "text-[#7F5CFF]" : "text-white"} />
                          {hasNewItem && <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full animate-ping" />}
                      </button>
                      <button onClick={() => setShowShop(true)} className="w-10 h-10 flex items-center justify-center bg-black/30 border border-white/10 rounded-full active:scale-95 transition-all hover:bg-black/50 backdrop-blur-md">
                          <ShoppingBag size={18} className="text-white" />
                      </button>
                      <button onClick={() => setShowMenu(true)} className="w-10 h-10 flex items-center justify-center bg-black/30 border border-white/10 rounded-full active:scale-95 transition-all hover:bg-black/50 backdrop-blur-md">
                          <MoreVertical size={18} className="text-white" />
                      </button>
                  </div>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto px-4 py-4 pb-24 space-y-6 scroll-smooth no-scrollbar relative z-10">
                {messages.map((msg, idx) => {
                    const isAI = msg.role !== 'user';
                    const parts = msg.content.split(/({{icon:[^}]+}})/g);
                    
                    return (
                        <div key={msg.id} className={`flex w-full ${!isAI ? 'justify-end' : 'justify-start'} animate-[slideUp_0.2s_ease-out]`}>
                            <div className={`flex flex-col gap-1 max-w-[85%] min-w-0 ${!isAI ? 'items-end' : 'items-start'}`}>
                                
                                {isAI && idx > 0 && messages[idx-1].role === 'user' && (
                                    <span className="text-[9px] text-gray-300 ml-1 mb-1 uppercase tracking-widest opacity-80 font-bold shadow-black drop-shadow-md">{PERSONAS[activePersona].name}</span>
                                )}

                                {!isAI ? (
                                    <div className="px-5 py-3 text-sm bg-gradient-to-br from-[#7F5CFF] to-[#6242db] text-white rounded-[1.2rem] rounded-tr-sm shadow-[0_4px_15px_rgba(127,92,255,0.3)] border border-white/10 break-words whitespace-pre-wrap min-w-0">
                                        {msg.content}
                                    </div>
                                ) : (
                                    <>
                                        <div className="px-6 py-4 text-sm leading-relaxed shadow-lg backdrop-blur-xl rounded-[1.2rem] rounded-tl-sm bg-[#1a1a1a]/85 border border-white/10 text-gray-100 relative overflow-hidden group break-words whitespace-pre-wrap min-w-0">
                                            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                                            {parts.map((part, pIdx) => {
                                                if (part.startsWith('{{icon:') && part.endsWith('}}')) return null; 
                                                return <ReactMarkdown key={pIdx}>{part}</ReactMarkdown>;
                                            })}
                                        </div>
                                        {parts.map((part, pIdx) => {
                                            if (part.startsWith('{{icon:') && part.endsWith('}}')) {
                                                const itemId = part.slice(7, -2);
                                                return <div key={`loot-${pIdx}`} className="mt-2 ml-1"><LootMessageCard itemId={itemId} lang={lang} onAccept={() => handleUnlockItem(itemId)} /></div>;
                                            }
                                            return null;
                                        })}
                                    </>
                                )}
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} className="h-4" />
            </main>

            <footer className="flex-none px-6 pb-8 pt-4 z-50 absolute bottom-0 left-0 right-0 pointer-events-none">
                <div className="pointer-events-auto relative flex items-center gap-2 bg-[#1a1a1a]/90 backdrop-blur-xl p-2 rounded-full border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.6)] ring-1 ring-white/5">
                     <button type="button" onClick={() => {}} className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-white transition-colors bg-white/5 rounded-full"><Mic size={20} /></button>
                     <form onSubmit={onFormSubmit} className="flex-1 flex items-center gap-2 pr-1 min-w-0">
                        <input type="text" value={input} onChange={handleInputChange} placeholder={ui.placeholder} className="flex-1 bg-transparent text-white text-sm px-2 focus:outline-none placeholder-gray-500 h-full min-w-0" />
                        <button type="submit" disabled={!input.trim() || isLoading} className="w-10 h-10 flex items-center justify-center bg-[#7F5CFF] text-white rounded-full hover:bg-[#6b4bd6] disabled:opacity-30 disabled:hover:bg-[#7F5CFF] transition-all shadow-[0_0_15px_rgba(127,92,255,0.4)] flex-shrink-0"><Send size={18} fill="white" className="-ml-0.5" /></button>
                     </form>
                </div>
            </footer>
        </div>
      )}
    </div>
  );
}