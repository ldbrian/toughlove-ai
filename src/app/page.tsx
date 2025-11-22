'use client';

import { useState, useRef, useEffect } from 'react';
import { useChat } from 'ai/react';
import { PERSONAS, PersonaType, UI_TEXT, LangType } from '@/lib/constants';
import { getDeviceId } from '@/lib/utils';
import { getMemory, saveMemory } from '@/lib/storage'; // 👈 引入刚才写的工具
import { Send, Calendar, X, Share2, Languages, Download, Users, Sparkles, ImageIcon, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import html2canvas from 'html2canvas';

type DailyQuote = { content: string; date: string; persona: string; };
type ViewState = 'selection' | 'chat';

const CURRENT_VERSION_KEY = 'toughlove_update_v1.2_echo';

export default function Home() {
  const [view, setView] = useState<ViewState>('selection');
  // 默认人格改为 null 或者从缓存读取上次选的，这里为了简单还是默认 Ash
  const [activePersona, setActivePersona] = useState<PersonaType>('Ash');
  const [lang, setLang] = useState<LangType>('zh');
  
  const [showQuote, setShowQuote] = useState(false);
  const [quoteData, setQuoteData] = useState<DailyQuote | null>(null);
  const [isQuoteLoading, setIsQuoteLoading] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [isGeneratingImg, setIsGeneratingImg] = useState(false);
  const quoteCardRef = useRef<HTMLDivElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const ui = UI_TEXT[lang];

  // 🔥 核心升级：useChat 配置
  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages, setInput } = useChat({
    api: '/api/chat',
    // 1. 初始数据：虽然这里可以传 initialMessages，但因为我们要在切换人格时动态加载，所以主要靠 setMessages
    onError: (err) => console.error("Stream Error:", err),
    // 2. 自动保存：每次 AI 回复完，把最新的 messages 列表存到当前人格的格子里
    onFinish: (message, options) => {
      // 注意：onFinish 里的 message 参数只是最后这一条，我们需要存完整的 messages
      // 但此时 state 里的 messages 可能还没更新完，所以最稳妥的是在 useEffect 里存
      // 不过 useChat 没有直接提供 "allMessages" 在 onFinish 里，
      // 所以我们改用 useEffect 监听 [messages] 变化来存，更稳。
    }
  });

  // 🔥 监听消息变化 -> 自动保存
  useEffect(() => {
    // 只有当有消息，且不在加载状态(避免流式输出时频繁写入)，或者流式输出结束时存
    // 为了简单稳妥：只要 messages 变了且不是空的，就存一下
    if (messages.length > 0 && view === 'chat') {
      saveMemory(activePersona, messages);
    }
  }, [messages, activePersona, view]);

  // 🔥 切换人格时 -> 读取记忆
  // 我们把这个逻辑放在 selectPersona 里，或者用 useEffect 监听 activePersona
  // 推荐放在 useEffect，这样逻辑更收敛
  useEffect(() => {
    // 当进入聊天页面时，读取记忆
    if (view === 'chat') {
      const history = getMemory(activePersona);
      setMessages(history); // 恢复历史
    }
  }, [activePersona, view, setMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const hasSeenUpdate = localStorage.getItem(CURRENT_VERSION_KEY);
    if (!hasSeenUpdate) {
      const timer = setTimeout(() => setShowUpdateModal(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const dismissUpdate = () => {
    localStorage.setItem(CURRENT_VERSION_KEY, 'true');
    setShowUpdateModal(false);
  };

  const handleTryNewFeature = () => {
    dismissUpdate();
    selectPersona('Echo');
  };

  useEffect(() => { scrollToBottom(); }, [messages, isLoading, view]);

  const toggleLanguage = () => {
    setLang(prev => prev === 'zh' ? 'en' : 'zh');
  };

  const selectPersona = (persona: PersonaType) => {
    setActivePersona(persona);
    // 注意：这里不需要手动 setMessages([])，因为上面的 useEffect 会在 activePersona 变了之后，
    // 自动去 localStorage 读这个人的历史。如果是空的，它自然就是空的。
    setView('chat');
  };

  const backToSelection = () => setView('selection');

  // 👇 新增：清空当前对话功能 (有些用户想重开)
  const clearCurrentChat = () => {
    if (confirm(lang === 'zh' ? '确定要清除和他的记忆吗？' : 'Clear memory with this persona?')) {
      setMessages([]); // 清空界面
      saveMemory(activePersona, []); // 清空缓存
    }
  };

  const fetchDailyQuote = async () => {
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
    if (!quoteCardRef.current) return;
    setIsGeneratingImg(true);
    try {
      const canvas = await html2canvas(quoteCardRef.current, {
        backgroundColor: '#111111',
        scale: 3,
        useCORS: true,
      }as any);
      const image = canvas.toDataURL("image/png");
      const link = document.createElement('a');
      link.href = image;
      link.download = `ToughLove_${activePersona}_${new Date().toISOString().split('T')[0]}.png`;
      link.click();
    } catch (err) {
      alert("保存失败");
    } finally {
      setIsGeneratingImg(false);
    }
  };

  const onFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmit(e, { options: { body: { persona: activePersona, language: lang } } });
  };

  const currentP = PERSONAS[activePersona];

  return (
    <div className="relative flex flex-col h-screen bg-[#050505] text-gray-100 overflow-hidden font-sans selection:bg-[#7F5CFF] selection:text-white">
      <div className="absolute top-[-20%] left-0 right-0 h-[500px] bg-gradient-to-b from-[#7F5CFF]/10 to-transparent blur-[100px] pointer-events-none" />

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
        <div className="z-10 flex flex-col h-full w-full max-w-lg mx-auto bg-[#0a0a0a]/80 backdrop-blur-sm border-x border-white/5 shadow-2xl relative animate-[slideUp_0.3s_ease-out]">
          <header className="flex-none flex items-center justify-between px-6 py-4 bg-[#0a0a0a]/60 backdrop-blur-md sticky top-0 z-20 border-b border-white/5">
            <button onClick={backToSelection} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"><div className="p-2 bg-white/5 rounded-full group-hover:bg-[#7F5CFF] transition-colors"><Users size={16} className="group-hover:text-white" /></div></button>
            <div className="flex flex-col items-center"><h1 className="font-bold text-sm tracking-wider text-white flex items-center gap-2">{currentP.avatar} {currentP.name}</h1><p className={`text-[10px] font-medium opacity-70 tracking-wide ${currentP.color}`}>{currentP.title[lang]}</p></div>
            <div className="flex items-center gap-2">
              {/* 👇 新增：清除记忆按钮 */}
              <button onClick={clearCurrentChat} className="p-2 text-gray-500 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
              <button onClick={fetchDailyQuote} className="p-2 text-gray-400 hover:text-[#7F5CFF] relative"><Calendar size={20} /><span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span></button>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto px-4 py-6 space-y-6 scroll-smooth">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-60"><div className={`w-20 h-20 rounded-full bg-gradient-to-b from-white/5 to-transparent flex items-center justify-center text-4xl mb-2 border border-white/5 shadow-[0_0_30px_rgba(0,0,0,0.5)] animate-pulse`}>{currentP.avatar}</div><div className="space-y-2 px-8"><p className="text-white/80 text-lg font-light">{lang === 'zh' ? '我是' : 'I am'} <span className={currentP.color}>{currentP.name}</span>.</p><p className="text-sm text-gray-400 italic font-serif">{currentP.slogan[lang]}</p></div></div>
            )}
            {messages.map((msg) => (
              <div key={msg.id} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-[slideUp_0.1s_ease-out]`}><div className={`max-w-[85%] px-5 py-3.5 text-sm leading-6 shadow-md backdrop-blur-sm ${msg.role === 'user' ? 'bg-gradient-to-br from-[#7F5CFF] to-[#6242db] text-white rounded-2xl rounded-tr-sm' : 'bg-[#1a1a1a]/90 text-gray-200 rounded-2xl rounded-tl-sm border border-white/5'}`}><div className="markdown"><ReactMarkdown>{msg.content}</ReactMarkdown></div></div></div>
            ))}
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
          
          {/* Modals */}
          {showQuote && (<div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6 animate-[fadeIn_0.2s_ease-out]"><div className="w-full max-w-xs relative"><button onClick={() => setShowQuote(false)} className="absolute -top-10 right-0 p-2 text-white/50 hover:text-white"><X size={24} /></button><div ref={quoteCardRef} className="bg-[#111] rounded-3xl border border-white/10 shadow-2xl overflow-hidden relative animate-[slideUp_0.4s_cubic-bezier(0.16,1,0.3,1)]"><div className={`absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-${currentP.color.split('-')[1]}-500 to-transparent opacity-50`}></div><div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div><div className="p-8 flex flex-col items-center text-center space-y-6"><div className="text-xs font-black text-[#7F5CFF] tracking-[0.2em] uppercase flex items-center gap-2"><Sparkles size={12}/> {ui.dailyToxic}</div>{isQuoteLoading ? (<div className="py-10 space-y-4"><div className="w-12 h-12 border-2 border-[#7F5CFF] border-t-transparent rounded-full animate-spin mx-auto"/><p className="text-gray-500 text-xs animate-pulse">{ui.makingPoison}</p></div>) : (<><div className="relative"><div className="text-5xl my-4 grayscale contrast-125">{currentP.avatar}</div></div><p className="text-xl font-bold leading-relaxed text-gray-100 font-serif min-h-[80px] flex items-center justify-center">“{quoteData?.content}”</p><div className="w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div><div className="flex flex-col items-center gap-1"><div className={`text-xs font-bold ${currentP.color} uppercase tracking-widest`}>{currentP.name}</div><div className="text-[10px] text-gray-600">ToughLove AI · {new Date().toLocaleDateString()}</div></div></>)}</div></div>{!isQuoteLoading && (<div className="mt-4 flex gap-3"><button onClick={downloadQuoteCard} disabled={isGeneratingImg} className="flex-1 py-3 rounded-xl bg-[#7F5CFF] text-white font-bold text-sm shadow-lg shadow-purple-900/20 flex items-center justify-center gap-2 active:scale-95 transition-transform">{isGeneratingImg ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <ImageIcon size={16} />}{isGeneratingImg ? "生成中..." : "保存海报"}</button></div>)}</div></div>)}
          
          {showInstallModal && (<div className="absolute inset-0 z-50 flex items-end sm:items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease-out]"><div className="absolute inset-0" onClick={() => setShowInstallModal(false)} /><div className="w-full max-w-sm bg-[#1a1a1a] rounded-t-3xl sm:rounded-3xl border border-white/10 shadow-2xl overflow-hidden relative z-10 animate-[slideUp_0.3s_ease-out]"><button onClick={() => setShowInstallModal(false)} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white"><X size={20} /></button><div className="p-6 space-y-6"><div className="flex items-center gap-4"><div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#7F5CFF] to-black flex items-center justify-center text-2xl border border-white/10">🥀</div><div><h3 className="text-lg font-bold text-white">安装“毒伴”</h3><p className="text-xs text-gray-400">像 App 一样常驻你的桌面</p></div></div><div className="space-y-4 text-sm text-gray-300"><div className="bg-white/5 p-4 rounded-xl border border-white/5"><p className="font-bold text-[#7F5CFF] mb-2">iOS</p><ol className="list-decimal list-inside space-y-2 opacity-80"><li>点击底部的 <span className="inline-block align-middle"><Share2 size={14}/></span> <strong>分享</strong></li><li>选择 <strong>添加到主屏幕</strong></li></ol></div></div></div></div></div>)}
          
          {showUpdateModal && (<div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-6 animate-[fadeIn_0.3s_ease-out]"><div className="w-full max-w-sm bg-gradient-to-br from-[#111] to-[#0a0a0a] rounded-3xl border border-indigo-500/30 shadow-[0_0_50px_rgba(99,102,241,0.15)] overflow-hidden relative animate-[scaleIn_0.3s_cubic-bezier(0.16,1,0.3,1)]"><button onClick={dismissUpdate} className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white z-10 transition-colors"><X size={20} /></button><div className="p-8 flex flex-col items-center text-center relative"><div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-indigo-900/20 to-transparent pointer-events-none"></div><div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase tracking-wider mb-6"><Sparkles size={12} /> {ui.updateTitle}</div><div className="relative w-20 h-20 mb-6"><div className="w-full h-full rounded-full bg-[#151515] flex items-center justify-center text-5xl border border-white/10 shadow-xl relative z-10">👁️</div><div className="absolute inset-0 bg-indigo-500 blur-xl opacity-30 animate-pulse"></div></div><h3 className="text-xl font-bold text-white mb-3">{ui.updateDesc}</h3><p className="text-sm text-gray-400 leading-relaxed">{ui.updateContent}</p></div><div className="p-6 pt-0"><button onClick={handleTryNewFeature} className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all shadow-lg shadow-indigo-900/20 flex items-center justify-center gap-2 group">{ui.tryNow}<span className="group-hover:translate-x-1 transition-transform">→</span></button></div></div></div>)}
        </div>
      )}
    </div>
  );
}
