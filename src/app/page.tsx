'use client';

import { useState, useRef, useEffect } from 'react';
import { useChat } from 'ai/react';
import { PERSONAS, PersonaType, UI_TEXT, LangType } from '@/lib/constants';
import { getDeviceId } from '@/lib/utils';
import { getMemory, saveMemory } from '@/lib/storage';
import { Send, Calendar, X, Share2, Languages, Download, Users, Sparkles, ImageIcon, FileText, RotateCcw, MoreVertical, Trash2, Coffee, Tag, Heart, Shield, Zap, Lock, Globe, UserPen } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import html2canvas from 'html2canvas';
import { Message } from 'ai';
import posthog from 'posthog-js';

type DailyQuote = { content: string; date: string; persona: string; };
type ViewState = 'selection' | 'chat';

const CURRENT_VERSION_KEY = 'toughlove_update_v1.4_memory';
const LANGUAGE_KEY = 'toughlove_language_confirmed';
const USER_NAME_KEY = 'toughlove_user_name'; // 👈 昵称 Key

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
  
  // 👇 新增：昵称相关状态
  const [userName, setUserName] = useState("");
  const [showNameModal, setShowNameModal] = useState(false);
  const [tempName, setTempName] = useState(""); // 弹窗里输入的临时名字

  const [userTags, setUserTags] = useState<string[]>([]);
  const [interactionCount, setInteractionCount] = useState(0);

  const quoteCardRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const ui = UI_TEXT[lang];

  const getTrustKey = (p: string) => `toughlove_trust_${p}`;

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
        const timer = setTimeout(() => setShowUpdateModal(true), 1500);
        return () => clearTimeout(timer);
      }
    }
    
    // 👇 初始化读取名字
    const storedName = localStorage.getItem(USER_NAME_KEY);
    if (storedName) setUserName(storedName);

    posthog.capture('page_view', { lang: lang });
  }, []);

  const confirmLanguage = (selectedLang: LangType) => {
    setLang(selectedLang);
    localStorage.setItem(LANGUAGE_KEY, 'true');
    setShowLangSetup(false);
    posthog.capture('language_set', { language: selectedLang });
    const hasSeenUpdate = localStorage.getItem(CURRENT_VERSION_KEY);
    if (!hasSeenUpdate) { setTimeout(() => setShowUpdateModal(true), 500); }
  };

  // 👇 保存昵称
  const saveUserName = () => {
    const nameToSave = tempName.trim();
    setUserName(nameToSave);
    localStorage.setItem(USER_NAME_KEY, nameToSave);
    setShowNameModal(false);
    posthog.capture('username_set');
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

  useEffect(() => {
    if (messages.length > 0 && view === 'chat') {
      saveMemory(activePersona, messages);
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

  const selectPersona = (persona: PersonaType) => {
    posthog.capture('persona_select', { persona: persona });
    setActivePersona(persona);
    setView('chat');
    const history = getMemory(persona);
    if (history.length === 0) {
      const p = PERSONAS[persona];
      const greetings = p.greetings[lang];
      const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
      const welcomeMsg: Message = { id: Date.now().toString(), role: 'assistant', content: randomGreeting };
      setMessages([welcomeMsg]);
      saveMemory(persona, [welcomeMsg]);
    } else {
      setMessages(history);
    }
  };

  const handleReset = () => {
    if (confirm(ui.resetConfirm)) {
      posthog.capture('chat_reset', { persona: activePersona });
      setMessages([]);
      saveMemory(activePersona, []);
      setShowMenu(false);
      setInteractionCount(0);
      localStorage.setItem(getTrustKey(activePersona), '0');
      const p = PERSONAS[activePersona];
      const greetings = p.greetings[lang];
      const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
      setTimeout(() => {
        const welcomeMsg: Message = { id: Date.now().toString(), role: 'assistant', content: randomGreeting };
        setMessages([welcomeMsg]);
        saveMemory(activePersona, [welcomeMsg]);
      }, 100);
    }
  };

  const backToSelection = () => setView('selection');
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
  const handleDonate = () => { posthog.capture('feature_donate_click'); window.open('https://www.buymeacoffee.com', '_blank'); setShowMenu(false); }
  // 👇 打开修改昵称弹窗
  const handleEditName = () => { 
    setTempName(userName);
    setShowNameModal(true); 
    setShowMenu(false); 
  }

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
    // 🔥 传入 userName
    handleSubmit(e, { options: { body: { persona: activePersona, language: lang, interactionCount, userName } } });
  };

  const getLevelInfo = (count: number) => {
    if (count < 50) {
      return { level: 1, label: lang === 'zh' ? '陌生人' : 'Stranger', max: 50, icon: <Shield size={12} />, bgClass: 'bg-[#0a0a0a]', borderClass: 'border-white/5', barColor: 'bg-gray-500', glowClass: '' };
    }
    if (count < 100) {
      return { level: 2, label: lang === 'zh' ? '熟人' : 'Acquaintance', max: 100, icon: <Zap size={12} />, bgClass: 'bg-gradient-to-b from-[#0f172a] to-[#0a0a0a]', borderClass: 'border-blue-500/30', barColor: 'bg-blue-500', glowClass: 'shadow-[0_0_30px_rgba(59,130,246,0.1)]' };
    }
    return { level: 3, label: lang === 'zh' ? '共犯' : 'Partner', max: 100, icon: <Heart size={12} />, bgClass: 'bg-[url("/grid.svg")] bg-fixed bg-[length:50px_50px] bg-[#0a0a0a]', customStyle: { background: 'radial-gradient(circle at 50% -20%, #1e1b4b 0%, #0a0a0a 60%)' }, borderClass: 'border-[#7F5CFF]/40', barColor: 'bg-[#7F5CFF]', glowClass: 'shadow-[0_0_40px_rgba(127,92,255,0.15)]' };
  };

  const currentP = PERSONAS[activePersona];
  const levelInfo = getLevelInfo(interactionCount);
  const progressPercent = Math.min(100, (interactionCount / levelInfo.max) * 100);

  return (
    <div className="relative flex flex-col h-screen bg-[#050505] text-gray-100 overflow-hidden font-sans selection:bg-[#7F5CFF] selection:text-white">
      <div className="absolute top-[-20%] left-0 right-0 h-[500px] bg-gradient-to-b from-[#7F5CFF]/10 to-transparent blur-[100px] pointer-events-none" />

      {/* 语言选择 */}
      {showLangSetup && (
        <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 animate-[fadeIn_0.5s_ease-out]">
          <div className="mb-10 text-center">
            <div className="w-20 h-20 bg-[#1a1a1a] rounded-full flex items-center justify-center text-4xl border border-white/10 mx-auto mb-4 shadow-[0_0_30px_rgba(127,92,255,0.3)]">🧬</div>
            <h1 className="text-2xl font-bold text-white tracking-wider mb-2">TOUGHLOVE AI</h1>
            <p className="text-gray-500 text-sm">Choose your language / 选择语言</p>
          </div>
          <div className="flex flex-col gap-4 w-full max-w-xs">
            <button onClick={() => confirmLanguage('zh')} className={`p-6 rounded-2xl border transition-all flex items-center justify-between group ${lang === 'zh' ? 'bg-white/10 border-[#7F5CFF]' : 'bg-[#111] border-white/10 hover:border-white/30'}`}>
              <div className="text-left"><div className="text-lg font-bold text-white">中文</div><div className="text-xs text-gray-500">Chinese</div></div>{lang === 'zh' && <div className="w-3 h-3 bg-[#7F5CFF] rounded-full shadow-[0_0_10px_#7F5CFF]"></div>}
            </button>
            <button onClick={() => confirmLanguage('en')} className={`p-6 rounded-2xl border transition-all flex items-center justify-between group ${lang === 'en' ? 'bg-white/10 border-[#7F5CFF]' : 'bg-[#111] border-white/10 hover:border-white/30'}`}>
              <div className="text-left"><div className="text-lg font-bold text-white">English</div><div className="text-xs text-gray-500">English</div></div>{lang === 'en' && <div className="w-3 h-3 bg-[#7F5CFF] rounded-full shadow-[0_0_10px_#7F5CFF]"></div>}
            </button>
          </div>
        </div>
      )}

      {/* 👇 新增：昵称设置弹窗 */}
      {showNameModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-sm p-6 animate-[fadeIn_0.2s_ease-out]">
          <div className="w-full max-w-xs bg-[#1a1a1a] rounded-3xl border border-white/10 shadow-2xl p-6">
            <div className="text-center mb-6">
              <div className="inline-flex p-3 bg-white/5 rounded-full mb-3 text-[#7F5CFF]"><UserPen size={24}/></div>
              <h3 className="text-lg font-bold text-white">{ui.editName}</h3>
            </div>
            <input 
              type="text" 
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              placeholder={ui.namePlaceholder}
              className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#7F5CFF] outline-none mb-6 text-center"
              maxLength={10}
            />
            <div className="flex gap-3">
              <button onClick={() => setShowNameModal(false)} className="flex-1 py-3 rounded-xl bg-white/5 text-gray-400 text-sm hover:bg-white/10 transition-colors">Cancel</button>
              <button onClick={saveUserName} className="flex-1 py-3 rounded-xl bg-[#7F5CFF] text-white font-bold text-sm hover:bg-[#6b4bd6] transition-colors">{ui.nameSave}</button>
            </div>
          </div>
        </div>
      )}

      {view === 'selection' && (
        <div className="z-10 flex flex-col h-full w-full max-w-4xl mx-auto p-6 animate-[fadeIn_0.5s_ease-out]">
          <div className="flex justify-between items-center mb-8">
             <h1 className="text-2xl font-bold tracking-wider">{ui.selectPersona}</h1>
             <button onClick={toggleLanguage} className="p-2 text-gray-400 hover:text-white flex items-center gap-1"><Languages size={18} /> <span className="text-xs font-bold uppercase">{lang}</span></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto pb-10">
            {(Object.keys(PERSONAS) as PersonaType[]).map((key) => {
              const p = PERSONAS[key];
              return (
                <div key={key} onClick={() => selectPersona(key)} className="group relative bg-[#111] border border-white/10 hover:border-[#7F5CFF]/50 rounded-3xl p-6 cursor-pointer transition-all duration-300 hover:shadow-[0_0_30px_rgba(127,92,255,0.15)] flex flex-col items-center text-center">
                  <div className={`w-16 h-16 rounded-full bg-gradient-to-b from-[#222] to-[#111] flex items-center justify-center text-3xl mb-4 border border-white/5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>{p.avatar}<div className={`absolute w-full h-full rounded-full blur-xl opacity-0 group-hover:opacity-40 transition-opacity duration-300 ${p.color.replace('text-', 'bg-')}`}></div></div>
                  <h3 className="text-xl font-bold text-white mb-1">{p.name}</h3><p className={`text-sm font-medium mb-4 ${p.color}`}>{p.title[lang]}</p><p className="text-gray-400 text-sm italic mb-6 min-h-[3rem] font-serif opacity-80">{p.slogan[lang]}</p>
                  <div className="flex flex-wrap justify-center gap-2 mb-6">{p.tags[lang].map((tag, i) => (<span key={i} className="text-[10px] px-2 py-1 rounded-md bg-white/5 text-gray-400 border border-white/5">● {tag}</span>))}</div>
                  <button className="w-full py-3 rounded-xl bg-[#7F5CFF]/10 text-[#7F5CFF] font-bold text-sm group-hover:bg-[#7F5CFF] group-hover:text-white transition-colors">{ui.selectBtn}</button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {view === 'chat' && (
        <div className={`z-10 flex flex-col h-full w-full max-w-lg mx-auto backdrop-blur-sm border-x shadow-2xl relative animate-[slideUp_0.3s_ease-out] ${levelInfo.bgClass} ${levelInfo.borderClass} ${levelInfo.glowClass} transition-all duration-1000`} style={levelInfo.customStyle}>
          <header className="flex-none flex items-center justify-between px-6 py-3 bg-[#0a0a0a]/60 backdrop-blur-md sticky top-0 z-20 border-b border-white/5 relative">
            <button onClick={backToSelection} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group">
              <div className="p-2 bg-white/5 rounded-full group-hover:bg-[#7F5CFF] transition-colors"><Users size={16} className="group-hover:text-white" /></div>
            </button>
            <div className="flex flex-col items-center cursor-pointer group" onClick={handleExport} title={ui.export}>
              <h1 className="font-bold text-sm tracking-wider text-white flex items-center gap-2">{currentP.avatar} {currentP.name}<span className={`text-[9px] px-1.5 py-0.5 rounded bg-white/10 border border-white/10 ${levelInfo.barColor.replace('bg-', 'text-')} flex items-center gap-1`}>{levelInfo.icon} Lv.{levelInfo.level}</span></h1>
              <p className={`text-[10px] font-medium opacity-70 tracking-wide ${currentP.color} group-hover:underline`}>{currentP.title[lang]}</p>
            </div>
            <div className="flex items-center gap-2 relative">
              <button onClick={fetchDailyQuote} className="p-2 text-gray-400 hover:text-[#7F5CFF] relative"><Calendar size={20} /><span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span></button>
              <button onClick={() => setShowMenu(!showMenu)} className="p-2 text-gray-400 hover:text-white relative"><MoreVertical size={20} /><span className="absolute top-1 right-1 w-2 h-2 bg-[#7F5CFF] rounded-full"></span></button>
              
              {/* Menu */}
              {showMenu && (<><div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)}></div><div className="absolute top-12 right-0 mt-2 w-48 bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden animate-[fadeIn_0.2s_ease-out] flex flex-col p-1">
                {/* 👇 新增：修改昵称按钮 */}
                <button onClick={handleEditName} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors w-full text-left">
                  <UserPen size={16} className="text-[#7F5CFF]" /> {userName || ui.editName}
                </button>
                
                <button onClick={handleInstall} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors w-full text-left"><Download size={16} /> {ui.install}</button>
                <button onClick={handleExport} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors w-full text-left"><FileText size={16} /> {ui.export}</button>
                <button onClick={toggleLanguage} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors w-full text-left"><Languages size={16} /> {ui.language}</button>
                <button onClick={handleDonate} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:text-yellow-400 hover:bg-white/5 rounded-xl transition-colors w-full text-left"><Coffee size={16} /> Buy me a coffee</button>
                <div className="h-[1px] bg-white/5 my-1 mx-2"></div>
                <button onClick={handleReset} className="flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors w-full text-left"><RotateCcw size={16} /> {ui.reset}</button></div></>)}
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
                      msg.content.split('|||').map((part, partIdx, arr) => {
                        if (!part.trim()) return null;
                        const isLastPart = partIdx === arr.length - 1;
                        const shouldType = isLastMessage && isLoading && isLastPart;
                        return (<div key={partIdx} className="px-5 py-3.5 text-sm leading-6 shadow-md backdrop-blur-sm bg-[#1a1a1a]/90 text-gray-200 rounded-2xl rounded-tl-sm border border-white/5 animate-[slideUp_0.2s_ease-out]"><Typewriter content={part.trim()} isThinking={shouldType} /></div>);
                      })
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
          
          {showQuote && (<div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6 animate-[fadeIn_0.2s_ease-out]"><div className="w-full max-w-xs relative"><button onClick={() => setShowQuote(false)} className="absolute -top-10 right-0 p-2 text-white/50 hover:text-white"><X size={24} /></button><div ref={quoteCardRef} className="bg-[#111] rounded-3xl border border-white/10 shadow-2xl overflow-hidden relative animate-[slideUp_0.4s_cubic-bezier(0.16,1,0.3,1)]"><div className={`absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-${currentP.color.split('-')[1]}-500 to-transparent opacity-50`}></div><div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div><div className="p-8 flex flex-col items-center text-center space-y-6"><div className="text-xs font-black text-[#7F5CFF] tracking-[0.2em] uppercase flex items-center gap-2"><Sparkles size={12}/> {ui.dailyToxic}</div>{isQuoteLoading ? (<div className="py-10 space-y-4"><div className="w-12 h-12 border-2 border-[#7F5CFF] border-t-transparent rounded-full animate-spin mx-auto"/><p className="text-gray-500 text-xs animate-pulse">{ui.makingPoison}</p></div>) : (<><div className="relative"><div className="text-5xl my-4 grayscale contrast-125">{currentP.avatar}</div></div><p className="text-xl font-bold leading-relaxed text-gray-100 font-serif min-h-[80px] flex items-center justify-center">“{quoteData?.content}”</p><div className="w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div><div className="flex flex-col items-center gap-1"><div className={`text-xs font-bold ${currentP.color} uppercase tracking-widest`}>{currentP.name}</div><div className="text-[10px] text-gray-600">ToughLove AI · {new Date().toLocaleDateString()}</div></div></>)}</div></div>{!isQuoteLoading && (<div className="mt-4 flex gap-3"><button onClick={downloadQuoteCard} disabled={isGeneratingImg} className="flex-1 py-3 rounded-xl bg-[#7F5CFF] text-white font-bold text-sm shadow-lg shadow-purple-900/20 flex items-center justify-center gap-2 active:scale-95 transition-transform">{isGeneratingImg ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <ImageIcon size={16} />}{isGeneratingImg ? "生成中..." : "保存海报"}</button></div>)}</div></div>)}
          {showInstallModal && (<div className="absolute inset-0 z-50 flex items-end sm:items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease-out]"><div className="absolute inset-0" onClick={() => setShowInstallModal(false)} /><div className="w-full max-w-sm bg-[#1a1a1a] rounded-t-3xl sm:rounded-3xl border border-white/10 shadow-2xl overflow-hidden relative z-10 animate-[slideUp_0.3s_ease-out]"><button onClick={() => setShowInstallModal(false)} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white"><X size={20} /></button><div className="p-6 space-y-6"><div className="flex items-center gap-4"><div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#7F5CFF] to-black flex items-center justify-center text-2xl border border-white/10">🥀</div><div><h3 className="text-lg font-bold text-white">安装“毒伴”</h3><p className="text-xs text-gray-400">像 App 一样常驻你的桌面</p></div></div><div className="space-y-4 text-sm text-gray-300"><div className="bg-white/5 p-4 rounded-xl border border-white/5"><p className="font-bold text-[#7F5CFF] mb-2">iOS</p><ol className="list-decimal list-inside space-y-2 opacity-80"><li>点击底部的 <span className="inline-block align-middle"><Share2 size={14}/></span> <strong>分享</strong></li><li>选择 <strong>添加到主屏幕</strong></li></ol></div></div></div></div></div>)}
          {showUpdateModal && (<div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-6 animate-[fadeIn_0.3s_ease-out]"><div className="w-full max-w-sm bg-gradient-to-br from-[#111] to-[#0a0a0a] rounded-3xl border border-indigo-500/30 shadow-[0_0_50px_rgba(99,102,241,0.15)] overflow-hidden relative animate-[scaleIn_0.3s_cubic-bezier(0.16,1,0.3,1)]"><button onClick={dismissUpdate} className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white z-10 transition-colors"><X size={20} /></button><div className="p-8 flex flex-col items-center text-center relative"><div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-indigo-900/20 to-transparent pointer-events-none"></div><div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase tracking-wider mb-6"><Sparkles size={12} /> {ui.updateTitle}</div><div className="relative w-20 h-20 mb-6"><div className="w-full h-full rounded-full bg-[#151515] flex items-center justify-center text-5xl border border-white/10 shadow-xl relative z-10">👁️</div><div className="absolute inset-0 bg-indigo-500 blur-xl opacity-30 animate-pulse"></div></div><h3 className="text-xl font-bold text-white mb-3">{ui.updateDesc}</h3><p className="text-sm text-gray-400 leading-relaxed whitespace-pre-line">{ui.updateContent}</p></div><div className="p-6 pt-0"><button onClick={handleTryNewFeature} className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all shadow-lg shadow-indigo-900/20 flex items-center justify-center gap-2 group">{ui.tryNow}<span className="group-hover:translate-x-1 transition-transform">→</span></button></div></div></div>)}
        </div>
      )}
    </div>
  );
}