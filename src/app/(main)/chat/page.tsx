'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, MessageSquare } from 'lucide-react';
import { PERSONAS_LIST } from '@/config/personas'; // 🔥 从真实配置导入
import { getDict, Dictionary, baseEn } from '@/lib/i18n/dictionaries';
import { LangType } from '@/types';

export default function ChatListPage() {
  const [dict, setDict] = useState<Dictionary>(baseEn);

  useEffect(() => {
    const savedLang = (localStorage.getItem('toughlove_lang') as LangType) || 'zh';
    setDict(getDict(savedLang));
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-gray-200 font-sans pb-20">
      {/* Header */}
      <header className="px-6 py-6 border-b border-white/5 bg-[#0a0a0a]">
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
           <MessageSquare className="text-cyan-500" />
           {dict.terminal.id_linked}
        </h1>
        <p className="text-xs text-gray-500 mt-1 font-mono">
          {PERSONAS_LIST.length} ACTIVE SIGNALS DETECTED
        </p>
      </header>

      {/* List */}
      <div className="p-4 space-y-3">
        {PERSONAS_LIST.map((persona) => {
          // 动态获取字典里的文案
          // @ts-ignore - 忽略类型检查，确保 dict.personas[id] 存在
          const meta = dict.personas[persona.id] || { role: 'Unknown', desc: '...' };
          
          return (
            <Link 
              key={persona.id} 
              href={`/chat/${persona.id}`} // 🔥 路由 ID 正确绑定
              className="block group"
            >
              <div className="relative overflow-hidden bg-[#121212] border border-white/5 rounded-2xl p-4 transition-all duration-300 hover:border-cyan-500/30 hover:bg-[#181818] active:scale-[0.98]">
                
                <div className="flex items-center gap-4">
                  {/* Avatar (此处使用简单字符或 Image 组件，根据你 config 里的 avatar 字段) */}
                  {/* 如果 avatar 是路径(string)，建议用 <img />，这里做个简单兼容 */}
                  <div className={`w-14 h-14 rounded-full overflow-hidden border border-white/10 flex items-center justify-center bg-gray-900 group-hover:shadow-[0_0_15px_-5px_rgba(34,211,238,0.3)] transition-all`}>
                      {persona.avatar.startsWith('/') ? (
                          <img src={persona.avatar} alt={persona.name} className="w-full h-full object-cover" />
                      ) : (
                          <span className="text-2xl">{persona.avatar}</span>
                      )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h3 className={`font-bold text-lg ${persona.color} group-hover:brightness-125 transition-colors`}>
                        {persona.name}
                      </h3>
                      <span className="text-[10px] font-mono text-green-500 bg-green-900/20 px-1.5 py-0.5 rounded border border-green-500/20">
                        {dict.status.online}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 truncate font-mono opacity-70 group-hover:opacity-100">
                      {meta.role} 
                    </p>
                    <p className="text-sm text-gray-400 mt-1 line-clamp-1">
                      {meta.desc}
                    </p>
                  </div>

                  {/* Arrow */}
                  <div className="text-gray-600 group-hover:text-cyan-500 group-hover:translate-x-1 transition-all">
                    <ArrowRight size={20} />
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}