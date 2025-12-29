import { useState, useEffect } from 'react';
import { X, ShoppingBag, Lock, Zap, Loader2, PackageOpen, CreditCard, Terminal } from 'lucide-react';
import { PERSONAS } from '@/lib/constants';
import { LangType } from '@/types';
import { getDeviceId } from '@/lib/utils';
import { createClient } from '@/utils/supabase/client';
import { getContentText } from '@/lib/i18n/dictionaries';
import { useRouter } from 'next/navigation'; // 引入 router 用于页面模式下的返回

interface ShopModalProps {
  show: boolean;
  onClose: () => void;
  userRin: number;
  onBalanceUpdate: (newBalance: number) => void;
  lang: LangType;
  initialCatalog?: any[]; 
  isPage?: boolean; // 🔥 新增：是否作为独立页面渲染
}

// 注意这里解构出了 isPage
export const ShopModal = ({ show, onClose, userRin, onBalanceUpdate, lang, initialCatalog = [], isPage = false }: ShopModalProps) => {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'catalog' | 'recharge'>('catalog');
  const [buyingId, setBuyingId] = useState<string | null>(null);
  
  const [shopCatalog, setShopCatalog] = useState<any[]>(initialCatalog);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(initialCatalog.length === 0);
  
  const [payStatus, setPayStatus] = useState<'idle' | 'processing' | 'ash_intervene' | 'success' | 'limit_reached'>('idle');
  const [showAshOverlay, setShowAshOverlay] = useState(false);
  const [gachaResult, setGachaResult] = useState<any | null>(null);
  const [isOpening, setIsOpening] = useState(false);

  const supabase = createClient();

  useEffect(() => { 
      setMounted(true);
      if(show || isPage) { // isPage 模式下默认视为 show
        setActiveTab('catalog');
        setPayStatus('idle');
        
        if (initialCatalog.length === 0) {
            fetchShopCatalog(); 
        }
      }
  }, [show, initialCatalog, isPage]);

  // ... (fetchShopCatalog, handleBuy, handleAshPay, completeAshPayment, handleGachaReveal 逻辑完全不变，为了节省篇幅我省略这部分重复代码，请保留原样) ...
  // ... (如果你需要我也能完整发出来，但核心逻辑没变) ...
  // 👇 这里为了确保代码完整性，我把省略的逻辑补回来，你直接复制覆盖即可

  const fetchShopCatalog = async () => {
      try {
          setIsLoadingCatalog(true);
          const { data, error } = await supabase
            .from('shop_items') 
            .select('*')
            .gt('price', 0)
            .order('price', { ascending: true });

          if (error) throw error;

          if (data) {
              const formatted = data.map((item: any) => ({
                  id: item.id,
                  name_json: item.name_json || { zh: '未知商品', en: 'Unknown' },
                  desc_json: item.desc_json || { zh: '...', en: '...' },
                  price: item.price,
                  type: item.type,
                  icon: item.icon || '📦'
              }));
              setShopCatalog(formatted);
          }
      } catch (e: any) {
          console.error("Shop load failed:", e.message || e);
      } finally {
          setIsLoadingCatalog(false);
      }
  };
  
  const handleBuy = async (item: any) => {
    if (userRin < item.price) return;
    setBuyingId(item.id);

    try {
        const userId = getDeviceId();
        const res = await fetch('/api/shop/buy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, itemId: item.id })
        });
        
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        onBalanceUpdate(data.newBalance);
        window.dispatchEvent(new Event('toughlove_inventory_update'));

        if (item.type === 'collectible' || item.id.includes('box')) {
             handleGachaReveal(item); 
        } else {
            if (navigator.vibrate) navigator.vibrate(50);
        }
    } catch (error: any) {
        console.error(error);
        alert(lang === 'zh' ? `购买失败: ${error.message}` : `Failed: ${error.message}`);
    } finally {
        setBuyingId(null);
    }
  };

  const handleAshPay = (amountRin: number) => {
    const hasUsed = localStorage.getItem('ash_one_time_gift');
    if (hasUsed) {
      setPayStatus('limit_reached');
      setTimeout(() => setPayStatus('idle'), 3000);
      return;
    }
    setPayStatus('processing');
    setTimeout(() => {
      setPayStatus('ash_intervene');
      setShowAshOverlay(true);
      setTimeout(() => {
        completeAshPayment(amountRin);
      }, 2500);
    }, 1500);
  };

  const completeAshPayment = (amountRin: number) => {
    localStorage.setItem('ash_one_time_gift', 'true');
    setShowAshOverlay(false);
    setPayStatus('success');
    onBalanceUpdate(userRin + amountRin);
    if (navigator.vibrate) navigator.vibrate([50, 50, 200]);
    setTimeout(() => { setPayStatus('idle'); }, 2000);
  };

  const handleGachaReveal = (item: any) => {
      setIsOpening(true);
      setTimeout(() => {
          setGachaResult(item);
          setIsOpening(false);
      }, 1500);
  };

  const renderItemIcon = (icon: string) => {
    if (!icon) return <Zap size={24} className="text-gray-400" />;
    if (icon.length < 5) return <span className="text-xl">{icon}</span>; 
    return <img src={icon} className="w-full h-full object-cover" />;
  };

  if ((!show && !isPage) || !mounted) return null;

  // --- 样式逻辑分叉 ---
  
  // 1. 容器样式
  // Page 模式: 全屏背景，没有 fixed 定位
  // Modal 模式: fixed 定位，有 backdrop
  const containerClass = isPage 
    ? "min-h-screen w-full bg-[#050505] flex flex-col items-center pb-24" // pb-24 为底部导航栏留空
    : "fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out] p-4";

  // 2. 卡片样式
  // Page 模式: 也就是普通的一块区域，不需要 shadow-2xl 或者 border (或者可以保留 border 增加质感)
  // Modal 模式: 需要 shadow 和 max-h 限制
  const cardClass = isPage
    ? "w-full max-w-md flex-1 flex flex-col relative" // 铺满高度
    : "w-[95vw] max-w-md bg-[#121212] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] relative";

  // --- 彩蛋与弹窗 Overlay (始终覆盖全屏) ---
  const renderOverlay = () => {
    if (showAshOverlay) {
        return (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
             {/* ... Ash Pay 内容保持不变 ... */}
             <div className="flex flex-col items-center gap-6 p-8 relative">
                 <div className="absolute inset-0 bg-pink-500/10 blur-[60px] rounded-full animate-pulse" />
                 <div className="relative z-10 animate-[bounce_1s_infinite]">
                    <div className="w-20 h-20 rounded-full border-2 border-pink-500 shadow-[0_0_30px_rgba(236,72,153,0.6)] overflow-hidden mx-auto mb-4">
                         <img src={PERSONAS.Ash.avatar} className="w-full h-full object-cover" alt="Ash" />
                    </div>
                 </div>
                 <div className="text-center relative z-10 space-y-2">
                    <h3 className="text-2xl font-black text-pink-400 italic">"Wait."</h3>
                    <p className="text-white/90 text-lg font-medium typing-effect max-w-xs mx-auto leading-relaxed">
                       {lang === 'zh' ? "“啧，真麻烦... 这次算我的。\n下不为例哦。”" : "“Tsk, troublesome...\nThis one is on me. Just this once.”"}
                    </p>
                 </div>
                 <div className="mt-4 flex items-center gap-2 text-xs font-mono text-pink-500/70 animate-pulse">
                    <Terminal size={12} />
                    <span>OVERRIDE_PAYMENT_PROTOCOL... SUCCESS</span>
                 </div>
            </div>
          </div>
        )
    }
    if (gachaResult || isOpening) {
        return (
            <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/95 backdrop-blur-xl animate-in fade-in">
               {/* ... Gacha 内容保持不变 ... */}
                <div className="flex flex-col items-center gap-6">
                  {isOpening ? (
                      <div className="animate-[bounce_0.5s_infinite] text-[#7F5CFF]">
                          <PackageOpen size={80} />
                      </div>
                  ) : (
                      <div className="flex flex-col items-center animate-[scaleIn_0.3s_ease-out]">
                          <div className="w-24 h-24 rounded-2xl flex items-center justify-center border-2 border-[#7F5CFF] shadow-[0_0_20px_#7c3aed] mb-4 bg-black/50">
                              {renderItemIcon(gachaResult.icon)}
                          </div>
                          <h3 className="text-2xl font-black text-white uppercase tracking-widest">
                            {getContentText(gachaResult.name_json, lang)}
                          </h3>
                          <p className="text-gray-400 text-sm mt-2 max-w-xs text-center">
                            {getContentText(gachaResult.desc_json, lang)}
                          </p>
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
    return null;
  };

  return (
    <>
        {/* 全局 Overlay (Ash Pay / Gacha) */}
        {renderOverlay()}

        {/* 主容器 */}
        <div className={containerClass}>
            <div className={cardClass}>
                
                {/* Header */}
                {/* Page模式下不需要顶部圆角，Modal模式下需要 */}
                <div className={`relative p-5 bg-gradient-to-b from-[#1a1a1a] to-[#121212] border-b border-white/5 ${isPage ? '' : ''}`}>
                    {/* 关闭按钮: Page模式下可以是返回上一页，或者直接不显示(靠底部导航切换) */}
                    {isPage ? null : (
                        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"><X size={20} /></button>
                    )}
                    
                    <div className="flex items-start gap-4">
                        <div className="relative w-12 h-12 rounded-full border-2 border-blue-500/30 overflow-hidden shrink-0 mt-1">
                            <img src={PERSONAS.Ash.avatar} className="w-full h-full object-cover" alt="Ash" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                                <h2 className="text-sm font-black text-blue-500 tracking-widest uppercase">TOUGH SHOP</h2>
                                <div className="px-2 py-0.5 bg-yellow-500/10 border border-yellow-500/20 rounded text-[10px] text-yellow-500 font-mono flex items-center gap-1">
                                    <ShoppingBag size={10} />
                                    <span>{userRin} RIN</span>
                                </div>
                            </div>
                            <div className="flex gap-2 mt-2">
                                <button onClick={() => setActiveTab('catalog')} className={`flex-1 text-xs py-1.5 rounded transition-colors ${activeTab === 'catalog' ? 'bg-white/10 text-white font-bold' : 'text-gray-500 hover:text-gray-300'}`}>{lang === 'zh' ? '目录' : 'CATALOG'}</button>
                                <button onClick={() => setActiveTab('recharge')} className={`flex-1 text-xs py-1.5 rounded transition-colors ${activeTab === 'recharge' ? 'bg-yellow-500/20 text-yellow-500 font-bold' : 'text-gray-500 hover:text-gray-300'}`}>{lang === 'zh' ? '充值' : 'RECHARGE'}</button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content - 保持原样，只是高度自适应 */}
                {activeTab === 'catalog' ? (
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                        {isLoadingCatalog ? (
                            <div className="flex justify-center py-10"><Loader2 className="animate-spin text-gray-500"/></div>
                        ) : (
                            shopCatalog.map((item) => (
                                <div key={item.id} className="group relative flex items-center gap-4 p-4 bg-[#181818] border border-white/5 hover:border-blue-500/30 rounded-xl transition-all active:scale-[0.99]">
                                    <div className="w-12 h-12 rounded-lg bg-black/50 border border-white/10 flex items-center justify-center shrink-0 group-hover:shadow-[0_0_15px_rgba(59,130,246,0.15)] transition-shadow">
                                        {renderItemIcon(item.icon)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-1">
                                            <h3 className="text-sm font-bold text-gray-200">{getContentText(item.name_json, lang)}</h3>
                                            <span className={`text-xs font-mono font-bold ${userRin >= item.price ? 'text-yellow-500' : 'text-red-500'}`}>{item.price}</span>
                                        </div>
                                        <p className="text-[10px] text-gray-500 line-clamp-2 mt-1">{getContentText(item.desc_json, lang)}</p>
                                    </div>
                                    <button onClick={() => handleBuy(item)} disabled={userRin < item.price || buyingId !== null} className="absolute inset-0 z-10 w-full h-full opacity-0 hover:opacity-100 transition-opacity bg-black/60 flex items-center justify-center backdrop-blur-[1px] rounded-xl cursor-pointer disabled:cursor-not-allowed">
                                        {buyingId === item.id ? <Loader2 className="animate-spin text-blue-500" size={24} /> : (userRin >= item.price ? <span className="font-bold text-white text-xs tracking-wider border border-white/30 px-4 py-1.5 rounded-full bg-blue-600">BUY</span> : <div className="flex items-center gap-1 text-red-500 text-xs font-bold"><Lock size={12} /><span>POOR</span></div>)}
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                ) : (
                    // Recharge Tab 内容 (Ash Pay)
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        <div className="text-center space-y-1 mb-4">
                            <h3 className="text-lg font-bold text-white tracking-wider flex items-center justify-center gap-2">
                                <Terminal size={18} className="text-purple-400"/> {lang === 'zh' ? '密钥桥接' : 'ACCESS_KEY_BRIDGE'}
                            </h3>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => handleAshPay(200)} disabled={payStatus !== 'idle'} className="group relative flex flex-col items-center justify-center gap-1 rounded-lg border border-white/5 bg-white/5 p-4 hover:bg-purple-500/10 hover:border-purple-500/30 transition-all cursor-pointer disabled:opacity-50">
                                {payStatus === 'processing' ? <Loader2 className="animate-spin text-purple-400" size={24} /> : <span className="text-xs text-purple-300 font-bold">Tier 1 // STARTER</span>}
                            </button>
                            <button onClick={() => handleAshPay(1500)} disabled={payStatus !== 'idle'} className="group flex flex-col items-center justify-center gap-1 rounded-lg border border-white/5 bg-white/5 p-4 hover:bg-cyan-500/10 hover:border-cyan-500/30 transition-all cursor-pointer disabled:opacity-50">
                                {payStatus === 'processing' ? <Loader2 className="animate-spin text-cyan-400" size={24} /> : <span className="text-xs text-cyan-300 font-bold">Tier 2 // AWAKEN</span>}
                            </button>
                        </div>
                        {payStatus === 'limit_reached' && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-center animate-pulse"><p className="text-xs text-red-300 font-bold">{lang === 'zh' ? 'Ash: "别太过分了。"' : 'Ash: "Don\'t push it."'}</p></div>}
                    </div>
                )}
            </div>
        </div>
    </>
  );
};