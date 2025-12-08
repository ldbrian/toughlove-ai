'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import { 
  ArrowLeft, Send, Sparkles, MoreVertical, Package, Check, Mic,
  UserPen, Globe, Download, Coffee, RotateCcw, X as XIcon, Bug,
  MessageSquarePlus, Zap, Heart, Flame, Activity
} from 'lucide-react';
import { getMemory, saveMemory } from '@/lib/storage';
import { getLocalTimeInfo, getSimpleWeather } from '@/lib/env'; 
import { LootItem } from '@/lib/constants'; 

// Modals
import { DonateModal, NameModal, FeedbackModal, InstallModal } from '@/components/modals/SystemModals';
import { DailyBriefingModal } from '@/components/modals/DailyBriefingModal'; 
import { InventoryModal } from '@/components/modals/InventoryModal'; 
import { FocusModal } from '@/components/modals/FocusModal';
import { MemoModal } from '@/components/modals/MemoModal';



// 常量
const PERSONAS: Record<string, any> = {
  ash: { name: 'Ash', avatar: '/avatars/ash_hero.jpg', color: 'text-cyan-400' },
  rin: { name: 'Rin', avatar: '/avatars/rin_hero.jpg', color: 'text-purple-400' },
  sol: { name: 'Sol', avatar: '/avatars/sol_hero.jpg', color: 'text-orange-400' },
  vee: { name: 'Vee', avatar: '/avatars/vee_hero.jpg', color: 'text-pink-400' },
  echo: { name: 'Echo', avatar: '/avatars/echo_hero.jpg', color: 'text-slate-400' },
};

const WALLPAPER_MAP: Record<string, string> = {
  ash: '/wallpapers/ash_clinic.jpg',
  rin: '/wallpapers/rin_room.jpg',
  sol: '/wallpapers/sol_room.jpg',
  vee: '/wallpapers/vee_room.jpg',
  echo: '/wallpapers/echo_room.jpg',
};

type LangType = 'zh' | 'en';

// 负面词库
const TOXIC_KEYWORDS = ['滚', '傻', '闭嘴', '废物', '讨厌', '去死', 'fuck', 'stupid', 'shut up', 'hate'];

const UI_TEXT: Record<LangType, any> = {
  zh: { 
    menu: '菜单', editName: '修改昵称', lang: '切换语言 (EN)', install: '安装应用', donate: '请喝咖啡', feedback: '反馈 Bug', reset: '重置数据', 
    resetConfirm: '⚠️ 警告：确认重置记忆？这将清除聊天记录、背包和塔罗牌，系统将重启并重新进行心理测试。',
    modalTitle: '修改昵称', placeholderName: '请输入昵称', cancel: '取消', save: '保存', feedbackSent: '已收到反馈',
    online: '在线', typing: '对方正在输入...', placeholder: '输入信号...', error: '信号中断', systemInit: '神经连接已建立。',
    lootTitle: '获得物品', lootAccept: '收下', lootAdded: '已放入背包',
    quickReply1: '继续', quickReply2: '展开说说',
    actionRin: '能量补给', actionSol: '绝对专注' 
  },
  en: { 
    menu: 'MENU', editName: 'Edit Name', lang: 'Language (中)', install: 'Install App', donate: 'Buy Coffee', feedback: 'Feedback', reset: 'Reset Data', 
    resetConfirm: '⚠️ WARNING: Reset memory? This will wipe chat history, inventory and tarot cards. System will reboot to psychological test.',
    modalTitle: 'Edit Name', placeholderName: 'Enter Name', cancel: 'Cancel', save: 'Save', feedbackSent: 'Feedback sent',
    online: 'ONLINE', typing: 'Typing...', placeholder: 'Enter signal...', error: 'Signal Lost', systemInit: 'Neural link established.',
    lootTitle: 'INCOMING ITEM', lootAccept: 'ACCEPT', lootAdded: 'ADDED',
    quickReply1: 'Continue', quickReply2: 'Tell me more',
    actionRin: 'Recharge', actionSol: 'Deep Focus'
  }
};

const getDynamicSuggestion = (lastMsg: string, lang: LangType): string => {
  if (!lastMsg) return lang === 'zh' ? '...' : '...';
  const text = lastMsg.toLowerCase();
  if (text.endsWith('?') || text.endsWith('？')) {
      const answers = lang === 'zh' ? ['不知道', '也许吧', '你猜？', '看心情'] : ['Maybe', 'I guess', 'Who knows', 'Depends'];
      return answers[Math.floor(Math.random() * answers.length)];
  }
  if (text.length < 10) return lang === 'zh' ? '这就完了？' : 'That\'s it?';
  const randoms = lang === 'zh' ? ['确实', '有道理', '我不同意', '有点意思', '然后呢'] : ['True', 'Makes sense', 'Interesting', 'Then what?'];
  return randoms[Math.floor(Math.random() * randoms.length)];
};

const LootCard = ({ itemId, lang }: { itemId: string, lang: LangType }) => {
  const [accepted, setAccepted] = useState(false);
  const t = UI_TEXT[lang];
  return (
    <div className="my-2 w-full max-w-[240px]">
      <div className={`relative overflow-hidden rounded-xl border ${accepted ? 'border-green-500/30 bg-green-500/5' : 'border-[#7F5CFF]/30 bg-[#7F5CFF]/10'} backdrop-blur-md transition-all duration-300`}>
        <div className="p-3 flex flex-col items-center gap-2">
          <div className="text-[10px] uppercase tracking-widest opacity-60 font-bold">{t.lootTitle}</div>
          <div className="font-bold text-sm text-gray-100">{itemId}</div>
          {!accepted ? (
            <button onClick={() => setAccepted(true)} className="mt-1 w-full py-1.5 flex items-center justify-center gap-2 text-xs font-bold bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg transition-all">
              <Package size={12} /> {t.lootAccept}
            </button>
          ) : (
            <div className="mt-1 w-full py-1.5 flex items-center justify-center gap-2 text-xs font-bold text-green-400 bg-green-500/10 rounded-lg">
              <Check size={12} /> {t.lootAdded}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// GlobalMenu
interface GlobalMenuProps { onClose: () => void; onEditName: () => void; onSwitchLang: () => void; onInstall: () => void; onDonate: () => void; onReset: () => void; onFeedback: () => void; lang: LangType; }
const GlobalMenu = ({ onClose, onEditName, onSwitchLang, onInstall, onDonate, onReset, onFeedback, lang }: GlobalMenuProps) => {
  const t = UI_TEXT[lang]; 
  return (
    <div className="absolute top-16 right-6 w-48 bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl z-[100] flex flex-col p-1 animate-in fade-in zoom-in-95 duration-200 pointer-events-auto">
        <div className="flex justify-between items-center px-4 py-2 border-b border-white/5">
            <span className="text-xs font-bold text-gray-500">{t.menu}</span>
            <button onClick={onClose}><XIcon size={14} className="text-gray-500 hover:text-white" /></button>
        </div>
        <button onClick={onEditName} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-white/5 rounded-xl transition-colors text-left"><UserPen size={16} /> {t.editName}</button>
        <button onClick={onSwitchLang} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-white/5 rounded-xl transition-colors text-left"><Globe size={16} /> {t.lang}</button>
        <button onClick={onInstall} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-white/5 rounded-xl transition-colors text-left"><Download size={16} /> {t.install}</button>
        <button onClick={onDonate} className="flex items-center gap-3 px-4 py-3 text-sm text-yellow-500 hover:bg-white/5 rounded-xl transition-colors text-left"><Coffee size={16} /> {t.donate}</button>
        <button onClick={onFeedback} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-white/5 rounded-xl transition-colors text-left"><Bug size={16} /> {t.feedback}</button>
        <button onClick={onReset} className="flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 rounded-xl transition-colors text-left"><RotateCcw size={16} /> {t.reset}</button>
    </div>
  );
};

export default function ChatRoomPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const rawId = params.id as string;
  const partnerId = rawId ? rawId.toLowerCase() : 'ash'; 
  const displayKey = Object.keys(PERSONAS).find(k => k.toLowerCase() === partnerId) || 'Ash'; 
  const config = PERSONAS[displayKey];
  const wallpaper = WALLPAPER_MAP[displayKey] || WALLPAPER_MAP['Ash'];

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{role: string, content: string}[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  
  const [showMenu, setShowMenu] = useState(false);
  const [showTarot, setShowTarot] = useState(false); 
  const [showInventory, setShowInventory] = useState(false); 
  const [showFocus, setShowFocus] = useState(false);
  const [showMemo, setShowMemo] = useState(false);

  const [lang, setLang] = useState<LangType>('zh'); 
  const t = UI_TEXT[lang]; 

  const [showNameModal, setShowNameModal] = useState(false);
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [tempName, setTempName] = useState('');
  const [userName, setUserName] = useState('Traveler');
  const [userBalance, setUserBalance] = useState(100);

  const [inventoryItems, setInventoryItems] = useState<string[]>([]);
  const [dynamicReply, setDynamicReply] = useState('');

  const [stats, setStats] = useState({ favorability: 0, moodValue: 50 });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initRef = useRef(false);

  // ✨ 新增：用于标记是否完成了首次滚动
  const isInitialScrollDone = useRef(false);

  const loadInventory = () => {
      const savedInv = localStorage.getItem('toughlove_inventory');
      if (savedInv) {
          setInventoryItems(JSON.parse(savedInv));
      }
  };

  const handleReset = () => {
    if (confirm(t.resetConfirm)) {
      localStorage.removeItem('toughlove_user_profile');
      localStorage.removeItem('toughlove_inventory');
      localStorage.removeItem('toughlove_daily_tarot_log');
      localStorage.removeItem('toughlove_user_name');
      localStorage.removeItem(`toughlove_chat_${partnerId}`);
      localStorage.removeItem(`toughlove_stats_${partnerId}`);
      window.location.href = '/resonance';
    }
  };

  const updateStats = (type: 'chat' | 'gift' | 'event' | 'toxic', value?: number) => {
      setStats(prev => {
          let newFav = prev.favorability;
          let newMood = prev.moodValue;

          if (type === 'chat') newFav += 0.5;
          else if (type === 'gift') newFav += (value || 10);
          else if (type === 'toxic') newFav -= 5;

          let fluctuation = (Math.random() * 4) - 2; 
          
          if (type === 'gift') newMood += 15;
          else if (type === 'event') {
              const impact = value || (Math.random() * 30 - 15);
              newMood += impact;
          } else if (type === 'toxic') newMood -= 20; 
          else newMood += fluctuation;

          newMood = Math.max(0, Math.min(100, newMood));
          newFav = Math.max(0, Math.min(100, newFav));
          newFav = Math.floor(newFav * 10) / 10;
          newMood = Math.floor(newMood);

          const newStats = { favorability: newFav, moodValue: newMood };
          localStorage.setItem(`toughlove_stats_${partnerId}`, JSON.stringify(newStats));
          return newStats;
      });
  };

  const handleReward = (amount: number) => {
    const newBalance = userBalance + amount;
    setUserBalance(newBalance);
    localStorage.setItem('toughlove_user_rin', newBalance.toString());
  };

  const getMoodLabel = (val: number) => {
      if (val >= 80) return lang === 'zh' ? '狂喜' : 'EUPHORIC';
      if (val >= 60) return lang === 'zh' ? '开心' : 'HAPPY';
      if (val >= 40) return lang === 'zh' ? '平静' : 'CALM';
      if (val >= 20) return lang === 'zh' ? '焦虑' : 'ANXIOUS';
      return lang === 'zh' ? '崩溃' : 'BROKEN';
  };

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const savedName = localStorage.getItem('toughlove_user_name');
    if (savedName) setUserName(savedName);
    const savedLang = localStorage.getItem('toughlove_lang_preference');
    if (savedLang === 'zh' || savedLang === 'en') setLang(savedLang as LangType);
    const savedBalance = localStorage.getItem('toughlove_user_rin');
    if (savedBalance) setUserBalance(parseInt(savedBalance));
    loadInventory();

    const savedStats = localStorage.getItem(`toughlove_stats_${partnerId}`);
    if (savedStats) {
        setStats(JSON.parse(savedStats));
    } else {
        const initialStats = { favorability: 0, moodValue: 50 + Math.floor(Math.random() * 20 - 10) };
        setStats(initialStats);
        localStorage.setItem(`toughlove_stats_${partnerId}`, JSON.stringify(initialStats));
    }

    const actionText = searchParams.get('text');     
    const contextHook = searchParams.get('context'); 
    const newsContent = searchParams.get('newsContent');
    const localHistory = getMemory(partnerId);
    let initialMsgs = localHistory || [];

    let shouldTriggerSend = false;
    let textToSend = "";

    // 🔥 核心修正：优化文案 & 强化 AI 记忆
    if (newsContent) {
        shouldTriggerSend = true;
        
        // 1. System Prompt: 强制让 AI 承认这是它的状态
        const hiddenPrompt = `[SYSTEM_CONTEXT: User is reading your own status update/diary entry: "${newsContent}". This is NOT a rumor, it is YOUR recent thought/action. React naturally.]`;
        
        // 2. User Text: 优化为“指着你的动态”，解决语病
        const userText = `(指着终端上你的每日动态) “${newsContent}” ……这是什么情况？`;
        
        textToSend = `${hiddenPrompt}${userText}`;
        
        updateStats('event'); 
    } else if (actionText) {
        if (contextHook) {
            const lastMsg = initialMsgs[initialMsgs.length - 1];
            if (!lastMsg || lastMsg.content !== contextHook) {
                initialMsgs = [...initialMsgs, { role: 'assistant', content: contextHook }];
            }
        }
        const lastUserMsg = [...initialMsgs].reverse().find(m => m.role === 'user');
        if (!lastUserMsg || lastUserMsg.content !== actionText) {
            shouldTriggerSend = true;
            textToSend = actionText;
        }
    } else if (initialMsgs.length === 0) {
        const localizedInit = savedLang === 'en' ? UI_TEXT.en.systemInit : UI_TEXT.zh.systemInit;
        initialMsgs = [{ role: 'assistant', content: `[SYSTEM] ${config.name} ${localizedInit}` }];
    }

    setMessages(initialMsgs);
    setIsReady(true);
    
    const lastAi = initialMsgs.slice().reverse().find(m => m.role !== 'user');
    setDynamicReply(getDynamicSuggestion(lastAi?.content || '', savedLang as LangType || 'zh'));

    if (shouldTriggerSend && textToSend) {
        setTimeout(() => handleSend(textToSend, false), 100);
    }
  }, []);

  useEffect(() => {
    if (isReady && messages.length > 0) saveMemory(partnerId, messages);
    const lastAi = messages.slice().reverse().find(m => m.role !== 'user');
    setDynamicReply(getDynamicSuggestion(lastAi?.content || '', lang));
  }, [messages, partnerId, isReady, lang]);

  useEffect(() => {
    // 必须确保 isReady 为 true 且 ref 存在
    if (isReady && messagesEndRef.current) {
      
      // 判断逻辑：
      // 如果还没有进行过首次滚动 (Current = false)，则瞬间跳转 (auto)
      // 否则 (Current = true)，说明是后续对话，使用平滑滚动 (smooth)
      if (!isInitialScrollDone.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
        isInitialScrollDone.current = true; // 标记已完成
      } else {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [messages, isReady]);

  const handleSwitchLang = () => {
    const newLang = lang === 'zh' ? 'en' : 'zh';
    setLang(newLang);
    localStorage.setItem('toughlove_lang_preference', newLang);
    setShowMenu(false);
    window.location.reload(); 
  };

  const handleSend = async (textOverride?: string, isHidden: boolean = false) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim() || isLoading) return;

    if (!isHidden) {
        const isToxic = TOXIC_KEYWORDS.some(k => textToSend.includes(k));
        if (isToxic) {
            updateStats('toxic');
        } else {
            updateStats('chat');
        }
    }

    let newHistory = messages;
    if (!isHidden) {
        const userMsg = { role: 'user', content: textToSend };
        setMessages(prev => { newHistory = [...prev, userMsg]; return newHistory; });
    }
    
    setInput('');
    setIsLoading(true);

    try {
      const timeInfo = getLocalTimeInfo();
      const weather = await getSimpleWeather();
      // 强化禁令
      const envInfo = { 
          ...timeInfo, 
          weather: weather || "未知",
          system_note: "Strict Rule: The setting is a generic futuristic city. NEVER use the term 'Night City' (夜之城). Use 'The City' or 'Neon City'. Treat [SYSTEM_CONTEXT] as absolute facts about yourself."
      };
      
      const dailyData = JSON.parse(localStorage.getItem('toughlove_daily_feed_v1') || '{}');
      const myDaily = dailyData.data?.find((d: any) => d.persona === config.name);

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            message: textToSend, 
            history: newHistory.slice(-12), 
            partnerId: partnerId, 
            userId: "user_01",
            inventory: inventoryItems,
            envInfo, 
            dailyEvent: myDaily 
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', content: `🔴 ${t.error}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTarotJump = (payload: any) => {
    setShowTarot(false);
    const { visibleReaction } = payload;
    handleSend(`(展示塔罗牌) ${visibleReaction}`);
  };

  const handleItemUse = async (item: LootItem) => {
    setShowInventory(false);
    fetch('/api/shop/use', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: "user_01", itemId: item.id, targetPersona: config.name })
    });

    let rarityBonus = 5;
    if (item.rarity === 'rare') rarityBonus = 10;
    if (item.rarity === 'epic') rarityBonus = 15;
    if (item.rarity === 'legendary') rarityBonus = 25;
    updateStats('gift', rarityBonus);

    let visibleText = `(递给你 ${item.name.zh})`;
    if (item.id.includes('tarot')) visibleText = `(展示了 ${item.name.zh}) 这张牌代表什么？`;
    if (item.id.includes('letter')) visibleText = `(拿出了泛黄的信笺) 你看看这个...`;
    
    handleSend(visibleText);
  };

  const handleQuickReply = (text: string) => {
      handleSend(text);
  };

  if (!isReady) return <div className="h-screen bg-black" />;

  return (
    <div className="relative flex flex-col h-screen supports-[height:100dvh]:h-[100dvh] bg-[#050505] text-gray-100 font-sans overflow-hidden">
        {/* Modals */}
        <NameModal show={showNameModal} onClose={() => setShowNameModal(false)} tempName={tempName} setTempName={setTempName} onSave={() => { setUserName(tempName); localStorage.setItem('toughlove_user_name', tempName); setShowNameModal(false); }} ui={{ title: t.modalTitle, placeholder: t.placeholderName, cancel: t.cancel, save: t.save }} />
        <DonateModal show={showDonateModal} onClose={() => setShowDonateModal(false)} lang={lang} currentP={PERSONAS[displayKey]} onBribe={()=>{}} onExternal={()=>{}} />
        <InstallModal show={showInstallModal} onClose={() => setShowInstallModal(false)} lang={lang} />
        <FeedbackModal show={showFeedbackModal} onClose={() => setShowFeedbackModal(false)} text="" setText={()=>{}} onSubmit={()=>{ setShowFeedbackModal(false); alert(t.feedbackSent); }} lang={lang} />
        
        <DailyBriefingModal 
            show={showTarot} 
            onClose={() => setShowTarot(false)} 
            onJumpToChat={handleTarotJump} 
            lang={lang} 
            forcedSpeaker={config.name as any} 
            onCollect={loadInventory}
        />
        
        <InventoryModal show={showInventory} onClose={() => setShowInventory(false)} inventoryItems={inventoryItems} lang={lang} isUsageMode={true} currentPersona={config.name} onUseItem={handleItemUse} />
        <FocusModal show={showFocus} onClose={() => setShowFocus(false)} lang={lang} onReward={handleReward} />
        <MemoModal show={showMemo} onClose={() => setShowMemo(false)} lang={lang} onReward={handleReward} />

        <div className="absolute inset-0 z-0 bg-black">
             <div className="absolute inset-0 bg-cover bg-center transition-opacity opacity-100" style={{ backgroundImage: `url(${wallpaper})` }} />
             <div className="absolute inset-0 bg-black/40" />
             <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay pointer-events-none"></div>
        </div>

        {/* Header */}
        <header className="flex-none pt-12 pb-2 px-6 relative z-50 w-full bg-gradient-to-b from-black/80 to-transparent flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 pointer-events-auto">
                  <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center bg-black/30 border border-white/10 rounded-full hover:bg-black/50 backdrop-blur-md transition-all active:scale-95 group">
                      <ArrowLeft size={20} className="text-white group-hover:-translate-x-0.5 transition-transform" />
                  </button>
                  <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full border border-white/20 overflow-hidden shadow-lg ring-2 ring-black/20">
                          {config.avatar ? <img src={config.avatar} className="w-full h-full object-cover" onError={(e) => e.currentTarget.style.display='none'} /> : <div className="w-full h-full bg-slate-800 flex items-center justify-center">{config.name[0]}</div>}
                      </div>
                      <div className="flex flex-col">
                          <span className={`text-xs font-black uppercase tracking-widest ${config.color} drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]`}>{config.name}</span>
                          <span className="text-[9px] text-gray-200 font-mono flex items-center gap-1.5 shadow-black drop-shadow-md opacity-90">
                              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_5px_#22c55e]"></span> {t.online}
                          </span>
                      </div>
                  </div>
              </div>
              
              <div className="flex items-center gap-2 pointer-events-auto relative">
                  <button onClick={() => setShowTarot(true)} className="w-10 h-10 flex items-center justify-center bg-black/30 border border-white/10 rounded-full active:scale-95 transition-all hover:bg-black/50 backdrop-blur-md group">
                      <Sparkles size={18} className="text-purple-400 group-hover:text-purple-300 transition-colors" />
                  </button>
                  <button onClick={() => setShowInventory(true)} className="w-10 h-10 flex items-center justify-center bg-black/30 border border-white/10 rounded-full active:scale-95 transition-all hover:bg-black/50 backdrop-blur-md group">
                      <Package size={18} className="text-emerald-400 group-hover:text-emerald-300 transition-colors" />
                  </button>
                  <button onClick={() => setShowMenu(!showMenu)} className="w-10 h-10 flex items-center justify-center bg-black/30 border border-white/10 rounded-full active:scale-95 transition-all hover:bg-black/50 backdrop-blur-md">
                      <MoreVertical size={18} className="text-white" />
                  </button>
                  {showMenu && (
                    <GlobalMenu lang={lang} onClose={() => setShowMenu(false)} onEditName={() => { setShowMenu(false); setTempName(userName); setShowNameModal(true); }} onSwitchLang={handleSwitchLang} onInstall={() => { setShowMenu(false); setShowInstallModal(true); }} onDonate={() => { setShowMenu(false); setShowDonateModal(true); }} onFeedback={() => { setShowMenu(false); setShowFeedbackModal(true); }} onReset={handleReset} />
                  )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-1 bg-black/40 backdrop-blur-md border border-white/5 p-2 rounded-lg pointer-events-none">
               <div className="flex flex-col gap-1">
                   <div className="flex justify-between text-[9px] text-pink-400 font-bold uppercase tracking-wider">
                       <span className="flex items-center gap-1"><Heart size={8} className="fill-current"/> {lang === 'zh' ? '好感度' : 'Favorability'}</span>
                       <span>{stats.favorability}%</span>
                   </div>
                   <div className="h-1 w-full bg-pink-500/20 rounded-full overflow-hidden">
                       <div className="h-full bg-pink-500 shadow-[0_0_10px_#ec4899] transition-all duration-1000 ease-out" style={{ width: `${stats.favorability}%` }} />
                   </div>
               </div>
               
               <div className="flex flex-col gap-1">
                   <div className="flex justify-between text-[9px] text-cyan-400 font-bold uppercase tracking-wider">
                       <span className="flex items-center gap-1"><Activity size={8} /> {lang === 'zh' ? '情绪' : 'Mood'}</span>
                       <span>{getMoodLabel(stats.moodValue)}</span>
                   </div>
                   <div className="h-1 w-full bg-cyan-500/20 rounded-full overflow-hidden">
                       <div className="h-full bg-cyan-500 shadow-[0_0_10px_#06b6d4] transition-all duration-1000 ease-out" style={{ width: `${stats.moodValue}%` }} />
                   </div>
               </div>
            </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-4 space-y-6 scroll-smooth no-scrollbar relative z-10 pb-32">
            {messages.map((msg, idx) => {
                const isAI = msg.role !== 'user';
                const parts = msg.content.split(/({{icon:[^}]+}})/g);
                return (
                    <div key={idx} className={`flex w-full ${!isAI ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 fade-in duration-300`}>
                        <div className={`flex flex-col gap-1 max-w-[85%] min-w-0 ${!isAI ? 'items-end' : 'items-start'}`}>
                            {isAI && (idx === 0 || messages[idx-1].role === 'user') && (
                                <span className="text-[9px] text-gray-300 ml-1 mb-1 uppercase tracking-widest opacity-80 font-bold shadow-black drop-shadow-md">{config.name}</span>
                            )}
                            {!isAI ? (
                                <div className="px-5 py-3 text-sm bg-gradient-to-br from-[#7F5CFF] to-[#6242db] text-white rounded-[1.2rem] rounded-tr-sm shadow-[0_4px_15px_rgba(127,92,255,0.3)] border border-white/10 break-words whitespace-pre-wrap min-w-0">
                                    {/* 🔥 清洗 Tag */}
                                    {msg.content.replace(/\[.*?\]/g, '').trim()}
                                </div>
                            ) : (
                                <>
                                    <div className="px-6 py-4 text-sm leading-relaxed shadow-lg backdrop-blur-xl rounded-[1.2rem] rounded-tl-sm bg-[#1a1a1a]/85 border border-white/10 text-gray-100 relative overflow-hidden group break-words whitespace-pre-wrap min-w-0">
                                        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                                        <div className="markdown-body">
                                          {parts.map((part, pIdx) => {
                                              if (part.startsWith('{{icon:') && part.endsWith('}}')) return null; 
                                              return <ReactMarkdown key={pIdx}>{part}</ReactMarkdown>;
                                          })}
                                        </div>
                                    </div>
                                    {parts.map((part, pIdx) => {
                                        if (part.startsWith('{{icon:') && part.endsWith('}}')) {
                                            const itemId = part.slice(7, -2);
                                            return <LootCard key={`loot-${pIdx}`} itemId={itemId} lang={lang} />;
                                        }
                                        return null;
                                    })}
                                </>
                            )}
                        </div>
                    </div>
                );
            })}
            {isLoading && (
               <div className="flex justify-start ml-2">
                 <div className="bg-[#1a1a1a]/80 px-4 py-3 rounded-2xl rounded-tl-sm border border-white/10 flex gap-1 items-center backdrop-blur-md">
                   <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{animationDelay: '0ms'}}/>
                   <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{animationDelay: '150ms'}}/>
                   <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{animationDelay: '300ms'}}/>
                   <span className="text-xs text-gray-400 ml-2 animate-pulse">{t.typing}</span>
                 </div>
               </div>
            )}
            <div ref={messagesEndRef} className="h-4" />
        </main>

        <footer className="flex-none px-6 pb-8 pt-2 z-50 absolute bottom-0 left-0 right-0 pointer-events-none">
            {!isLoading && (
                <div className="pointer-events-auto flex items-center justify-end gap-2 mb-3 overflow-x-auto no-scrollbar pr-1">
                    {/* Rin & Sol 专属按钮 */}
                    {config.name === 'Rin' && (
                        <button onClick={() => setShowMemo(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/20 border border-purple-500/40 text-purple-300 text-[10px] font-bold rounded-full backdrop-blur-md hover:bg-purple-500/30 active:scale-95 transition-all whitespace-nowrap animate-in slide-in-from-bottom-2 fade-in shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                            <Heart size={10} className="fill-current" /> {t.actionRin}
                        </button>
                    )}
                    {config.name === 'Sol' && (
                        <button onClick={() => setShowFocus(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/20 border border-orange-500/40 text-orange-300 text-[10px] font-bold rounded-full backdrop-blur-md hover:bg-orange-500/30 active:scale-95 transition-all whitespace-nowrap animate-in slide-in-from-bottom-2 fade-in shadow-[0_0_15px_rgba(249,115,22,0.3)]">
                            <Flame size={10} className="fill-current" /> {t.actionSol}
                        </button>
                    )}

                    {messages.length < 6 && (
                        <>
                            <button onClick={() => handleQuickReply(dynamicReply)} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#7F5CFF]/20 border border-[#7F5CFF]/40 text-[#a388ff] text-[10px] font-bold rounded-full backdrop-blur-md shadow-[0_0_10px_rgba(127,92,255,0.2)] hover:bg-[#7F5CFF]/30 active:scale-95 transition-all whitespace-nowrap animate-in slide-in-from-bottom-2 fade-in"><Zap size={10} className="fill-current" />{dynamicReply}</button>
                            <button onClick={() => handleQuickReply(t.quickReply1)} className="px-3 py-1.5 bg-black/60 border border-white/10 text-gray-300 text-[10px] font-bold rounded-full backdrop-blur-md hover:bg-white/10 active:scale-95 transition-all whitespace-nowrap animate-in slide-in-from-bottom-2 fade-in delay-75">{t.quickReply1}</button>
                            <button onClick={() => handleQuickReply(t.quickReply2)} className="px-3 py-1.5 bg-black/60 border border-white/10 text-gray-300 text-[10px] font-bold rounded-full backdrop-blur-md hover:bg-white/10 active:scale-95 transition-all whitespace-nowrap animate-in slide-in-from-bottom-2 fade-in delay-100"><MessageSquarePlus size={10} className="inline mr-1" />{t.quickReply2}</button>
                        </>
                    )}
                </div>
            )}

            <div className="pointer-events-auto relative flex items-center gap-2 bg-[#1a1a1a]/90 backdrop-blur-xl p-2 rounded-full border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.6)] ring-1 ring-white/5 transition-all focus-within:ring-white/20 focus-within:bg-black/90">
                 <button type="button" className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-white transition-colors bg-white/5 rounded-full"><Mic size={20} /></button>
                 <input 
                    type="text" 
                    value={input} 
                    onChange={(e) => setInput(e.target.value)} 
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()} 
                    placeholder={t.placeholder} 
                    className="flex-1 bg-transparent text-white text-sm px-2 focus:outline-none placeholder-gray-500 h-full min-w-0" 
                    disabled={isLoading} 
                 />
                 <button onClick={() => handleSend()} disabled={!input.trim() || isLoading} className="w-10 h-10 flex items-center justify-center bg-[#7F5CFF] text-white rounded-full hover:bg-[#6b4bd6] disabled:opacity-30 disabled:hover:bg-[#7F5CFF] transition-all shadow-[0_0_15px_rgba(127,92,255,0.4)] flex-shrink-0 active:scale-95">
                    {isLoading ? <Sparkles size={18} className="animate-spin" /> : <Send size={18} className="-ml-0.5" />}
                 </button>
            </div>
        </footer>
    </div>
  );
}