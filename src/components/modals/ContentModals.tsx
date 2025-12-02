'use client';

import { X, Share2, Activity, Brain, Zap, Download } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useState, useEffect } from 'react';

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

// 1. 每日毒签 Modal
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

// 2. 精神档案 Modal (核心修改)
export const ProfileModal = ({ show, onClose, data, isLoading, onDownload, isGenerating, ui, mounted, deviceId }: any) => {
  const [localProfile, setLocalProfile] = useState<any>(null);

  // 每次打开时，尝试读取本地 Onboarding 生成的 Profile
  useEffect(() => {
    if (show) {
      const stored = localStorage.getItem('toughlove_user_profile');
      if (stored) {
        setLocalProfile(JSON.parse(stored));
      }
    }
  }, [show]);

  // 优先显示本地的 Tag，如果没有才显示 API 返回的 tags
  const displayTag = localProfile?.tag || (data?.tags && data.tags[0]) || "Unknown Subject";
  const displayDesc = localProfile?.desc || data?.diagnosis || "No diagnosis available.";
  const displayDominant = localProfile?.dominant || "None";

  return (
    <ModalBase show={show} onClose={onClose} title={ui.profile}>
      <div className="bg-[#050505] min-h-[500px] flex flex-col relative">
        {/* Header Visual */}
        <div className="h-32 bg-gradient-to-b from-[#7F5CFF]/20 to-transparent relative overflow-hidden">
           <div className="absolute inset-0 bg-[url('/grid.svg')] bg-[length:30px_30px] opacity-20"></div>
           <div className="absolute bottom-0 left-6 transform translate-y-1/2">
              <div className="w-20 h-20 bg-black border-2 border-[#7F5CFF] rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(127,92,255,0.3)]">
                 <Brain className="text-[#7F5CFF]" size={32} />
              </div>
           </div>
        </div>

        <div className="mt-12 px-6 pb-8 space-y-8">
           {/* 1. 核心标签 */}
           <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Diagnosis Label</p>
              <h2 className="text-3xl font-black text-white italic">{displayTag}</h2>
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
                 <span className="text-sm font-bold text-[#7F5CFF]">{displayDominant}</span>
              </div>
              <div className="bg-[#111] p-3 rounded-lg border border-white/10">
                 <span className="text-[10px] text-gray-500 block mb-1">Status</span>
                 <span className="text-sm font-bold text-green-500">Active</span>
              </div>
           </div>

           {/* 4. 操作 */}
           <button onClick={onDownload} disabled={isGenerating} className="w-full py-3 border border-white/20 text-white font-bold text-xs uppercase tracking-widest rounded-lg hover:bg-white/5 transition-colors flex items-center justify-center gap-2">
              {isGenerating ? <span className="animate-spin">...</span> : <Download size={14} />}
              {ui.saveCard}
           </button>
        </div>
      </div>
    </ModalBase>
  );
};

// 3. 观察日记 Modal (保留原样，仅做占位)
export const DiaryModal = ({ show, onClose, userId, lang }: any) => {
  return <ModalBase show={show} onClose={onClose} title="Diary">
      <div className="p-4 text-center text-gray-500 text-sm">Feature coming soon.</div>
  </ModalBase>;
};

// 4. 耻辱柱 & 光荣榜 & 能量站 (保留原样，仅做占位)
export const ShameModal = ({ show, onClose, data, lang, onDownload, isGenerating, ui }: any) => {
    return <ModalBase show={show} onClose={onClose} title={ui.shameTitle}><div className="p-4">...</div></ModalBase>;
};
export const GloryModal = ({ show, onClose, data, lang, onDownload, isGenerating, ui }: any) => {
    return <ModalBase show={show} onClose={onClose} title={ui.gloryTitle}><div className="p-4">...</div></ModalBase>;
};
export const EnergyModal = ({ show, onClose, onTriggerTask, userId, lang, updateTrigger }: any) => {
    return <ModalBase show={show} onClose={onClose} title="Energy Station"><div className="p-4">...</div></ModalBase>;
};