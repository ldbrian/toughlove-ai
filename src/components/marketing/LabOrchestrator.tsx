"use client";

import { useState, useRef, useEffect } from "react";
import { useChat, type Message } from "ai/react";
import { motion, AnimatePresence } from "framer-motion";
import AnalysisCard from "./AnalysisCard";
import { Send, Sparkles, ArrowUpCircle } from "lucide-react"; // 引入 Sparkles

export type LabState = "IDLE" | "CHATTING" | "ANALYZING" | "RESULT";

export default function LabOrchestrator() {
  const [status, setStatus] = useState<LabState>("IDLE");
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [isCN, setIsCN] = useState(true);

  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      setIsCN(navigator.language.startsWith('zh'));
    }
  }, []);
  
  const { messages, input, handleInputChange, handleSubmit, append } = useChat({
    api: "/api/lab/chat",
    body: { isCN },
    onFinish: (message: Message) => {
      if (messages.length > 0) scrollToBottom();
      
      if (message.content.includes("[READY_FOR_ANALYSIS]")) {
        setStatus("ANALYZING");
        setTimeout(() => setStatus("RESULT"), 3500);
      }
    },
  });

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      container.scrollTop = container.scrollHeight;
      setTimeout(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
      }, 100);
    }
  };

  useEffect(() => {
    if (messages.length > 1) scrollToBottom();
  }, [messages]);

  const startSession = () => {
    setStatus("CHATTING");
    const greeting = isCN ? "(沉默) 我在听。" : "(Silence) I'm listening.";
    append({ role: "assistant", content: greeting, id: 'init' });
  };

  // 🏁 结束对话处理函数
  const handleFinish = () => {
    append({ 
      role: "user", 
      content: "【系统指令：用户请求结束对话并生成深度分析报告】" 
    });
  };

  return (
    <div className="fixed inset-0 w-full h-[100dvh] bg-[#020617] text-slate-200 font-sans flex flex-col overflow-hidden z-50">
      
      {/* 氛围背景 */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-blue-950/20 blur-[120px] rounded-full mix-blend-screen opacity-60" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-cyan-950/10 blur-[100px] rounded-full mix-blend-screen opacity-50" />
      </div>

      <AnimatePresence mode="wait">
        
        {/* --- IDLE --- */}
        {status === "IDLE" && (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, filter: "blur(10px)" }}
            className="relative z-10 w-full h-full flex flex-col items-center justify-center p-6 space-y-12"
          >
            <div className="space-y-6 text-center">
              <div className="w-16 h-16 mx-auto bg-gradient-to-tr from-cyan-600 to-blue-700 rounded-full shadow-[0_0_30px_rgba(8,145,178,0.4)] animate-pulse" />
              <h1 className="text-4xl font-light tracking-widest text-white">
                TOUGH LOVE <span className="font-bold text-cyan-500">OS</span>
              </h1>
              <p className="text-slate-400 font-light text-xs max-w-[260px] mx-auto leading-relaxed tracking-wider">
                {isCN ? "潜入意识深处 · 安全连接" : "SUBCONSCIOUS LINK · SECURE"}
              </p>
            </div>
            <button
              onClick={startSession}
              className="px-10 py-3 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-cyan-500/30 rounded-full backdrop-blur-md transition-all text-xs tracking-[0.2em] text-cyan-100 uppercase"
            >
              {isCN ? "开始连接" : "Connect"}
            </button>
          </motion.div>
        )}

        {/* --- CHATTING --- */}
        {status === "CHATTING" && (
          <motion.div
            key="chat"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative z-10 w-full h-full flex flex-col"
          >
            {/* Header */}
            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-[#020617] via-[#020617]/95 to-transparent z-20 pointer-events-none flex items-start justify-center pt-8">
              <span className="text-[10px] tracking-[0.3em] text-cyan-500/30 uppercase font-mono">
                {isCN ? "深度链接中" : "LINK_ACTIVE"}
              </span>
            </div>

            {/* Message List */}
            <div 
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto w-full px-4 pt-24 scrollbar-hide"
            >
              <div className="pb-4">
                {messages.map((m: Message, index) => (
                  // 过滤掉系统指令
                  !m.content.includes("【系统指令") && (
                    <div key={m.id} className="mb-6">
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[85%] px-5 py-3 text-[15px] leading-relaxed rounded-2xl backdrop-blur-sm shadow-sm
                          ${m.role === 'user' 
                            ? 'bg-cyan-950/40 text-cyan-50 border border-cyan-500/10 rounded-br-sm' 
                            : 'bg-transparent text-slate-400/80 pl-0 border-none'
                          }`}
                        >
                          {m.content.replace("[READY_FOR_ANALYSIS]", "")}
                        </div>
                      </motion.div>

                      {/* ✨ 核心交互升级：建议胶囊 (Suggestion Chip) */}
                      {/* 只有在：是 Ash 的回复 + 是最后一条 + 且对话超过 2 轮时出现 */}
                      {m.role === 'assistant' && index === messages.length - 1 && messages.length > 2 && (
                        <motion.div 
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex justify-start mt-2 ml-1"
                        >
                          <button
                            onClick={handleFinish}
                            className="group flex items-center gap-2 px-4 py-2 bg-cyan-900/20 hover:bg-cyan-900/40 border border-cyan-500/30 rounded-full transition-all cursor-pointer"
                          >
                            <Sparkles size={14} className="text-cyan-400 animate-pulse" />
                            <span className="text-xs text-cyan-200/80 group-hover:text-cyan-100">
                              {isCN ? "我说完了，生成诊断" : "I'm done. Analyze."}
                            </span>
                          </button>
                        </motion.div>
                      )}
                    </div>
                  )
                ))}
              </div>
            </div>

            {/* Input Area */}
            <div className="flex-none w-full bg-[#020617] border-t border-white/5 z-30 pb-safe">
              <div className="p-3">
                <form onSubmit={handleSubmit} className="relative flex items-center gap-3 max-w-lg mx-auto">
                  
                  {/* 左侧辅助按钮：也换成了 Sparkles，保持一致性 */}
                  {messages.length > 2 && (
                    <button
                      type="button"
                      onClick={handleFinish}
                      className="p-3 bg-white/5 hover:bg-cyan-500/20 border border-white/10 hover:border-cyan-500/50 rounded-full transition-all text-slate-400 hover:text-cyan-400 group flex-shrink-0"
                      title={isCN ? "生成报告" : "Analyze"}
                    >
                      {/* 这里用了 Sparkles 代替原来的 Flag */}
                      <Sparkles size={16} className="group-hover:fill-current" />
                    </button>
                  )}

                  <input
                    className="w-full bg-white/5 border border-white/5 rounded-full py-3 pl-5 pr-12 text-sm text-slate-200 placeholder:text-slate-700 focus:outline-none focus:border-cyan-900/50 focus:bg-white/10 transition-all"
                    value={input}
                    onChange={handleInputChange}
                    placeholder={isCN ? "在此处倾诉..." : "Speak..."}
                    autoFocus
                  />
                  <button 
                    type="submit" 
                    disabled={!input.trim()}
                    className="absolute right-2 p-1.5 bg-cyan-900/50 hover:bg-cyan-800 text-cyan-100 rounded-full transition-all disabled:opacity-0 disabled:scale-75"
                  >
                    <Send size={14} />
                  </button>
                </form>
              </div>
            </div>
          </motion.div>
        )}

        {/* --- ANALYZING --- */}
        {status === "ANALYZING" && (
          <motion.div
            key="analyzing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative z-10 w-full h-full flex flex-col items-center justify-center space-y-8 bg-[#020617]"
          >
             <div className="relative w-16 h-16 flex items-center justify-center">
               <div className="absolute inset-0 bg-cyan-500/10 rounded-full animate-ping opacity-20 duration-[3s]" />
               <div className="w-full h-full border-t border-cyan-900 rounded-full animate-spin" />
             </div>
             <p className="text-cyan-900/50 text-[10px] tracking-[0.3em] animate-pulse">
               GENERATING PROFILE...
             </p>
          </motion.div>
        )}

        {/* --- RESULT --- */}
        {status === "RESULT" && (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative z-10 w-full h-full flex items-center justify-center p-4"
          >
            <AnalysisCard 
              diagnosis={messages[messages.length - 1]?.content.replace("[READY_FOR_ANALYSIS]", "").trim()} 
              isCN={isCN}
            />
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}