import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageSquare, Heart, Terminal, Zap, ThumbsUp } from 'lucide-react'; 
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation'; 
import ReactMarkdown from 'react-markdown'; 
import { useAppLanguage } from '@/hooks/useAppLanguage';
import { toast } from 'sonner'; 
import { Toast } from '@/lib/toast';

interface FeedDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  feedItem: any;
}

const getAvatarUrl = (name: string) => {
  const n = (name || 'echo').toLowerCase();
  return `/avatars/${n}_hero.jpg`;
};

const getPersonaColor = (name: string) => {
    const n = (name || '').toUpperCase();
    if (n.includes('ASH')) return 'border-red-500 text-red-500 shadow-red-500/20 from-red-500/10';
    if (n.includes('VEE')) return 'border-orange-500 text-orange-500 shadow-orange-500/20 from-orange-500/10';
    if (n.includes('RIN')) return 'border-pink-500 text-pink-500 shadow-pink-500/20 from-pink-500/10';
    if (n.includes('SOL')) return 'border-yellow-500 text-yellow-500 shadow-yellow-500/20 from-yellow-500/10';
    if (n.includes('ECHO')) return 'border-emerald-400 text-emerald-400 shadow-emerald-400/20 from-emerald-400/10';
    return 'border-gray-500 text-gray-500 shadow-gray-500/20 from-gray-500/10';
};

export default function FeedDetailModal({ isOpen, onClose, feedItem }: FeedDetailModalProps) {
  const router = useRouter(); 
  const { lang } = useAppLanguage();
  const [isResonated, setIsResonated] = useState(false);

  // --- 核心修复开始 ---
  
  // 1. 监听 feedItem 变化，解决“点一个全变亮”和“刷新重置”的问题
  useEffect(() => {
    if (feedItem?.id) {
      // 使用唯一的 Key：tough_resonate_文章ID
      const storageKey = `tough_resonate_${feedItem.id}`;
      const savedState = localStorage.getItem(storageKey);
      
      // 如果本地存了 'true'，则设为 true，否则强制重置为 false (防止组件复用导致的状态残留)
      setIsResonated(savedState === 'true');
    }
  }, [feedItem]); // 依赖项：当 feedItem 变化时触发

  // --- 核心修复结束 ---

  const labels = {
    zh: { 
      resonate: '共鸣', 
      connect: '建立连接', 
      source: '来源', 
      log: '日志',
      resonated: '已共鸣',
      editorialEchoes: '编辑部回响',
      noEchoes: '暂无回响',
      signalSent: '共鸣信号已发送...',
      aiReply: (name: string) => `收到来自 ${name} 的私密回信`
    },
    en: { 
      resonate: 'RESONATE', 
      connect: 'CONNECT', 
      source: 'SOURCE_ID', 
      resonated: 'RESONATED',
      log: 'LOG',
      editorialEchoes: 'EDITORIAL ECHOES',
      noEchoes: 'No echoes detected in the system.',
      signalSent: 'Resonance signal broadcasted...',
      aiReply: (name: string) => `Incoming encrypted msg from ${name}`
    }
  };
  const txt = lang === 'zh' ? labels.zh : labels.en;
  
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.dispatchEvent(new CustomEvent('toggle-dock', { detail: { visible: false } }));
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { 
      document.body.style.overflow = 'unset'; 
      window.dispatchEvent(new CustomEvent('toggle-dock', { detail: { visible: true } }));
    };
  }, [isOpen]);

  if (!feedItem) return null;

  const rawName = feedItem.personaName || 'Echo';
  const authorName = rawName.toUpperCase() === 'SYSTEM' ? 'Echo' : rawName;
  const themeClass = getPersonaColor(authorName);
  const borderClass = themeClass.split(' ')[0]; 
  const textClass = themeClass.split(' ')[1];
  const shadowClass = themeClass.split(' ')[2];

  // 🔥 核心逻辑：共鸣 (点赞) + 写入 LocalStorage
  const handleResonate = () => {
    if (isResonated) return;
    
    // 1. 更新 UI 状态
    setIsResonated(true);
    
    // 2. 写入 LocalStorage，绑定具体 ID
    if (feedItem?.id) {
        localStorage.setItem(`tough_resonate_${feedItem.id}`, 'true');
    }

    // 3. 震动反馈
    if (navigator.vibrate) navigator.vibrate([50, 50]);
    
    const signalToastId = Toast.success(txt.signalSent);

    // 4. 模拟 AI 主动发起私聊 (延迟 1.5秒)
    const targetId = rawName.toLowerCase(); 
    setTimeout(() => {
        if (navigator.vibrate) navigator.vibrate(100);
        toast.dismiss(signalToastId);
        
        Toast.message(
            targetId, 
            `我在 Feed 里收到了你的共鸣... 关于 "${feedItem.title}"，要聊聊吗？`, 
            () => {
                onClose(); 
                router.push(`/chat/${targetId}?from=herofeed&topic=${encodeURIComponent(feedItem.title)}&stance=resonate`);
            }
        );
    }, 1500);
  };

  const handleConnect = () => {
      const targetId = rawName.toLowerCase() === 'system' ? 'echo' : rawName.toLowerCase();
      onClose();
      router.push(`/chat/${targetId}?from=herofeed&topic=${encodeURIComponent(feedItem.title)}&stance=direct_connect`);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-[#050505]/80 backdrop-blur-md"
          />

          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6 pointer-events-none">
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.5, bounce: 0.2 }}
              className="w-full max-w-lg h-[90vh] sm:h-auto sm:max-h-[85vh] bg-[#0a0a0a] border border-white/10 sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col pointer-events-auto relative overflow-hidden ring-1 ring-white/5"
            >
              
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-50 ${textClass}`} />

              {/* Header */}
              <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl z-20">
                <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-white/5 rounded-md border border-white/10">
                        <Terminal size={12} className="text-gray-400" />
                    </div>
                    <div className="flex flex-col leading-none">
                        <span className="text-[9px] font-mono text-gray-600 uppercase tracking-widest mb-0.5">{txt.source}</span>
                        <span className="text-[11px] font-mono text-gray-300">{feedItem.id ? feedItem.id.substring(0, 8).toUpperCase() : 'UNKNOWN'}</span>
                    </div>
                </div>
                <button onClick={onClose} className="group p-2 rounded-full hover:bg-white/10 transition-colors">
                  <X size={20} className="text-gray-500 group-hover:text-white transition-colors" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-6 sm:p-8 relative [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                <div className="absolute top-16 right-4 text-[6rem] font-black text-white/[0.02] leading-none pointer-events-none select-none z-0">
                    LOG
                </div>

                <article className="relative z-10">
                  <div className="flex items-center gap-4 mb-6">
                      <div className={`relative w-14 h-14 rounded-full border-2 p-0.5 bg-black ${borderClass} ${shadowClass}`}>
                           <img 
                                src={getAvatarUrl(authorName)} 
                                alt={authorName}
                                className="w-full h-full rounded-full object-cover object-[top_center] bg-zinc-900"
                                onError={(e) => { e.currentTarget.src = "/avatars/echo_hero.jpg"; }}
                            />
                           <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#0a0a0a] rounded-full flex items-center justify-center">
                              <div className={`w-2 h-2 rounded-full animate-pulse bg-current ${textClass}`}></div>
                           </div>
                      </div>
                      
                      <div className="flex flex-col">
                          <div className="flex items-center gap-2 mb-1">
                              <span className={`text-xs font-bold px-1.5 py-0.5 rounded bg-white/5 tracking-wider ${textClass}`}>
                                  {authorName}
                              </span>
                              <span className="text-[10px] text-gray-500 font-mono border border-white/10 px-1 rounded">
                                {feedItem.type}
                              </span>
                          </div>
                          <span className="text-[10px] text-gray-500">
                              Incoming Transmission • {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                      </div>
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-bold text-white mb-6 leading-tight tracking-tight">
                    {feedItem.title}
                  </h1>
                  
                  <div className={`prose prose-invert max-w-none relative pl-4 border-l-2 border-white/5 prose-p:text-gray-300 prose-p:leading-8 prose-p:text-[15px] prose-p:font-light prose-strong:text-white prose-strong:font-bold prose-strong:bg-white/10 prose-strong:px-1 prose-strong:rounded`}>
                        <div className={`absolute left-[-2px] top-0 bottom-0 w-0.5 opacity-50 bg-current ${textClass}`} />
                        <ReactMarkdown components={{
                          p: ({node, ...props}) => <p className="mb-6 last:mb-0" {...props} />,
                          ul: ({node, ...props}) => <ul className="list-disc pl-4 mb-4 space-y-2 text-gray-400" {...props} />,
                          li: ({node, ...props}) => <li className="marker:text-gray-500" {...props} />
                        }}>
                          {feedItem.content ? feedItem.content.replace(/\n/g, '  \n') : ''}
                        </ReactMarkdown>
                  </div>
                </article>

                <div className="mt-12 pt-8 border-t border-white/5">
                   <h3 className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                     <MessageSquare size={12} />
                     Editorial Echoes
                   </h3>
                   <div className="space-y-5">
                     {feedItem.comments && feedItem.comments.length > 0 ? (
                        feedItem.comments.map((comment: any, idx: number) => (
                           <CommentItem 
                              key={idx}
                              name={comment.personaName || 'System'}
                              content={comment.content}
                              time="Now"
                           />
                        ))
                     ) : (
                        <p className="text-xs text-gray-600 italic">{txt.noEchoes}</p>
                     )}
                   </div>
                </div>
                <div className="h-24" />
              </div>
              
              <div className="absolute bottom-[72px] left-0 right-0 h-16 bg-gradient-to-t from-[#0a0a0a] to-transparent pointer-events-none z-10" />

              <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 bg-[#0a0a0a]/90 backdrop-blur-md border-t border-white/5 flex gap-3 z-20">
                <button 
                    onClick={handleResonate}
                    disabled={isResonated}
                    className="flex-1 h-12 rounded-xl bg-white text-black font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-2 hover:bg-gray-200 transition-all active:scale-95 shadow-lg shadow-white/5"
                >
                   <Heart size={16} className={isResonated ? "fill-pink-600 text-pink-600" : "fill-black"} />
                   <span>{isResonated ? txt.resonated : txt.resonate}</span>
                </button>
                <button 
                  onClick={handleConnect}
                  className="flex-1 h-12 rounded-xl bg-[#1a1a1a] text-white border border-white/10 font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-2 hover:bg-[#222] hover:border-white/20 transition-all active:scale-95"
                >
                   <Zap size={16} className={textClass} /> 
                   <span>{txt.connect}</span>
                </button>
              </div>

            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

function CommentItem({ name, content, time }: { name: string, content: string, time: string }) {
    const [isLiked, setIsLiked] = useState(false); 
    const theme = getPersonaColor(name);
    const textClass = theme.split(' ')[1] || 'text-gray-400';

    return (
        <div className="flex gap-3 group items-start">
           <div className="shrink-0 w-8 h-8 rounded-full bg-white/5 border border-white/10 overflow-hidden">
                <img 
                    src={getAvatarUrl(name)} 
                    alt={name}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.currentTarget.src = "/avatars/echo_hero.jpg"; }}
                />
           </div>
           
           <div className="flex-1 bg-white/5 p-3 rounded-r-xl rounded-bl-xl border border-white/5 hover:border-white/10 transition-colors">
               <div className="flex items-center justify-between mb-1">
                   <span className={`text-[11px] font-bold uppercase tracking-wide ${textClass}`}>
                       {name}
                   </span>
                   <span className="text-[9px] text-gray-600 font-mono">{time}</span>
               </div>
               <p className="text-xs text-gray-300 leading-relaxed">
                   {content}
               </p>
               
               <div className="mt-2 flex items-center justify-end">
                   <button 
                        onClick={() => setIsLiked(!isLiked)}
                        className={`p-1 rounded-full transition-colors ${isLiked ? 'text-pink-500 bg-pink-500/10' : 'text-gray-600 hover:text-gray-400'}`}
                   >
                       <ThumbsUp size={10} className={isLiked ? "fill-current" : ""} />
                   </button>
               </div>
           </div>
        </div>
    )
}