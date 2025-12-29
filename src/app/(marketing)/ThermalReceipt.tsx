"use client";

import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import { Loader2, Download, Smartphone } from "lucide-react"; // 确保你装了 lucide-react，或者用 emoji 代替

export default function ThermalReceipt() {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // 生成图片并下载
  const handleSaveImage = async () => {
    if (receiptRef.current === null) return;
    setIsGenerating(true);

    try {
      const dataUrl = await toPng(receiptRef.current, { cacheBust: true, pixelRatio: 3 });
      const link = document.createElement("a");
      link.download = "ASH_Logic_Diagnosis.png";
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Image generation failed", err);
      alert("保存失败，请手动截图");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-sm animate-in fade-in zoom-in duration-500">
      
      {/* 🧾 票据主体区域 (会被截图的部分) */}
      <div ref={receiptRef} className="w-full bg-[#f0f0f0] text-black p-0 relative shadow-2xl filter drop-shadow-lg">
        
        {/* 顶部锯齿效果 (CSS绘制) */}
        <div className="w-full h-4 bg-transparent absolute -top-4 left-0" 
             style={{
               backgroundImage: "linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)",
               backgroundSize: "20px 20px",
               backgroundPosition: "0 10px"
             }} />

        <div className="p-8 font-mono space-y-6">
          {/* Header */}
          <div className="text-center border-b-2 border-dashed border-black/30 pb-6">
            <h2 className="text-3xl font-black tracking-tighter uppercase">Ash Labs</h2>
            <p className="text-xs text-gray-500 mt-1">LOGIC STABILITY TEST // v1.0</p>
            <p className="text-xs text-gray-500">{new Date().toLocaleDateString()} // {new Date().toLocaleTimeString()}</p>
          </div>

          {/* Diagnosis Content */}
          <div className="space-y-4 text-sm leading-relaxed uppercase">
            <div>
              <span className="bg-black text-white px-1 text-xs">SUBJECT</span>
              <p className="font-bold mt-1 text-lg">HUMAN_0X82</p>
            </div>
            
            <div>
              <span className="bg-black text-white px-1 text-xs">DETECTED BUG</span>
              <p className="font-bold mt-1 text-lg leading-tight">CHRONIC PROCRASTINATION LOOP</p>
            </div>

            <div className="border-l-2 border-black pl-3 py-1">
              <span className="text-xs text-gray-500">ROOT CAUSE ANALYSIS</span>
              <p className="font-bold mt-1">FEAR OF FAILURE IS DISGUISED AS PERFECTIONISM.</p>
            </div>

            <div>
              <span className="bg-black text-white px-1 text-xs">PATCH v1.2</span>
              <p className="font-bold mt-1">JUST SHIP THE DAMN THING.</p>
            </div>
          </div>

          {/* Footer & QR */}
          <div className="border-t-2 border-dashed border-black/30 pt-6 text-center space-y-4">
            <div className="flex justify-center">
              {/* 这里放一个真实的二维码图片，目前用黑块代替 */}
              <div className="w-24 h-24 bg-black flex items-center justify-center text-white text-xs p-2 text-center">
                [QR CODE]
                <br/>
                SCAN TO FIX
              </div>
            </div>
            <p className="text-[10px] text-gray-500 max-w-[200px] mx-auto">
              KEEP THIS RECEIPT. IT IS THE ONLY PROOF THAT YOU ARE STILL SANE.
            </p>
            <div className="text-xs font-black tracking-widest pt-2">
              *** END OF REPORT ***
            </div>
          </div>
        </div>

        {/* 底部锯齿效果 */}
        <div className="w-full h-4 bg-transparent absolute -bottom-4 left-0 rotate-180" 
             style={{
               backgroundImage: "linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)",
               backgroundSize: "20px 20px",
               backgroundPosition: "0 10px"
             }} />
      </div>

      {/* 🔘 操作按钮区域 (不会被截图) */}
      <div className="flex flex-col gap-3 w-full px-4">
        {/* 主按钮：保存/分享 */}
        <button 
          onClick={handleSaveImage}
          disabled={isGenerating}
          className="w-full py-4 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(220,38,38,0.5)]"
        >
          {isGenerating ? <Loader2 className="animate-spin" /> : <Download size={20} />}
          {isGenerating ? "PRINTING..." : "SAVE DIAGNOSIS (分享)"}
        </button>

        {/* 次要按钮：回 APP */}
        <button 
          onClick={() => window.location.href = '/'} 
          className="w-full py-3 bg-transparent border border-white/20 text-white/60 hover:text-white hover:border-white hover:bg-white/5 rounded-xl flex items-center justify-center gap-2 transition-all text-sm"
        >
          <Smartphone size={16} />
          OPEN TOUGH LOVE OS
        </button>
      </div>

    </div>
  );
}