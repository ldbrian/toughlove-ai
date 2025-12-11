import { useState } from 'react';
import { X, PackageOpen, Package, Eye, Zap } from 'lucide-react';
import { InventoryModalProps, LootItem } from '@/types'; 

export function InventoryModal({ 
  show, 
  onClose, 
  inventory, 
  setInventory, 
  handleSend, 
  partnerId, 
  lang 
}: InventoryModalProps) {
  
  const [selectedItem, setSelectedItem] = useState<LootItem | null>(null);

  if (!show) return null;

  // 1. 定义背包最小格子数 (例如 20格)
  const MIN_SLOTS = 20;
  
  // 计算需要补多少个空格子
  const emptySlotsCount = Math.max(0, MIN_SLOTS - inventory.length);
  const emptySlots = new Array(emptySlotsCount).fill(null);

  const itemIsOwned = (item: LootItem) => {
      if (item.id === 'placeholder_tarot') return false; 
      return inventory.some(i => i.id === item.id);
  };

  const handleItemClick = (item: LootItem) => {
    setSelectedItem(item);
  };

  // 🔥 核心修改：使用/展示物品的逻辑
  const handleConfirmUse = () => {
    if (selectedItem && itemIsOwned(selectedItem)) {
        const itemName = lang === 'zh' ? (selectedItem.name?.zh || '未知物品') : (selectedItem.name?.en || 'Unknown Item');
        const isSpecial = selectedItem.type === 'special';
        
        let actionMessage = "";

        // 3. 根据类型生成不同的“显性”剧情提示词
        if (lang === 'zh') {
            if (isSpecial) {
                // 剧情道具：展示给对方看
                actionMessage = `(从背包里小心翼翼地拿出了【${itemName}】，展示给你看)`; 
            } else {
                // 消耗品：直接使用
                actionMessage = `(使用了物品【${itemName}】)`;
            }
        } else {
            if (isSpecial) {
                actionMessage = `(Takes out [${itemName}] and shows it to you)`;
            } else {
                actionMessage = `(Used item [${itemName}])`;
            }
        }
        
        // 发送这条消息到聊天框 (AI 会看到，用户也会看到)
        handleSend(actionMessage, false); // false = 不隐藏，显示在聊天记录里
        
        setSelectedItem(null); 
        onClose(); 
    }
  };

  const getRarityStyles = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'border-amber-500 bg-amber-500/10 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.3)]';
      case 'epic': return 'border-purple-500 bg-purple-500/10 text-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.3)]';
      case 'rare': return 'border-cyan-500 bg-cyan-500/10 text-cyan-200 shadow-[0_0_10px_rgba(6,182,212,0.3)]';
      default: return 'border-white/10 bg-white/5 text-gray-400';
    }
  };

  const renderItemIcon = (item: LootItem, isLarge = false) => {
      // @ts-ignore
      const src = item.image || item.iconSvg || '📦';
      const isImage = src.startsWith('/') || src.startsWith('http');

      if (isImage) {
          return (
              <div className="w-full h-full overflow-hidden flex items-center justify-center rounded-md">
                  <img 
                      src={src} 
                      alt="item" 
                      className={`w-full h-full object-cover transition-transform duration-500 ${isLarge ? '' : 'hover:scale-110'}`} 
                  />
              </div>
          );
      } else {
          return <span className={isLarge ? "text-5xl drop-shadow-md" : "text-3xl drop-shadow-sm"}>{src}</span>;
      }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200 pointer-events-auto">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md h-[65vh] bg-[#090909] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col ring-1 ring-white/10">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 bg-[#111] border-b border-white/5 shrink-0">
          <div className="flex items-center gap-3">
            <PackageOpen size={18} className="text-[#7F5CFF]" />
            <h2 className="text-sm font-black text-gray-200 tracking-[0.2em] uppercase">
                {lang === 'zh' ? '背包' : 'INVENTORY'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={16} className="text-gray-400" /></button>
        </div>

        {/* Grid List */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          <div className="grid grid-cols-4 gap-3">
             {/* 渲染真实物品 */}
             {inventory.map((item, idx) => {
                const isSelected = selectedItem?.id === item.id;
                return (
                    <div 
                        key={`${item.id}-${idx}`}
                        onClick={() => handleItemClick(item)}
                        className={`
                            aspect-square rounded-xl border flex items-center justify-center cursor-pointer transition-all duration-200 relative overflow-hidden group
                            ${getRarityStyles(item.rarity)}
                            ${isSelected ? 'ring-2 ring-white/50 scale-95' : 'hover:border-white/30'}
                        `}
                    >
                        <div className="w-[70%] h-[70%] flex items-center justify-center">
                            {renderItemIcon(item)}
                        </div>
                        {isSelected && <div className="absolute inset-0 bg-white/10 animate-pulse"></div>}
                    </div>
                );
             })}

             {/* 1. 渲染空格子 (占位符) */}
             {emptySlots.map((_, idx) => (
                <div 
                    key={`empty-${idx}`}
                    className="aspect-square rounded-xl border border-white/5 bg-white/[0.02] flex items-center justify-center relative"
                >
                    {/* 给空格子加一点点细节，比如一个小十字或者斜线，显得更有科技感 */}
                    <div className="w-2 h-2 rounded-full bg-white/5"></div>
                </div>
             ))}
          </div>
        </div>

        {/* Detail Panel */}
        <div className={`
            bg-[#111] border-t border-white/10 transition-all duration-300 ease-out shrink-0
            ${selectedItem ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 absolute bottom-0 w-full'}
        `}>
            {selectedItem && (
                <div className="p-6 flex gap-5">
                    {/* 左侧大图 */}
                    <div className={`w-16 h-16 rounded-lg border shrink-0 flex items-center justify-center overflow-hidden bg-black/50 ${getRarityStyles(selectedItem.rarity)}`}>
                         {renderItemIcon(selectedItem, true)}
                    </div>
                    
                    {/* 右侧信息 */}
                    <div className="flex-1 flex flex-col justify-between">
                        <div>
                            <h3 className="text-white font-bold text-sm tracking-wide">
                                {lang === 'zh' ? (selectedItem.name?.zh || '...') : (selectedItem.name?.en || '...')}
                            </h3>
                            <p className="text-gray-400 text-[10px] leading-relaxed mt-1 line-clamp-2">
                                {lang === 'zh' ? (selectedItem.description?.zh || '...') : (selectedItem.description?.en || '...')}
                            </p>
                        </div>
                        
                        {/* 2. 动态按钮：根据物品类型显示“使用”或“展示” */}
                        <button 
                            onClick={handleConfirmUse} 
                            className={`mt-3 w-full py-2 text-xs font-black uppercase tracking-widest rounded transition-colors active:scale-95 flex items-center justify-center gap-2
                                ${selectedItem.type === 'special' 
                                    ? 'bg-purple-500 hover:bg-purple-400 text-white'  // 剧情道具用紫色
                                    : 'bg-white hover:bg-gray-200 text-black'         // 普通道具用白色
                                }
                            `}
                        >
                            {selectedItem.type === 'special' ? (
                                <><Eye size={12} /> {lang === 'zh' ? '展示给 TA' : 'SHOW'}</>
                            ) : (
                                <><Zap size={12} /> {lang === 'zh' ? '使用' : 'USE'}</>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}