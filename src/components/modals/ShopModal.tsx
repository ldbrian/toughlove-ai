import { useState, useEffect } from 'react';
import { X, ShoppingBag, Lock, Coffee, Image as ImageIcon, ShieldAlert, Zap, Loader2 } from 'lucide-react';
import { SHOP_CATALOG, ShopItem, UI_TEXT, PERSONAS } from '@/lib/constants';

interface ShopModalProps {
  show: boolean;
  onClose: () => void;
  userRin: number;
  onBuy: (item: ShopItem) => void;
  lang: 'zh' | 'en';
  isBuying: boolean;
}

export const ShopModal = ({ show, onClose, userRin, onBuy, lang, isBuying }: ShopModalProps) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  if (!show || !mounted) return null;

  const renderItemIcon = (id: string, type: string) => {
    const iconSize = 24;
    if (id.includes('coffee')) return <Coffee size={iconSize} className="text-amber-500" />;
    if (type === 'visual') return <ImageIcon size={iconSize} className="text-blue-400" />;
    if (id.includes('pardon')) return <ShieldAlert size={iconSize} className="text-red-500" />;
    return <Zap size={iconSize} className="text-gray-400" />;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out] p-4">
      {/* 宽度稍微加大到 max-w-lg */}
      <div className="w-full max-w-lg bg-[#121212] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="relative p-6 bg-gradient-to-b from-[#1a1a1a] to-[#121212] border-b border-white/5">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
          
          <div className="flex items-start gap-4">
            <div className="relative w-14 h-14 rounded-full border-2 border-blue-500/30 overflow-hidden shrink-0 mt-1">
               <img src={PERSONAS.Ash.avatar} className="w-full h-full object-cover" alt="Ash" />
            </div>

            {/* 🔥 [UI FIX] 气泡布局优化 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                 <h2 className="text-sm font-black text-blue-500 tracking-widest uppercase">TOUGH SHOP</h2>
                 <div className="px-2 py-0.5 bg-yellow-500/10 border border-yellow-500/20 rounded text-[10px] text-yellow-500 font-mono flex items-center gap-1">
                    <ShoppingBag size={10} />
                    <span>{userRin} RIN</span>
                 </div>
              </div>
              <div className="relative bg-white/5 border border-white/10 rounded-xl rounded-tl-none p-3 w-full">
                 <p className="text-sm text-gray-200 italic leading-relaxed break-words">
                   "{lang === 'zh' ? '选好了吗？我的时间很宝贵。' : 'Make it quick. I have things to do.'}"
                 </p>
              </div>
            </div>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
          {SHOP_CATALOG.map((item) => (
            <div key={item.id} className="group relative flex items-center gap-4 p-4 bg-[#181818] border border-white/5 hover:border-blue-500/30 rounded-xl transition-all active:scale-[0.99]">
              <div className="w-12 h-12 rounded-lg bg-black/50 border border-white/10 flex items-center justify-center shrink-0 group-hover:shadow-[0_0_15px_rgba(59,130,246,0.15)] transition-shadow">
                 {renderItemIcon(item.id, item.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="text-sm font-bold text-gray-200 truncate pr-2">{lang === 'zh' ? item.name.zh : item.name.en}</h3>
                  <span className={`text-xs font-mono font-bold ${userRin >= item.price ? 'text-yellow-500' : 'text-red-500'}`}>{item.price}</span>
                </div>
                <p className="text-[10px] text-gray-500 leading-tight line-clamp-2">{lang === 'zh' ? item.desc.zh : item.desc.en}</p>
              </div>
              <button onClick={() => onBuy(item)} disabled={userRin < item.price || isBuying} className="absolute inset-0 z-10 w-full h-full opacity-0 hover:opacity-100 transition-opacity bg-black/60 flex items-center justify-center backdrop-blur-[1px] rounded-xl cursor-pointer disabled:cursor-not-allowed">
                {isBuying ? <Loader2 className="animate-spin text-blue-500" size={24} /> : userRin >= item.price ? <span className="font-bold text-white text-xs tracking-wider border border-white/30 px-4 py-1.5 rounded-full bg-white/10 hover:bg-blue-500 hover:border-blue-500 transition-colors">{lang === 'zh' ? '购买' : 'BUY'}</span> : <div className="flex items-center gap-1 text-red-500 text-xs font-bold"><Lock size={12} /><span>{lang === 'zh' ? '余额不足' : 'POOR'}</span></div>}
              </button>
            </div>
          ))}
        </div>
        <div className="p-4 bg-[#121212] border-t border-white/5 text-center">
           <p className="text-[10px] text-gray-600 font-mono uppercase tracking-widest">NO REFUNDS / 概不退换</p>
        </div>
      </div>
    </div>
  );
};