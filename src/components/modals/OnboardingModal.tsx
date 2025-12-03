import { useState, useEffect } from 'react';
import { Fingerprint, ArrowRight, Activity, Brain, Zap, ScanFace } from 'lucide-react';
import { ONBOARDING_QUESTIONS, PERSONAS, PersonaType } from '@/lib/constants';

interface OnboardingModalProps {
  show: boolean;
  onFinish: (profile: any) => void;
  lang: 'zh' | 'en';
}

export const OnboardingModal = ({ show, onFinish, lang }: OnboardingModalProps) => {
  const [step, setStep] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // 初始五维分数 (50分基准)
  const [scores, setScores] = useState<Record<string, number>>({
    reality: 50, 
    ego: 50, 
    empathy: 50, 
    will: 50, 
    chaos: 50
  });

  if (!show) return null;

  const currentQ = ONBOARDING_QUESTIONS[step];

  // 🔥 核心修复：这里接收的第二个参数改为 number 类型 (score)
  const handleAnswer = (dimension: string, score: number) => {
    // 1. 实时计算分数偏移
    setScores(prev => ({
      ...prev,
      // 算法：原分数 + (新分数 - 50) * 0.8 的权重
      [dimension]: Math.min(100, Math.max(0, (prev[dimension] || 50) + (score - 50) * 0.8))
    }));

    // 2. 切换题目或结束
    if (step < ONBOARDING_QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      finishAssessment();
    }
  };

  const finishAssessment = () => {
    setIsAnalyzing(true);
    
    // 模拟分析过程 (1.5秒延迟，增加仪式感)
    setTimeout(() => {
      // 简单的性格计算逻辑：找出分数最高的一个维度作为主导人格
      const dominantDim = Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);
      
      // 维度 -> 人格映射表
      const dimToPersona: Record<string, PersonaType> = {
        reality: 'Rin',   // 绝对理性 -> Rin
        ego: 'Ash',       // 极度自我 -> Ash
        empathy: 'Echo',  // 高共情/敏感 -> Echo
        will: 'Sol',      // 强意志 -> Sol
        chaos: 'Vee'      // 混乱/乐子 -> Vee
      };

      const finalProfile = {
        radar: [scores.reality, scores.ego, scores.empathy, scores.will, scores.chaos],
        tags: [lang === 'zh' ? "初次觉醒" : "Awakened"],
        diagnosis: lang === 'zh' ? "扫描完成。检测到强烈的精神波动。" : "Scan complete. High mental activity detected.",
        dominant: dimToPersona[dominantDim] || 'Ash'
      };

      onFinish(finalProfile);
    }, 1500);
  };

  // 辅助：获取某个维度对应的人格头像（用于装饰选项）
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

  return (
    <div className="fixed inset-0 z-[300] bg-black flex items-center justify-center p-4">
      {/* 背景动态噪点 */}
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 pointer-events-none mix-blend-overlay"></div>
      
      <div className="w-full max-w-md relative z-10 animate-[fadeIn_0.5s_ease-out]">
        
        {/* Header: 进度条与标题 */}
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
           
           {/* 进度条 */}
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

        {/* Options List */}
        {!isAnalyzing && (
            <div className="space-y-4">
              {currentQ.options.map((opt: any, idx: number) => {
                const pKey = getPersonaForDimension(opt.dimension);
                return (
                    <button
                      key={idx}
                      // 🔥 [FIX] 这里就是修复点：传入 opt.score (数字) 而不是 opt.value
                      onClick={() => handleAnswer(opt.dimension, opt.score)}
                      className="w-full p-5 flex items-center gap-5 bg-[#111] border border-white/10 hover:bg-[#1a1a1a] hover:border-[#7F5CFF] transition-all rounded-xl group text-left relative overflow-hidden"
                    >
                      {/* 悬停时的光效背景 */}
                      <div className="absolute inset-0 bg-gradient-to-r from-[#7F5CFF]/0 to-[#7F5CFF]/10 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500"></div>
                      
                      {/* 左侧：人格头像暗示 */}
                      <div className="w-10 h-10 rounded-full overflow-hidden border border-white/20 flex-shrink-0 group-hover:scale-110 transition-transform relative z-10 grayscale group-hover:grayscale-0">
                          <img src={PERSONAS[pKey].avatar} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                      </div>

                      {/* 右侧：文案 */}
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