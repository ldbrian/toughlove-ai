import { useState } from 'react';
import { X, Lock, PackageOpen, Send, Eye, RectangleVertical, ImageOff, Sparkles } from 'lucide-react';
// 🔥 必须引入 TAROT_DECK 以便查表
import { LOOT_TABLE, LangType, LootItem, TAROT_DECK } from '@/lib/constants';

interface InventoryModalProps {
  show: boolean;
  onClose: () => void;
  inventoryItems: string[];
  lang: LangType;
  isUsageMode?: boolean; 
  onUseItem?: (item: LootItem) => void;
  currentPersona?: string; 
}

export function InventoryModal({ 
  show, onClose, inventoryItems, lang, 
  isUsageMode = false, onUseItem, currentPersona 
}: InventoryModalProps) {
  
  const [selectedItem, setSelectedItem] = useState<LootItem | null>(null);

  if (!show) return null;

  // --- 🔥 修复逻辑：动态重组塔罗列表 ---
  // 1. 在背包里寻找以 tarot_ 开头的 ID
  const currentTarotId = inventoryItems.find(id => id.startsWith('tarot_'));
  
  // 默认占位符
  let tarotSlotItem: LootItem = {
      id: 'placeholder_tarot',
      name: { zh: '每日塔罗', en: 'Daily Tarot' },
      description: { zh: '每日仅限一张。请前往首页抽取你的命运。', en: 'Draw your daily fate at home.' },
      iconSvg: 'TAROT_PLACEHOLDER', 
      sourcePersona: 'System',
      rarity: 'epic',
      trigger_context: 'daily_draw'
  };

  // 2. 如果背包里有塔罗牌，动态构建 LootItem 对象
  if (currentTarotId) {
      // 解析 ID (e.g. "tarot_13" -> "13")
      const rawId = currentTarotId.split('_')[1];
      // 从 TAROT_DECK 查找原始数据
      const originalCard = TAROT_DECK.find(c => c.id === parseInt(rawId));

      if (originalCard) {
          tarotSlotItem = {
              id: currentTarotId, // 关键：使用背包里的 ID 才能判定 isOwned
              name: originalCard.name,
              // 显示塔罗牌义
              description: { zh: originalCard.meaning, en: originalCard.meaning }, 
              // 使用图片 URL
              iconSvg: originalCard.image, 
              sourcePersona: 'System',
              rarity: 'legendary', // 设为传说级，显示金色特效
              // 关键：设置触发上下文，以便点击使用时发送特定指令给 AI
              trigger_context: `interpret_tarot_${rawId}` 
          };
      }
  }

  const otherItems = Object.values(LOOT_TABLE).filter(item => {
      // 过滤掉静态表里可能残留的旧塔罗定义
      return !item.id.toLowerCase().includes('tarot') && !item.name.zh.includes('塔罗');
  });

  const displayItems = [tarotSlotItem, ...otherItems];

  // 补齐 20 格
  const minSlots = 20;
  const neededSlots = Math.max(displayItems.length, minSlots);
  const remainder = neededSlots % 4;
  const totalSlots = remainder === 0 ? neededSlots : neededSlots + (4 - remainder);
  
  const getRarityStyles = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'border-amber-500 bg-amber-500/20 text-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.4)]';
      case 'epic': return 'border-purple-500 bg-purple-500/20 text-purple-200 shadow-[0_0_20px_rgba(168,85,247,0.4)]';
      case 'rare': return 'border-cyan-500 bg-cyan-500/20 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.4)]';
      default: return 'border-white/20 bg-white/10 text-gray-300';
    }
  };

  const itemIsOwned = (item: LootItem | null) => {
      if (!item) return false;
      if (item.id === 'placeholder_tarot') return false; 
      // 只要 ID 在列表里就算拥有
      return inventoryItems.includes(item.id);
  };

  const handleItemClick = (item: LootItem) => {
    setSelectedItem(item);
  };

  const handleConfirmUse = () => {
    const isOwned = itemIsOwned(selectedItem);
    if (selectedItem && isOwned && onUseItem) {
        onUseItem(selectedItem);
        setSelectedItem(null); 
        onClose(); 
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200 pointer-events-auto">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md h-[70vh] bg-[#121212] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col ring-1 ring-white/10 animate-in zoom-in-95 duration-300">
        
        <div className="flex justify-between items-center px-6 py-5 bg-[#181818] border-b border-white/5 shrink-0">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${isUsageMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-[#7F5CFF]/20 text-[#7F5CFF]'}`}>
                <PackageOpen size={20} />
            </div>
            <div>
                <h2 className="text-lg font-black text-white tracking-widest uppercase">
                    {isUsageMode ? (lang === 'zh' ? '选择物品' : 'SELECT ITEM') : (lang === 'zh' ? '背包' : 'INVENTORY')}
                </h2>
                <p className="text-[10px] text-gray-500 font-mono">
                    {inventoryItems.length}/{otherItems.length + 1} COLLECTED
                </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
            <X size={18} className="text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-[#0a0a0a]">
          <div className="grid grid-cols-4 gap-3">
            {displayItems.map((item) => {
              const isUnlocked = itemIsOwned(item);
              const rarityStyle = getRarityStyles(item.rarity);
              const isSelected = selectedItem?.id === item.id;
              // 判定逻辑修改：只看 ID 字符串
              const isTarot = item.id.startsWith('tarot') || item.id === 'placeholder_tarot';

              return (
                <div 
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={`
                    relative aspect-square rounded-xl border flex flex-col items-center justify-center p-1 group transition-all duration-200 overflow-hidden
                    ${isUnlocked 
                      ? `${rarityStyle} cursor-pointer ${isSelected ? 'ring-2 ring-white scale-95' : 'hover:scale-105'}` 
                      : `border-white/5 bg-white/[0.02] cursor-pointer hover:bg-white/5 ${isSelected ? 'ring-1 ring-white/30' : ''}`
                    }
                  `}
                >
                  <div className="flex-1 flex items-center justify-center w-full h-full relative">
                    
                    {/* 图片渲染 */}
                    {isTarot ? (
                        item.iconSvg?.startsWith('/') ? (
                            <img 
                              src={item.iconSvg} 
                              className={`relative z-10 w-full h-full object-contain ${isUnlocked ? '' : 'grayscale opacity-30'}`}
                              onError={(e) => { e.currentTarget.style.display = 'none'; }} 
                            />
                        ) : null
                    ) : (
                        item.iconSvg?.startsWith('/') ? (
                            <img 
                              src={item.iconSvg} 
                              className={`relative z-10 w-full h-full object-contain p-1 ${isUnlocked ? '' : 'grayscale opacity-30'}`}
                              onError={(e) => { e.currentTarget.style.display = 'none'; }} 
                            />
                        ) : <span className={`relative z-10 text-2xl ${isUnlocked ? '' : 'grayscale opacity-30'}`}>{item.iconSvg !== 'icon' ? item.iconSvg : ''}</span>
                    )}

                    {/* 兜底层 */}
                    <div className={`absolute inset-0 flex items-center justify-center z-0 ${item.iconSvg?.startsWith('/') ? '' : 'hidden'}`}>
                        {isTarot ? (
                            <div className={`w-8 h-10 border border-purple-500/30 rounded flex items-center justify-center ${isUnlocked ? 'bg-purple-900/20' : 'bg-transparent'}`}>
                                <RectangleVertical size={18} className={`${isUnlocked ? 'text-purple-400' : 'text-gray-700'}`} />
                            </div>
                        ) : (
                            <ImageOff size={18} className="opacity-10 text-gray-500" />
                        )}
                    </div>

                  </div>
                  {!isUnlocked && <Lock size={12} className="absolute top-1 right-1 text-white/20 z-20" />}
                </div>
              );
            })}
            
            {/* 空格子 */}
            {[...Array(Math.max(0, totalSlots - displayItems.length))].map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square rounded-xl border border-white/5 bg-white/[0.02]" />
            ))}
          </div>
        </div>

        {/* Details Panel */}
        {selectedItem && (
            <div className="bg-[#181818] border-t border-white/10 p-5 shrink-0 animate-[slideUp_0.2s_ease-out] z-10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
                <div className="flex gap-4 mb-4">
                    <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center shrink-0 bg-black/40 overflow-hidden relative ${itemIsOwned(selectedItem) ? getRarityStyles(selectedItem.rarity) : 'border-white/10 text-gray-500'}`}>
                        {/* 详情页图标兜底 */}
                        {selectedItem.id.startsWith('tarot') || selectedItem.id === 'placeholder_tarot' ? (
                             <div className="absolute inset-0 flex items-center justify-center bg-purple-900/10">
                                 {selectedItem.iconSvg?.startsWith('/') ? (
                                <img src={selectedItem.iconSvg} className="w-full h-full object-cover" />
                            ) : (
                                <Sparkles size={24} className={itemIsOwned(selectedItem) ? 'text-purple-400' : 'text-gray-600'}/>
                            )}
                            </div>
                        ) : null}
                        
                        {selectedItem.iconSvg?.startsWith('/') && (
                            <img src={selectedItem.iconSvg} className={`relative z-10 w-full h-full object-cover ${itemIsOwned(selectedItem) ? '' : 'grayscale opacity-50'}`} onError={(e) => e.currentTarget.style.display='none'}/>
                        )}
                        {!selectedItem.iconSvg?.startsWith('/') && !selectedItem.id.startsWith('tarot') && (
                            <span className="relative z-10 text-3xl">{selectedItem.iconSvg !== 'icon' ? selectedItem.iconSvg : '📦'}</span>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                            <h3 className="text-base font-bold text-white truncate">{lang === 'zh' ? selectedItem.name.zh : selectedItem.name.en}</h3>
                            <button onClick={() => setSelectedItem(null)} className="text-gray-500 hover:text-white"><X size={14}/></button>
                        </div>
                        <div className="h-12 overflow-y-auto mt-1 custom-scrollbar pr-2">
                            <p className="text-xs text-gray-400 leading-relaxed">
                                {itemIsOwned(selectedItem) 
                                    ? (lang === 'zh' ? selectedItem.description.zh : selectedItem.description.en)
                                    : <span className="italic opacity-50 flex items-center gap-1"><Lock size={10}/> {lang === 'zh' ? '探索未知以解锁...' : 'Explore Unknown to unlock...'}</span>
                                }
                            </p>
                        </div>
                    </div>
                </div>

                {isUsageMode ? (
                    <button 
                        onClick={handleConfirmUse}
                        disabled={!itemIsOwned(selectedItem)}
                        className={`w-full py-3 font-black rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95 ${
                            itemIsOwned(selectedItem)
                            ? 'bg-white text-black hover:bg-gray-200' 
                            : 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/5'
                        }`}
                    >
                        {!itemIsOwned(selectedItem) ? (
                            <>
                                <Lock size={16} /> <span>{lang === 'zh' ? '未获得' : 'LOCKED'}</span>
                            </>
                        ) : (selectedItem.id.startsWith('tarot') || selectedItem.id === 'future_letter') ? (
                            <><Eye size={18}/> <span>{lang === 'zh' ? '展示并解读' : 'Show & Read'}</span></>
                        ) : (
                            <><Send size={18}/> <span>{lang === 'zh' ? `赠送给 ${currentPersona}` : `Give to ${currentPersona}`}</span></>
                        )}
                    </button>
                ) : (
                    <div className="text-[10px] text-center text-gray-600 font-mono pt-1">
                        {lang === 'zh' ? '在聊天中打开背包即可使用' : 'Open in Chat to use'}
                    </div>
                )}
            </div>
        )}

      </div>
    </div>
  );
}