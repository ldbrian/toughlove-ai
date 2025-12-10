// src/components/MigrateTool.tsx
'use client';
import { createClient } from '@/utils/supabase/client';
import { TAROT_DECK, DAILY_EVENTS } from '@/lib/constants';

export default function MigrateTool() {
  const supabase = createClient();

  const handleMigrate = async () => {
    // 1. 迁移塔罗牌 (自动把 string 转成 {zh, en} 结构，先把英文填成待翻译)
    const newTarot = TAROT_DECK.map(c => ({
      ...c,
      name: typeof c.name === 'string' ? { zh: c.name, en: c.name } : c.name,
      meaning: typeof c.meaning === 'string' ? { zh: c.meaning, en: "Coming soon..." } : c.meaning,
      reactions: Object.fromEntries(
        Object.entries(c.reactions).map(([k, v]) => [
          k, typeof v === 'string' ? { zh: v, en: "..." } : v
        ])
      )
    }));

    // 2. 迁移新闻
    const newEvents = Object.fromEntries(
        Object.entries(DAILY_EVENTS).map(([k, v]) => [
            k, { ...v, newsContent: typeof v.newsContent === 'string' ? { zh: v.newsContent, en: "..." } : v.newsContent }
        ])
    );

    await supabase.from('app_content').upsert({ key: 'tarot_deck', data: newTarot });
    await supabase.from('app_content').upsert({ key: 'daily_events', data: newEvents });
    
    alert('数据迁移完成！去 Supabase 看看 app_content 表吧！');
  };

  return <button onClick={handleMigrate} className="fixed top-0 left-0 z-50 bg-red-600 p-4 text-white">点击迁移数据</button>;
}