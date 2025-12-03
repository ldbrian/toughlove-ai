import { useState, useEffect } from 'react';
import { Fingerprint, ArrowRight, Activity, ScanFace, Brain, Shield, Zap, CheckCircle } from 'lucide-react';
import { ONBOARDING_QUESTIONS, PERSONAS, PersonaType } from '@/lib/constants';

// --- 简易雷达图组件 (复用版) ---
const RadarChart = ({ data }: { data: number[] }) => {
  const size = 160;
  const center = size / 2;
  const radius = 60;
  const sides = 5;
  const angleSlice = (Math.PI * 2) / sides;

  const getPoints = (values: number[], scale = 1) => {
    return values.map((val, i) => {
      const angle = i * angleSlice - Math.PI / 2;
      const r = (val / 100) * radius * scale;
      const x = center + r * Math.cos(angle);
      const y = center + r * Math.sin(angle);
      return `${x},${y}`;
    }).join(' ');
  };

  const fullPoly = getPoints([100, 100, 100, 100, 100]);
  const dataPoly = getPoints(data);
  const gridPoly = getPoints([50, 50, 50, 50, 50]);

  return (
    <div className="relative w-[160px] h-[160px] mx-auto my-4">
      <svg width={size} height={size} className="overflow-visible">
        <polygon points={fullPoly} fill="none" stroke="#333" strokeWidth="1" />
        <polygon points={gridPoly} fill="none" stroke="#222" strokeDasharray="4 4" />
        {[0, 1, 2, 3, 4].map(i => {
           const angle = i * angleSlice - Math.PI / 2;
           const x = center + radius * Math.cos(angle);
           const y = center + radius * Math.sin(angle);
           return <line key={i} x1={center} y1={center} x2={x} y2={y} stroke="#222" />;
        })}
        <polygon points={dataPoly} fill="rgba(127, 92, 255, 0.4)" stroke="#7F5CFF" strokeWidth="2" />
        {data.map((val, i) => {
           const angle = i * angleSlice - Math.PI / 2;
           const r = (val / 100) * radius;
           const x = center + r * Math.cos(angle);
           const y = center + r * Math.sin(angle);
           return <circle key={i} cx={x} cy={y} r="3" fill="#fff" />;
        })}
      </svg>
      {/* 极简标签 */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 text-[9px] text-gray-500">REALITY</div>
      <div className="absolute bottom-[20%] right-0 translate-x-2 text-[9px] text-gray-500">EGO</div>
      <div className="absolute bottom-[20%] left-0 -translate-x-2 text-[9px] text-gray-500">CHAOS</div>
    </div>
  );
};

interface OnboardingModalProps {
  show: boolean;
  onFinish: (profile: any) => void;
  lang: 'zh' | 'en';
}

export const OnboardingModal = ({ show, onFinish, lang }: OnboardingModalProps) => {
  const [step, setStep] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResult, setShowResult] = useState(false); // 🔥 新增：控制结果页显示
  const [resultProfile, setResultProfile] = useState<any>(null); // 🔥 新增：存储计算结果

  const [scores, setScores] = useState<Record<string, number>>({
    reality: 50, ego: 50, empathy: 50, will: 50, chaos: 50
  });

  if (!show) return null;

  const currentQ = ONBOARDING_QUESTIONS[step];

  const handleAnswer = (dimension: string, score: number) => {
    setScores(prev => ({
      ...prev,
      [dimension]: Math.min(100, Math.max(0, (prev[dimension] || 50) + (score - 50) * 0.8))
    }));

    if (step < ONBOARDING_QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      calculateResult(); // 改为计算结果，而不是直接结束
    }
  };

  const calculateResult = () => {
    setIsAnalyzing(true);
    
    setTimeout(() => {
      const dominantDim = Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);
      
      const dimToPersona: Record<string, PersonaType> = {
        reality: 'Rin', ego: 'Ash', empathy: 'Echo', will: 'Sol', chaos: 'Vee'
      };

      const pKey = dimToPersona[dominantDim] || 'Ash';
      
      // 生成结果画像
      const profile = {
        radar: [scores.reality, scores.ego, scores.empathy, scores.will, scores.chaos],
        tags: lang === 'zh' ? ["初次觉醒", dominantDim.toUpperCase()] : ["Awakened", dominantDim.toUpperCase()],
        diagnosis: lang === 'zh' 
          ? `检测到${dominantDim}维度波动异常。建议接入 ${PERSONAS[pKey].name} 进行深度干预。`
          : `High fluctuation in ${dominantDim} dimension. Recommended link with ${PERSONAS[pKey].name}.`,
        dominant: pKey
      };

      setResultProfile(profile);
      setIsAnalyzing(false);
      setShowResult(true); // 🔥 展示结果页
    }, 1500);
  };

  // 点击最终确认按钮
  const handleFinalAccept = () => {
      if (resultProfile) {
          onFinish(resultProfile);
      }
  };

  const getPersonaForDimension = (dim: string): PersonaType => {
     switch(dim) {
         case 'reality': return 'Rin';
         case 'ego': return 'Ash';
         case 'empathy': return 'Echo';
         case 'will': return 'Sol';
         case 'chaos': return 'Vee';
         default: return 'Ash';
     }
  };

  // --- Render: 结果页 (Result View) ---
  if (showResult && resultProfile) {
      const p = PERSONAS[resultProfile.dominant as PersonaType];
      return (
        <div className="fixed inset-0 z-[300] bg-[#050505] flex items-center justify-center p-4 animate-[fadeIn_0.5s_ease-out]">
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 pointer-events-none mix-blend-overlay"></div>
            
            <div className="w-full max-w-sm bg-[#111] border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
                {/* 顶部装饰 */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#7F5CFF] to-transparent opacity-50"></div>
                
                <div className="text-center mb-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#7F5CFF]/10 border border-[#7F5CFF]/20 text-[#7F5CFF] text-[10px] font-bold tracking-widest mb-4">
                        <CheckCircle size={12} /> DIAGNOSIS COMPLETE
                    </div>
                    <h2 className="text-2xl font-black text-white italic">
                        {lang === 'zh' ? "精神诊断书" : "PSYCHE REPORT"}
                    </h2>
                    <p className="text-xs text-gray-500 font-mono mt-1">ID: {Math.floor(Math.random()*100000).toString().padStart(6,'0')}</p>
                </div>

                {/* 雷达图 */}
                <div className="bg-black/40 rounded-xl border border-white/5 p-4 mb-6 relative">
                    <RadarChart data={resultProfile.radar} />
                    <div className="absolute bottom-2 right-2 text-[9px] text-gray-600 font-mono">
                        SYNC: 100%
                    </div>
                </div>

                {/* 匹配结果 */}
                <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/10 mb-6">
                    <div className="w-12 h-12 rounded-full border-2 border-[#7F5CFF]/50 overflow-hidden shrink-0">
                        <img src={p.avatar} className="w-full h-full object-cover" />
                    </div>
                    <div>
                        <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Recommended Link</div>
                        <div className="text-lg font-bold text-white flex items-center gap-2">
                            {p.name} 
                            <span className="text-[10px] bg-[#7F5CFF] text-white px-1.5 py-0.5 rounded">MATCH</span>
                        </div>
                    </div>
                </div>

                {/* 诊断语 */}
                <p className="text-xs text-gray-400 text-center mb-8 leading-relaxed px-4">
                    "{resultProfile.diagnosis}"
                </p>

                {/* 确认按钮 */}
                <button 
                    onClick={handleFinalAccept}
                    className="w-full py-4 bg-white text-black font-black rounded-xl hover:bg-gray-200 transition-all active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.2)] flex items-center justify-center gap-2"
                >
                    <Zap size={18} className="fill-current" />
                    {lang === 'zh' ? "接受诊断并接入" : "ACCEPT & INITIALIZE"}
                </button>
            </div>
        </div>
      );
  }

  // --- Render: 答题页 (Question View) ---
  return (
    <div className="fixed inset-0 z-[300] bg-black flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 pointer-events-none mix-blend-overlay"></div>
      
      <div className="w-full max-w-md relative z-10 animate-[fadeIn_0.5s_ease-out]">
        
        {/* Header */}
        <div className="mb-8">
           <div className="flex justify-between items-end mb-4">
              <div className="flex items-center gap-2 text-[#7F5CFF]">
                 <ScanFace className="animate-pulse" />
                 <span className="font-mono text-xs tracking-widest font-bold">
                    {isAnalyzing ? "ANALYZING..." : `SCANNING: ${step + 1}/${ONBOARDING_QUESTIONS.length}`}
                 </span>
              </div>
              <span className="text-[10px] text-gray-500 font-mono">v2.3.0</span>
           </div>
           
           <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden mb-6">
              <div 
                className="h-full bg-[#7F5CFF] transition-all duration-500 ease-out shadow-[0_0_10px_#7F5CFF]" 
                style={{ width: `${((step + 1) / ONBOARDING_QUESTIONS.length) * 100}%` }}
              ></div>
           </div>

           {!isAnalyzing ? (
               <h2 className="text-2xl font-bold text-white leading-tight animate-[slideUp_0.3s_ease-out]">
                 {lang === 'zh' ? currentQ.text.zh : currentQ.text.en}
               </h2>
           ) : (
               <div className="text-center py-10 space-y-4">
                   <Activity size={48} className="text-[#7F5CFF] mx-auto animate-bounce" />
                   <h2 className="text-2xl font-bold text-white animate-pulse">
                       {lang === 'zh' ? "正在生成精神镜像..." : "Generating Psyche Mirror..."}
                   </h2>
               </div>
           )}
        </div>

        {/* Options */}
        {!isAnalyzing && (
            <div className="space-y-4">
              {currentQ.options.map((opt: any, idx: number) => {
                const pKey = getPersonaForDimension(opt.dimension);
                return (
                    <button
                      key={idx}
                      onClick={() => handleAnswer(opt.dimension, opt.score)}
                      className="w-full p-5 flex items-center gap-5 bg-[#111] border border-white/10 hover:bg-[#1a1a1a] hover:border-[#7F5CFF] transition-all rounded-xl group text-left relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-[#7F5CFF]/0 to-[#7F5CFF]/10 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500"></div>
                      <div className="w-10 h-10 rounded-full overflow-hidden border border-white/20 flex-shrink-0 group-hover:scale-110 transition-transform relative z-10 grayscale group-hover:grayscale-0">
                          <img src={PERSONAS[pKey].avatar} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="flex-1 relative z-10">
                        <span className="text-gray-300 font-medium group-hover:text-white transition-colors text-sm">
                          {lang === 'zh' ? opt.text.zh : opt.text.en}
                        </span>
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