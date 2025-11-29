'use client';

import { useState, useRef, useEffect } from 'react';
import { useChat } from 'ai/react';
import { Message } from 'ai';
import posthog from 'posthog-js';
import html2canvas from 'html2canvas';
import dynamic from 'next/dynamic'; // 🔥 引入 dynamic

import { 
  Send, Calendar, ChevronLeft, MoreVertical, RotateCcw, 
  UserPen, Brain, Book, Lock, Sparkles, Shield, 
  Volume2, Loader2, Headphones, Ban, ArrowUpRight, 
  MessageCircle, Bug, Zap, Heart, Globe, Download, Coffee
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

// --- 引入拆分后的组件 ---
import { PERSONAS, PersonaType, UI_TEXT, LangType, QUICK_REPLIES_DATA, SOL_TAUNTS, RIN_TASKS } from '@/lib/constants';
import { getDeviceId } from '@/lib/utils';
import { getMemory, saveMemory, getVoiceIds, saveVoiceIds } from '@/lib/storage';
import { getLocalTimeInfo, getSimpleWeather } from '@/lib/env';
import { getPersonaStatus } from '@/lib/status';

// UI 组件
import { BootScreen } from '@/components/ui/BootScreen';
import { Typewriter } from '@/components/ui/Typewriter';

// 功能组件
import { FocusOverlay } from '@/components/features/FocusOverlay';
import { StickyNoteOverlay } from '@/components/features/StickyNoteOverlay';

// 🔥 性能优化：所有模态框改为动态懒加载 (Lazy Load)
// 这样首页加载时不会下载这些弹窗的代码，点击时才加载
const TriageModal = dynamic(() => import('@/components/modals/SystemModals').then(mod => mod.TriageModal), { ssr: false });
const FocusOfferModal = dynamic(() => import('@/components/modals/SystemModals').then(mod => mod.FocusOfferModal), { ssr: false });
const DonateModal = dynamic(() => import('@/components/modals/SystemModals').then(mod => mod.DonateModal), { ssr: false });
const LangSetupModal = dynamic(() => import('@/components/modals/SystemModals').then(mod => mod.LangSetupModal), { ssr: false });
const NameModal = dynamic(() => import('@/components/modals/SystemModals').then(mod => mod.NameModal), { ssr: false });
const FeedbackModal = dynamic(() => import('@/components/modals/SystemModals').then(mod => mod.FeedbackModal), { ssr: false });
const UpdateModal = dynamic(() => import('@/components/modals/SystemModals').then(mod => mod.UpdateModal), { ssr: false });

const DailyQuoteModal = dynamic(() => import('@/components/modals/ContentModals').then(mod => mod.DailyQuoteModal), { ssr: false });
const ProfileModal = dynamic(() => import('@/components/modals/ContentModals').then(mod => mod.ProfileModal), { ssr: false });
const DiaryModal = dynamic(() => import('@/components/modals/ContentModals').then(mod => mod.DiaryModal), { ssr: false });
const ShameModal = dynamic(() => import('@/components/modals/ContentModals').then(mod => mod.ShameModal), { ssr: false });
const GloryModal = dynamic(() => import('@/components/modals/ContentModals').then(mod => mod.GloryModal), { ssr: false });

// --- 类型定义 ---
type DailyQuote = { content: string; date: string; persona: string; };
type ViewState = 'selection' | 'chat';

// --- 常量 ---
const CURRENT_VERSION_KEY = 'toughlove_v2.1_sensory_awakening'; // 更新版本号
const LANGUAGE_KEY = 'toughlove_language_confirmed';
const LANG_PREF_KEY = 'toughlove_lang_preference';
const USER_NAME_KEY = 'toughlove_user_name';
const LAST_DIARY_TIME_KEY = 'toughlove_last_diary_time';
const VISITED_KEY = 'toughlove_has_visited';
const LAST_QUOTE_DATE_KEY = 'toughlove_last_quote_view_date';

// Sol Keys
const FOCUS_ACTIVE_KEY = 'toughlove_focus_active';
const FOCUS_REMAINING_KEY = 'toughlove_focus_remaining';
const FOCUS_START_TIME_KEY = 'toughlove_focus_start_time';
const FOCUS_TOTAL_TIME = 25 * 60; 

// Rin Keys
const RIN_ACTIVE_KEY = 'toughlove_rin_active';
const RIN_TASK_KEY = 'toughlove_rin_task';

// Triggers
const CMD_REGEX = /(\n)?\s*(\[|【)CMD\s*:\s*FOCUS_OFFER(\]|】)/gi;
const RIN_CMD_REGEX = /(\n)?\s*(\[|【)CMD\s*:\s*RIN_OFFER(\]|】)/gi;

const SILENT_AUDIO = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';

export default function Home() {
  // ================= State =================
  const [mounted, setMounted] = useState(false);
  const [view, setView] = useState<ViewState>('selection');
  const [activePersona, setActivePersona] = useState<PersonaType>('Ash');
  const [lang, setLang] = useState<LangType>('zh');
  
  // Modals Visibility
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
  const [showShameModal, setShowShameModal] = useState(false);
  const [showGloryModal, setShowGloryModal] = useState(false);

  // Focus Mode (Sol)
  const [showFocusOffer, setShowFocusOffer] = useState(false);
  const [isFocusActive, setIsFocusActive] = useState(false);
  const [focusRemaining, setFocusRemaining] = useState(0);
  const [isFocusPaused, setIsFocusPaused] = useState(false);
  const [focusWarning, setFocusWarning] = useState<string | null>(null);
  const [tauntIndex, setTauntIndex] = useState(0);

  // Sticky Note (Rin)
  const [showStickyNote, setShowStickyNote] = useState(false);
  const [currentStickyTask, setCurrentStickyTask] = useState("");

  // Data
  const [quoteData, setQuoteData] = useState<DailyQuote | null>(null);
  const [profileData, setProfileData] = useState<{tags: string[], diagnosis: string} | null>(null);
  const [shameData, setShameData] = useState<{name: string, duration: number, date: string} | null>(null);
  const [gloryData, setGloryData] = useState<{name: string, task: string, date: string} | null>(null);
  const [diaryContent, setDiaryContent] = useState("");
  const [feedbackText, setFeedbackText] = useState("");
  const [userName, setUserName] = useState("");
  const [tempName, setTempName] = useState("");
  const [interactionCount, setInteractionCount] = useState(0);
  const [tick, setTick] = useState(0);
  const [currentWeather, setCurrentWeather] = useState("");

  // Loading
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

  const ui = UI_TEXT[lang];
  const currentP = PERSONAS[activePersona];
  const badgeStyle = "absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-[#1a1a1a] animate-pulse";

  // Helpers
  const getTrustKey = (p: string) => `toughlove_trust_${p}`;
  const getDiaryKey = (p: string) => `toughlove_diary_${p}_${new Date().toISOString().split('T')[0]}`;
  const formatMentions = (text: string) => text.replace(/\b(Ash|Rin|Sol|Vee|Echo)\b/g, (match) => `[${match}](#trigger-${match})`);

  // Level Logic
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

  // Async Actions
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
  const downloadShameCard = (ref: any) => downloadCard(ref, `ToughLove_Shame.png`);
  const downloadGloryCard = (ref: any) => downloadCard(ref, `ToughLove_Glory.png`);

  // Sol Logic
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
        localStorage.setItem(FOCUS_START_TIME_KEY, Date.now().toString());
      }
      posthog.capture('focus_mode_start'); 
  };
  
  const giveUpFocus = () => { 
      if (confirm(ui.giveUpConfirm)) {
          const startTimeStr = localStorage.getItem(FOCUS_START_TIME_KEY);
          const startTime = startTimeStr ? parseInt(startTimeStr) : Date.now();
          const durationMin = Math.max(1, Math.floor((Date.now() - startTime) / 60000));

          setShameData({
            name: userName || ui.defaultName,
            duration: durationMin,
            date: new Date().toLocaleDateString()
          });

          endFocusMode(); 
          setShowShameModal(true);
          posthog.capture('focus_mode_giveup', { duration: durationMin }); 
      } 
  };

  // Rin Logic
  const triggerRinProtocol = () => {
    if (isFocusActive) return;
    const tasks = RIN_TASKS[lang] || RIN_TASKS['zh'];
    const randomTask = tasks[Math.floor(Math.random() * tasks.length)];
    
    setCurrentStickyTask(randomTask);
    setShowStickyNote(true);
    
    if (typeof window !== 'undefined') {
        localStorage.setItem(RIN_ACTIVE_KEY, 'true');
        localStorage.setItem(RIN_TASK_KEY, randomTask);
    }
    posthog.capture('rin_prescription_triggered');
  };

  const handleStickyComplete = () => {
    setShowStickyNote(false);
    localStorage.removeItem(RIN_ACTIVE_KEY);
    localStorage.removeItem(RIN_TASK_KEY);

    const shortTask = currentStickyTask.split('。')[0] || "秘密任务";
    setGloryData({
        name: userName || ui.defaultName,
        task: shortTask,
        date: new Date().toLocaleDateString()
    });

    setTimeout(() => setShowGloryModal(true), 600);
    posthog.capture('rin_prescription_completed');
  };

  const handleStickyGiveUp = () => {
    setShowStickyNote(false);
    localStorage.removeItem(RIN_ACTIVE_KEY);
    localStorage.removeItem(RIN_TASK_KEY);
    posthog.capture('rin_prescription_given_up');
  };

  // UI Handlers
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

  // UseChat Hook
  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages, setInput, append } = useChat({
    api: '/api/chat',
    onError: (err) => console.error("Stream Error:", err),
    onFinish: (message) => {
      const newCount = interactionCount + 1;
      setInteractionCount(newCount);
      localStorage.setItem(getTrustKey(activePersona), newCount.toString());
      if (newCount === 1 || newCount === 50 || newCount === 100) posthog.capture('trust_milestone', { persona: activePersona, level: newCount });
      
      const isAI = message.role === 'assistant';
      if (isAI) {
        if (CMD_REGEX.test(message.content)) setShowFocusOffer(true);
        if (RIN_CMD_REGEX.test(message.content)) triggerRinProtocol();
      }

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
         const cleanText = message.content.replace(CMD_REGEX, '').replace(RIN_CMD_REGEX, '');
         handlePlayAudio(cleanText, message.id);
      }
    }
  });

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

  // Effects
  const prevLoadingRef = useRef(false);
  useEffect(() => {
    const wasLoading = prevLoadingRef.current;
    if (wasLoading && !isLoading && messages.length > 0) { 
      const cleanMsgs = messages.map(m => ({ 
          ...m, 
          content: m.content.replace(CMD_REGEX, '').replace(RIN_CMD_REGEX, '') 
      }));
      syncToCloud(cleanMsgs); 
    }
    prevLoadingRef.current = isLoading;
  }, [isLoading, messages]);

  useEffect(() => { 
    if (messages.length > 0 && view === 'chat') { 
      const cleanMsgs = messages.map(m => ({ 
          ...m, 
          content: m.content.replace(CMD_REGEX, '').replace(RIN_CMD_REGEX, '') 
      }));
      saveMemory(activePersona, cleanMsgs); 
    } 
  }, [messages, activePersona, view]);
  
  useEffect(() => { scrollToBottom(); }, [messages, isLoading, view]);

  useEffect(() => {
    if (messages.length > 0) {
        const lastMsg = messages[messages.length - 1];
        if (lastMsg.role === 'assistant') {
            if (CMD_REGEX.test(lastMsg.content)) setShowFocusOffer(true);
            if (RIN_CMD_REGEX.test(lastMsg.content)) triggerRinProtocol();
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

    // Restore Sol
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

    // Restore Rin
    const isRinActive = localStorage.getItem(RIN_ACTIVE_KEY);
    const savedTask = localStorage.getItem(RIN_TASK_KEY);
    if (isRinActive === 'true' && savedTask) {
        setCurrentStickyTask(savedTask);
        setShowStickyNote(true);
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
        tauntInterval = setInterval(() => { 
            setTauntIndex(prev => (prev + 1) % SOL_TAUNTS[lang].length);
        }, 4000);
    }
    return () => { clearInterval(interval); clearInterval(tauntInterval); document.removeEventListener("visibilitychange", handleVisibilityChange); };
  }, [isFocusActive, isFocusPaused, lang]);

  useEffect(() => { if (mounted) { const ids = getVoiceIds(activePersona); setVoiceMsgIds(new Set(ids)); } }, [activePersona, mounted]);

  if (!mounted) return <BootScreen />;

  return (
    <div className="relative flex flex-col h-[100dvh] bg-[#050505] text-gray-100 overflow-hidden font-sans selection:bg-[#7F5CFF] selection:text-white">
      <div className="absolute top-[-20%] left-0 right-0 h-[500px] bg-gradient-to-b from-[#7F5CFF]/10 to-transparent blur-[100px] pointer-events-none" />
      <audio ref={audioRef} className="hidden" playsInline />

      {/* Features */}
      {isFocusActive && (
        <FocusOverlay 
          isFocusPaused={isFocusPaused}
          focusRemaining={focusRemaining}
          focusWarning={focusWarning}
          tauntIndex={tauntIndex}
          lang={lang}
          onGiveUp={giveUpFocus}
        />
      )}

      {showStickyNote && (
        <StickyNoteOverlay 
          task={currentStickyTask} 
          lang={lang} 
          onComplete={handleStickyComplete}
          onGiveUp={handleStickyGiveUp}
        />
      )}

      {/* Modals */}
      <FocusOfferModal show={showFocusOffer} lang={lang} onStart={startFocusMode} onCancel={() => setShowFocusOffer(false)} />
      <TriageModal show={showTriage} lang={lang} onSelect={handleTriageSelection} />
      <LangSetupModal show={showLangSetup} lang={lang} onConfirm={confirmLanguage} />
      <NameModal show={showNameModal} onClose={() => setShowNameModal(false)} tempName={tempName} setTempName={setTempName} onSave={saveUserName} ui={ui} />
      <DonateModal show={showDonateModal} onClose={() => setShowDonateModal(false)} lang={lang} currentP={currentP} onBribe={handleBribeSuccess} onExternal={goBMAC} />
      <FeedbackModal show={showFeedbackModal} onClose={() => setShowFeedbackModal(false)} text={feedbackText} setText={setFeedbackText} onSubmit={handleFeedbackSubmit} lang={lang} />
      <UpdateModal show={showUpdateModal} onClose={dismissUpdate} ui={ui} onTry={handleTryNewFeature} />

      {/* Dynamic Content Modals */}
      <div ref={quoteCardRef} className="contents"><DailyQuoteModal show={showQuote} onClose={() => setShowQuote(false)} data={quoteData} isLoading={isQuoteLoading} onDownload={() => downloadQuoteCard()} isGenerating={isGeneratingImg} ui={ui} activePersona={activePersona} /></div>
      <div ref={profileCardRef} className="contents"><ProfileModal show={showProfile} onClose={() => setShowProfile(false)} data={profileData} isLoading={isProfileLoading} onDownload={() => downloadProfileCard()} isGenerating={isGeneratingImg} ui={ui} mounted={mounted} deviceId={getDeviceId()} /></div>
      
      <DiaryModal show={showDiary} onClose={() => setShowDiary(false)} content={diaryContent} isLoading={isDiaryLoading} currentP={currentP} />
      <ShameModal show={showShameModal} onClose={() => setShowShameModal(false)} data={shameData} lang={lang} onDownload={downloadShameCard} isGenerating={isGeneratingImg} ui={ui} />
      <GloryModal show={showGloryModal} onClose={() => setShowGloryModal(false)} data={gloryData} lang={lang} onDownload={downloadGloryCard} isGenerating={isGeneratingImg} ui={ui} />
      
      {/* Views */}
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

      {/* VIEW: CHAT */}
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
                {showMenu && (
                  <div className="absolute top-12 right-0 mt-2 w-48 bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl z-50 flex flex-col p-1 animate-[fadeIn_0.1s_ease-out]">
                    <button onClick={handleEditName} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-white/5 rounded-xl transition-colors text-left"><UserPen size={16} /> {userName || ui.editName}</button>
                    <button onClick={toggleLanguage} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-white/5 rounded-xl transition-colors text-left"><Globe size={16} /> {ui.language}</button>
                    <button onClick={handleInstall} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-white/5 rounded-xl transition-colors text-left"><Download size={16} /> {ui.install}</button>
                    <button onClick={handleDonate} className="flex items-center gap-3 px-4 py-3 text-sm text-yellow-500 hover:bg-white/5 rounded-xl transition-colors text-left"><Coffee size={16} /> {ui.buyCoffee}</button>
                    <button onClick={() => setShowFeedbackModal(true)} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-white/5 rounded-xl transition-colors text-left"><Bug size={16} /> {ui.feedback}</button>
                    <button onClick={() => setShowUpdateModal(true)} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-white/5 rounded-xl transition-colors text-left"><Sparkles size={16} /> {ui.about}</button>
                    <div className="h-px bg-white/5 my-1" />
                    <button onClick={handleReset} className="flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 rounded-xl transition-colors text-left"><RotateCcw size={16} /> {ui.reset}</button>
                  </div>
                )}
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

              const contentDisplay = msg.content.replace(CMD_REGEX, '').replace(RIN_CMD_REGEX, '').trim();

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
            {messages.length <= 2 && !isLoading && QUICK_REPLIES_DATA[activePersona] && (
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