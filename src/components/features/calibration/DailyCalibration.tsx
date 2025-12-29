'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { BrainCircuit, CheckCircle2, Info, Zap, Puzzle } from 'lucide-react';
import { useAppLanguage } from '@/hooks/useAppLanguage';

interface QuestionOption {
    id: string;
    label: string;
    value: string;
    reaction?: string;
}

interface DailyQuestionData {
    id: string;
    content: string;
    options: QuestionOption[];
}

interface DailyCalibrationProps {
    question?: DailyQuestionData | null;
    currentSyncRate?: number; 
    currentShards?: number;   
    onComplete?: (newSync: number, newShards: number) => void;
}

export function DailyCalibration({ 
    question, 
    currentSyncRate = 50, 
    currentShards = 0,
    onComplete 
}: DailyCalibrationProps) {
    const router = useRouter();
    const { t, lang } = useAppLanguage();
    
    const [status, setStatus] = useState<'pending' | 'processing' | 'completed'>('pending');
    const [resultComment, setResultComment] = useState("");
    
    // 视觉状态：直接初始化为传入的值
    const [displaySync, setDisplaySync] = useState(currentSyncRate);
    const [displayShards, setDisplayShards] = useState(currentShards);
    const [showInfo, setShowInfo] = useState(false);

    const txt = {
        zh: {
            syncTitle: "神经同步率",
            shardsTitle: "门票碎片",
            processing: "正在校准神经连接...",
            complete: "同步完成",
            tooltip: "同步率决定了连接稳定性。每日校准可提升同步率并获取碎片。",
            reward: "奖励: +10% 同步率 | +1 碎片",
            defaultReaction: "数据已同步。"
        },
        en: {
            syncTitle: "NEURAL SYNC",
            shardsTitle: "TICKET SHARDS",
            processing: "CALIBRATING LINK...",
            complete: "SYNC COMPLETE",
            tooltip: "Sync Rate determines stability. Calibrate daily to earn shards.",
            reward: "Reward: +10% Sync | +1 Shard",
            defaultReaction: "Data synced."
        }
    }[lang === 'zh' ? 'zh' : 'en'];

    // 🔥 修复点 1: 当父组件传入的数值更新时，直接同步，不要累加
    useEffect(() => {
        setDisplaySync(currentSyncRate);
        setDisplayShards(currentShards);
    }, [currentSyncRate, currentShards]);

    // 🔥 修复点 2: 这里的 useEffect 只负责检查“是否已完成”的状态和评论，不再干涉数值
    useEffect(() => {
        if (question) {
             const log = localStorage.getItem('toughlove_daily_calib_' + new Date().toDateString());
             if (log) {
                 const data = JSON.parse(log);
                 if (data.qId === question.id) {
                     setStatus('completed');
                     setResultComment(data.comment);
                     // ❌ 删除了这里的 setDisplaySync(...) 逻辑，防止双倍计算
                 }
             }
        }
    }, [question]); // 依赖项也精简了，不需要依赖数值

    const handleSelect = (opt: QuestionOption) => {
        if (!question) return;
        setStatus('processing');
        
        setTimeout(() => {
            const comment = opt.reaction || txt.defaultReaction;
            
            localStorage.setItem('toughlove_daily_calib_' + new Date().toDateString(), JSON.stringify({
                date: new Date().toDateString(),
                qId: question.id,
                answer: opt.value,
                comment: comment
            }));

            // 计算新数值
            const newSync = Math.min(100, currentSyncRate + 10);
            const newShards = Math.min(5, currentShards + 1);

            // 乐观更新 (Optimistic Update)：让用户觉得操作是实时的
            setDisplaySync(newSync);
            setDisplayShards(newShards);
            setResultComment(comment);
            setStatus('completed');
            
            if (navigator.vibrate) navigator.vibrate([30, 50, 30]);

            // 通知父组件保存真实数据
            if (onComplete) onComplete(newSync, newShards);

        }, 1200);
    };

    if (!question) return null;

    const renderShardSlots = () => {
        return (
            <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className={`w-3 h-1.5 rounded-sm transition-all duration-500 ${i < displayShards ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]' : 'bg-white/10'}`} />
                ))}
            </div>
        );
    };

    return (
        <div className="w-full relative z-20">
            {/* Header: 仪表盘 */}
            <div className="w-full bg-[#080808] border border-white/10 border-b-0 rounded-t-[1.25rem] p-4 flex items-center justify-between relative overflow-hidden group">
                
                <div className="absolute bottom-0 left-0 w-full h-2 bg-white/5" />
                
                <div 
                    className="absolute bottom-0 left-0 h-2 bg-gradient-to-r from-cyan-600 via-cyan-400 to-white shadow-[0_0_15px_rgba(34,211,238,0.8)] transition-all duration-1000 ease-out rounded-r-full" 
                    style={{ width: `${displaySync}%` }}
                />
                
                {/* 左侧：同步率 */}
                <div className="flex items-center gap-3 relative z-10 cursor-help" onClick={() => setShowInfo(!showInfo)}>
                    <div className="relative">
                        <BrainCircuit size={18} className={`text-cyan-400 ${status === 'processing' ? 'animate-pulse' : ''}`} />
                        <div className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border border-[#080808] ${displaySync >= 80 ? 'bg-green-500' : displaySync >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} />
                    </div>
                    <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] text-gray-400 font-mono tracking-wider uppercase">{txt.syncTitle}</span>
                        <span className="text-base font-black text-white tabular-nums tracking-tight leading-none">{displaySync}%</span>
                    </div>
                </div>

                {/* 右侧：碎片收集 */}
                <div className="flex flex-col items-end gap-1.5 relative z-10">
                    <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-gray-400 font-mono uppercase tracking-wider">{txt.shardsTitle}</span>
                        <Puzzle size={12} className="text-cyan-500/80" />
                    </div>
                    {renderShardSlots()}
                </div>

                {/* Tooltip */}
                <AnimatePresence>
                    {showInfo && (
                        <motion.div 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute top-16 left-2 right-2 bg-zinc-900/95 border border-cyan-500/30 p-3 rounded-xl z-30 shadow-2xl backdrop-blur-md"
                        >
                            <div className="flex gap-2 items-start">
                                <Info size={14} className="text-cyan-500 shrink-0 mt-0.5" />
                                <div className="space-y-2">
                                    <p className="text-[11px] text-gray-300 leading-relaxed">{txt.tooltip}</p>
                                    <div className="text-[10px] text-cyan-400 font-bold border-t border-white/5 pt-2">
                                        {txt.reward}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <AnimatePresence mode='wait'>
                {/* 状态 A: 待答题 */}
                {status === 'pending' && (
                    <motion.div
                        key="question"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="w-full bg-[#080808] border border-white/10 border-t-0 rounded-b-[1.25rem] p-4 pt-1 flex flex-col gap-3 shadow-lg shadow-black/50"
                    >
                        <p className="text-xs font-bold text-gray-200 leading-snug px-1">
                            {question.content}
                        </p>

                        <div className="grid grid-cols-3 gap-2">
                            {question.options.map((opt) => (
                                <button
                                    key={opt.id}
                                    onClick={() => handleSelect(opt)}
                                    className="relative w-full py-3 px-1 rounded-lg bg-white/5 hover:bg-cyan-500/10 border border-white/5 hover:border-cyan-500/30 transition-all flex flex-col items-center justify-center gap-1 group active:scale-95"
                                >
                                    <span className="text-[11px] text-gray-400 group-hover:text-cyan-100 transition-colors text-center leading-tight">
                                        {opt.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* 状态 B: 处理中 */}
                {status === 'processing' && (
                     <motion.div key="proc" className="w-full h-28 bg-[#080808] border border-white/10 border-t-0 rounded-b-[1.25rem] flex flex-col items-center justify-center gap-3">
                        <Zap size={20} className="text-cyan-400 animate-bounce" />
                        <span className="text-[10px] text-cyan-500/80 animate-pulse font-mono tracking-widest">{txt.processing}</span>
                     </motion.div>
                )}

                {/* 状态 C: 已完成 */}
                {status === 'completed' && (
                    <motion.div
                        key="result"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="w-full bg-[#080808] border-x border-b border-l-2 border-l-cyan-500 border-white/10 rounded-b-[1.25rem] p-4 flex items-center gap-3"
                    >
                        <div className="w-10 h-10 rounded-full border border-cyan-500/30 p-0.5 shrink-0">
                            <img src="/avatars/ash_hero.jpg" className="w-full h-full rounded-full grayscale" alt="Ash" />
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col">
                             <div className="flex items-center gap-2">
                                <span className="text-[11px] font-black text-cyan-500 uppercase tracking-wider">{txt.complete}</span>
                                <span className="text-[10px] bg-cyan-950 text-cyan-400 px-1.5 py-0.5 rounded font-mono font-bold">+10%</span>
                             </div>
                             <p className="text-[11px] text-gray-400 line-clamp-1 italic mt-1">"{resultComment}"</p>
                        </div>
                        <CheckCircle2 size={16} className="text-cyan-500/50" />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}