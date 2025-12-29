'use client';

import { useState } from 'react';
import { 
  Bot, RefreshCcw, Save, Sparkles, Box, Shuffle, Layers, Smartphone, 
  FileText, AlertTriangle, MapPin
} from 'lucide-react';
import { LOOT_ICON_MAP, generateRandomTopic, mockAiGenerate, BACKGROUND_POOL } from '@/data/ghostwriter';

// ----------------------------------------------------------------------
// 组件：手机仿真预览框
// ----------------------------------------------------------------------
const PhonePreview = ({ children }: { children: React.ReactNode }) => (
  <div className="relative mx-auto border-gray-800 bg-gray-800 border-[14px] rounded-[2.5rem] h-[600px] w-[300px] shadow-xl transition-all duration-500">
    <div className="w-[148px] h-[18px] bg-gray-800 top-0 rounded-b-[1rem] left-1/2 -translate-x-1/2 absolute z-20"></div>
    <div className="h-[46px] w-[3px] bg-gray-800 absolute -start-[17px] top-[124px] rounded-s-lg"></div>
    <div className="h-[46px] w-[3px] bg-gray-800 absolute -start-[17px] top-[178px] rounded-s-lg"></div>
    <div className="h-[64px] w-[3px] bg-gray-800 absolute -end-[17px] top-[142px] rounded-e-lg"></div>
    <div className="rounded-[2rem] overflow-hidden w-full h-full bg-[#050505] relative text-white flex flex-col">
        {children}
    </div>
  </div>
);

// ----------------------------------------------------------------------
// 组件：Hero Feed 预览
// ----------------------------------------------------------------------
const FeedPreview = ({ data }: { data: any }) => {
    if (!data) return <div className="flex-1 flex items-center justify-center text-gray-500 text-xs">Loading Feed...</div>;
    
    const LootIcon = data.loot ? (LOOT_ICON_MAP[data.loot.icon] || Box) : Box;
    
    return (
        <div className="w-full h-full relative flex flex-col animate-in fade-in duration-500">
            <div className="absolute inset-0">
                <img src={data.bgImage} className="w-full h-full object-cover opacity-80" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
            </div>
            
            <div className="mt-auto p-4 relative z-10 flex flex-col items-end text-right">
                <div className="text-[10px] bg-emerald-500 text-black px-2 py-0.5 rounded font-bold mb-2 shadow-lg">HERO FEED</div>
                <h2 className="text-xl font-bold leading-tight mb-2 drop-shadow-md">{data.title}</h2>
                <div className="bg-black/40 backdrop-blur-sm p-3 rounded-xl border border-white/5 w-full">
                    <p className="text-xs text-gray-200 line-clamp-4 text-left whitespace-pre-line">{data.content}</p>
                </div>
            </div>

            {data.loot && (
                <div className="absolute top-12 left-4 right-4 bg-[#1a1a1a]/95 backdrop-blur-xl border border-white/10 p-3 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-4 shadow-2xl">
                    <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center border border-white/10 shrink-0">
                        <LootIcon size={20} className="text-purple-400" />
                    </div>
                    <div className="min-w-0">
                        <div className="text-[10px] text-gray-500 uppercase tracking-wider">Loot Drop ({data.loot.rarity})</div>
                        <div className="text-xs font-bold text-white truncate">{data.loot.name}</div>
                    </div>
                </div>
            )}
        </div>
    )
}

// ----------------------------------------------------------------------
// 组件：Script 预览 (修复了可能为空的问题)
// ----------------------------------------------------------------------
const ScriptPreview = ({ data }: { data: any }) => {
    if (!data || !data.scenes) return <div className="flex-1 flex items-center justify-center text-gray-500 text-xs">Generating Script...</div>;

    const startScene = data.scenes[0];

    return (
        <div className="w-full h-full relative bg-[#050505] flex flex-col animate-in fade-in duration-500">
            {/* 封面区 */}
            <div className="h-[240px] relative shrink-0">
                <img src={data.coverImage} className="w-full h-full object-cover opacity-70" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#050505]/50 to-[#050505]" />
                <div className="absolute bottom-4 left-4 right-4">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] text-emerald-500 font-bold tracking-widest bg-emerald-950/30 px-2 py-0.5 rounded border border-emerald-500/20">NEW MISSION</span>
                        <span className="text-[9px] text-red-400 font-bold">{data.difficulty}</span>
                    </div>
                    <h2 className="text-lg font-bold text-white leading-tight shadow-black drop-shadow-md">{data.title}</h2>
                </div>
            </div>

            {/* 内容区 */}
            <div className="p-5 space-y-5 overflow-y-auto no-scrollbar">
                {/* 简介 */}
                <div className="text-xs text-gray-400 leading-relaxed border-l-2 border-purple-500/50 pl-3 italic">
                    {data.intro}
                </div>

                {/* 场景卡片 */}
                <div className="bg-[#111] p-4 rounded-xl border border-white/10 space-y-3">
                    <div className="flex items-center gap-2 text-gray-500 border-b border-white/5 pb-2">
                        <MapPin size={12} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Start: {startScene.name}</span>
                    </div>
                    <div className="text-xs text-gray-300 leading-relaxed">
                        {startScene.description}
                    </div>
                </div>

                {/* 行动按钮预览 */}
                <div className="space-y-2 pt-2">
                    {startScene.actions.map((act: any, i: number) => (
                        <div key={i} className="w-full py-3 px-4 bg-emerald-900/10 border border-emerald-500/20 rounded-lg text-left text-xs text-emerald-400 font-bold flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/50" />
                            {act.label.zh}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

// ----------------------------------------------------------------------
// 主页面
// ----------------------------------------------------------------------
export default function GhostwriterPage() {
  const [activeTab, setActiveTab] = useState<'feed' | 'script'>('feed');
  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedData, setGeneratedData] = useState<any>(null);

  // 1. 摇一摇话题
  const rollTopic = () => {
    const newTopic = generateRandomTopic();
    setTopic(newTopic);
  };

  // 2. 生成内容
  const handleGenerate = async () => {
    setIsGenerating(true);
    const topicToUse = topic.trim() || generateRandomTopic();
    if (!topic) setTopic(topicToUse); 

    try {
        const data = await mockAiGenerate(activeTab, topicToUse);
        setGeneratedData(data);
    } catch (e) {
        console.error("生成失败", e);
        alert("AI 模型响应超时，请重试");
    } finally {
        setIsGenerating(false);
    }
  };

  // 3. 换图 (独立功能)
  const rerollImage = () => {
      if (!generatedData) return;
      const newBg = BACKGROUND_POOL[Math.floor(Math.random() * BACKGROUND_POOL.length)];
      if (activeTab === 'feed') {
          setGeneratedData({ ...generatedData, bgImage: newBg });
      } else {
          setGeneratedData({ ...generatedData, coverImage: newBg });
      }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-gray-200 font-sans selection:bg-emerald-500/30 flex">
      
      {/* 左侧：控制台 */}
      <div className="w-full lg:w-[450px] p-6 border-r border-white/10 flex flex-col h-screen overflow-y-auto bg-[#0c0c0e]">
        <header className="mb-8">
            <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-center">
                    <Bot className="text-emerald-500" size={24} />
                </div>
                <div>
                    <h1 className="text-xl font-black text-white tracking-wider">GHOSTWRITER</h1>
                    <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isGenerating ? 'bg-yellow-500' : 'bg-green-500'}`}/>
                        <span className="text-[10px] text-gray-500 font-mono">
                            {isGenerating ? 'PROCESSING...' : 'SYSTEM READY'}
                        </span>
                    </div>
                </div>
            </div>
        </header>

        {/* Tab 切换 */}
        <div className="flex bg-[#18181b] p-1 rounded-xl mb-8 border border-white/5">
            <button 
                onClick={() => { setActiveTab('feed'); setGeneratedData(null); }}
                className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'feed' ? 'bg-[#27272a] text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
            >
                <Smartphone size={14} /> HERO FEED
            </button>
            <button 
                onClick={() => { setActiveTab('script'); setGeneratedData(null); }}
                className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'script' ? 'bg-[#27272a] text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
            >
                <Layers size={14} /> SCRIPT KILL
            </button>
        </div>

        {/* 输入区 */}
        <div className="space-y-4 mb-8">
            <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Topic Context</label>
                <button onClick={rollTopic} className="text-[10px] text-emerald-400 flex items-center gap-1 hover:text-emerald-300 transition-colors">
                    <Shuffle size={10} /> GENERATE NEW
                </button>
            </div>
            <textarea 
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="输入关键词，或点击上方随机生成..."
                className="w-full h-24 bg-[#18181b] border border-white/10 rounded-xl p-4 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 resize-none transition-colors"
            />
        </div>

        {/* 生成按钮 */}
        <div className="mb-8">
            <button 
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] shadow-lg shadow-emerald-900/20"
            >
                {isGenerating ? <RefreshCcw size={18} className="animate-spin" /> : <Sparkles size={18} />}
                {isGenerating ? 'AI WRITING...' : 'GENERATE FULL CONTENT'}
            </button>
        </div>

        {/* 🔥 修复点：结果分析区 (根据 Tab 动态显示) */}
        {generatedData && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 border-t border-white/10 pt-6">
                <div className="flex items-center justify-between">
                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Analysis & Tweak</div>
                    <button onClick={rerollImage} className="text-[10px] text-gray-400 flex items-center gap-1 hover:text-white transition-colors" title="Change Image">
                        <RefreshCcw size={10} /> REROLL IMAGE
                    </button>
                </div>
                
                {/* 通用：图片预览 */}
                <div className="flex items-center gap-4 bg-[#18181b] p-3 rounded-xl border border-white/5">
                    <div className="w-12 h-12 rounded-lg bg-black overflow-hidden relative shrink-0">
                        <img src={activeTab === 'feed' ? generatedData.bgImage : generatedData.coverImage} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-white mb-1">Visual Asset</div>
                        <div className="text-[10px] text-gray-500 truncate">{activeTab === 'feed' ? generatedData.bgImage : generatedData.coverImage}</div>
                    </div>
                </div>

                {/* 模式特有数据：Feed Loot */}
                {activeTab === 'feed' && generatedData.loot && (
                    <div className="flex items-center gap-4 bg-[#18181b] p-3 rounded-xl border border-white/5">
                        <div className="w-12 h-12 rounded-lg bg-black flex items-center justify-center border border-white/10 shrink-0">
                            {(() => {
                                const Icon = LOOT_ICON_MAP[generatedData.loot.icon] || Box;
                                return <Icon size={24} className="text-purple-400" />;
                            })()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold text-white mb-1">{generatedData.loot.name}</div>
                            <div className="text-[10px] text-gray-500 flex gap-2">
                                <span>TYPE: {generatedData.loot.icon.toUpperCase()}</span>
                                <span className="text-yellow-500">{generatedData.loot.rarity.toUpperCase()}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* 🔥 模式特有数据：Script Details (修复这里为空的问题) */}
                {activeTab === 'script' && (
                    <div className="flex flex-col gap-3 bg-[#18181b] p-4 rounded-xl border border-white/5">
                        <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-1">
                            <span className="text-[10px] text-gray-500 uppercase">Difficulty</span>
                            <span className={`text-xs font-bold ${generatedData.difficulty === 'Nightmare' ? 'text-red-500' : 'text-emerald-400'}`}>
                                {generatedData.difficulty.toUpperCase()}
                            </span>
                        </div>
                        <div className="space-y-1">
                            <span className="text-[10px] text-gray-500 uppercase">Scene Intro</span>
                            <p className="text-xs text-gray-300 line-clamp-2 italic">{generatedData.intro}</p>
                        </div>
                    </div>
                )}

                <button className="w-full py-3 border border-emerald-500/30 text-emerald-400 font-bold rounded-xl hover:bg-emerald-900/10 transition-colors flex items-center justify-center gap-2 mt-2">
                    <Save size={16} /> PUBLISH TO DATABASE
                </button>
            </div>
        )}
      </div>

      {/* 右侧：实时预览 */}
      <div className="flex-1 bg-[#050505] flex items-center justify-center relative overflow-hidden">
         <div className="absolute inset-0 opacity-20" 
             style={{ backgroundImage: 'linear-gradient(#222 1px, transparent 1px), linear-gradient(90deg, #222 1px, transparent 1px)', backgroundSize: '40px 40px' }} 
         />
         
         <div className="relative z-10 scale-90 lg:scale-100 transition-all">
            {!generatedData ? (
                <div className="text-center opacity-30 space-y-4">
                    <div className="w-24 h-24 border-2 border-dashed border-white/20 rounded-2xl mx-auto flex items-center justify-center animate-pulse">
                        <Smartphone size={32} />
                    </div>
                    <p className="text-sm font-mono uppercase tracking-widest">Waiting for Data stream...</p>
                </div>
            ) : (
                <PhonePreview>
                    {activeTab === 'feed' ? <FeedPreview data={generatedData} /> : <ScriptPreview data={generatedData} />}
                </PhonePreview>
            )}
         </div>
      </div>

    </div>
  );
}