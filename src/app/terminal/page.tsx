'use client';

import { useState, useEffect } from 'react';
import { 
  Package, User, CreditCard, Shield, Battery, 
  Lock, Scroll, ImageOff, Brain, Activity, Fingerprint 
} from 'lucide-react';
// 引入常量
import { LOOT_TABLE, TAROT_DECK, UI_TEXT, LangType, PERSONAS } from '@/lib/constants';

// --- 局部翻译配置 ---
const TERMINAL_UI = {
  zh: {
    assets: '总资产',
    inventory: '背包物品',
    psyche: '精神档案',
    id_linked: '已连接',
    id_guest: '访客模式',
    dominant: '主导人格',
    metrics: '心理维度监测',
    dim_reality: '现实感 (REALITY)',
    dim_chaos: '混乱度 (CHAOS)',
    dim_empathy: '共情力 (EMPATHY)',
    dim_ego: '自我意识 (EGO)',
    security: '安全等级',
    device: '设备状态',
    online: '在线',
    unknown_item: '未知物品',
    daily_tarot: '每日塔罗'
  },
  en: {
    assets: 'TOTAL ASSETS',
    inventory: 'INVENTORY',
    psyche: 'PSYCH_DATA',
    id_linked: 'LINKED',
    id_guest: 'GUEST',
    dominant: 'DOMINANT ARCHETYPE',
    metrics: 'PSYCHOMETRICS',
    dim_reality: 'REALITY',
    dim_chaos: 'CHAOS',
    dim_empathy: 'EMPATHY',
    dim_ego: 'EGO',
    security: 'SECURITY',
    device: 'DEVICE',
    online: 'ONLINE',
    unknown_item: 'Unknown Item',
    daily_tarot: 'Daily Tarot'
  }
};

// 获取本地存储
const getLocalData = () => {
  if (typeof window === 'undefined') return { inventory: [], balance: 0, user: 'Traveler', profile: null };
  const inv = localStorage.getItem('toughlove_inventory');
  const bal = localStorage.getItem('toughlove_user_rin');
  const usr = localStorage.getItem('toughlove_user_name');
  const prof = localStorage.getItem('toughlove_user_profile');
  
  return { 
    inventory: inv ? JSON.parse(inv) : [],
    balance: bal ? parseInt(bal) : 0,
    user: usr || 'Traveler',
    profile: prof ? JSON.parse(prof) : null
  };
};

export default function TerminalPage() {
  const [activeTab, setActiveTab] = useState<'inventory' | 'profile'>('inventory');
  const [data, setData] = useState<any>({ inventory: [], balance: 0, user: 'Traveler', profile: null });
  const [lang, setLang] = useState<LangType>('zh');

  useEffect(() => {
    setData(getLocalData());
    const savedLang = localStorage.getItem('toughlove_lang_preference');
    if (savedLang === 'en' || savedLang === 'zh') setLang(savedLang as LangType);
  }, []);

  const t = TERMINAL_UI[lang]; // 使用局部翻译
  // @ts-ignore
  const commonT = UI_TEXT[lang]; // 备用通用翻译

  // --- 逻辑：计算心理维度 ---
  const calculateStats = () => {
      if (!data.profile || !data.profile.raw) return { ego: 50, chaos: 50, empathy: 50, reality: 50 };
      const raw = data.profile.raw;
      const counts: any = { ego: 0, chaos: 0, empathy: 0, reality: 0, will: 0 };
      const total = Object.keys(raw).length || 1;
      
      Object.values(raw).forEach((val: any) => {
          if (counts[val] !== undefined) counts[val]++;
      });

      // 归一化为百分比 (简单算法)
      return {
          ego: Math.min(100, Math.round((counts.ego / total) * 100) + 20),
          chaos: Math.min(100, Math.round((counts.chaos / total) * 100) + 20),
          empathy: Math.min(100, Math.round((counts.empathy / total) * 100) + 20),
          reality: Math.min(100, Math.round((counts.reality / total) * 100) + 20),
      };
  };
  const stats = calculateStats();
  
  // 获取匹配的人格信息
  const dominantKey = data.profile?.dominant || 'Ash';
  const matchedPersona = PERSONAS[dominantKey as keyof typeof PERSONAS] || PERSONAS['Ash'];

  // --- 逻辑：构建物品列表 ---
  const currentTarotId = data.inventory.find((id: string) => id.startsWith('tarot_'));
  let tarotSlotItem: any = LOOT_TABLE['placeholder_tarot'] || {
      id: 'placeholder_tarot', name: { zh: '每日塔罗', en: 'Daily Tarot' }, iconSvg: 'TAROT_PLACEHOLDER', rarity: 'epic'
  };

  if (currentTarotId) {
      try {
          const rawId = parseInt(currentTarotId.split('_')[1]);
          const card = TAROT_DECK.find(c => c.id === rawId);
          if (card) {
              tarotSlotItem = {
                  id: currentTarotId,
                  name: card.name,
                  description: { zh: card.meaning, en: card.meaning },
                  iconSvg: card.image,
                  rarity: 'legendary',
                  isTarot: true
              };
          }
      } catch (e) {}
  }

  const otherItems = Object.values(LOOT_TABLE).filter(item => {
      return !item.id.toLowerCase().includes('tarot') && item.id !== 'placeholder_tarot';
  });
  const displayItems = [tarotSlotItem, ...otherItems];
  const totalSlots = Math.max(displayItems.length, 16);

  const getRarityStyles = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'border-amber-500/40 bg-amber-500/5 text-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.2)]';
      case 'epic': return 'border-purple-500/40 bg-purple-500/5 text-purple-200 shadow-[0_0_20px_rgba(168,85,247,0.2)]';
      case 'rare': return 'border-cyan-500/40 bg-cyan-500/5 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.2)]';
      default: return 'border-white/10 bg-white/5 text-gray-400';
    }
  };

  const itemIsOwned = (item: any) => {
      if (item.id === 'placeholder_tarot') return false;
      return data.inventory.includes(item.id);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-gray-200 pb-24 px-6 pt-12 overflow-y-auto custom-scrollbar relative font-sans">
      <div className="fixed inset-0 bg-[url('/noise.png')] opacity-10 pointer-events-none" />
      
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
                        ID: {data.profile ? t.id_linked : t.id_guest}
                    </div>
                </div>
            </div>
            
            <div className="text-right">
                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1 flex items-center justify-end gap-1">
                    <CreditCard size={10} /> {t.assets}
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
                <Package size={14} /> {t.inventory}
                {activeTab === 'inventory' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-white shadow-[0_0_15px_white]" />}
            </button>
            <button 
                onClick={() => setActiveTab('profile')}
                className={`pb-3 text-[10px] font-black tracking-[0.2em] transition-all relative flex items-center gap-2 ${activeTab === 'profile' ? 'text-white' : 'text-gray-600 hover:text-gray-400'}`}
            >
                <Brain size={14} /> {t.psyche}
                {activeTab === 'profile' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-white shadow-[0_0_15px_white]" />}
            </button>
        </div>
      </header>

      {/* Tab 1: Inventory */}
      {activeTab === 'inventory' && (
        <div className="grid grid-cols-3 gap-3 pb-8 relative z-10 animate-in fade-in zoom-in-95">
          {displayItems.map((item) => {
            const isUnlocked = itemIsOwned(item);
            const rarityStyle = getRarityStyles(item.rarity);
            const isTarot = item.id.startsWith('tarot') || item.id === 'placeholder_tarot';

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
                                        e.currentTarget.parentElement!.querySelector('.fallback-icon')!.classList.remove('hidden');
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
                        {lang === 'zh' ? item.name.zh : item.name.en}
                    </span>
                </div>
              </div>
            );
          })}
          {[...Array(Math.max(0, totalSlots - displayItems.length))].map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square rounded-xl border border-white/5 bg-white/[0.02] flex items-center justify-center">
              <div className="w-1 h-1 rounded-full bg-white/10" />
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Psych Profile */}
      {activeTab === 'profile' && (
        <div className="space-y-6 relative z-10 animate-in fade-in slide-in-from-bottom-4">
          
          {/* 1. 主导人格卡片 */}
          <div className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br from-[#1a1a1a] to-black p-6 shadow-2xl ${
              matchedPersona.name === 'Ash' ? 'border-cyan-500/30 shadow-cyan-500/10' :
              matchedPersona.name === 'Rin' ? 'border-purple-500/30 shadow-purple-500/10' :
              matchedPersona.name === 'Sol' ? 'border-orange-500/30 shadow-orange-500/10' :
              matchedPersona.name === 'Vee' ? 'border-pink-500/30 shadow-pink-500/10' :
              'border-slate-500/30'
          }`}>
              <div className="flex justify-between items-start mb-4 relative z-10">
                  <div>
                      <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">{t.dominant}</div>
                      <h2 className={`text-3xl font-black italic uppercase tracking-tighter ${
                          matchedPersona.color ? `text-${matchedPersona.color.split('-')[1]}-400` : 'text-white'
                      }`}>
                          {matchedPersona.name}
                      </h2>
                      <div className="text-xs text-gray-400 mt-1 font-mono">
                          {lang === 'zh' ? matchedPersona.title.zh : matchedPersona.title.en} // {lang === 'zh' ? matchedPersona.slogan.zh : matchedPersona.slogan.en}
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

          {/* 2. 维度雷达 */}
          <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-6 text-gray-400">
                  <Activity size={14} />
                  <span className="text-[10px] font-bold tracking-widest uppercase">{t.metrics}</span>
              </div>
              
              <div className="space-y-4 font-mono text-xs">
                  <div>
                      <div className="flex justify-between mb-1 text-gray-400">
                          <span>{t.dim_reality}</span>
                          <span>{stats.reality}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full" style={{width: `${stats.reality}%`}}></div>
                      </div>
                  </div>
                  <div>
                      <div className="flex justify-between mb-1 text-gray-400">
                          <span>{t.dim_chaos}</span>
                          <span>{stats.chaos}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-pink-500 rounded-full" style={{width: `${stats.chaos}%`}}></div>
                      </div>
                  </div>
                  <div>
                      <div className="flex justify-between mb-1 text-gray-400">
                          <span>{t.dim_empathy}</span>
                          <span>{stats.empathy}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-purple-500 rounded-full" style={{width: `${stats.empathy}%`}}></div>
                      </div>
                  </div>
                  <div>
                      <div className="flex justify-between mb-1 text-gray-400">
                          <span>{t.dim_ego}</span>
                          <span>{stats.ego}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-orange-500 rounded-full" style={{width: `${stats.ego}%`}}></div>
                      </div>
                  </div>
              </div>
          </div>

          {/* 3. 系统信息 */}
          <div className="grid grid-cols-2 gap-3">
              <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                  <Shield size={20} className="text-gray-600 mb-2" />
                  <div className="text-[10px] text-gray-500">{t.security}</div>
                  <div className="text-lg font-bold text-white">LV.4</div>
              </div>
              <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                  <Battery size={20} className="text-gray-600 mb-2" />
                  <div className="text-[10px] text-gray-500">{t.device}</div>
                  <div className="text-lg font-bold text-white">{t.online}</div>
              </div>
          </div>

        </div>
      )}
    </div>
  );
}