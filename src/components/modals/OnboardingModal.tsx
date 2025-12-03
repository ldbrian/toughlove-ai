import { useState, useEffect } from 'react';
import { Fingerprint, ArrowRight, Activity, ScanFace, Brain, CheckCircle, Zap, AlertTriangle, Lock, Download } from 'lucide-react';
import { ONBOARDING_QUESTIONS, DEEP_QUESTIONS, PERSONAS, PersonaType } from '@/lib/constants';

// 🔥 [FIXED] Global state removed to prevent hydration error

interface OnboardingModalProps {
  show: boolean;
  onFinish: (profile: any) => void;
  lang: 'zh' | 'en';
}

const RadarChart = ({ data, color = "#7F5CFF", opacity = 0.4 }: { data: number[], color?: string, opacity?: number }) => {
  const points = data.map((val, i) => {
    const angle = i * (Math.PI * 2 / 5) - Math.PI / 2;
    const r = (val / 100) * 60;
    return `${80 + r * Math.cos(angle)},${80 + r * Math.sin(angle)}`;
  }).join(' ');
  return (
    <div className="relative w-[160px] h-[160px] mx-auto my-4">
      <svg width="160" height="160" className="overflow-visible">
        <polygon points="80,20 137,62 115,130 45,130 23,62" fill="none" stroke="#333" strokeWidth="1" />
        <polygon points={points} fill={color} fillOpacity={opacity} stroke={color} strokeWidth="2" />
      </svg>
    </div>
  );
};

export const OnboardingModal = ({ show, onFinish, lang }: OnboardingModalProps) => {
  const [stage, setStage] = useState<'L0' | 'PROMPT' | 'L1' | 'RESULT'>('L0');
  const [step, setStep] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scores, setScores] = useState<Record<string, number>>({ reality: 50, ego: 50, empathy: 50, will: 50, chaos: 50 });
  const [resultProfile, setResultProfile] = useState<any>(null);
  
  // 🔥 [FIXED] Correctly placed useState inside the component
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
        setTimeout(() => { setIsAnalyzing(false); setStage('PROMPT'); }, 1500);
      } else {
        finishAssessment(true);
      }
    }
  };

  const finishAssessment = (isDeep: boolean) => {
    setIsAnalyzing(true);
    setTimeout(() => {
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
      setStage('RESULT');
      setIsAnalyzing(false);
    }, 2000);
  };

  if (stage === 'RESULT' && resultProfile) {
      const p = PERSONAS[resultProfile.dominant as PersonaType];
      return (
        <div className="fixed inset-0 z-[300] bg-[#050505] flex items-center justify-center p-4 animate-[fadeIn_0.5s_ease-out]">
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 pointer-events-none mix-blend-overlay"></div>
            
            <div className="w-full max-w-sm bg-[#111] border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#7F5CFF] to-transparent opacity-50"></div>
                
                <div className="text-center mb-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#7F5CFF]/10 border border-[#7F5CFF]/20 text-[#7F5CFF] text-[10px] font-bold tracking-widest mb-4">
                        <CheckCircle size={12} /> DIAGNOSIS COMPLETE
                    </div>
                    <h2 className="text-2xl font-black text-white italic">
                        {lang === 'zh' ? "精神诊断书" : "PSYCHE REPORT"}
                    </h2>
                    <p className="text-xs text-gray-500 font-mono mt-1">ID: {randomId} // {resultProfile.isDeep ? 'DEEP_SCAN' : 'L0_SCAN'}</p>
                </div>

                <div className="bg-black/40 rounded-xl border border-white/5 p-4 mb-6 relative">
                    <RadarChart data={resultProfile.radar} />
                    <div className="absolute bottom-2 right-2 text-[9px] text-[#7F5CFF] font-mono font-bold">
                        SYNC: {resultProfile.isDeep ? '100%' : '35% (FUZZY)'}
                    </div>
                </div>

                <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/10 mb-6">
                    <div className="w-12 h-12 rounded-full border-2 border-[#7F5CFF]/50 overflow-hidden shrink-0">
                        <img src={p.avatar} className="w-full h-full object-cover" />
                    </div>
                    <div>
                        <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Recommended Link</div>
                        <div className="text-lg font-bold text-white flex items-center gap-2">
                            {p.name} <span className="text-[10px] bg-[#7F5CFF] text-white px-1.5 py-0.5 rounded">MATCH</span>
                        </div>
                    </div>
                </div>

                <p className="text-xs text-gray-400 text-center mb-8 leading-relaxed px-4">"{resultProfile.diagnosis}"</p>

                <button onClick={() => onFinish(resultProfile)} className="w-full py-4 bg-white text-black font-black rounded-xl hover:bg-gray-200 transition-all active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.2)] flex items-center justify-center gap-2">
                    <Zap size={18} className="fill-current" />
                    {lang === 'zh' ? "接受诊断并接入" : "ACCEPT & INITIALIZE"}
                </button>
            </div>
        </div>
      );
  }

  // 🔥 [REVISED] The "Fuzzy" Prompt Stage
  if (stage === 'PROMPT') {
      const currentRadar = [scores.reality, scores.ego, scores.empathy, scores.will, scores.chaos];
      
      return (
        <div className="fixed inset-0 z-[300] bg-black flex items-center justify-center p-4 animate-[fadeIn_0.5s_ease-out]">
           <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 pointer-events-none mix-blend-overlay"></div>

           <div className="w-full max-w-sm bg-[#0a0a0a] border border-yellow-500/20 rounded-2xl p-6 relative overflow-hidden shadow-[0_0_50px_rgba(234,179,8,0.1)]">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                 <div className="flex items-center gap-2 text-yellow-500 animate-pulse">
                    <AlertTriangle size={16} />
                    <span className="font-mono text-xs font-bold tracking-widest">WARNING: LOW RES</span>
                 </div>
                 <div className="px-2 py-0.5 bg-red-500/10 border border-red-500/20 rounded text-[9px] text-red-500 font-bold">
                    UNSTABLE
                 </div>
              </div>

              {/* Fuzzy Portrait Visualization */}
              <div className="relative bg-black/50 rounded-xl p-4 border border-white/5 mb-6 overflow-hidden group">
                  {/* The blurred/glitched chart */}
                  <div className="opacity-30 blur-sm grayscale group-hover:blur-[2px] transition-all duration-500">
                      <RadarChart data={currentRadar} color="#eab308" opacity={0.2} />
                  </div>
                  
                  {/* Glitch Overlay */}
                  <div className="absolute inset-0 bg-[url('/noise.png')] opacity-30 pointer-events-none mix-blend-overlay"></div>
                  
                  {/* Sync Progress Overlay */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                      <div className="text-4xl font-black text-white mb-1 drop-shadow-md">15<span className="text-lg">%</span></div>
                      <div className="text-[9px] text-gray-400 uppercase tracking-[0.2em] mb-3">Sync Progress</div>
                      <div className="w-32 h-1.5 bg-gray-800 rounded-full overflow-hidden border border-white/5">
                          <div className="h-full bg-red-500 w-[15%] shadow-[0_0_10px_#ef4444]"></div>
                      </div>
                      <div className="mt-3 px-3 py-1 bg-black/60 backdrop-blur-md rounded border border-white/10 flex items-center gap-1.5">
                          <Lock size={10} className="text-gray-500" />
                          <span className="text-[10px] text-gray-400 font-mono">PORTRAIT LOCKED</span>
                      </div>
                  </div>
              </div>

              <div className="text-center mb-6">
                 <h2 className="text-lg font-bold text-white leading-tight mb-2">
                    {lang === 'zh' ? "画像生成失败" : "GENERATION FAILED"}
                 </h2>
                 <p className="text-xs text-gray-400 leading-relaxed px-2">
                    {lang === 'zh' 
                        ? "当前样本量不足 (5/10)，系统无法通过模糊数据看清你的真实面目。" 
                        : "Sample size insufficient (5/10). System cannot verify identity from vague data."}
                 </p>
              </div>

              <div className="space-y-3">
                 <button 
                    onClick={() => { setStep(0); setStage('L1'); }} 
                    className="w-full py-4 bg-gradient-to-r from-[#7F5CFF] to-[#6242db] text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:brightness-110 transition-all shadow-[0_0_20px_rgba(127,92,255,0.3)] relative overflow-hidden group"
                 >
                    <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                    <Brain size={16} />
                    <span>{lang === 'zh' ? "申请深度同步 (+5题)" : "Deep Sync (Get 100%)"}</span>
                 </button>
                 
                 <button 
                    onClick={() => finishAssessment(false)} 
                    className="w-full py-3 bg-transparent border border-white/5 text-gray-500 text-xs font-bold rounded-xl hover:bg-white/5 hover:text-gray-300 transition-colors flex items-center justify-center gap-2"
                 >
                    {lang === 'zh' ? "就这样，给我个大概的" : "Accept Vague Result"}
                    <ArrowRight size={12} />
                 </button>
              </div>
           </div>
        </div>
      )
  }

  return (
    <div className="fixed inset-0 z-[300] bg-black flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 pointer-events-none mix-blend-overlay"></div>
      <div className="w-full max-w-md relative z-10 animate-[fadeIn_0.5s_ease-out]">
        <div className="mb-8">
           <div className="flex justify-between items-end mb-4">
              <div className="flex items-center gap-2 text-[#7F5CFF]">
                 <ScanFace className="animate-pulse" />
                 <span className="font-mono text-xs tracking-widest font-bold">
                    {isAnalyzing ? "ANALYZING..." : `${stage === 'L1' ? 'DEEP SYNC' : 'SCANNING'}: ${step + 1}/${currentQuestions.length}`}
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
                const pKey = "Ash"; 
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