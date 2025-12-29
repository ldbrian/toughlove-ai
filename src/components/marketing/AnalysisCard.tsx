"use client";
import { useRef, useState, useEffect } from "react";
import { toPng } from "html-to-image";
import { Loader2, Download, RefreshCcw, Fingerprint, Sparkles } from "lucide-react";

interface Props {
  diagnosis?: string;
  isCN?: boolean;
}

export default function AnalysisCard({ diagnosis = "Insight Loading...", isCN = true }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [dateStr, setDateStr] = useState("");
  const APP_DOWNLOAD_URL = "https://toughlove.online/";

  useEffect(() => {
    // 日期格式化得更短一点，节省空间
    const date = new Date();
    const str = isCN 
      ? `${date.getFullYear()}.${(date.getMonth()+1).toString().padStart(2,'0')}.${date.getDate().toString().padStart(2,'0')}`
      : date.toLocaleDateString();
    setDateStr(str);
  }, [isCN]);

  const handleSave = async () => {
    if (!cardRef.current) return;
    setIsGenerating(true);
    try {
      const dataUrl = await toPng(cardRef.current, { cacheBust: true, pixelRatio: 3 });
      const link = document.createElement("a");
      link.download = `Ash_Insight_${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error(e);
      alert("Save failed.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    // 这里的 padding 改小了一点，gap 也改小了
    <div className="flex flex-col items-center gap-4 w-full max-w-sm animate-in fade-in zoom-in duration-700">
      
      {/* --- 🔮 卡片主体 (极致紧凑版) --- */}
      <div 
        ref={cardRef} 
        className="w-full bg-gradient-to-br from-[#0f172a] to-[#020617] border border-cyan-500/30 rounded-xl overflow-hidden shadow-[0_0_40px_rgba(8,145,178,0.2)] relative"
      >
        {/* 背景光效保持不变，但稍微弱化一点 */}
        <div className="absolute top-[-50px] right-[-50px] w-24 h-24 bg-cyan-500/10 blur-[40px] rounded-full" />
        <div className="absolute bottom-[-50px] left-[-50px] w-32 h-32 bg-blue-600/10 blur-[50px] rounded-full" />

        {/* 核心内容区：Padding 缩小到 p-6 (24px) */}
        <div className="p-6 relative z-10 flex flex-col h-full">
          
          {/* 1. Header: 极简一行流 */}
          <div className="flex justify-between items-center border-b border-white/10 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold tracking-[0.2em] text-cyan-100 uppercase">
                ASH PSYCHE OS
              </span>
            </div>
            <Fingerprint className="text-white/20 w-5 h-5" />
          </div>

          {/* 2. Body: 核心洞察 (移除 Guest ID，移除 Title，直接展示内容) */}
          {/* min-h 设小一点，依靠内容撑开 */}
          <div className="flex-1 min-h-[120px] flex items-center mb-4">
             <div className="relative">
               {/* 左侧装饰线 */}
               <div className="absolute left-0 top-1 bottom-1 w-1 bg-gradient-to-b from-cyan-500 to-blue-600 rounded-full" />
               
               {/* 诊断内容：字体适中，行高舒适 */}
               <p className="pl-5 text-[15px] leading-relaxed text-slate-200 font-light italic opacity-90">
                 "{diagnosis}"
               </p>
             </div>
          </div>

          {/* 3. Footer: 并排布局 (节省垂直空间) */}
          <div className="pt-3 border-t border-white/10 flex justify-between items-end">
             
             {/* 左侧：日期和 Branding */}
             <div className="flex flex-col justify-end h-full pb-1">
                <p className="text-[10px] text-cyan-500/60 font-mono tracking-wider mb-0.5">
                  ANALYSIS_DATE
                </p>
                <p className="text-xs font-mono text-slate-300">
                  {dateStr}
                </p>
                <p className="text-[9px] text-slate-600 uppercase tracking-widest mt-2">
                  TOUGH LOVE OS © 2025
                </p>
             </div>
             
             {/* 右侧：二维码 (保持醒目，w-20 = 80px) */}
             <div className="bg-white p-1.5 rounded-md shadow-lg">
                <img 
                  src="/qrcode_H5.png" 
                  alt="QR" 
                  className="w-20 h-20 object-contain"
                />
             </div>
          </div>

        </div>
      </div>

      {/* --- Buttons (紧凑排列) --- */}
      <div className="flex w-full gap-3 px-2">
        <button 
          onClick={handleSave}
          disabled={isGenerating}
          className="flex-1 py-3 bg-cyan-700 hover:bg-cyan-600 active:scale-95 text-white text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg"
        >
          {isGenerating ? <Loader2 className="animate-spin w-4 h-4"/> : <Download className="w-4 h-4"/>}
          {isCN ? "保存" : "Save"}
        </button>

        <button 
          onClick={() => window.location.reload()}
          className="flex-1 py-3 bg-white/5 border border-white/10 hover:bg-white/10 active:scale-95 text-slate-300 text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-all"
        >
          <RefreshCcw className="w-4 h-4"/>
          {isCN ? "重测" : "Reset"}
        </button>
      </div>
{/* 第二排：App 导流 (商业化核心) */}
        {/* 做成显眼的黑色或深色按钮，强调“完整体验” */}
        <a 
          href={APP_DOWNLOAD_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-3.5 bg-black border border-white/20 hover:border-cyan-500/50 hover:bg-white/5 text-cyan-400 text-sm font-bold tracking-wide rounded-lg flex items-center justify-center gap-2 transition-all shadow-xl active:scale-95"
        >
          {/* 这里可以用一个 App 的图标，或者简单的外部链接图标 */}
          <span className="uppercase">
            {isCN ? "进入 Tough Love OS" : "Enter Tough Love OS"}
          </span>
        </a>
        
        {/* 底部小字诱导 */}
        <p className="text-[10px] text-center text-slate-500">
          {isCN ? "解锁完整记忆库与深度对话模式" : "Unlock full memory banks & deep dive mode"}
        </p>

      </div>
  );
}