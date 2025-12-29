'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Send, Backpack, MoreVertical, Loader2, Sparkles } from 'lucide-react';
import { getDeviceId } from '@/lib/utils';
import { InventoryModal } from '@/components/modals/InventoryModal';
import { getDict, Dictionary, baseEn } from '@/lib/i18n/dictionaries';
import { LangType } from '@/types';
import { PERSONAS_REGISTRY } from '@/config/personas';
import { toast } from 'sonner'; // 🔥 修正：直接从 sonner 导入，而不是用 useToast Hook

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system'; 
  content: string;
}

interface InventoryItem {
  id: string;
  name: { zh: string; en: string };
  description: { zh: string; en: string };
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  type: string;
  image: string;
  price: number;
  count?: number;
}

export default function ChatDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  
  const chatId = (params?.id as string) || 'ash';
  const currentPersona = PERSONAS_REGISTRY[chatId] || PERSONAS_REGISTRY['ash'];

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false); 
  const [isGeneratingContext, setIsGeneratingContext] = useState(false); 
  
  const [showInventory, setShowInventory] = useState(false);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [personaState, setPersonaState] = useState({ mood: 60, favorability: 0 });
  const [dict, setDict] = useState<Dictionary>(baseEn);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasTriggeredContextRef = useRef(false); 
  const hasTriggeredTarotRef = useRef(false);

  // --- 初始化 & 状态加载 ---

  useEffect(() => {
    const savedLang = (localStorage.getItem('toughlove_lang') as LangType) || 'zh';
    setDict(getDict(savedLang));
    fetchPersonaState();
    fetchInventory();
  }, [chatId]);

  useEffect(() => {
    hasTriggeredContextRef.current = false; 

    const loadHistory = () => {
        const storageKey = `tough_chat_history_${chatId}`;
        const saved = localStorage.getItem(storageKey);
        
        let historyMessages: Message[] = [];

        if (saved) {
            try {
                historyMessages = JSON.parse(saved);
            } catch (e) {
                console.error('Failed to parse chat history', e);
            }
        }

        if (historyMessages.length === 0 && !searchParams.get('from')) {
            historyMessages.push({
                id: 'init-default',
                role: 'assistant',
                content: chatId === 'ash' ? '你来了？刚才的咖啡不错。' : '信号连接成功！'
            });
        }
        
        setMessages(historyMessages);
    };

    loadHistory();
  }, [chatId]);

  useEffect(() => {
     const checkContextToAdd = async () => {
        const fromSource = searchParams.get('from');
        const action = searchParams.get('action');

        if (fromSource && !hasTriggeredContextRef.current && !hasTriggeredTarotRef.current) {
            hasTriggeredContextRef.current = true; 
            
            if (action === 'tarot') {
                triggerTarotFlow();
            } else {
                await generateContextMessage(fromSource);
            }
        }
     };
     checkContextToAdd();
  }, [searchParams, chatId]);

  useEffect(() => {
    if (messages.length > 0) {
        localStorage.setItem(`tough_chat_history_${chatId}`, JSON.stringify(messages));
    }
  }, [messages, chatId]);

  // 🔥 塔罗结果监听器
  useEffect(() => {
      const action = searchParams.get('action');
      if (action !== 'tarot') return;

      const lastMsg = messages[messages.length - 1];
      if (lastMsg && lastMsg.role === 'assistant') {
          const match = lastMsg.content.match(/\[(?:TAROT|CARD|塔罗)[:：]\s*(.*?)\]/i);
          
          if (match) {
              const cardName = match[1].trim();
              console.log("Captured Tarot Card:", cardName);
              
              const log = {
                  date: new Date().toDateString(),
                  cardName: cardName,
                  result: lastMsg.content, 
                  timestamp: Date.now()
              };
              localStorage.setItem('toughlove_daily_tarot_log', JSON.stringify(log));

              if (navigator.vibrate) navigator.vibrate([50, 50, 100]);
              
              // 🔥 修正：使用 Sonner 的语法
              toast("Fate Recorded", {
                  description: "Your daily tarot has been saved.",
                  style: {
                      background: 'rgba(88, 28, 135, 0.9)', 
                      borderColor: 'rgba(168, 85, 247, 0.5)', 
                      color: '#f3e8ff'
                  },
              });
          }
      }
  }, [messages, searchParams]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGeneratingContext, isLoading]);

  // --- 逻辑函数 ---

  const triggerTarotFlow = async () => {
      hasTriggeredTarotRef.current = true;
      setIsGeneratingContext(true);

      const sysMsg: Message = {
          id: `sys-${Date.now()}`,
          role: 'system',
          content: '正在连接潜意识数据库... 塔罗协议已启动。'
      };
      setMessages(prev => [...prev, sysMsg]);

      await new Promise(r => setTimeout(r, 1000));

      const tarotPrompt = "请为我抽取一张今日塔罗牌。请严格按照以下格式返回结果：在回答的最开始写上 [TAROT: 卡牌英文名]，然后换行，开始你的解读。解读要神秘、简短、符合你的性格。";
      
      const userTriggerMsg: Message = {
          id: `user-${Date.now()}`,
          role: 'user',
          content: '请为我抽取今日塔罗牌。'
      };
      setMessages(prev => [...prev, userTriggerMsg]);
      setIsLoading(true);
      setIsGeneratingContext(false);

      try {
          const res = await fetch('/api/chat/reply', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  personaId: chatId,
                  message: tarotPrompt,
                  history: [] 
              })
          });

          const data = await res.json();
          const aiContent = data.content || data.reply || "（星光黯淡，无法连接...）";

          const aiMsg: Message = { 
              id: `ai-${Date.now()}`, 
              role: 'assistant', 
              content: aiContent 
          };
          setMessages(prev => [...prev, aiMsg]);

      } catch (e) {
          console.error("Tarot Error", e);
      } finally {
          setIsLoading(false);
      }
  };

  const generateContextMessage = async (source: string) => {
    setIsGeneratingContext(true);
    try {
        const context = {
            source: source,
            topic: searchParams.get('topic'),
            stance: searchParams.get('stance'),
            result: searchParams.get('result'),
            action: searchParams.get('action'),
        };

        const res = await fetch('/api/chat/opening', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                personaId: chatId,
                context: context
            })
        });
        const data = await res.json();

        const content = data.content || data.reply || "（收到信号，但数据解析失败...）";

        const newMessage: Message = {
            id: `ctx-${Date.now()}`,
            role: 'assistant',
            content: content
        };
        
        setMessages(prev => [...prev, newMessage]);

    } catch (e) {
        console.error("Failed to generate context opening", e);
    } finally {
        setIsGeneratingContext(false);
    }
  };

  const fetchPersonaState = async () => {
    try {
        const userId = getDeviceId();
        const res = await fetch(`/api/persona/state?userId=${userId}&persona=${chatId}&_t=${Date.now()}`, { cache: 'no-store' });
        if (res.ok) {
            const data = await res.json();
            if (data && typeof data.mood === 'number') setPersonaState(data);
        }
    } catch (e) { console.error(e); }
  };

  const fetchInventory = async () => {
    try {
        const userId = getDeviceId();
        const res = await fetch(`/api/inventory?userId=${userId}&_t=${Date.now()}`, { 
            cache: 'no-store',
            headers: { 'Pragma': 'no-cache', 'Cache-Control': 'no-cache' }
        });
        if (res.ok) {
            const data = await res.json();
            setInventory(data.inventory || []);
        }
    } catch (e) { console.error(e); }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;
    
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: inputValue };
    const currentHistory = [...messages, userMsg]; 
    
    setMessages(currentHistory);
    setInputValue('');
    setIsLoading(true);

    try {
        const res = await fetch('/api/chat/reply', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                personaId: chatId,
                message: userMsg.content,
                history: messages
            })
        });

        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`Server error: ${res.status} ${errorText}`);
        }
        
        const data = await res.json();
        
        const aiContent = data.content || data.reply || "（系统：对方似乎掉线了...）";
        
        const aiMsg: Message = { 
            id: (Date.now() + 1).toString(), 
            role: 'assistant', 
            content: aiContent 
        };
        setMessages(prev => [...prev, aiMsg]);

    } catch (error) {
        console.error("Chat API Error:", error);
        const errorMsg: Message = { 
            id: `err-${Date.now()}`, 
            role: 'system', 
            content: "⚠️ 通讯连接中断 (API Error)，请检查后端控制台。" 
        };
        setMessages(prev => [...prev, errorMsg]);
    } finally {
        setIsLoading(false);
    }
  };

  const handleInventoryUpdate = (msg: string) => {
      fetchInventory();     
      fetchPersonaState();  
      const sysMsg: Message = { id: Date.now().toString(), role: 'system', content: msg };
      setMessages(prev => [...prev, sysMsg]);
  };

  // --- Render ---
  const renderMessage = (msg: Message) => {
    if (msg.role === 'system') {
        return (
            <div key={msg.id} className="flex justify-center my-4 animate-in fade-in zoom-in-95 duration-300">
                <span className="text-xs text-cyan-500/60 font-mono bg-cyan-900/10 px-3 py-1 rounded-full border border-cyan-500/10 italic flex items-center gap-2">
                    <Sparkles size={10} />
                    {msg.content}
                </span>
            </div>
        );
    }

    const isUser = msg.role === 'user';
    return (
        <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
            {!isUser && (
                <div className={`w-8 h-8 rounded-full overflow-hidden border border-white/10 flex items-center justify-center bg-gray-900 mr-2 mt-1 shrink-0`}>
                     {currentPersona.avatar.startsWith('/') ? (
                        <img src={currentPersona.avatar} alt={currentPersona.name} className="w-full h-full object-cover" />
                     ) : (
                        <span className="text-sm">AI</span> 
                     )}
                </div>
            )}
            <div className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed ${
                isUser 
                ? 'bg-cyan-900/30 text-cyan-50 border border-cyan-800/50 rounded-tr-none' 
                : 'bg-[#1a1a1a] text-gray-200 border border-white/5 rounded-tl-none'
            }`}>
                {msg.content}
            </div>
        </div>
    );
  };
  
  // @ts-ignore
  const displayRole = dict.personas?.[chatId]?.role || currentPersona.name;

  return (
    <div className="flex flex-col h-screen bg-[#050505] text-gray-200 font-sans">
      
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-[#0a0a0a] border-b border-white/10 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <Link href="/chat" className="p-2 -ml-2 text-gray-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className={`font-bold text-gray-100 tracking-wide flex items-center gap-2 ${currentPersona.color}`}>
                {currentPersona.name}
                <span className="text-[10px] px-1 rounded bg-white/5 text-gray-400 border border-white/5 font-normal">
                    {displayRole}
                </span>
            </h1>
            <p className="text-[10px] text-green-500 font-mono flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"/>
              {dict.chat_ui.online}
            </p>
          </div>
        </div>
        <button className="p-2 text-gray-400 hover:text-white">
          <MoreVertical size={20} />
        </button>
      </header>

      {/* Dashboard */}
      <div className="flex items-center justify-between px-6 py-2 bg-black/60 border-b border-cyan-900/30 backdrop-blur-md sticky top-[61px] z-10 shadow-lg shadow-cyan-900/5">
            <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold text-cyan-500/70 tracking-widest">{dict.chat_ui.mood}</span>
                <div className="w-24 h-1.5 bg-gray-800 rounded-full overflow-hidden border border-gray-700/50">
                    <div 
                        className="h-full bg-gradient-to-r from-blue-600 via-cyan-500 to-cyan-400 transition-all duration-700 ease-out shadow-[0_0_10px_rgba(34,211,238,0.5)]"
                        style={{ width: `${Math.min(100, Math.max(0, personaState.mood))}%` }}
                    />
                </div>
                <span className="text-xs font-bold text-cyan-400 font-mono min-w-[3ch] text-right">
                    {personaState.mood}%
                </span>
            </div>

            <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold text-pink-500/70 tracking-widest">{dict.chat_ui.sync}</span>
                <div className="flex items-center gap-1.5">
                    <span className="text-pink-500 text-xs animate-pulse">♥</span>
                    <span className="text-sm font-bold text-pink-400 tracking-wider font-mono">
                        {personaState.favorability}
                    </span>
                </div>
            </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-800">
        
        {messages.map(renderMessage)}
        
        {/* Context Loading UI */}
        {isGeneratingContext && (
             <div className="flex justify-start animate-in fade-in duration-500">
                <div className={`w-8 h-8 rounded-full border border-white/10 flex items-center justify-center bg-gray-900 mr-2 mt-1`}>
                     <span className="text-[10px]">AI</span>
                </div>
                <div className="bg-[#1a1a1a] p-3 rounded-2xl rounded-tl-none border border-white/5 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-cyan-500 animate-spin" />
                    <span className="text-xs text-gray-500 font-mono italic">
                        {searchParams.get('action') === 'tarot' ? '星轨计算中...' :
                         searchParams.get('from') === 'herofeed' ? '正在阅读你分享的新闻...' :
                         searchParams.get('from') === 'script_murder' ? '正在分析推演结果...' :
                         dict.chat_ui.thinking}
                    </span>
                </div>
            </div>
        )}

        {/* 正在输入 UI */}
        {isLoading && !isGeneratingContext && (
            <div className="flex justify-start animate-in fade-in duration-300 pl-1">
                 <div className={`w-8 h-8 rounded-full overflow-hidden border border-white/10 flex items-center justify-center bg-gray-900 mr-2 mt-1 shrink-0`}>
                     {currentPersona.avatar.startsWith('/') ? (
                        <img src={currentPersona.avatar} alt={currentPersona.name} className="w-full h-full object-cover" />
                     ) : (
                        <span className="text-sm">AI</span> 
                     )}
                </div>
                <div className="bg-[#1a1a1a] px-4 py-3 rounded-2xl rounded-tl-none border border-white/5 flex items-center gap-3 shadow-lg shadow-black/20">
                    <div className="flex space-x-1 h-3 items-center">
                        <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce"></div>
                    </div>
                    <span className="text-xs text-gray-500 font-mono tracking-wider">
                        Running logic...
                    </span>
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-[#0a0a0a] border-t border-white/10 pb-8">
        <div className="flex items-center gap-3 max-w-4xl mx-auto">
          <button 
            onClick={() => { fetchInventory(); setShowInventory(true); }}
            className="p-3 bg-[#151515] text-cyan-500 rounded-xl hover:bg-[#202020] transition-all border border-white/5 active:scale-95"
          >
            <Backpack size={20} />
          </button>

          <div className="flex-1 relative">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={dict.chat_ui.placeholder}
              className="w-full bg-[#151515] text-white rounded-xl py-3 pl-4 pr-12 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 border border-white/5 placeholder-gray-600"
            />
            <button 
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-cyan-500 hover:text-cyan-400 disabled:opacity-30 transition-colors"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>

      <InventoryModal
        show={showInventory}
        onClose={() => setShowInventory(false)}
        inventory={inventory}
        onUseItem={handleInventoryUpdate} 
      />
    </div>
  );
}