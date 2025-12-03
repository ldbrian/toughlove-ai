import { useState, useEffect } from 'react';
import { 
  ArrowRight, Activity, ScanFace, Brain, CheckCircle, Zap, 
  Lock, AlertTriangle, Eye, XCircle 
} from 'lucide-react';
import { ONBOARDING_QUESTIONS, DEEP_QUESTIONS, PERSONAS, PersonaType } from '@/lib/constants';

// ==========================================
// 1. Helper Constants & Types
// ==========================================

const FUZZY_ARCHETYPES: Record<string, { zh: string, en: string }> = {
  reality: { zh: "现实观测者", en: "Reality Observer" },
  ego: { zh: "独行客", en: "The Soloist" },
  empathy: { zh: "共感游魂", en: "Empath Ghost" },
  will: { zh: "潜伏火种", en: "Dormant Fire" },
  chaos: { zh: "熵增实体", en: "Entropy Entity" }
};

interface OnboardingModalProps {
  show: boolean;
  onFinish: (profile: any) => void;
  lang: 'zh' | 'en';
}

// ==========================================
// 2. Components
// ==========================================

const RadarChart = ({ data, color = "#7F5CFF", opacity = 0.4, isGlitch = false }: { data: number[], color?: string, opacity?: number, isGlitch?: boolean }) => {
  const points = data.map((val, i) => {
    const angle = i * (Math.PI * 2 / 5) - Math.PI / 2;
    const glitchOffset = isGlitch ? (Math.random() - 0.5) * 15 : 0; 
    const r = (val / 100) * 60 + glitchOffset;
    return `${80 + r * Math.cos(angle)},${80 + r * Math.sin(angle)}`;
  }).join(' ');
  
  return (
    <div className={`relative w-[160px] h-[160px] mx-auto my-4 ${isGlitch ? 'animate-pulse' : ''}`}>
      <svg width="160" height="160" className="overflow-visible">
        <polygon points="80,20 137,62 115,130 45,130 23,62" fill="none" stroke="#333" strokeWidth="1" />
        <circle cx="80" cy="80" r="30" fill="none" stroke="#222" strokeWidth="1" strokeDasharray="4 4" />
        <polygon points={points} fill={color} fillOpacity={opacity} stroke={color} strokeWidth={isGlitch ? 1 : 2} className="drop-shadow-[0_0_8px_rgba(127,92,255,0.5)]" />
        {isGlitch && (
           <>
             <polygon points={points} fill="none" stroke="#ef4444" strokeWidth="1" strokeOpacity="0.5" className="animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]" style={{ transformOrigin: 'center', transform: 'scale(1.05)' }} />
             <line x1="0" y1="80" x2="160" y2="80" stroke="#ef4444" strokeWidth="1" strokeOpacity="0.2" />
           </>
        )}
      </svg>
      {isGlitch && <div className="absolute inset-0 bg-red-500/10 mix-blend-overlay animate-pulse rounded-full blur-xl"></div>}
    </div>
  );
};

export const OnboardingModal = ({ show, onFinish, lang }: OnboardingModalProps) => {
  const [stage, setStage] = useState<'L0' | 'PROMPT' | 'L1' | 'RESULT'>('L0');
  const [step, setStep] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scores, setScores] = useState<Record<string, number>>({ reality: 50, ego: 50, empathy: 50, will: 50, chaos: 50 });
  const [resultProfile, setResultProfile] = useState<any>(null);
  
  // 🔥 [FIX] 客户端生成随机ID，避免 Hydration Mismatch
  const [randomId, setRandomId] = useState("000000");
  useEffect(() => {
    setRandomId(Math.floor(Math.random() * 100000).toString().padStart(6, '0'));
  }, []);

  if (!show) return null;

  const currentQuestions = stage === 'L0' ? ONBOARDING_QUESTIONS : DEEP_QUESTIONS;
  const currentQ = currentQuestions[step];

  const getText = (content: any) => {
    if (typeof content === 'string') return content;
    return lang === 'zh' ? content.zh : content.en;
  };

  const handleAnswer = (dimension: string, score: number) => {
    setScores(prev => ({
      ...prev,
      [dimension]: Math.min(100, Math.max(0, (prev[dimension] || 50) + (score - 50) * (stage === 'L1' ? 1.0 : 0.6)))
    }));

    if (step < currentQuestions.length - 1) {
      setStep(step + 1);
    } else {
      if (stage === 'L0') {
        setIsAnalyzing(true);
        setTimeout(() => { setIsAnalyzing(false); setStage('PROMPT'); }, 1200);
      } else {
        finishAssessment(true);
      }
    }
  };

  // 🔥 [FIX] 增加参数，如果是模糊诊断，不展示 Result 页，直接结束
  const finishAssessment = (isDeep: boolean) => {
    const dominantDim = Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);
    const dimToPersona: Record<string, PersonaType> = { reality: 'Rin', ego: 'Ash', empathy: 'Echo', will: 'Sol', chaos: 'Vee' };
    const pKey = dimToPersona[dominantDim] || 'Ash';
    
    const profile = {
      radar: [scores.reality, scores.ego, scores.empathy, scores.will, scores.chaos],
      tags: [lang === 'zh' ? "觉醒" : "Awakened", dominantDim.toUpperCase()],
      diagnosis: lang === 'zh' ? `检测到${dominantDim}波动。建议接入${PERSONAS[pKey].name}。` : `Detected ${dominantDim} flux. Link ${PERSONAS[pKey].name}.`,
      dominant: pKey,
      isDeep
    };
    
    setResultProfile(profile);

    if (!isDeep) {
       // 模糊模式：直接退出，不渲染 Result 页，防止双重弹窗
       onFinish(profile);
    } else {
       // 深度诊断：展示动画后进入 Result 页
       setIsAnalyzing(true);
       setTimeout(() => {
          setStage('RESULT');
          setIsAnalyzing(false);
       }, 2000);
    }
  };

  // 渲染结果页 (仅在深度诊断后显示)
  if (stage === 'RESULT' && resultProfile) {
      const p = PERSONAS[resultProfile.dominant as PersonaType];
      return (
        <div className="fixed inset-0 z-[300] bg-[#050505] flex items-center justify-center p-4 animate-[fadeIn_0.5s_ease-out]">
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 pointer-events-none mix-blend-overlay"></div>
            
            <div className="w-full max-w-sm bg-[#111] border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#7F5CFF] to-transparent opacity-80 shadow-[0_0_10px_#7F5CFF]"></div>
                
                <div className="text-center mb-6 relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#7F5CFF]/10 border border-[#7F5CFF]/30 text-[#7F5CFF] text-[10px] font-bold tracking-widest mb-4 shadow-[0_0_10px_rgba(127,92,255,0.2)]">
                        <CheckCircle size={12} /> {lang === 'zh' ? "诊断完成" : "DIAGNOSIS COMPLETE"}
                    </div>
                    <h2 className="text-3xl font-black text-white italic tracking-tighter">
                        {lang === 'zh' ? "精神诊断书" : "PSYCHE REPORT"}
                    </h2>
                    <div className="flex justify-center items-center gap-2 mt-2 opacity-50">
                        <span className="h-px w-8 bg-gray-500"></span>
                        <p className="text-[10px] text-gray-400 font-mono">ID: {randomId} // DEEP_SCAN</p>
                        <span className="h-px w-8 bg-gray-500"></span>
                    </div>
                </div>

                <div className="bg-black/40 rounded-xl border border-white/5 p-4 mb-6 relative">
                    <RadarChart data={resultProfile.radar} />
                    <div className="absolute bottom-2 right-2 flex flex-col items-end">
                        <div className="text-[9px] text-gray-500 font-mono">SYNC RATE</div>
                        <div className="text-xl font-bold text-[#7F5CFF] font-mono leading-none">100%</div>
                    </div>
                </div>

                <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/10 mb-6 backdrop-blur-md">
                    <div className="w-12 h-12 rounded-full border-2 border-[#7F5CFF] overflow-hidden shrink-0 shadow-[0_0_15px_rgba(127,92,255,0.4)]">
                        <img src={p.avatar} className="w-full h-full object-cover" />
                    </div>
                    <div>
                        <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">{lang === 'zh' ? "推荐链接对象" : "Recommended Link"}</div>
                        <div className="text-lg font-bold text-white flex items-center gap-2">
                            {p.name} <span className="text-[10px] bg-[#7F5CFF] text-white px-1.5 py-0.5 rounded font-bold">MATCH</span>
                        </div>
                    </div>
                </div>

                <p className="text-xs text-gray-300 text-center mb-8 leading-relaxed px-4 border-l-2 border-[#7F5CFF]/30 pl-4 italic">
                    "{resultProfile.diagnosis}"
                </p>

                <button onClick={() => onFinish(resultProfile)} className="w-full py-4 bg-white text-black font-black rounded-xl hover:bg-gray-200 transition-all active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.3)] flex items-center justify-center gap-2 group-hover:scale-[1.02]">
                    <Zap size={18} className="fill-current text-[#7F5CFF]" />
                    {lang === 'zh' ? "接受诊断并接入" : "ACCEPT & INITIALIZE"}
                </button>
            </div>
        </div>
      );
  }

  // 渲染 PROMPT 页 (模糊诊断展示)
  if (stage === 'PROMPT') {
      const currentRadar = [scores.reality, scores.ego, scores.empathy, scores.will, scores.chaos];
      const dominantDim = Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);
      const fuzzyTag = FUZZY_ARCHETYPES[dominantDim] ? (lang === 'zh' ? FUZZY_ARCHETYPES[dominantDim].zh : FUZZY_ARCHETYPES[dominantDim].en) : "???";

      return (
        <div className="fixed inset-0 z-[300] bg-black flex items-center justify-center p-4 animate-[fadeIn_0.5s_ease-out]">
           <div className="absolute inset-0 bg-[url('/noise.png')] opacity-15 pointer-events-none mix-blend-overlay"></div>
           
           <div className="w-full max-w-sm bg-[#0a0a0a] border border-red-500/30 rounded-2xl p-6 relative overflow-hidden shadow-[0_0_50px_rgba(220,38,38,0.15)]">
              
              <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
                 <div className="flex items-center gap-2 text-red-500 animate-pulse">
                    <AlertTriangle size={16} />
                    <span className="font-mono text-xs font-bold tracking-widest">{lang === 'zh' ? "信号拦截中..." : "INTERCEPTING..."}</span>
                 </div>
                 <div className="px-2 py-0.5 bg-red-500/10 border border-red-500/30 rounded text-[9px] text-red-500 font-bold font-mono">
                    {lang === 'zh' ? "数据丢失" : "DATA CORRUPT"}
                 </div>
              </div>

              <div className="relative bg-black rounded-xl p-4 border border-red-500/10 mb-6 overflow-hidden group">
                  <div className="opacity-40 blur-[2px] grayscale contrast-150 transition-all duration-500 scale-95">
                      <RadarChart data={currentRadar} color="#ef4444" opacity={0.3} isGlitch={true} />
                  </div>
                  <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px] opacity-20 pointer-events-none"></div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-10 mt-2">
                      <div className="relative">
                        <div className="text-5xl font-black text-white mb-0 leading-none tracking-tighter drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">15<span className="text-xl text-gray-500">%</span></div>
                        <div className="absolute -right-6 top-0 text-[8px] text-red-500 font-bold rotate-[-15deg] border border-red-500 px-1 rounded bg-black">LOW RES</div>
                      </div>
                      <div className="text-[10px] text-gray-500 font-bold tracking-[0.3em] mb-4 uppercase">{lang === 'zh' ? "同步进度" : "SYNC PROGRESS"}</div>
                      <div className="mt-5 px-4 py-2 bg-white/5 backdrop-blur-md rounded-lg border border-white/10 flex flex-col items-center gap-1 min-w-[180px]">
                          <div className="flex items-center gap-1.5 text-[9px] text-gray-400 font-mono uppercase">
                              <Eye size={10} /> {lang === 'zh' ? "疑似人格原型" : "DETECTED ARCHETYPE"}
                          </div>
                          <div className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                             <span className="blur-[1px] opacity-70">?</span> {fuzzyTag} <span className="blur-[1px] opacity-70">?</span>
                          </div>
                      </div>
                  </div>
              </div>

              <div className="text-center mb-6 px-2">
                 <h2 className="text-xl font-black text-white leading-tight mb-2 italic">
                    {lang === 'zh' ? "无法生成精确画像" : "GENERATION FAILED"}
                 </h2>
                 <p className="text-xs text-gray-400 leading-relaxed">
                    {lang === 'zh' 
                        ? "当前样本量不足 (5/10)，系统只能捕捉到模糊的精神碎片。" 
                        : "Insufficient data (5/10). System captured only fragmented psyche shards."}
                 </p>
              </div>

              <div className="space-y-3">
                 <button 
                    onClick={() => { setStep(0); setStage('L1'); }} 
                    className="w-full py-4 bg-gradient-to-r from-[#7F5CFF] to-[#6242db] text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:brightness-110 transition-all shadow-[0_0_25px_rgba(127,92,255,0.4)] relative overflow-hidden group border border-white/10"
                 >
                    <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out"></div>
                    <Brain size={18} className="group-hover:rotate-12 transition-transform" />
                    <span className="tracking-wide">{lang === 'zh' ? "申请深度同步 (+5题)" : "DEEP SYNC (UNLOCK 100%)"}</span>
                 </button>
                 
                 <button 
                    onClick={() => finishAssessment(false)} 
                    className="w-full py-3 bg-transparent border border-white/5 text-gray-600 text-xs font-bold rounded-xl hover:bg-white/5 hover:text-white transition-colors flex items-center justify-center gap-1 group"
                 >
                    <XCircle size={12} className="group-hover:text-red-400 transition-colors" />
                    {lang === 'zh' ? "就这样，给我个大概的" : "Accept Low-Res Result"}
                 </button>
              </div>
           </div>
        </div>
      )
  }

  // 默认渲染 (答题页)
  return (
    <div className="fixed inset-0 z-[300] bg-black flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 pointer-events-none mix-blend-overlay"></div>
      <div className="w-full max-w-md relative z-10 animate-[fadeIn_0.5s_ease-out]">
        <div className="mb-8">
           <div className="flex justify-between items-end mb-4">
              <div className="flex items-center gap-2 text-[#7F5CFF]">
                 <ScanFace className="animate-pulse" />
                 <span className="font-mono text-xs tracking-widest font-bold">
                    {isAnalyzing ? (lang === 'zh' ? "分析中..." : "ANALYZING...") : `${stage === 'L1' ? (lang === 'zh' ? '深度扫描' : 'DEEP SYNC') : (lang === 'zh' ? '初步扫描' : 'L0 SCAN')}: ${step + 1}/${currentQuestions.length}`}
                 </span>
              </div>
              <span className="text-[10px] text-gray-500 font-mono">v2.3.0</span>
           </div>
           <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden mb-6">
              <div className="h-full bg-[#7F5CFF] transition-all duration-500 ease-out shadow-[0_0_10px_#7F5CFF]" style={{ width: `${((step + 1) / currentQuestions.length) * 100}%` }}></div>
           </div>
           {!isAnalyzing ? (
               <h2 className="text-xl font-bold text-white leading-snug animate-[slideUp_0.3s_ease-out]">{getText(currentQ.text)}</h2>
           ) : (
               <div className="text-center py-10 space-y-4">
                   <Activity size={48} className="text-[#7F5CFF] mx-auto animate-bounce" />
                   <h2 className="text-xl font-bold text-white animate-pulse">{lang === 'zh' ? "正在尝试连接神经元..." : "Connecting Neurons..."}</h2>
               </div>
           )}
        </div>
        {!isAnalyzing && (
            <div className="space-y-4">
              {currentQ.options.map((opt: any, idx: number) => {
                const dimToPersona: Record<string, PersonaType> = { reality: 'Rin', ego: 'Ash', empathy: 'Echo', will: 'Sol', chaos: 'Vee' };
                const pKey = dimToPersona[opt.dimension] || 'Ash';

                return (
                    <button
                      key={idx}
                      onClick={() => handleAnswer(opt.dimension, opt.score || 50)}
                      className="w-full p-5 flex items-center gap-5 bg-[#111] border border-white/10 hover:bg-[#1a1a1a] hover:border-[#7F5CFF] transition-all rounded-xl group text-left relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-[#7F5CFF]/0 to-[#7F5CFF]/10 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500"></div>
                      <div className="w-10 h-10 rounded-full overflow-hidden border border-white/20 flex-shrink-0 group-hover:scale-110 transition-transform relative z-10 grayscale group-hover:grayscale-0">
                          <img src={PERSONAS[pKey].avatar} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="flex-1 relative z-10">
                        <span className="text-gray-300 font-medium group-hover:text-white transition-colors text-sm">{getText(opt.text)}</span>
                      </div>
                      <ArrowRight size={16} className="text-[#7F5CFF] opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all relative z-10" />
                    </button>
                );
              })}
            </div>
        )}
      </div>
    </div>
  );
};