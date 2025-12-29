'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { TAROT_DECK } from '@/lib/constants';

export default function SeedPage() {
  const [status, setStatus] = useState('等待操作...');
  const supabase = createClient();

  const handleSeed = async () => {
    setStatus('正在导入数据...');
    
    try {
      // 1. 映射数据 (直接存入 jsonb 字段)
      const formattedData = TAROT_DECK.map(card => ({
        id: card.id, 
        name_zh: card.name.zh,
        name_en: card.name.en, 
        image_url: card.image, 
        meaning: card.meaning,      // {zh, en}
        reactions: card.reactions,  // {Ash: {zh, en}, ...}
        keywords: card.keywords     // {zh:[], en:[]}
      }));

      // 2. 批量插入
      const { error } = await supabase
        .from('tarot_cards')
        .upsert(formattedData, { onConflict: 'id' });

      if (error) throw error;

      setStatus(`✅ 成功导入 ${formattedData.length} 张全语言塔罗牌！`);
    } catch (error: any) {
      console.error('导入失败:', error);
      setStatus(`❌ 错误: ${error.message}`);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-blue-500 font-mono p-4">
      <h1 className="text-xl mb-4 font-bold">DB SEEDER V2</h1>
      <button 
        onClick={handleSeed}
        className="px-6 py-3 bg-blue-700 hover:bg-blue-600 text-white font-bold rounded"
      >
        START MIGRATION
      </button>
      <p className="mt-4 text-white">{status}</p>
    </div>
  );
}