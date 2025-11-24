'use client';

import { useState, useRef, useEffect } from 'react';
import { useChat } from 'ai/react';
import { PERSONAS, PersonaType, UI_TEXT, LangType } from '@/lib/constants';
import { getDeviceId } from '@/lib/utils';
import { getMemory, saveMemory } from '@/lib/storage';
import { getLocalTimeInfo, getSimpleWeather } from '@/lib/env';
// 👇 引入状态工具
import { getPersonaStatus } from '@/lib/status'; 
import { Send, Calendar, X, Share2, Languages, Download, Users, Sparkles, ImageIcon, FileText, RotateCcw, MoreVertical, Trash2, Coffee, Tag, Heart, Shield, Zap, Lock, Globe, UserPen, Brain, Book, QrCode, ExternalLink, ChevronRight, MessageSquare, Volume2, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import html2canvas from 'html2canvas';
import { Message } from 'ai';
import posthog from 'posthog-js';

type DailyQuote = { content: string; date: string; persona: string; };
type ViewState = 'selection' | 'chat';

const CURRENT_VERSION_KEY = 'toughlove_update_v1.6_final';
const LANGUAGE_KEY = 'toughlove_language_confirmed';
const USER_NAME_KEY = 'toughlove_user_name';
const LAST_DIARY_TIME_KEY = 'toughlove_last_diary_time';

const Typewriter = ({ content, isThinking }: { content: string, isThinking?: boolean }) => {
  const [displayedContent, setDisplayedContent] = useState("");
  useEffect(() => {
    if (!isThinking) {
      setDisplayedContent(content);
      return;
    }
    if (displayedContent.length < content.length) {
      const delay = Math.random() * 30 + 20;
      const timer = setTimeout(() => {
        setDisplayedContent(content.slice(0, displayedContent.length + 1));
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [content, displayedContent, isThinking]);
  return <ReactMarkdown>{displayedContent}</ReactMarkdown>;
};

export default function Home() {
  // --- 状态定义 ---
  const [view, setView] = useState<ViewState>('selection');
  const [activePersona, setActivePersona] = useState<PersonaType>('Ash');
  const [lang, setLang] = useState<LangType>('zh');
  const [showLangSetup, setShowLangSetup] = useState(false);

  const [showQuote, setShowQuote] = useState(false);
  const [quoteData, setQuoteData] = useState<DailyQuote | null>(null);
  const [isQuoteLoading, setIsQuoteLoading] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [isGeneratingImg, setIsGeneratingImg] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showDonateModal, setShowDonateModal] = useState(false);
  
  const [showProfile, setShowProfile] = useState(false);
  const [profileData, setProfileData] = useState<{tags: string[], diagnosis: string} | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [showDiary, setShowDiary] = useState(false);
  const [diaryContent, setDiaryContent] = useState("");
  const [isDiaryLoading, setIsDiaryLoading] = useState(false);
  const [hasNewDiary, setHasNewDiary] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);

  const [userName, setUserName] = useState("");
  const [tempName, setTempName] = useState("");
  const [userTags, setUserTags] = useState<string[]>([]);
  const [interactionCount, setInteractionCount] = useState(0);
  const [tick, setTick] = useState(0);
  const [currentWeather, setCurrentWeather] = useState("");
  const [playingMsgId, setPlayingMsgId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const quoteCardRef = useRef<HTMLDivElement>(null);
  const profileCardRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const ui = UI_TEXT[lang];

  const getTrustKey = (p: string) => `toughlove_trust_${p}`;
  const getDiaryKey = (p: string) => `toughlove_diary_${p}_${new Date().toISOString().split('T')[0]}`;
  const badgeStyle = "absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-[#1a1a1a] animate-pulse";

  // --- 启动初始化 ---
  useEffect(() => {
    const hasLang = localStorage.getItem(LANGUAGE_KEY);
    if (!hasLang) {
      const browserLang = navigator.language.toLowerCase();
      if (!browserLang.startsWith('zh')) { setLang('en'); }
      setShowLangSetup(true);
    }
    if (hasLang) {
      const hasSeenUpdate = localStorage.getItem(CURRENT_VERSION_KEY);
      if (!hasSeenUpdate) {
        const timer = setTimeout(() => setShowUpdateModal(true), 500);
        return () => clearTimeout(timer);
      }
    }
    
    const storedName = localStorage.getItem(USER_NAME_KEY);
    if (storedName) setUserName(storedName);

    const lastDiaryTime = localStorage.getItem(LAST_DIARY_TIME_KEY);
    const now = Date.now();
    if (!lastDiaryTime || (now - parseInt(lastDiaryTime) > 60 * 1000)) { 
       setHasNewDiary(true);
    }

    getSimpleWeather().then(w => setCurrentWeather(w));
    posthog.capture('page_view', { lang: lang });
  }, []);

  // --- 辅助函数 ---
  const getPersonaPreview = (pKey: PersonaType) => {
    if (typeof window === 'undefined') return { isChatted: false, lastMsg: "", trust: 0, time: "" };

    const history = getMemory(pKey);
    const trust = parseInt(localStorage.getItem(getTrustKey(pKey)) || '0');
    
    let lastMsg = "";
    let time = "";
    let isChatted = false;
    
    if (history.length > 0) {
      isChatted = true;
      const last = history[history.length - 1];
      const prefix = last.role === 'user' ? 'You: ' : '';
      lastMsg = prefix + last.content.split('|||')[0]; 
      time = "Active"; 
    } else {
      const p = PERSONAS[pKey];
      lastMsg = p.greetings[lang][0];
      time = "New";
    }
    return { isChatted, lastMsg, trust, time };
  };

  const getLevelInfo = (count: number) => {
    if (count < 50) { return { level: 1, label: lang === 'zh' ? '陌生人' : 'Stranger', max: 50, icon: <Shield size={12} />, bgClass: 'bg-[#0a0a0a]', borderClass: 'border-white/5', barColor: 'bg-gray-500', glowClass: '' }; }
    if (count < 100) { return { level: 2, label: lang === 'zh' ? '熟人' : 'Acquaintance', max: 100, icon: <Zap size={12} />, bgClass: 'bg-gradient-to-b from-[#0f172a] to-[#0a0a0a]', borderClass: 'border-blue-500/30', barColor: 'bg-blue-500', glowClass: 'shadow-[0_0_30px_rgba(59,130,246,0.1)]' }; }
    return { level: 3, label: lang === 'zh' ? '共犯' : 'Partner', max: 100, icon: <Heart size={12} />, bgClass: 'bg-[url("/grid.svg")] bg-fixed bg-[length:50px_50px] bg-[#0a0a0a]', customStyle: { background: 'radial-gradient(circle at 50% -20%, #1e1b4b 0%, #0a0a0a 60%)' }, borderClass: 'border-[#7F5CFF]/40', barColor: 'bg-[#7F5CFF]', glowClass: 'shadow-[0_0_40px_rgba(127,92,255,0.15)]' };
  };

  const confirmLanguage = (selectedLang: LangType) => {
    setLang(selectedLang);
    localStorage.setItem(LANGUAGE_KEY, 'true');
    setShowLangSetup(false);
    posthog.capture('language_set', { language: selectedLang });
    const hasSeenUpdate = localStorage.getItem(CURRENT_VERSION_KEY);
    if (!hasSeenUpdate) { setTimeout(() => setShowUpdateModal(true), 500); }
  };

  const saveUserName = () => {
    const nameToSave = tempName.trim();
    setUserName(nameToSave);
    localStorage.setItem(USER_NAME_KEY, nameToSave);
    setShowNameModal(false);
    posthog.capture('username_set');
  };

  // --- 语音播放逻辑 (修复版) ---
 // --- 语音播放逻辑 (Base64 修复版) ---
 const handlePlayAudio = async (text: string, msgId: string) => {
  // 1. 停止当前
  if (playingMsgId === msgId) {
    audioRef.current?.pause();
    setPlayingMsgId(null);
    return;
  }
  if (audioRef.current) {
    audioRef.current.pause();
  }

  setPlayingMsgId(msgId);

  try {
    const p = PERSONAS[activePersona];
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: text.replace(/\|\|\|/g, ' ').replace(/[\*#]/g, ''), 
        voice: p.voiceConfig.voice,
        style: p.voiceConfig.style,
        rate: p.voiceConfig.rate,
        pitch: p.voiceConfig.pitch
      }),
    });

    const data = await res.json();

    if (!res.ok || !data.audio) {
      throw new Error(data.error || 'TTS Failed');
    }

    // 🔥 核心修复：直接播放 Base64 数据
    // 这种方式不需要 Blob URL，兼容性 100%
    const audioSrc = `data:audio/mp3;base64,${data.audio}`;
    const audio = new Audio(audioSrc);
    
    audio.onended = () => {
      setPlayingMsgId(null);
    };
    
    // 播放并处理自动播放限制
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        console.error("Playback blocked:", error);
        setPlayingMsgId(null);
      });
    }
    
    audioRef.current = audio;

  } catch (e) {
    console.error("Audio Play Error:", e);
    setPlayingMsgId(null);
    // 如果是网络原因，可以不弹窗，只是变回原样
  }
};

  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages, setInput } = useChat({
    api: '/api/chat',
    onError: (err) => console.error("Stream Error:", err),
    onFinish: () => {
      const newCount = interactionCount + 1;
      setInteractionCount(newCount);
      localStorage.setItem(getTrustKey(activePersona), newCount.toString());
      if (newCount === 1 || newCount === 50 || newCount === 100) {
        posthog.capture('trust_milestone', { persona: activePersona, level: newCount });
      }
    }
  });

  useEffect(() => {
    const storedCount = localStorage.getItem(getTrustKey(activePersona));
    setInteractionCount(storedCount ? parseInt(storedCount) : 0);
  }, [activePersona]);

  const syncToCloud = async (currentMessages: any[]) => {
    try {
      await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: getDeviceId(), persona: activePersona, messages: currentMessages })
      });
    } catch (e) { console.error("Cloud sync failed", e); }
  };

  useEffect(() => {
    if (messages.length > 0 && view === 'chat') {
      saveMemory(activePersona, messages);
      syncToCloud(messages);
    }
  }, [messages, activePersona, view]);

  const analyzeTags = async (currentMessages: any[]) => {
    try {
      const res = await fetch('/api/tag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: currentMessages, userId: getDeviceId() }),
      });
      const data = await res.json();
      if (data.tags && data.tags.length > 0) {
        setUserTags(data.tags);
        posthog.capture('tags_generated', { tags: data.tags });
      }
    } catch (e) { console.error("Tagging failed", e); }
  };

  useEffect(() => {
    if (!isLoading && messages.length >= 4 && messages.length % 4 === 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.role === 'assistant') analyzeTags(messages);
    }
  }, [messages, isLoading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(() => { scrollToBottom(); }, [messages, isLoading, view]);

  const toggleLanguage = () => {
    setLang(prev => prev === 'zh' ? 'en' : 'zh');
    setShowMenu(false);
  };

  useEffect(() => {
    setDiaryContent("");
    setHasNewDiary(false);
    const savedDiary = localStorage.getItem(getDiaryKey(activePersona));
    if (savedDiary) {
      setDiaryContent(savedDiary);
    } else {
        const history = getMemory(activePersona);
        if (history.length > 5) {
            setHasNewDiary(true);
        }
    }
  }, [activePersona]);

  const selectPersona = async (persona: PersonaType) => {
    posthog.capture('persona_select', { persona: persona });
    setActivePersona(persona);
    setView('chat');
    const localHistory = getMemory(persona);
    setMessages(localHistory);
    try {
      const res = await fetch(`/api/sync?userId=${getDeviceId()}&persona=${persona}`);
      const data = await res.json();
      if (data.messages && data.messages.length > 0) {
        if (data.messages.length >= localHistory.length) {
          setMessages(data.messages);
          saveMemory(persona, data.messages);
        }
      } else if (localHistory.length === 0) {
        const p = PERSONAS[persona];
        const greetings = p.greetings[lang];
        const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
        const welcomeMsg: Message = { id: Date.now().toString(), role: 'assistant', content: randomGreeting };
        setMessages([welcomeMsg]);
        saveMemory(persona, [welcomeMsg]);
      }
    } catch (e) {
      console.error("Load cloud history failed", e);
      if (localHistory.length === 0) {
         const p = PERSONAS[persona];
         const greetings = p.greetings[lang];
         const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
         const welcomeMsg: Message = { id: Date.now().toString(), role: 'assistant', content: randomGreeting };
         setMessages([welcomeMsg]);
         saveMemory(persona, [welcomeMsg]);
      }
    }
  };

  const handleReset = () => {
    if (confirm(ui.resetConfirm)) {
      posthog.capture('chat_reset', { persona: activePersona });
      setMessages([]);
      saveMemory(activePersona, []);
      syncToCloud([]); 
      setShowMenu(false);
      setInteractionCount(0);
      localStorage.setItem(getTrustKey(activePersona), '0');
      localStorage.removeItem(getDiaryKey(activePersona));
      setDiaryContent("");
      const p = PERSONAS[activePersona];
      const greetings = p.greetings[lang];
      const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
      setTimeout(() => {
        const welcomeMsg: Message = { id: Date.now().toString(), role: 'assistant', content: randomGreeting };
        setMessages([welcomeMsg]);
        saveMemory(activePersona, [welcomeMsg]);
        syncToCloud([welcomeMsg]);
      }, 100);
    }
  };

  const backToSelection = () => { setView('selection'); setTick(tick + 1); };
  const dismissUpdate = () => { localStorage.setItem(CURRENT_VERSION_KEY, 'true'); setShowUpdateModal(false); };
  const handleTryNewFeature = () => { posthog.capture('update_click_try'); dismissUpdate(); selectPersona('Echo'); };

  const handleExport = () => {
    posthog.capture('feature_export', { persona: activePersona });
    if (messages.length === 0) return;
    const dateStr = new Date().toLocaleString();
    const header = `================================\n${ui.exportFileName}\nDate: ${dateStr}\nPersona: ${currentP.name}\nUser: ${userName || 'Anonymous'}\n================================\n\n`;
    const body = messages.map(m => {
      const role = m.role === 'user' ? (userName || 'ME') : currentP.name.toUpperCase();
      return `[${role}]:\n${m.content.replace(/\|\|\|/g, '\n')}\n`;
    }).join('\n--------------------------------\n\n');
    const blob = new Blob([header + body], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${ui.exportFileName}_${activePersona}_${new Date().toISOString().split('T')[0]}.txt`;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowMenu(false);
  };

  const handleInstall = () => { posthog.capture('feature_install_click'); setShowInstallModal(true); setShowMenu(false); };
  const handleDonate = () => { posthog.capture('feature_donate_click'); setShowDonateModal(true); setShowMenu(false); }
  const goBMAC = () => { window.open('https://www.buymeacoffee.com/ldbrian', '_blank'); }
  const handleEditName = () => { setTempName(userName); setShowNameModal(true); setShowMenu(false); }

  const handleOpenProfile = async () => {
    posthog.capture('feature_profile_open');
    setShowMenu(false);
    setShowProfile(true);
    setIsProfileLoading(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: getDeviceId(), language: lang }),
      });
      const data = await res.json();
      setProfileData(data);
    } catch (e) { console.error(e); } finally { setIsProfileLoading(false); }
  };

  const handleOpenDiary = async () => {
    setShowDiary(true);
    if (!diaryContent || hasNewDiary) {
        setIsDiaryLoading(true);
        try {
            const res = await fetch('/api/diary', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    messages: messages,
                    persona: activePersona,
                    language: lang,
                    userName: userName
                }),
            });
            const data = await res.json();
            if (data.diary) {
                setDiaryContent(data.diary);
                setHasNewDiary(false);
                localStorage.setItem(getDiaryKey(activePersona), data.diary);
                localStorage.setItem(LAST_DIARY_TIME_KEY, Date.now().toString());
                posthog.capture('diary_read', { persona: activePersona });
            } else {
                setDiaryContent(lang === 'zh' ? "（日记本是空的。聊少了，懒得记。）" : "(Diary is empty. Not enough chat.)");
            }
        } catch (e) {
            console.error(e);
            setDiaryContent("Error loading diary.");
        } finally {
            setIsDiaryLoading(false);
        }
    }
  };

  const downloadProfileCard = async () => {
    posthog.capture('feature_profile_download');
    if (!profileCardRef.current) return;
    setIsGeneratingImg(true);
    try {
      const canvas = await html2canvas(profileCardRef.current, {
        backgroundColor: '#000000',
        scale: 3,
        useCORS: true,
      } as any);
      const image = canvas.toDataURL("image/png");
      const link = document.createElement('a');
      link.href = image;
      link.download = `ToughLove_Profile_${new Date().toISOString().split('T')[0]}.png`;
      link.click();
    } catch (err) { alert("保存失败"); } finally { setIsGeneratingImg(false); }
  };

  const fetchDailyQuote = async () => {
    posthog.capture('feature_quote_open');
    setShowQuote(true);
    setIsQuoteLoading(true);
    try {
      const res = await fetch('/api/daily', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ persona: activePersona, userId: getDeviceId(), language: lang }),
      });
      const data = await res.json();
      setQuoteData(data);
    } catch (e) { console.error(e); } finally { setIsQuoteLoading(false); }
  };

  const downloadQuoteCard = async () => {
    posthog.capture('feature_poster_download', { persona: activePersona });
    if (!quoteCardRef.current) return;
    setIsGeneratingImg(true);
    try {
      const canvas = await html2canvas(quoteCardRef.current, {
        backgroundColor: '#111111',
        scale: 3,
        useCORS: true,
      } as any);
      const image = canvas.toDataURL("image/png");
      const link = document.createElement('a');
      link.href = image;
      link.download = `ToughLove_${activePersona}_${new Date().toISOString().split('T')[0]}.png`;
      link.click();
    } catch (err) { alert("保存失败"); } finally { setIsGeneratingImg(false); }
  };

  const onFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    posthog.capture('message_send', { persona: activePersona });
    const timeData = getLocalTimeInfo();
    const envInfo = {
        time: timeData.localTime,
        weekday: lang === 'zh' ? timeData.weekdayZH : timeData.weekdayEN,
        phase: timeData.lifePhase,
        weather: currentWeather
    };
    handleSubmit(e, { options: { body: { persona: activePersona, language: lang, interactionCount, userName, envInfo } } });
  };

  const currentP = PERSONAS[activePersona];
  const levelInfo = getLevelInfo(interactionCount);
  const progressPercent = Math.min(100, (interactionCount / levelInfo.max) * 100);

  return (
    <div className="relative flex flex-col h-screen bg-[#050505] text-gray-100 overflow-hidden font-sans selection:bg-[#7F5CFF] selection:text-white">
      <div className="absolute top-[-20%] left-0 right-0 h-[500px] bg-gradient-to-b from-[#7F5CFF]/10 to-transparent blur-[100px] pointer-events-none" />

      {/* Language & Update & Install Modals ... (省略以节省篇幅，保持不变) */}
      {showLangSetup && (<div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 animate-[fadeIn_0.5s_ease-out]"><div className="mb-10 text-center"><div className="w-20 h-20 bg-[#1a1a1a] rounded-full flex items-center justify-center text-4xl border border-white/10 mx-auto mb-4 shadow-[0_0_30px_rgba(127,92,255,0.3)]">🧬</div><h1 className="text-2xl font-bold text-white tracking-wider mb-2">TOUGHLOVE AI</h1><p className="text-gray-500 text-sm">Choose your language / 选择语言</p></div><div className="flex flex-col gap-4 w-full max-w-xs"><button onClick={() => confirmLanguage('zh')} className={`p-6 rounded-2xl border transition-all flex items-center justify-between group ${lang === 'zh' ? 'bg-white/10 border-[#7F5CFF]' : 'bg-[#111] border-white/10 hover:border-white/30'}`}><div className="text-left"><div className="text-lg font-bold text-white">中文</div><div className="text-xs text-gray-500">Chinese</div></div>{lang === 'zh' && <div className="w-3 h-3 bg-[#7F5CFF] rounded-full shadow-[0_0_10px_#7F5CFF]"></div>}</button><button onClick={() => confirmLanguage('en')} className={`p-6 rounded-2xl border transition-all flex items-center justify-between group ${lang === 'en' ? 'bg-white/10 border-[#7F5CFF]' : 'bg-[#111] border-white/10 hover:border-white/30'}`}><div className="text-left"><div className="text-lg font-bold text-white">English</div><div className="text-xs text-gray-500">English</div></div>{lang === 'en' && <div className="w-3 h-3 bg-[#7F5CFF] rounded-full shadow-[0_0_10px_#7F5CFF]"></div>}</button></div></div>)}
      {showNameModal && (<div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-sm p-6 animate-[fadeIn_0.2s_ease-out]"><div className="w-full max-w-xs bg-[#1a1a1a] rounded-3xl border border-white/10 shadow-2xl p-6"><div className="text-center mb-6"><div className="inline-flex p-3 bg-white/5 rounded-full mb-3 text-[#7F5CFF]"><UserPen size={24}/></div><h3 className="text-lg font-bold text-white">{ui.editName}</h3></div><input type="text" value={tempName} onChange={(e) => setTempName(e.target.value)} placeholder={ui.namePlaceholder} className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#7F5CFF] outline-none mb-6 text-center" maxLength={10} /><div className="flex gap-3"><button onClick={() => setShowNameModal(false)} className="flex-1 py-3 rounded-xl bg-white/5 text-gray-400 text-sm hover:bg-white/10 transition-colors">Cancel</button><button onClick={saveUserName} className="flex-1 py-3 rounded-xl bg-[#7F5CFF] text-white font-bold text-sm hover:bg-[#6b4bd6] transition-colors">{ui.nameSave}</button></div></div></div>)}
      {showDonateModal && (<div className="fixed inset-0 z-[170] flex items-center justify-center bg-black/90 backdrop-blur-sm p-6 animate-[fadeIn_0.2s_ease-out]"><div className="w-full max-w-sm bg-[#1a1a1a] rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden"><button onClick={() => setShowDonateModal(false)} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white"><X size={20}/></button><div className="p-8 text-center"><div className="inline-flex p-4 bg-yellow-500/10 rounded-full mb-4 text-yellow-500 shadow-[0_0_30px_rgba(234,179,8,0.2)]"><Coffee size={32} /></div><h3 className="text-xl font-bold text-white mb-2">Buy Ash a Coffee</h3><p className="text-xs text-gray-400 mb-8">你的支持是我毒舌下去的动力。</p><div className="bg-white/5 p-4 rounded-2xl border border-white/5 mb-4"><div className="flex items-center gap-2 mb-3 text-sm text-gray-300"><QrCode size={16} className="text-green-500" /> <span>WeChat Pay / 微信支付</span></div><div className="w-40 h-40 bg-white mx-auto rounded-lg flex items-center justify-center overflow-hidden"><img src="/wechat_pay.png" alt="WeChat Pay" className="w-full h-full object-cover" /></div></div><button onClick={goBMAC} className="w-full py-3.5 rounded-xl bg-[#FFDD00] hover:bg-[#ffea00] text-black font-bold text-sm flex items-center justify-center gap-2 transition-colors"><Coffee size={16} fill="black" /><span>Buy Me a Coffee (USD)</span><ExternalLink size={14} /></button></div></div></div>)}
      {showProfile && (<div className="absolute inset-0 z-[160] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-[fadeIn_0.3s_ease-out]"><div className="w-full max-w-sm relative"><button onClick={() => setShowProfile(false)} className="absolute -top-12 right-0 p-2 text-gray-400 hover:text-white"><X size={24}/></button><div ref={profileCardRef} className="bg-[#050505] rounded-3xl border border-white/10 overflow-hidden shadow-2xl relative"><div className="h-32 bg-gradient-to-b from-[#7F5CFF]/20 to-transparent flex flex-col items-center justify-center"><div className="w-16 h-16 rounded-full bg-black border border-[#7F5CFF] flex items-center justify-center text-3xl shadow-[0_0_20px_rgba(127,92,255,0.4)]">🧠</div></div><div className="p-6 -mt-8 relative z-10"><h2 className="text-center text-xl font-bold text-white tracking-widest uppercase mb-1">{ui.profileTitle}</h2><p className="text-center text-xs text-gray-500 font-mono mb-6">ID: {getDeviceId().slice(0,8)}...</p>{isProfileLoading ? (<div className="py-10 text-center space-y-3"><div className="w-8 h-8 border-2 border-[#7F5CFF] border-t-transparent rounded-full animate-spin mx-auto"/><p className="text-xs text-gray-500 animate-pulse">{ui.analyzing}</p></div>) : (<div className="space-y-6"><div><div className="text-[10px] font-bold text-gray-600 uppercase mb-2 tracking-wider">{ui.tagsTitle}</div><div className="flex flex-wrap gap-2">{profileData?.tags && profileData.tags.length > 0 ? (profileData.tags.map((tag, i) => (<span key={i} className="px-3 py-1.5 rounded-md bg-[#1a1a1a] border border-white/10 text-xs text-gray-300">#{tag}</span>))) : (<span className="text-xs text-gray-600 italic">No data yet...</span>)}</div></div><div className="bg-[#111] p-4 rounded-xl border-l-2 border-[#7F5CFF] relative"><div className="absolute -top-3 left-3 bg-[#050505] px-1 text-[10px] font-bold text-[#7F5CFF]">{ui.diagnosisTitle}</div><p className="text-sm text-gray-300 leading-relaxed italic font-serif">"{profileData?.diagnosis}"</p></div><div className="text-center text-[9px] text-gray-700 pt-4 border-t border-white/5">GENERATED BY TOUGHLOVE AI</div></div>)}</div></div>{!isProfileLoading && (<button onClick={downloadProfileCard} disabled={isGeneratingImg} className="w-full mt-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors">{isGeneratingImg ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <ImageIcon size={16} />}{ui.saveCard}</button>)}</div></div>)}
      {showDiary && (<div className="absolute inset-0 z-[160] flex items-center justify-center bg-black/90 backdrop-blur-md p-6 animate-[fadeIn_0.3s_ease-out]"><div className="w-full max-w-sm bg-[#f5f5f0] text-[#1a1a1a] rounded-xl shadow-2xl relative overflow-hidden transform rotate-1"><div className="h-8 bg-red-800/10 border-b border-red-800/20 flex items-center px-4 gap-2"><div className="w-2 h-2 rounded-full bg-red-800/30"></div><div className="w-2 h-2 rounded-full bg-red-800/30"></div><div className="w-2 h-2 rounded-full bg-red-800/30"></div></div><button onClick={() => setShowDiary(false)} className="absolute top-2 right-2 p-1 text-gray-400 hover:text-black z-10"><X size={20}/></button><div className="p-6 pt-4 min-h-[300px] flex flex-col"><div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 border-b border-gray-300 pb-2 flex justify-between items-center"><span>{new Date().toLocaleDateString()}</span><span className="text-[#7F5CFF]">{currentP.name}'s Note</span></div><div className="flex-1 font-serif text-sm leading-7 text-gray-800 whitespace-pre-line relative"><div className="absolute inset-0 pointer-events-none opacity-10 bg-[url('https://www.transparenttextures.com/patterns/notebook.png')]"></div>{isDiaryLoading ? (<div className="flex flex-col items-center justify-center h-40 gap-3 opacity-50"><div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"/><span className="text-xs">Thinking...</span></div>) : (<Typewriter content={diaryContent} isThinking={false} />)}</div><div className="mt-6 pt-4 border-t border-gray-300 text-center"><p className="text-[10px] text-gray-400 italic">Confidential. Do not share.</p></div></div></div></div>)}
      {showInstallModal && (<div className="absolute inset-0 z-50 flex items-end sm:items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease-out]"><div className="absolute inset-0" onClick={() => setShowInstallModal(false)} /><div className="w-full max-w-sm bg-[#1a1a1a] rounded-t-3xl sm:rounded-3xl border border-white/10 shadow-2xl overflow-hidden relative z-10 animate-[slideUp_0.3s_ease-out]"><button onClick={() => setShowInstallModal(false)} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white"><X size={20} /></button><div className="p-6 space-y-6"><div className="flex items-center gap-4"><div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#7F5CFF] to-black flex items-center justify-center text-2xl border border-white/10">🥀</div><div><h3 className="text-lg font-bold text-white">{ui.installGuideTitle}</h3><p className="text-xs text-gray-400">{ui.installGuideDesc}</p></div></div><div className="space-y-3 text-sm text-gray-300"><div className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-2"><p className="text-xs opacity-80">{ui.iosStep1}</p><p className="text-xs opacity-80">{ui.iosStep2}</p><p className="text-xs opacity-80">{ui.iosStep3}</p></div></div></div></div></div>)}
      {showUpdateModal && (<div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-6 animate-[fadeIn_0.3s_ease-out]"><div className="w-full max-w-sm bg-gradient-to-br from-[#111] to-[#0a0a0a] rounded-3xl border border-indigo-500/30 shadow-[0_0_50px_rgba(99,102,241,0.15)] overflow-hidden relative animate-[scaleIn_0.3s_cubic-bezier(0.16,1,0.3,1)]"><button onClick={dismissUpdate} className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white z-10 transition-colors"><X size={20} /></button><div className="p-8 flex flex-col items-center text-center relative"><div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-indigo-900/20 to-transparent pointer-events-none"></div><div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase tracking-wider mb-6"><Sparkles size={12} /> {ui.updateTitle}</div><div className="relative w-20 h-20 mb-6"><div className="w-full h-full rounded-full bg-[#151515] flex items-center justify-center text-5xl border border-white/10 shadow-xl relative z-10">👁️</div><div className="absolute inset-0 bg-indigo-500 blur-xl opacity-30 animate-pulse"></div></div><h3 className="text-xl font-bold text-white mb-3">{ui.updateDesc}</h3><p className="text-sm text-gray-400 leading-relaxed whitespace-pre-line">{ui.updateContent}</p></div><div className="p-6 pt-0"><button onClick={handleTryNewFeature} className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all shadow-lg shadow-indigo-900/20 flex items-center justify-center gap-2 group">{ui.tryNow}<span className="group-hover:translate-x-1 transition-transform">→</span></button></div></div></div>)}
      
      {/* 🔥🔥🔥 列表视图 🔥🔥🔥 */}
      {view === 'selection' && (
        <div className="z-10 flex flex-col h-full w-full max-w-md mx-auto p-4 animate-[fadeIn_0.5s_ease-out]">
          <div className="flex justify-between items-center mb-6 px-2">
             <h1 className="text-xl font-bold tracking-wider flex items-center gap-2">
               <MessageSquare size={20} className="text-[#7F5CFF]" /> Chats
             </h1>
             <div className="flex gap-3">
               <button onClick={toggleLanguage} className="text-xs font-bold text-gray-400 hover:text-white uppercase border border-white/10 px-2 py-1 rounded-lg">{lang}</button>
             </div>
          </div>

          <div className="flex flex-col gap-3 overflow-y-auto pb-20">
            {(Object.keys(PERSONAS) as PersonaType[]).map((key) => {
              const p = PERSONAS[key];
              const { isChatted, lastMsg, trust, time } = getPersonaPreview(key);
              const level = getLevelInfo(trust).level;
              
              // 🔥 状态栏渲染：引入 getPersonaStatus (每小时变)
              const status = getPersonaStatus(key, new Date().getHours());

              return (
                <div 
                  key={key}
                  onClick={() => selectPersona(key)}
                  className={`group relative p-4 rounded-2xl transition-all duration-200 cursor-pointer flex items-center gap-4 border shadow-sm
                    ${isChatted 
                      ? 'bg-[#111] hover:bg-[#1a1a1a] border-white/5 hover:border-[#7F5CFF]/30'
                      : 'bg-gradient-to-r from-[#151515] to-[#111] border-white/10 hover:border-white/30'
                    }
                  `}
                >
                  <div className="relative flex-shrink-0">
                    <div className={`w-14 h-14 rounded-full bg-gradient-to-b from-[#222] to-[#0a0a0a] flex items-center justify-center text-3xl border-2 
                      ${isChatted ? (trust >= 50 ? (trust >= 100 ? 'border-[#7F5CFF] shadow-[0_0_10px_#7F5CFF]' : 'border-blue-500') : 'border-gray-700') : 'border-white/10'}
                    `}>
                      {p.avatar}
                    </div>
                    {isChatted && (
                      <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] border-2 border-[#111] 
                        ${trust >= 100 ? 'bg-[#7F5CFF] text-white' : (trust >= 50 ? 'bg-blue-500 text-white' : 'bg-gray-600 text-gray-300')}
                      `}>
                        {level}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <h3 className="font-bold text-white text-base">{p.name}</h3>
                      <span className="text-[10px] text-gray-500">
                        {isChatted ? time : 'New'}
                      </span>
                    </div>
                    
                    {/* 🔥 修复：状态栏 (Status Bar) */}
                    <div className="text-[10px] text-gray-500 mb-1 flex items-center gap-1">
                        {status}
                    </div>

                    <p className={`text-xs truncate transition-colors ${isChatted ? 'text-gray-400 group-hover:text-gray-300' : 'text-gray-500 italic'}`}>
                      {isChatted ? lastMsg : p.slogan[lang]}
                    </p>
                    
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-gray-500 border border-white/5`}>
                        {p.title[lang]}
                      </span>
                      {!isChatted && (
                        <span className="ml-auto text-[9px] font-bold text-[#7F5CFF] flex items-center gap-1 bg-[#7F5CFF]/10 px-2 py-0.5 rounded-full">
                          Chat <ChevronRight size={10}/>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="fixed bottom-6 left-0 right-0 flex justify-center z-20">
             <button onClick={handleOpenProfile} className="bg-[#1a1a1a]/80 backdrop-blur-md border border-white/10 text-gray-300 px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 text-xs font-bold hover:bg-[#222] hover:text-white transition-all hover:scale-105 active:scale-95">
               <Brain size={14} className="text-[#7F5CFF]" /> {ui.profile}
             </button>
          </div>
        </div>
      )}

      {/* Chat View (包含语音播放、日记强提示、统一红点) */}
      {view === 'chat' && (
        <div className={`z-10 flex flex-col h-full w-full max-w-lg mx-auto backdrop-blur-sm border-x shadow-2xl relative animate-[slideUp_0.3s_ease-out] ${levelInfo.bgClass} ${levelInfo.borderClass} ${levelInfo.glowClass} transition-all duration-1000`} style={levelInfo.customStyle}>
          <header className="flex-none flex items-center justify-between px-6 py-3 bg-[#0a0a0a]/60 backdrop-blur-md sticky top-0 z-20 border-b border-white/5 relative">
            <button onClick={backToSelection} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group">
              <div className="p-2 bg-white/5 rounded-full group-hover:bg-[#7F5CFF] transition-colors"><Users size={16} className="group-hover:text-white" /></div>
            </button>
            <div className="flex flex-col items-center cursor-pointer group" onClick={handleExport} title={ui.export}>
              <h1 className="font-bold text-sm tracking-wider text-white flex items-center gap-2">
                {currentP.avatar} {currentP.name}
                <span className={`text-[9px] px-1.5 py-0.5 rounded bg-white/10 border border-white/10 ${levelInfo.barColor.replace('bg-', 'text-')} flex items-center gap-1`}>{levelInfo.icon} Lv.{levelInfo.level}</span>
                <div className="ml-1 group relative flex items-center justify-center" onClick={(e) => { e.stopPropagation(); alert(lang === 'zh' ? '全程加密保护中' : 'End-to-end Encrypted'); }}>
                   <Shield size={10} className="text-green-500/70 hover:text-green-400 cursor-pointer" />
                </div>
              </h1>
              <p className={`text-[10px] font-medium opacity-70 tracking-wide ${currentP.color} group-hover:underline`}>{currentP.title[lang]}</p>
            </div>
            <div className="flex items-center gap-2 relative">
              <div className="relative">
                <button onClick={handleOpenDiary} className={`p-2 rounded-full transition-all duration-300 group relative ${hasNewDiary ? 'text-white bg-white/10' : 'text-gray-400 hover:text-white'}`}>
                  <Book size={20} className={hasNewDiary ? "animate-pulse" : ""} />
                  {/* 🔥 修复：统一红点样式 */}
                  {hasNewDiary && (<span className={badgeStyle}></span>)}
                </button>
                {hasNewDiary && (<div onClick={handleOpenDiary} className="absolute top-12 right-[-10px] z-50 animate-bounce cursor-pointer"><div className="absolute -top-1 right-4 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[8px] border-b-[#7F5CFF]"></div><div className="bg-[#7F5CFF] text-white text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-[0_0_15px_rgba(127,92,255,0.6)] whitespace-nowrap border border-white/20">{lang === 'zh' ? '解锁新日记 🔓' : 'New Secret Log 🔓'}</div></div>)}
              </div>
              
              <button onClick={fetchDailyQuote} className="p-2 text-gray-400 hover:text-[#7F5CFF] relative group">
                <Calendar size={20} />
                {/* 🔥 修复：统一红点样式 */}
                <span className={badgeStyle}></span>
              </button>

              <button onClick={() => setShowMenu(!showMenu)} className="p-2 text-gray-400 hover:text-white relative group">
                <MoreVertical size={20} />
                {/* 🔥 修复：统一红点样式 */}
                <span className={badgeStyle}></span>
              </button>
              
              {showMenu && (<><div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)}></div><div className="absolute top-12 right-0 mt-2 w-48 bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden animate-[fadeIn_0.2s_ease-out] flex flex-col p-1"><button onClick={handleEditName} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors w-full text-left"><UserPen size={16} className="text-[#7F5CFF]" /> {userName || ui.editName}</button><button onClick={handleOpenProfile} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors w-full text-left"><Brain size={16} /> {ui.profile}</button><div className="h-[1px] bg-white/5 my-1 mx-2"></div><button onClick={handleInstall} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors w-full text-left"><Download size={16} /> {ui.install}</button><button onClick={handleExport} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors w-full text-left"><FileText size={16} /> {ui.export}</button><button onClick={toggleLanguage} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors w-full text-left"><Languages size={16} /> {ui.language}</button><button onClick={handleDonate} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:text-yellow-400 hover:bg-white/5 rounded-xl transition-colors w-full text-left"><Coffee size={16} /> Buy me a coffee</button><div className="h-[1px] bg-white/5 my-1 mx-2"></div><button onClick={handleReset} className="flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors w-full text-left"><RotateCcw size={16} /> {ui.reset}</button></div></>)}
            </div>
            <div className="absolute bottom-0 left-0 w-full h-[2px] bg-white/5"><div className={`h-full ${levelInfo.barColor} shadow-[0_0_10px_currentColor] transition-all duration-500`} style={{ width: `${levelInfo.level === 3 ? 100 : progressPercent}%` }}/></div>
          </header>

          <main className="flex-1 overflow-y-auto px-4 py-6 space-y-6 scroll-smooth">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-60"><div className={`w-20 h-20 rounded-full bg-gradient-to-b from-white/5 to-transparent flex items-center justify-center text-4xl mb-2 border border-white/5 shadow-[0_0_30px_rgba(0,0,0,0.5)] animate-pulse`}>{currentP.avatar}</div><div className="space-y-2 px-8"><p className="text-white/80 text-lg font-light">{lang === 'zh' ? '我是' : 'I am'} <span className={currentP.color}>{currentP.name}</span>.</p><p className="text-sm text-gray-400 italic font-serif">{currentP.slogan[lang]}</p></div></div>
            )}
            {messages.map((msg, msgIdx) => {
              const isLastMessage = msgIdx === messages.length - 1;
              const isAI = msg.role !== 'user';
              return (
                <div key={msg.id} className={`flex w-full ${!isAI ? 'justify-end' : 'justify-start'} animate-[slideUp_0.1s_ease-out]`}>
                  <div className={`max-w-[85%] space-y-1`}>
                    {!isAI ? (
                      <div className="px-5 py-3.5 text-sm leading-6 shadow-md backdrop-blur-sm bg-gradient-to-br from-[#7F5CFF] to-[#6242db] text-white rounded-2xl rounded-tr-sm"><ReactMarkdown>{msg.content}</ReactMarkdown></div>
                    ) : (
                      <div className="flex flex-col gap-1 items-start">
                          {msg.content.split('|||').map((part, partIdx, arr) => {
                            if (!part.trim()) return null;
                            const isLastPart = partIdx === arr.length - 1;
                            const shouldType = isLastMessage && isLoading && isLastPart;
                            return (<div key={partIdx} className="px-5 py-3.5 text-sm leading-6 shadow-md backdrop-blur-sm bg-[#1a1a1a]/90 text-gray-200 rounded-2xl rounded-tl-sm border border-white/5 animate-[slideUp_0.2s_ease-out]"><Typewriter content={part.trim()} isThinking={shouldType} /></div>);
                          })}
                          {/* 🔥 语音播放按钮 */}
                          {isLastMessage && !isLoading && (
                             <button 
                               onClick={() => handlePlayAudio(msg.content, msg.id)} 
                               className={`mt-1 ml-1 p-1.5 rounded-full hover:bg-white/10 transition-colors ${playingMsgId === msg.id ? 'text-[#7F5CFF]' : 'text-gray-600'}`}
                             >
                               {playingMsgId === msg.id ? <Loader2 size={14} className="animate-spin"/> : <Volume2 size={14}/>}
                             </button>
                          )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {isLoading && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
               <div className="flex justify-start w-full animate-pulse"><div className="flex items-center gap-2 bg-[#1a1a1a] px-4 py-3 rounded-2xl rounded-tl-sm border border-white/5"><span className="text-xs text-gray-500">{ui.loading}</span></div></div>
            )}
            <div ref={messagesEndRef} className="h-4" />
          </main>

          <footer className="flex-none p-4 pb-6">
            <form onSubmit={onFormSubmit} className="relative flex items-center gap-2 bg-[#151515] p-2 rounded-[24px] border border-white/10 shadow-2xl focus-within:border-[#7F5CFF]/50 transition-all duration-300">
              <input type="text" value={input} onChange={handleInputChange} placeholder={ui.placeholder} className="flex-1 bg-transparent text-white text-sm px-4 py-2 focus:outline-none placeholder-gray-600" />
              <button type="submit" disabled={!input.trim() || isLoading} className="p-3 bg-[#7F5CFF] text-white rounded-full hover:bg-[#6b4bd6] disabled:opacity-30 transition-all transform active:scale-95"><Send size={18} fill="white" /></button>
            </form>
          </footer>
        </div>
      )}
    </div>
  );
}