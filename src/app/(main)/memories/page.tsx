'use client';

import { useState, useEffect } from 'react';
import { Box, Lock, Loader2, Share2, X } from 'lucide-react';
import { useAppLanguage } from '@/hooks/useAppLanguage';
import { ARTIFACTS_DB } from '@/config/artifacts';
import { ACHIEVEMENTS_DB } from '@/config/achievements';
import { memoryService } from '@/services/memoryService';
import { LOOT_ICON_MAP } from '@/data/ghostwriter';

export default function MemoriesPage() {
  const { t, lang } = useAppLanguage();
  const [activeTab, setActiveTab] = useState<'artifacts' | 'records'>('artifacts');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  
  const [inventory, setInventory] = useState<any[]>([]);
  const [unlockedIds, setUnlockedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [invData, achData] = await Promise.all([
          memoryService.getUserInventory(),
          memoryService.getUnlockedAchievements()
        ]);
        setInventory(invData || []);
        setUnlockedIds(achData || []);
      } catch(e) {
          console.error("Failed to load memories:", e);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const T = {
    header: lang === 'zh' ? '记忆库' : 'MEMORY BANK',
    tab1: lang === 'zh' ? '物品仓' : 'INVENTORY',
    tab2: lang === 'zh' ? '成就' : 'RECORDS',
    empty: lang === 'zh' ? '暂无数据' : 'NO DATA FOUND',
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center text-cyan-500">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-gray-200 pb-24 font-sans selection:bg-cyan-500/30">
      
      <header className="px-6 py-8 pt-12 sticky top-0 z-20 bg-[#050505]/90 backdrop-blur-md border-b border-white/5">
        <h1 className="text-2xl font-black text-white tracking-widest uppercase flex items-center gap-2">
           <Box className="text-cyan-500" />
           {T.header}
        </h1>
      </header>

      <div className="flex border-b border-white/10 px-6 sticky top-[88px] z-10 bg-[#050505]">
         <button onClick={() => setActiveTab('artifacts')} className={`flex-1 py-4 text-xs font-bold tracking-widest border-b-2 transition-colors ${activeTab === 'artifacts' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-gray-600'}`}>{T.tab1}</button>
         <button onClick={() => setActiveTab('records')} className={`flex-1 py-4 text-xs font-bold tracking-widest border-b-2 transition-colors ${activeTab === 'records' ? 'border-purple-500 text-purple-400' : 'border-transparent text-gray-600'}`}>{T.tab2}</button>
      </div>

      <main className="p-6 min-h-[50vh]">
        
        {/* Tab 1: 物品 */}
        {activeTab === 'artifacts' && (
          <div className="grid grid-cols-3 gap-3 animate-in fade-in slide-in-from-bottom-4">
             {/* 1. 核心藏品 (Fixed) */}
             {ARTIFACTS_DB.map((fixedItem) => {
               const ownedInstance = inventory.find(i => i.id === fixedItem.id && i.type === 'artifact');
               const Icon = fixedItem.icon;
               return (
                 <InventorySlot 
                    key={fixedItem.id}
                    item={fixedItem}
                    isOwned={!!ownedInstance}
                    icon={<Icon size={24} />}
                    onClick={() => setSelectedItem(fixedItem)}
                    lang={lang}
                 />
               );
             })}

             {/* 2. 动态掉落物 + 塔罗牌 (Loot/Tarot) */}
             {inventory
                .filter(i => i.type === 'loot' || i.type === 'tarot' || String(i.id).startsWith('tarot_'))
                .map((item) => {
                    // 🔥 修复：增加类型检查，确保 startsWith 只在字符串上调用
                    const isImageItem = (typeof item.icon === 'string' && item.icon.startsWith('/')) || 
                                      (typeof item.image === 'string' && item.image.startsWith('/'));
                    
                    const iconSrc = item.icon || item.image;
                    
                    // 如果不是图片，尝试用 Icon Map
                    const IconComponent = !isImageItem ? (LOOT_ICON_MAP[item.icon] || Box) : null;
                    
                    return (
                        <InventorySlot 
                            key={item.id}
                            item={item}
                            isOwned={true}
                            // 如果是图片路径，传 null 让组件自己处理；否则传 Icon 组件
                            icon={!isImageItem ? <IconComponent size={24} className="text-purple-400" /> : null}
                            imageSrc={isImageItem ? iconSrc : null} 
                            onClick={() => setSelectedItem(item)}
                            lang={lang}
                            isLoot={true}
                        />
                    );
                })
             }
          </div>
        )}

        {/* Tab 2: 成就 */}
        {activeTab === 'records' && (
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4">
            {ACHIEVEMENTS_DB.map((ach) => {
               const isUnlocked = unlockedIds.includes(ach.id);
               const Icon = ach.icon;
               return (
                 <div key={ach.id} className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${isUnlocked ? 'bg-white/5 border-white/10' : 'bg-black border-white/5 grayscale opacity-60'}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isUnlocked ? 'bg-purple-500/10 text-purple-400' : 'bg-gray-900 text-gray-700'}`}>
                       <Icon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                       <h3 className={`text-sm font-bold ${isUnlocked ? 'text-white' : 'text-gray-500'}`}>{lang === 'zh' ? ach.title.zh : ach.title.en}</h3>
                       <p className="text-xs text-gray-500 truncate mt-0.5">{isUnlocked ? (lang === 'zh' ? ach.desc.zh : ach.desc.en) : '???'}</p>
                    </div>
                 </div>
               );
            })}
          </div>
        )}
      </main>

      {selectedItem && (
         <ItemDetailModal 
            item={selectedItem} 
            onClose={() => setSelectedItem(null)} 
            lang={lang} 
         />
      )}
    </div>
  );
}

function InventorySlot({ item, isOwned, icon, imageSrc, onClick, lang, isLoot }: any) {
    const isSpecial = item.rarity === 'legendary' || item.rarity === 'epic' || (typeof imageSrc === 'string' && imageSrc.includes('tarot'));

    return (
        <button
            onClick={() => isOwned && onClick()}
            disabled={!isOwned}
            className={`aspect-square rounded-xl border flex flex-col items-center justify-center gap-2 relative overflow-hidden group transition-all ${isOwned ? 'bg-white/5 border-white/10 hover:border-cyan-500/50 hover:bg-white/10' : 'bg-black border-white/5 opacity-50 cursor-not-allowed'}`}
        >
            {isOwned ? (
                <>
                    <div className={`absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity bg-gradient-to-tr ${isSpecial ? 'from-purple-500' : 'from-cyan-500'} to-transparent`} />
                    
                    {imageSrc ? (
                        <div className="w-full h-full p-0.5">
                            <img src={imageSrc} alt="item" className="w-full h-full object-cover rounded-lg opacity-90 group-hover:opacity-100 transition-opacity" />
                        </div>
                    ) : (
                        <div className={isLoot ? 'text-purple-400' : (item.rarity === 'special' ? 'text-yellow-400 animate-pulse' : 'text-gray-300 group-hover:text-white')}>
                            {icon}
                        </div>
                    )}
                    
                    {!imageSrc && (
                        <span className="text-[9px] text-gray-500 uppercase font-mono max-w-[90%] truncate px-1">
                            {isLoot ? item.name : (lang === 'zh' ? item.name.zh : item.name.en)}
                        </span>
                    )}
                </>
            ) : (
                <>
                    <Lock size={16} className="text-gray-700" />
                    <div className="absolute inset-0 opacity-20" 
                        style={{ 
                        backgroundImage: 'radial-gradient(#444 1px, transparent 1px)', 
                        backgroundSize: '4px 4px' 
                        }} 
                    />
                </>
            )}
        </button>
    )
}

function ItemDetailModal({ item, onClose, lang }: any) {
    const getName = (obj: any) => {
        if (!obj) return 'Unknown';
        if (typeof obj === 'string') return obj;
        return lang === 'zh' ? (obj.zh || obj.en) : (obj.en || obj.zh);
    };

    const name = getName(item.name || item.name_json);
    const desc = getName(item.desc || item.description || item.desc_json || item.meaning);
    
    // 🔥 修复：增加 typeof 检查，防止 React 组件导致 crash
    const imageSrc = item.image || item.icon || item.image_url;
    const isImage = (typeof imageSrc === 'string') && imageSrc.startsWith('/');

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
           <div className="w-full max-w-sm bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative flex flex-col max-h-[80vh]">
              <button onClick={onClose} className="absolute top-3 right-3 p-2 bg-black/50 rounded-full text-white/70 hover:text-white z-20 backdrop-blur-sm"><X size={20} /></button>
              
              <div className="relative w-full shrink-0 bg-gradient-to-b from-gray-900 to-[#0a0a0a] flex items-center justify-center overflow-hidden">
                 {isImage ? (
                     <div className="w-full h-80 relative">
                         <img src={imageSrc} alt={name} className="w-full h-full object-cover" />
                         <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] to-transparent opacity-80" />
                     </div>
                 ) : (
                     <div className="h-40 w-full flex items-center justify-center">
                        <Box size={64} className="text-white/20" />
                     </div>
                 )}
              </div>

              <div className="p-6 space-y-4 overflow-y-auto">
                 <div>
                    <div className="flex items-center justify-between mb-2">
                       {item.rarity && <span className="text-[10px] font-bold text-cyan-500 uppercase tracking-widest border border-cyan-500/30 px-2 py-0.5 rounded">{item.rarity}</span>}
                       {item.type && <span className="text-[10px] text-gray-600 uppercase tracking-wider">{item.type}</span>}
                    </div>
                    <h2 className="text-2xl font-black text-white leading-tight">{name}</h2>
                 </div>
                 
                 <div className="text-sm text-gray-300 leading-relaxed border-l-2 border-cyan-500/30 pl-4 py-1 italic">
                     {desc}
                 </div>
                 
                 {item.keywords && (
                     <div className="flex flex-wrap gap-2 pt-2">
                         {(Array.isArray(item.keywords) ? item.keywords : (lang==='zh'?item.keywords.zh:item.keywords.en) || []).map((kw:string, i:number) => (
                             <span key={i} className="text-[10px] px-2 py-1 bg-white/5 rounded text-gray-400 uppercase">{kw}</span>
                         ))}
                     </div>
                 )}

                 <button className="w-full py-3 bg-white text-black font-bold uppercase tracking-widest rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 mt-4 shrink-0">
                    <Share2 size={16} /> SHARE
                 </button>
              </div>
           </div>
        </div>
    )
}