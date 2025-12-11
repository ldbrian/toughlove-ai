'use client';

import { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, Database } from 'lucide-react';
import MirrorClient from './MirrorClient'; 
import { LangType } from '@/types';
import { getDict } from '@/lib/i18n/dictionaries';
import { getDeviceId } from '@/lib/utils';

// ⚠️ 注意：这里不再需要引入 supabase 客户端了
// import { createClient } from '@/utils/supabase/client';

export default function MirrorPage() {
  const [shards, setShards] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lang, setLang] = useState<LangType>('zh');

  useEffect(() => {
    const saved = localStorage.getItem('toughlove_lang_preference');
    if (saved) setLang(saved as LangType);

    fetchShardsFromAPI();
  }, []);

  const t = getDict(lang);
  
  const UI = {
      system: lang === 'zh' ? '记忆结晶系统' : 'Memory Crystallization System',
      syncing: lang === 'zh' ? '同步中...' : 'SYNCING...',
      fragments: lang === 'zh' ? '记忆碎片' : 'FRAGMENTS',
      emptyTitle: lang === 'zh' ? '未发现记忆数据' : 'NO MEMORY DATA FOUND',
      emptyDesc: lang === 'zh' ? '去和他们聊聊，创造属于你们的回忆。' : 'Go chat with them to create memories.'
  };

  // 🔥 核心修改：改为调用我们自己的 API
  const fetchShardsFromAPI = async () => {
    try {
        setIsLoading(true);
        const userId = getDeviceId();

        // 👉 调用 /api/shards
        const res = await fetch(`/api/shards?userId=${userId}`);
        const { data } = await res.json();

        if (data && Array.isArray(data)) {
            const formattedShards = data.map((item: any) => ({
                id: item.id,
                content: item.content,
                emotion: item.emotion || 'neutral',
                weight: item.weight || 50,
                // 格式化日期
                dateStr: new Date(item.created_at).toISOString().slice(5, 10).replace('-', '.') 
            }));
            setShards(formattedShards);
        }
    } catch (e) {
        console.error('Fetch error:', e);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-slate-200 relative overflow-hidden font-sans">
      
      {/* 背景光晕 */}
      <div className="fixed top-0 left-0 w-full h-96 bg-fuchsia-900/10 blur-[100px] pointer-events-none" />

      <div className="p-6 pt-16 relative z-10">
        <header className="mb-10 flex justify-between items-end border-b border-white/10 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
                <Sparkles size={16} className="text-fuchsia-500 animate-pulse" />
                <h1 className="text-3xl font-black italic tracking-tighter text-white" style={{textShadow: '0 0 20px rgba(217,70,239,0.3)'}}>
                {t.nav.mirror} 
                </h1>
            </div>
            <p className="text-[10px] text-fuchsia-300/50 font-mono tracking-widest pl-1 uppercase">
              {UI.system}
            </p>
          </div>
          
          <div className="text-right">
             {isLoading ? (
                 <div className="flex items-center gap-2 text-xs text-gray-500 animate-pulse">
                     <RefreshCw size={12} className="animate-spin" /> {UI.syncing}
                 </div>
             ) : (
                 <>
                    <div className="text-2xl font-bold font-mono text-fuchsia-500">{shards.length}</div>
                    <div className="text-[10px] text-gray-500 tracking-widest">{UI.fragments}</div>
                 </>
             )}
          </div>
        </header>

        {/* 渲染客户端组件 */}
        <MirrorClient shards={shards} />
        
        {/* 空状态下的提示 */}
        {!isLoading && shards.length === 0 && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center opacity-50">
                <Database size={48} className="mx-auto mb-4 text-gray-700" />
                <p className="text-xs text-gray-500 tracking-widest">{UI.emptyTitle}</p>
                <p className="text-[10px] text-gray-600 mt-2">{UI.emptyDesc}</p>
            </div>
        )}
      </div>
    </div>
  );
}