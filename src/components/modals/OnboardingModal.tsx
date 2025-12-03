import { useState } from 'react';
import { Fingerprint, ArrowRight, Activity, ScanFace, Brain, CheckCircle, Zap, AlertTriangle } from 'lucide-react';
import { ONBOARDING_QUESTIONS, DEEP_QUESTIONS, PERSONAS, PersonaType } from '@/lib/constants';

interface OnboardingModalProps {
  show: boolean;
  onFinish: (profile: any) => void;
  lang: 'zh' | 'en';
}

const RadarChart = ({ data }: { data: number[] }) => {
  const points = data.map((val, i) => {
    const angle = i * (Math.PI * 2 / 5) - Math.PI / 2;
    const r = (val / 100) * 60;
    return `${80 + r * Math.cos(angle)},${80 + r * Math.sin(angle)}`;
  }).join(' ');
  return (
    <div className="relative w-[160px] h-[160px] mx-auto my-4">
      <svg width="160" height="160" className="overflow-visible">
        <polygon points="80,20 137,62 115,130 45,130 23,62" fill="none" stroke="#333" strokeWidth="1" />
        <polygon points={points} fill="rgba(127, 92, 255, 0.4)" stroke="#7F5CFF" strokeWidth="2" />
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

  if (!show) return null;

  const currentQuestions = stage === 'L0' ? ONBOARDING_QUESTIONS : DEEP_QUESTIONS;
  const currentQ = currentQuestions[step];

  // 🔥 辅助函数：安全获取双语文本
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
            <div className="w-full max-w-sm bg-[#111] border border-white/10 rounded-2xl p-6 shadow-2xl relative">
                <div className="text-center mb-6"><h2 className="text-2xl font-black text-white italic">DIAGNOSIS COMPLETE</h2></div>
                <div className="bg-black/40 rounded-xl border border-white/5 p-4 mb-6"><RadarChart data={resultProfile.radar} /></div>
                <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/10 mb-6">
                    <div className="w-12 h-12 rounded-full border-2 border-[#7F5CFF] overflow-hidden"><img src={p.avatar} className="w-full h-full object-cover" /></div>
                    <div><div className="text-lg font-bold text-white">{p.name}</div><div className="text-[10px] text-gray-400">MATCHED</div></div>
                </div>
                <button onClick={() => onFinish(resultProfile)} className="w-full py-4 bg-white text-black font-black rounded-xl hover:bg-gray-200 transition-all">{lang === 'zh' ? "接受并接入" : "ACCEPT"}</button>
            </div>
        </div>
      );
  }

  if (stage === 'PROMPT') {
      return (
        <div className="fixed inset-0 z-[300] bg-black flex items-center justify-center p-4 animate-[fadeIn_0.5s_ease-out]">
           <div className="w-full max-w-sm bg-[#111] border border-yellow-500/30 rounded-2xl p-6 text-center">
              <AlertTriangle className="mx-auto text-yellow-500 mb-4" size={32} />
              <h2 className="text-xl font-black text-white mb-2">{lang === 'zh' ? "诊断模糊" : "FUZZY DIAGNOSIS"}</h2>
              <p className="text-xs text-gray-400 mb-6">Need more data for precise sync.</p>
              <button onClick={() => { setStep(0); setStage('L1'); }} className="w-full py-3 bg-[#7F5CFF] text-white font-bold rounded-xl mb-3">{lang === 'zh' ? "深度同步 (+5题)" : "Deep Sync"}</button>
              <button onClick={() => finishAssessment(false)} className="w-full py-3 text-gray-500 text-xs font-bold">{lang === 'zh' ? "就这样" : "Skip"}</button>
           </div>
        </div>
      );
  }

  return (
    <div className="fixed inset-0 z-[300] bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md relative z-10 animate-[fadeIn_0.5s_ease-out]">
        <div className="mb-8">
           <div className="flex justify-between items-end mb-4"><span className="font-mono text-xs text-[#7F5CFF] font-bold">{isAnalyzing ? "ANALYZING..." : `SCANNING: ${step + 1}/${currentQuestions.length}`}</span></div>
           <div className="w-full h-1 bg-gray-800 rounded-full mb-6"><div className="h-full bg-[#7F5CFF] transition-all duration-300" style={{ width: `${((step + 1) / currentQuestions.length) * 100}%` }}></div></div>
           {!isAnalyzing ? <h2 className="text-xl font-bold text-white">{getText(currentQ.text)}</h2> : <div className="text-center py-10"><Activity className="text-[#7F5CFF] mx-auto animate-bounce" /></div>}
        </div>
        {!isAnalyzing && (
            <div className="space-y-4">
              {currentQ.options.map((opt: any, idx: number) => {
                const pKey = "Ash"; // Simplified for brevity
                return (
                    <button key={idx} onClick={() => handleAnswer(opt.dimension, opt.score || 50)} className="w-full p-5 bg-[#111] border border-white/10 hover:border-[#7F5CFF] rounded-xl text-left">
                      <span className="text-gray-300 font-medium text-sm">{getText(opt.text)}</span>
                    </button>
                );
              })}
            </div>
        )}
      </div>
    </div>
  );
};