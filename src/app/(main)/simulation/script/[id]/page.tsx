'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Package, Terminal, ChevronRight, Search, Play, 
  ShieldAlert, Key, Eye, Heart, Zap, Flame, Ghost, 
  Activity, Battery, Target, Skull, User, Users,
  ChevronDown, ChevronUp, Layers // 新增图标
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useScriptEngine } from '@/hooks/useScriptEngine';
import { LangType, LootItem } from '@/types/index';

// ----------------------------------------------------------------------
// 1. 角色视觉配置 (PERSONA_CONFIG)
// ----------------------------------------------------------------------
const PERSONA_CONFIG: Record<string, any> = {
  'SOL': { 
    title: '安全局局长', 
    color: 'text-orange-400 border-orange-500/30 bg-orange-950/20', 
    bubble: 'bg-orange-900/10 border-orange-500/20', 
    icon: Flame, 
    avatar: '/avatars/sol_hero.jpg' 
  },
  'VEE': { 
    title: '卫生局局长', 
    color: 'text-pink-400 border-pink-500/30 bg-pink-950/20', 
    bubble: 'bg-pink-900/10 border-pink-500/20',
    icon: Heart, 
    avatar: '/avatars/vee_hero.jpg' 
  },
  'RIN': { 
    title: '电力工会代表', 
    color: 'text-purple-400 border-purple-500/30 bg-purple-950/20', 
    bubble: 'bg-purple-900/10 border-purple-500/20',
    icon: Zap, 
    avatar: '/avatars/rin_hero.jpg' 
  },
  'SYSTEM': { 
    title: '市政厅终端', 
    color: 'text-emerald-500 border-emerald-500/20 bg-emerald-950/10', 
    bubble: 'bg-emerald-900/5 border-emerald-500/10 font-mono text-xs text-center italic',
    icon: Terminal, 
    avatar: null 
  },
  'DEFAULT': { 
    title: '顾问', 
    color: 'text-gray-400 border-white/10 bg-black/40', 
    bubble: 'bg-zinc-900/50 border-white/10',
    icon: User, 
    avatar: null 
  }
};

const UI_TEXT = {
  zh: {
    inputPlaceholder: '下达市长指令...',
    typing: '顾问团正在争论...',
    sceneHeader: '模拟场景',
    status: { objective: '当前目标', stability: '社会秩序', power: '电网负载' },
    briefing: { title: '绝密档案', role: '当前身份', start: '召开会议' },
    actions: { title: '可用行动', hidden: '行动面板已收起' }
  },
  en: {
    inputPlaceholder: 'Enter command...',
    typing: 'Advisors arguing...',
    sceneHeader: 'SCENE',
    status: { objective: 'OBJECTIVE', stability: 'STABILITY', power: 'GRID LOAD' },
    briefing: { title: 'TOP SECRET', role: 'IDENTITY', start: 'START SESSION' },
    actions: { title: 'AVAILABLE ACTIONS', hidden: 'PANEL COLLAPSED' }
  }
};

const SimMarkdown = ({ content }: { content: string }) => (
  <div className="prose prose-invert prose-sm max-w-none leading-relaxed break-words">
    <ReactMarkdown components={{ p: ({node, ...props}) => <p className="mb-0" {...props} /> }}>
      {content}
    </ReactMarkdown>
  </div>
);

// ----------------------------------------------------------------------
// 2. 核心：超强容错渲染器 (V3.1 - 无箭头版)
// ----------------------------------------------------------------------
const ScriptDialogueRenderer = ({ content }: { content: string }) => {
  const cleanContent = content.replace(/\[GAME_OVER\]|\[VICTORY\]/g, '').trim();
  const lines = cleanContent.split('\n');
  const bubbles: { speaker: string; text: string }[] = [];
  
  let currentSpeaker = 'SYSTEM';
  let currentBuffer: string[] = [];

  const WHITELIST_SPEAKERS = ['SOL', 'VEE', 'RIN', 'SYSTEM', 'ASH', 'MAYOR', '安全局', '卫生局', '工会'];
  const speakerRegex = /^\s*(?:\[\s*([a-zA-Z\u4e00-\u9fa5]+)\s*\]|\*\*\s*([a-zA-Z\u4e00-\u9fa5]+)\s*\*\*|([a-zA-Z\u4e00-\u9fa5]+))\s*[:：]\s*(.*)/;

  lines.forEach((line) => {
    const match = line.match(speakerRegex);
    if (match) {
        const rawName = (match[1] || match[2] || match[3]).trim().toUpperCase();
        const isFormatted = !!(match[1] || match[2]);
        const isInWhitelist = WHITELIST_SPEAKERS.includes(rawName);

        if (isFormatted || isInWhitelist) {
            if (currentBuffer.length > 0) {
                bubbles.push({ speaker: currentSpeaker, text: currentBuffer.join('\n') });
                currentBuffer = [];
            }
            currentSpeaker = rawName;
            if (match[4] && match[4].trim()) {
                currentBuffer.push(match[4].trim());
            }
            return; 
        }
    }
    if (line.trim()) currentBuffer.push(line.trim());
  });

  if (currentBuffer.length > 0) {
      bubbles.push({ speaker: currentSpeaker, text: currentBuffer.join('\n') });
  }

  if (bubbles.length === 0 && cleanContent) {
      return (
        <div className="flex flex-col items-center my-4 opacity-70">
            <span className="text-[10px] bg-white/5 border border-white/10 px-2 py-0.5 rounded-full uppercase">LOG</span>
            <div className="text-xs text-gray-400 mt-1 max-w-[90%] text-center"><SimMarkdown content={cleanContent} /></div>
        </div>
      );
  }

  return (
    <div className="flex flex-col gap-5 my-4 w-full">
      {bubbles.map((bubble, idx) => {
        if (bubble.speaker === 'SYSTEM') {
            return (
                <div key={idx} className="flex flex-col items-center my-2 opacity-60">
                    <span className="text-[10px] font-mono border border-emerald-500/20 text-emerald-500 px-2 py-0.5 rounded-full uppercase tracking-wider mb-1">SYSTEM</span>
                    <div className="text-xs text-gray-400 text-center italic max-w-[85%]">
                        <SimMarkdown content={bubble.text} />
                    </div>
                </div>
            );
        }

        const conf = PERSONA_CONFIG[bubble.speaker] || PERSONA_CONFIG['DEFAULT'];
        const Icon = conf.icon;
        
        return (
          <div key={idx} className="flex gap-3 animate-in fade-in slide-in-from-left-2 w-full group">
            <div className="flex flex-col items-center gap-1 flex-shrink-0 mt-1">
                <div className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center overflow-hidden shadow-lg ${conf.color.split(' ')[1]} bg-black transition-transform group-hover:scale-105`}>
                    {conf.avatar ? (
                        <img src={conf.avatar} className="w-full h-full object-cover" onError={(e) => e.currentTarget.style.display='none'} />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                           <Icon size={18} className={conf.color.split(' ')[0]} />
                        </div>
                    )}
                </div>
            </div>
            <div className="flex flex-col items-start min-w-0 max-w-[88%] flex-1">
               <div className="flex items-baseline gap-2 mb-1">
                   <span className={`text-[11px] font-black uppercase tracking-wider ${conf.color.split(' ')[0]}`}>{bubble.speaker}</span>
                   {conf.title && <span className="text-[9px] text-gray-500 bg-white/5 px-1.5 py-0.5 rounded border border-white/5">{conf.title}</span>}
               </div>
               
               {/* 🔥 修复点：移除了箭头 div，并将 rounded-tl-none 改为 rounded-2xl */}
               <div className={`relative px-4 py-3 rounded-2xl border shadow-sm backdrop-blur-md w-fit ${conf.bubble || conf.color}`}>
                  <div className="text-sm text-gray-100 leading-relaxed"><SimMarkdown content={bubble.text} /></div>
               </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ----------------------------------------------------------------------
// 3. 通栏状态条 (StatusBar)
// ----------------------------------------------------------------------
const StatusBar = ({ lang }: { lang: LangType }) => {
    const t = lang === 'zh' ? UI_TEXT.zh.status : UI_TEXT.en.status;
    return (
        <div className="w-full bg-[#0a0a0a]/90 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-4 py-2 text-[10px] font-mono uppercase tracking-wider z-30 shrink-0 shadow-sm">
            <div className="flex items-center gap-2 text-emerald-400">
                <Target size={12} className="animate-pulse" />
                <span className="opacity-60">{t.objective}:</span>
                <span className="font-bold">Restore Power</span>
            </div>
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-pink-400">
                    <Activity size={12} />
                    <span className="opacity-60">{t.stability}</span>
                    <span className="font-bold">42%</span>
                </div>
                <div className="flex items-center gap-1.5 text-yellow-400">
                    <Battery size={12} />
                    <span className="opacity-60">{t.power}</span>
                    <span className="font-bold">30%</span>
                </div>
            </div>
        </div>
    );
};

const BriefingModal = ({ show, meta, lang, onStart }: any) => {
    if (!show) return null;
    return (
        <div className="absolute inset-0 z-[200] bg-black/95 flex items-center justify-center p-6 animate-in fade-in">
             <div className="w-full max-w-md border border-emerald-500/30 bg-[#0a0a0a] p-8 text-center space-y-6 shadow-2xl shadow-emerald-900/20 relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500" />
                 <h1 className="text-2xl font-black text-white uppercase tracking-tight">{lang === 'zh' ? meta.title.zh : meta.title.en}</h1>
                 <p className="text-sm text-gray-400 font-mono leading-relaxed">{lang === 'zh' ? meta.intro.zh : meta.intro.en}</p>
                 <button onClick={onStart} className="w-full py-3.5 bg-emerald-600 text-black font-bold uppercase tracking-widest hover:bg-emerald-500 transition-colors rounded-sm">START MISSION</button>
             </div>
        </div>
    )
};

const ResultModal = ({ type, onRestart }: any) => {
    if (!type) return null;
    const isWin = type === 'win';
    return (
        <div className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-6 animate-in zoom-in-95">
             <div className={`w-full max-w-sm border-2 rounded-2xl p-8 text-center space-y-4 ${isWin ? 'border-emerald-500 bg-emerald-900/10' : 'border-red-500 bg-red-900/10'}`}>
                 <h2 className={`text-4xl font-black italic ${isWin ? 'text-emerald-500' : 'text-red-500'}`}>{isWin ? 'VICTORY' : 'FAILED'}</h2>
                 <button onClick={onRestart} className="px-8 py-2 bg-white text-black font-bold rounded-full hover:scale-105 transition-transform">RESTART</button>
             </div>
        </div>
    )
};

// ----------------------------------------------------------------------
// 5. 主页面组件
// ----------------------------------------------------------------------
export default function ScriptSimulationPage() {
  const router = useRouter();
  const [lang, setLang] = useState<LangType>('zh');
  const [isReady, setIsReady] = useState(false);
  const [showBriefing, setShowBriefing] = useState(true);
  const [input, setInput] = useState('');
  const [gameResult, setGameResult] = useState<'win' | 'loss' | null>(null);
  
  // 🔥 新增：控制操作栏折叠状态
  const [showActions, setShowActions] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { meta, gameState, currentScene, isLoading, sendAction, transitionTo } = useScriptEngine(lang);
  const t = lang === 'zh' ? UI_TEXT.zh : UI_TEXT.en;

  useEffect(() => {
      const lastMsg = gameState.history[gameState.history.length - 1];
      if (lastMsg?.content?.includes('[GAME_OVER]')) setGameResult('loss');
      else if (lastMsg?.content?.includes('[VICTORY]')) setGameResult('win');
  }, [gameState.history]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('toggle-dock', { detail: { visible: false } }));
    const timer = setTimeout(() => window.dispatchEvent(new CustomEvent('toggle-dock', { detail: { visible: false } })), 200);
    return () => { clearTimeout(timer); window.dispatchEvent(new CustomEvent('toggle-dock', { detail: { visible: true } })); };
  }, []);

  const handleActionClick = (action: any) => {
    if (isLoading) return;
    const labelText = lang === 'zh' ? action.label.zh : action.label.en;
    sendAction(labelText, action.payload || labelText); 
  };
  
  const handleManualSend = () => {
    if (!input.trim() || isLoading) return;
    sendAction(input);
    setInput('');
  };

  useEffect(() => {
    const savedLang = localStorage.getItem('toughlove_lang_preference');
    if (savedLang) setLang(savedLang as LangType);
    setTimeout(() => setIsReady(true), 500);
  }, []);
  
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [gameState.history, isLoading]);

  if (!isReady) return null;

  return (
    <div className="fixed inset-0 z-[50] flex flex-col w-full h-full bg-[#050505] text-gray-200 font-sans overflow-hidden">
      
      <BriefingModal show={showBriefing} meta={meta} lang={lang} onStart={() => setShowBriefing(false)} />
      <ResultModal type={gameResult} onRestart={() => window.location.reload()} />

      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
         {currentScene?.backgroundImage && <img src={currentScene.backgroundImage} className="w-full h-full object-cover grayscale brightness-50" />}
         <div className="absolute inset-0 bg-gradient-to-t from-black via-[#050505]/90 to-transparent" />
      </div>

      <header className="relative z-20 flex items-center justify-between px-4 py-3 bg-black/90 backdrop-blur border-b border-white/5 flex-none shadow-md">
        <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 border border-white/5">
               <ArrowLeft size={16} />
            </button>
            <div className="flex flex-col">
               <span className="text-[9px] text-emerald-500 font-bold uppercase tracking-widest">{t.sceneHeader}</span>
               <span className="text-xs font-bold text-white mt-0.5">{lang === 'zh' ? currentScene?.name.zh : currentScene?.name.en}</span>
            </div>
        </div>
      </header>

      {!showBriefing && <StatusBar lang={lang} />}

      <main className="flex-1 relative z-10 overflow-y-auto px-4 py-4 space-y-6 no-scrollbar pb-8 bg-black/20">
        {!showBriefing && <div className="text-center opacity-30 text-[10px] uppercase font-mono tracking-widest mb-8">--- Encrypted Channel Open ---</div>}
        
        {gameState.history.map((msg, idx) => {
          if (msg.role === 'system') return <div key={idx} className="text-center my-6"><span className="text-[10px] bg-white/5 px-3 py-1 rounded-full text-gray-500 border border-white/5 font-mono">{msg.content.replace('>>> ', '')}</span></div>;
          
          if (msg.role === 'user') return (
              <div key={idx} className="flex justify-end animate-in slide-in-from-right-2">
                  <div className="max-w-[85%] bg-[#222] border border-white/10 px-4 py-3 rounded-2xl rounded-tr-sm text-sm text-gray-200 shadow-sm">
                      {msg.content}
                  </div>
              </div>
          );
          
          return <ScriptDialogueRenderer key={idx} content={msg.content} />;
        })}
        
        {isLoading && (
            <div className="flex items-center gap-2 ml-4 opacity-50 my-4">
               <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce"/>
               <span className="text-xs text-emerald-500 font-mono">{lang === 'zh' ? UI_TEXT.zh.typing : UI_TEXT.en.typing}</span>
            </div>
        )}
        <div ref={messagesEndRef} className="h-4" />
      </main>

      <footer className="relative z-[100] flex-none bg-[#0a0a0a] border-t border-white/5 pb-10 pt-2 px-4 shadow-[0_-10px_40px_rgba(0,0,0,0.8)]">
        
        {/* 🔥 新增：折叠控制条 */}
        <div className="flex justify-between items-center mb-2 px-1 py-1 cursor-pointer hover:bg-white/5 rounded-lg transition-colors group" onClick={() => setShowActions(!showActions)}>
            <div className="flex items-center gap-2">
                <Layers size={12} className="text-emerald-500" />
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider group-hover:text-gray-300 transition-colors">
                    {showActions ? t.actions.title : t.actions.hidden}
                </span>
            </div>
            <div className="text-gray-500 group-hover:text-white transition-colors">
                {showActions ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            </div>
        </div>

        {/* 垂直操作按钮区 (带动画折叠) */}
        <div className={`flex flex-col gap-2 w-full transition-all duration-300 ease-in-out overflow-y-auto no-scrollbar ${showActions ? 'max-h-[35vh] opacity-100 mb-3' : 'max-h-0 opacity-0 mb-0'}`}>
          {currentScene?.actions?.map((action, idx) => {
            const label = lang === 'zh' ? action.label.zh : action.label.en;
            return (
                <button 
                    key={idx} 
                    disabled={isLoading} 
                    onClick={() => handleActionClick(action)} 
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold bg-emerald-900/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-900/30 hover:border-emerald-500/40 active:scale-[0.98] disabled:opacity-50 transition-all group shrink-0"
                >
                    <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors shrink-0">
                        {action.type === 'move' ? <ChevronRight size={14}/> : <Search size={14}/>}
                    </div>
                    <span className="flex-1 text-left truncate">{label}</span>
                    <Play size={10} className="opacity-0 group-hover:opacity-50 -translate-x-2 group-hover:translate-x-0 transition-all shrink-0" />
                </button>
            );
          })}
        </div>

        {/* 输入框 */}
        <div className="flex items-center gap-2 bg-[#121212] p-1.5 rounded-xl border border-white/10 focus-within:border-emerald-500/50 transition-all">
          <input 
            type="text" 
            value={input} 
            onChange={(e) => setInput(e.target.value)} 
            onKeyDown={(e) => e.key === 'Enter' && handleManualSend()} 
            placeholder={t.inputPlaceholder} 
            disabled={isLoading} 
            className="flex-1 bg-transparent text-sm text-white px-3 py-2 outline-none placeholder-gray-600 disabled:opacity-50 min-w-0" 
          />
          <button onClick={handleManualSend} disabled={!input.trim() || isLoading} className="p-2.5 rounded-lg bg-emerald-600 text-black hover:bg-emerald-500 disabled:bg-[#222] disabled:text-gray-600 transition-all active:scale-95 shrink-0">
             <Play size={16} fill="currentColor" />
          </button>
        </div>
      </footer>
    </div>
  );
}