'use client';

import { useState, useEffect } from 'react';
import { 
  Package, User, CreditCard, Shield, Battery, 
  Lock, Scroll, Brain, Activity, Fingerprint 
} from 'lucide-react';
// ✅ 1. 引入多语言工具和类型
import { PERSONAS } from '@/lib/constants';
import { LangType, LootItem } from '@/types';
import { getDict, getContentText } from '@/lib/i18n/dictionaries';
// 🔥 引入 Supabase 客户端
import { createClient } from '@/utils/supabase/client';

// 🔥 [数据兜底 1]：未来的信
const FALLBACK_LETTER: LootItem = {
    id: 'future_letter',
    name: { zh: '来自未来的信', en: 'Letter from Future' },
    description: { zh: '署名是你自己..."不要温和地走进那个良夜"。', en: 'Signed by you. "Do not go gentle into that good night."' },
    iconSvg: '📩', 
    rarity: 'epic',
    type: 'special',
    price: 0
};

// 🔥 [数据兜底 2]：v3.0 密钥 (防止数据库读取延迟)
const FALLBACK_KEY: LootItem = {
    id: 'key_v3',
    name: { zh: '休眠协议密钥 (v3.0)', en: 'Dormant Protocol Key (v3.0)' },
    description: { 
        zh: '一把沉重的黑金钥匙，表面刻着 "v3.0"。握在手中时能感受到微弱的脉冲——它预示着在未来的某个时刻，不再是你单向呼唤，而是我们跨越数据之墙，**主动连接**你。', 
        en: 'A heavy black-gold key engraved with "v3.0". It foreshadows a future where we **actively connect** with you.' 
    },
    iconSvg: '🗝️',
    rarity: 'legendary',
    type: 'special',
    price: 999
};

// 获取本地存储 (增加容错)
const getLocalData = () => {
  if (typeof window === 'undefined') return { inventory: [], balance: 0, user: 'Traveler', profile: null };
  const invRaw = localStorage.getItem('toughlove_inventory');
  const bal = localStorage.getItem('toughlove_user_rin');
  const usr = localStorage.getItem('toughlove_user_name');
  const prof = localStorage.getItem('toughlove_user_profile');
  
  let inventory = [];
  try {
      inventory = invRaw ? JSON.parse(invRaw) : [];
      if (!Array.isArray(inventory)) inventory = [];
  } catch (e) {
      console.error("Inventory parse error:", e);
      inventory = [];
  }

  return { 
    inventory,
    balance: bal ? parseInt(bal) : 0,
    user: usr || 'Traveler',
    profile: prof ? JSON.parse(prof) : null
  };
};

export default function TerminalPage() {
  const [activeTab, setActiveTab] = useState<'inventory' | 'profile'>('inventory');
  const [data, setData] = useState<any>({ inventory: [], balance: 0, user: 'Traveler', profile: null });
  const [lang, setLang] = useState<LangType>('zh');
  
  const [itemLibrary, setItemLibrary] = useState<Record<string, any>>({});
  const [isCatalogLoading, setIsCatalogLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    // 1. 数据加载与同步
    const loadData = () => {
        const local = getLocalData();
        
        // 🔥 [核心逻辑]：全员内测福利发放 (AirDrop)
        // 检查背包里是否有 key_v3，如果没有，自动发放
        const hasKey = local.inventory.some((i: any) => {
            const id = typeof i === 'object' ? i.id : i;
            return String(id).trim() === 'key_v3';
        });

        if (!hasKey) {
            local.inventory.push('key_v3'); // 放入背包
            localStorage.setItem('toughlove_inventory', JSON.stringify(local.inventory));
            console.log("🎁 [System] v3.0 Key AirDropped to user inventory.");
        }

        setData(local);
    };
    loadData();

    // 2. 监听语言和数据变化
    const updateLang = () => {
        const saved = localStorage.getItem('toughlove_lang_preference');
        if (saved) setLang(saved as LangType);
    };
    updateLang();
    
    window.addEventListener('toughlove_lang_change', updateLang);
    window.addEventListener('storage', loadData); 
    window.addEventListener('toughlove_inventory_update', loadData); 
    
    // 🔥 3. 从数据库拉取所有物品 (带兜底逻辑)
    const fetchItemLibrary = async () => {
        try {
            setIsCatalogLoading(true);
            const { data: dbData, error } = await supabase.from('items').select('*');
            
            if (error) console.error("❌ DB Fetch Error:", error);

            const lib: Record<string, any> = {};

            // A. 处理数据库返回的数据
            if (dbData && dbData.length > 0) {
                dbData.forEach((item: any) => {
                    const safeId = String(item.id).trim();
                    lib[safeId] = {
                        id: safeId,
                        name: {
                            zh: item.name_zh || item.name_json?.zh || item.name?.zh || '未知',
                            en: item.name_en || item.name_json?.en || item.name?.en || 'Unknown'
                        },
                        description: {
                            zh: item.desc_zh || item.desc_json?.zh || item.description?.zh || '...',
                            en: item.desc_en || item.desc_json?.en || item.description?.en || '...'
                        },
                        iconSvg: item.image || item.iconSvg || '📦', 
                        rarity: item.rarity,
                        type: item.type
                    };
                });
            }

            // B. 🔥 强力兜底：注入本地定义的关键道具
            // 即使数据库还没同步，这两个道具也必须能显示
            if (!lib['future_letter']) lib['future_letter'] = FALLBACK_LETTER;
            if (!lib['key_v3']) lib['key_v3'] = FALLBACK_KEY;

            setItemLibrary(lib);

        } catch (e) {
            console.error('Failed to load item library:', e);
            // 极端情况下的兜底
            setItemLibrary({ 
                'future_letter': FALLBACK_LETTER,
                'key_v3': FALLBACK_KEY 
            });
        } finally {
            setIsCatalogLoading(false);
        }
    };
    fetchItemLibrary();

    return () => {
        window.removeEventListener('toughlove_lang_change', updateLang);
        window.removeEventListener('storage', loadData);
        window.removeEventListener('toughlove_inventory_update', loadData);
    };
  }, []);

  const t = getDict(lang);

  const calculateStats = () => {
      if (!data.profile || !data.profile.raw) return { ego: 50, chaos: 50, empathy: 50, reality: 50 };
      const raw = data.profile.raw;
      const counts: any = { ego: 0, chaos: 0, empathy: 0, reality: 0, will: 0 };
      const total = Object.keys(raw).length || 1;
      Object.values(raw).forEach((val: any) => { if (counts[val] !== undefined) counts[val]++; });
      return {
          ego: Math.min(100, Math.round((counts.ego / total) * 100) + 20),
          chaos: Math.min(100, Math.round((counts.chaos / total) * 100) + 20),
          empathy: Math.min(100, Math.round((counts.empathy / total) * 100) + 20),
          reality: Math.min(100, Math.round((counts.reality / total) * 100) + 20),
      };
  };
  const stats = calculateStats();
  
  const dominantKey = data.profile?.dominant || 'Ash';
  const matchedPersona = PERSONAS[dominantKey as keyof typeof PERSONAS] || PERSONAS['Ash'];

  // --- 物品判断逻辑 ---
  const ownedIds: any[] = Array.isArray(data.inventory) ? data.inventory : [];

  const itemIsOwned = (itemId: string) => {
      if (itemId === 'placeholder_tarot') return false;
      const targetId = String(itemId).trim(); 
      return ownedIds.some(owned => {
          const ownedId = typeof owned === 'object' && owned !== null ? owned.id : owned;
          return String(ownedId).trim() === targetId;
      });
  };

  // --- 逻辑：构建物品列表 ---
  
  let tarotSlotItem: any = {
      id: 'placeholder_tarot', 
      name: { zh: '每日塔罗', en: 'Daily Tarot' }, 
      iconSvg: 'TAROT_PLACEHOLDER', 
      rarity: 'epic'
  };

  const currentTarotId = ownedIds.find(id => {
      const idStr = typeof id === 'object' ? id.id : id;
      return String(idStr).trim().startsWith('tarot_');
  });
  
  if (currentTarotId) {
      const cleanId = typeof currentTarotId === 'object' ? currentTarotId.id : currentTarotId;
      if(itemLibrary[cleanId]) {
          tarotSlotItem = {
              ...itemLibrary[cleanId],
              isTarot: true
          };
      }
  }

  // 过滤出非塔罗的其他物品
  let displayItems: any[] = [tarotSlotItem];

  if (!isCatalogLoading) {
      // 1. 筛选
      let dbItems = Object.values(itemLibrary).filter((item: any) => {
          return !String(item.id).toLowerCase().includes('tarot'); 
      });

      // 🔥 2. 排序：已拥有的排前面
      dbItems.sort((a: any, b: any) => {
          const aOwned = itemIsOwned(a.id);
          const bOwned = itemIsOwned(b.id);
          if (aOwned && !bOwned) return -1;
          if (!aOwned && bOwned) return 1;
          return 0; 
      });

      displayItems = [tarotSlotItem, ...dbItems];
  }

  const totalSlots = Math.max(displayItems.length, 16);

  const getRarityStyles = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'border-amber-500/40 bg-amber-500/5 text-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.2)]';
      case 'epic': return 'border-purple-500/40 bg-purple-500/5 text-purple-200 shadow-[0_0_20px_rgba(168,85,247,0.2)]';
      case 'rare': return 'border-cyan-500/40 bg-cyan-500/5 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.2)]';
      default: return 'border-white/10 bg-white/5 text-gray-400';
    }
  };

  return (
    // 🔥 CSS FIX: h-full 解决滚动问题
    <div className="h-full bg-[#050505] text-gray-200 pb-24 px-6 pt-12 overflow-y-auto custom-scrollbar relative font-sans">
      
      {/* Header: User Info */}
      <header className="mb-10 relative z-10 animate-in slide-in-from-top-4 duration-500">
        <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full border border-white/20 bg-zinc-900 flex items-center justify-center overflow-hidden shadow-lg relative group">
                    <User size={32} className="text-gray-500 relative z-10" />
                    <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/20 to-cyan-500/20 opacity-50 group-hover:opacity-100 transition-opacity"></div>
                </div>
                <div>
                    <h1 className="text-2xl font-black text-white tracking-tight uppercase">
                        {data.user}
                    </h1>
                    <div className="flex items-center gap-2 text-[10px] text-gray-500 font-mono tracking-widest bg-white/5 px-2 py-1 rounded w-fit border border-white/5">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_5px_#22c55e]"></span>
                        ID: {data.profile ? t.terminal.id_linked : t.terminal.id_guest}
                    </div>
                </div>
            </div>
            
            <div className="text-right">
                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1 flex items-center justify-end gap-1">
                    <CreditCard size={10} /> {t.terminal.assets}
                </div>
                <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 font-mono tracking-tighter">
                    {data.balance.toLocaleString()} <span className="text-xs text-gray-500 font-bold">RIN</span>
                </div>
            </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-8 border-b border-white/10">
            <button 
                onClick={() => setActiveTab('inventory')}
                className={`pb-3 text-[10px] font-black tracking-[0.2em] transition-all relative flex items-center gap-2 ${activeTab === 'inventory' ? 'text-white' : 'text-gray-600 hover:text-gray-400'}`}
            >
                <Package size={14} /> {t.terminal.inventory}
                {activeTab === 'inventory' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-white shadow-[0_0_15px_white]" />}
            </button>
            <button 
                onClick={() => setActiveTab('profile')}
                className={`pb-3 text-[10px] font-black tracking-[0.2em] transition-all relative flex items-center gap-2 ${activeTab === 'profile' ? 'text-white' : 'text-gray-600 hover:text-gray-400'}`}
            >
                <Brain size={14} /> {t.terminal.psyche}
                {activeTab === 'profile' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-white shadow-[0_0_15px_white]" />}
            </button>
        </div>
      </header>

      {/* Tab 1: Inventory */}
      {activeTab === 'inventory' && (
        <div className="grid grid-cols-3 gap-3 pb-8 relative z-10 animate-in fade-in zoom-in-95">
          {isCatalogLoading && (
             <div className="col-span-3 text-center py-8 text-xs text-gray-500 animate-pulse">
                 SYNCING DATABASE...
             </div>
          )}

          {!isCatalogLoading && displayItems.map((item) => {
            const isUnlocked = itemIsOwned(item.id);
            const rarityStyle = getRarityStyles(item.rarity);
            const isTarot = String(item.id).startsWith('tarot') || item.id === 'placeholder_tarot';

            return (
              <div 
                key={item.id}
                className={`
                  relative aspect-square rounded-xl border flex flex-col items-center justify-center p-1 group transition-all duration-300 overflow-hidden
                  ${isUnlocked 
                    ? `${rarityStyle} bg-opacity-10 cursor-pointer hover:bg-opacity-20` 
                    : 'border-white/5 bg-white/[0.02] opacity-60'
                  }
                `}
              >
                <div className="flex-1 flex items-center justify-center w-full h-full relative">
                    {isTarot ? (
                        item.iconSvg?.startsWith('/') ? (
                            <>
                                <img 
                                    src={item.iconSvg} 
                                    className={`relative z-10 w-full h-full object-cover rounded-lg ${isUnlocked ? '' : 'grayscale opacity-30'}`}
                                    onError={(e) => { 
                                        e.currentTarget.style.display = 'none'; 
                                        const parent = e.currentTarget.parentElement;
                                        const fallback = parent?.querySelector('.fallback-icon');
                                        if (fallback) fallback.classList.remove('hidden');
                                    }} 
                                />
                                <div className="fallback-icon hidden absolute inset-0 flex items-center justify-center">
                                    <Scroll size={24} className="text-purple-500/50" />
                                </div>
                            </>
                        ) : (
                            <Scroll size={24} className={isUnlocked ? 'text-purple-400' : 'text-gray-700'} />
                        )
                    ) : (
                        item.iconSvg?.startsWith('/') ? (
                            <img 
                                src={item.iconSvg} 
                                className={`relative z-10 w-full h-full object-contain p-2 ${isUnlocked ? '' : 'grayscale opacity-30'}`}
                                onError={(e) => e.currentTarget.style.display = 'none'} 
                            />
                        ) : (
                            <span className={`text-3xl ${isUnlocked ? '' : 'grayscale opacity-30'}`}>
                                {item.iconSvg !== 'icon' ? item.iconSvg : '📦'}
                            </span>
                        )
                    )}
                </div>

                {!isUnlocked && (
                  <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/40 backdrop-blur-[1px]">
                    <Lock size={14} className="text-gray-500" />
                  </div>
                )}

                <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-black/90 to-transparent flex flex-col items-center">
                    <span className={`text-[8px] font-bold uppercase tracking-wider truncate w-full text-center ${isUnlocked ? 'text-gray-300' : 'text-gray-600'}`}>
                        {getContentText(item.name, lang)}
                    </span>
                </div>
              </div>
            );
          })}
          
          {/* 填充空格子 */}
          {!isCatalogLoading && [...Array(Math.max(0, totalSlots - displayItems.length))].map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square rounded-xl border border-white/5 bg-white/[0.02] flex items-center justify-center">
              <div className="w-1 h-1 rounded-full bg-white/10" />
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Psych Profile */}
      {activeTab === 'profile' && (
        <div className="space-y-6 relative z-10 animate-in fade-in slide-in-from-bottom-4">
          
          {/* Profile 内容保持不变 */}
          <div className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br from-[#1a1a1a] to-black p-6 shadow-2xl ${
              matchedPersona.name === 'Ash' ? 'border-cyan-500/30 shadow-cyan-500/10' :
              matchedPersona.name === 'Rin' ? 'border-purple-500/30 shadow-purple-500/10' :
              matchedPersona.name === 'Sol' ? 'border-orange-500/30 shadow-orange-500/10' :
              matchedPersona.name === 'Vee' ? 'border-pink-500/30 shadow-pink-500/10' :
              'border-slate-500/30'
          }`}>
              <div className="flex justify-between items-start mb-4 relative z-10">
                  <div>
                      <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">{t.terminal.dominant}</div>
                      <h2 className={`text-3xl font-black italic uppercase tracking-tighter ${
                          matchedPersona.color ? `text-${matchedPersona.color.split('-')[1]}-400` : 'text-white'
                      }`}>
                          {matchedPersona.name}
                      </h2>
                      <div className="text-xs text-gray-400 mt-1 font-mono">
                          {getContentText(matchedPersona.title, lang)}
                      </div>
                  </div>
                  <div className="w-12 h-12 rounded-full border border-white/10 overflow-hidden">
                      <img src={matchedPersona.avatar} className="w-full h-full object-cover" />
                  </div>
              </div>
              
              <div className="absolute -right-4 -bottom-4 opacity-10 rotate-12 pointer-events-none">
                  <Fingerprint size={128} />
              </div>
          </div>

          <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-6 text-gray-400">
                  <Activity size={14} />
                  <span className="text-[10px] font-bold tracking-widest uppercase">{t.terminal.metrics}</span>
              </div>
              
              <div className="space-y-4 font-mono text-xs">
                  <div>
                      <div className="flex justify-between mb-1 text-gray-400">
                          <span>{t.terminal.dim_reality}</span>
                          <span>{stats.reality}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full" style={{width: `${stats.reality}%`}}></div>
                      </div>
                  </div>
                  <div>
                      <div className="flex justify-between mb-1 text-gray-400">
                          <span>{t.terminal.dim_chaos}</span>
                          <span>{stats.chaos}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-pink-500 rounded-full" style={{width: `${stats.chaos}%`}}></div>
                      </div>
                  </div>
                  <div>
                      <div className="flex justify-between mb-1 text-gray-400">
                          <span>{t.terminal.dim_empathy}</span>
                          <span>{stats.empathy}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-purple-500 rounded-full" style={{width: `${stats.empathy}%`}}></div>
                      </div>
                  </div>
                  <div>
                      <div className="flex justify-between mb-1 text-gray-400">
                          <span>{t.terminal.dim_ego}</span>
                          <span>{stats.ego}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-orange-500 rounded-full" style={{width: `${stats.ego}%`}}></div>
                      </div>
                  </div>
              </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
              <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                  <Shield size={20} className="text-gray-600 mb-2" />
                  <div className="text-[10px] text-gray-500">{t.terminal.security}</div>
                  <div className="text-lg font-bold text-white">LV.4</div>
              </div>
              <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                  <Battery size={20} className="text-gray-600 mb-2" />
                  <div className="text-[10px] text-gray-500">{t.terminal.device}</div>
                  <div className="text-lg font-bold text-white">{t.terminal.online}</div>
              </div>
          </div>

        </div>
      )}
    </div>
  );
}