import { useState, useEffect } from 'react';
import { X, ShoppingBag, Lock, Coffee, Image as ImageIcon, ShieldAlert, Zap, Loader2, PackageOpen, CreditCard, Sparkles, Terminal } from 'lucide-react';
import { SHOP_CATALOG, ShopItem, PERSONAS, LOOT_TABLE } from '@/lib/constants';
import { LangType } from '@/types';

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
  
  // --- Redeem (CD-Key) 状态 ---
  const [redeemCode, setRedeemCode] = useState("");
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [redeemStatus, setRedeemStatus] = useState<"idle" | "success" | "error">("idle");
  const [redeemMessage, setRedeemMessage] = useState("");

  // --- Ash 帮付 (Fake Pay) 状态 [新增] ---
  const [payStatus, setPayStatus] = useState<'idle' | 'processing' | 'ash_intervene' | 'success' | 'limit_reached'>('idle');
  const [showAshOverlay, setShowAshOverlay] = useState(false);

  // Gacha 动画状态
  const [gachaResult, setGachaResult] = useState<any | null>(null);
  const [isOpening, setIsOpening] = useState(false);

  useEffect(() => { 
      setMounted(true);
      if(show) {
        setActiveTab('catalog');
        setPayStatus('idle'); // 重置支付状态
      }
  }, [show]);

  if (!show || !mounted) return null;

  // --- 核心购买逻辑 (物品) ---
  const handleBuy = async (item: ShopItem) => {
    if (userRin < item.price) return;
    setBuyingId(item.id);

    try {
        const inventory = JSON.parse(localStorage.getItem('toughlove_inventory') || '[]');
        const userId = localStorage.getItem('toughlove_user_id') || 'user_01';

        // 注意：这里假设你有后端API，如果没有，请自行mock
        // const res = await fetch('/api/shop/buy', ...); 
        // 暂时模拟成功：
        await new Promise(r => setTimeout(r, 500)); 
        
        const newBalance = userRin - item.price;
        onBalanceUpdate(newBalance);
        
        // 简单的库存逻辑模拟
        if (!inventory.includes(item.id)) {
             localStorage.setItem('toughlove_inventory', JSON.stringify([...inventory, item.id]));
        }

        if (item.id.includes('crate')) {
            // 如果是箱子，触发抽奖逻辑 (简化版)
            handleGachaReveal('item_001'); // 示例ID
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

  // --- Ash 帮付逻辑 (核心彩蛋) [新增] ---
  const handleAshPay = (amountRin: number) => {
    // 1. 检查是否已经用过机会
    const hasUsed = localStorage.getItem('ash_one_time_gift');
    
    if (hasUsed) {
      setPayStatus('limit_reached');
      // 3秒后恢复 idle，让用户能看清提示
      setTimeout(() => setPayStatus('idle'), 3000);
      return;
    }

    // 2. 开始模拟支付流程
    setPayStatus('processing');

    // 3. 模拟连接延迟 (1.5秒后 Ash 介入)
    setTimeout(() => {
      setPayStatus('ash_intervene');
      setShowAshOverlay(true);
      
      // 4. Ash 介入动画结束后，显示成功 (再过 2.5秒)
      setTimeout(() => {
        completeAshPayment(amountRin);
      }, 2500);
      
    }, 1500);
  };

  const completeAshPayment = (amountRin: number) => {
    localStorage.setItem('ash_one_time_gift', 'true'); // 写入本地标记
    setShowAshOverlay(false);
    setPayStatus('success');
    
    // 实际给用户加钱
    onBalanceUpdate(userRin + amountRin);
    
    if (navigator.vibrate) navigator.vibrate([50, 50, 200]);

    // 2秒后重置状态
    setTimeout(() => {
       setPayStatus('idle');
    }, 2000);
  };

  // --- 盲盒开箱动画 ---
  const handleGachaReveal = (itemId: string) => {
      setIsOpening(true);
      setTimeout(() => {
          const droppedItem = LOOT_TABLE[itemId] || { name: {zh: '未知物品', en: 'Unknown'}, description: {zh: '...', en: '...'}, rarity: 'common', iconSvg: '?' };
          setGachaResult(droppedItem);
          setIsOpening(false);
      }, 1500);
  };

  // --- 充值兑换逻辑 (CD-Key) ---
  const handleRedeem = async () => {
    if (!redeemCode) return;
    setRedeemLoading(true);
    setRedeemStatus("idle");
    setRedeemMessage("");

    try {
      // 模拟 API 请求
      await new Promise(r => setTimeout(r, 1000));
      
      // 这里只是演示，实际逻辑需要后端验证
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

  const renderItemIcon = (id: string, type: string) => {
    const iconSize = 24;
    if (id.includes('crate')) return <PackageOpen size={iconSize} className="text-purple-400" />;
    if (id.includes('coffee')) return <Coffee size={iconSize} className="text-amber-500" />;
    if (type === 'visual') return <ImageIcon size={iconSize} className="text-blue-400" />;
    if (id.includes('pardon')) return <ShieldAlert size={iconSize} className="text-red-500" />;
    return <Zap size={iconSize} className="text-gray-400" />;
  };

  // --- Render ---

  // 1. Ash Pay Overlay (彩蛋层)
  if (showAshOverlay) {
      return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
            <div className="flex flex-col items-center gap-6 p-8 relative">
                 {/* 装饰性背景光效 */}
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

  // 2. Gacha Overlay
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
              
              {/* Tab 切换 */}
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
            // --- 物品列表 ---
            <>
                <div className="p-3 bg-white/5 border-b border-white/5">
                    <p className="text-xs text-center text-gray-400 italic">
                        "{lang === 'zh' ? '想要什么？如果是来买后悔药的，出门右转。' : 'Make it quick. No refunds for regrets.'}"
                    </p>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
                {SHOP_CATALOG.map((item) => {
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
            </>
        ) : (
            // --- 充值页面 (已接入 Ash 帮付逻辑) ---
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                 {/* CD-Key 输入区 (保留) */}
                 <div className="space-y-4">
                    <div className="text-center space-y-1">
                        <h3 className="text-lg font-bold text-white tracking-wider flex items-center justify-center gap-2">
                            <Terminal size={18} className="text-purple-400"/> 
                            {lang === 'zh' ? '密钥桥接 // ACCESS_BRIDGE' : 'ACCESS_KEY_BRIDGE'}
                        </h3>
                        <p className="text-xs text-white/50 font-mono">
                          {lang === 'zh' ? '输入兑换码以注入 Rin 能量' : 'Enter CD-Key to inject energy'}
                        </p>
                    </div>

                    <div className="space-y-2">
                        <input
                        type="text"
                        value={redeemCode}
                        onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
                        placeholder="ASH-LOVE"
                        disabled={redeemLoading}
                        className={`w-full bg-black/50 border ${redeemStatus === 'error' ? 'border-red-500/50 text-red-400' : 'border-white/10 focus:border-purple-500/50 text-purple-300'} rounded-lg px-4 py-3 font-mono text-center text-lg outline-none transition-all placeholder:text-white/10`}
                        />
                        <div className={`h-6 text-xs font-mono text-center flex items-center justify-center gap-2 transition-colors ${redeemStatus === 'error' ? 'text-red-400' : 'text-green-400'}`}>
                        {redeemStatus === 'error' && '⚠ '}{redeemStatus === 'success' && '✔ '}{redeemMessage}
                        </div>
                    </div>

                    <button
                        onClick={handleRedeem}
                        disabled={redeemLoading || !redeemCode}
                        className="w-full relative overflow-hidden rounded-lg bg-white text-black font-bold py-3 text-sm hover:bg-purple-400 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                        {redeemLoading ? (
                        <span className="flex items-center justify-center gap-2">
                            <Loader2 className="animate-spin" size={16} /> {lang === 'zh' ? '验证中...' : 'VERIFYING...'}
                        </span>
                        ) : (
                        <span className="flex items-center justify-center gap-2 group-hover:tracking-widest transition-all duration-300">
                            <Zap size={16} className="fill-black group-hover:fill-white" /> 
                            {lang === 'zh' ? '建立连接' : 'ESTABLISH CONNECTION'}
                        </span>
                        )}
                    </button>
                 </div>

                 <div className="h-px bg-white/10 my-4" />

                 {/* 购买按钮 - 触发 Ash 帮付 */}
                 <div className="grid grid-cols-2 gap-3">
                    <button 
                        onClick={() => handleAshPay(200)} // 点击触发帮付，增加 200 Rin
                        disabled={payStatus !== 'idle'}
                        className="group relative flex flex-col items-center justify-center gap-1 rounded-lg border border-white/5 bg-white/5 p-4 hover:bg-purple-500/10 hover:border-purple-500/30 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {payStatus === 'processing' ? (
                            <Loader2 className="animate-spin text-purple-400" size={24} />
                        ) : (
                            <>
                                <span className="text-xs text-purple-300 font-bold group-hover:scale-105 transition-transform">
                                    {lang === 'zh' ? 'Tier 1 // 尝鲜' : 'Tier 1 // STARTER'}
                                </span>
                                <span className="text-[10px] text-white/40">¥0.99 = 200 Rin</span>
                            </>
                        )}
                    </button>
                    
                    <button 
                        onClick={() => handleAshPay(1500)} // 同样触发帮付
                        disabled={payStatus !== 'idle'}
                        className="group flex flex-col items-center justify-center gap-1 rounded-lg border border-white/5 bg-white/5 p-4 hover:bg-cyan-500/10 hover:border-cyan-500/30 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {payStatus === 'processing' ? (
                            <Loader2 className="animate-spin text-cyan-400" size={24} />
                        ) : (
                            <>
                                <span className="text-xs text-cyan-300 font-bold group-hover:scale-105 transition-transform">
                                    {lang === 'zh' ? 'Tier 2 // 觉醒' : 'Tier 2 // AWAKEN'}
                                </span>
                                <span className="text-[10px] text-white/40">¥6.00 = 1500 Rin</span>
                            </>
                        )}
                    </button>
                 </div>
                 
                 {/* 限制提示 */}
                 {payStatus === 'limit_reached' && (
                     <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-center animate-pulse">
                         <p className="text-xs text-red-300 font-bold mb-1">
                            {lang === 'zh' ? 'Ash: "别太过分了，我的零花钱也是有限的。"' : 'Ash: "Don\'t push it. My wallet is not infinite."'}
                         </p>
                         <p className="text-[10px] text-red-400/60">
                            {lang === 'zh' ? '(正式支付通道接入中...)' : '(Official payment gateway incoming...)'}
                         </p>
                     </div>
                 )}
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