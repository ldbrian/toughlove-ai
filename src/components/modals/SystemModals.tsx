import { X, Mic, MicOff, AlertTriangle, Coffee, Globe, UserPen, Bug, Download, Share, PlusSquare } from 'lucide-react';

// --- Focus Offer Modal ---
export const FocusOfferModal = ({ show, lang, onStart, onCancel }: any) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md p-6 animate-[fadeIn_0.2s_ease-out]">
      <div className="w-full max-w-sm bg-[#111] border border-emerald-500/30 rounded-2xl p-6 shadow-[0_0_50px_rgba(16,185,129,0.1)]">
        <div className="flex items-center gap-3 mb-4 text-emerald-400">
          <AlertTriangle size={24} />
          <h3 className="text-lg font-bold uppercase tracking-wider">Focus Protocol</h3>
        </div>
        <p className="text-gray-300 text-sm mb-6 leading-relaxed">
          {lang === 'zh' 
            ? "检测到你在逃避困难任务。Sol 建议立即开启专注模式。" 
            : "Laziness detected. Sol suggests initiating Focus Mode immediately."}
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 rounded-xl border border-white/10 text-gray-400 hover:text-white transition-colors text-xs font-bold">
            {lang === 'zh' ? "稍后再说" : "Later"}
          </button>
          <button onClick={onStart} className="flex-1 py-3 rounded-xl bg-emerald-500 text-black font-black hover:bg-emerald-400 transition-colors text-xs shadow-lg shadow-emerald-900/20">
            {lang === 'zh' ? "开启专注 (25m)" : "ENGAGE (25m)"}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Lang Setup Modal ---
export const LangSetupModal = ({ show, lang, onConfirm }: any) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 p-6">
      <div className="text-center space-y-8 animate-[slideUp_0.4s_ease-out]">
        <Globe size={48} className="mx-auto text-[#7F5CFF] animate-pulse" />
        <h2 className="text-2xl font-bold text-white tracking-widest">SELECT LANGUAGE</h2>
        <div className="flex flex-col gap-4 w-64 mx-auto">
          <button onClick={() => onConfirm('zh')} className={`py-4 rounded-xl border transition-all ${lang === 'zh' ? 'bg-white text-black border-white font-bold scale-105' : 'bg-transparent text-gray-500 border-white/10 hover:border-white/50'}`}>
            中文 (Chinese)
          </button>
          <button onClick={() => onConfirm('en')} className={`py-4 rounded-xl border transition-all ${lang === 'en' ? 'bg-white text-black border-white font-bold scale-105' : 'bg-transparent text-gray-500 border-white/10 hover:border-white/50'}`}>
            English
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Name Modal ---
export const NameModal = ({ show, onClose, tempName, setTempName, onSave, ui }: any) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-xs bg-[#151515] border border-white/10 rounded-2xl p-6 relative animate-[scaleIn_0.2s_ease-out]">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={18} /></button>
        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><UserPen size={16} /> {ui?.editName || "Edit Name"}</h3>
        <input 
          autoFocus
          type="text" 
          value={tempName} 
          onChange={(e) => setTempName(e.target.value)} 
          className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-center font-bold tracking-wider focus:border-[#7F5CFF] focus:outline-none transition-colors mb-4"
          placeholder="CODENAME"
        />
        <button onClick={onSave} className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors">
          {ui?.confirm || "确认 / Confirm"}
        </button>
      </div>
    </div>
  );
};

// --- Donate Modal ---
export const DonateModal = ({ show, onClose, lang, currentP, onBribe, onExternal }: any) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
      <div className="w-full max-w-sm bg-[#111] border border-yellow-500/20 rounded-2xl p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={18} /></button>
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto bg-yellow-500/10 rounded-full flex items-center justify-center mb-3 text-yellow-500">
            <Coffee size={32} />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">{lang === 'zh' ? "请我喝咖啡" : "Buy Me a Coffee"}</h3>
          <p className="text-xs text-gray-400 leading-relaxed px-4">
            {lang === 'zh' 
              ? "开发不易。你的支持能让服务器再苟延残喘几天。" 
              : "Development is hard. Your support keeps the servers alive."}
          </p>
        </div>
        <div className="space-y-3">
          <button onClick={onBribe} className="w-full py-3 bg-gradient-to-r from-yellow-600 to-yellow-500 text-black font-bold rounded-xl hover:brightness-110 transition-all shadow-lg shadow-yellow-900/20">
            {lang === 'zh' ? `贿赂 ${currentP?.name || 'AI'} (虚拟)` : `Bribe ${currentP?.name || 'AI'} (Virtual)`}
          </button>
          <button onClick={onExternal} className="w-full py-3 bg-white/5 border border-white/10 text-gray-300 font-bold rounded-xl hover:bg-white/10 transition-colors flex items-center justify-center gap-2">
            <span>Buymeacoffee.com</span> <Globe size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Feedback Modal ---
export const FeedbackModal = ({ show, onClose, text, setText, onSubmit, lang }: any) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-[#151515] border border-white/10 rounded-2xl p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={18} /></button>
        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><Bug size={16} /> {lang === 'zh' ? "反馈 / 吐槽" : "Feedback"}</h3>
        <textarea 
          autoFocus
          value={text} 
          onChange={(e) => setText(e.target.value)} 
          className="w-full h-32 bg-black/50 border border-white/10 rounded-xl p-4 text-sm text-white focus:border-[#7F5CFF] focus:outline-none resize-none mb-4"
          placeholder={lang === 'zh' ? "发现 Bug？或者单纯想骂产品经理？" : "Found a bug? Or just want to rant?"}
        />
        <button onClick={onSubmit} className="w-full py-3 bg-[#7F5CFF] text-white font-bold rounded-xl hover:bg-[#6b4bd6] transition-colors">
          {lang === 'zh' ? "发送" : "Send"}
        </button>
      </div>
    </div>
  );
};

// 🔥 [NEW] Install Modal (iOS Guide)
export const InstallModal = ({ show, onClose, lang }: any) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-[fadeIn_0.2s_ease-out]">
      <div className="w-full max-w-sm bg-[#151515] border border-white/10 rounded-2xl p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={18} /></button>
        
        <div className="text-center mb-6">
           <Download size={32} className="text-[#7F5CFF] mx-auto mb-3" />
           <h3 className="text-lg font-bold text-white mb-2">{lang === 'zh' ? "安装到主屏幕" : "Install App"}</h3>
           <p className="text-xs text-gray-400">
             {lang === 'zh' ? "Safari 限制了自动安装。请手动添加：" : "Safari blocks auto-install. Do it manually:"}
           </p>
        </div>

        <div className="space-y-4 text-sm text-gray-300">
           <div className="flex items-center gap-4 bg-white/5 p-3 rounded-xl border border-white/5">
              <Share size={20} />
              <span>{lang === 'zh' ? "1. 点击底部「分享」按钮" : "1. Tap 'Share' button"}</span>
           </div>
           <div className="flex items-center gap-4 bg-white/5 p-3 rounded-xl border border-white/5">
              <PlusSquare size={20} />
              <span>{lang === 'zh' ? "2. 选择「添加到主屏幕」" : "2. Select 'Add to Home Screen'"}</span>
           </div>
        </div>
      </div>
    </div>
  );
};