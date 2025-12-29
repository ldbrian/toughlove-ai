

import React, { useState, useMemo, useEffect } from 'react';
import { X, Package, ArrowRight, Loader2 } from 'lucide-react';
import { getDeviceId } from '@/lib/utils';
// 🔥 引入你的 i18n 模块
import { getDict, Dictionary, baseEn } from '@/lib/i18n/dictionaries';
import { LangType } from '@/types';

interface InventoryItem {
  id: string;
  name: { zh: string; en: string };
  description: { zh: string; en: string };
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  type: string;
  image: string;
  price: number;
  count?: number; 
}

interface InventoryModalProps {
  show: boolean;
  onClose: () => void;
  inventory: any[]; 
  onUseItem?: (msg: string) => void; 
}

// 稀有度颜色映射 (UI 样式，不涉及文案)
const RARITY_COLOR_MAP: Record<string, string> = {
  legendary: 'border-yellow-500/50 text-yellow-500 shadow-yellow-500/20',
  epic: 'border-purple-500/50 text-purple-500 shadow-purple-500/20',
  rare: 'border-blue-500/50 text-blue-500 shadow-blue-500/20',
  common: 'border-gray-700 text-gray-400' 
};

export function InventoryModal({ show, onClose, inventory, onUseItem }: InventoryModalProps) {
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [isUsing, setIsUsing] = useState(false);
  
  // 🔥 管理语言状态
  const [lang, setLang] = useState<LangType>('zh');
  const [dict, setDict] = useState<Dictionary>(baseEn);

  useEffect(() => {
    // 从 localStorage 读取语言，默认为 zh
    const savedLang = (localStorage.getItem('toughlove_lang') as LangType) || 'zh';
    setLang(savedLang);
    setDict(getDict(savedLang));
  }, []);

  const stackedInventory = useMemo(() => {
    const map = new Map<string, InventoryItem>();
    inventory.forEach((item) => {
      if (map.has(item.id)) {
        const existing = map.get(item.id)!;
        existing.count = (existing.count || 1) + 1;
      } else {
        map.set(item.id, { ...item, count: 1 });
      }
    });
    return Array.from(map.values());
  }, [inventory]);

  if (!show) return null;

  const handleConfirmUse = async () => {
    if (!selectedItem) return;

    setIsUsing(true);
    try {
      const userId = getDeviceId();
      const targetPersona = 'ash'; 

      const res = await fetch('/api/shop/use', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          itemId: selectedItem.id,
          targetPersona 
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed');
      }

      if (onUseItem) {
          // 🔥 动态拼接反馈文案 (使用字典)
          const moodText = dict.inventory.msg_success_mood;
          const favText = dict.inventory.msg_success_fav;

          const moodChange = data.moodBoost ? `${moodText} +${data.moodBoost}` : '';
          const favChange = data.favBoost ? `${favText} +${data.favBoost}` : '';
          
          let statsText = '';
          if (moodChange || favChange) {
              statsText = ` [${[moodChange, favChange].filter(Boolean).join(', ')}]`;
          }

          const resultText = `${dict.inventory.system_prefix} ${data.message}${statsText}`; 
          onUseItem(resultText);
      }
      
      setSelectedItem(null);
      onClose();

    } catch (error: any) {
      console.error("Failed to use item:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsUsing(false);
    }
  };

  const getRarityColor = (rarity: string) => {
    return RARITY_COLOR_MAP[rarity] || RARITY_COLOR_MAP['common'];
  };

  // 获取稀有度的本地化显示
  const getRarityLabel = (rarity: string) => {
    // @ts-ignore
    return dict.inventory.rarity[rarity] || dict.inventory.rarity.common;
  }

  // 获取物品名称 (优先取当前语言)
  const getItemName = (item: InventoryItem) => {
     if (lang === 'zh' || lang === 'tw') return item.name?.zh || item.name?.en;
     return item.name?.en || item.name?.zh;
  };

  // 获取物品描述
  const getItemDesc = (item: InventoryItem) => {
    if (lang === 'zh' || lang === 'tw') return item.description?.zh || item.description?.en;
    return item.description?.en || item.description?.zh;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#0f0f0f] border border-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-[#151515]">
          <div className="flex items-center gap-2 text-cyan-500">
            <Package size={20} />
            <h2 className="font-bold tracking-wider">{dict.inventory.title}</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 min-h-[300px]">
          {inventory.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-600 space-y-3 opacity-50">
                <Package size={48} strokeWidth={1} />
                <p className="font-mono text-sm">{dict.inventory.empty_state}</p>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-3">
              {stackedInventory.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className={`aspect-square relative group rounded-xl border flex items-center justify-center bg-[#1a1a1a] hover:bg-[#252525] transition-all hover:scale-105 active:scale-95 ${
                    selectedItem?.id === item.id ? 'border-cyan-500 ring-2 ring-cyan-500/20' : 'border-white/5 hover:border-white/20'
                  }`}
                >
                  <span className="text-2xl filter drop-shadow-lg">{item.image}</span>
                  {item.count && item.count > 1 && (
                    <span className="absolute top-1 right-1 bg-gray-800 border border-gray-600 text-gray-200 text-[10px] px-1.5 rounded-full font-mono shadow-md">
                        x{item.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {selectedItem ? (
           <div className="p-4 bg-[#151515] border-t border-gray-800 animate-in slide-in-from-bottom-2 duration-200">
              <div className="flex gap-4">
                  <div className={`w-16 h-16 rounded-xl border flex items-center justify-center bg-black/50 text-3xl shadow-lg ${getRarityColor(selectedItem.rarity)}`}>
                      {selectedItem.image}
                  </div>
                  <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-gray-200 truncate pr-2">
                            {getItemName(selectedItem) || dict.common.unknown}
                        </h3>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${getRarityColor(selectedItem.rarity)} bg-transparent`}>
                            {getRarityLabel(selectedItem.rarity)}
                        </span>
                      </div>
                      
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                        {getItemDesc(selectedItem) || '...'}
                      </p>
                      
                      <p className="text-[10px] text-gray-600 mt-2 font-mono">
                          {dict.inventory.owned}: {selectedItem.count || 1}
                      </p>
                  </div>
              </div>
              
              <button 
                onClick={handleConfirmUse}
                disabled={isUsing}
                className="w-full mt-4 bg-cyan-600 hover:bg-cyan-500 text-white py-3 rounded-xl font-bold tracking-wide flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
              >
                {isUsing ? (
                    <>
                        <Loader2 className="animate-spin" size={18} />
                        {dict.inventory.btn_using}
                    </>
                ) : (
                    <>
                        {dict.inventory.btn_use} <ArrowRight size={16} />
                    </>
                )}
              </button>
           </div>
        ) : (
            <div className="p-3 text-center text-xs text-gray-600 font-mono border-t border-white/5">
                {dict.inventory.select_tip}
            </div>
        )}
      </div>
    </div>
  );
}