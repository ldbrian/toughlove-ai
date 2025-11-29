'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Share2, ImageIcon, Ban, Award, BookHeart, Zap, Flower2, CheckSquare, Square, QrCode, Brain } from 'lucide-react';
import { PERSONAS, PersonaType } from '@/lib/constants';
import { Typewriter } from '../ui/Typewriter';

// --- Helper: SVG Radar Chart Component ---
const RadarChart = ({ data }: { data: any }) => {
  // Config
  const size = 200;
  const center = size / 2;
  const radius = 80;
  const axes = [
    { name: 'ORDER', val: data?.order || 0, color: '#10b981' },   // Sol (Top)
    { name: 'ENERGY', val: data?.energy || 0, color: '#f472b6' }, // Rin (Top Right)
    { name: 'CHAOS', val: data?.chaos || 0, color: '#a855f7' },   // Vee (Bottom Right)
    { name: 'REALITY', val: data?.reality || 0, color: '#3b82f6' }, // Ash (Bottom Left)
    { name: 'INSIGHT', val: data?.insight || 0, color: '#6366f1' }, // Echo (Top Left)
  ];

  // Helper to get coordinates
  const getPoint = (value: number, index: number, max: number = 100) => {
    const angle = (Math.PI * 2 * index) / 5 - Math.PI / 2;
    const r = (value / max) * radius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle)
    };
  };

  // Generate path string
  const points = axes.map((a, i) => getPoint(a.val, i)).map(p => `${p.x},${p.y}`).join(' ');
  const fullPoly = axes.map((_, i) => getPoint(100, i)).map(p => `${p.x},${p.y}`).join(' ');

  return (
    <div className="relative w-[200px] h-[200px] mx-auto my-4">
      <svg width={size} height={size} className="overflow-visible">
        {/* Background Grids */}
        {[20, 40, 60, 80, 100].map((level, idx) => (
           <polygon key={idx} points={axes.map((_, i) => {
               const p = getPoint(level, i);
               return `${p.x},${p.y}`;
           }).join(' ')} fill="none" stroke="#333" strokeWidth="0.5" strokeDasharray="2,2" />
        ))}
        
        {/* Axis Lines & Labels */}
        {axes.map((axis, i) => {
           const p = getPoint(115, i);
           const pLine = getPoint(100, i);
           return (
             <g key={i}>
               <line x1={center} y1={center} x2={pLine.x} y2={pLine.y} stroke="#333" strokeWidth="0.5" />
               <text x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle" fill={axis.color} fontSize="8" fontWeight="bold" letterSpacing="1px">
                 {axis.name}
               </text>
             </g>
           );
        })}

        {/* The Data Polygon */}
        <polygon points={points} fill="rgba(127, 92, 255, 0.2)" stroke="#7F5CFF" strokeWidth="2" className="drop-shadow-[0_0_10px_rgba(127,92,255,0.5)] animate-[pulse_3s_infinite]" />
        
        {/* Data Points */}
        {axes.map((axis, i) => {
           const p = getPoint(axis.val, i);
           return <circle key={i} cx={p.x} cy={p.y} r="2" fill={axis.color} stroke="#000" />;
        })}
      </svg>
    </div>
  );
};

// ... (DailyQuoteModal 保持不变) ...
export const DailyQuoteModal = ({ show, onClose, data, isLoading, onDownload, isGenerating, ui, activePersona }: any) => {
  if (!show) return null;
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/90 backdrop-blur-md p-6 animate-[fadeIn_0.3s_ease-out]">
      <div className="w-full max-w-sm relative">
        <button onClick={onClose} className="absolute -top-12 right-0 p-2 text-gray-400 hover:text-white"><X size={24}/></button>
        <div ref={ref} className="bg-[#111] rounded-3xl border border-white/10 overflow-hidden shadow-2xl relative p-8 text-center flex flex-col items-center">
           <div className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-6 border-b border-white/5 pb-2 w-full flex justify-between"><span>{data?.date || new Date().toLocaleDateString()}</span><span className="text-[#7F5CFF]">DAILY TOXIC</span></div>
           {isLoading ? (<div className="py-10 space-y-3"><div className="w-8 h-8 border-2 border-[#7F5CFF] border-t-transparent rounded-full animate-spin mx-auto"/><p className="text-xs text-gray-500 animate-pulse">{ui.makingPoison}</p></div>) : (<><div className="text-3xl mb-6 opacity-30">❝</div><p className="text-lg font-serif text-white leading-relaxed mb-8">{data?.content}</p><div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-8">— {PERSONAS[data?.persona as PersonaType]?.name || activePersona} —</div><div className="w-full pt-4 border-t border-white/10 flex justify-between items-end"><div className="text-left"><div className="text-[9px] text-gray-600 font-bold">GET YOURS AT</div><div className="text-xs text-[#7F5CFF] font-bold tracking-wider">toughlove.online</div></div><div className="w-12 h-12 bg-white p-1 rounded-md flex items-center justify-center overflow-hidden"><img src="/qrcode.png" alt="QR Code" className="w-full h-full object-contain" /></div></div></>)}
        </div>
        {!isLoading && (<button onClick={() => onDownload(ref)} disabled={isGenerating} className="w-full mt-6 py-3.5 rounded-xl bg-white text-black font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.2)]">{isGenerating ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"/> : <Share2 size={16} />}{ui.save}</button>)}
      </div>
    </div>
  );
};

// --- 🔥 2. Profile Modal (集成雷达图) ---
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
             
             {isLoading ? (
                <div className="py-10 text-center space-y-3"><div className="w-8 h-8 border-2 border-[#7F5CFF] border-t-transparent rounded-full animate-spin mx-auto"/><p className="text-xs text-gray-500 animate-pulse">{ui.analyzing}</p></div>
             ) : (
                <div className="space-y-6">
                    {/* 🔥 雷达图插入位置 */}
                    {data?.radar ? (
                        <RadarChart data={data.radar} />
                    ) : (
                        <div className="text-center text-gray-600 text-xs py-4">Not enough data for chart.</div>
                    )}

                    <div className="bg-[#111] p-4 rounded-xl border-l-2 border-[#7F5CFF] relative">
                        <div className="absolute -top-3 left-3 bg-[#050505] px-1 text-[10px] font-bold text-[#7F5CFF]">{ui.diagnosisTitle}</div>
                        <p className="text-sm text-gray-300 leading-relaxed italic font-serif">"{data?.diagnosis}"</p>
                    </div>
                    
                    <div className="text-center text-[9px] text-gray-700 pt-4 border-t border-white/5">GENERATED BY TOUGHLOVE AI</div>
                </div>
             )}
           </div>
        </div>
        {!isLoading && (<button onClick={() => onDownload(ref)} disabled={isGenerating} className="w-full mt-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors">{isGenerating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <ImageIcon size={16} />}{ui.saveCard}</button>)}
      </div>
    </div>
  );
};

// ... (Shame, Glory, Diary, Energy 保持不变，直接保留) ...
// (为了篇幅，请确保下方包含之前的 ShameModal, GloryModal, DiaryModal, EnergyModal 的完整代码)
export const ShameModal = ({ show, onClose, data, lang, onDownload, isGenerating, ui }: any) => {
    if (!show) return null;
    const ref = useRef<HTMLDivElement>(null);
    return (
      <div className="fixed inset-0 z-[600] flex items-center justify-center bg-red-950/90 backdrop-blur-md p-6 animate-[fadeIn_0.3s_ease-out]">
        <div className="w-full max-w-sm relative">
          <button onClick={onClose} className="absolute -top-12 right-0 p-2 text-white/50 hover:text-white"><X size={24}/></button>
          <div ref={ref} className="bg-[#0a0a0a] rounded-xl border-2 border-red-600 shadow-[0_0_50px_rgba(220,38,38,0.3)] overflow-hidden relative p-8 text-center flex flex-col items-center">
             <div className="absolute top-4 -right-8 rotate-45 bg-red-600 text-black text-[10px] font-black py-1 px-10 tracking-widest border border-red-400">FAILED</div>
             <div className="text-sm font-black text-red-600 uppercase tracking-[0.3em] mb-6 border-b border-red-900/30 pb-2 w-full">{ui.shameTitle}</div>
             <div className="w-24 h-24 rounded-full border-2 border-red-600/50 mb-6 overflow-hidden grayscale contrast-125"><img src={PERSONAS.Sol.avatar} alt="Sol" className="w-full h-full object-cover" /></div>
             <div className="text-lg text-gray-300 font-serif leading-relaxed mb-6"><span className="font-bold text-white border-b border-white/20 pb-0.5">{data?.name}</span><span className="mx-1 text-sm text-gray-400">{ui.shameContent}</span><span className="font-mono font-bold text-red-500 text-xl mx-1">{data?.duration}</span><span className="text-sm text-gray-400">{lang === 'zh' ? '分钟' : 'mins'}</span><div className="mt-1 text-sm text-gray-400">{ui.shameAction}</div></div>
             <div className="text-xs font-bold text-red-800 uppercase tracking-widest mb-6 animate-pulse">— {ui.shameFooter} —</div>
             <div className="w-full pt-4 border-t border-white/5 flex justify-between items-end"><div className="text-left"><div className="text-[9px] text-gray-600 font-bold">DATE: {data?.date}</div><div className="text-[10px] text-red-600 font-bold tracking-wider">toughlove.online</div></div><div className="w-8 h-8 bg-red-900/20 rounded flex items-center justify-center"><QrCode size={16} className="text-red-600" /></div></div>
          </div>
          <button onClick={() => onDownload(ref)} disabled={isGenerating} className="w-full mt-6 py-3.5 rounded-xl bg-red-600 text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-red-700 transition-colors shadow-lg">{isGenerating ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> : <Share2 size={16} />}{ui.saveShame}</button>
        </div>
      </div>
    );
};

export const GloryModal = ({ show, onClose, data, lang, onDownload, isGenerating, ui }: any) => {
    if (!show) return null;
    const ref = useRef<HTMLDivElement>(null);
    return (
      <div className="fixed inset-0 z-[600] flex items-center justify-center bg-pink-950/90 backdrop-blur-md p-6 animate-[fadeIn_0.3s_ease-out]">
        <div className="w-full max-w-sm relative">
          <button onClick={onClose} className="absolute -top-12 right-0 p-2 text-white/50 hover:text-white"><X size={24}/></button>
          <div ref={ref} className="bg-[#fff0f5] rounded-xl border-4 border-pink-400 shadow-[0_0_60px_rgba(236,72,153,0.3)] overflow-hidden relative p-8 text-center flex flex-col items-center">
             <div className="absolute top-6 right-6 rotate-12 w-20 h-20 border-4 border-pink-500 rounded-full flex items-center justify-center text-pink-500 font-black text-xs tracking-widest opacity-20 pointer-events-none">GOOD JOB</div>
             <div className="text-sm font-black text-pink-500 uppercase tracking-[0.3em] mb-6 border-b border-pink-200 pb-2 w-full">{ui.gloryTitle}</div>
             <div className="w-24 h-24 rounded-full border-2 border-pink-300 mb-6 overflow-hidden bg-pink-100 flex items-center justify-center shadow-inner"><img src={PERSONAS.Rin.avatar} alt="Rin" className="w-full h-full object-cover" /></div>
             <div className="text-lg text-gray-700 font-serif leading-relaxed mb-6"><span className="font-bold text-black border-b border-pink-300 pb-0.5">{data?.name}</span><span className="mx-1 text-sm text-gray-500">{ui.gloryContent}</span><div className="font-bold text-pink-600 text-xl my-2">「 {data?.task} 」</div><div className="mt-1 text-sm text-gray-500">{ui.gloryAction}</div></div>
             <div className="text-xs font-bold text-pink-400 uppercase tracking-widest mb-6">— {ui.gloryFooter} —</div>
             <div className="w-full pt-4 border-t border-pink-200 flex justify-between items-end"><div className="text-left"><div className="text-[9px] text-gray-400 font-bold">DATE: {data?.date}</div><div className="text-[10px] text-pink-400 font-bold tracking-wider">toughlove.online</div></div><div className="w-10 h-10 bg-white p-1 rounded flex items-center justify-center"><img src="/qrcode.png" alt="QR" className="w-full h-full object-contain" /></div></div>
          </div>
          <button onClick={() => onDownload(ref)} disabled={isGenerating} className="w-full mt-6 py-3.5 rounded-xl bg-pink-500 text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-pink-600 transition-colors shadow-lg">{isGenerating ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> : <Share2 size={16} />}{ui.saveGlory}</button>
        </div>
      </div>
    );
};

export const DiaryModal = ({ show, onClose, userId, lang }: any) => {
  if (!show) return null;
  const [step, setStep] = useState<'write' | 'analyzing' | 'result'>('write');
  const [content, setContent] = useState("");
  const [result, setResult] = useState<any>(null);
  const [isConsent, setIsConsent] = useState(false);

  const t = {
    title: lang === 'zh' ? "Echo 的心灵镜像" : "Echo's Mirror",
    placeholder: lang === 'zh' ? "此刻，你最真实的感觉是什么？..." : "Tell me. What's weighing on your mind?",
    privacy: lang === 'zh' ? "* 原文将阅后即焚，仅保留洞察归档。" : "* Content will be burnt after analysis.",
    consent: lang === 'zh' ? "允许 Echo 结合今日对话深度分析" : "Allow Echo to analyze with today's chat",
    btnAnalyze: lang === 'zh' ? "开始深度分析" : "Analyze",
    btnAnalyzing: lang === 'zh' ? "正在读取潜意识..." : "Reading your subconscious...",
    btnClose: lang === 'zh' ? "关闭" : "Close",
    tagTitle: lang === 'zh' ? "情绪快照" : "Emotional Snapshot"
  };

  const handleAnalyze = async () => {
    if (!content.trim()) return;
    if (!isConsent) {
        alert(lang === 'zh' ? "请先勾选授权" : "Please check consent first");
        return;
    }
    setStep('analyzing');
    try {
      const res = await fetch('/api/diary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, userId })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
      setStep('result');
    } catch (e) {
      alert("Echo 似乎走神了...");
      setStep('write');
    }
  };

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/90 backdrop-blur-md p-6 animate-[fadeIn_0.3s_ease-out]">
      <div className="w-full max-w-sm bg-[#0a0a0a] border border-indigo-500/30 rounded-2xl p-6 relative flex flex-col min-h-[420px]">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={20}/></button>
        
        <div className="mb-4 flex items-center gap-2 text-indigo-400 font-bold uppercase tracking-widest text-xs">
          <BookHeart size={14} /> {t.title}
        </div>

        {step === 'write' && (
          <>
            <textarea 
              className="flex-1 bg-[#111] rounded-xl p-4 text-gray-200 text-sm focus:outline-none resize-none mb-4 font-serif leading-relaxed border border-white/5 focus:border-indigo-500/50 transition-colors"
              placeholder={t.placeholder}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            <div 
                className="flex items-center gap-2 mb-4 cursor-pointer opacity-80 hover:opacity-100 transition-opacity"
                onClick={() => setIsConsent(!isConsent)}
            >
                {isConsent ? <CheckSquare size={16} className="text-indigo-500"/> : <Square size={16} className="text-gray-600"/>}
                <span className="text-xs text-gray-400 select-none">{t.consent}</span>
            </div>
            <div className="text-[10px] text-gray-600 mb-4">{t.privacy}</div>
            <button onClick={handleAnalyze} disabled={!content.trim()} className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed">{t.btnAnalyze}</button>
          </>
        )}

        {step === 'analyzing' && (
          <div className="flex-1 flex flex-col items-center justify-center animate-pulse">
            <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"/>
            <p className="text-indigo-400 text-xs">{t.btnAnalyzing}</p>
          </div>
        )}

        {step === 'result' && result && (
          <div className="flex-1 flex flex-col animate-[fadeIn_0.5s_ease-out]">
            <div className="mb-6 text-center">
              <div className="text-[10px] text-gray-500 uppercase mb-2">{t.tagTitle}</div>
              <div className="flex flex-wrap gap-2 justify-center">
                {result.tags?.map((t:string, i:number) => (
                  <span key={i} className="px-3 py-1 bg-indigo-500/10 text-indigo-300 text-xs rounded-full border border-indigo-500/20">#{t}</span>
                ))}
              </div>
            </div>
            <div className="bg-[#111] p-5 rounded-xl border-l-2 border-indigo-500 mb-6 relative">
              <div className="absolute -top-2.5 left-2 bg-[#111] px-1 text-[9px] text-indigo-500 font-bold">INSIGHT</div>
              <p className="text-gray-300 italic text-sm leading-relaxed font-serif">"{result.insight}"</p>
            </div>
            <button onClick={onClose} className="mt-auto w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white text-sm">{t.btnClose}</button>
          </div>
        )}
      </div>
    </div>
  );
};

export const EnergyModal = ({ show, onClose, onTriggerTask, userId, lang, updateTrigger }: any) => {
  if (!show) return null;
  const [stamps, setStamps] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (show && userId) {
      setLoading(true);
      const fetchStamps = async () => {
          await new Promise(r => setTimeout(r, 600));
          try {
            const res = await fetch(`/api/event?userId=${userId}&type=glory_rin&limit=9&t=${Date.now()}`);
            const json = await res.json();
            if (json.data) setStamps(json.data);
          } catch (e) {
            console.error("Fetch energy failed", e);
          } finally {
            setLoading(false);
          }
      };
      fetchStamps();
    }
  }, [show, userId, updateTrigger]); 

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center bg-pink-950/90 backdrop-blur-md p-6 animate-[fadeIn_0.2s_ease-out]">
      <div className="w-full max-w-sm bg-[#0a0a0a] border border-pink-500/30 rounded-2xl p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={20}/></button>

        <div className="text-center mb-6">
           <div className="inline-flex p-3 bg-pink-500/10 rounded-full text-pink-400 mb-2"><Zap size={24} fill="currentColor" /></div>
           <h2 className="text-xl font-bold text-white uppercase tracking-wider">{lang === 'zh' ? '能量补给站' : 'ENERGY STATION'}</h2>
           <p className="text-xs text-gray-500">{lang === 'zh' ? '看看你收集的小红花，或者再来一朵。' : 'Check your glory, or earn more.'}</p>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-8 min-h-[200px]">
           {loading ? (
             <div className="col-span-3 flex flex-col items-center justify-center text-pink-500/50 gap-2">
                <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin"/>
                <span className="text-xs">Loading...</span>
             </div>
           ) : (
             Array.from({ length: 9 }).map((_, i) => {
                const stamp = stamps[i];
                return (
                  <div key={i} className={`aspect-square rounded-xl border flex flex-col items-center justify-center relative overflow-hidden transition-all ${stamp ? 'bg-pink-500/10 border-pink-500/50' : 'bg-[#111] border-white/5 border-dashed'}`}>
                     {stamp ? (
                       <>
                         <div className="absolute inset-0 bg-pink-500/5 animate-pulse"></div>
                         <Flower2 size={24} className="text-pink-500 mb-1 relative z-10" />
                         <span className="text-[8px] text-pink-300/70 relative z-10 font-mono">{new Date(stamp.created_at).toLocaleDateString(undefined, {month:'numeric', day:'numeric'})}</span>
                       </>
                     ) : (
                       <span className="text-white/10 text-xs">Empty</span>
                     )}
                  </div>
                );
             })
           )}
        </div>

        <button onClick={onTriggerTask} className="w-full py-4 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(219,39,119,0.4)] animate-pulse active:scale-95 transition-transform">
           <Flower2 size={16} />
           {lang === 'zh' ? '我需要充个电 (获取任务)' : 'I NEED ENERGY (NEW TASK)'}
        </button>
      </div>
    </div>
  );
};