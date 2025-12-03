import { useState } from 'react';
import { X, Fingerprint, Share2, Activity, Brain, Shield, User } from 'lucide-react';

// 本地化文案映射
const LABELS = {
  zh: {
    title: "精神档案",
    diagnosis: "系统诊断",
    core: "核心驱动",
    defense: "防御机制",
    sync: "同步率",
    analyzing: "正在扫描神经元网络...",
    unknown: "数据缺失",
    dimensions: ["现实", "自我", "共情", "意志", "混沌"]
  },
  en: {
    title: "PSYCHE_DOSSIER",
    diagnosis: "SYSTEM DIAGNOSIS",
    core: "CORE DRIVE",
    defense: "DEFENSE",
    sync: "SYNC_RATE",
    analyzing: "Analyzing neural patterns...",
    unknown: "NO DATA",
    dimensions: ["REALITY", "EGO", "EMPATHY", "WILL", "CHAOS"]
  }
};

// --- SVG 雷达图组件 ---
const RadarChart = ({ data, labels }: { data: number[], labels: string[] }) => {
  const size = 200;
  const center = size / 2;
  const radius = 80;
  const sides = 5;
  const angleSlice = (Math.PI * 2) / sides;

  const getPoints = (values: number[], scale = 1) => {
    if (!Array.isArray(values)) return "";
    return values.map((val, i) => {
      const angle = i * angleSlice - Math.PI / 2;
      const r = (val / 100) * radius * scale;
      const x = center + r * Math.cos(angle);
      const y = center + r * Math.sin(angle);
      return `${x},${y}`;
    }).join(' ');
  };

  const fullPoly = getPoints([100, 100, 100, 100, 100]); 
  const safeData = (Array.isArray(data) && data.length === 5) ? data : [50, 50, 50, 50, 50];
  const dataPoly = getPoints(safeData); 
  const gridPoly = getPoints([50, 50, 50, 50, 50]); 

  const getLabelPos = (i: number) => {
      const angle = i * angleSlice - Math.PI / 2;
      const r = radius + 22; 
      const x = center + r * Math.cos(angle);
      const y = center + r * Math.sin(angle);
      return { x, y };
  };

  return (
    <div className="relative w-[200px] h-[200px] mx-auto my-4">
      <svg width={size} height={size} className="overflow-visible">
        <polygon points={fullPoly} fill="none" stroke="#333" strokeWidth="1" />
        <polygon points={gridPoly} fill="none" stroke="#222" strokeDasharray="4 4" />
        {[0, 1, 2, 3, 4].map(i => {
           const angle = i * angleSlice - Math.PI / 2;
           const x = center + radius * Math.cos(angle);
           const y = center + radius * Math.sin(angle);
           return <line key={i} x1={center} y1={center} x2={x} y2={y} stroke="#222" />;
        })}
        <polygon points={dataPoly} fill="rgba(127, 92, 255, 0.3)" stroke="#7F5CFF" strokeWidth="2" />
        {safeData.map((val, i) => {
           const angle = i * angleSlice - Math.PI / 2;
           const r = (val / 100) * radius;
           const x = center + r * Math.cos(angle);
           const y = center + r * Math.sin(angle);
           return <circle key={i} cx={x} cy={y} r="3" fill="#fff" />;
        })}
      </svg>
      {/* 动态标签 */}
      {[0, 1, 2, 3, 4].map(i => {
          const pos = getLabelPos(i);
          return (
              <div key={i} className="absolute text-[9px] text-gray-400 font-bold transform -translate-x-1/2 -translate-y-1/2 whitespace-nowrap" style={{ left: pos.x, top: pos.y }}>
                  {labels[i]}
              </div>
          )
      })}
    </div>
  );
};

// --- Profile Modal ---
// 🔥 新增 userName 属性
export const ProfileModal = ({ show, onClose, data, isLoading, onDownload, ui, deviceId, userName }: any) => {
  if (!show) return null;

  const isEn = ui?.profile === "Psyche Profile"; 
  const t = isEn ? LABELS.en : LABELS.zh;

  const rawRadar = data?.radar;
  const stats = (Array.isArray(rawRadar) && rawRadar.length === 5) ? rawRadar : [70, 85, 40, 60, 90]; 
  const diagnosis = data?.diagnosis || (isLoading ? t.analyzing : t.unknown);
  const archetype = (Array.isArray(data?.tags) && data.tags.length > 0) ? data.tags[0] : (isEn ? "Unknown" : "未知");

  // 如果没有 userName，显示默认ID
  const displayName = userName && userName.trim() !== "" ? userName : (deviceId?.slice(0, 6) || "NO_NAME");

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md animate-[fadeIn_0.2s_ease-out] p-4">
      <div className="w-full max-w-sm bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(127,92,255,0.1)] flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-white/5 bg-gradient-to-r from-[#111] to-[#0a0a0a]">
          <div className="flex items-center gap-2">
            <Fingerprint className="text-[#7F5CFF]" size={20} />
            <h2 className="text-sm font-bold tracking-widest text-white uppercase">{t.title}</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          
          {/* 1. Identity Chip (修复：显示真实昵称) */}
          <div className="flex items-center gap-4 mb-6">
             <div className="w-16 h-16 rounded-xl bg-gray-800 border border-white/10 overflow-hidden relative shadow-lg shrink-0">
                <div className="absolute inset-0 flex items-center justify-center bg-[#1a1a1a]">
                    <User size={32} className="text-gray-600" />
                </div>
                {/* 如果有头像逻辑可加回 img */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
             </div>
             <div className="min-w-0">
                {/* 昵称显示在这里 */}
                <h3 className="text-xl font-black text-white tracking-wide truncate">{displayName}</h3>
                {/* 心理原型显示在这里 */}
                <p className="text-xs text-[#7F5CFF] font-bold mt-0.5 uppercase tracking-wider">{archetype}</p>
                <div className="flex gap-2 mt-2">
                   <span className="px-1.5 py-0.5 bg-white/5 border border-white/10 text-gray-400 text-[9px] font-mono rounded">ID: {deviceId?.slice(0, 4)}...</span>
                   <span className="px-1.5 py-0.5 bg-green-500/10 border border-green-500/20 text-green-500 text-[9px] font-bold rounded">ONLINE</span>
                </div>
             </div>
          </div>

          {/* 2. Radar Chart */}
          <div className="py-2 flex justify-center bg-[#111]/50 rounded-2xl border border-white/5 relative mb-6">
             <div className="absolute top-2 right-3 text-[9px] text-gray-600 font-mono">{t.sync}: 88%</div>
             <RadarChart data={stats} labels={t.dimensions} />
          </div>

          {/* 3. Diagnosis Text */}
          <div className="bg-[#151515] p-4 rounded-xl border-l-2 border-[#7F5CFF] mb-4">
             <h4 className="text-[10px] font-bold text-gray-400 mb-2 uppercase flex items-center gap-2 tracking-wider">
                <Activity size={10} /> {t.diagnosis}
             </h4>
             <p className="text-sm text-gray-200 leading-relaxed font-light">
                {isLoading ? <span className="animate-pulse">{t.analyzing}</span> : diagnosis}
             </p>
          </div>

          {/* 4. Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
             <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                <div className="text-[9px] text-gray-500 mb-1 flex items-center gap-1 uppercase tracking-wider"><Brain size={10} /> {t.core}</div>
                <div className="text-sm font-bold text-white">Survival</div>
             </div>
             <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                <div className="text-[9px] text-gray-500 mb-1 flex items-center gap-1 uppercase tracking-wider"><Shield size={10} /> {t.defense}</div>
                <div className="text-sm font-bold text-white">High</div>
             </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-5 border-t border-white/10 bg-[#0f0f0f]">
           <button onClick={onDownload} className="w-full py-3 bg-white text-black font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.2)]">
              <Share2 size={16} />
              {ui?.share || (isEn ? "EXPORT DATA" : "保存档案")}
           </button>
        </div>

      </div>
    </div>
  );
};