

import { useState, useRef } from 'react';
import { Fingerprint, Brain, Tag, Sparkles, Share2, ArrowRight } from 'lucide-react';
import { ONBOARDING_QUESTIONS, PERSONAS, PersonaType } from '@/lib/constants';
import html2canvas from 'html2canvas';

interface OnboardingModalProps {
  show: boolean;
  onFinish: (profile: any) => void;
  lang: 'zh' | 'en';
}

const getPersonaForDimension = (dim: string): PersonaType => {
  const map: Record<string, PersonaType> = { 'order': 'Sol', 'chaos': 'Vee', 'energy': 'Rin', 'reality': 'Ash', 'insight': 'Echo' };
  return map[dim] || 'Ash';
};

export function OnboardingModal({ show, onFinish, lang }: OnboardingModalProps) {
  const [step, setStep] = useState<'intro' | 'question' | 'analyzing' | 'result'>('intro');
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [scores, setScores] = useState<Record<string, number>>({ order: 0, chaos: 0, energy: 0, reality: 0, insight: 0 });
  const [resultTag, setResultTag] = useState<{ label: string, desc: string, persona: PersonaType } | null>(null);
  
  const resultRef = useRef<HTMLDivElement>(null); // 用于截图

  const noiseBg = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E")`;

  if (!show) return null;

  const handleStart = () => setStep('question');

  const handleAnswer = (dimension: string, value: number) => {
    const newScores = { ...scores, [dimension]: scores[dimension] + value };
    setScores(newScores);
    if (currentQIndex < ONBOARDING_QUESTIONS.length - 1) {
      setCurrentQIndex(prev => prev + 1);
    } else {
      calculateResult(newScores);
    }
  };

  const calculateResult = (finalScores: Record<string, number>) => {
    setStep('analyzing');
    let maxDim = 'reality';
    let maxVal = 0;
    Object.entries(finalScores).forEach(([dim, val]) => { if (val > maxVal) { maxVal = val; maxDim = dim; } });

    const mapping: Record<string, { p: PersonaType, zh: string, en: string, descZh: string, descEn: string }> = {
        order: { p: 'Sol', zh: '绝对秩序者', en: 'THE RULER', descZh: '你的世界容不下混乱，效率就是生命。', descEn: 'Efficiency is your religion.' },
        chaos: { p: 'Vee', zh: '混乱乐子人', en: 'CHAOS AGENT', descZh: '严肃是无聊的墓志铭，你也一样。', descEn: 'Why so serious?' },
        energy: { p: 'Rin', zh: '热血笨蛋', en: 'PROTAGONIST', descZh: '虽然容易冲动，但你的生命力令人嫉妒。', descEn: 'Impulsive but alive.' },
        reality: { p: 'Ash', zh: '人间清醒', en: 'THE REALIST', descZh: '你早已看透了生活的本质，并选择冷眼旁观。', descEn: 'Sober and cynical.' },
        insight: { p: 'Echo', zh: '深渊凝视者', en: 'THE OBSERVER', descZh: '你喜欢探究冰山之下的东西。', descEn: 'Silence speaks to you.' }
    };

    const res = mapping[maxDim] || mapping['reality'];
    setResultTag({ label: lang === 'zh' ? res.zh : res.en, desc: lang === 'zh' ? res.descZh : res.descEn, persona: res.p });
    setTimeout(() => { setStep('result'); }, 2000);
  };

  const finalize = () => {
      const profile = { scores, tag: resultTag?.label, desc: resultTag?.desc, dominant: resultTag?.persona, date: new Date().toISOString() };
      onFinish(profile);
  };

  const handleSaveResult = async () => {
    if (!resultRef.current) return;
    try {
      const canvas = await html2canvas(resultRef.current, { backgroundColor: '#000', scale: 3, useCORS: true } as any);
      const url = canvas.toDataURL("image/png");
      const a = document.createElement('a');
      a.href = url;
      a.download = `ToughLove_Diagnosis.png`;
      a.click();
    } catch (e) { console.error(e); }
  };

  const currentQ = ONBOARDING_QUESTIONS[currentQIndex];

  return (
    <div className="fixed inset-0 z-[999] bg-black text-white font-sans flex items-center justify-center p-0 overflow-hidden">
      <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: noiseBg }}></div>
      
      {/* 阶段 1: Intro */}
      {step === 'intro' && (
        <div className="max-w-md w-full p-6 space-y-10 text-center animate-[fadeIn_1s_ease-out] relative z-10">
            <div className="relative w-32 h-32 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 border border-white/20 rounded-full animate-[spin_10s_linear_infinite]"></div>
                <div className="absolute inset-2 border border-dashed border-[#7F5CFF]/50 rounded-full animate-[spin_15s_linear_infinite_reverse]"></div>
                <Fingerprint size={48} className="text-[#7F5CFF] drop-shadow-[0_0_15px_rgba(127,92,255,0.5)]" />
            </div>
            <div>
                <h1 className="text-5xl font-black tracking-tighter mb-4 text-white">SOUL INIT</h1>
                <p className="text-gray-400 text-sm tracking-widest uppercase">
                    {lang === 'zh' ? '建立精神连接...' : 'ESTABLISHING CONNECTION...'}
                </p>
            </div>
            <button onClick={handleStart} className="w-full py-5 bg-white text-black hover:bg-[#7F5CFF] hover:text-white font-black tracking-[0.2em] uppercase transition-all clip-path-polygon">
                {lang === 'zh' ? '开始扫描' : 'START SCAN'}
            </button>
        </div>
      )}

      {/* 阶段 2: Questions */}
      {step === 'question' && (
        <div className="max-w-md w-full p-6 space-y-8 animate-[slideUp_0.3s_ease-out] relative z-10">
            <div className="w-full h-1 bg-white/10 mb-4 rounded-full overflow-hidden">
                <div className="h-full bg-[#7F5CFF] transition-all duration-500" style={{ width: `${((currentQIndex + 1) / ONBOARDING_QUESTIONS.length) * 100}%` }}></div>
            </div>
            
            <h2 className="text-2xl font-bold leading-relaxed text-center min-h-[80px] flex items-center justify-center">
                {lang === 'zh' ? currentQ.text.zh : currentQ.text.en}
            </h2>

            <div className="space-y-4">
                {currentQ.options.map((opt, idx) => {
                    const pKey = getPersonaForDimension(opt.dimension);
                    return (
                        <button key={idx} onClick={() => handleAnswer(opt.dimension, opt.value)} className="w-full p-5 flex items-center gap-5 bg-[#111] border border-white/10 hover:bg-[#1a1a1a] hover:border-[#7F5CFF] transition-all rounded-xl group text-left relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-r from-[#7F5CFF]/0 to-[#7F5CFF]/10 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500"></div>
                            <div className="w-10 h-10 rounded-full overflow-hidden border border-white/20 flex-shrink-0 group-hover:scale-110 transition-transform relative z-10">
                                <img src={PERSONAS[pKey].avatar} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors relative z-10">
                                {lang === 'zh' ? opt.text.zh : opt.text.en}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
      )}

      {/* 阶段 3: Analyzing */}
      {step === 'analyzing' && (
        <div className="text-center relative z-10">
            <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-600 animate-pulse">
                ANALYZING
            </div>
            <div className="mt-4 flex justify-center gap-1">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="w-2 h-8 bg-[#7F5CFF] animate-[bounce_1s_infinite]" style={{ animationDelay: `${i * 0.1}s` }}></div>
                ))}
            </div>
        </div>
      )}

      {/* 阶段 4: Result (视觉暴击版) */}
      {step === 'result' && resultTag && (
        <div className="relative w-full h-full flex flex-col items-center justify-center">
            {/* 这里的 div 是用来截图的，包含了所有视觉元素 */}
            <div ref={resultRef} className="relative w-full max-w-sm aspect-[9/16] bg-black border border-white/10 flex flex-col overflow-hidden shadow-2xl">
                {/* 动态背景 */}
                <div className={`absolute inset-0 bg-gradient-to-b ${PERSONAS[resultTag.persona].color.replace('text-', 'from-')}/20 via-black to-black opacity-60`}></div>
                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-30 mix-blend-overlay"></div>
                
                {/* 顶部 ID */}
                <div className="relative z-10 p-6 flex justify-between items-start border-b border-white/10">
                    <div>
                        <p className="text-[10px] text-[#7F5CFF] font-bold tracking-[0.3em] uppercase">TOUGHLOVE.AI</p>
                        <p className="text-[10px] text-gray-500 font-mono mt-1">SOUL_ID: {Math.floor(Math.random() * 999999)}</p>
                    </div>
                    <Brain size={20} className="text-white/50" />
                </div>

                {/* 核心视觉：巨大标签 + 艺术化头像 */}
                <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 text-center">
                    
                    {/* 标签 (Heavy Ink) */}
                    <div className="relative mb-8">
                        <h2 className="text-5xl font-black text-white italic tracking-tighter uppercase drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] transform -skew-x-6">
                            {resultTag.label}
                        </h2>
                        <div className={`absolute -bottom-2 left-0 w-full h-3 ${PERSONAS[resultTag.persona].color.replace('text-', 'bg-')} opacity-80 transform skew-x-12 mix-blend-color-dodge`}></div>
                    </div>

                    {/* 头像 */}
                    <div className="relative w-48 h-48 mb-8 group">
                        <div className={`absolute inset-0 rounded-full border-2 border-dashed ${PERSONAS[resultTag.persona].color} opacity-30 animate-[spin_20s_linear_infinite]`}></div>
                        <div className="w-full h-full rounded-full overflow-hidden border-4 border-white/10 grayscale group-hover:grayscale-0 transition-all duration-700">
                            <img src={PERSONAS[resultTag.persona].avatar} className="w-full h-full object-cover" />
                        </div>
                        <div className="absolute bottom-0 right-0 bg-white text-black text-[10px] font-bold px-2 py-1 uppercase tracking-wider">
                            Match: {resultTag.persona}
                        </div>
                    </div>

                    {/* 判词 */}
                    <p className="text-sm font-medium text-gray-300 max-w-[260px] leading-relaxed font-serif">
                        “{resultTag.desc}”
                    </p>
                </div>

                {/* 底部：二维码 */}
                <div className="relative z-10 bg-white text-black p-5 flex justify-between items-center">
                    <div className="flex flex-col">
                        <span className="text-xl font-black uppercase italic">DIAGNOSIS</span>
                        <span className="text-[10px] text-gray-500 uppercase tracking-wider">Scan to analyze yours</span>
                    </div>
                    <div className="w-14 h-14 bg-black p-1">
                        <img src="/qrcode.png" className="w-full h-full object-contain" />
                    </div>
                </div>
            </div>

            {/* 操作区：浮在截图区域下方 */}
            <div className="absolute bottom-8 w-full px-6 flex gap-4 max-w-sm z-50">
                <button onClick={handleSaveResult} className="flex-1 py-4 bg-white/10 backdrop-blur-md border border-white/20 text-white font-bold rounded-full flex items-center justify-center gap-2 hover:bg-white/20 transition-all">
                    <Share2 size={18} /> {lang === 'zh' ? '保存诊断' : 'Save'}
                </button>
                <button onClick={finalize} className="flex-[2] py-4 bg-[#7F5CFF] text-white font-bold rounded-full flex items-center justify-center gap-2 hover:bg-[#6b4bd6] transition-all shadow-lg shadow-indigo-500/30">
                    {lang === 'zh' ? '进入诊所' : 'ENTER'} <ArrowRight size={18} />
                </button>
            </div>
        </div>
      )}
    </div>
  );
}