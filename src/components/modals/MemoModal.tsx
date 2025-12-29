import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, StickyNote } from 'lucide-react';
// 🔥 关键：从全局 types 引入修正后的接口
import { MemoModalProps } from '@/types'; 

export const MemoModal = ({ 
    show, 
    onClose, 
    lang, 
    partnerId, 
    initialNote, 
    onReward, 
    handleSend 
}: MemoModalProps) => {
    const [note, setNote] = useState(initialNote || '');
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        if (show) setNote(initialNote || '');
    }, [show, initialNote]);

    const handleSubmit = async () => {
        if (!note.trim()) return;
        setIsSending(true);
        try {
            if (handleSend) {
                await handleSend(note);
            }
            setNote('');
            onClose();
        } catch (e) {
            console.error(e);
        } finally {
            setIsSending(false);
        }
    };

    const t = {
        zh: {
            title: '留下便签',
            placeholder: '写点什么...',
            send: '发送',
            sending: '发送中...'
        },
        en: {
            title: 'Leave a Memo',
            placeholder: 'Write something...',
            send: 'Send',
            sending: 'Sending...'
        }
    }[lang === 'zh' ? 'zh' : 'en'];

    if (!show) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-sm bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/5">
                    <div className="flex items-center gap-2 text-white/80">
                        <StickyNote size={18} className="text-yellow-400" />
                        <span className="font-medium text-sm">{t.title}</span>
                    </div>
                    <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-4 space-y-4">
                    <textarea 
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder={t.placeholder}
                        className="w-full h-32 bg-black/20 border border-white/10 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-white/20 resize-none placeholder:text-white/20"
                        autoFocus
                    />
                    
                    <button
                        disabled={isSending || !note.trim()}
                        onClick={handleSubmit}
                        className="w-full py-3 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white text-sm font-medium transition-all flex items-center justify-center gap-2"
                    >
                        {isSending ? (
                            <span className="animate-pulse">{t.sending}</span>
                        ) : (
                            <>
                                <Send size={16} />
                                {t.send}
                            </>
                        )}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};