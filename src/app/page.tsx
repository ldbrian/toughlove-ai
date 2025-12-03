'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useChat } from 'ai/react';
import { Message } from 'ai';
import posthog from 'posthog-js';
import html2canvas from 'html2canvas';

import { 
  Send, ChevronLeft, MoreVertical, RotateCcw, 
  UserPen, Brain, Lock, Sparkles, Shield, 
  Volume2, Loader2, Ban, ArrowUpRight, 
  MessageCircle, Bug, Zap, Heart, Globe, Download, Coffee,
  Mic, MicOff, ShoppingBag, Keyboard, Wand2, Flower2 
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

import { PERSONAS, PersonaType, UI_TEXT, LangType, RIN_TASKS, ShopItem, SOL_TAUNTS, TAROT_DECK } from '@/lib/constants';
import { getDeviceId } from '@/lib/utils';
import { getMemory, saveMemory, getVoiceIds, saveVoiceIds } from '@/lib/storage';
import { getLocalTimeInfo, getSimpleWeather } from '@/lib/env';
import { getPersonaStatus } from '@/lib/status';

import { BootScreen } from '@/components/ui/BootScreen';
import { Typewriter } from '@/components/ui/Typewriter';
import { FocusOverlay } from '@/components/features/FocusOverlay';
import { StickyNoteOverlay } from '@/components/features/StickyNoteOverlay';

import { AnnouncementModal } from '@/components/modals/AnnouncementModal';
import { FocusOfferModal, DonateModal, LangSetupModal, NameModal, FeedbackModal, InstallModal } from '@/components/modals/SystemModals';
import { DailyQuoteModal, DiaryModal, ShameModal, GloryModal, EnergyModal } from '@/components/modals/ContentModals';
import { ProfileModal } from '@/components/modals/ProfileModal'; 
import { ShopModal } from '@/components/modals/ShopModal';
import { DailyBriefingModal } from '@/components/modals/DailyBriefingModal';
import { OnboardingModal } from '@/components/modals/OnboardingModal'; 

const WALLPAPER_PRESETS: Record<string, any> = {
  'BG_CYBER_NIGHT': { backgroundImage: `url('/wallpapers/ash_clinic.jpg')`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundBlendMode: 'overlay', backgroundColor: 'rgba(0,0,0,0.7)' },
  'BG_RIN_ROOM': { backgroundImage: `url('/wallpapers/rin_room.jpg')`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  'BG_SOL_ROOM': { backgroundImage: `url('/wallpapers/sol_room.jpg')`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundColor: 'rgba(0,0,0,0.8)' },
  'BG_VEE_ROOM': { backgroundImage: `url('/wallpapers/vee_room.jpg')`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundColor: 'rgba(0,0,0,0.6)' },
  'BG_ECHO_ROOM': { backgroundImage: `url('/wallpapers/echo_room.jpg')`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundColor: 'rgba(0,0,0,0.7)' },
};

const LANGUAGE_KEY = 'toughlove_language_confirmed';
const LANG_PREF_KEY = 'toughlove_lang_preference';
const USER_NAME_KEY = 'toughlove_user_name';
const VISITED_KEY = 'toughlove_has_visited'; 
const UPDATE_SEEN_KEY = 'toughlove_v2.3.0_update_seen'; 
const FOCUS_ACTIVE_KEY = 'toughlove_focus_active';
const FOCUS_REMAINING_KEY = 'toughlove_focus_remaining';
const FOCUS_START_TIME_KEY = 'toughlove_focus_start_time';
const FOCUS_TOTAL_TIME = 25 * 60; 
const RIN_ACTIVE_KEY = 'toughlove_rin_active';
const RIN_TASK_KEY = 'toughlove_rin_task';
const CMD_REGEX = /(\n)?\s*(\[|【)CMD\s*:\s*FOCUS_OFFER(\]|】)/gi;
const RIN_CMD_REGEX = /(\n)?\s*(\[|【)CMD\s*:\s*RIN_OFFER(\]|】)/gi;
const SILENT_AUDIO = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';

type DailyQuote = { content: string; date: string; persona: string; };
type ViewState = 'selection' | 'chat';
interface QuickReply { id: string; label: string; payload: string; icon?: React.ReactNode; }

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [isCheckingFate, setIsCheckingFate] = useState(false); 
  const [view, setView] = useState<ViewState>('selection');
  const [activePersona, setActivePersona] = useState<PersonaType>('Ash');
  const [lang, setLang] = useState<LangType>('zh');
  
  const [showLangSetup, setShowLangSetup] = useState(false);
  const [showAnnouncement, setShowAnnouncement] = useState(false);
  const [showBriefing, setShowBriefing] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false); 
  const [showQuote, setShowQuote] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false); 
  const [showMenu, setShowMenu] = useState(false);
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showDiary, setShowDiary] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showShameModal, setShowShameModal] = useState(false);
  const [showGloryModal, setShowGloryModal] = useState(false);
  const [showEnergyModal, setShowEnergyModal] = useState(false); 
  const [showShop, setShowShop] = useState(false);
  const [showFocusOffer, setShowFocusOffer] = useState(false);

  const [userRin, setUserRin] = useState(0); 
  const [isBuying, setIsBuying] = useState(false);
  const [inventory, setInventory] = useState<string[]>([]);
  const [wallpapers, setWallpapers] = useState<Record<string, string>>({});
  const [hasSeenShop, setHasSeenShop] = useState(false); 
  const [forcedBriefingSpeaker, setForcedBriefingSpeaker] = useState<PersonaType | null>(null);

  const [isFocusActive, setIsFocusActive] = useState(false);
  const [focusRemaining, setFocusRemaining] = useState(0);
  const [isFocusPaused, setIsFocusPaused] = useState(false);
  const [focusWarning, setFocusWarning] = useState<string | null>(null);
  const [tauntIndex, setTauntIndex] = useState(0);
  const [showStickyNote, setShowStickyNote] = useState(false);
  const [currentStickyTask, setCurrentStickyTask] = useState("");

  const [isRecording, setIsRecording] = useState(false);
  const [chatInputMode, setChatInputMode] = useState<'guided' | 'free'>('guided');
  const [lastBriefingResult, setLastBriefingResult] = useState<any>(null);
  const [tempBriefingIntro, setTempBriefingIntro] = useState<string | null>(null);
  
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  const [quoteData, setQuoteData] = useState<DailyQuote | null>(null);
  const [briefingData, setBriefingData] = useState<any>(null);
  const [profileData, setProfileData] = useState<{tags: string[], diagnosis: string, radar?: number[], achievements?: any[]} | null>(null);
  const [shameData, setShameData] = useState<{name: string, duration: number, date: string} | null>(null);
  const [gloryData, setGloryData] = useState<{name: string, task: string, date: string} | null>(null);
  const [hasNewGlory, setHasNewGlory] = useState(false); 
  const [gloryUpdateTrigger, setGloryUpdateTrigger] = useState(0);

  const [feedbackText, setFeedbackText] = useState("");
  const [userName, setUserName] = useState("");
  const [tempName, setTempName] = useState("");
  const [interactionCount, setInteractionCount] = useState(0);
  const [tick, setTick] = useState(0);
  const [currentWeather, setCurrentWeather] = useState("");

  const [isQuoteLoading, setIsQuoteLoading] = useState(false);
  const [isGeneratingImg, setIsGeneratingImg] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  
  const [playingMsgId, setPlayingMsgId] = useState<string | null>(null);
  const [voiceMsgIds, setVoiceMsgIds] = useState<Set<string>>(new Set()); 
  const [forceVoice, setForceVoice] = useState(false);
  const [voiceTrial, setVoiceTrial] = useState(3);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const quoteCardRef = useRef<HTMLDivElement>(null);
  const viralPosterRef = useRef<HTMLDivElement>(null); 
  const profileCardRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const ui = UI_TEXT[lang];
  const currentP = PERSONAS[activePersona];

  // Helpers
  const getTrustKey = (p: string) => `toughlove_trust_${p}`;
  const getLevelInfo = (count: number) => {
    if (count < 50) return { level: 1, icon: <Shield size={12} />, bgClass: 'bg-[#0a0a0a]', borderClass: 'border-white/5', barColor: 'bg-gray-500', glowClass: '' };
    if (count < 100) return { level: 2, icon: <Zap size={12} />, bgClass: 'bg-gradient-to-b from-[#0f172a] to-[#0a0a0a]', borderClass: 'border-blue-500/30', barColor: 'bg-blue-500', glowClass: 'shadow-[0_0_30px_rgba(59,130,246,0.1)]' };
    return { level: 3, icon: <Heart size={12} />, bgClass: 'bg-[url("/grid.svg")] bg-fixed bg-[length:50px_50px] bg-[#0a0a0a]', customStyle: { background: 'radial-gradient(circle at 50% -20%, #1e1b4b 0%, #0a0a0a 60%)' }, borderClass: 'border-[#7F5CFF]/40', barColor: 'bg-[#7F5CFF]', glowClass: 'shadow-[0_0_40px_rgba(127,92,255,0.15)]' };
  };
  const currentBgStyle = (view === 'chat' && wallpapers[activePersona] && WALLPAPER_PRESETS[wallpapers[activePersona]]) ? WALLPAPER_PRESETS[wallpapers[activePersona]] : {};
  const levelInfo = getLevelInfo(interactionCount);
  const progressPercent = Math.min(100, (interactionCount / 50) * 100);

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

  const triggerRinProtocol = () => { if (isFocusActive) return; const tasks = RIN_TASKS[lang] || RIN_TASKS['zh']; const randomTask = tasks[Math.floor(Math.random() * tasks.length)]; setCurrentStickyTask(randomTask); setShowStickyNote(true); if (typeof window !== 'undefined') { localStorage.setItem(RIN_ACTIVE_KEY, 'true'); localStorage.setItem(RIN_TASK_KEY, randomTask); } };

  // ----------------------------------------------------------------
  // Handlers (Fixed Order)
  // ----------------------------------------------------------------
  const switchLang = (l: LangType) => { setLang(l); localStorage.setItem(LANG_PREF_KEY, l); };
  const confirmLanguage = (l: LangType) => { setLang(l); localStorage.setItem(LANG_PREF_KEY, l); localStorage.setItem(LANGUAGE_KEY, 'true'); setShowLangSetup(false); };
  const saveUserName = () => { setUserName(tempName.trim()); localStorage.setItem(USER_NAME_KEY, tempName.trim()); setShowNameModal(false); };
  const goBMAC = () => { window.open('https://www.buymeacoffee.com/ldbrian', '_blank'); };
  const handleEditName = () => { setTempName(userName); setShowNameModal(true); setShowMenu(false); };
  const handleDonate = () => { setShowDonateModal(true); setShowMenu(false); };
  const handleFeedbackSubmit = () => { if (!feedbackText.trim()) return; alert('Thanks!'); setFeedbackText(""); setShowFeedbackModal(false); };
  const handleInstall = () => { setShowMenu(false); if (deferredPrompt) { deferredPrompt.prompt(); deferredPrompt.userChoice.then((choiceResult: any) => { setDeferredPrompt(null); }); } else { setShowInstallModal(true); } };

  const selectPersona = async (persona: PersonaType) => { 
      setForceVoice(false); 
      setActivePersona(persona); 
      setView('chat'); 
      setShowMenu(false); 
      const localHistory = getMemory(persona); 
      const localVoiceIds = getVoiceIds(persona); 
      setMessages(localHistory); 
      setVoiceMsgIds(new Set(localVoiceIds)); 
  };
  const backToSelection = () => { setView('selection'); setShowMenu(false); setTick(tick + 1); };

  const checkDailyBriefing = useCallback(() => { const today = new Date().toISOString().split('T')[0]; const lastBriefingDate = localStorage.getItem('toughlove_briefing_date'); const hasVisited = localStorage.getItem(VISITED_KEY); if (lastBriefingDate !== today && hasVisited) { setIsCheckingFate(true); setTimeout(() => { setShowBriefing(true); setIsCheckingFate(false); localStorage.setItem('toughlove_briefing_date', today); }, 1000); } }, []);
  const initStartupSequence = useCallback(() => { const hasSeenUpdate = localStorage.getItem(UPDATE_SEEN_KEY); if (!hasSeenUpdate) { setTimeout(() => setShowAnnouncement(true), 500); } else { checkDailyBriefing(); } }, [checkDailyBriefing]);
  const handleAnnouncementClose = () => { setShowAnnouncement(false); localStorage.setItem(UPDATE_SEEN_KEY, 'true'); localStorage.setItem('toughlove_broadcast_closed_v2.3', 'true'); setTimeout(() => checkDailyBriefing(), 300); };

  const handleOnboardingFinish = (profile: any) => { localStorage.setItem('toughlove_user_profile', JSON.stringify(profile)); localStorage.setItem(VISITED_KEY, 'true'); localStorage.setItem(UPDATE_SEEN_KEY, 'true'); setForcedBriefingSpeaker(profile.dominant); setShowOnboarding(false); setTimeout(() => { setShowBriefing(true); }, 500); };

  const syncToCloud = async (currentMessages: any[]) => { try { await fetch('/api/sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: getDeviceId(), persona: activePersona, messages: currentMessages }) }); } catch (e) {} };
  const handleReset = () => { if (confirm(ui.resetConfirm)) { setMessages([]); saveMemory(activePersona, []); localStorage.removeItem(`toughlove_voice_ids_${activePersona}`); setVoiceMsgIds(new Set()); syncToCloud([]); setShowMenu(false); setInteractionCount(0); localStorage.setItem(getTrustKey(activePersona), '0'); const p = PERSONAS[activePersona]; const greetings = p.greetings[lang]; const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)]; setTimeout(() => { const welcomeMsg: Message = { id: Date.now().toString(), role: 'assistant', content: randomGreeting }; setMessages([welcomeMsg]); saveMemory(activePersona, [welcomeMsg]); syncToCloud([welcomeMsg]); }, 100); } };
  const handleExport = () => { if (messages.length === 0) return; const dateStr = new Date().toLocaleString(); const header = `================================\n${ui.exportFileName}\nDate: ${dateStr}\nPersona: ${currentP.name}\nUser: ${userName || 'Anonymous'}\n================================\n\n`; const body = messages.map(m => { const role = m.role === 'user' ? (userName || 'ME') : currentP.name.toUpperCase(); return `[${role}]:\n${m.content.replace(/\|\|\|/g, '\n')}\n`; }).join('\n--------------------------------\n\n'); const blob = new Blob([header + body], { type: 'text/plain;charset=utf-8' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${ui.exportFileName}_${activePersona}_${new Date().toISOString().split('T')[0]}.txt`; a.click(); URL.revokeObjectURL(url); setShowMenu(false); };

  const handleClaimSalary = async (amount: number) => { if (amount <= 0) return; setUserRin(prev => prev + amount); try { const currentBalance = parseInt(localStorage.getItem('toughlove_rin_balance') || '0'); localStorage.setItem('toughlove_rin_balance', (currentBalance + amount).toString()); await fetch('/api/wallet/add', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: getDeviceId(), amount: amount, reason: 'daily_briefing' }) }); } catch (e) { console.warn("Salary sync failed"); } };
  const handleBriefingDataLoaded = useCallback((data: any) => { setBriefingData((prev: any) => { if (JSON.stringify(prev) === JSON.stringify(data)) return prev; return data; }); }, []);
  const handleBriefingJump = (payload: any) => { const { persona, systemContext, visibleReaction, archetype } = payload; const history = getMemory(persona); history.push({ id: Date.now().toString(), role: 'system', content: systemContext } as any); saveMemory(persona, history); selectPersona(persona); setTempBriefingIntro(visibleReaction); setChatInputMode('guided'); setLastBriefingResult({ persona, archetype }); };
  const handleBribeSuccess = async () => { setShowDonateModal(false); localStorage.setItem('toughlove_is_patron', 'true'); const bribeMsg: Message = { id: Date.now().toString(), role: 'user', content: lang === 'zh' ? "☕️ (给你买了一杯热咖啡，请笑纳...)" : "☕️ (Bought you a coffee. Be nice...)" }; await append(bribeMsg); };
  
  const handleBuyItem = async (item: ShopItem) => { setIsBuying(true); try { const res = await fetch('/api/shop/buy', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: getDeviceId(), itemId: item.id }) }); let newBalance = userRin; if (res.ok) { const data = await res.json(); newBalance = data.newBalance; } else { if (userRin >= item.price) { newBalance = userRin - item.price; localStorage.setItem('toughlove_rin_balance', newBalance.toString()); } else { throw new Error('Insufficient funds (Local)'); } } setUserRin(newBalance); setInventory(prev => [...prev, item.id]); if (item.effect === 'ASH_MOOD_SOFT') { localStorage.setItem('toughlove_ash_mood', 'soft'); alert(lang === 'zh' ? 'Ash 喝了咖啡，心情变好了。' : 'Ash drank the latte.'); } else if (item.type === 'visual' && item.effect && WALLPAPER_PRESETS[item.effect]) { setWallpapers(prev => { const newMap = { ...prev, [activePersona]: item.effect! }; localStorage.setItem('toughlove_wallpapers_map', JSON.stringify(newMap)); return newMap; }); alert(lang === 'zh' ? `已应用专属背景：${item.name.zh}` : `Applied background: ${item.name.en}`); } else if (item.effect === 'REMOVE_SHAME') { alert(lang === 'zh' ? 'Sol 的赦免生效。耻辱记录已清除。' : 'Pardon granted. Shame cleared.'); } setShowShop(false); } catch (e) { alert(lang === 'zh' ? '交易失败：余额不足' : 'Transaction Failed'); } finally { setIsBuying(false); } };
  
  const downloadPoster = async () => { if (!viralPosterRef.current) return; setIsGeneratingImg(true); try { const c = await html2canvas(viralPosterRef.current, { backgroundColor: '#000', scale: 3, useCORS: true, allowTaint: true, logging: true } as any); const url = c.toDataURL("image/png"); const a = document.createElement('a'); a.href = url; a.download = `ToughLove_Fate_${new Date().toISOString().slice(0,10)}.png`; a.click(); } catch (e) { console.error("Save failed:", e); alert("保存失败 (CORS Error)"); } finally { setIsGeneratingImg(false); } };
  const downloadProfileCard = () => downloadCard(profileCardRef, `ToughLove_Profile.png`);
  const downloadShameCard = (ref: any) => downloadCard(ref, `ToughLove_Shame.png`);
  const downloadGloryCard = (ref: any) => downloadCard(ref, `ToughLove_Glory.png`);
  const downloadCard = async (ref: any, name: string) => { if (!ref.current) return; setIsGeneratingImg(true); try { const c = await html2canvas(ref.current, { backgroundColor: '#000', scale: 3, useCORS: true, allowTaint: true } as any); const url = c.toDataURL("image/png"); const a = document.createElement('a'); a.href = url; a.download = name; a.click(); } catch (e) { console.error(e); } finally { setIsGeneratingImg(false); } };

  const handleOpenProfile = async () => { setShowMenu(false); setShowProfile(true); setIsProfileLoading(true); try { const res = await fetch('/api/profile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: getDeviceId(), language: lang }), }); let data = await res.json(); if (!data.radar || data.radar.length === 0) { const base = Math.min(80, interactionCount + 30); data.radar = Array(5).fill(0).map(() => base + Math.random() * 20 - 10); } if (!data.tags || data.tags.length === 0) { data.tags = [lang === 'zh' ? "神秘访客" : "Unknown Visitor"]; } setProfileData(data); } catch (e) { console.error(e); setProfileData({ tags: ["System Error"], diagnosis: "无法连接至精神网络。", radar: [50, 50, 50, 50, 50] }); } finally { setIsProfileLoading(false); } };
  const openShopHandler = () => { setShowShop(true); setHasSeenShop(true); localStorage.setItem('toughlove_has_seen_shop', 'true'); };
  
  // Core Chat Handlers
  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages, setInput, append } = useChat({
    api: '/api/chat',
    onError: (err) => console.error("Stream Error:", err),
    onFinish: (message) => {
      const newCount = interactionCount + 1;
      setInteractionCount(newCount);
      localStorage.setItem(getTrustKey(activePersona), newCount.toString());
      // 🔥 [FIX] Define isAI here locally, as this is a callback scope
      const isAI = message.role === 'assistant';
      if (isAI) { if (CMD_REGEX.test(message.content)) setShowFocusOffer(true); if (RIN_CMD_REGEX.test(message.content)) triggerRinProtocol(); }
      
      // Voice Logic
      const isLevel2 = newCount >= 50; 
      let shouldPlay = false;
      if (forceVoice) { 
          if (isLevel2) shouldPlay = true; 
          else if (voiceTrial > 0) { const left = voiceTrial - 1; setVoiceTrial(left); localStorage.setItem('toughlove_voice_trial', left.toString()); shouldPlay = true; if (left === 0) setForceVoice(false); } else { shouldPlay = false; setForceVoice(false); } 
      } else { 
          const isLucky = Math.random() < 0.3; const isShort = message.content.length < 120; if (isLevel2 && isLucky && isShort) shouldPlay = true; 
      }
      
      if (isAI && shouldPlay) { 
          setVoiceMsgIds(prev => { const n = new Set(prev).add(message.id); saveVoiceIds(activePersona, Array.from(n)); return n; }); 
          const cleanText = message.content.replace(CMD_REGEX, '').replace(RIN_CMD_REGEX, ''); 
          handlePlayAudio(cleanText, message.id); 
      }
    }
  });

  const startVoiceInput = () => { const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition; if (!SpeechRecognition) { alert("Browser does not support voice."); return; } const recognition = new SpeechRecognition(); recognition.lang = lang === 'zh' ? 'zh-CN' : 'en-US'; recognition.onstart = () => setIsRecording(true); recognition.onend = () => setIsRecording(false); recognition.onresult = (event: any) => { const transcript = event.results[0][0].transcript; if (showDiary) alert(`Voice: ${transcript}`); else setInput(prev => prev + transcript); }; recognition.start(); };
  const handleQuickReply = async (reply: QuickReply) => { if (audioRef.current) { audioRef.current.src = SILENT_AUDIO; audioRef.current.play().catch(err => {}); } await append({ id: Date.now().toString(), role: 'user', content: reply.payload }); };
  const onFormSubmit = (e: React.FormEvent) => { e.preventDefault(); if (audioRef.current) { audioRef.current.src = SILENT_AUDIO; audioRef.current.play().catch(err => {}); } const timeData = getLocalTimeInfo(); const envInfo = { time: timeData.localTime, weekday: lang === 'zh' ? timeData.weekdayZH : timeData.weekdayEN, phase: timeData.lifePhase, weather: currentWeather }; const ashMood = localStorage.getItem('toughlove_ash_mood'); handleSubmit(e, { options: { body: { persona: activePersona, language: lang, interactionCount, userName, envInfo, userId: getDeviceId(), activeBuffs: ashMood === 'soft' ? ['ASH_MOOD_SOFT'] : [] } } }); };
  const endFocusMode = () => { if (typeof window !== 'undefined') { localStorage.removeItem(FOCUS_ACTIVE_KEY); localStorage.removeItem(FOCUS_REMAINING_KEY); } setIsFocusActive(false); setIsFocusPaused(false); };
  const startFocusMode = () => { setShowFocusOffer(false); setIsFocusActive(true); setFocusRemaining(FOCUS_TOTAL_TIME); if (typeof window !== 'undefined') { localStorage.setItem(FOCUS_ACTIVE_KEY, 'true'); localStorage.setItem(FOCUS_REMAINING_KEY, FOCUS_TOTAL_TIME.toString()); localStorage.setItem(FOCUS_START_TIME_KEY, Date.now().toString()); } posthog.capture('focus_mode_start'); };
  const giveUpFocus = () => { if (confirm(ui.giveUpConfirm)) { const startTime = parseInt(localStorage.getItem(FOCUS_START_TIME_KEY) || Date.now().toString()); const durationMin = Math.max(1, Math.floor((Date.now() - startTime) / 60000)); setShameData({ name: userName || ui.defaultName, duration: durationMin, date: new Date().toLocaleDateString() }); endFocusMode(); setShowShameModal(true); } };
  const handleStickyComplete = async () => { setShowStickyNote(false); if (typeof window !== 'undefined') { localStorage.removeItem(RIN_ACTIVE_KEY); localStorage.removeItem(RIN_TASK_KEY); } const shortTask = currentStickyTask.split('。')[0]; try { await fetch('/api/event', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: getDeviceId(), type: 'glory_rin', content: shortTask, persona: 'Rin' }) }); setHasNewGlory(true); setGloryUpdateTrigger(prev => prev + 1); setUserRin(prev => prev + 50); } catch (e) { console.error(e); } setGloryData({ name: userName || ui.defaultName, task: shortTask, date: new Date().toLocaleDateString() }); setTimeout(() => setShowGloryModal(true), 600); };
  const handleStickyGiveUp = () => { setShowStickyNote(false); localStorage.removeItem(RIN_ACTIVE_KEY); localStorage.removeItem(RIN_TASK_KEY); };
  const triggerRinFromStation = () => { setShowEnergyModal(false); triggerRinProtocol(); };
  const openEnergyStation = () => { setShowEnergyModal(true); setHasNewGlory(false); };
  const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); };
  const formatMentions = (text: string) => text.replace(/\b(Ash|Rin|Sol|Vee|Echo)\b/g, (match) => `[${match}](#trigger-${match})`);
  const getPersonaPreview = (pKey: PersonaType) => { if (!mounted) return { isChatted: false, lastMsg: "", trust: 0, time: "" }; const history = getMemory(pKey); const trust = parseInt(localStorage.getItem(getTrustKey(pKey)) || '0'); if (history.length > 0) { const last = history[history.length - 1]; const visibleMsgs = history.filter(m => m.role !== 'system'); const lastVisible = visibleMsgs[visibleMsgs.length - 1]; return { isChatted: true, lastMsg: lastVisible ? ((lastVisible.role === 'user' ? 'You: ' : '') + lastVisible.content.split('|||')[0]) : "...", trust, time: "Active" }; } return { isChatted: false, lastMsg: PERSONAS[pKey].greetings[lang][0], trust, time: "New" }; };

  // ==========================================
  // Effects
  // ==========================================
  const quickReplies = useMemo<QuickReply[]>(() => {
    const base: QuickReply[] = [
      { id: 'tired', label: lang === 'zh' ? '😪 累了' : '😪 Tired', payload: lang === 'zh' ? '我累了，求放过。' : 'I am tired, give me a break.' },
      { id: 'roast', label: lang === 'zh' ? '🔥 骂醒我' : '🔥 Roast me', payload: lang === 'zh' ? '最近太飘了，骂醒我。' : 'Roast me hard.' },
      { id: 'random', label: lang === 'zh' ? '🎲 随便聊聊' : '🎲 Random', payload: lang === 'zh' ? '随便聊聊吧，最近有什么新闻？' : 'Lets chat randomly.' },
    ];
    if (tempBriefingIntro && activePersona === lastBriefingResult?.persona) {
      base.unshift({
        id: 'tarot_intro',
        label: `🔮 ${lang === 'zh' ? '开始解析' : 'Start Analysis'}`,
        payload: tempBriefingIntro 
      });
    }
    return base.slice(0, 4);
  }, [lang, tempBriefingIntro, lastBriefingResult, activePersona]);

  useEffect(() => { if (isLoading && tempBriefingIntro) { setTempBriefingIntro(null); } }, [isLoading, tempBriefingIntro]);

  useEffect(() => { 
    setMounted(true); 
    window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); setDeferredPrompt(e); });

    let currentLang: LangType = 'zh';
    const savedLang = localStorage.getItem(LANG_PREF_KEY); 
    if (savedLang) { currentLang = savedLang as LangType; setLang(currentLang); } 
    else { const browserLang = navigator.language; currentLang = browserLang.includes('zh') ? 'zh' : 'en'; setLang(currentLang); localStorage.setItem(LANG_PREF_KEY, currentLang); localStorage.setItem(LANGUAGE_KEY, 'true'); }
    if (!localStorage.getItem(VISITED_KEY)) { localStorage.setItem(VISITED_KEY, 'true'); }

    const hasProfile = localStorage.getItem('toughlove_user_profile');
    if (!hasProfile) { setShowOnboarding(true); } 
    else { setTimeout(() => { initStartupSequence(); }, 200); }

    const storedName = localStorage.getItem(USER_NAME_KEY); 
    if (storedName) setUserName(storedName); 
    
    const fetchWallet = async () => { 
        const localBalance = localStorage.getItem('toughlove_rin_balance');
        if (localBalance) setUserRin(parseInt(localBalance));
        try { 
            const res = await fetch(`/api/wallet?userId=${getDeviceId()}`); 
            if(res.ok) { 
                const d = await res.json(); 
                setUserRin(d.balance); 
                localStorage.setItem('toughlove_rin_balance', d.balance.toString());
            } 
        } catch(e){} 
    };
    fetchWallet();

    try { const savedMap = localStorage.getItem('toughlove_wallpapers_map'); if (savedMap) { setWallpapers(JSON.parse(savedMap)); } } catch (e) { console.error("Load wallpapers failed", e); }
    const seenShop = localStorage.getItem('toughlove_has_seen_shop'); if (seenShop) setHasSeenShop(true);
  }, [initStartupSequence]);

  useEffect(() => { if (isFocusActive && focusRemaining <= 0) { fetch('/api/event', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: getDeviceId(), type: 'focus_success_sol', content: `${FOCUS_TOTAL_TIME / 60} min`, persona: 'Sol' }) }); setUserRin(prev => prev + 100); endFocusMode(); } }, [focusRemaining, isFocusActive]);
  useEffect(() => { 
      let interval: NodeJS.Timeout; 
      let tauntInterval: NodeJS.Timeout; 
      const handleVisibilityChange = () => { if (document.hidden && isFocusActive) { setIsFocusPaused(true); document.title = "⚠️ SOL IS WATCHING"; } else if (!document.hidden && isFocusActive) { setIsFocusPaused(false); document.title = "ToughLove AI"; setFocusWarning(lang === 'zh' ? "⚠️ 监测到离开。计时暂停。别想逃。" : "⚠️ Absence detected. Timer paused."); setTimeout(() => setFocusWarning(null), 4000); } }; 
      if (isFocusActive) { document.addEventListener("visibilitychange", handleVisibilityChange); interval = setInterval(() => { if (!isFocusPaused && !document.hidden) { setFocusRemaining(prev => { const next = prev - 1; localStorage.setItem(FOCUS_REMAINING_KEY, next.toString()); return next; }); } }, 1000); tauntInterval = setInterval(() => { setTauntIndex(prev => (prev + 1) % SOL_TAUNTS[lang].length); }, 4000); } 
      return () => { clearInterval(interval); clearInterval(tauntInterval); document.removeEventListener("visibilitychange", handleVisibilityChange); }; 
  }, [isFocusActive, isFocusPaused, lang]);

  const prevLoadingRef = useRef(false);
  useEffect(() => { const wasLoading = prevLoadingRef.current; if (wasLoading && !isLoading && messages.length > 0) { const cleanMsgs = messages.map(m => ({ ...m, content: m.content.replace(CMD_REGEX, '').replace(RIN_CMD_REGEX, '') })); syncToCloud(cleanMsgs); } prevLoadingRef.current = isLoading; }, [isLoading, messages]);
  useEffect(() => { if (messages.length > 0 && view === 'chat') { const cleanMsgs = messages.map(m => ({ ...m, content: m.content.replace(CMD_REGEX, '').replace(RIN_CMD_REGEX, '') })); saveMemory(activePersona, cleanMsgs); } }, [messages, activePersona, view]);
  useEffect(() => { scrollToBottom(); }, [messages, isLoading, view]);
  useEffect(() => { if (messages.length > 0) { const lastMsg = messages[messages.length - 1]; if (lastMsg.role === 'assistant') { if (CMD_REGEX.test(lastMsg.content)) setShowFocusOffer(true); if (RIN_CMD_REGEX.test(lastMsg.content)) triggerRinProtocol(); } } }, [messages]);
  useEffect(() => { if (mounted) { const ids = getVoiceIds(activePersona); setVoiceMsgIds(new Set(ids)); } }, [activePersona, mounted]);

  // ==========================================
  // 6. Render
  // ==========================================
  const renderGlobalMenu = () => (
    <div className="absolute top-12 right-0 mt-2 w-48 bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl z-50 flex flex-col p-1 animate-[fadeIn_0.1s_ease-out]">
      <button onClick={handleEditName} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-white/5 rounded-xl transition-colors text-left">
        <UserPen size={16} /> {userName || ui.editName}
      </button>
      <div className="flex px-2 py-1 gap-2">
         <button onClick={() => switchLang('zh')} className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${lang === 'zh' ? 'bg-white text-black border-white' : 'text-gray-500 border-white/10 hover:border-white/30'}`}>CN</button>
         <button onClick={() => switchLang('en')} className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${lang === 'en' ? 'bg-white text-black border-white' : 'text-gray-500 border-white/10 hover:border-white/30'}`}>EN</button>
      </div>
      <button onClick={handleInstall} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-white/5 rounded-xl transition-colors text-left">
        <Download size={16} /> {ui.install}
      </button>
      <button onClick={handleDonate} className="flex items-center gap-3 px-4 py-3 text-sm text-yellow-500 hover:bg-white/5 rounded-xl transition-colors text-left">
        <Coffee size={16} /> {ui.buyCoffee}
      </button>
      <button onClick={() => setShowFeedbackModal(true)} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-white/5 rounded-xl transition-colors text-left">
        <Bug size={16} /> {ui.feedback}
      </button>
      {view === 'chat' && (
        <>
          <div className="h-px bg-white/5 my-1" />
          <button onClick={handleReset} className="flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 rounded-xl transition-colors text-left">
            <RotateCcw size={16} /> {ui.reset}
          </button>
        </>
      )}
    </div>
  );

  if (!mounted || isCheckingFate) return <BootScreen />;

  return (
    <div className="relative flex flex-col h-screen supports-[height:100dvh]:h-[100dvh] max-h-[100dvh] bg-[#050505] text-gray-100 overflow-hidden font-sans selection:bg-[#7F5CFF] selection:text-white transition-all duration-700" style={currentBgStyle}>
      <div className="absolute top-[-20%] left-0 right-0 h-[500px] bg-gradient-to-b from-[#7F5CFF]/10 to-transparent blur-[100px] pointer-events-none" />
      <audio ref={audioRef} className="hidden" playsInline />

      {isFocusActive && <FocusOverlay isFocusPaused={isFocusPaused} focusRemaining={focusRemaining} focusWarning={focusWarning} tauntIndex={tauntIndex} lang={lang} onGiveUp={giveUpFocus} />}
      {showStickyNote && ( <StickyNoteOverlay task={currentStickyTask} lang={lang} onComplete={handleStickyComplete} onGiveUp={handleStickyGiveUp} /> )}

      <FocusOfferModal show={showFocusOffer} lang={lang} onStart={startFocusMode} onCancel={() => setShowFocusOffer(false)} />
      <LangSetupModal show={showLangSetup} lang={lang} onConfirm={confirmLanguage} />
      <NameModal show={showNameModal} onClose={() => setShowNameModal(false)} tempName={tempName} setTempName={setTempName} onSave={saveUserName} ui={ui} />
      <DonateModal show={showDonateModal} onClose={() => setShowDonateModal(false)} lang={lang} currentP={currentP} onBribe={handleBribeSuccess} onExternal={goBMAC} />
      <FeedbackModal show={showFeedbackModal} onClose={() => setShowFeedbackModal(false)} text={feedbackText} setText={setFeedbackText} onSubmit={handleFeedbackSubmit} lang={lang} />
      <ShopModal show={showShop} onClose={() => setShowShop(false)} userRin={userRin} onBuy={handleBuyItem} lang={lang} isBuying={isBuying} />
      
      <InstallModal show={showInstallModal} onClose={() => setShowInstallModal(false)} lang={lang} />

      <DailyBriefingModal 
        show={showBriefing} 
        onClose={() => { setShowBriefing(false); setForcedBriefingSpeaker(null); }}
        onJumpToChat={handleBriefingJump} 
        lang={lang}
        onDataLoaded={handleBriefingDataLoaded}
        onDownloadPoster={downloadPoster}
        forcedSpeaker={forcedBriefingSpeaker}
        onClaimSalary={handleClaimSalary}
      />

      <div ref={quoteCardRef} className="contents"><DailyQuoteModal show={showQuote} onClose={() => setShowQuote(false)} data={quoteData} isLoading={isQuoteLoading} onDownload={downloadPoster} isGenerating={isGeneratingImg} ui={ui} activePersona={activePersona} /></div>
      
      <div ref={profileCardRef} className="contents">
        <ProfileModal 
            show={showProfile} 
            onClose={() => setShowProfile(false)} 
            data={profileData} 
            isLoading={isProfileLoading} 
            onDownload={downloadProfileCard} 
            ui={ui} 
            deviceId={getDeviceId()} 
            userName={userName} 
        />
      </div>

      <DiaryModal show={showDiary} onClose={() => setShowDiary(false)} userId={mounted ? getDeviceId() : null} lang={lang} />
      <ShameModal show={showShameModal} onClose={() => setShowShameModal(false)} data={shameData} lang={lang} onDownload={downloadShameCard} isGenerating={isGeneratingImg} ui={ui} />
      <GloryModal show={showGloryModal} onClose={() => setShowGloryModal(false)} data={gloryData} lang={lang} onDownload={downloadGloryCard} isGenerating={isGeneratingImg} ui={ui} />
      <EnergyModal show={showEnergyModal} onClose={() => setShowEnergyModal(false)} onTriggerTask={triggerRinFromStation} userId={mounted ? getDeviceId() : null} lang={lang} updateTrigger={gloryUpdateTrigger} />

      <OnboardingModal show={showOnboarding} onFinish={handleOnboardingFinish} lang={lang} />
      <ViralPoster forwardedRef={viralPosterRef} data={briefingData || quoteData} persona={activePersona} lang={lang} />

      <AnnouncementModal show={showAnnouncement} onClose={handleAnnouncementClose} lang={lang} />

      {view === 'selection' && (
        <div className="z-10 flex flex-col h-full w-full max-w-md mx-auto p-4 animate-[fadeIn_0.5s_ease-out]">
          <div className="flex justify-between items-center mb-6 px-2">
            <h1 className="text-xl font-bold tracking-wider flex items-center gap-2">
              <MessageCircle size={20} className="text-[#7F5CFF]" /> Chats
            </h1>
            <div className="flex gap-2">
               <button onClick={() => setShowBriefing(true)} className="text-xs font-bold text-gray-400 hover:text-white border border-white/10 px-3 py-2 rounded-xl flex items-center gap-2 transition-colors hover:bg-white/5">
                 <Sparkles size={14} className="text-indigo-400" />
                 <span>{lang === 'zh' ? '今日运势' : 'Daily Fate'}</span>
               </button>
               <div className="relative">
                 <button onClick={() => setShowMenu(!showMenu)} className="p-2 text-gray-400 hover:text-white border border-white/10 rounded-xl hover:bg-white/5 transition-colors">
                    <MoreVertical size={18} />
                 </button>
                 {showMenu && renderGlobalMenu()}
               </div>
            </div>
          </div>
          <div className="flex flex-col gap-3 overflow-y-auto pb-20 no-scrollbar">
            {(Object.keys(PERSONAS) as PersonaType[]).map((key) => {
              const p = PERSONAS[key]; const info = getPersonaPreview(key); const lv = getLevelInfo(info.trust); const status = getPersonaStatus(key, new Date().getHours()); 
              return (
                <div key={key} onClick={() => selectPersona(key)} className={`group relative p-4 rounded-2xl transition-all duration-200 cursor-pointer flex items-center gap-4 border shadow-sm ${info.isChatted ? 'bg-[#111] hover:bg-[#1a1a1a] border-white/5 hover:border-[#7F5CFF]/30' : 'bg-gradient-to-r from-[#151515] to-[#111] border-white/10 hover:border-white/30'}`}>
                  <div className="relative flex-shrink-0"><div className={`w-14 h-14 rounded-full flex items-center justify-center text-3xl border-2 overflow-hidden ${info.isChatted ? (info.trust >= 50 ? (info.trust >= 100 ? 'border-[#7F5CFF]' : 'border-blue-500') : 'border-gray-700') : 'border-white/10'}`}>{p.avatar.startsWith('/') ? (<img src={p.avatar} alt={p.name} className="w-full h-full object-cover" />) : (<span>{p.avatar}</span>)}</div>{info.isChatted && (<div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] border-2 border-[#111] ${lv.barColor.replace('bg-', 'text-white bg-')}`}>{lv.level}</div>)}</div>
                  <div className="flex-1 min-w-0"><div className="flex justify-between items-baseline mb-1"><h3 className="font-bold text-white text-base">{p.name}</h3><span className="text-[10px] text-gray-500">{info.isChatted ? info.time : 'New'}</span></div><div className="flex flex-wrap gap-1 mb-1">
                  {/* 🔥 Fix: Explicitly type 'tag' */}
                  {p.tags[lang].slice(0, 2).map((tag: string) => (<span key={tag} className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-gray-400 border border-white/5 whitespace-nowrap">{tag}</span>))}</div><div className="text-[10px] text-gray-500 mb-1 flex items-center gap-1 truncate">{status}</div><p className={`text-xs truncate transition-colors ${info.isChatted ? 'text-gray-400 group-hover:text-gray-300' : 'text-gray-500 italic'}`}>{info.isChatted ? info.lastMsg : p.slogan[lang]}</p></div>
                </div>
              );
            })}
          </div>
          <div className="fixed bottom-6 left-0 right-0 flex justify-center z-20 pointer-events-none"><button onClick={handleOpenProfile} className="pointer-events-auto bg-[#1a1a1a]/80 backdrop-blur-md border border-white/10 text-gray-300 px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 text-xs font-bold hover:bg-[#222] hover:text-white transition-all hover:scale-105 active:scale-95"><Brain size={14} className="text-[#7F5CFF]" /> {ui.profile}</button></div>
          <button onClick={() => setShowFeedbackModal(true)} className="fixed bottom-6 right-6 z-50 p-3 rounded-full bg-[#1a1a1a] border border-white/10 text-gray-400"><Bug size={20} /></button>
        </div>
      )}

      {view === 'chat' && (
        <div className={`z-10 flex flex-col h-full w-full max-w-lg mx-auto border-x relative animate-[slideUp_0.3s_ease-out] ${currentBgStyle.backgroundImage ? 'border-white/10 shadow-2xl' : `${levelInfo.bgClass} ${levelInfo.borderClass} ${levelInfo.glowClass}`} transition-all duration-1000`} style={currentBgStyle.backgroundImage ? { backgroundColor: 'rgba(0, 0, 0, 0.05)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' } : levelInfo.customStyle}>
          <header className="flex-none px-4 py-3 bg-[#0a0a0a]/80 backdrop-blur-md sticky top-0 z-20 border-b border-white/5">
             <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <button onClick={backToSelection} className="text-gray-400 hover:text-white transition-colors"><div className="p-1.5 bg-white/5 rounded-full hover:bg-[#7F5CFF] transition-colors"><ChevronLeft size={16} className="group-hover:text-white" /></div></button>
                <div className="relative cursor-pointer" onClick={handleExport} title={ui.export}><div className="w-10 h-10 rounded-full bg-[#1a1a1a] border border-white/10 flex items-center justify-center text-xl shadow-[0_0_15px_rgba(0,0,0,0.5)] overflow-hidden">{currentP.avatar.startsWith('/') ? (<img src={currentP.avatar} alt={currentP.name} className="w-full h-full object-cover" />) : (<span>{currentP.avatar}</span>)}</div><div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#0a0a0a]"></div></div>
                <div className="flex flex-col justify-center min-w-0"><h1 className="font-bold text-sm text-white tracking-wide truncate flex items-center gap-2">{currentP.name}<span className={`text-[9px] font-normal transition-all duration-300 ${isLoading ? 'text-[#7F5CFF] animate-pulse font-bold' : `opacity-50 ${currentP.color}`}`}>{isLoading ? ui.loading : currentP.title[lang]}</span></h1><div className="flex items-center gap-2 mt-0.5"><div className={`text-[9px] px-1.5 py-px rounded-md border border-white/10 bg-white/5 flex items-center gap-1 ${levelInfo.barColor.replace('bg-', 'text-')}`}>{levelInfo.icon} <span className="font-mono font-bold">Lv.{levelInfo.level}</span></div></div></div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setShowBriefing(true)} className="p-2 text-gray-400 hover:text-indigo-400 relative group" title="Daily Tarot"><Sparkles size={18} /></button>
                {/* Global Menu */}
                <div className="relative group">
                    <button onClick={() => setShowMenu(!showMenu)} className="p-2 text-gray-400 hover:text-white relative group">
                        <MoreVertical size={18} />
                    </button>
                    {showMenu && renderGlobalMenu()}
                </div>
              </div>
             </div>
             <div className="absolute bottom-0 left-0 w-full h-[1px] bg-white/5"><div className={`h-full ${levelInfo.barColor} shadow-[0_0_10px_currentColor] transition-all duration-500`} style={{ width: `${progressPercent}%` }}/></div>
          </header>

          <main className="flex-1 overflow-y-auto px-4 py-6 space-y-6 scroll-smooth no-scrollbar">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-60">
                 <div className={`w-24 h-24 rounded-full flex items-center justify-center text-5xl mb-2 overflow-hidden`}>{currentP.avatar.startsWith('/') ? (<img src={currentP.avatar} alt={currentP.name} className="w-full h-full object-cover" />) : (<span>{currentP.avatar}</span>)}</div>
                 <div className="space-y-2 px-8"><p className="text-white/80 text-lg font-light">{lang === 'zh' ? '我是' : 'I am'} <span className={currentP.color}>{currentP.name}</span>.</p></div>
              </div>
            )}
            {messages.map((msg, msgIdx) => {
              if (msg.role === 'system') return null;
              // 🔥 [FIXED] Define isAI locally in the map callback
              const isAI = msg.role !== 'user';
              const isVoice = voiceMsgIds.has(msg.id); 
              const contentDisplay = msg.content.replace(CMD_REGEX, '').replace(RIN_CMD_REGEX, '').trim();
              return (
                <div key={msg.id} className={`flex w-full ${!isAI ? 'justify-end' : 'justify-start'} mb-4 animate-[slideUp_0.1s_ease-out]`}>
                  <div className={`max-w-[85%] flex flex-col items-start gap-1`}>
                    <div className={`px-5 py-3.5 text-sm leading-6 shadow-md backdrop-blur-sm rounded-2xl border transition-all duration-300 ${!isAI ? 'bg-gradient-to-br from-[#7F5CFF] to-[#6242db] text-white rounded-tr-sm border-transparent' : isVoice ? 'bg-[#1a1a1a]/90 text-[#7F5CFF] border-[#7F5CFF]/50 shadow-[0_0_20px_rgba(127,92,255,0.2)]' : 'bg-[#1a1a1a]/90 text-gray-200 rounded-tl-sm border-white/5'}`}>
                      {isAI && isVoice && (<div className="flex items-center gap-2 mb-2 pb-2 border-b border-[#7F5CFF]/20 text-[10px] font-bold opacity-90 uppercase tracking-widest">{playingMsgId === msg.id ? <Loader2 size={12} className="animate-spin"/> : <Volume2 size={12} />}<span>Voice Message</span></div>)}
                      {!isAI ? (
                        <ReactMarkdown components={{ a: ({ node, href, children, ...props }) => { const linkHref = href || ''; if (linkHref.startsWith('#trigger-')) { const targetPersona = linkHref.replace('#trigger-', '') as PersonaType; const pConfig = PERSONAS[targetPersona]; if (!pConfig) return <span>{children}</span>; const colorClass = pConfig.color; return (<button onClick={(e) => { e.preventDefault(); e.stopPropagation(); selectPersona(targetPersona); }} className="inline-flex items-center gap-1 mx-1 px-2 py-0.5 rounded-full bg-white/10 border border-white/10 hover:bg-white/20 transition-all transform hover:scale-105 align-middle -mt-0.5 cursor-pointer" title={`Switch to ${targetPersona}`}><span className={`text-[10px] font-bold ${colorClass} opacity-70`}>@</span><span className={`text-xs font-bold ${colorClass} underline decoration-dotted underline-offset-2`}>{children}</span><ArrowUpRight size={10} className={`opacity-70 ${colorClass}`} /></button>); } return (<a href={linkHref} {...props} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline hover:text-blue-300 break-all">{children}</a>); } }}>{contentDisplay}</ReactMarkdown>
                      ) : (
                        <div className="flex flex-col gap-1">
                           {contentDisplay.split('|||').map((part, partIdx, arr) => { if (!part.trim()) return null; const isLastPart = partIdx === arr.length - 1; const shouldType = msgIdx === messages.length - 1 && isLoading && isLastPart; if (shouldType) { return <Typewriter key={partIdx} content={part.trim()} isThinking={true} />; } return ( <ReactMarkdown key={partIdx} components={{ a: ({ node, href, children, ...props }) => { const linkHref = href || ''; if (linkHref.startsWith('#trigger-')) { const targetPersona = linkHref.replace('#trigger-', '') as PersonaType; const pConfig = PERSONAS[targetPersona]; if (!pConfig) return <span>{children}</span>; const colorClass = pConfig.color; return (<button onClick={(e) => { e.preventDefault(); e.stopPropagation(); selectPersona(targetPersona); }} className="inline-flex items-center gap-1 mx-1 px-2 py-0.5 rounded-full bg-white/10 border border-white/10 hover:bg-white/20 transition-all transform hover:scale-105 align-middle -mt-0.5" title={`Switch to ${targetPersona}`}><span className={`text-[10px] font-bold ${colorClass} opacity-70`}>@</span><span className={`text-xs font-bold ${colorClass} underline decoration-dotted underline-offset-2`}>{children}</span><ArrowUpRight size={10} className={`opacity-70 ${colorClass}`} /></button>); } return (<a href={linkHref} {...props} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline hover:text-blue-300 break-all">{children}</a>); } }}>{formatMentions(part.trim())}</ReactMarkdown> ); })}
                        </div>
                      )}
                    </div>
                    {isAI && isVoice && playingMsgId !== msg.id && (<button onClick={() => handlePlayAudio(contentDisplay, msg.id)} className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-[#7F5CFF] ml-1 transition-colors"><RotateCcw size={10} /> Replay</button>)}
                  </div>
                </div>
              );
            })}
            {isLoading && messages.length > 0 && messages[messages.length - 1].role === 'user' && ( <div className="flex justify-start w-full animate-[slideUp_0.2s_ease-out]"><div className="flex items-center gap-2 bg-[#1a1a1a] px-4 py-3 rounded-2xl rounded-tl-sm border border-white/5"><span className="text-xs text-gray-500 ml-1">{ui.loading}</span></div></div> )}
            <div ref={messagesEndRef} className="h-4" />
          </main>

          <footer className="flex-none p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] z-30">
            <div className="relative flex items-end gap-2 bg-[#151515] p-2 rounded-[24px] border border-white/10 shadow-2xl transition-all duration-300">
              <div className="relative flex items-center justify-center mr-1 gap-1 pb-2 pl-1">
                {chatInputMode === 'guided' ? (
                   <button type="button" onClick={() => setChatInputMode('free')} className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/5 transition-colors" title="Switch to Keyboard"><Keyboard size={18} /></button>
                ) : (
                   <button type="button" onClick={() => setChatInputMode('guided')} className="p-2 rounded-full text-gray-400 hover:text-[#7F5CFF] hover:bg-white/5 transition-colors" title="Quick Replies"><Wand2 size={18} /></button>
                )}
                <button type="button" onClick={startVoiceInput} className={`p-2 rounded-full transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'text-gray-400 hover:text-white'}`}>{isRecording ? <MicOff size={18}/> : <Mic size={18}/>}</button>
                <div className="relative group">
                  {!hasSeenShop && !isFocusActive && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-28 pointer-events-none animate-[bounce_2s_infinite]">
                      <div className="bg-[#1a1a1a] border border-blue-500/40 px-3 py-2 rounded-xl rounded-bl-none shadow-[0_0_15px_rgba(59,130,246,0.3)] relative">
                        <p className="text-[10px] font-bold text-blue-400 text-center leading-tight">{lang === 'zh' ? "“带钱了吗？\n点这交易。”" : "“Got cash?\nClick here.”"}</p>
                        <div className="absolute -bottom-1.5 left-0 w-3 h-3 bg-[#1a1a1a] border-b border-r border-blue-500/40 transform rotate-45"></div>
                      </div>
                    </div>
                  )}
                  <button type="button" onClick={openShopHandler} className={`p-2 rounded-full transition-all relative ${!hasSeenShop ? 'text-blue-400 bg-blue-500/10 shadow-[0_0_10px_rgba(59,130,246,0.3)]' : 'text-blue-400 hover:bg-blue-500/10 hover:text-blue-300'}`} title="ToughShop"><ShoppingBag size={18} />{!hasSeenShop && (<span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-[#151515] animate-ping"></span>)}</button>
                </div>
                {activePersona === 'Sol' && (<button type="button" onClick={() => setShowFocusOffer(true)} className="p-2 rounded-full text-emerald-500 hover:bg-emerald-500/10 hover:text-emerald-400" title={lang === 'zh' ? "专注监管" : "Focus Protocol"}><Ban size={18} /></button>)}
                {activePersona === 'Rin' && (<div className="relative"><button type="button" onClick={openEnergyStation} className="p-2 rounded-full text-pink-400 hover:bg-pink-500/10 hover:text-pink-300 transition-colors" title={lang === 'zh' ? "能量补给" : "Energy Station"}><Flower2 size={18} /></button>{hasNewGlory && (<span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 border-2 border-[#151515] rounded-full animate-bounce pointer-events-none"></span>)}</div>)}
                {activePersona === 'Echo' && (<button type="button" onClick={() => setShowBriefing(true)} className="p-2 rounded-full text-indigo-400 hover:bg-indigo-500/10 hover:text-indigo-300 transition-colors" title={lang === 'zh' ? "虚空塔罗 (晨报)" : "Void Tarot"}><Sparkles size={18} /></button>)}
              </div>
              <div className="flex-1 min-w-0">
                 {chatInputMode === 'guided' && !isFocusActive ? (
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2 mask-linear-fade">
                        {quickReplies.map(reply => (
                          <button key={reply.id} onClick={() => handleQuickReply(reply)} className="flex-shrink-0 bg-white/5 border border-white/10 hover:bg-[#7F5CFF]/20 hover:border-[#7F5CFF]/50 text-gray-200 text-xs px-3 py-2 rounded-xl transition-all active:scale-95 flex items-center gap-1.5 whitespace-nowrap"><span className="opacity-70">{reply.label.split(' ')[0]}</span><span>{reply.label.split(' ').slice(1).join(' ')}</span></button>
                        ))}
                    </div>
                 ) : (
                    <form onSubmit={onFormSubmit} className="flex items-center gap-2 w-full pb-1">
                       <input type="text" value={input} onChange={handleInputChange} placeholder={ui.placeholder} className="flex-1 bg-transparent text-white text-sm px-2 py-2 focus:outline-none placeholder-gray-600 min-w-0" autoFocus />
                       <button type="submit" disabled={!input.trim() || isLoading} className="p-2 bg-[#7F5CFF] text-white rounded-xl hover:bg-[#6b4bd6] disabled:opacity-30 transition-all transform active:scale-95 flex-shrink-0"><Send size={16} fill="white" /></button>
                    </form>
                 )}
              </div>
            </div>
          </footer>
        </div>
      )}
    </div>
  );
}

const ViralPoster = ({ data, persona, lang, forwardedRef }: { data: any, persona: PersonaType, lang: LangType, forwardedRef: any }) => {
  const safeData = data || { content: "System Error", date: new Date().toLocaleDateString() };
  const p = PERSONAS[persona];
  const heroImage = safeData.image || p.avatar;
  let heroQuote = safeData.share_quote || safeData.content || "";
  if (!heroQuote || heroQuote.length > 80) { heroQuote = safeData.meaning || (lang === 'zh' ? "命运在洗牌，但出牌的是你。" : "Fate shuffles the cards, but you play them."); }

  return (
    <div ref={forwardedRef} className="fixed left-[-9999px] top-0 w-[375px] h-[667px] overflow-hidden bg-black font-sans flex flex-col">
      <div className="absolute inset-0 z-0">
         <img src={heroImage} crossOrigin="anonymous" className="w-full h-full object-cover opacity-40 blur-xl scale-110" />
         <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/90" />
         <div className="absolute inset-0 bg-[url('/noise.png')] opacity-30 mix-blend-overlay" />
      </div>
      <div className="relative z-10 p-6 flex justify-between items-center border-b border-white/10">
          <div className="flex flex-col"><span className="text-[9px] tracking-[0.3em] text-white/80 font-bold uppercase">TOUGHLOVE.AI</span><span className="text-[9px] text-gray-400 font-mono mt-1">FATE_ID: {Math.floor(Math.random() * 99999)} // {new Date().toLocaleDateString()}</span></div>
          <div className={`w-8 h-8 rounded-full border border-white/30 overflow-hidden`}><img src={p.avatar} crossOrigin="anonymous" className="w-full h-full object-cover" /></div>
      </div>
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 gap-6">
          <div className="relative group w-[200px] aspect-[2/3] shadow-[0_0_40px_rgba(0,0,0,0.6)] rounded-xl overflow-hidden border border-white/20">
             <img src={heroImage} crossOrigin="anonymous" className="w-full h-full object-cover" />
             <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 opacity-50" />
             <div className="absolute bottom-0 inset-x-0 bg-black/60 backdrop-blur-sm p-2 text-center border-t border-white/10"><span className="text-sm text-white font-bold tracking-widest uppercase">{safeData.name || "THE UNKNOWN"}</span></div>
          </div>
          {safeData.archetype && (<div className="px-3 py-1 bg-[#7F5CFF]/20 border border-[#7F5CFF]/30 rounded-full"><span className="text-[10px] font-bold text-[#7F5CFF] uppercase tracking-widest">{safeData.archetype}</span></div>)}
          <div className="relative mt-2 text-center max-w-[280px]"><div className="w-8 h-0.5 bg-[#7F5CFF] mx-auto mb-4" /><p className="text-xl font-medium leading-snug text-white font-serif tracking-wide drop-shadow-md">“{heroQuote}”</p></div>
      </div>
      <div className="relative z-10 bg-white p-5 pb-6 flex items-center justify-between rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
          <div className="flex flex-col gap-1.5">
             <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#7F5CFF] animate-pulse" /><span className="text-xs font-bold text-black uppercase tracking-wider">{lang === 'zh' ? '领取你的精神诊断' : 'GET YOUR DIAGNOSIS'}</span></div>
             <p className="text-[10px] text-gray-500 max-w-[160px] leading-relaxed">扫码接入 TOUGHLOVE 系统<br/>与 <span className="font-bold text-[#7F5CFF]">{p.name}</span> 建立私密连接</p>
          </div>
          <div className="w-20 h-20 bg-black p-1 rounded-lg shadow-lg flex-shrink-0"><div className="w-full h-full bg-white rounded flex items-center justify-center p-1"><img src="/qrcode.png" className="w-full h-full object-contain" /></div></div>
      </div>
    </div>
  );
};