'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
// 👇 这里的路径要改成你实际存放常量的路径

import { TAROT_DECK } from '@/lib/constants';

export default function SeedPage() {
  const [status, setStatus] = useState('等待操作...');
  const supabase = createClient();

  const handleSeed = async () => {
    setStatus('开始导入...');
    
    // 1. 检查数据格式 (可选，打印第一条看看)
    console.log('正在导入第一条数据示例:', TAROT_DECK[0]);

    try {
      // 2. 批量插入数据
      // map 是为了确保字段名和数据库列名完全对应
      const formattedData = TAROT_DECK.map(card => ({
        // 如果你的数据库 id 是自增的，去掉下面这行 id；如果是指定的，保留它
        id: card.id, 
        name_zh: card.name.zh,
        name_en: card.name.zh, // 处理可能的命名差异
        image_url: card.image, // 处理驼峰转下划线
        meaning: card.meaning,
        reactions: card.reactions,
        keywords: card.keywords
      }));


      



      const { data, error } = await supabase
        .from('tarot_cards')
        .upsert(formattedData, { onConflict: 'id' }); // 如果 id 冲突则更新

      if (error) throw error;

      setStatus(`✅ 成功导入 ${formattedData.length} 条数据！`);
    } catch (error: any) {
      console.error('导入失败:', error);
      setStatus(`❌ 错误: ${error.message}`);
    }
  };

  return (
    <div className="p-10 flex flex-col items-center justify-center min-h-screen bg-black text-green-500 font-mono">
      <h1 className="text-2xl mb-4">数据库播种工具 (Database Seeder)</h1>
      <div className="border border-green-800 p-4 rounded mb-4 w-full max-w-md bg-gray-900">
        <p>当前状态: {status}</p>
        <p className="text-sm text-gray-400 mt-2">源数据条数: {TAROT_DECK.length}</p>
      </div>
      
      <button 
        onClick={handleSeed}
        className="px-6 py-3 bg-green-700 hover:bg-green-600 text-white rounded font-bold transition-all"
      >
        🚀 开始导入塔罗牌数据
      </button>

      <p className="mt-8 text-red-500 text-xs">
        警告：操作完成后请删除此页面及相关路由权限。
      </p>
    </div>
  );
}