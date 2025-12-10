import { useState, useEffect } from 'react';
import { Terminal, Cpu, Activity, ArrowRight, CheckCircle, Fingerprint, Sparkles } from 'lucide-react';
import { PSYCH_QUESTIONS, SOUL_PROFILES, PersonaId, SoulProfile } from '@/config/psych_test';
import { LangType } from '@/types';
import ReactMarkdown from 'react-markdown';

interface OnboardingModalProps {
  show: boolean;
  onFinish: (profile: { dominant: PersonaId, raw: any }) => void;
  lang: LangType;
}

export const OnboardingModal = ({ show, onFinish, lang }: OnboardingModalProps) => {
  const [step, setStep] = useState(0); // 0: Boot, 1: Questions, 2: Analyzing, 3: Result
  const [qIndex, setQIndex] = useState(0);
  
  // 1. 修复：明确指定 Key 的类型为 PersonaId
  const [scores, setScores] = useState<Record<PersonaId, number>>({ ash: 0, sol: 0, rin: 0, vee: 0, echo: 0 });
  const [bootText, setBootText] = useState<string[]>([]);
  
  const [resultProfile, setResultProfile] = useState<SoulProfile | null>(null);

  useEffect(() => {
    if (show && step === 0) {
      const lines = [
        "INITIALIZING NEURAL LINK...",
        "CONNECTING TO CORE...",
        "SYNCING SENSORS...",
        "CALIBRATING EMOTIONAL MODULE...",
        "SYSTEM ONLINE."
      ];
      let i = 0;
      const timer = setInterval(() => {
        setBootText(prev => [...prev, lines[i]]);
        i++;
        if (i >= lines.length) {
          clearInterval(timer);
          setTimeout(() => setStep(1), 800);
        }
      }, 400);
    }
  }, [show]);

  const handleAnswer = (personaValue: PersonaId) => {
    // 1. 计分
    setScores(prev => ({
        ...prev,
        [personaValue]: prev[personaValue] + 1
    }));

    // 2. 进度判断
    if (qIndex < PSYCH_QUESTIONS.length - 1) {
      setQIndex(prev => prev + 1);
    } else {
      // 3. 计算结果
      setStep(2); 
      setTimeout(() => {
        calculateResult();
      }, 2000); 
    }
  };

  const calculateResult = () => {
    let maxScore = -1;
    // 2. 修复：明确 candidates 数组只能存 PersonaId
    let candidates: PersonaId[] = [];
    
    // 3. 修复：使用类型断言 (as PersonaId)，告诉 TS 我们确信这里的 key 是合法的
    (Object.entries(scores) as [PersonaId, number][]).forEach(([key, val]) => {
        if (val > maxScore) {
            maxScore = val;
            candidates = [key];
        } else if (val === maxScore) {
            candidates.push(key);
        }
    });

    // 平局随机选一个
    const finalPersona = candidates[Math.floor(Math.random() * candidates.length)];
    
    // 4. 修复：现在 finalPersona 是 PersonaId 类型，可以安全索引了
    const profile = SOUL_PROFILES[finalPersona];
    
    setResultProfile(profile);
    setStep(3); 
  };

  const handleEnterSystem = () => {
    if (resultProfile) {
        onFinish({ dominant: resultProfile.personaId, raw: scores });
    }
  };

  // 辅助函数：根据语言获取当前字段
  const getText = (profile: SoulProfile | null, field: 'title' | 'keyword' | 'description' | 'quote') => {
    if (!profile) return '';
    const key = `${field}_${lang === 'zh' ? 'cn' : 'en'}` as keyof SoulProfile;
    return profile[key] || '';
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[900] bg-black flex flex-col items-center justify-center font-mono p-6 text-green-500 overflow-y-auto">
      {/* 噪点背景 */}
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 pointer-events-none fixed"></div>
      
      {/* Step 0: Boot */}
      {step === 0 && (
        <div className="w-full max-w-sm space-y-2 relative z-10">
          {bootText.map((t, i) => (
            <div key={i} className="text-xs tracking-widest animate-[fadeIn_0.1s]">{`> ${t}`}</div>
          ))}
          <div className="w-3 h-5 bg-green-500 animate-pulse inline-block"></div>
        </div>
      )}

      {/* Step 1: Questions (适配新字段 title_cn/en) */}
      {step === 1 && (
        <div className="w-full max-w-md animate-[slideUp_0.5s_ease-out] relative z-10 my-auto">
          <div className="flex justify-between items-center mb-8 border-b border-green-500/30 pb-4">
             <div className="flex items-center gap-2">
                <Activity size={18} className="animate-pulse" />
                <span className="text-xs tracking-[0.2em]">CALIBRATION {qIndex + 1}/{PSYCH_QUESTIONS.length}</span>
             </div>
             <Cpu size={18} className="opacity-50" />
          </div>

          <h2 className="text-lg font-bold text-white mb-8 leading-relaxed tracking-wide">
             {lang === 'zh' ? PSYCH_QUESTIONS[qIndex].title_cn : PSYCH_QUESTIONS[qIndex].title_en}
          </h2>

          <div className="space-y-3">
             {PSYCH_QUESTIONS[qIndex].options.map((opt, i) => (
                <button 
                  key={i}
                  onClick={() => handleAnswer(opt.value)}
                  className="w-full text-left p-4 border border-green-500/20 bg-green-500/5 hover:bg-green-500 hover:text-black transition-all rounded-sm group active:scale-[0.98]"
                >
                   <span className="text-sm tracking-wide block leading-6">
                     {lang === 'zh' ? opt.label_cn : opt.label_en}
                   </span>
                </button>
             ))}
          </div>
        </div>
      )}

      {/* Step 2: Analyzing */}
      {step === 2 && (
        <div className="text-center space-y-4 animate-in zoom-in duration-500 relative z-10">
           <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 border-4 border-green-500/30 rounded-full animate-[spin_3s_linear_infinite]"></div>
              <div className="absolute inset-2 border-4 border-t-green-500 rounded-full animate-[spin_1s_linear_infinite]"></div>
              <CheckCircle size={32} className="text-green-500 animate-pulse" />
           </div>
           <h3 className="text-lg tracking-[0.3em] text-white">ANALYZING SOUL...</h3>
           <p className="text-xs text-green-500/60">CONNECTING TO RESONANCE</p>
        </div>
      )}

      {/* Step 3: Result (适配新字段) */}
      {step === 3 && resultProfile && (
        <div className="w-full max-w-md animate-in zoom-in duration-500 relative z-10">
            <div className="absolute -inset-4 md:-inset-8 border border-green-500/30 rounded-lg pointer-events-none bg-black/90 backdrop-blur-md"></div>

            <div className="relative p-4">
                <div className="flex justify-center mb-4">
                    <div className="bg-green-500 text-black px-3 py-1 text-[10px] font-bold tracking-[0.3em] uppercase">
                        MATCH FOUND
                    </div>
                </div>

                <div className="text-center mb-6">
                    <h2 className="text-xl md:text-2xl font-bold text-gray-300 mb-2 tracking-widest uppercase">
                        {getText(resultProfile, 'title')}
                    </h2>
                    <div className="flex items-center justify-center gap-2 text-green-400/80 mb-6">
                        <Sparkles size={14} />
                        <span className="text-xs font-mono tracking-wider">CORE: {getText(resultProfile, 'keyword')}</span>
                        <Sparkles size={14} />
                    </div>

                    {/* 醒目的角色展示区 */}
                    <div className="border-t border-b border-green-500/30 py-4 mb-6 bg-green-500/5">
                        <p className="text-[10px] text-green-500/60 font-mono uppercase tracking-widest mb-2">
                            {lang === 'zh' ? '系统为你匹配的搭档' : 'ASSIGNED PARTNER'}
                        </p>
                        <h1 className="text-5xl font-black text-white tracking-[0.2em] uppercase drop-shadow-[0_0_15px_rgba(34,197,94,0.6)]">
                            {resultProfile.personaId}
                        </h1>
                    </div>
                </div>
                
                {/* 诊断文案 */}
                <div className="text-sm text-gray-300 leading-7 font-sans mb-8 px-2 whitespace-pre-wrap text-justify">
                    <ReactMarkdown>
                      {String(getText(resultProfile, 'description'))}
                    </ReactMarkdown>
                </div>

                {/* 角色欢迎语 */}
                <div className="mb-8 px-4">
                    <p className="text-white italic font-medium border-l-2 border-green-500 pl-4 py-1 text-sm">
                        {getText(resultProfile, 'quote')}
                    </p>
                </div>

                <button 
                    onClick={handleEnterSystem}
                    className="w-full py-4 bg-green-500 hover:bg-green-400 text-black font-bold tracking-[0.2em] transition-all active:scale-95 flex items-center justify-center gap-3 group shadow-[0_0_20px_rgba(34,197,94,0.4)]"
                >
                    <span className="flex items-center gap-2">
                        {lang === 'zh' ? `与 ${resultProfile.personaId} 建立连接` : 'ESTABLISH LINK'} <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform"/>
                    </span>
                </button>
            </div>
        </div>
      )}
    </div>
  );
};