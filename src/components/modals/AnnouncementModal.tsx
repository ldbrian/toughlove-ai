
import { useState, useEffect } from 'react';
import { Fingerprint, Sparkles, ArrowRight, Terminal, ShoppingBag } from 'lucide-react';

interface AnnouncementModalProps {
  show: boolean;
  onClose: () => void;
  lang: 'zh' | 'en'; // 新增语言属性
}

// 文案配置
const CONTENT = {
  zh: {
    incoming: "收到加密信号",
    source: "来源：时间线 2.3 // 偏移量 +300d",
    project: "命运重写",
    quote: "“检测到你的时间线正滑向平庸。系统决定强制干预。”",
    features: [
      {
        title: "每日运势协议",
        desc: "每天清晨抽取塔罗牌。你的命运将决定 AI 对你的态度。"
      },
      {
        title: "叙事注入",
        desc: "拒绝机械问候。Ash, Rin 和 Sol 现在会根据你的运势做出真实反应。"
      },
      {
        title: "黑市 (商店)",
        desc: "贿赂 Ash，购买赎罪券。用积分逆天改命，或者只是买个好看的皮肤。"
      }
    ],
    action: "接入信号",
    footer: "安全连接 // E2EE // v2.3.0"
  },
  en: {
    incoming: "Incoming Transmission",
    source: "Source: Timeline 2.3 // Offset +300d",
    project: "FATE REWRITE",
    quote: "\"We detected your timeline was drifting into mediocrity. Intervention is required.\"",
    features: [
      {
        title: "Daily Fate Protocol",
        desc: "Start every morning with a Tarot reading. Your fate determines our attitude."
      },
      {
        title: "Narrative Injection",
        desc: "Ash, Rin, and Sol now react to your luck. No more boring 'Hello'."
      },
      {
        title: "Black Market (Shop)",
        desc: "Bribe Ash with coffee. Buy pardon tickets from Sol. Change your destiny."
      }
    ],
    action: "Accept Update",
    footer: "Secure Connection // E2EE // v2.3.0"
  }
};

export function AnnouncementModal({ show, onClose, lang }: AnnouncementModalProps) {
  const [visible, setVisible] = useState(false);
  const t = CONTENT[lang] || CONTENT.en; // 默认回退到英文

  useEffect(() => {
    if (show) {
      setVisible(true);
    } else {
      setTimeout(() => setVisible(false), 300);
    }
  }, [show]);

  if (!visible && !show) return null;

  return (
    <div 
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-500 ${
        show ? 'bg-black/90 backdrop-blur-sm opacity-100' : 'bg-black/0 backdrop-blur-none opacity-0'
      }`}
    >
      {/* Container: The Letter */}
      <div 
        className={`relative w-full max-w-md bg-[#050505] border border-[#7F5CFF]/30 shadow-[0_0_50px_rgba(127,92,255,0.1)] overflow-hidden font-mono text-sm leading-relaxed transition-all duration-700 transform ${
          show ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-10 scale-95 opacity-0'
        }`}
      >
        {/* Decorative: Scanline & Glow */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#7F5CFF] to-transparent shadow-[0_0_10px_#7F5CFF]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,19,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-0 bg-[length:100%_4px,3px_100%] pointer-events-none opacity-20" />

        {/* --- Header: Transmission Meta --- */}
        <div className="relative z-10 p-6 pb-4 border-b border-white/5 bg-white/[0.02]">
          <div className="flex justify-between items-start opacity-70 mb-4">
            <div className="flex flex-col gap-1">
              <span className="text-[9px] uppercase tracking-[0.2em] text-[#7F5CFF] animate-pulse">{t.incoming}</span>
              <span className="text-[10px] text-gray-500">{t.source}</span>
            </div>
            <Fingerprint size={32} className="text-[#7F5CFF]/20" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tighter">
            PROJECT: <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7F5CFF] to-white">{t.project}</span>
          </h2>
        </div>

        {/* --- Body: The Message --- */}
        <div className="relative z-10 p-6 space-y-5 text-gray-400">
          <p className="border-l-2 border-[#7F5CFF] pl-3 italic text-gray-300">
            {t.quote}
          </p>
          
          <div className="space-y-4">
            <div className="flex gap-3 items-start group">
              <div className="mt-1 p-1 bg-[#7F5CFF]/10 rounded text-[#7F5CFF] group-hover:bg-[#7F5CFF] group-hover:text-white transition-colors">
                <Sparkles size={14} />
              </div>
              <div>
                <strong className="text-white block text-xs uppercase tracking-wider mb-0.5">{t.features[0].title}</strong>
                <p className="text-xs opacity-70">{t.features[0].desc}</p>
              </div>
            </div>

            <div className="flex gap-3 items-start group">
              <div className="mt-1 p-1 bg-[#7F5CFF]/10 rounded text-[#7F5CFF] group-hover:bg-[#7F5CFF] group-hover:text-white transition-colors">
                <Terminal size={14} />
              </div>
              <div>
                <strong className="text-white block text-xs uppercase tracking-wider mb-0.5">{t.features[1].title}</strong>
                <p className="text-xs opacity-70">{t.features[1].desc}</p>
              </div>
            </div>

            <div className="flex gap-3 items-start group">
              <div className="mt-1 p-1 bg-[#7F5CFF]/10 rounded text-[#7F5CFF] group-hover:bg-[#7F5CFF] group-hover:text-white transition-colors">
                <ShoppingBag size={14} />
              </div>
              <div>
                <strong className="text-white block text-xs uppercase tracking-wider mb-0.5">{t.features[2].title}</strong>
                <p className="text-xs opacity-70">{t.features[2].desc}</p>
              </div>
            </div>
          </div>
        </div>

        {/* --- Footer: Action --- */}
        <div className="relative z-10 p-6 pt-2">
          <button 
            onClick={onClose} 
            className="group w-full py-4 bg-[#7F5CFF] hover:bg-[#6b4bd6] text-white font-bold tracking-widest uppercase text-xs flex items-center justify-center gap-2 transition-all hover:tracking-[0.25em] relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 skew-y-12" />
            <span className="relative z-10">{t.action}</span>
            <ArrowRight size={14} className="relative z-10 group-hover:translate-x-1 transition-transform" />
          </button>
          <div className="mt-3 text-center">
             <span className="text-[9px] text-gray-600">{t.footer}</span>
          </div>
        </div>

      </div>
    </div>
  );
}