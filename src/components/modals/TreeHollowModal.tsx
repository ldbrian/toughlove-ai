
import { useState, useEffect, useRef } from 'react';
import { X, Send, Wind, Moon, Loader2, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { LangType } from '@/types';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

interface TreeHollowModalProps {
    show: boolean;
    onClose: () => void;
    partnerId: string; 
    userId: string;
    lang: LangType;
}

export const TreeHollowModal = ({ show, onClose, partnerId, userId, lang }: TreeHollowModalProps) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [step, setStep] = useState<'INTRO' | 'LISTENING' | 'SUMMARY'>('INTRO');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // 文案配置
    const TEXT = {
        zh: {
            title: '树洞',
            intro: '这里是世界尽头。没有评判，没有建议。\n把那些压得你喘不过气的东西，都丢进这里吧。\n我在听。',
            placeholder: '说点什么...',
            endBtn: '我感觉好点了',
            closeBtn: '离开',
            summaryTitle: '来自 Echo 的回响',
            listening: 'Echo 正在倾听...',
            thinking: 'Echo 正在整理你的思绪...'
        },
        en: {
            title: 'The Hollow',
            intro: 'This is the edge of the world. No judgment, no advice.\nLeave everything that weighs you down here.\nI am listening.',
            placeholder: 'Whisper something...',
            endBtn: 'I feel lighter',
            closeBtn: 'Leave',
            summaryTitle: 'Echo\'s Resonance',
            listening: 'Echo is listening...',
            thinking: 'Echo is reflecting...'
        }
    };
    
    const t = (lang === 'zh' || lang === 'tw') ? TEXT.zh : TEXT.en;

    // 1. 初始化
    useEffect(() => {
        if (show) {
            setStep('INTRO');
            setMessages([]);
            // 3秒后自动进入倾听模式
            setTimeout(() => {
                setStep('LISTENING');
                // 自动聚焦
                setTimeout(() => inputRef.current?.focus(), 100);
            }, 3500);
        }
    }, [show]);

    // 2. 自动滚动
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, step, isLoading]);

    // 3. 发送消息 (Mode: tree_hollow)
    // 🔥 优化：允许连续发送，不再 block 输入
    const handleSend = async () => {
        if (!input.trim()) return;
        const userText = input;
        setInput('');
        
        // 立即上屏
        setMessages(prev => [...prev, { role: 'user', content: userText }]);
        setIsLoading(true);

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    partnerId,
                    message: userText,
                    history: messages.slice(-6), // 只需要最近的上下文
                    mode: 'tree_hollow'
                })
            });
            const data = await res.json();
            
            // 模拟一点延迟，像是在呼吸，不要秒回，会显得很假
            setTimeout(() => {
                setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
                // 注意：这里我们不急着设为 false，如果用户打字很快，isLoading 可能由下一次请求维持
                // 简单的处理是让它自然结束，因为我们不再 disabled input，所以这个 loading 只是视觉提示
                setIsLoading(false);
            }, 800);

        } catch (e) {
            console.error(e);
            setIsLoading(false);
        }
    };

    // 4. 结束并生成总结 (Mode: summary)
    const handleEndSession = async () => {
        setStep('SUMMARY');
        setIsLoading(true);
        
        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    partnerId,
                    message: '', 
                    history: messages, 
                    mode: 'summary'
                })
            });
            const data = await res.json();
            setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    if (!show) return null;

    return (
        <div className="fixed inset-0 z-[200] bg-black text-gray-200 font-sans flex flex-col animate-in fade-in duration-700">
            
            {/* 背景氛围 */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900 via-black to-black opacity-80 pointer-events-none" />
            
            {/* 顶部栏 */}
            <div className="relative z-10 flex justify-between items-center p-6">
                <div className="flex items-center gap-2 text-slate-500">
                    <Moon size={16} />
                    <span className="text-xs font-bold tracking-[0.2em] uppercase">{t.title}</span>
                </div>
                <button onClick={onClose} className="p-2 text-gray-600 hover:text-white transition-colors">
                    <X size={20} />
                </button>
            </div>

            {/* 内容区 */}
            <div className="flex-1 relative z-10 flex flex-col justify-center items-center px-6 overflow-hidden">
                
                {/* 阶段 1: 开场白 */}
                {step === 'INTRO' && (
                    <div className="text-center space-y-6 animate-in zoom-in-95 duration-1000">
                        <Wind className="w-12 h-12 text-slate-700 mx-auto animate-pulse" />
                        <h2 className="text-xl font-light text-slate-300 whitespace-pre-line leading-relaxed">
                            {t.intro}
                        </h2>
                    </div>
                )}

                {/* 阶段 2 & 3: 对话流 */}
                {(step === 'LISTENING' || step === 'SUMMARY') && (
                    <div className="w-full max-w-md h-full flex flex-col">
                        <div className="flex-1 overflow-y-auto no-scrollbar space-y-6 py-4">
                            {messages.map((m, i) => (
                                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-center'} animate-in slide-in-from-bottom-2 fade-in`}>
                                    <div className={`max-w-[85%] px-4 py-2 rounded-2xl text-sm leading-relaxed ${
                                        m.role === 'user' 
                                            ? 'bg-white/5 text-gray-300 border border-white/5' 
                                            : 'text-slate-400 italic text-center'
                                    }`}>
                                        <ReactMarkdown>{m.content}</ReactMarkdown>
                                    </div>
                                </div>
                            ))}
                            
                            {/* 🔥 状态指示器 (Thinking Indicator) */}
                            {isLoading && (
                                <div className="flex justify-center animate-in fade-in duration-500">
                                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5 text-[10px] text-slate-500">
                                        <Loader2 size={10} className="animate-spin" />
                                        <span>{step === 'SUMMARY' ? t.thinking : t.listening}</span>
                                    </div>
                                </div>
                            )}
                            
                            <div ref={messagesEndRef} />
                        </div>

                        {/* 输入区 (仅 Listening 阶段显示) */}
                        {step === 'LISTENING' && (
                            <div className="mt-4 mb-8">
                                <div className="relative flex items-center gap-2 bg-white/5 rounded-full p-2 border border-white/10 focus-within:bg-white/10 transition-colors">
                                    <input 
                                        ref={inputRef} // 🔥 绑定 Ref
                                        value={input}
                                        onChange={e => setInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleSend()}
                                        placeholder={t.placeholder}
                                        autoFocus // 🔥 自动聚焦
                                        // disabled={isLoading}  <-- 🔥 移除：允许连续输入
                                        className="flex-1 bg-transparent border-none outline-none text-sm px-4 text-gray-200 placeholder-gray-600"
                                    />
                                    <button 
                                        onClick={handleSend}
                                        disabled={!input.trim()} // 仅在没内容时禁用发送
                                        className="p-2 bg-slate-700 text-white rounded-full hover:bg-slate-600 disabled:opacity-50 transition-all"
                                    >
                                        <Send size={16} />
                                    </button>
                                </div>
                                
                                {/* 结束按钮 */}
                                <div className="mt-4 flex justify-center">
                                    {messages.length > 2 && (
                                        <button 
                                            onClick={handleEndSession}
                                            disabled={isLoading} // 总结时还是建议 block 一下防止重复点击
                                            className="text-xs text-slate-600 hover:text-slate-400 transition-colors border-b border-transparent hover:border-slate-400 pb-0.5"
                                        >
                                            {t.endBtn}
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* 总结展示完毕 */}
                        {step === 'SUMMARY' && !isLoading && (
                             <div className="mt-8 mb-12 flex justify-center animate-in fade-in delay-500">
                                 <button 
                                    onClick={onClose}
                                    className="px-8 py-3 bg-white text-black font-bold text-sm rounded-full hover:bg-gray-200 transition-all shadow-lg shadow-white/10 flex items-center gap-2"
                                 >
                                     <Sparkles size={14} />
                                     {t.closeBtn}
                                 </button>
                             </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};