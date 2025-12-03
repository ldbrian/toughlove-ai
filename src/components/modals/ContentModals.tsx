'use client';

import { X, Share2, Activity, Brain, Zap, Download } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useState, useEffect } from 'react';
import { PERSONAS, PersonaType } from '@/lib/constants'; // 引入常量以获取头像和颜色

// 通用 Modal 容器
const ModalBase = ({ show, onClose, title, children }: any) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease-out]">
      <div className="relative w-full max-w-sm bg-[#111] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/5">
          <h3 className="font-bold text-white text-sm tracking-wider uppercase">{title}</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white"><X size={20} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-0 scrollbar-hide">
          {children}
        </div>
      </div>
    </div>
  );
};

// 1. 每日毒签 Modal (保持不变，为了完整性贴在这里，你可以只复制 ProfileModal 部分)
export const DailyQuoteModal = ({ show, onClose, data, isLoading, onDownload, isGenerating, ui, activePersona }: any) => {
  return (
    <ModalBase show={show} onClose={onClose} title={ui.dailyToxic}>
      <div className="p-8 flex flex-col items-center justify-center min-h-[400px] text-center bg-[url('/noise.png')] bg-opacity-5 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50 pointer-events-none"></div>
        {isLoading ? (
          <div className="animate-pulse flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-white/20 border-t-[#7F5CFF] rounded-full animate-spin"></div>
            <p className="text-xs text-gray-500 font-mono">{ui.makingPoison}</p>
          </div>
        ) : (
          <>
            <div className="mb-6 relative">
               <span className="text-6xl text-white/10 font-serif absolute -top-8 -left-4">“</span>
               <p className="text-xl font-medium leading-relaxed text-gray-100 font-serif relative z-10 px-2">
                 {data?.content}
               </p>
               <span className="text-6xl text-white/10 font-serif absolute -bottom-10 -right-4">”</span>
            </div>
            <div className="mt-8 pt-6 border-t border-white/10 w-full flex justify-between items-end">
               <div className="text-left">
                 <p className="text-[10px] text-gray-500 uppercase tracking-widest">Prescribed By</p>
                 <p className="text-sm font-bold text-[#7F5CFF]">{activePersona}</p>
               </div>
               <p className="text-[10px] text-gray-600 font-mono">{data?.date}</p>
            </div>
            
            <div className="mt-8 w-full">
               <button onClick={onDownload} disabled={isGenerating} className="w-full py-3 bg-white text-black font-bold text-xs uppercase tracking-widest rounded-full hover:bg-gray-200 transition-colors flex items-center justify-center gap-2">
                 {isGenerating ? <span className="animate-spin">⏳</span> : <Share2 size={14} />}
                 {ui.save}
               </button>
            </div>
          </>
        )}
      </div>
    </ModalBase>
  );
};

// 2. 精神档案 Modal (🔥 视觉升级版)
export const ProfileModal = ({ show, onClose, data, isLoading, onDownload, isGenerating, ui, mounted, deviceId }: any) => {
  const [localProfile, setLocalProfile] = useState<any>(null);

  useEffect(() => {
    if (show) {
      const stored = localStorage.getItem('toughlove_user_profile');
      if (stored) {
        setLocalProfile(JSON.parse(stored));
      }
    }
  }, [show]);

  const displayTag = localProfile?.tag || (data?.tags && data.tags[0]) || "Unknown Subject";
  const displayDesc = localProfile?.desc || data?.diagnosis || "No diagnosis available.";
  // 获取匹配的人格 Key，默认为 Ash
  const displayDominant: PersonaType = localProfile?.dominant || "Ash";
  
  // 获取人格配置
  const pData = PERSONAS[displayDominant];
  // 提取颜色类名 (如 text-blue-400 -> blue-400)，用于动态渐变
  // 注意：Tailwind 动态类名需要完整写出，这里我们用 style 或简单的替换技巧
  // 为了安全，我们用简单的映射，或者直接利用 pData.color 做文字颜色
  
  // 动态背景样式
  const headerGradientStyle = {
    background: `linear-gradient(to bottom, ${getHexColor(displayDominant)}33, transparent)` // 33 is ~20% opacity
  };

  return (
    <ModalBase show={show} onClose={onClose} title={ui.profile}>
      <div className="bg-[#050505] min-h-[500px] flex flex-col relative">
        
        {/* Header Visual: 动态渐变 + 专属头像 */}
        <div className="h-32 relative overflow-hidden" style={headerGradientStyle}>
           <div className="absolute inset-0 bg-[url('/grid.svg')] bg-[length:30px_30px] opacity-20"></div>
           
           {/* 头像容器：悬浮在交界处 */}
           <div className="absolute bottom-0 left-6 transform translate-y-1/2">
              <div className={`w-20 h-20 bg-black border-2 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.1)] overflow-hidden ${pData.color.replace('text-', 'border-')}`}>
                 {/* 如果有本地 Profile，显示对应人格头像；否则显示默认 Brain */}
                 {localProfile ? (
                    <img src={pData.avatar} className="w-full h-full object-cover" alt={displayDominant} />
                 ) : (
                    <Brain className="text-gray-500" size={32} />
                 )}
              </div>
           </div>
        </div>

        <div className="mt-12 px-6 pb-8 space-y-8">
           {/* 1. 核心标签 */}
           <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Diagnosis Label</p>
              <h2 className={`text-3xl font-black italic ${pData.color}`}>{displayTag}</h2>
           </div>

           {/* 2. 详细判词 */}
           <div className="bg-white/5 p-4 rounded-xl border border-white/10">
              <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                 <Activity size={12} /> Analysis Report
              </p>
              <p className="text-sm text-gray-300 leading-relaxed">
                 {displayDesc}
              </p>
           </div>

           {/* 3. 匹配信息 */}
           <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#111] p-3 rounded-lg border border-white/10">
                 <span className="text-[10px] text-gray-500 block mb-1">Match</span>
                 <span className={`text-sm font-bold ${pData.color}`}>{displayDominant}</span>
              </div>
              <div className="bg-[#111] p-3 rounded-lg border border-white/10">
                 <span className="text-[10px] text-gray-500 block mb-1">Status</span>
                 <span className="text-sm font-bold text-green-500">Active</span>
              </div>
           </div>

           {/* 4. 操作 (这里的 onDownload 会触发 page.tsx 里的 downloadProfileCard) */}
           <button onClick={onDownload} disabled={isGenerating} className="w-full py-3 border border-white/20 text-white font-bold text-xs uppercase tracking-widest rounded-lg hover:bg-white/5 transition-colors flex items-center justify-center gap-2">
              {isGenerating ? <span className="animate-spin">...</span> : <Download size={14} />}
              {ui.saveCard}
           </button>
        </div>
      </div>
    </ModalBase>
  );
};

// 辅助：简单的颜色映射 (因为 Tailwind 类名无法动态解析到 hex)
function getHexColor(persona: string) {
    switch(persona) {
        case 'Ash': return '#60a5fa'; // blue-400
        case 'Rin': return '#f472b6'; // pink-400
        case 'Sol': return '#34d399'; // emerald-400
        case 'Vee': return '#c084fc'; // purple-400
        case 'Echo': return '#818cf8'; // indigo-400
        default: return '#7F5CFF';
    }
}

// 3. 观察日记 Modal (占位)
export const DiaryModal = ({ show, onClose, userId, lang }: any) => {
  return <ModalBase show={show} onClose={onClose} title="Diary"><div className="p-4 text-center text-gray-500">Coming Soon</div></ModalBase>;
};

// 4. 其他 Modals (占位，请保留你原有的完整逻辑如果需要)
export const ShameModal = ({ show, onClose, data, lang, onDownload, isGenerating, ui }: any) => {
    return <ModalBase show={show} onClose={onClose} title={ui.shameTitle}><div className="p-4">...</div></ModalBase>;
};
export const GloryModal = ({ show, onClose, data, lang, onDownload, isGenerating, ui }: any) => {
    return <ModalBase show={show} onClose={onClose} title={ui.gloryTitle}><div className="p-4">...</div></ModalBase>;
};
export const EnergyModal = ({ show, onClose, onTriggerTask, userId, lang, updateTrigger }: any) => {
    return <ModalBase show={show} onClose={onClose} title="Energy Station"><div className="p-4">...</div></ModalBase>;
};