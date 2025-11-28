import { useRef } from 'react';
// 🔥 确保引入了 Ban 和 Share2 等图标
import { X, Share2, Coffee, QrCode, ExternalLink, Gift, Bug, Brain, ImageIcon, Ban } from 'lucide-react';
import { PERSONAS, PersonaType, LangType, UI_TEXT } from '@/lib/constants';
import { Typewriter } from '../ui/Typewriter';

// --- Daily Quote Modal ---
export const DailyQuoteModal = ({ show, onClose, data, isLoading, onDownload, isGenerating, ui, activePersona }: any) => {
  if (!show) return null;
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/90 backdrop-blur-md p-6 animate-[fadeIn_0.3s_ease-out]">
      <div className="w-full max-w-sm relative">
        <button onClick={onClose} className="absolute -top-12 right-0 p-2 text-gray-400 hover:text-white"><X size={24}/></button>
        <div ref={ref} className="bg-[#111] rounded-3xl border border-white/10 overflow-hidden shadow-2xl relative p-8 text-center flex flex-col items-center">
           <div className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-6 border-b border-white/5 pb-2 w-full flex justify-between"><span>{data?.date || new Date().toLocaleDateString()}</span><span className="text-[#7F5CFF]">DAILY TOXIC</span></div>
           {isLoading ? (<div className="py-10 space-y-3"><div className="w-8 h-8 border-2 border-[#7F5CFF] border-t-transparent rounded-full animate-spin mx-auto"/><p className="text-xs text-gray-500 animate-pulse">{ui.makingPoison}</p></div>) : (<><div className="text-3xl mb-6 opacity-30">❝</div><p className="text-lg font-serif text-white leading-relaxed mb-8">{data?.content}</p><div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-8">— {PERSONAS[data?.persona as PersonaType]?.name || activePersona} —</div><div className="w-full pt-4 border-t border-white/10 flex justify-between items-end"><div className="text-left"><div className="text-[9px] text-gray-600 font-bold">GET YOURS AT</div><div className="text-xs text-[#7F5CFF] font-bold tracking-wider">toughlove.online</div></div><div className="w-8 h-8 bg-white/10 rounded flex items-center justify-center"><QrCode size={16} className="text-white" /></div></div></>)}
        </div>
        {!isLoading && (<button onClick={() => onDownload(ref)} disabled={isGenerating} className="w-full mt-6 py-3.5 rounded-xl bg-white text-black font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.2)]">{isGenerating ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"/> : <Share2 size={16} />}{ui.save}</button>)}
      </div>
    </div>
  );
};

// --- Profile Modal ---
export const ProfileModal = ({ show, onClose, data, isLoading, onDownload, isGenerating, ui, mounted, deviceId }: any) => {
  if (!show) return null;
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-[fadeIn_0.3s_ease-out]">
      <div className="w-full max-w-sm relative">
        <button onClick={onClose} className="absolute -top-12 right-0 p-2 text-gray-400 hover:text-white"><X size={24}/></button>
        <div ref={ref} className="bg-[#050505] rounded-3xl border border-white/10 overflow-hidden shadow-2xl relative">
           <div className="h-32 bg-gradient-to-b from-[#7F5CFF]/20 to-transparent flex flex-col items-center justify-center"><div className="w-16 h-16 rounded-full bg-black border border-[#7F5CFF] flex items-center justify-center text-3xl shadow-[0_0_20px_rgba(127,92,255,0.4)]">🧠</div></div>
           <div className="p-6 -mt-8 relative z-10">
             <h2 className="text-center text-xl font-bold text-white tracking-widest uppercase mb-1">{ui.profileTitle}</h2>
             <p className="text-center text-xs text-gray-500 font-mono mb-6">ID: {mounted ? deviceId.slice(0,8) : '...'}...</p>
             {isLoading ? (<div className="py-10 text-center space-y-3"><div className="w-8 h-8 border-2 border-[#7F5CFF] border-t-transparent rounded-full animate-spin mx-auto"/><p className="text-xs text-gray-500 animate-pulse">{ui.analyzing}</p></div>) : (<div className="space-y-6"><div><div className="text-[10px] font-bold text-gray-600 uppercase mb-2 tracking-wider">{ui.tagsTitle}</div><div className="flex flex-wrap gap-2">{data?.tags && data.tags.length > 0 ? (data.tags.map((tag: string, i: number) => (<span key={i} className="px-3 py-1.5 rounded-md bg-[#1a1a1a] border border-white/10 text-xs text-gray-300">#{tag}</span>))) : (<span className="text-xs text-gray-600 italic">No data yet...</span>)}</div></div><div className="bg-[#111] p-4 rounded-xl border-l-2 border-[#7F5CFF] relative"><div className="absolute -top-3 left-3 bg-[#050505] px-1 text-[10px] font-bold text-[#7F5CFF]">{ui.diagnosisTitle}</div><p className="text-sm text-gray-300 leading-relaxed italic font-serif">"{data?.diagnosis}"</p></div><div className="text-center text-[9px] text-gray-700 pt-4 border-t border-white/5">GENERATED BY TOUGHLOVE AI</div></div>)}
           </div>
        </div>
        {!isLoading && (<button onClick={() => onDownload(ref)} disabled={isGenerating} className="w-full mt-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors">{isGenerating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <ImageIcon size={16} />}{ui.saveCard}</button>)}
      </div>
    </div>
  );
};

// --- Diary Modal ---
export const DiaryModal = ({ show, onClose, content, isLoading, currentP }: any) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/90 backdrop-blur-md p-6 animate-[fadeIn_0.3s_ease-out]">
      <div className="w-full max-w-sm bg-[#f5f5f0] text-[#1a1a1a] rounded-xl shadow-2xl relative overflow-hidden transform rotate-1">
        <div className="h-8 bg-red-800/10 border-b border-red-800/20 flex items-center px-4 gap-2"><div className="w-2 h-2 rounded-full bg-red-800/30"></div><div className="w-2 h-2 rounded-full bg-red-800/30"></div><div className="w-2 h-2 rounded-full bg-red-800/30"></div></div>
        <button onClick={onClose} className="absolute top-2 right-2 p-1 text-gray-400 hover:text-black z-10"><X size={20}/></button>
        <div className="p-6 pt-4 min-h-[300px] flex flex-col">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 border-b border-gray-300 pb-2 flex justify-between items-center"><span>{new Date().toLocaleDateString()}</span><span className="text-[#7F5CFF]">{currentP.name}'s Note</span></div>
          <div className="flex-1 font-serif text-sm leading-7 text-gray-800 whitespace-pre-line relative">
             <div className="absolute inset-0 pointer-events-none opacity-10 bg-[url('https://www.transparenttextures.com/patterns/notebook.png')]"></div>
             {isLoading ? (<div className="flex flex-col items-center justify-center h-40 gap-3 opacity-50"><div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"/><span className="text-xs">Thinking...</span></div>) : (<Typewriter content={content} isThinking={false} />)}
          </div>
          <div className="mt-6 pt-4 border-t border-gray-300 text-center"><p className="text-[10px] text-gray-400 italic">Confidential. Do not share.</p></div>
        </div>
      </div>
    </div>
  );
};

// --- 🔥 Shame Modal (耻辱柱) ---
export const ShameModal = ({ show, onClose, data, lang, onDownload, isGenerating, ui }: any) => {
  if (!show) return null;
  const ref = useRef<HTMLDivElement>(null);
  
  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center bg-red-950/90 backdrop-blur-md p-6 animate-[fadeIn_0.3s_ease-out]">
      <div className="w-full max-w-sm relative">
        <button onClick={onClose} className="absolute -top-12 right-0 p-2 text-white/50 hover:text-white"><X size={24}/></button>
        
        <div ref={ref} className="bg-[#0a0a0a] rounded-xl border-2 border-red-600 shadow-[0_0_50px_rgba(220,38,38,0.3)] overflow-hidden relative p-8 text-center flex flex-col items-center">
           {/* 封条效果 */}
           <div className="absolute top-4 -right-8 rotate-45 bg-red-600 text-black text-[10px] font-black py-1 px-10 tracking-widest border border-red-400">
             FAILED
           </div>

           <div className="text-sm font-black text-red-600 uppercase tracking-[0.3em] mb-6 border-b border-red-900/30 pb-2 w-full">
             {ui.shameTitle}
           </div>

           <div className="w-24 h-24 rounded-full border-2 border-red-600/50 mb-6 overflow-hidden grayscale contrast-125">
             <img src={PERSONAS.Sol.avatar} alt="Sol" className="w-full h-full object-cover" />
           </div>

           <div className="text-lg text-gray-300 font-serif leading-relaxed mb-6">
             <span className="font-bold text-white border-b border-white/20 pb-0.5">{data?.name}</span>
             <span className="mx-1 text-sm text-gray-400">{ui.shameContent}</span>
             <span className="font-mono font-bold text-red-500 text-xl mx-1">{data?.duration}</span>
             <span className="text-sm text-gray-400">{lang === 'zh' ? '分钟' : 'mins'}</span>
             <div className="mt-1 text-sm text-gray-400">{ui.shameAction}</div>
           </div>

           <div className="text-xs font-bold text-red-800 uppercase tracking-widest mb-6 animate-pulse">
             — {ui.shameFooter} —
           </div>

           <div className="w-full pt-4 border-t border-white/5 flex justify-between items-end">
             <div className="text-left">
               <div className="text-[9px] text-gray-600 font-bold">DATE: {data?.date}</div>
               <div className="text-[10px] text-red-600 font-bold tracking-wider">toughlove.online</div>
             </div>
             <div className="w-8 h-8 bg-red-900/20 rounded flex items-center justify-center">
               <QrCode size={16} className="text-red-600" />
             </div>
           </div>
        </div>

        <button 
          onClick={() => onDownload(ref)} 
          disabled={isGenerating} 
          className="w-full mt-6 py-3.5 rounded-xl bg-red-600 text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-red-700 transition-colors shadow-lg"
        >
          {isGenerating ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> : <Share2 size={16} />}
          {ui.saveShame}
        </button>
      </div>
    </div>
  );
};