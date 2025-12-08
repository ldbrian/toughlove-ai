import { useState, useEffect } from 'react';
import { Terminal, Cpu, Activity, ArrowRight, CheckCircle, Fingerprint } from 'lucide-react';
import { ONBOARDING_QUESTIONS, LangType } from '@/lib/constants';

interface OnboardingModalProps {
  show: boolean;
  onFinish: (profile: any) => void;
  lang: LangType;
}

export const OnboardingModal = ({ show, onFinish, lang }: OnboardingModalProps) => {
  const [step, setStep] = useState(0); // 0: Boot, 1: Questions, 2: Analyzing, 3: Result
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<any>({});
  const [bootText, setBootText] = useState<string[]>([]);
  
  // 新增状态：存储计算结果
  const [resultPersona, setResultPersona] = useState<string>('');
  const [finalProfile, setFinalProfile] = useState<any>(null);

  useEffect(() => {
    if (show && step === 0) {
      // 启动动画模拟
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

  const handleAnswer = (option: any) => {
    const newAnswers = { ...answers, [ONBOARDING_QUESTIONS[qIndex].text.en]: option.dimension };
    setAnswers(newAnswers);

    if (qIndex < ONBOARDING_QUESTIONS.length - 1) {
      setQIndex(prev => prev + 1);
    } else {
      setStep(2); // 进入分析动画
      // 模拟分析耗时
      setTimeout(() => {
        // 简单计算人格
        const dominant = Object.values(newAnswers).sort((a:any,b:any) => 
          Object.values(newAnswers).filter(v => v===a).length - Object.values(newAnswers).filter(v => v===b).length
        ).pop();
        
        // 映射到 Personas
        let persona = 'Ash';
        if (dominant === 'chaos') persona = 'Vee';
        if (dominant === 'empathy') persona = 'Rin';
        if (dominant === 'reality') persona = 'Ash';
        if (dominant === 'ego') persona = 'Sol';

        // 🔥 关键修改：计算完成后不直接关闭，而是保存结果并跳转 Step 3
        const profile = { dominant: persona, raw: newAnswers };
        setResultPersona(persona);
        setFinalProfile(profile);
        setStep(3); 
      }, 2000); // 增加一点等待时间，营造紧张感
    }
  };

  // 🔥 用户手动确认进入系统
  const handleEnterSystem = () => {
    if (finalProfile) {
        onFinish(finalProfile);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[900] bg-black flex flex-col items-center justify-center font-mono p-6 text-green-500">
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 pointer-events-none"></div>
      
      {/* Step 0: Boot */}
      {step === 0 && (
        <div className="w-full max-w-sm space-y-2">
          {bootText.map((t, i) => (
            <div key={i} className="text-xs tracking-widest animate-[fadeIn_0.1s]">{`> ${t}`}</div>
          ))}
          <div className="w-3 h-5 bg-green-500 animate-pulse inline-block"></div>
        </div>
      )}

      {/* Step 1: Questions */}
      {step === 1 && (
        <div className="w-full max-w-md animate-[slideUp_0.5s_ease-out]">
          <div className="flex justify-between items-center mb-8 border-b border-green-500/30 pb-4">
             <div className="flex items-center gap-2">
                <Activity size={18} className="animate-pulse" />
                <span className="text-xs tracking-[0.2em]">CALIBRATION {qIndex + 1}/{ONBOARDING_QUESTIONS.length}</span>
             </div>
             <Cpu size={18} className="opacity-50" />
          </div>

          <h2 className="text-lg md:text-xl font-bold text-white mb-8 leading-relaxed tracking-wide">
             {lang === 'zh' ? ONBOARDING_QUESTIONS[qIndex].text.zh : ONBOARDING_QUESTIONS[qIndex].text.en}
          </h2>

          <div className="space-y-4">
             {ONBOARDING_QUESTIONS[qIndex].options.map((opt, i) => (
                <button 
                  key={i}
                  onClick={() => handleAnswer(opt)}
                  className="w-full text-left p-4 border border-green-500/20 bg-green-500/5 hover:bg-green-500 hover:text-black transition-all rounded-sm group flex justify-between items-center active:scale-[0.98]"
                >
                   <span className="text-sm tracking-wider">{lang === 'zh' ? opt.text.zh : opt.text.en}</span>
                   <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0" />
                </button>
             ))}
          </div>
        </div>
      )}

      {/* Step 2: Analyzing */}
      {step === 2 && (
        <div className="text-center space-y-4 animate-in zoom-in duration-500">
           <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 border-4 border-green-500/30 rounded-full animate-[spin_3s_linear_infinite]"></div>
              <div className="absolute inset-2 border-4 border-t-green-500 rounded-full animate-[spin_1s_linear_infinite]"></div>
              <CheckCircle size={32} className="text-green-500 animate-pulse" />
           </div>
           <h3 className="text-lg tracking-[0.3em] text-white">ANALYZING PSYCHE...</h3>
           <p className="text-xs text-green-500/60">MATCHING COMPATIBLE PERSONA</p>
        </div>
      )}

      {/* 🔥 新增 Step 3: Result Display */}
      {step === 3 && (
        <div className="w-full max-w-sm text-center animate-in zoom-in duration-500 relative z-10">
            {/* 装饰性边框 */}
            <div className="absolute -inset-8 border border-green-500/20 rounded-lg pointer-events-none"></div>
            <div className="absolute -inset-8 border-t border-t-green-500/50 w-full h-full rounded-lg pointer-events-none opacity-50"></div>

            <div className="mb-8 relative inline-block">
                <div className="w-32 h-32 rounded-full border-2 border-green-500 flex items-center justify-center overflow-hidden mx-auto bg-green-500/10 shadow-[0_0_30px_rgba(34,197,94,0.3)] relative">
                    <Fingerprint size={64} className="animate-pulse relative z-10" />
                    {/* 扫描线效果 */}
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-green-500/20 to-transparent w-full h-1/2 animate-[scan_2s_linear_infinite]"></div>
                </div>
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-black border border-green-500 px-3 py-1 text-[10px] font-bold tracking-widest uppercase whitespace-nowrap z-20">
                    Match Found
                </div>
            </div>

            <h2 className="text-4xl font-black text-white mb-2 tracking-[0.2em] uppercase glitch-text" style={{ textShadow: '2px 2px 0px rgba(34,197,94,0.5)' }}>
                {resultPersona}
            </h2>
            
            <div className="text-xs text-green-500/70 mb-10 font-mono space-y-1 border-t border-b border-green-500/20 py-4 my-4">
                <p>NEURAL LINK ESTABLISHED.</p>
                <p>ASSIGNED COMPANION READY.</p>
                <p>SYNC RATE: 98.4%</p>
            </div>

            <button 
                onClick={handleEnterSystem}
                className="w-full py-4 bg-green-500 text-black font-bold tracking-[0.2em] hover:bg-green-400 transition-all active:scale-95 flex items-center justify-center gap-3 group relative overflow-hidden"
            >
                <span className="relative z-10 flex items-center gap-2">
                    {lang === 'zh' ? '进入系统' : 'ENTER SYSTEM'} <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform"/>
                </span>
                {/* 按钮光效 */}
                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 skew-x-12"></div>
            </button>
        </div>
      )}
    </div>
  );
};