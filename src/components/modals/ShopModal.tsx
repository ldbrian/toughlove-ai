

import { useState } from 'react';
import { X, ShoppingBag, Coins, Lock } from 'lucide-react';
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
  // -----------------------------------------------------------
  // ✅ 修复点：Hooks 必须在最上面声明，不能被 if return 阻断
  // -----------------------------------------------------------
  
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
  
  const currentLang = lang || 'zh';
  const ui = UI_TEXT[currentLang] || UI_TEXT['zh'];

  // Ash 的台词库 (Ash 作为掌柜)
  const ashQuotes = {
    zh: [
      "带钱了吗？我不做慈善。",
      "有些东西，是你用努力（Rin）换来的。",
      "选好了吗？我的时间很宝贵。",
      "现实是残酷的，但这里可以做交易。"
    ],
    en: [
      "Bring money? I'm not a charity.",
      "Everything has a price.",
      "Make your choice. I'm busy.",
      "Reality is harsh. Trade is fair."
    ]
  };
  
  // 为了防止每次渲染都随机跳动，这里可以简单固定或者用 memo，
  // 但为了简化，我们暂时允许它随机，或者你可以用 useState 存起来。
  // 这里暂时保持原样，只修复 Hook 顺序。
  const randomQuote = ashQuotes[currentLang === 'zh' ? 'zh' : 'en'][Math.floor(Math.random() * 4)];

  // -----------------------------------------------------------
  // ✅ 修复点：条件返回必须放在 Hooks 之后
  // -----------------------------------------------------------
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-[fadeIn_0.3s_ease-out]">
      <div className="w-full max-w-md relative bg-[#0a0a0a] rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header: Ash The Merchant */}
        <div className="relative h-32 bg-gradient-to-b from-blue-900/30 to-transparent flex items-center px-6 gap-4 border-b border-white/5 flex-shrink-0">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={20}/></button>
          <div className="w-16 h-16 rounded-full border-2 border-blue-500/50 overflow-hidden shadow-[0_0_20px_rgba(59,130,246,0.3)]">
            <img src={PERSONAS.Ash?.avatar || '/avatars/Ash.png'} alt="Ash" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">TOUGH SHOP</span>
              <div className="px-2 py-0.5 bg-yellow-500/10 border border-yellow-500/30 rounded-full flex items-center gap-1 text-[10px] text-yellow-500 font-mono">
                <Coins size={10} />
                <span>{userRin} RIN</span>
              </div>
            </div>
            <p className="text-sm text-gray-300 italic font-serif leading-tight">"{randomQuote}"</p>
          </div>
        </div>

        {/* Catalog Grid */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {SHOP_CATALOG.map((item) => {
            const canAfford = userRin >= item.price;
            const isSelected = selectedItem?.id === item.id;
            return (
              <div 
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className={`group relative p-4 rounded-xl border transition-all cursor-pointer flex items-center gap-4
                  ${isSelected ? 'bg-white/10 border-blue-500/50' : 'bg-[#111] border-white/5 hover:border-white/20'}
                `}
              >
                <div className="w-12 h-12 rounded-lg bg-[#050505] flex items-center justify-center text-2xl shadow-inner border border-white/5">
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="font-bold text-white text-sm truncate">{currentLang === 'zh' ? item.name.zh : item.name.en}</h3>
                    <span className={`text-xs font-mono font-bold ${canAfford ? 'text-yellow-500' : 'text-red-500'}`}>{item.price}</span>
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                    {currentLang === 'zh' ? item.desc.zh : item.desc.en}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer: Action Button */}
        <div className="p-4 border-t border-white/5 bg-[#0f0f0f] flex-shrink-0">
          <button
            disabled={!selectedItem || userRin < (selectedItem?.price || 0) || isBuying}
            onClick={() => selectedItem && onBuy(selectedItem)}
            className={`w-full py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all
              ${!selectedItem 
                ? 'bg-white/5 text-gray-600 cursor-not-allowed' 
                : userRin < selectedItem.price 
                  ? 'bg-red-900/20 text-red-500 border border-red-900/50 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]'
              }
            `}
          >
            {isBuying ? (
               <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
            ) : (
               <>
                 {userRin < (selectedItem?.price || 0) ? <Lock size={16} /> : <ShoppingBag size={16} />}
                 {userRin < (selectedItem?.price || 0) ? (currentLang === 'zh' ? '余额不足' : 'Insufficent Funds') : (currentLang === 'zh' ? '确认交易 (DEAL)' : 'CONFIRM DEAL')}
               </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};