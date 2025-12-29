import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, Mic, Radio, CloudRain, Flame, Wind, 
    ChevronLeft, PhoneOff, Volume2, Power 
} from 'lucide-react';
import { LangType } from '@/types';

// 静音片段 (用于重置播放器和解锁 iOS 音频)
const SILENT_AUDIO = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABGDZGF0YQQAAAAAAA==';

// WAV 编码核心
const encodeWAV = (samples: Float32Array, sampleRate: number) => {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);
    const writeString = (view: DataView, offset: number, string: string) => {
        for (let i = 0; i < string.length; i++) view.setUint8(offset + i, string.charCodeAt(i));
    };
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + samples.length * 2, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, 'data');
    view.setUint32(40, samples.length * 2, true);
    let offset = 44;
    for (let i = 0; i < samples.length; i++, offset += 2) {
        let s = Math.max(-1, Math.min(1, samples[i]));
        s = s < 0 ? s * 0x8000 : s * 0x7FFF;
        view.setInt16(offset, s, true);
    }
    return new Blob([view], { type: 'audio/wav' });
};

interface SleepSignalModalProps {
    show: boolean;
    onClose: () => void;
    lang: LangType;
}

// 移除了 Ash，保留自然系三人组
type PersonaId = 'rin' | 'sol' | 'echo';
type ViewState = 'SELECTION' | 'ACTIVE';
type NoiseType = 'RAIN' | 'FIRE' | 'WIND' | 'OFF';
type InteractState = 'IDLE' | 'RECORDING' | 'THINKING' | 'SPEAKING';

// 角色配置
const THEMES: Record<PersonaId, { color: string, noise: NoiseType, label: string, desc: { zh: string, en: string }, icon: any }> = {
    rin: { 
        color: '#c084fc', noise: 'RAIN', label: 'Rin', 
        desc: { zh: '温柔 · 雨声 · 陪伴', en: 'Gentle · Rain · Companion' }, 
        icon: CloudRain 
    },
    sol: { 
        color: '#fb923c', noise: 'FIRE', label: 'Sol', 
        desc: { zh: '温暖 · 篝火 · 治愈', en: 'Warm · Bonfire · Healing' }, 
        icon: Flame 
    },
    echo: { 
        color: '#94a3b8', noise: 'WIND', label: 'Echo', 
        desc: { zh: '空灵 · 微风 · 倾听', en: 'Ethereal · Breeze · Listener' }, 
        icon: Wind 
    }
};

export const SleepSignalModal = ({ show, onClose, lang }: SleepSignalModalProps) => {
    const [view, setView] = useState<ViewState>('SELECTION');
    const [activePersona, setActivePersona] = useState<PersonaId>('rin');
    const [interactState, setInteractState] = useState<InteractState>('IDLE');
    const [currentNoise, setCurrentNoise] = useState<NoiseType>('OFF');
    const [micReady, setMicReady] = useState(false);
    
    // Refs
    const bgAudioRef = useRef<HTMLAudioElement | null>(null);
    const voiceAudioRef = useRef<HTMLAudioElement | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const inputRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const audioDataRef = useRef<Float32Array[]>([]);
    
    // 渐变音量定时器
    const fadeIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const t = {
        zh: {
            title: '选择入睡搭档',
            tapToStart: '点击屏幕 说话',
            tapToStop: '点击屏幕 发送',
            tapToStopPlay: '点击屏幕 停止播放',
            micError: '麦克风启动失败: ',
            listening: '在听...',
            thinking: '思考中...',
            back: '退出',
        },
        en: {
            title: 'Choose Companion',
            tapToStart: 'Tap screen to speak',
            tapToStop: 'Tap screen to send',
            tapToStopPlay: 'Tap to stop',
            micError: 'Mic Error: ',
            listening: 'Listening...',
            thinking: 'Thinking...',
            back: 'Exit',
        }
    }[lang === 'zh' ? 'zh' : 'en'];

    useEffect(() => {
        if (!show) {
            forceCleanup();
            setView('SELECTION');
            document.body.style.overflow = '';
        } else {
            document.body.style.overflow = 'hidden';
        }
    }, [show]);

    // 白噪音控制 & 侧链压缩 (Ducking)
    const fadeAudio = (targetVol: number, duration = 1000) => {
        if (!bgAudioRef.current) return;
        const audio = bgAudioRef.current;
        const stepTime = 50;
        const steps = duration / stepTime;
        const volStep = (targetVol - audio.volume) / steps;

        if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);

        fadeIntervalRef.current = setInterval(() => {
            let newVol = audio.volume + volStep;
            if ((volStep > 0 && newVol >= targetVol) || (volStep < 0 && newVol <= targetVol)) {
                audio.volume = targetVol;
                if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
            } else {
                audio.volume = newVol;
            }
        }, stepTime);
    };

    useEffect(() => {
        if (!bgAudioRef.current) return;
        if (currentNoise === 'OFF' || view === 'SELECTION') {
            bgAudioRef.current.pause();
        } else {
            bgAudioRef.current.src = `/sounds/${currentNoise.toLowerCase()}.mp3`;
            bgAudioRef.current.volume = 0.2; // 默认背景音量
            bgAudioRef.current.play().catch(() => {});
        }
    }, [currentNoise, view]);

    // AI 语音播放监听：实现“闪避”效果
    useEffect(() => {
        const voiceAudio = voiceAudioRef.current;
        if (!voiceAudio) return;

        const onPlay = () => {
            setInteractState('SPEAKING');
            fadeAudio(0.05, 500); // 快速压低背景音
        };
        
        const onEnd = () => {
            setInteractState('IDLE');
            fadeAudio(0.2, 2000); // 缓慢恢复背景音
        };

        voiceAudio.addEventListener('play', onPlay);
        voiceAudio.addEventListener('ended', onEnd);
        voiceAudio.addEventListener('pause', onEnd);

        return () => {
            voiceAudio.removeEventListener('play', onPlay);
            voiceAudio.removeEventListener('ended', onEnd);
            voiceAudio.removeEventListener('pause', onEnd);
        };
    }, []);

    const forceCleanup = () => {
        try {
            if (voiceAudioRef.current) {
                voiceAudioRef.current.pause();
                voiceAudioRef.current.src = SILENT_AUDIO;
            }
            // 不要完全停止白噪音，只是确保它状态正确
            if (bgAudioRef.current && !show) {
                bgAudioRef.current.pause();
            }

            setInteractState('IDLE');
            
            if (mediaStreamRef.current) {
                mediaStreamRef.current.getTracks().forEach(t => t.stop());
                mediaStreamRef.current = null;
            }
            if (audioContextRef.current) {
                audioContextRef.current.close();
                audioContextRef.current = null;
            }
            if (processorRef.current) {
                processorRef.current.disconnect();
                processorRef.current = null;
            }
            setMicReady(false);
            if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
        } catch (e) { console.error(e); }
    };

    const handleSelectPersona = (pid: PersonaId) => {
        setActivePersona(pid);
        setCurrentNoise(THEMES[pid].noise);
        setView('ACTIVE');
        // 自动连接麦克风
        setTimeout(() => handleConnect(), 500);
    };

    const handleConnect = async () => {
        try {
            if (mediaStreamRef.current) return; // 避免重复连接

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;
            
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            const ctx = new AudioContextClass();
            audioContextRef.current = ctx;
            if (ctx.state === 'suspended') await ctx.resume();

            // 激活 iOS 音频
            if (voiceAudioRef.current) {
                voiceAudioRef.current.src = SILENT_AUDIO;
                voiceAudioRef.current.play().catch(() => {});
            }

            setMicReady(true);
        } catch (err: any) {
            alert(`${t.micError}${err.message}`);
            forceCleanup();
        }
    };

    // 核心交互逻辑：盲操作处理
    const handleScreenTap = async () => {
        if (!micReady) {
            await handleConnect();
            return;
        }

        // 1. 如果 AI 正在说话，点击则是“打断/停止”
        if (interactState === 'SPEAKING') {
            if (voiceAudioRef.current) {
                voiceAudioRef.current.pause();
                voiceAudioRef.current.currentTime = 0;
            }
            return; // 变回 IDLE
        }

        // 2. 如果是 IDLE，点击开始录音
        if (interactState === 'IDLE') {
            startRecording();
            return;
        }

        // 3. 如果正在录音，点击结束并发送
        if (interactState === 'RECORDING') {
            stopRecordingAndSend();
            return;
        }
    };

    const startRecording = async () => {
        const ctx = audioContextRef.current;
        if (!ctx || !mediaStreamRef.current) return;

        if (navigator.vibrate) navigator.vibrate(50);
        setInteractState('RECORDING');
        
        // 播放极短的提示音或仅靠震动反馈
        
        try {
            if (ctx.state === 'suspended') await ctx.resume();
            audioDataRef.current = [];

            // 重新创建源 (修复 InvalidAccessError 的核心)
            try { inputRef.current?.disconnect(); } catch {}
            const newSource = ctx.createMediaStreamSource(mediaStreamRef.current);
            inputRef.current = newSource;

            if (processorRef.current) processorRef.current.disconnect();
            const processor = ctx.createScriptProcessor(4096, 1, 1);
            processorRef.current = processor;

            processor.onaudioprocess = (ev) => {
                const inputData = ev.inputBuffer.getChannelData(0);
                audioDataRef.current.push(new Float32Array(inputData));
            };

            newSource.connect(processor);
            processor.connect(ctx.destination);
        } catch (err) {
            console.error(err);
            setInteractState('IDLE');
        }
    };

    const stopRecordingAndSend = async () => {
        setInteractState('THINKING');
        if (navigator.vibrate) navigator.vibrate([30, 30]);

        // 断开连接
        if (processorRef.current) {
            processorRef.current.disconnect();
            processorRef.current = null;
        }

        const buffers = audioDataRef.current;
        if (buffers.length === 0) {
            setInteractState('IDLE');
            return;
        }

        // 合并音频
        let totalLen = 0;
        for (const buf of buffers) totalLen += buf.length;
        const result = new Float32Array(totalLen);
        let offset = 0;
        for (const buf of buffers) {
            result.set(buf, offset);
            offset += buf.length;
        }

        const sampleRate = audioContextRef.current?.sampleRate || 44100;
        const wavBlob = encodeWAV(result, sampleRate);
        
        // 发送
        if (wavBlob.size > 1000) {
            await handleSendMessage(wavBlob);
        } else {
            setInteractState('IDLE');
        }
    };

    const handleSendMessage = async (audioBlob: Blob) => {
        const formData = new FormData();
        formData.append('file', audioBlob, 'voice.wav');
        // 传递 scene=sleep 提示后端使用简短回复
        formData.append('personaId', activePersona);
        formData.append('scene', 'sleep'); 

        try {
            const res = await fetch('/api/chat/voice', {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) throw new Error('Network error');

            const contentType = res.headers.get('content-type');
            
            if (contentType && contentType.includes('audio/mpeg')) {
                const audioBlobRes = await res.blob();
                const audioUrl = URL.createObjectURL(audioBlobRes);
                if (voiceAudioRef.current) {
                    voiceAudioRef.current.src = audioUrl;
                    voiceAudioRef.current.play(); // 播放会触发 onPlay -> Ducking
                }
            }
        } catch (error) {
            console.error(error);
            setInteractState('IDLE');
        }
    };

    if (!show) return null;
    const currentTheme = THEMES[activePersona];

    return (
        <div 
            className="fixed inset-0 z-[200] bg-black font-sans flex flex-col overflow-hidden touch-none select-none"
            style={{ 
                WebkitUserSelect: 'none', 
                userSelect: 'none', 
                WebkitTouchCallout: 'none' 
            }}
            onContextMenu={(e) => e.preventDefault()}
        >
            <audio ref={bgAudioRef} loop playsInline webkit-playsinline="true" />
            <audio ref={voiceAudioRef} playsInline webkit-playsinline="true" />

            <AnimatePresence mode="wait">
                {/* 选人界面 */}
                {view === 'SELECTION' && (
                    <motion.div 
                        key="selection"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex-1 flex flex-col items-center justify-center p-6 gap-8 w-full max-w-md mx-auto"
                    >
                        <div className="w-full flex justify-end absolute top-6 right-6 z-10">
                             <button onClick={onClose} className="p-3 rounded-full bg-white/5 hover:bg-white/10 text-gray-400">
                                <X size={24} />
                            </button>
                        </div>
                        
                        <h2 className="text-xl font-light text-gray-400 tracking-[0.2em] uppercase">{t.title}</h2>
                        
                        <div className="grid grid-cols-1 gap-4 w-full px-8">
                            {(Object.keys(THEMES) as PersonaId[]).map((pid) => {
                                const theme = THEMES[pid];
                                const Icon = theme.icon;
                                return (
                                    <button
                                        key={pid}
                                        onClick={() => handleSelectPersona(pid)}
                                        className="relative group flex items-center gap-6 p-6 rounded-3xl border border-white/5 bg-white/5 active:scale-95 transition-all duration-300"
                                    >
                                        <div className="p-4 rounded-full bg-black/50" style={{ color: theme.color }}>
                                            <Icon size={24} />
                                        </div>
                                        <div className="text-left">
                                            <div className="text-lg font-bold text-gray-200 tracking-wider">{theme.label}</div>
                                            <div className="text-xs text-gray-500 mt-1">{lang === 'zh' ? theme.desc.zh : theme.desc.en}</div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>
                )}

                {/* 沉浸盲操作界面 */}
                {view === 'ACTIVE' && (
                    <motion.div 
                        key="active"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        // 整个屏幕就是按钮
                        onClick={handleScreenTap}
                        className="absolute inset-0 bg-black flex flex-col items-center justify-center cursor-pointer"
                    >
                        {/* 极简的退出按钮 */}
                        <div className="absolute top-8 left-8 z-50" onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => { forceCleanup(); setView('SELECTION'); }} className="p-4 rounded-full text-white/20 hover:text-white/60 transition-colors">
                                <ChevronLeft size={24} />
                            </button>
                        </div>

                        {/* 视觉反馈核心 */}
                        <div className="relative flex items-center justify-center w-full h-full">
                            
                            {/* 呼吸光晕 (IDLE / LISTENING) */}
                            <motion.div 
                                animate={{ 
                                    scale: interactState === 'RECORDING' ? [1, 1.5, 1] : interactState === 'SPEAKING' ? [1, 1.2, 1] : 1,
                                    opacity: interactState === 'RECORDING' ? 0.3 : 0.1
                                }}
                                transition={{ repeat: Infinity, duration: interactState === 'RECORDING' ? 2 : 4, ease: "easeInOut" }}
                                className="w-64 h-64 rounded-full blur-[100px]"
                                style={{ backgroundColor: currentTheme.color }}
                            />

                            {/* 中心状态指示 */}
                            <div className="absolute flex flex-col items-center gap-4 pointer-events-none">
                                <motion.div 
                                    animate={{ scale: interactState === 'RECORDING' ? 1.2 : 1 }}
                                    className="text-white/50"
                                >
                                    {interactState === 'RECORDING' && <Mic size={48} />}
                                    {interactState === 'THINKING' && <Radio size={48} className="animate-spin-slow" />}
                                    {interactState === 'SPEAKING' && <Volume2 size={48} />}
                                    {interactState === 'IDLE' && <div className="w-3 h-3 rounded-full bg-white/20" />}
                                </motion.div>
                                
                                <p className="text-[10px] font-mono tracking-[0.3em] uppercase text-white/30">
                                    {interactState === 'IDLE' && t.tapToStart}
                                    {interactState === 'RECORDING' && t.listening}
                                    {interactState === 'THINKING' && t.thinking}
                                    {interactState === 'SPEAKING' && t.tapToStopPlay}
                                </p>
                            </div>
                        </div>

                        {/* 底部极简控制 */}
                        <div className="absolute bottom-12 z-50 flex gap-8" onClick={(e) => e.stopPropagation()}>
                            <button 
                                onClick={() => setCurrentNoise(prev => prev === 'OFF' ? THEMES[activePersona].noise : 'OFF')}
                                className={`p-4 rounded-full transition-all ${currentNoise !== 'OFF' ? 'text-white/40' : 'text-white/10'}`}
                            >
                                {currentNoise !== 'OFF' ? <Volume2 size={20} /> : <Power size={20} />}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};