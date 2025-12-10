import { useState } from 'react';
import { X, Lock, PackageOpen, Send, Eye, RectangleVertical, ImageOff, Sparkles, Package } from 'lucide-react';
// Refactor: 引用单一事实来源，移除旧的常量引用
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

  // 逻辑保持：判断是否拥有物品
  const itemIsOwned = (item: LootItem) => {
      if (item.id === 'placeholder_tarot') return false; 
      return inventory.some(i => i.id === item.id);
  };

  // 逻辑保持：处理点击
  const handleItemClick = (item: LootItem) => {
    setSelectedItem(item);
  };

  // 逻辑保持：确认使用
  const handleConfirmUse = () => {
    // Safety: 增加可选链保护，防止 selectedItem 为 null 时报错
    if (selectedItem && itemIsOwned(selectedItem)) {
        // 多语言安全获取
        const itemName = lang === 'zh' ? (selectedItem.name?.zh || '未知物品') : (selectedItem.name?.en || 'Unknown Item');
        
        // 1. 发送指令给 AI
        const usageText = `[SYSTEM: User used item "${itemName}". Effect context: ${selectedItem.trigger_context || 'Standard Use'}]`;
        
        handleSend(usageText, true);

        // 2. 消耗逻辑 (保持原状：暂不移除，只触发效果)
        // const newInv = inventory.filter(i => i.id !== selectedItem.id); setInventory(newInv);

        setSelectedItem(null); 
        onClose(); 
    }
  };

  // 视觉保持：样式辅助函数
  const getRarityStyles = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'border-amber-500 bg-amber-500/20 text-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.4)]';
      case 'epic': return 'border-purple-500 bg-purple-500/20 text-purple-200 shadow-[0_0_20px_rgba(168,85,247,0.4)]';
      case 'rare': return 'border-cyan-500 bg-cyan-500/20 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.4)]';
      default: return 'border-white/20 bg-white/10 text-gray-300';
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200 pointer-events-auto">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md h-[70vh] bg-[#121212] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col ring-1 ring-white/10">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-5 bg-[#181818] border-b border-white/5 shrink-0">
          <div className="flex items-center gap-3">
            <PackageOpen size={20} className="text-[#7F5CFF]" />
            <h2 className="text-lg font-black text-white tracking-widest uppercase">
                {lang === 'zh' ? '背包' : 'INVENTORY'}
            </h2>
          </div>
          <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 bg-[#0a0a0a]">
          <div className="grid grid-cols-4 gap-3">
             {inventory.length === 0 ? (
                 <div className="col-span-4 flex flex-col items-center justify-center py-20 text-gray-700">
                     <Package size={40} />
                     <p className="text-xs mt-2">{lang === 'zh' ? '空空如也' : 'Empty'}</p>
                 </div>
             ) : (
                 inventory.map((item, idx) => (
                    <div 
                        key={`${item.id}-${idx}`}
                        onClick={() => handleItemClick(item)}
                        className={`aspect-square rounded-xl border flex items-center justify-center cursor-pointer ${getRarityStyles(item.rarity)}`}
                    >
                        <span className="text-2xl">{item.iconSvg?.startsWith('/') ? '🖼️' : (item.iconSvg || '📦')}</span>
                    </div>
                 ))
             )}
          </div>
        </div>

        {/* Footer / Details */}
        {selectedItem && (
            <div className="bg-[#181818] border-t border-white/10 p-5 shrink-0">
                <h3 className="text-white font-bold">
                    {lang === 'zh' ? (selectedItem.name?.zh || '未知') : (selectedItem.name?.en || 'Unknown')}
                </h3>
                <p className="text-gray-400 text-xs mt-1">
                    {lang === 'zh' ? (selectedItem.description?.zh || '无描述') : (selectedItem.description?.en || 'No description')}
                </p>
                <button onClick={handleConfirmUse} className="w-full mt-4 py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200">
                    {lang === 'zh' ? '使用' : 'USE'}
                </button>
            </div>
        )}
      </div>
    </div>
  );
}
