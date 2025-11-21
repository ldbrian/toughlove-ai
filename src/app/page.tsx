'use client';

import { useState, useRef, useEffect } from 'react';
import { useChat } from 'ai/react'; // 3.4.33 版本绝对支持这个导入
import { PERSONAS, PersonaType, UI_TEXT, LangType } from '@/lib/constants';
import { getDeviceId } from '@/lib/utils';
import { Send, Calendar, X, Share2, Languages, Download, Users } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

type DailyQuote = { content: string; date: string; persona: string; };
type ViewState = 'selection' | 'chat';

export default function Home() {
  const [view, setView] = useState<ViewState>('selection');
  const [activePersona, setActivePersona] = useState<PersonaType>('Ash');
  const [lang, setLang] = useState<LangType>('zh');
  
  const [showQuote, setShowQuote] = useState(false);
  const [quoteData, setQuoteData] = useState<DailyQuote | null>(null);
  const [isQuoteLoading, setIsQuoteLoading] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const ui = UI_TEXT[lang];

  // 1. 初始化 useChat
  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages, setInput } = useChat({
    api: '/api/chat',
    onError: (err) => console.error("Stream Error:", err)
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => { scrollToBottom(); }, [messages, isLoading, view]);

  const toggleLanguage = () => {
    setLang(prev => prev === 'zh' ? 'en' : 'zh');
  };

  const selectPersona = (persona: PersonaType) => {
    if (persona !== activePersona) {
      setMessages([]); 
    }
    setActivePersona(persona);
    setView('chat');
  };

  const backToSelection = () => {
    setView('selection');
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

  // 2. 自定义提交逻辑 (适配 3.x 动态传参)
  const onFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 在这里把当前的人格和语言传给后端
    handleSubmit(e, {
      options: {
        body: {
          persona: activePersona,
          language: lang
        }
      }
    });
  };

  const currentP = PERSONAS[activePersona];

  return (
    <div className="relative flex flex-col h-screen bg-[#050505] text-gray-100 overflow-hidden font-sans selection:bg-[#7F5CFF] selection:text-white">
      <div className="absolute top-[-20%] left-0 right-0 h-[500px] bg-gradient-to-b from-[#7F5CFF]/10 to-transparent blur-[100px] pointer-events-none" />

      {/* Selection View */}
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

      {/* Chat View */}
      {view === 'chat' && (
        <div className="z-10 flex flex-col h-full w-full max-w-lg mx-auto bg-[#0a0a0a]/80 backdrop-blur-sm border-x border-white/5 shadow-2xl relative animate-[slideUp_0.3s_ease-out]">
          <header className="flex-none flex items-center justify-between px-6 py-4 bg-[#0a0a0a]/60 backdrop-blur-md sticky top-0 z-20 border-b border-white/5">
            <button onClick={backToSelection} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"><div className="p-2 bg-white/5 rounded-full group-hover:bg-[#7F5CFF] transition-colors"><Users size={16} className="group-hover:text-white" /></div></button>
            <div className="flex flex-col items-center"><h1 className="font-bold text-sm tracking-wider text-white flex items-center gap-2">{currentP.avatar} {currentP.name}</h1><p className={`text-[10px] font-medium opacity-70 tracking-wide ${currentP.color}`}>{currentP.title[lang]}</p></div>
            <div className="flex items-center gap-2"><button onClick={toggleLanguage} className="p-2 text-gray-400 hover:text-white"><Languages size={18} /></button><button onClick={() => setShowInstallModal(true)} className="p-2 text-gray-400 hover:text-white"><Download size={18} /></button><button onClick={fetchDailyQuote} className="p-2 text-gray-400 hover:text-[#7F5CFF] relative"><Calendar size={20} /><span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span></button></div>
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
            {/* 3. 这里改成 onFormSubmit */}
            <form onSubmit={onFormSubmit} className="relative flex items-center gap-2 bg-[#151515] p-2 rounded-[24px] border border-white/10 shadow-2xl focus-within:border-[#7F5CFF]/50 transition-all duration-300">
              <input type="text" value={input} onChange={handleInputChange} placeholder={ui.placeholder} className="flex-1 bg-transparent text-white text-sm px-4 py-2 focus:outline-none placeholder-gray-600" />
              <button type="submit" disabled={!input.trim() || isLoading} className="p-3 bg-[#7F5CFF] text-white rounded-full hover:bg-[#6b4bd6] disabled:opacity-30 transition-all transform active:scale-95"><Send size={18} fill="white" /></button>
            </form>
          </footer>
          
          {/* Modals (保持不变) */}
          {showQuote && (<div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6 animate-[fadeIn_0.2s_ease-out]"><div className="w-full max-w-xs bg-[#1a1a1a] rounded-3xl border border-white/10 shadow-2xl overflow-hidden relative animate-[slideUp_0.4s_cubic-bezier(0.16,1,0.3,1)]"><button onClick={() => setShowQuote(false)} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white z-10"><X size={20} /></button><div className="p-8 flex flex-col items-center text-center space-y-6"><div className="text-sm font-bold text-[#7F5CFF] tracking-widest uppercase">{ui.dailyToxic}</div>{isQuoteLoading ? (<div className="py-10 space-y-4"><div className="w-12 h-12 border-2 border-[#7F5CFF] border-t-transparent rounded-full animate-spin mx-auto"/><p className="text-gray-500 text-xs animate-pulse">{ui.makingPoison}</p></div>) : (<><div className="text-4xl my-4">{currentP.avatar}</div><p className="text-xl font-medium leading-relaxed text-gray-200 font-serif">{quoteData?.content}</p><div className="w-8 h-1 bg-[#7F5CFF] rounded-full opacity-50"></div><div className="text-xs text-gray-500">{currentP.name} · {new Date().toLocaleDateString()}</div></>)}</div><div className="bg-[#111] p-4 border-t border-white/5 flex justify-center"><button className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors"><Share2 size={14} /> {ui.save}</button></div></div></div>)}
          {showInstallModal && (<div className="absolute inset-0 z-50 flex items-end sm:items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease-out]"><div className="absolute inset-0" onClick={() => setShowInstallModal(false)} /><div className="w-full max-w-sm bg-[#1a1a1a] rounded-t-3xl sm:rounded-3xl border border-white/10 shadow-2xl overflow-hidden relative z-10 animate-[slideUp_0.3s_ease-out]"><button onClick={() => setShowInstallModal(false)} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white"><X size={20} /></button><div className="p-6 space-y-6"><div className="flex items-center gap-4"><div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#7F5CFF] to-black flex items-center justify-center text-2xl border border-white/10">🥀</div><div><h3 className="text-lg font-bold text-white">安装“毒伴”</h3><p className="text-xs text-gray-400">像 App 一样常驻你的桌面</p></div></div><div className="space-y-4 text-sm text-gray-300"><div className="bg-white/5 p-4 rounded-xl border border-white/5"><p className="font-bold text-[#7F5CFF] mb-2">iOS</p><ol className="list-decimal list-inside space-y-2 opacity-80"><li>点击底部的 <span className="inline-block align-middle"><Share2 size={14}/></span> <strong>分享</strong></li><li>选择 <strong>添加到主屏幕</strong></li></ol></div></div></div></div></div>)}
        </div>
      )}
    </div>
  );
}