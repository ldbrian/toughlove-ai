// src/components/modals/InitializationModal.tsx
import { useState } from 'react';
import { ChevronRight, Brain, Check } from 'lucide-react';
import { ONBOARDING_QUESTIONS } from '@/lib/constants';

interface InitializationModalProps {
  show: boolean;
  onComplete: (scores: any) => void;
  lang: 'zh' | 'en';
}

export const InitializationModal = ({ show, onComplete, lang }: InitializationModalProps) => {
  const [step, setStep] = useState(0); // 0: Intro, 1-5: Questions, 6: Analyzing
  const [scores, setScores] = useState({ order: 10, chaos: 10, energy: 10, reality: 10, insight: 10 });

  if (!show) return null;

  const handleOption = (dimension: string, value: number) => {
    setScores(prev => ({ ...prev, [dimension]: (prev as any)[dimension] + value }));
    if (step < ONBOARDING_QUESTIONS.length) {
      setStep(step + 1);
    } else {
      setStep(6); // Analyzing
      setTimeout(() => {
        onComplete(scores);
      }, 2000);
    }
  };

  // 渲染题目
  const currentQ = ONBOARDING_QUESTIONS[step - 1];

  return (
    <div className="fixed inset-0 z-[900] flex items-center justify-center bg-black p-6 animate-[fadeIn_0.5s_ease-out]">
      <div className="w-full max-w-sm space-y-8 text-center">
        
        {/* Step 0: Intro */}
        {step === 0 && (
          <div className="space-y-6 animate-[slideUp_0.5s_ease-out]">
            <div className="w-20 h-20 bg-[#111] rounded-full flex items-center justify-center mx-auto border border-white/10 shadow-[0_0_30px_rgba(255,255,255,0.1)]">
              <Brain size={32} className="text-white animate-pulse" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-widest uppercase">
              {lang === 'zh' ? '神经链接校准' : 'NEURAL SYNC INIT'}
            </h1>
            <p className="text-sm text-gray-500 leading-relaxed px-4">
              {lang === 'zh' 
                ? '检测到未知意识体。为了防止系统排异，我需要校准你的基础频率。\n\n别思考。凭直觉。' 
                : 'Unknown consciousness detected. Calibrating base frequency.\n\nDon\'t think. Just choose.'}
            </p>
            <button 
              onClick={() => setStep(1)}
              className="w-full py-4 bg-white text-black font-bold tracking-widest rounded-xl hover:scale-105 transition-transform"
            >
              {lang === 'zh' ? '开始校准 (START)' : 'START SYNC'}
            </button>
          </div>
        )}

        {/* Step 1-5: Questions */}
        {step > 0 && step <= ONBOARDING_QUESTIONS.length && (
          <div className="space-y-8 animate-[fadeIn_0.3s_ease-out]" key={step}>
            <div className="flex justify-between items-center text-[10px] text-gray-600 font-mono tracking-widest uppercase">
              <span>Syncing...</span>
              <span>{step} / {ONBOARDING_QUESTIONS.length}</span>
            </div>
            
            <h2 className="text-xl font-bold text-white leading-relaxed min-h-[80px] flex items-center justify-center">
              {lang === 'zh' ? currentQ.text.zh : currentQ.text.en}
            </h2>

            <div className="space-y-4">
              {currentQ.options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleOption(opt.dimension, opt.value)}
                  className="w-full p-5 text-left rounded-xl bg-[#111] border border-white/10 hover:bg-[#222] hover:border-white/30 transition-all group"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                      {lang === 'zh' ? opt.text.zh : opt.text.en}
                    </span>
                    <ChevronRight size={16} className="text-gray-600 group-hover:text-white" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 6: Analyzing */}
        {step === 6 && (
          <div className="space-y-6 flex flex-col items-center">
            <div className="w-16 h-16 border-4 border-white/10 border-t-white rounded-full animate-spin"></div>
            <p className="text-xs text-gray-500 font-mono animate-pulse">
              {lang === 'zh' ? '正在生成初级诊断...' : 'GENERATING V0.1 REPORT...'}
            </p>
          </div>
        )}

      </div>
    </div>
  );
};