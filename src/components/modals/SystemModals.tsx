import { X, Sparkles, UserPen, Bug, Coffee, QrCode, ExternalLink, Gift } from 'lucide-react';
import { TRIAGE_TEXT } from '@/lib/constants';

// --- Triage Modal ---
export const TriageModal = ({ show, lang, onSelect }: any) => {
  if (!show) return null;
  const t = TRIAGE_TEXT[lang as 'zh'|'en'];
  return (
    <div className="absolute inset-0 z-[300] bg-black flex flex-col items-center justify-center p-6 animate-[fadeIn_0.5s_ease-out]">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2"><div className="w-16 h-16 bg-[#1a1a1a] rounded-full flex items-center justify-center text-3xl border border-white/10 mx-auto mb-4 shadow-[0_0_30px_rgba(127,92,255,0.2)] animate-pulse">⚡</div><h1 className="text-2xl font-bold text-white tracking-wider">{t.title}</h1><p className="text-sm text-gray-500">{t.subtitle}</p></div>
        <div className="space-y-3">
          {[{id:'Ash',icon:'🌙',opt:t.opt1,desc:t.desc1,color:'blue'},{id:'Sol',icon:'⛓️',opt:t.opt2,desc:t.desc2,color:'emerald'},{id:'Rin',icon:'🔥',opt:t.opt3,desc:t.desc3,color:'pink'}].map((item) => (
            <button key={item.id} onClick={() => onSelect(item.id)} className={`w-full group relative p-5 rounded-2xl bg-[#111] border border-white/10 hover:border-${item.color}-500/50 transition-all text-left overflow-hidden active:scale-95`}>
              <div className={`absolute inset-0 bg-gradient-to-r from-transparent to-${item.color}-500/10 opacity-0 group-hover:opacity-100 transition-opacity`}/>
              <div className="relative z-10"><div className="flex justify-between items-center mb-1"><span className="text-lg font-bold text-white">{item.opt}</span><span className="text-2xl">{item.icon}</span></div><p className="text-xs text-gray-500">{item.desc}</p></div>
            </button>
          ))}
        </div>
        <p className="text-center text-[10px] text-gray-600 pt-8">{t.footer}</p>
      </div>
    </div>
  );
};

// --- Focus Offer Modal ---
export const FocusOfferModal = ({ show, lang, onStart, onCancel }: any) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/95 backdrop-blur-md p-6 animate-[fadeIn_0.2s_ease-out]">
      <div className="w-full max-w-sm bg-[#111] border border-red-900/50 rounded-2xl p-6 text-center shadow-[0_0_50px_rgba(220,38,38,0.2)]">
        <div className="text-4xl mb-4">⛓️</div>
        <h2 className="text-xl font-bold text-white mb-2">{lang === 'zh' ? '专注协议' : 'FOCUS PROTOCOL'}</h2>
        <p className="text-sm text-gray-400 mb-6">{lang === 'zh' ? '一旦签署，未来 25 分钟内禁止一切娱乐。切后台将导致计时暂停。' : 'Once signed, no entertainment for 25 mins. Leaving app pauses the timer.'}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 text-xs font-bold">{lang === 'zh' ? '我再想想' : 'CANCEL'}</button>
          <button onClick={onStart} className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-[0_0_15px_#dc2626] animate-pulse">{lang === 'zh' ? '签字执行' : 'SIGN & EXECUTE'}</button>
        </div>
      </div>
    </div>
  );
};

// --- Donate Modal ---
export const DonateModal = ({ show, onClose, lang, currentP, onBribe, onExternal }: any) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-[170] flex items-center justify-center bg-black/90 backdrop-blur-sm p-6 animate-[fadeIn_0.2s_ease-out]">
      <div className="w-full max-w-sm bg-[#1a1a1a] rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white"><X size={20}/></button>
        <div className="p-8 text-center">
          <div className="inline-flex p-4 bg-yellow-500/10 rounded-full mb-4 text-yellow-500 shadow-[0_0_30px_rgba(234,179,8,0.2)]"><Coffee size={32} /></div>
          <h3 className="text-xl font-bold text-white mb-2">Buy {currentP.name} a Coffee</h3>
          <p className="text-xs text-gray-400 mb-6">{lang === 'zh' ? '你的支持能让 Sol 少骂两句，让 Ash 多买包烟。' : 'Fuel the AI. Keep the servers (and Sol) happy.'}</p>
          <div className="bg-white/5 p-4 rounded-2xl border border-white/5 mb-4"><div className="flex items-center justify-center gap-2 mb-3 text-sm text-gray-300"><QrCode size={16} className="text-green-500" /> <span>WeChat Pay / 微信支付</span></div><div className="w-40 h-40 bg-white mx-auto rounded-lg flex items-center justify-center overflow-hidden"><img src="/wechat_pay.jpg" alt="WeChat Pay" className="w-full h-full object-cover" /></div></div>
          <div className="space-y-3">
            <button onClick={onExternal} className="w-full py-3 rounded-xl bg-[#FFDD00] hover:bg-[#ffea00] text-black font-bold text-sm flex items-center justify-center gap-2 transition-colors"><Coffee size={16} fill="black" /><span>Buy Me a Coffee (USD)</span><ExternalLink size={14} /></button>
            <button onClick={onBribe} className="w-full py-3 rounded-xl bg-[#7F5CFF]/20 hover:bg-[#7F5CFF]/30 text-[#7F5CFF] font-bold text-sm border border-[#7F5CFF]/50 flex items-center justify-center gap-2 transition-colors animate-pulse"><Gift size={16} /><span>{lang === 'zh' ? '我已支付，快唤醒 AI' : 'I have paid. Wake them up.'}</span></button>
          </div>
          <p className="text-[10px] text-gray-600 text-center mt-4">{lang === 'zh' ? '* 这是一个基于信任的按钮。Sol 正在看着你的良心。' : '* Trust-based button. Don\'t lie to AI.'}</p>
        </div>
      </div>
    </div>
  );
};

// --- Other Small Modals ---
export const LangSetupModal = ({ show, lang, onConfirm }: any) => {
  if (!show) return null;
  return (<div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 animate-[fadeIn_0.5s_ease-out]"><div className="mb-10 text-center"><div className="w-20 h-20 bg-[#1a1a1a] rounded-full flex items-center justify-center text-4xl border border-white/10 mx-auto mb-4 shadow-[0_0_30px_rgba(127,92,255,0.3)]">🧬</div><h1 className="text-2xl font-bold text-white tracking-wider mb-2">TOUGHLOVE AI</h1><p className="text-gray-500 text-sm">Choose your language / 选择语言</p></div><div className="flex flex-col gap-4 w-full max-w-xs"><button onClick={() => onConfirm('zh')} className={`p-6 rounded-2xl border transition-all flex items-center justify-between group ${lang === 'zh' ? 'bg-white/10 border-[#7F5CFF]' : 'bg-[#111] border-white/10 hover:border-white/30'}`}><div className="text-left"><div className="text-lg font-bold text-white">中文</div><div className="text-xs text-gray-500">Chinese</div></div>{lang === 'zh' && <div className="w-3 h-3 bg-[#7F5CFF] rounded-full shadow-[0_0_10px_#7F5CFF]"></div>}</button><button onClick={() => onConfirm('en')} className={`p-6 rounded-2xl border transition-all flex items-center justify-between group ${lang === 'en' ? 'bg-white/10 border-[#7F5CFF]' : 'bg-[#111] border-white/10 hover:border-white/30'}`}><div className="text-left"><div className="text-lg font-bold text-white">English</div><div className="text-xs text-gray-500">English</div></div>{lang === 'en' && <div className="w-3 h-3 bg-[#7F5CFF] rounded-full shadow-[0_0_10px_#7F5CFF]"></div>}</button></div></div>);
};

export const NameModal = ({ show, onClose, tempName, setTempName, onSave, ui }: any) => {
  if (!show) return null;
  return (<div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-sm p-6 animate-[fadeIn_0.2s_ease-out]"><div className="w-full max-w-xs bg-[#1a1a1a] rounded-3xl border border-white/10 shadow-2xl p-6"><div className="text-center mb-6"><div className="inline-flex p-3 bg-white/5 rounded-full mb-3 text-[#7F5CFF]"><UserPen size={24}/></div><h3 className="text-lg font-bold text-white">{ui.editName}</h3></div><input type="text" value={tempName} onChange={(e:any) => setTempName(e.target.value)} placeholder={ui.namePlaceholder} className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#7F5CFF] outline-none mb-6 text-center" maxLength={10} /><div className="flex gap-3"><button onClick={onClose} className="flex-1 py-3 rounded-xl bg-white/5 text-gray-400 text-sm hover:bg-white/10 transition-colors">Cancel</button><button onClick={onSave} className="flex-1 py-3 rounded-xl bg-[#7F5CFF] text-white font-bold text-sm hover:bg-[#6b4bd6] transition-colors">{ui.nameSave}</button></div></div></div>);
};

export const FeedbackModal = ({ show, onClose, text, setText, onSubmit, lang }: any) => {
  if (!show) return null;
  return (<div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-sm p-6 animate-[fadeIn_0.2s_ease-out]"><div className="w-full max-w-sm bg-[#1a1a1a] rounded-3xl border border-white/10 shadow-2xl p-6 relative"><button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={20}/></button><div className="text-center mb-6"><div className="inline-flex p-3 bg-purple-500/10 rounded-full mb-3 text-purple-400"><Bug size={24}/></div><h3 className="text-lg font-bold text-white">{lang === 'zh' ? '意见反馈' : 'Feedback'}</h3><p className="text-xs text-gray-400 mt-1">{lang === 'zh' ? '发现 Bug 或有好点子？' : 'Found a bug?'}</p></div><textarea value={text} onChange={(e:any) => setText(e.target.value)} placeholder={lang === 'zh' ? '请告诉我...' : 'Tell me...'} className="w-full h-32 bg-[#111] border border-white/10 rounded-xl p-4 text-sm text-white focus:border-[#7F5CFF] outline-none resize-none mb-4"/><button onClick={onSubmit} className="w-full py-3 rounded-xl bg-[#7F5CFF] text-white font-bold text-sm hover:bg-[#6b4bd6] transition-colors">{lang === 'zh' ? '发送' : 'Send'}</button></div></div>);
};

export const UpdateModal = ({ show, onClose, ui, onTry }: any) => {
  if (!show) return null;
  return (<div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-6 animate-[fadeIn_0.3s_ease-out]"><div className="w-full max-w-sm bg-gradient-to-br from-[#111] to-[#0a0a0a] rounded-3xl border border-indigo-500/30 shadow-[0_0_50px_rgba(99,102,241,0.15)] overflow-hidden relative animate-[scaleIn_0.3s_cubic-bezier(0.16,1,0.3,1)]"><button onClick={onClose} className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white z-10 transition-colors"><X size={20} /></button><div className="p-8 flex flex-col items-center text-center relative"><div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-indigo-900/20 to-transparent pointer-events-none"></div><div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase tracking-wider mb-6"><Sparkles size={12} /> {ui.updateTitle}</div><div className="relative w-20 h-20 mb-6"><div className="w-full h-full rounded-full bg-[#151515] flex items-center justify-center text-5xl border border-white/10 shadow-xl relative z-10">👁️</div><div className="absolute inset-0 bg-indigo-500 blur-xl opacity-30 animate-pulse"></div></div><h3 className="text-xl font-bold text-white mb-3">{ui.updateDesc}</h3><p className="text-sm text-gray-400 leading-relaxed whitespace-pre-line">{ui.updateContent}</p></div><div className="p-6 pt-0"><button onClick={onTry} className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all shadow-lg shadow-indigo-900/20 flex items-center justify-center gap-2 group">{ui.tryNow}<span className="group-hover:translate-x-1 transition-transform">→</span></button></div></div></div>);
};