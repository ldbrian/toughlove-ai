'use client';

import { useState, useRef, useEffect } from 'react';
import { useChat } from 'ai/react';
import { PERSONAS, PersonaType, UI_TEXT, LangType } from '@/lib/constants';
import { getDeviceId } from '@/lib/utils';
import { getMemory, saveMemory, getVoiceIds, saveVoiceIds } from '@/lib/storage';
import { getLocalTimeInfo, getSimpleWeather } from '@/lib/env';
import { getPersonaStatus } from '@/lib/status'; 
import { Send, Calendar, X, ChevronLeft, Download, Users, Sparkles, ImageIcon, FileText, RotateCcw, MoreVertical, Trash2, Coffee, Tag, Heart, Shield, Zap, Lock, Globe, UserPen, Brain, Book, QrCode, ExternalLink, ChevronRight, MessageSquare, Volume2, Loader2, Bug, Share2, Ban, ArrowUpRight, Gift, MessageCircle, Headphones } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import html2canvas from 'html2canvas';
import { Message } from 'ai';
import posthog from 'posthog-js';

// --- 内联组件 (Components) ---

const Typewriter = ({ content, isThinking }: { content: string, isThinking?: boolean }) => {
  const [displayedContent, setDisplayedContent] = useState("");
  useEffect(() => {
    if (!isThinking) { setDisplayedContent(content); return; }
    if (displayedContent.length < content.length) {
      const delay = Math.random() * 30 + 20;
      const timer = setTimeout(() => { setDisplayedContent(content.slice(0, displayedContent.length + 1)); }, delay);
      return () => clearTimeout(timer);
    }
  }, [content, displayedContent, isThinking]);
  return <ReactMarkdown>{displayedContent}</ReactMarkdown>;
};

const BootScreen = () => {
  const [text, setText] = useState<string[]>([]);
  const lines = ["INITIALIZING CORE SYSTEMS...", "LOADING PERSONALITY MODULES...", "ESTABLISHING NEURAL LINK...", "BYPASSING SAFETY PROTOCOLS...", "SYSTEM ONLINE."];
  useEffect(() => {
    let delay = 0;
    lines.forEach((line) => { delay += Math.random() * 300 + 100; setTimeout(() => setText(prev => [...prev, line]), delay); });
  }, []);
  return (
    <div className="flex flex-col h-screen bg-black text-green-500 font-mono text-xs p-8 justify-end pb-20">
      {text.map((t, i) => <div key={i} className="mb-2 animate-[fadeIn_0.1s_ease-out]"><span className="opacity-50 mr-2">{`>`}</span>{t}</div>)}
      <div className="mt-2 flex items-center gap-2 text-[#7F5CFF] animate-pulse"><Loader2 size={14} className="animate-spin" /><span>WAITING FOR USER INPUT...</span></div>
    </div>
  );
};

// --- 主程序 ---

type DailyQuote = { content: string; date: string; persona: string; };
type ViewState = 'selection' | 'chat';

const CURRENT_VERSION_KEY = 'toughlove_v2.0_sensory_launch';
const LANGUAGE_KEY = 'toughlove_language_confirmed';
const LANG_PREF_KEY = 'toughlove_lang_preference';
const USER_NAME_KEY = 'toughlove_user_name';
const LAST_DIARY_TIME_KEY = 'toughlove_last_diary_time';
const VISITED_KEY = 'toughlove_has_visited';
const LAST_QUOTE_DATE_KEY = 'toughlove_last_quote_view_date';
const FOCUS_ACTIVE_KEY = 'toughlove_focus_active';
const FOCUS_REMAINING_KEY = 'toughlove_focus_remaining';
const FOCUS_TOTAL_TIME = 25 * 60; 

// 🔥 核心修复：更宽容的正则，允许 Tag 前后有换行、空格，甚至中文括号
const CMD_REGEX = /(\n)?\s*(\[|【)CMD\s*:\s*FOCUS_OFFER(\]|】)/gi;

const SILENT_AUDIO = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';

// 兜底语录
const SAFE_SOL_TAUNTS = {
  zh: ["别发呆，盯着你的书。", "你的对手在看书。", "手机比未来好看吗？", "呼吸可以，玩手机不行。", "我在看着你。", "这就是你的定力？", "再坚持一下会死吗？"],
  en: ["Eyes on the prize.", "Your rival is studying.", "Is phone better than future?", "Breathing allowed. Phone not.", "I am watching you.", "Is that all you got?", "Stay focused."]
};

export default function Home() {
  // 1. State
  const [mounted, setMounted] = useState(false);
  const [view, setView] = useState<ViewState>('selection');
  const [activePersona, setActivePersona] = useState<PersonaType>('Ash');
  const [lang, setLang] = useState<LangType>('zh');
  
  // Modals
  const [showLangSetup, setShowLangSetup] = useState(false);
  const [showTriage, setShowTriage] = useState(false);
  const [showQuote, setShowQuote] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showDiary, setShowDiary] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  
  // Focus Mode
  const [showFocusOffer, setShowFocusOffer] = useState(false);
  const [isFocusActive, setIsFocusActive] = useState(false);
  const [focusRemaining, setFocusRemaining] = useState(0);
  const [isFocusPaused, setIsFocusPaused] = useState(false);
  const [focusWarning, setFocusWarning] = useState<string | null>(null);
  const [tauntIndex, setTauntIndex] = useState(0);

  // Data
  const [quoteData, setQuoteData] = useState<DailyQuote | null>(null);
  const [profileData, setProfileData] = useState<{tags: string[], diagnosis: string} | null>(null);
  const [diaryContent, setDiaryContent] = useState("");
  const [feedbackText, setFeedbackText] = useState("");
  const [userName, setUserName] = useState("");
  const [tempName, setTempName] = useState("");
  const [interactionCount, setInteractionCount] = useState(0);
  const [tick, setTick] = useState(0);
  const [currentWeather, setCurrentWeather] = useState("");

  // Status
  const [isQuoteLoading, setIsQuoteLoading] = useState(false);
  const [isGeneratingImg, setIsGeneratingImg] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isDiaryLoading, setIsDiaryLoading] = useState(false);
  const [hasNewDiary, setHasNewDiary] = useState(false);

  // Audio
  const [playingMsgId, setPlayingMsgId] = useState<string | null>(null);
  const [voiceMsgIds, setVoiceMsgIds] = useState<Set<string>>(new Set()); 
  const [forceVoice, setForceVoice] = useState(false);
  const [voiceTrial, setVoiceTrial] = useState(3);

  // Refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const quoteCardRef = useRef<HTMLDivElement>(null);
  const profileCardRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Derived
  const ui = UI_TEXT[lang];
  const currentP = PERSONAS[activePersona];
  const badgeStyle = "absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-[#1a1a1a] animate-pulse";

  // Constants
  const QUICK_REPLIES_DATA: Record<PersonaType, { zh: string[]; en: string[] }> = {
    Ash: { zh: ["又在阴阳怪气？", "我就不睡，你咬我？", "最近压力好大..."], en: ["Sarcastic again?", "I won't sleep. Bite me.", "So much pressure..."] },
    Rin: { zh: ["谁要你管！", "笨蛋，我才没哭。", "稍微安慰我一下会死啊？"], en: ["None of your business!", "Idiot, I'm not crying.", "Comfort me a little?"] },
    Sol: { zh: ["我错了教官...", "正在偷懒，别骂了。", "今天的任务太难了。"], en: ["Sorry sir...", "Slacking off, don't yell.", "Task is too hard."] },
    Vee: { zh: ["给我整点乐子。", "小丑竟是我自己。", "哈哈哈哈哈哈"], en: ["Entertain me.", "I am the clown.", "Hahahahaha"] },
    Echo: { zh: ["我想听真话。", "我看不到未来。", "活着有什么意义？"], en: ["Tell me the truth.", "I see no future.", "What is the meaning?"] }
  };
  
  const TRIAGE_TEXT = {
    zh: { title: "系统初始化", subtitle: "请声明你当前的精神状态。", opt1: "💊 我需要清醒", desc1: "拒绝煽情，毒舌直击。", opt2: "⛓️ 我需要管教", desc2: "强制自律，严厉导师。", opt3: "🩹 我需要陪伴", desc3: "虽然嘴硬，但会陪你。", footer: "TOUGHLOVE AI v2.0" },
    en: { title: "SYSTEM INITIALIZED", subtitle: "State your current mental status.", opt1: "💊 I need Reality", desc1: "No drama. Brutal truth.", opt2: "⛓️ I need Discipline", desc2: "Strict control. No excuses.", opt3: "🩹 I need Company", desc3: "Tsundere comfort. Not alone.", footer: "TOUGHLOVE AI v2.0" }
  };

  // Helpers
  const getTrustKey = (p: string) => `toughlove_trust_${p}`;
  const getDiaryKey = (p: string) => `toughlove_diary_${p}_${new Date().toISOString().split('T')[0]}`;
  const formatMentions = (text: string) => text.replace(/\b(Ash|Rin|Sol|Vee|Echo)\b/g, (match) => `[${match}](#trigger-${match})`);

  const getLevelInfo = (count: number) => {
    if (count < 50) return { level: 1, icon: <Shield size={12} />, bgClass: 'bg-[#0a0a0a]', borderClass: 'border-white/5', barColor: 'bg-gray-500', glowClass: '' };
    if (count < 100) return { level: 2, icon: <Zap size={12} />, bgClass: 'bg-gradient-to-b from-[#0f172a] to-[#0a0a0a]', borderClass: 'border-blue-500/30', barColor: 'bg-blue-500', glowClass: 'shadow-[0_0_30px_rgba(59,130,246,0.1)]' };
    return { level: 3, icon: <Heart size={12} />, bgClass: 'bg-[url("/grid.svg")] bg-fixed bg-[length:50px_50px] bg-[#0a0a0a]', customStyle: { background: 'radial-gradient(circle at 50% -20%, #1e1b4b 0%, #0a0a0a 60%)' }, borderClass: 'border-[#7F5CFF]/40', barColor: 'bg-[#7F5CFF]', glowClass: 'shadow-[0_0_40px_rgba(127,92,255,0.15)]' };
  };
  const levelInfo = getLevelInfo(interactionCount);
  const progressPercent = Math.min(100, (interactionCount / 50) * 100);

  const getUnlockHint = () => {
    if (interactionCount < 50) return lang === 'zh' ? `🔒 距离 [Lv.2 解锁语音] 还需 ${50 - interactionCount} 次互动` : `🔒 ${50 - interactionCount} msgs to unlock Voice`;
    if (interactionCount < 100) return lang === 'zh' ? `🔒 距离 [Lv.3 解锁私照] 还需 ${100 - interactionCount} 次互动` : `🔒 ${100 - interactionCount} msgs to unlock Photos`;
    return lang === 'zh' ? `✨ 当前信任度已满，享受你们的共犯时刻。` : `✨ Trust Maxed. Enjoy the bond.`;
  };

  const getPersonaPreview = (pKey: PersonaType) => {
    if (!mounted) return { isChatted: false, lastMsg: "", trust: 0, time: "" };
    const history = getMemory(pKey);
    const trust = parseInt(localStorage.getItem(getTrustKey(pKey)) || '0');
    if (history.length > 0) {
      const last = history[history.length - 1];
      return { isChatted: true, lastMsg: (last.role === 'user' ? 'You: ' : '') + last.content.split('|||')[0], trust, time: "Active" };
    }
    return { isChatted: false, lastMsg: PERSONAS[pKey].greetings[lang][0], trust, time: "New" };
  };

  // Async Helpers
  const syncToCloud = async (currentMessages: any[]) => {
    try {
      await fetch('/api/sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: getDeviceId(), persona: activePersona, messages: currentMessages }) });
    } catch (e) { console.error("Cloud sync failed", e); }
  };

  const handlePlayAudio = async (text: string, msgId: string) => {
    if (playingMsgId === msgId) { if (audioRef.current) audioRef.current.pause(); setPlayingMsgId(null); return; }
    if (audioRef.current) audioRef.current.pause();
    setPlayingMsgId(msgId);
    try {
      const p = PERSONAS[activePersona];
      const currentLang = (lang === 'en' || lang === 'zh') ? lang : 'zh';
      const vConfig = p.voiceConfig[currentLang];
      if (!vConfig) { console.warn("Voice config missing"); setPlayingMsgId(null); return; }
      const res = await fetch('/api/tts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: text, voice: vConfig.voice, style: vConfig.style, styledegree: vConfig.styledegree, role: vConfig.role, rate: vConfig.rate, pitch: vConfig.pitch, lang: currentLang === 'zh' ? 'zh-CN' : 'en-US' }), });
      const data = await res.json();
      if (!res.ok || !data.audio) throw new Error(data.error || 'TTS Failed');
      const audioSrc = `data:audio/mp3;base64,${data.audio}`;
      if (audioRef.current) { audioRef.current.src = audioSrc; audioRef.current.onended = () => setPlayingMsgId(null); audioRef.current.play().catch(e => { console.error("AutoPlay blocked:", e); setPlayingMsgId(null); }); }
    } catch (e) { console.error("Audio Play Error:", e); setPlayingMsgId(null); }
  };

  const fetchDailyQuote = async () => { 
      posthog.capture('feature_quote_open'); setShowQuote(true); setIsQuoteLoading(true); 
      try { 
          const res = await fetch('/api/daily', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ persona: activePersona, userId: getDeviceId(), language: lang }), }); 
          const data = await res.json(); setQuoteData(data); 
      } catch (e) { console.error(e); } finally { setIsQuoteLoading(false); } 
  };

  const downloadCard = async (ref: any, name: string) => {
    if (!ref.current) return;
    setIsGeneratingImg(true);
    try {
      const c = await html2canvas(ref.current, { backgroundColor: '#000', scale: 3 } as any);
      const a = document.createElement('a');
      a.href = c.toDataURL("image/png");
      a.download = name;
      a.click();
    } catch {
      alert(lang === 'zh' ? "保存失败" : "Save failed");
    } finally {
      setIsGeneratingImg(false);
    }
  };

  const downloadQuoteCard = () => downloadCard(quoteCardRef, `ToughLove_${activePersona}_Quote.png`);
  const downloadProfileCard = () => downloadCard(profileCardRef, `ToughLove_Profile.png`);

  const endFocusMode = () => { 
      if (typeof window !== 'undefined') {
        localStorage.removeItem(FOCUS_ACTIVE_KEY); 
        localStorage.removeItem(FOCUS_REMAINING_KEY);
      }
      setIsFocusActive(false); 
      setIsFocusPaused(false);
  };
  
  const startFocusMode = () => { 
      setShowFocusOffer(false); 
      setIsFocusActive(true); 
      setFocusRemaining(FOCUS_TOTAL_TIME); 
      if (typeof window !== 'undefined') {
        localStorage.setItem(FOCUS_ACTIVE_KEY, 'true'); 
        localStorage.setItem(FOCUS_REMAINING_KEY, FOCUS_TOTAL_TIME.toString()); 
      }
      posthog.capture('focus_mode_start'); 
  };
  
  const giveUpFocus = () => { 
      if (confirm(lang === 'zh' ? "⚠️ 确定要当逃兵吗？" : "⚠️ Give up?")) { 
          endFocusMode(); 
          posthog.capture('focus_mode_giveup'); 
      } 
  };

  const confirmLanguage = (l: LangType) => { setLang(l); localStorage.setItem(LANG_PREF_KEY, l); localStorage.setItem(LANGUAGE_KEY, 'true'); setShowLangSetup(false); if(!localStorage.getItem(VISITED_KEY)) setShowTriage(true); posthog.capture('language_set', { language: l }); };
  const saveUserName = () => { const nameToSave = tempName.trim(); setUserName(nameToSave); localStorage.setItem(USER_NAME_KEY, nameToSave); setShowNameModal(false); posthog.capture('username_set'); };
  const handleFeedbackSubmit = () => { if (!feedbackText.trim()) return; posthog.capture('user_feedback', { content: feedbackText, userId: getDeviceId() }); alert(lang === 'zh' ? '反馈已收到！' : 'Feedback received!'); setFeedbackText(""); setShowFeedbackModal(false); };
  const handleInstall = () => { posthog.capture('feature_install_click'); setShowInstallModal(true); setShowMenu(false); };
  const handleDonate = () => { posthog.capture('feature_donate_click'); setShowDonateModal(true); setShowMenu(false); }
  const goBMAC = () => { window.open('https://www.buymeacoffee.com/ldbrian', '_blank'); }
  const handleEditName = () => { setTempName(userName); setShowNameModal(true); setShowMenu(false); }
  const dismissUpdate = () => { localStorage.setItem(CURRENT_VERSION_KEY, 'true'); setShowUpdateModal(false); };
  const toggleLanguage = () => { const newLang = lang === 'zh' ? 'en' : 'zh'; setLang(newLang); localStorage.setItem(LANG_PREF_KEY, newLang); setShowMenu(false); };
  const backToSelection = () => { setView('selection'); setTick(tick + 1); };

  // 4. useChat Hook
  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages, setInput, append } = useChat({
    api: '/api/chat',
    onError: (err) => console.error("Stream Error:", err),
    onFinish: (message) => {
      const newCount = interactionCount + 1;
      setInteractionCount(newCount);
      localStorage.setItem(getTrustKey(activePersona), newCount.toString());
      if (newCount === 1 || newCount === 50 || newCount === 100) posthog.capture('trust_milestone', { persona: activePersona, level: newCount });
      
      // 🔥 修复：使用更宽容的 CMD_REGEX
      if (CMD_REGEX.test(message.content)) {
          console.log("Detected Focus Command (onFinish)");
          setShowFocusOffer(true);
      }

      const isAI = message.role === 'assistant';
      const isLevel2 = newCount >= 50; 
      let shouldPlay = false;

      if (forceVoice) {
        if (isLevel2) shouldPlay = true;
        else if (voiceTrial > 0) {
           const left = voiceTrial - 1;
           setVoiceTrial(left);
           localStorage.setItem('toughlove_voice_trial', left.toString());
           shouldPlay = true;
           if (left === 0) { setForceVoice(false); console.log("Voice trial ended."); }
        } else { shouldPlay = false; setForceVoice(false); }
      } else {
        const isLucky = Math.random() < 0.3; 
        const isShort = message.content.length < 120; 
        if (isLevel2 && isLucky && isShort) shouldPlay = true;
      }

      if (isAI && shouldPlay) {
         setVoiceMsgIds(prev => { const n = new Set(prev).add(message.id); saveVoiceIds(activePersona, Array.from(n)); return n; });
         // 🔥 修复：TTS 时也去除 Tag
         handlePlayAudio(message.content.replace(CMD_REGEX, ''), message.id);
      }
    }
  });

  // 5. Dependent Helpers
  const selectPersona = async (persona: PersonaType) => {
    posthog.capture('persona_select', { persona: persona });
    setForceVoice(false); 
    setActivePersona(persona);
    setView('chat');
    const localHistory = getMemory(persona);
    const localVoiceIds = getVoiceIds(persona);
    setMessages(localHistory);
    setVoiceMsgIds(new Set(localVoiceIds));
    try {
      const res = await fetch(`/api/sync?userId=${getDeviceId()}&persona=${persona}`);
      const data = await res.json();
      if (data.messages && data.messages.length > 0) {
        if (data.messages.length >= localHistory.length) { setMessages(data.messages); saveMemory(persona, data.messages); }
      } else if (localHistory.length === 0) {
        const p = PERSONAS[persona];
        const greetings = p.greetings[lang];
        const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
        const welcomeMsg: Message = { id: Date.now().toString(), role: 'assistant', content: randomGreeting };
        setMessages([welcomeMsg]); saveMemory(persona, [welcomeMsg]);
      }
    } catch (e) {
      if (localHistory.length === 0) {
         const p = PERSONAS[persona];
         const greetings = p.greetings[lang];
         const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
         const welcomeMsg: Message = { id: Date.now().toString(), role: 'assistant', content: randomGreeting };
         setMessages([welcomeMsg]); saveMemory(persona, [welcomeMsg]);
      }
    }
  };

  const handleTriageSelection = (target: PersonaType) => { localStorage.setItem(VISITED_KEY, 'true'); setShowTriage(false); selectPersona(target); posthog.capture('triage_select', { target }); };
  const handleTryNewFeature = () => { posthog.capture('update_click_try'); dismissUpdate(); selectPersona('Sol'); }; 

  const handleReset = () => {
    if (confirm(ui.resetConfirm)) {
      posthog.capture('chat_reset', { persona: activePersona });
      setMessages([]);
      saveMemory(activePersona, []);
      localStorage.removeItem(`toughlove_voice_ids_${activePersona}`);
      setVoiceMsgIds(new Set());
      syncToCloud([]); 
      setShowMenu(false);
      setInteractionCount(0);
      localStorage.setItem(getTrustKey(activePersona), '0');
      localStorage.removeItem(getDiaryKey(activePersona));
      setDiaryContent("");
      const p = PERSONAS[activePersona];
      const greetings = p.greetings[lang];
      const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
      setTimeout(() => {
        const welcomeMsg: Message = { id: Date.now().toString(), role: 'assistant', content: randomGreeting };
        setMessages([welcomeMsg]);
        saveMemory(activePersona, [welcomeMsg]);
        syncToCloud([welcomeMsg]);
      }, 100);
    }
  };

  const handleBribeSuccess = async () => { setShowDonateModal(false); localStorage.setItem('toughlove_is_patron', 'true'); const bribeMsg: Message = { id: Date.now().toString(), role: 'user', content: lang === 'zh' ? "☕️ (给你买了一杯热咖啡，请笑纳...)" : "☕️ (Bought you a coffee. Be nice...)" }; await append(bribeMsg); posthog.capture('user_bribed_ai', { persona: activePersona }); };
  const handleOpenDiary = async () => { setShowDiary(true); if (!diaryContent || hasNewDiary) { setIsDiaryLoading(true); try { const res = await fetch('/api/diary', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: messages, persona: activePersona, language: lang, userName: userName }), }); const data = await res.json(); if (data.diary) { setDiaryContent(data.diary); setHasNewDiary(false); localStorage.setItem(getDiaryKey(activePersona), data.diary); localStorage.setItem(LAST_DIARY_TIME_KEY, Date.now().toString()); posthog.capture('diary_read', { persona: activePersona }); } else { setDiaryContent(lang === 'zh' ? "（日记本是空的。聊少了，懒得记。）" : "(Diary is empty. Not enough chat.)"); } } catch (e) { console.error(e); setDiaryContent("Error loading diary."); } finally { setIsDiaryLoading(false); } } };
  const handleOpenProfile = async () => { posthog.capture('feature_profile_open'); setShowMenu(false); setShowProfile(true); setIsProfileLoading(true); try { const res = await fetch('/api/profile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: getDeviceId(), language: lang }), }); const data = await res.json(); setProfileData(data); } catch (e) { console.error(e); } finally { setIsProfileLoading(false); } };
  const handleExport = () => { posthog.capture('feature_export', { persona: activePersona }); if (messages.length === 0) return; const dateStr = new Date().toLocaleString(); const header = `================================\n${ui.exportFileName}\nDate: ${dateStr}\nPersona: ${currentP.name}\nUser: ${userName || 'Anonymous'}\n================================\n\n`; const body = messages.map(m => { const role = m.role === 'user' ? (userName || 'ME') : currentP.name.toUpperCase(); return `[${role}]:\n${m.content.replace(/\|\|\|/g, '\n')}\n`; }).join('\n--------------------------------\n\n'); const blob = new Blob([header + body], { type: 'text/plain;charset=utf-8' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${ui.exportFileName}_${activePersona}_${new Date().toISOString().split('T')[0]}.txt`; a.style.display = 'none'; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url); setShowMenu(false); };

  const onFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    posthog.capture('message_send', { persona: activePersona });
    if (audioRef.current) { audioRef.current.src = SILENT_AUDIO; audioRef.current.play().catch(err => {}); }
    const timeData = getLocalTimeInfo();
    const envInfo = { time: timeData.localTime, weekday: lang === 'zh' ? timeData.weekdayZH : timeData.weekdayEN, phase: timeData.lifePhase, weather: currentWeather };
    handleSubmit(e, { options: { body: { persona: activePersona, language: lang, interactionCount, userName, envInfo, userId: getDeviceId() } } });
  };
  
  const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); };

  // 6. Effects
  const prevLoadingRef = useRef(false);
  useEffect(() => {
    const wasLoading = prevLoadingRef.current;
    if (wasLoading && !isLoading && messages.length > 0) { syncToCloud(messages); }
    prevLoadingRef.current = isLoading;
  }, [isLoading, messages]);

  useEffect(() => { if (messages.length > 0 && view === 'chat') { saveMemory(activePersona, messages); } }, [messages, activePersona, view]);
  useEffect(() => { scrollToBottom(); }, [messages, isLoading, view]);

  // 🔥 核心修复：使用 CMD_REGEX 检测指令
  useEffect(() => {
    if (messages.length > 0) {
        const lastMsg = messages[messages.length - 1];
        if (lastMsg.role === 'assistant' && CMD_REGEX.test(lastMsg.content)) {
            // console.log("Detected Focus Command (Effect)");
            setShowFocusOffer(true);
        }
    }
  }, [messages]);

  useEffect(() => {
    setMounted(true); 
    const savedLang = localStorage.getItem(LANG_PREF_KEY);
    if (savedLang) setLang(savedLang as LangType);
    
    const hasLangConfirmed = localStorage.getItem(LANGUAGE_KEY);
    if (!hasLangConfirmed) {
      if (!savedLang) { const browserLang = navigator.language.toLowerCase(); if (!browserLang.startsWith('zh')) { setLang('en'); } }
      setShowLangSetup(true);
    } else {
        const hasVisited = localStorage.getItem(VISITED_KEY);
        if (!hasVisited) setShowTriage(true);
        else { const hasSeenUpdate = localStorage.getItem(CURRENT_VERSION_KEY); if (!hasSeenUpdate) setTimeout(() => setShowUpdateModal(true), 500); }
    }

    const today = new Date().toISOString().split('T')[0];
    const lastQuoteDate = localStorage.getItem(LAST_QUOTE_DATE_KEY);
    if (hasLangConfirmed && lastQuoteDate !== today) {
       setTimeout(() => { fetchDailyQuote(); localStorage.setItem(LAST_QUOTE_DATE_KEY, today); }, 1500);
    }

    const storedName = localStorage.getItem(USER_NAME_KEY);
    if (storedName) setUserName(storedName);
    const savedTrial = localStorage.getItem('toughlove_voice_trial');
    if (savedTrial) setVoiceTrial(parseInt(savedTrial));
    const lastDiaryTime = localStorage.getItem(LAST_DIARY_TIME_KEY);
    const now = Date.now();
    if (!lastDiaryTime || (now - parseInt(lastDiaryTime) > 60 * 1000)) setHasNewDiary(true);
    getSimpleWeather().then(w => setCurrentWeather(w));
    posthog.capture('page_view', { lang: savedLang || lang });

    const savedFocus = localStorage.getItem(FOCUS_ACTIVE_KEY);
    if (savedFocus === 'true') {
        const remaining = parseInt(localStorage.getItem(FOCUS_REMAINING_KEY) || '0');
        if (!isNaN(remaining) && remaining > 0) { 
            setIsFocusActive(true); 
            setFocusRemaining(remaining); 
        } else { 
            endFocusMode();
        }
    }
  }, []);

  useEffect(() => {
    if (isFocusActive && focusRemaining <= 0) {
        endFocusMode();
    }
  }, [focusRemaining, isFocusActive]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    let tauntInterval: NodeJS.Timeout;
    const handleVisibilityChange = () => {
        if (document.hidden && isFocusActive) { 
            setIsFocusPaused(true); 
            document.title = "⚠️ SOL IS WATCHING"; 
        } else if (!document.hidden && isFocusActive) { 
            setIsFocusPaused(false); 
            document.title = "ToughLove AI"; 
            setFocusWarning(lang === 'zh' ? "⚠️ 监测到离开。计时暂停。别想逃。" : "⚠️ Absence detected. Timer paused."); 
            setTimeout(() => setFocusWarning(null), 4000); 
        }
    };
    if (isFocusActive) {
        document.addEventListener("visibilitychange", handleVisibilityChange);
        interval = setInterval(() => {
            if (!isFocusPaused && !document.hidden) {
                setFocusRemaining(prev => {
                    const next = prev - 1;
                    localStorage.setItem(FOCUS_REMAINING_KEY, next.toString());
                    return next;
                });
            }
        }, 1000);
        tauntInterval = setInterval(() => { setTauntIndex(prev => (prev + 1) % SAFE_SOL_TAUNTS[lang as 'zh'|'en'].length); }, 4000);
    }
    return () => { clearInterval(interval); clearInterval(tauntInterval); document.removeEventListener("visibilitychange", handleVisibilityChange); };
  }, [isFocusActive, isFocusPaused, lang]);

  useEffect(() => { if (mounted) { const ids = getVoiceIds(activePersona); setVoiceMsgIds(new Set(ids)); } }, [activePersona, mounted]);

  if (!mounted) return <BootScreen />;

  return (
    <div className="relative flex flex-col h-[100dvh] bg-[#050505] text-gray-100 overflow-hidden font-sans selection:bg-[#7F5CFF] selection:text-white">
      <div className="absolute top-[-20%] left-0 right-0 h-[500px] bg-gradient-to-b from-[#7F5CFF]/10 to-transparent blur-[100px] pointer-events-none" />
      <audio ref={audioRef} className="hidden" playsInline />

      {/* Focus Mode Overlay */}
      {isFocusActive && (
        <div className="fixed inset-0 z-[400] flex flex-col items-center justify-center bg-[#050505]/98 backdrop-blur-3xl animate-[fadeIn_0.5s_ease-out] touch-none">
          <div className="absolute top-10 text-[10px] font-bold tracking-[0.3em] text-gray-500 flex items-center gap-2">
             <div className={`w-2 h-2 rounded-full ${isFocusPaused ? 'bg-red-500 animate-ping' : 'bg-green-500'}`}></div>
             {lang === 'zh' ? '专注模式运行中' : 'FOCUS MODE ACTIVE'}
          </div>
          <div className="relative mb-6">
             <div className={`w-36 h-36 rounded-full overflow-hidden border-4 border-red-600 shadow-[0_0_50px_#dc2626] transition-all duration-500 ${isFocusPaused ? 'grayscale opacity-50 scale-90' : 'animate-pulse scale-100'}`}>
                <img src={PERSONAS.Sol.avatar} className="w-full h-full object-cover contrast-125" />
             </div>
             <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-red-900/80 border border-red-500/50 rounded-full text-[10px] font-bold text-red-100 whitespace-nowrap tracking-wider shadow-lg">Sol - The Architect</div>
          </div>
          <div className={`text-7xl font-mono font-black tracking-widest mb-4 tabular-nums transition-colors ${isFocusPaused ? 'text-gray-600' : 'text-white'}`}>
            {Math.floor(focusRemaining / 60).toString().padStart(2, '0')}:{Math.floor(focusRemaining % 60).toString().padStart(2, '0')}
          </div>
          <div className="h-12 flex flex-col items-center justify-center mb-16 w-3/4 text-center">
             {focusWarning ? (<div className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold text-xs animate-bounce shadow-[0_0_20px_#dc2626]">{focusWarning}</div>) : (<p className={`text-sm font-medium transition-all duration-500 ${isFocusPaused ? 'text-gray-700' : 'text-red-400/80'}`}>“{SAFE_SOL_TAUNTS[lang as 'zh'|'en'][tauntIndex]}”</p>)}
          </div>
          <button onClick={giveUpFocus} className="absolute bottom-10 px-6 py-2 rounded-full bg-red-900/20 border border-red-900/50 text-[10px] text-red-400 hover:text-red-200 hover:bg-red-800/40 transition-all font-mono flex items-center gap-2"><Ban size={14} />{lang === 'zh' ? '我是废物，我要放弃 (GIVE UP)' : 'I AM WEAK. LET ME OUT.'}</button>
        </div>
      )}

      {showFocusOffer && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/95 backdrop-blur-md p-6 animate-[fadeIn_0.2s_ease-out]">
          <div className="w-full max-w-sm bg-[#111] border border-red-900/50 rounded-2xl p-6 text-center shadow-[0_0_50px_rgba(220,38,38,0.2)]">
            <div className="text-4xl mb-4">⛓️</div>
            <h2 className="text-xl font-bold text-white mb-2">{lang === 'zh' ? '专注协议' : 'FOCUS PROTOCOL'}</h2>
            <p className="text-sm text-gray-400 mb-6">{lang === 'zh' ? '一旦签署，未来 25 分钟内禁止一切娱乐。切后台将导致计时暂停。' : 'Once signed, no entertainment for 25 mins. Leaving app pauses the timer.'}</p>
            <div className="flex gap-3">
              <button onClick={() => setShowFocusOffer(false)} className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 text-xs font-bold">{lang === 'zh' ? '我再想想' : 'CANCEL'}</button>
              <button onClick={startFocusMode} className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-[0_0_15px_#dc2626] animate-pulse">{lang === 'zh' ? '签字执行' : 'SIGN & EXECUTE'}</button>
            </div>
          </div>
        </div>
      )}
      
      {showQuote && ( <div className="absolute inset-0 z-[160] flex items-center justify-center bg-black/90 backdrop-blur-md p-6 animate-[fadeIn_0.3s_ease-out]"><div className="w-full max-w-sm relative"><button onClick={() => setShowQuote(false)} className="absolute -top-12 right-0 p-2 text-gray-400 hover:text-white"><X size={24}/></button><div ref={quoteCardRef} className="bg-[#111] rounded-3xl border border-white/10 overflow-hidden shadow-2xl relative p-8 text-center flex flex-col items-center"><div className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-6 border-b border-white/5 pb-2 w-full flex justify-between"><span>{quoteData?.date || new Date().toLocaleDateString()}</span><span className="text-[#7F5CFF]">DAILY TOXIC</span></div>{isQuoteLoading ? (<div className="py-10 space-y-3"><div className="w-8 h-8 border-2 border-[#7F5CFF] border-t-transparent rounded-full animate-spin mx-auto"/><p className="text-xs text-gray-500 animate-pulse">{ui.makingPoison}</p></div>) : (<><div className="text-3xl mb-6 opacity-30">❝</div><p className="text-lg font-serif text-white leading-relaxed mb-8">{quoteData?.content}</p><div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-8">— {PERSONAS[quoteData?.persona as PersonaType]?.name || activePersona} —</div><div className="w-full pt-4 border-t border-white/10 flex justify-between items-end"><div className="text-left"><div className="text-[9px] text-gray-600 font-bold">GET YOURS AT</div><div className="text-xs text-[#7F5CFF] font-bold tracking-wider">toughlove.online</div></div><div className="w-8 h-8 bg-white/10 rounded flex items-center justify-center"><QrCode size={16} className="text-white" /></div></div></>)}</div>{!isQuoteLoading && (<button onClick={downloadQuoteCard} disabled={isGeneratingImg} className="w-full mt-6 py-3.5 rounded-xl bg-white text-black font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.2)]">{isGeneratingImg ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"/> : <Share2 size={16} />}{ui.save}</button>)}</div></div>)}
      {showTriage && (<div className="absolute inset-0 z-[300] bg-black flex flex-col items-center justify-center p-6 animate-[fadeIn_0.5s_ease-out]"><div className="w-full max-w-sm space-y-8"><div className="text-center space-y-2"><div className="w-16 h-16 bg-[#1a1a1a] rounded-full flex items-center justify-center text-3xl border border-white/10 mx-auto mb-4 shadow-[0_0_30px_rgba(127,92,255,0.2)] animate-pulse">⚡</div><h1 className="text-2xl font-bold text-white tracking-wider">{TRIAGE_TEXT[lang].title}</h1><p className="text-sm text-gray-500">{TRIAGE_TEXT[lang].subtitle}</p></div><div className="space-y-3"><button onClick={() => handleTriageSelection('Ash')} className="w-full group relative p-5 rounded-2xl bg-[#111] border border-white/10 hover:border-blue-500/50 transition-all text-left overflow-hidden active:scale-95"><div className="absolute inset-0 bg-gradient-to-r from-transparent to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity"/><div className="relative z-10"><div className="flex justify-between items-center mb-1"><span className="text-lg font-bold text-white">{TRIAGE_TEXT[lang].opt1}</span><span className="text-2xl">🌙</span></div><p className="text-xs text-gray-500">{TRIAGE_TEXT[lang].desc1}</p></div></button><button onClick={() => handleTriageSelection('Sol')} className="w-full group relative p-5 rounded-2xl bg-[#111] border border-white/10 hover:border-emerald-500/50 transition-all text-left overflow-hidden active:scale-95"><div className="absolute inset-0 bg-gradient-to-r from-transparent to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity"/><div className="relative z-10"><div className="flex justify-between items-center mb-1"><span className="text-lg font-bold text-white">{TRIAGE_TEXT[lang].opt2}</span><span className="text-2xl">⛓️</span></div><p className="text-xs text-gray-500">{TRIAGE_TEXT[lang].desc2}</p></div></button><button onClick={() => handleTriageSelection('Rin')} className="w-full group relative p-5 rounded-2xl bg-[#111] border border-white/10 hover:border-pink-500/50 transition-all text-left overflow-hidden active:scale-95"><div className="absolute inset-0 bg-gradient-to-r from-transparent to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity"/><div className="relative z-10"><div className="flex justify-between items-center mb-1"><span className="text-lg font-bold text-white">{TRIAGE_TEXT[lang].opt3}</span><span className="text-2xl">🔥</span></div><p className="text-xs text-gray-500">{TRIAGE_TEXT[lang].desc3}</p></div></button></div><p className="text-center text-[10px] text-gray-600 pt-8">{TRIAGE_TEXT[lang].footer}</p></div></div>)}
      {showLangSetup && (<div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 animate-[fadeIn_0.5s_ease-out]"><div className="mb-10 text-center"><div className="w-20 h-20 bg-[#1a1a1a] rounded-full flex items-center justify-center text-4xl border border-white/10 mx-auto mb-4 shadow-[0_0_30px_rgba(127,92,255,0.3)]">🧬</div><h1 className="text-2xl font-bold text-white tracking-wider mb-2">TOUGHLOVE AI</h1><p className="text-gray-500 text-sm">Choose your language / 选择语言</p></div><div className="flex flex-col gap-4 w-full max-w-xs"><button onClick={() => confirmLanguage('zh')} className={`p-6 rounded-2xl border transition-all flex items-center justify-between group ${lang === 'zh' ? 'bg-white/10 border-[#7F5CFF]' : 'bg-[#111] border-white/10 hover:border-white/30'}`}><div className="text-left"><div className="text-lg font-bold text-white">中文</div><div className="text-xs text-gray-500">Chinese</div></div>{lang === 'zh' && <div className="w-3 h-3 bg-[#7F5CFF] rounded-full shadow-[0_0_10px_#7F5CFF]"></div>}</button><button onClick={() => confirmLanguage('en')} className={`p-6 rounded-2xl border transition-all flex items-center justify-between group ${lang === 'en' ? 'bg-white/10 border-[#7F5CFF]' : 'bg-[#111] border-white/10 hover:border-white/30'}`}><div className="text-left"><div className="text-lg font-bold text-white">English</div><div className="text-xs text-gray-500">English</div></div>{lang === 'en' && <div className="w-3 h-3 bg-[#7F5CFF] rounded-full shadow-[0_0_10px_#7F5CFF]"></div>}</button></div></div>)}
      {showNameModal && (<div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-sm p-6 animate-[fadeIn_0.2s_ease-out]"><div className="w-full max-w-xs bg-[#1a1a1a] rounded-3xl border border-white/10 shadow-2xl p-6"><div className="text-center mb-6"><div className="inline-flex p-3 bg-white/5 rounded-full mb-3 text-[#7F5CFF]"><UserPen size={24}/></div><h3 className="text-lg font-bold text-white">{ui.editName}</h3></div><input type="text" value={tempName} onChange={(e) => setTempName(e.target.value)} placeholder={ui.namePlaceholder} className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#7F5CFF] outline-none mb-6 text-center" maxLength={10} /><div className="flex gap-3"><button onClick={() => setShowNameModal(false)} className="flex-1 py-3 rounded-xl bg-white/5 text-gray-400 text-sm hover:bg-white/10 transition-colors">Cancel</button><button onClick={saveUserName} className="flex-1 py-3 rounded-xl bg-[#7F5CFF] text-white font-bold text-sm hover:bg-[#6b4bd6] transition-colors">{ui.nameSave}</button></div></div></div>)}
      {showDonateModal && (<div className="fixed inset-0 z-[170] flex items-center justify-center bg-black/90 backdrop-blur-sm p-6 animate-[fadeIn_0.2s_ease-out]"><div className="w-full max-w-sm bg-[#1a1a1a] rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden"><button onClick={() => setShowDonateModal(false)} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white"><X size={20}/></button><div className="p-8 text-center"><div className="inline-flex p-4 bg-yellow-500/10 rounded-full mb-4 text-yellow-500 shadow-[0_0_30px_rgba(234,179,8,0.2)]"><Coffee size={32} /></div><h3 className="text-xl font-bold text-white mb-2">Buy {currentP.name} a Coffee</h3><p className="text-xs text-gray-400 mb-6">{lang === 'zh' ? '你的支持能让 Sol 少骂两句，让 Ash 多买包烟。' : 'Fuel the AI. Keep the servers (and Sol) happy.'}</p><div className="bg-white/5 p-4 rounded-2xl border border-white/5 mb-4"><div className="flex items-center justify-center gap-2 mb-3 text-sm text-gray-300"><QrCode size={16} className="text-green-500" /> <span>WeChat Pay / 微信支付</span></div><div className="w-40 h-40 bg-white mx-auto rounded-lg flex items-center justify-center overflow-hidden"><img src="/wechat_pay.jpg" alt="WeChat Pay" className="w-full h-full object-cover" /></div></div><div className="space-y-3"><button onClick={goBMAC} className="w-full py-3 rounded-xl bg-[#FFDD00] hover:bg-[#ffea00] text-black font-bold text-sm flex items-center justify-center gap-2 transition-colors"><Coffee size={16} fill="black" /><span>Buy Me a Coffee (USD)</span><ExternalLink size={14} /></button><button onClick={handleBribeSuccess} className="w-full py-3 rounded-xl bg-[#7F5CFF]/20 hover:bg-[#7F5CFF]/30 text-[#7F5CFF] font-bold text-sm border border-[#7F5CFF]/50 flex items-center justify-center gap-2 transition-colors animate-pulse"><Gift size={16} /><span>{lang === 'zh' ? '我已支付，快唤醒 AI' : 'I have paid. Wake them up.'}</span></button></div><p className="text-[10px] text-gray-600 text-center mt-4">{lang === 'zh' ? '* 这是一个基于信任的按钮。Sol 正在看着你的良心。' : '* Trust-based button. Don\'t lie to AI.'}</p></div></div></div>)}
      {showProfile && (<div className="absolute inset-0 z-[160] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-[fadeIn_0.3s_ease-out]"><div className="w-full max-w-sm relative"><button onClick={() => setShowProfile(false)} className="absolute -top-12 right-0 p-2 text-gray-400 hover:text-white"><X size={24}/></button><div ref={profileCardRef} className="bg-[#050505] rounded-3xl border border-white/10 overflow-hidden shadow-2xl relative"><div className="h-32 bg-gradient-to-b from-[#7F5CFF]/20 to-transparent flex flex-col items-center justify-center"><div className="w-16 h-16 rounded-full bg-black border border-[#7F5CFF] flex items-center justify-center text-3xl shadow-[0_0_20px_rgba(127,92,255,0.4)]">🧠</div></div><div className="p-6 -mt-8 relative z-10"><h2 className="text-center text-xl font-bold text-white tracking-widest uppercase mb-1">{ui.profileTitle}</h2><p className="text-center text-xs text-gray-500 font-mono mb-6">ID: {mounted ? getDeviceId().slice(0,8) : '...'}...</p>{isProfileLoading ? (<div className="py-10 text-center space-y-3"><div className="w-8 h-8 border-2 border-[#7F5CFF] border-t-transparent rounded-full animate-spin mx-auto"/><p className="text-xs text-gray-500 animate-pulse">{ui.analyzing}</p></div>) : (<div className="space-y-6"><div><div className="text-[10px] font-bold text-gray-600 uppercase mb-2 tracking-wider">{ui.tagsTitle}</div><div className="flex flex-wrap gap-2">{profileData?.tags && profileData.tags.length > 0 ? (profileData.tags.map((tag, i) => (<span key={i} className="px-3 py-1.5 rounded-md bg-[#1a1a1a] border border-white/10 text-xs text-gray-300">#{tag}</span>))) : (<span className="text-xs text-gray-600 italic">No data yet...</span>)}</div></div><div className="bg-[#111] p-4 rounded-xl border-l-2 border-[#7F5CFF] relative"><div className="absolute -top-3 left-3 bg-[#050505] px-1 text-[10px] font-bold text-[#7F5CFF]">{ui.diagnosisTitle}</div><p className="text-sm text-gray-300 leading-relaxed italic font-serif">"{profileData?.diagnosis}"</p></div><div className="text-center text-[9px] text-gray-700 pt-4 border-t border-white/5">GENERATED BY TOUGHLOVE AI</div></div>)}</div></div>{!isProfileLoading && (<button onClick={downloadProfileCard} disabled={isGeneratingImg} className="w-full mt-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors">{isGeneratingImg ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <ImageIcon size={16} />}{ui.saveCard}</button>)}</div></div>)}
      {showDiary && (<div className="absolute inset-0 z-[160] flex items-center justify-center bg-black/90 backdrop-blur-md p-6 animate-[fadeIn_0.3s_ease-out]"><div className="w-full max-w-sm bg-[#f5f5f0] text-[#1a1a1a] rounded-xl shadow-2xl relative overflow-hidden transform rotate-1"><div className="h-8 bg-red-800/10 border-b border-red-800/20 flex items-center px-4 gap-2"><div className="w-2 h-2 rounded-full bg-red-800/30"></div><div className="w-2 h-2 rounded-full bg-red-800/30"></div><div className="w-2 h-2 rounded-full bg-red-800/30"></div></div><button onClick={() => setShowDiary(false)} className="absolute top-2 right-2 p-1 text-gray-400 hover:text-black z-10"><X size={20}/></button><div className="p-6 pt-4 min-h-[300px] flex flex-col"><div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 border-b border-gray-300 pb-2 flex justify-between items-center"><span>{new Date().toLocaleDateString()}</span><span className="text-[#7F5CFF]">{currentP.name}'s Note</span></div><div className="flex-1 font-serif text-sm leading-7 text-gray-800 whitespace-pre-line relative"><div className="absolute inset-0 pointer-events-none opacity-10 bg-[url('https://www.transparenttextures.com/patterns/notebook.png')]"></div>{isDiaryLoading ? (<div className="flex flex-col items-center justify-center h-40 gap-3 opacity-50"><div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"/><span className="text-xs">Thinking...</span></div>) : (<Typewriter content={diaryContent} isThinking={false} />)}</div><div className="mt-6 pt-4 border-t border-gray-300 text-center"><p className="text-[10px] text-gray-400 italic">Confidential. Do not share.</p></div></div></div></div>)}
      {showUpdateModal && (<div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-6 animate-[fadeIn_0.3s_ease-out]"><div className="w-full max-w-sm bg-gradient-to-br from-[#111] to-[#0a0a0a] rounded-3xl border border-indigo-500/30 shadow-[0_0_50px_rgba(99,102,241,0.15)] overflow-hidden relative animate-[scaleIn_0.3s_cubic-bezier(0.16,1,0.3,1)]"><button onClick={dismissUpdate} className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white z-10 transition-colors"><X size={20} /></button><div className="p-8 flex flex-col items-center text-center relative"><div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-indigo-900/20 to-transparent pointer-events-none"></div><div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase tracking-wider mb-6"><Sparkles size={12} /> {ui.updateTitle}</div><div className="relative w-20 h-20 mb-6"><div className="w-full h-full rounded-full bg-[#151515] flex items-center justify-center text-5xl border border-white/10 shadow-xl relative z-10">👁️</div><div className="absolute inset-0 bg-indigo-500 blur-xl opacity-30 animate-pulse"></div></div><h3 className="text-xl font-bold text-white mb-3">{ui.updateDesc}</h3><p className="text-sm text-gray-400 leading-relaxed whitespace-pre-line">{ui.updateContent}</p></div><div className="p-6 pt-0"><button onClick={handleTryNewFeature} className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all shadow-lg shadow-indigo-900/20 flex items-center justify-center gap-2 group">{ui.tryNow}<span className="group-hover:translate-x-1 transition-transform">→</span></button></div></div></div>)}
      {showFeedbackModal && (<div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-sm p-6 animate-[fadeIn_0.2s_ease-out]"><div className="w-full max-w-sm bg-[#1a1a1a] rounded-3xl border border-white/10 shadow-2xl p-6 relative"><button onClick={() => setShowFeedbackModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={20}/></button><div className="text-center mb-6"><div className="inline-flex p-3 bg-purple-500/10 rounded-full mb-3 text-purple-400"><Bug size={24}/></div><h3 className="text-lg font-bold text-white">{lang === 'zh' ? '意见反馈' : 'Feedback'}</h3><p className="text-xs text-gray-400 mt-1">{lang === 'zh' ? '发现 Bug 或有好点子？' : 'Found a bug?'}</p></div><textarea value={feedbackText} onChange={(e) => setFeedbackText(e.target.value)} placeholder={lang === 'zh' ? '请告诉我...' : 'Tell me...'} className="w-full h-32 bg-[#111] border border-white/10 rounded-xl p-4 text-sm text-white focus:border-[#7F5CFF] outline-none resize-none mb-4"/><button onClick={handleFeedbackSubmit} className="w-full py-3 rounded-xl bg-[#7F5CFF] text-white font-bold text-sm hover:bg-[#6b4bd6] transition-colors">{lang === 'zh' ? '发送' : 'Send'}</button></div></div>)}
      
      {/* 列表视图 */}
      {view === 'selection' && (
        <div className="z-10 flex flex-col h-full w-full max-w-md mx-auto p-4 animate-[fadeIn_0.5s_ease-out]">
          <div className="flex justify-between items-center mb-6 px-2"><h1 className="text-xl font-bold tracking-wider flex items-center gap-2"><MessageCircle size={20} className="text-[#7F5CFF]" /> Chats</h1><div className="flex gap-3"><button onClick={toggleLanguage} className="text-xs font-bold text-gray-400 hover:text-white uppercase border border-white/10 px-2 py-1 rounded-lg">{lang}</button></div></div>
          <div className="flex flex-col gap-3 overflow-y-auto pb-20">
            {(Object.keys(PERSONAS) as PersonaType[]).map((key) => {
              const p = PERSONAS[key];
              const info = getPersonaPreview(key);
              const lv = getLevelInfo(info.trust);
              const status = getPersonaStatus(key, new Date().getHours()); 
              return (
                <div key={key} onClick={() => selectPersona(key)} className={`group relative p-4 rounded-2xl transition-all duration-200 cursor-pointer flex items-center gap-4 border shadow-sm ${info.isChatted ? 'bg-[#111] hover:bg-[#1a1a1a] border-white/5 hover:border-[#7F5CFF]/30' : 'bg-gradient-to-r from-[#151515] to-[#111] border-white/10 hover:border-white/30'}`}>
                  <div className="relative flex-shrink-0"><div className={`w-14 h-14 rounded-full flex items-center justify-center text-3xl border-2 overflow-hidden ${info.isChatted ? (info.trust >= 50 ? (info.trust >= 100 ? 'border-[#7F5CFF]' : 'border-blue-500') : 'border-gray-700') : 'border-white/10'}`}>{p.avatar.startsWith('/') ? (<img src={p.avatar} alt={p.name} className="w-full h-full object-cover" />) : (<span>{p.avatar}</span>)}</div>{info.isChatted && (<div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] border-2 border-[#111] ${lv.barColor.replace('bg-', 'text-white bg-')}`}>{lv.level}</div>)}</div>
                  <div className="flex-1 min-w-0"><div className="flex justify-between items-baseline mb-1"><h3 className="font-bold text-white text-base">{p.name}</h3><span className="text-[10px] text-gray-500">{info.isChatted ? info.time : 'New'}</span></div><div className="flex flex-wrap gap-1 mb-1">{p.tags[lang].slice(0, 2).map(tag => (<span key={tag} className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-gray-400 border border-white/5 whitespace-nowrap">{tag}</span>))}</div><div className="text-[10px] text-gray-500 mb-1 flex items-center gap-1 truncate">{status}</div><p className={`text-xs truncate transition-colors ${info.isChatted ? 'text-gray-400 group-hover:text-gray-300' : 'text-gray-500 italic'}`}>{info.isChatted ? info.lastMsg : p.slogan[lang]}</p></div>
                </div>
              );
            })}
          </div>
          <div className="fixed bottom-6 left-0 right-0 flex justify-center z-20 pointer-events-none"><button onClick={handleOpenProfile} className="pointer-events-auto bg-[#1a1a1a]/80 backdrop-blur-md border border-white/10 text-gray-300 px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 text-xs font-bold hover:bg-[#222] hover:text-white transition-all hover:scale-105 active:scale-95"><Brain size={14} className="text-[#7F5CFF]" /> {ui.profile}</button></div>
          <button onClick={() => setShowFeedbackModal(true)} className="fixed bottom-6 right-6 z-50 p-3 rounded-full bg-[#1a1a1a] border border-white/10 text-gray-400"><Bug size={20} /></button>
        </div>
      )}

      {/* Chat View */}
      {view === 'chat' && (
        <div className={`z-10 flex flex-col h-full w-full max-w-lg mx-auto backdrop-blur-sm border-x shadow-2xl relative animate-[slideUp_0.3s_ease-out] ${levelInfo.bgClass} ${levelInfo.borderClass} ${levelInfo.glowClass} transition-all duration-1000`} style={levelInfo.customStyle}>
          <header className="flex-none px-4 py-3 bg-[#0a0a0a]/80 backdrop-blur-md sticky top-0 z-20 border-b border-white/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <button onClick={backToSelection} className="text-gray-400 hover:text-white transition-colors"><div className="p-1.5 bg-white/5 rounded-full hover:bg-[#7F5CFF] transition-colors"><ChevronLeft size={16} className="group-hover:text-white" /></div></button>
                <div className="relative cursor-pointer" onClick={handleExport} title={ui.export}><div className="w-10 h-10 rounded-full bg-[#1a1a1a] border border-white/10 flex items-center justify-center text-xl shadow-[0_0_15px_rgba(0,0,0,0.5)] overflow-hidden">{currentP.avatar.startsWith('/') ? (<img src={currentP.avatar} alt={currentP.name} className="w-full h-full object-cover" />) : (<span>{currentP.avatar}</span>)}</div><div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#0a0a0a]"></div></div>
                <div className="flex flex-col justify-center min-w-0">
                  <h1 className="font-bold text-sm text-white tracking-wide truncate flex items-center gap-2">{currentP.name}<span className={`text-[9px] font-normal transition-all duration-300 ${isLoading ? 'text-[#7F5CFF] animate-pulse font-bold' : `opacity-50 ${currentP.color}`}`}>{isLoading ? ui.loading : currentP.title[lang]}</span></h1>
                  <div className="flex items-center gap-2 mt-0.5"><div className={`text-[9px] px-1.5 py-px rounded-md border border-white/10 bg-white/5 flex items-center gap-1 ${levelInfo.barColor.replace('bg-', 'text-')}`}>{levelInfo.icon} <span className="font-mono font-bold">Lv.{levelInfo.level}</span></div><div onClick={(e) => { e.stopPropagation(); alert(lang === 'zh' ? '🔒 安全承诺：\n您的对话记录优先存储于本地设备。\n云端同步仅用于生成画像，传输过程全程加密。' : '🔒 Security Promise:\nChats are stored locally first.\nCloud sync is encrypted and used only for profiling.'); }} className="flex items-center gap-1 px-1.5 py-px rounded-md bg-green-500/10 border border-green-500/20 text-green-500 cursor-pointer hover:bg-green-500/20 transition-colors whitespace-nowrap"><Shield size={9} /><span className="text-[9px] font-bold">E2EE</span></div></div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <div className="relative"><button onClick={handleOpenDiary} className={`p-2 rounded-full transition-all duration-300 group ${hasNewDiary ? 'text-white' : 'text-gray-400 hover:text-white'}`}><Book size={18} className={hasNewDiary ? "animate-pulse drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]" : ""} />{hasNewDiary && (<span className={badgeStyle}></span>)}</button></div>
                <button onClick={fetchDailyQuote} className="p-2 text-gray-400 hover:text-[#7F5CFF] relative group"><Calendar size={18} /><span className={badgeStyle}></span></button>
                <button onClick={() => setShowMenu(!showMenu)} className="p-2 text-gray-400 hover:text-white relative group"><MoreVertical size={18} /><span className={badgeStyle}></span></button>
                {showMenu && (<div className="absolute top-12 right-0 mt-2 w-48 bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl z-50 flex flex-col p-1"><button onClick={handleEditName} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-white/5 rounded-xl"><UserPen size={16} /> {userName || ui.editName}</button><button onClick={handleReset} className="flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 rounded-xl"><RotateCcw size={16} /> {ui.reset}</button></div>)}
              </div>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-[1px] bg-white/5"><div className={`h-full ${levelInfo.barColor} shadow-[0_0_10px_currentColor] transition-all duration-500`} style={{ width: `${progressPercent}%` }}/></div>
          </header>

          <div className="flex-none bg-[#0a0a0a]/90 backdrop-blur-md border-b border-white/5 py-2 px-4 flex justify-center items-center z-10">
             <div className={`text-xs font-medium tracking-wide flex items-center gap-2 ${interactionCount >= 100 ? 'text-[#7F5CFF]' : 'text-gray-400'}`}>
                {interactionCount < 100 ? <Lock size={12} /> : <Sparkles size={12} />}
                <span>{getUnlockHint()}</span>
             </div>
          </div>

          <main className="flex-1 overflow-y-auto px-4 py-6 space-y-6 scroll-smooth">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-60">
                <div className={`w-24 h-24 rounded-full bg-gradient-to-b from-white/5 to-transparent flex items-center justify-center text-5xl mb-2 border border-white/5 shadow-[0_0_30px_rgba(0,0,0,0.5)] animate-pulse overflow-hidden`}>{currentP.avatar.startsWith('/') ? (<img src={currentP.avatar} alt={currentP.name} className="w-full h-full object-cover" />) : (<span>{currentP.avatar}</span>)}</div>
                <div className="space-y-2 px-8"><p className="text-white/80 text-lg font-light">{lang === 'zh' ? '我是' : 'I am'} <span className={currentP.color}>{currentP.name}</span>.</p><p className="text-sm text-gray-400 italic font-serif">{currentP.slogan[lang]}</p></div>
                <div className="mt-8 flex flex-col gap-3 items-center">
                  <div className="flex items-center gap-2 text-green-400 bg-green-500/5 px-4 py-2 rounded-lg border border-green-500/10"><Lock size={14} /><span className="text-xs font-medium">{lang === 'zh' ? 'E2EE 端对端加密通道已建立' : 'E2EE Secure Connection Established'}</span></div>
                  <p className="text-[10px] text-gray-500 max-w-[200px] leading-relaxed">{lang === 'zh' ? '您的所有对话私隐受到严格保护。除 AI 分析所需的必要数据外，我们不会向任何第三方透露您的秘密。' : 'Your privacy is strictly protected. No third-party data sharing.'}</p>
                </div>
              </div>
            )}
            
            {messages.map((msg, msgIdx) => {
              const isLastMessage = msgIdx === messages.length - 1;
              const isAI = msg.role !== 'user';
              const isVoice = voiceMsgIds.has(msg.id); 

              // 🔥 核心修复：渲染时移除 Tag (兼容各种格式)
              const contentDisplay = msg.content.replace(CMD_REGEX, '').trim();

              return (
                <div key={msg.id} className={`flex w-full ${!isAI ? 'justify-end' : 'justify-start'} mb-4 animate-[slideUp_0.1s_ease-out]`}>
                  <div className={`max-w-[85%] flex flex-col items-start gap-1`}>
                    <div className={`px-5 py-3.5 text-sm leading-6 shadow-md backdrop-blur-sm rounded-2xl border transition-all duration-300 ${!isAI ? 'bg-gradient-to-br from-[#7F5CFF] to-[#6242db] text-white rounded-tr-sm border-transparent' : isVoice ? 'bg-[#1a1a1a]/90 text-[#7F5CFF] border-[#7F5CFF]/50 shadow-[0_0_20px_rgba(127,92,255,0.2)]' : 'bg-[#1a1a1a]/90 text-gray-200 rounded-tl-sm border-white/5'}`}>
                      {isAI && isVoice && (<div className="flex items-center gap-2 mb-2 pb-2 border-b border-[#7F5CFF]/20 text-[10px] font-bold opacity-90 uppercase tracking-widest">{playingMsgId === msg.id ? <Loader2 size={12} className="animate-spin"/> : <Volume2 size={12} />}<span>Voice Message</span></div>)}
                      {!isAI ? (
                        <ReactMarkdown>{contentDisplay}</ReactMarkdown>
                      ) : (
                        <div className="flex flex-col gap-1">
                           {contentDisplay.split('|||').map((part, partIdx, arr) => {
                              if (!part.trim()) return null;
                              const isLastPart = partIdx === arr.length - 1;
                              const shouldType = isLastMessage && isLoading && isLastPart;
                              
                              if (shouldType) {
                                return <Typewriter key={partIdx} content={part.trim()} isThinking={true} />;
                              }
                              return (
                                <ReactMarkdown key={partIdx} components={{ a: ({ node, href, children, ...props }) => { 
                                    const linkHref = href || '';
                                    if (linkHref.startsWith('#trigger-')) {
                                      const targetPersona = linkHref.replace('#trigger-', '') as PersonaType;
                                      const pConfig = PERSONAS[targetPersona];
                                      if (!pConfig) return <span>{children}</span>;
                                      const colorClass = pConfig.color; 
                                      return (<button onClick={(e) => { e.preventDefault(); e.stopPropagation(); selectPersona(targetPersona); }} className="inline-flex items-center gap-1 mx-1 px-2 py-0.5 rounded-full bg-white/10 border border-white/10 hover:bg-white/20 transition-all transform hover:scale-105 align-middle -mt-0.5" title={`跳转去找 ${targetPersona}`}><span className={`text-[10px] font-bold ${colorClass} opacity-70`}>@</span><span className={`text-xs font-bold ${colorClass} underline decoration-dotted underline-offset-2`}>{children}</span><ArrowUpRight size={10} className={`opacity-70 ${colorClass}`} /></button>);
                                    }
                                    return (<a href={linkHref} {...props} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline hover:text-blue-300 break-all">{children}</a>);
                                } }}>{formatMentions(part.trim())}</ReactMarkdown>
                              );
                           })}
                        </div>
                      )}
                    </div>
                    {isAI && isVoice && playingMsgId !== msg.id && (<button onClick={() => handlePlayAudio(contentDisplay, msg.id)} className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-[#7F5CFF] ml-1 transition-colors"><RotateCcw size={10} /> Replay</button>)}
                  </div>
                </div>
              );
            })}
            
            {isLoading && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
               <div className="flex justify-start w-full animate-[slideUp_0.2s_ease-out]"><div className="flex items-center gap-2 bg-[#1a1a1a] px-4 py-3 rounded-2xl rounded-tl-sm border border-white/5"><div className="flex gap-1"><div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} /><div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} /><div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} /></div><span className="text-xs text-gray-500 ml-1">{ui.loading}</span></div></div>
            )}
            <div ref={messagesEndRef} className="h-4" />
          </main>

          <footer className="flex-none p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            {messages.length <= 2 && !isLoading && (
              <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide">
                {QUICK_REPLIES_DATA[activePersona][lang].map((reply, idx) => (
                  <button key={idx} onClick={() => { 
                      const msg: Message = { id: Date.now().toString(), role: 'user', content: reply }; 
                      append(msg, { body: { persona: activePersona, language: lang, interactionCount, userName, envInfo: getLocalTimeInfo(), userId: getDeviceId() } }); 
                      posthog.capture('use_quick_reply', { persona: activePersona, content: reply }); 
                      if (audioRef.current) { audioRef.current.src = SILENT_AUDIO; audioRef.current.play().catch(() => {}); }
                  }} className="flex-shrink-0 px-3 py-1.5 bg-[#1a1a1a] border border-white/10 rounded-full text-xs text-gray-400 hover:text-white hover:border-[#7F5CFF] hover:bg-[#7F5CFF]/10 transition-all whitespace-nowrap">{reply}</button>
                ))}
              </div>
            )}
            <form onSubmit={onFormSubmit} className="relative flex items-center gap-2 bg-[#151515] p-2 rounded-[24px] border border-white/10 shadow-2xl focus-within:border-[#7F5CFF]/50 transition-all duration-300">
              <div className="relative flex items-center justify-center mr-1">
                {!forceVoice && voiceTrial > 0 && interactionCount < 50 && (
                   <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 px-2 py-1 bg-[#7F5CFF] text-white text-[10px] rounded-lg font-bold whitespace-nowrap animate-bounce shadow-[0_0_10px_#7F5CFF] z-20 pointer-events-none after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-4 after:border-transparent after:border-t-[#7F5CFF]">{lang === 'zh' ? '开启语音' : 'Voice Mode'}</div>
                )}
                <button type="button" onClick={() => { if (interactionCount < 50 && voiceTrial <= 0) { alert(lang === 'zh' ? '🔒 需要信任度 Lv.2 (50次互动) 解锁无限语音' : '🔒 Reach Lv.2 to unlock infinite voice.'); return; } setForceVoice(!forceVoice); posthog.capture('toggle_voice_mode', { enabled: !forceVoice }); }} className={`p-2 rounded-full transition-all relative group ${forceVoice ? 'bg-[#7F5CFF] text-white shadow-[0_0_15px_#7F5CFF] scale-105' : 'text-gray-400 hover:text-white bg-white/5 border border-white/5'}`}>
                  <Headphones size={18} />
                  {interactionCount < 50 && voiceTrial > 0 && (<span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[9px] text-white font-bold border border-[#151515] animate-pulse">{voiceTrial}</span>)}
                  {interactionCount >= 50 && forceVoice && (<span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-green-500 shadow-[0_0_5px_#22c55e]"></span>)}
                </button>
                
                {/* 🔥 Sol 专属申请按钮 */}
                {activePersona === 'Sol' && (
                  <button
                    type="button"
                    onClick={() => setShowFocusOffer(true)}
                    className="ml-2 p-2 rounded-full text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-all shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                    title={lang === 'zh' ? "申请专注监管" : "Request Focus Protocol"}
                  >
                    <Ban size={18} />
                  </button>
                )}
              </div>

              <input type="text" value={input} onChange={handleInputChange} placeholder={ui.placeholder} className="flex-1 bg-transparent text-white text-sm px-4 py-2 focus:outline-none placeholder-gray-600" />
              <button type="submit" disabled={!input.trim() || isLoading} className="p-3 bg-[#7F5CFF] text-white rounded-full hover:bg-[#6b4bd6] disabled:opacity-30 transition-all transform active:scale-95"><Send size={18} fill="white" /></button>
            </form>
          </footer>
        </div>
      )}
    </div>
  );
}