'use client';

import { useState, useRef, useEffect } from 'react';
import { PERSONAS, PersonaType, UI_TEXT, LangType } from '@/lib/constants';
import { getDeviceId } from '@/lib/utils';
import { Send, Calendar, X, Share2, Languages } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

type Message = { role: 'user' | 'assistant'; content: string; };
type DailyQuote = { content: string; date: string; persona: string; };

export default function Home() {
  const [activePersona, setActivePersona] = useState<PersonaType>('Ash');
  const [lang, setLang] = useState<LangType>('zh'); // 👈 新增语言状态
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const [showQuote, setShowQuote] = useState(false);
  const [quoteData, setQuoteData] = useState<DailyQuote | null>(null);
  const [isQuoteLoading, setIsQuoteLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const ui = UI_TEXT[lang]; // 👈 当前语言的 UI 文本

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => { scrollToBottom(); }, [messages, isLoading]);

  const handlePersonaChange = (persona: PersonaType) => {
    if (persona !== activePersona) {
      setActivePersona(persona);
      setMessages([]); 
    }
  };

  // 切换语言
  const toggleLanguage = () => {
    const newLang = lang === 'zh' ? 'en' : 'zh';
    setLang(newLang);
    setMessages([]); // 切换语言时清空历史，避免对话错乱
  };

  const fetchDailyQuote = async () => {
    setShowQuote(true);
    // 切换语言后允许重新获取（MVP简化逻辑：如果不重置 quoteData，切换语言后还是会显示旧语言的缓存）
    // 为了演示效果，我们这里每次都请求，API 层做缓存
    setIsQuoteLoading(true);
    try {
      const res = await fetch('/api/daily', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          persona: activePersona,
          userId: getDeviceId(),
          language: lang // 👈 传过去
        }),
      });
      const data = await res.json();
      setQuoteData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsQuoteLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          persona: activePersona,
          language: lang // 👈 传过去
        }),
      });

      const data = await res.json();
      if (data.content) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.content }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: ui.error }]);
    } finally {
      setIsLoading(false);
    }
  };

  const currentP = PERSONAS[activePersona];

  return (
    <div className="relative flex flex-col h-screen bg-[#050505] text-gray-100 overflow-hidden font-sans selection:bg-[#7F5CFF] selection:text-white">
      
      <div className="absolute top-[-20%] left-0 right-0 h-[500px] bg-gradient-to-b from-[#7F5CFF]/20 to-transparent blur-[100px] pointer-events-none opacity-60" />

      <div className="z-10 flex flex-col h-full w-full max-w-lg mx-auto bg-[#0a0a0a]/80 backdrop-blur-sm border-x border-white/5 shadow-2xl relative">
        
        {/* Header */}
        <header className="flex-none flex items-center justify-between px-6 py-5 bg-[#0a0a0a]/60 backdrop-blur-md sticky top-0 z-20 border-b border-white/5">
          <div className="flex items-center gap-4">
            <div className={`relative w-12 h-12 rounded-2xl flex items-center justify-center text-2xl bg-gradient-to-br from-gray-800 to-black border border-white/10 shadow-lg group overflow-hidden`}>
              <span className="z-10 group-hover:scale-110 transition-transform duration-300">{currentP.avatar}</span>
              <div className={`absolute inset-0 opacity-20 bg-current blur-md ${currentP.color}`}></div>
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-wider text-white">{currentP.name}</h1>
              <p className={`text-xs font-medium opacity-70 tracking-wide ${currentP.color}`}>{currentP.title[lang]}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* 语言切换按钮 */}
            <button 
              onClick={toggleLanguage}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-full transition-all active:scale-95 flex items-center gap-1"
            >
              <Languages size={18} />
              <span className="text-[10px] font-bold uppercase">{lang}</span>
            </button>

            {/* 签到按钮 */}
            <button 
              onClick={fetchDailyQuote}
              className="p-2 text-gray-400 hover:text-[#7F5CFF] hover:bg-white/5 rounded-full transition-colors relative group"
            >
              <Calendar size={20} />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            </button>
          </div>
        </header>

        {/* Persona Selector */}
        <div className="flex-none px-6 py-3">
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
            {(Object.keys(PERSONAS) as PersonaType[]).map((key) => (
              <button
                key={key}
                onClick={() => handlePersonaChange(key)}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 border
                  ${activePersona === key 
                    ? 'bg-[#7F5CFF] border-[#7F5CFF] text-white shadow-[0_0_15px_rgba(127,92,255,0.4)] translate-y-[-1px]' 
                    : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-200'}`}
              >
                <span>{PERSONAS[key].avatar}</span>
                {key}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <main className="flex-1 overflow-y-auto px-4 py-6 space-y-6 scroll-smooth">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-0 animate-[fadeIn_1s_ease-out_forwards]">
              <div className={`w-20 h-20 rounded-full bg-gradient-to-b from-white/5 to-transparent flex items-center justify-center text-4xl mb-2 border border-white/5 shadow-[0_0_30px_rgba(0,0,0,0.5)]`}>
                {currentP.avatar}
              </div>
              <div className="space-y-2">
                <p className="text-gray-500 text-sm tracking-widest uppercase">{ui.systemOnline}</p>
                <p className="text-white/80 text-lg font-light">
                  {lang === 'zh' ? '我是' : 'I am'} <span className={currentP.color}>{currentP.name}</span>.<br/>
                  <span className="text-sm opacity-60">{ui.intro}</span>
                </p>
              </div>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-[slideUp_0.3s_ease-out]`}
            >
              <div
                className={`max-w-[85%] px-5 py-3.5 text-sm leading-6 shadow-md backdrop-blur-sm
                  ${msg.role === 'user' 
                    ? 'bg-gradient-to-br from-[#7F5CFF] to-[#6242db] text-white rounded-2xl rounded-tr-sm border border-white/10' 
                    : 'bg-[#1a1a1a]/90 text-gray-200 rounded-2xl rounded-tl-sm border border-white/5'}`}
              >
                <div className="markdown"><ReactMarkdown>{msg.content}</ReactMarkdown></div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start w-full animate-pulse">
              <div className="flex items-center gap-2 bg-[#1a1a1a] px-4 py-3 rounded-2xl rounded-tl-sm border border-white/5">
                 <span className="text-xs text-gray-500">{ui.loading}</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} className="h-4" />
        </main>

        {/* Input Area */}
        <footer className="flex-none p-4 pb-6">
          <form 
            onSubmit={handleSubmit} 
            className="relative flex items-center gap-2 bg-[#151515] p-2 rounded-[24px] border border-white/10 shadow-2xl focus-within:border-[#7F5CFF]/50 transition-all duration-300"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={ui.placeholder}
              className="flex-1 bg-transparent text-white text-sm px-4 py-2 focus:outline-none placeholder-gray-600"
            />
            <button 
              type="submit" 
              disabled={!input.trim() || isLoading}
              className="p-3 bg-[#7F5CFF] text-white rounded-full hover:bg-[#6b4bd6] disabled:opacity-30 transition-all transform active:scale-95"
            >
              <Send size={18} fill="white" />
            </button>
          </form>
        </footer>

        {/* Daily Quote Modal */}
        {showQuote && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6 animate-[fadeIn_0.2s_ease-out]">
            <div className="w-full max-w-xs bg-[#1a1a1a] rounded-3xl border border-white/10 shadow-2xl overflow-hidden relative animate-[slideUp_0.4s_cubic-bezier(0.16,1,0.3,1)]">
              
              <button 
                onClick={() => setShowQuote(false)}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white z-10"
              >
                <X size={20} />
              </button>

              <div className="p-8 flex flex-col items-center text-center space-y-6">
                <div className="text-sm font-bold text-[#7F5CFF] tracking-widest uppercase">{ui.dailyToxic}</div>
                
                {isQuoteLoading ? (
                  <div className="py-10 space-y-4">
                    <div className="w-12 h-12 border-2 border-[#7F5CFF] border-t-transparent rounded-full animate-spin mx-auto"/>
                    <p className="text-gray-500 text-xs animate-pulse">{ui.makingPoison}</p>
                  </div>
                ) : (
                  <>
                    <div className="text-4xl my-4">{currentP.avatar}</div>
                    <p className="text-xl font-medium leading-relaxed text-gray-200 font-serif">
                      {quoteData?.content}
                    </p>
                    <div className="w-8 h-1 bg-[#7F5CFF] rounded-full opacity-50"></div>
                    <div className="text-xs text-gray-500">
                      {currentP.name} · {new Date().toLocaleDateString()}
                    </div>
                  </>
                )}
              </div>

              <div className="bg-[#111] p-4 border-t border-white/5 flex justify-center">
                 <button className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors">
                   <Share2 size={14} /> {ui.save}
                 </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}