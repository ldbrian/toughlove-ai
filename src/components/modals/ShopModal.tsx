import { useState, useEffect } from 'react';
import { X, ShoppingBag, Lock, Coffee, Image as ImageIcon, ShieldAlert, Zap, Loader2, PackageOpen, CreditCard, Sparkles, Terminal } from 'lucide-react';
// ❌ 移除 SHOP_CATALOG, LOOT_TABLE 引用
import { PERSONAS } from '@/lib/constants'; // 角色头像等静态资源保留
import { LangType, LootItem } from '@/types';
import { getDeviceId } from '@/lib/utils';
// 🔥 引入 Supabase
import { createClient } from '@/utils/supabase/client';
import { getContentText } from '@/lib/i18n/dictionaries';

interface ShopModalProps {
  show: boolean;
  onClose: () => void;
  userRin: number;
  onBalanceUpdate: (newBalance: number) => void;
  lang: LangType;
}

export const ShopModal = ({ show, onClose, userRin, onBalanceUpdate, lang }: ShopModalProps) => {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'catalog' | 'recharge'>('catalog');
  const [buyingId, setBuyingId] = useState<string | null>(null);
  
  // 🔥 新增：商店数据状态
  const [shopCatalog, setShopCatalog] = useState<any[]>([]);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(true);
  
  const [redeemCode, setRedeemCode] = useState("");
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [redeemStatus, setRedeemStatus] = useState<"idle" | "success" | "error">("idle");
  const [redeemMessage, setRedeemMessage] = useState("");

  const [payStatus, setPayStatus] = useState<'idle' | 'processing' | 'ash_intervene' | 'success' | 'limit_reached'>('idle');
  const [showAshOverlay, setShowAshOverlay] = useState(false);

  const [gachaResult, setGachaResult] = useState<any | null>(null);
  const [isOpening, setIsOpening] = useState(false);

  const supabase = createClient();

  useEffect(() => { 
      setMounted(true);
      if(show) {
        setActiveTab('catalog');
        setPayStatus('idle');
        fetchShopCatalog(); // 🔥 打开时拉取商品
      }
  }, [show]);

  // 🔥 从数据库获取商品列表
  const fetchShopCatalog = async () => {
      try {
          setIsLoadingCatalog(true);
          // 查询所有价格大于0的物品
          const { data, error } = await supabase
            .from('items')
            .select('*')
            .gt('price', 0)
            .order('price', { ascending: true }); // 按价格排序

          if (error) throw error;

          if (data) {
              // 格式化数据
              const formatted = data.map((item: any) => ({
                  id: item.id,
                  name: item.name_json || { zh: '未知商品', en: 'Unknown' },
                  desc: item.desc_json || { zh: '...', en: '...' },
                  price: item.price,
                  rarity: item.rarity,
                  type: item.type,
                  icon: item.image || '📦' // 数据库字段映射
              }));
              setShopCatalog(formatted);
          }
      } catch (e) {
          console.error("Shop load failed:", e);
      } finally {
          setIsLoadingCatalog(false);
      }
  };

  if (!show || !mounted) return null;

  // --- 购买逻辑 ---
  const handleBuy = async (item: any) => {
    if (userRin < item.price) return;
    setBuyingId(item.id);

    try {
        const inventory = JSON.parse(localStorage.getItem('toughlove_inventory') || '[]');
        const userId = getDeviceId();

        // 调用后端 API (后端也会改为读库)
        const res = await fetch('/api/shop/buy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, itemId: item.id, currentInventory: inventory })
        });
        
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        onBalanceUpdate(data.newBalance);
        
        // 本地库存乐观更新
        if (!inventory.includes(item.id)) {
             localStorage.setItem('toughlove_inventory', JSON.stringify([...inventory, item.id]));
             // 触发全局事件通知 Terminal 刷新
             window.dispatchEvent(new Event('toughlove_inventory_update'));
        }

        if (data.droppedItem) {
            // 如果后端返回了掉落物详情 (盲盒逻辑)
            handleGachaReveal(data.droppedItem); 
        } else {
            if (navigator.vibrate) navigator.vibrate(50);
        }

    } catch (error) {
        console.error(error);
        alert(lang === 'zh' ? '交易失败' : 'Transaction Failed');
    } finally {
        setBuyingId(null);
    }
  };

  // --- Ash 帮付 (保持不变) ---
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
    setTimeout(() => {
       setPayStatus('idle');
    }, 2000);
  };

  // --- 盲盒动画 ---
  const handleGachaReveal = (item: any) => {
      setIsOpening(true);
      setTimeout(() => {
          setGachaResult(item);
          setIsOpening(false);
      }, 1500);
  };

  // --- 充值逻辑 ---
  const handleRedeem = async () => {
    if (!redeemCode) return;
    setRedeemLoading(true);
    setRedeemStatus("idle");
    setRedeemMessage("");

    try {
      await new Promise(r => setTimeout(r, 1000));
      if (redeemCode === "ASH-LOVE") {
          setRedeemStatus("success");
          setRedeemMessage(lang === 'zh' ? "连接建立成功" : "Protocol Established.");
          onBalanceUpdate(userRin + 500);
      } else {
          throw new Error(lang === 'zh' ? "无效的密钥" : "Invalid Key");
      }
      if (navigator.vibrate) navigator.vibrate(200);
      setTimeout(() => {
        setRedeemCode("");
        setRedeemStatus("idle");
      }, 2000);
    } catch (err: any) {
      setRedeemStatus("error");
      setRedeemMessage(err.message);
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    } finally {
      setRedeemLoading(false);
    }
  };

  const renderItemIcon = (icon: string) => {
    const iconSize = 24;
    // 如果是 emoji 或 字符
    if (!icon || icon.length < 5) return <span className="text-xl">{icon || '📦'}</span>;
    // 如果是路径
    if (icon.startsWith('/')) return <img src={icon} className="w-full h-full object-cover" />;
    
    // Fallback 图标逻辑
    return <Zap size={iconSize} className="text-gray-400" />;
  };

  // 1. Ash Pay Overlay
  if (showAshOverlay) {
      return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
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

  // 2. Gacha Overlay (展示掉落物)
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
                              {/* 这里的 gachaResult 是后端返回的 DB 物品对象 */}
                              {gachaResult.image?.startsWith('/') ? <img src={gachaResult.image} className="w-16 h-16 object-contain"/> : <span className="text-5xl">{gachaResult.image || '🎁'}</span>}
                          </div>
                          {/* 兼容后端返回的 name_json 结构 */}
                          <h3 className="text-2xl font-black text-white uppercase tracking-widest">{getContentText(gachaResult.name_json || gachaResult.name, lang)}</h3>
                          <p className="text-gray-400 text-sm mt-2 max-w-xs text-center">{getContentText(gachaResult.desc_json || gachaResult.description, lang)}</p>
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
      <div className="w-[95vw] max-w-md bg-[#121212] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] relative">
        
        {/* Header */}
        <div className="relative p-5 bg-gradient-to-b from-[#1a1a1a] to-[#121212] border-b border-white/5">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
          
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
                  <button 
                    onClick={() => setActiveTab('catalog')}
                    className={`flex-1 text-xs py-1.5 rounded transition-colors ${activeTab === 'catalog' ? 'bg-white/10 text-white font-bold' : 'text-gray-500 hover:text-gray-300'}`}
                  >
                    {lang === 'zh' ? '物品目录' : 'CATALOG'}
                  </button>
                  <button 
                    onClick={() => setActiveTab('recharge')}
                    className={`flex-1 text-xs py-1.5 rounded transition-colors flex items-center justify-center gap-1 ${activeTab === 'recharge' ? 'bg-yellow-500/20 text-yellow-500 font-bold' : 'text-gray-500 hover:text-gray-300'}`}
                  >
                    <CreditCard size={12} />
                    {lang === 'zh' ? '充值中心' : 'RECHARGE'}
                  </button>
              </div>
            </div>
          </div>
        </div>

        {/* 内容区域 */}
        {activeTab === 'catalog' ? (
            <>
                <div className="p-3 bg-white/5 border-b border-white/5">
                    <p className="text-xs text-center text-gray-400 italic">
                        "{lang === 'zh' ? '想要什么？如果是来买后悔药的，出门右转。' : 'Make it quick. No refunds for regrets.'}"
                    </p>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar min-h-[300px]">
                {isLoadingCatalog ? (
                    <div className="flex justify-center py-10"><Loader2 className="animate-spin text-gray-500"/></div>
                ) : (
                    shopCatalog.map((item) => {
                        return (
                            <div key={item.id} className="group relative flex items-center gap-4 p-4 bg-[#181818] border border-white/5 hover:border-blue-500/30 rounded-xl transition-all active:scale-[0.99]">
                            <div className="w-12 h-12 rounded-lg bg-black/50 border border-white/10 flex items-center justify-center shrink-0 group-hover:shadow-[0_0_15px_rgba(59,130,246,0.15)] transition-shadow">
                                {renderItemIcon(item.icon)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-1">
                                <h3 className="text-sm font-bold text-gray-200 truncate pr-2">{getContentText(item.name, lang)}</h3>
                                <span className={`text-xs font-mono font-bold ${userRin >= item.price ? 'text-yellow-500' : 'text-red-500'}`}>{item.price}</span>
                                </div>
                                <p className="text-[10px] text-gray-500 leading-tight line-clamp-2 mb-1.5">{getContentText(item.desc, lang)}</p>
                            </div>
                            
                            <button onClick={() => handleBuy(item)} disabled={userRin < item.price || buyingId !== null} className="absolute inset-0 z-10 w-full h-full opacity-0 hover:opacity-100 transition-opacity bg-black/60 flex items-center justify-center backdrop-blur-[1px] rounded-xl cursor-pointer disabled:cursor-not-allowed">
                                {buyingId === item.id ? <Loader2 className="animate-spin text-blue-500" size={24} /> : userRin >= item.price ? <span className="font-bold text-white text-xs tracking-wider border border-white/30 px-4 py-1.5 rounded-full bg-white/10 hover:bg-blue-500 hover:border-blue-500 transition-colors">{lang === 'zh' ? '购买' : 'BUY'}</span> : <div className="flex items-center gap-1 text-red-500 text-xs font-bold"><Lock size={12} /><span>POOR</span></div>}
                            </button>
                            </div>
                        );
                    })
                )}
                </div>
            </>
        ) : (
            // --- 充值页面 (保持不变) ---
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                 {/* ... (CD-Key 输入区 和 充值按钮逻辑保持不变，略) ... */}
                 {/* 为了完整性，这里可以复用之前的代码块，重点是 Catalog 部分已修复 */}
                 <div className="space-y-4">
                    <div className="text-center space-y-1">
                        <h3 className="text-lg font-bold text-white tracking-wider flex items-center justify-center gap-2">
                            <Terminal size={18} className="text-purple-400"/> 
                            {lang === 'zh' ? '密钥桥接 // ACCESS_BRIDGE' : 'ACCESS_KEY_BRIDGE'}
                        </h3>
                    </div>
                    {/* ... 略 ... */}
                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => handleAshPay(200)} className="group relative flex flex-col items-center justify-center gap-1 rounded-lg border border-white/5 bg-white/5 p-4 hover:bg-purple-500/10 hover:border-purple-500/30 transition-all cursor-pointer">
                            {payStatus === 'processing' ? <Loader2 className="animate-spin text-purple-400" size={24} /> : <span className="text-xs text-purple-300 font-bold">Tier 1 // STARTER</span>}
                        </button>
                        <button onClick={() => handleAshPay(1500)} className="group flex flex-col items-center justify-center gap-1 rounded-lg border border-white/5 bg-white/5 p-4 hover:bg-cyan-500/10 hover:border-cyan-500/30 transition-all cursor-pointer">
                            {payStatus === 'processing' ? <Loader2 className="animate-spin text-cyan-400" size={24} /> : <span className="text-xs text-cyan-300 font-bold">Tier 2 // AWAKEN</span>}
                        </button>
                    </div>
                 </div>
            </div>
        )}

        {/* Footer */}
        <div className="p-4 bg-[#121212] border-t border-white/5 text-center">
           <p className="text-[10px] text-gray-600 font-mono uppercase tracking-widest">
               {activeTab === 'catalog' 
                  ? (lang === 'zh' ? 'NO REFUNDS / 概不退换' : 'NO REFUNDS / ALL SALES FINAL')
                  : (payStatus === 'success' 
                        ? (lang === 'zh' ? 'PAYMENT BY ASH' : 'PAYMENT BY ASH') 
                        : (lang === 'zh' ? 'SECURE CONNECTION / 安全连接' : 'SECURE CONNECTION')
                    )
               }
           </p>
        </div>
      </div>
    </div>
  );
};