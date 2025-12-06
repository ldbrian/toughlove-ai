import React from 'react';
import { Package, X } from 'lucide-react';
import { LOOT_TABLE, LangType } from '@/lib/constants';

interface InventoryModalProps {
  show: boolean;
  onClose: () => void;
  inventoryItems: string[];
  lang: LangType;
}

export const InventoryModal: React.FC<InventoryModalProps> = ({ show, onClose, inventoryItems, lang }) => {
  if (!show) return null;

  const userItems = inventoryItems || [];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-[fadeIn_0.2s_ease-out]">
      <div className="w-full max-w-sm bg-[#121218]/95 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[70vh] ring-1 ring-white/5">
        
        {/* Header */}
        <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/5">
          <h2 className="text-sm font-bold tracking-widest uppercase flex items-center gap-2 text-gray-200">
            <Package size={16} className="text-[#7F5CFF]" /> 
            {lang === 'zh' ? '背包' : 'INVENTORY'}
          </h2>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded-full transition-colors active:scale-95"
          >
            <X size={18} className="text-gray-400 hover:text-white" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 min-h-[200px]">
          {userItems.length === 0 ? (
            /* Empty State */
            <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-3 py-8">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center border border-white/5">
                <Package size={32} className="opacity-20" />
              </div>
              <div className="text-center">
                <p className="text-xs font-medium text-gray-400">{lang === 'zh' ? '这里空空如也' : 'Nothing here yet'}</p>
                <p className="text-[10px] opacity-40 mt-1">{lang === 'zh' ? '去和他们聊聊，也许会有惊喜' : 'Go talk to them, find some secrets'}</p>
              </div>
            </div>
          ) : (
            /* Item Grid */
            <div className="grid grid-cols-4 gap-3">
              {userItems.map((itemId) => {
                const item = LOOT_TABLE[itemId];
                // 如果存了非法ID，直接跳过
                if (!item) return null;
                
                return (
                  <div 
                    key={itemId} 
                    className="aspect-square bg-white/5 border border-white/10 rounded-xl flex flex-col items-center justify-center relative group hover:bg-white/10 transition-colors cursor-pointer overflow-hidden"
                    title={lang === 'zh' ? item.name.zh : item.name.en}
                  >
                    {/* Item Icon */}
                    <img 
                      src={item.iconSvg} 
                      alt={item.name.en} 
                      className="w-8 h-8 drop-shadow-[0_0_5px_rgba(255,255,255,0.3)] group-hover:scale-110 transition-transform duration-300" 
                    />
                    
                    {/* Optional: Hover Name Tip (Desktop only) */}
                    <div className="absolute inset-0 bg-black/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-[8px] text-center px-1 font-bold text-gray-300 leading-tight">
                        {lang === 'zh' ? item.name.zh : item.name.en}
                      </span>
                    </div>
                  </div>
                );
              })}
              
              {/* Fillers: 保持网格至少看起来是满的/整齐的 */}
              {Array(Math.max(0, 8 - userItems.length)).fill(0).map((_, i) => (
                <div 
                  key={`empty-${i}`} 
                  className="aspect-square bg-black/20 border border-white/5 rounded-xl flex items-center justify-center opacity-30"
                >
                  <div className="w-2 h-2 rounded-full bg-white/10" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Info (Optional) */}
        <div className="p-3 bg-black/40 border-t border-white/5 text-center">
          <span className="text-[9px] text-gray-600 font-mono">
            {userItems.length} / {Object.keys(LOOT_TABLE).length} COLLECTED
          </span>
        </div>
      </div>
    </div>
  );
};