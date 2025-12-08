import { useState, useEffect } from 'react';
import { X, ShoppingBag, Lock, Coffee, Image as ImageIcon, ShieldAlert, Zap, Loader2, PackageOpen, CreditCard, Sparkles } from 'lucide-react';
import { SHOP_CATALOG, ShopItem, PERSONAS, LOOT_TABLE } from '@/lib/constants';

interface ShopModalProps {
  show: boolean;
  onClose: () => void;
  userRin: number;
  onBalanceUpdate: (newBalance: number) => void; // 购买成功后回调更新余额
  lang: 'zh' | 'en';
}

export const ShopModal = ({ show, onClose, userRin, onBalanceUpdate, lang }: ShopModalProps) => {
  const [mounted, setMounted] = useState(false);
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [showRecharge, setShowRecharge] = useState(false);
  
  // Gacha 动画状态
  const [gachaResult, setGachaResult] = useState<any | null>(null);
  const [isOpening, setIsOpening] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  if (!show || !mounted) return null;

  // --- 核心购买逻辑 ---
  const handleBuy = async (item: ShopItem) => {
    if (userRin < item.price) return;
    setBuyingId(item.id);

    try {
        // 1. 获取当前背包 (用于盲盒去重)
        const inventory = JSON.parse(localStorage.getItem('toughlove_inventory') || '[]');
        const userId = localStorage.getItem('toughlove_user_id') || 'user_01'; // 简单取 ID

        // 2. 调用后端 API
        const res = await fetch('/api/shop/buy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, itemId: item.id, currentInventory: inventory })
        });
        
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        // 3. 更新余额
        onBalanceUpdate(data.newBalance);

        // 4. 处理盲盒掉落
        if (data.droppedItemId) {
            handleGachaReveal(data.droppedItemId);
        } else {
            // 普通购买：直接入包
            // 商店物品本身不进背包，进的是“使用次数”或直接生效
            // 这里为了 MVP，如果是消耗品且非盲盒，假设它直接被使用了或者后端记录了
            // 简单处理：给个震动反馈
            if (navigator.vibrate) navigator.vibrate(50);
        }

    } catch (error) {
        console.error(error);
        alert(lang === 'zh' ? '交易失败' : 'Transaction Failed');
    } finally {
        setBuyingId(null);
    }
  };

  // --- 盲盒开箱动画 ---
  const handleGachaReveal = (itemId: string) => {
      setIsOpening(true);
      // 模拟开箱延迟
      setTimeout(() => {
          const droppedItem = LOOT_TABLE[itemId];
          setGachaResult(droppedItem);
          setIsOpening(false);
          
          // 写入本地背包
          const oldInv = JSON.parse(localStorage.getItem('toughlove_inventory') || '[]');
          if (!oldInv.includes(itemId)) {
              localStorage.setItem('toughlove_inventory', JSON.stringify([...oldInv, itemId]));
          }
      }, 1500);
  };

  // --- 充值模拟 ---
  const handleRecharge = (amount: number, rin: number) => {
      // 模拟跳转支付
      const confirmText = lang === 'zh' ? `跳转支付 ¥${amount}?` : `Pay ¥${amount}?`;
      if (confirm(confirmText)) {
          // 模拟到账
          setTimeout(() => {
              onBalanceUpdate(userRin + rin);
              setShowRecharge(false);
              alert(lang === 'zh' ? '充值成功 (测试环境)' : 'Payment Success (Test Mode)');
          }, 1000);
      }
  };

  const renderItemIcon = (id: string, type: string) => {
    const iconSize = 24;
    if (id.includes('crate')) return <PackageOpen size={iconSize} className="text-purple-400" />;
    if (id.includes('coffee')) return <Coffee size={iconSize} className="text-amber-500" />;
    if (type === 'visual') return <ImageIcon size={iconSize} className="text-blue-400" />;
    if (id.includes('pardon')) return <ShieldAlert size={iconSize} className="text-red-500" />;
    return <Zap size={iconSize} className="text-gray-400" />;
  };

  // Gacha Overlay
  if (gachaResult || isOpening) {
      return (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/95 backdrop-blur-xl animate-in fade-in">
              <div className="flex flex-col items-center gap-6">
                  {isOpening ? (
                      <div className="animate-[bounce_0.5s_infinite] text-[#7F5CFF]">
                          <PackageOpen size={80} />
                      </div>
                  ) : (
                      <div className="flex flex-col items-center animate-[scaleIn_0.3s_ease-out]">
                          <div className={`w-24 h-24 rounded-2xl flex items-center justify-center border-2 mb-4 bg-black/50 ${gachaResult.rarity === 'legendary' ? 'border-amber-500 shadow-[0_0_30px_#f59e0b]' : 'border-[#7F5CFF] shadow-[0_0_20px_#7c3aed]'}`}>
                              {/* 兼容 iconSvg */}
                              {gachaResult.iconSvg?.startsWith('/') ? <img src={gachaResult.iconSvg} className="w-16 h-16 object-contain"/> : <span className="text-5xl">{gachaResult.iconSvg}</span>}
                          </div>
                          <h3 className="text-2xl font-black text-white uppercase tracking-widest">{lang === 'zh' ? gachaResult.name.zh : gachaResult.name.en}</h3>
                          <p className="text-gray-400 text-sm mt-2 max-w-xs text-center">{lang === 'zh' ? gachaResult.description.zh : gachaResult.description.en}</p>
                          <button onClick={() => setGachaResult(null)} className="mt-8 px-8 py-3 bg-white text-black font-bold rounded-full hover:scale-105 transition-transform">
                              {lang === 'zh' ? '收下' : 'KEEP IT'}
                          </button>
                      </div>
                  )}
                  {isOpening && <p className="text-xs font-mono text-[#7F5CFF] animate-pulse">DECRYPTING BOX...</p>}
              </div>
          </div>
      )
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out] p-4">
      <div className="w-full max-w-lg bg-[#121212] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] relative">
        
        {/* 充值 Overlay */}
        {showRecharge && (
            <div className="absolute inset-0 z-20 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-in fade-in">
                <h3 className="text-yellow-500 font-bold tracking-widest mb-6 flex items-center gap-2"><CreditCard /> RECHARGE</h3>
                <div className="grid grid-cols-2 gap-4 w-full">
                    <button onClick={() => handleRecharge(1, 100)} className="p-4 border border-white/10 rounded-xl hover:bg-white/10 transition-colors flex flex-col items-center">
                        <span className="text-2xl font-black text-white">¥ 1.00</span>
                        <span className="text-xs text-yellow-500 mt-1">100 RIN</span>
                    </button>
                    <button onClick={() => handleRecharge(6, 800)} className="p-4 border border-yellow-500/30 bg-yellow-500/5 rounded-xl hover:bg-yellow-500/10 transition-colors flex flex-col items-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 bg-red-500 text-white text-[8px] px-1.5 py-0.5 font-bold">+20%</div>
                        <span className="text-2xl font-black text-yellow-400">¥ 6.00</span>
                        <span className="text-xs text-yellow-600 mt-1">800 RIN</span>
                    </button>
                </div>
                <button onClick={() => setShowRecharge(false)} className="mt-8 text-gray-500 text-xs hover:text-white">CANCEL</button>
            </div>
        )}

        {/* Header */}
        <div className="relative p-6 bg-gradient-to-b from-[#1a1a1a] to-[#121212] border-b border-white/5">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
          
          <div className="flex items-start gap-4">
            <div className="relative w-14 h-14 rounded-full border-2 border-blue-500/30 overflow-hidden shrink-0 mt-1">
               <img src={PERSONAS.Ash.avatar} className="w-full h-full object-cover" alt="Ash" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                 <h2 className="text-sm font-black text-blue-500 tracking-widest uppercase">TOUGH SHOP</h2>
                 {/* 余额 + 充值按钮 */}
                 <div className="flex items-center gap-1">
                    <div className="px-2 py-0.5 bg-yellow-500/10 border border-yellow-500/20 rounded text-[10px] text-yellow-500 font-mono flex items-center gap-1">
                        <ShoppingBag size={10} />
                        <span>{userRin} RIN</span>
                    </div>
                    <button onClick={() => setShowRecharge(true)} className="w-5 h-5 flex items-center justify-center bg-yellow-500 text-black text-xs font-bold rounded hover:bg-yellow-400 transition-colors">+</button>
                 </div>
              </div>
              <div className="relative bg-white/5 border border-white/10 rounded-xl rounded-tl-none p-3 w-full">
                 <p className="text-sm text-gray-200 italic leading-relaxed break-words">
                   "{lang === 'zh' ? '想要什么？如果是来买后悔药的，出门右转。' : 'Make it quick. No refunds for regrets.'}"
                 </p>
              </div>
            </div>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
          {SHOP_CATALOG.map((item) => {
            // 解析效果标签
            const effect = item.effect;
            const moodBonus = effect?.mood_value ? `😊+${effect.mood_value}` : '';
            const bondBonus = effect?.favorability ? `❤️+${effect.favorability}` : '';
            
            return (
                <div key={item.id} className="group relative flex items-center gap-4 p-4 bg-[#181818] border border-white/5 hover:border-blue-500/30 rounded-xl transition-all active:scale-[0.99]">
                <div className="w-12 h-12 rounded-lg bg-black/50 border border-white/10 flex items-center justify-center shrink-0 group-hover:shadow-[0_0_15px_rgba(59,130,246,0.15)] transition-shadow">
                    {renderItemIcon(item.id, item.type)}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                    <h3 className="text-sm font-bold text-gray-200 truncate pr-2">{lang === 'zh' ? item.name.zh : item.name.en}</h3>
                    <span className={`text-xs font-mono font-bold ${userRin >= item.price ? 'text-yellow-500' : 'text-red-500'}`}>{item.price}</span>
                    </div>
                    <p className="text-[10px] text-gray-500 leading-tight line-clamp-2 mb-1.5">{lang === 'zh' ? item.desc.zh : item.desc.en}</p>
                    
                    {/* 效果标签 */}
                    <div className="flex gap-2">
                        {moodBonus && <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">{moodBonus}</span>}
                        {bondBonus && <span className="text-[9px] px-1.5 py-0.5 rounded bg-pink-500/10 text-pink-400 border border-pink-500/20">{bondBonus}</span>}
                    </div>
                </div>
                
                <button onClick={() => handleBuy(item)} disabled={userRin < item.price || buyingId !== null} className="absolute inset-0 z-10 w-full h-full opacity-0 hover:opacity-100 transition-opacity bg-black/60 flex items-center justify-center backdrop-blur-[1px] rounded-xl cursor-pointer disabled:cursor-not-allowed">
                    {buyingId === item.id ? <Loader2 className="animate-spin text-blue-500" size={24} /> : userRin >= item.price ? <span className="font-bold text-white text-xs tracking-wider border border-white/30 px-4 py-1.5 rounded-full bg-white/10 hover:bg-blue-500 hover:border-blue-500 transition-colors">{lang === 'zh' ? '购买' : 'BUY'}</span> : <div className="flex items-center gap-1 text-red-500 text-xs font-bold"><Lock size={12} /><span>POOR</span></div>}
                </button>
                </div>
            );
          })}
        </div>
        <div className="p-4 bg-[#121212] border-t border-white/5 text-center">
           <p className="text-[10px] text-gray-600 font-mono uppercase tracking-widest">NO REFUNDS / 概不退换</p>
        </div>
      </div>
    </div>
  );
};