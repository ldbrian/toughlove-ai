'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Activity, Database, Cpu, Wifi, 
  ShieldCheck, XCircle, RefreshCw, Users, Globe 
} from 'lucide-react';

export default function StatusPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<string[]>([]);
  const [ping, setPing] = useState(0); 
  
  const [dbStatus, setDbStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [aiStatus, setAiStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  
  // 🔥 新增：用户数据状态
  const [userStats, setUserStats] = useState({ total: 0, active: 0 });

  const logEndRef = useRef<HTMLDivElement>(null);

  const addLog = (msg: string) => {
      const time = new Date().toLocaleTimeString('en-US', { hour12: false });
      setLogs(prev => {
          const newLogs = [...prev, `[${time}] ${msg}`];
          if (newLogs.length > 50) newLogs.shift();
          return newLogs;
      });
  };

  useEffect(() => {
    addLog("INITIALIZING DIAGNOSTIC TOOL...");

    const checkHealth = async () => {
        const startPing = performance.now();
        try {
            const res = await fetch('/api/health');
            const data = await res.json();
            const endPing = performance.now();
            
            setPing(Math.round(endPing - startPing));

            // 1. 数据库状态
            if (data.database === 'online') {
                setDbStatus('online');
            } else {
                setDbStatus('offline');
                addLog(`❌ DB ERROR: ${data.message || 'Unknown DB Error'}`);
            }

            // 2. AI 状态
            const aiState = data.ai_service || data.ai_config; 
            if (aiState === 'online') {
                setAiStatus('online');
            } else {
                setAiStatus('offline');
                addLog(`❌ AI ERROR: ${data.details || 'Check Server'}`);
            }

            // 🔥 3. 更新真实用户数据
            if (data.user_stats) {
                setUserStats({
                    total: data.user_stats.total,
                    active: data.user_stats.active_10min
                });
            }

        } catch (err) {
            setDbStatus('offline');
            setAiStatus('offline');
            setPing(999);
            addLog(`❌ NETWORK ERROR: Connection Failed`);
        }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 5000); // 5秒刷新一次数据
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
      logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleEmergencyFix = () => {
      if (confirm("确认重置连接？")) {
          addLog("CLEARING CACHE...");
          Object.keys(localStorage).forEach(key => {
              if (key.startsWith('toughlove_chat_')) localStorage.removeItem(key);
          });
          addLog("RELOADING WINDOW...");
          setTimeout(() => window.location.reload(), 500);
      }
  };

  const renderStatusIcon = (status: string) => {
      if (status === 'checking') return <Activity size={12} className="animate-spin text-yellow-500"/>;
      if (status === 'online') return <ShieldCheck size={12} className="text-green-400"/>;
      return <XCircle size={12} className="text-red-500 animate-pulse"/>;
  };

  return (
    <div className="min-h-screen bg-black text-green-500 font-mono p-6 flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,0,0.03)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>
      
      <header className="flex items-center justify-between mb-6 border-b border-green-900/50 pb-4 relative z-10">
        <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="hover:bg-green-900/20 p-2 rounded transition-colors">
                <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-bold tracking-widest uppercase flex items-center gap-2">
                <Activity size={18} className={ping > 500 ? "text-red-500" : "text-green-500"} />
                SYSTEM STATUS
            </h1>
        </div>
        <div className={`text-xs border px-2 py-1 rounded ${ping < 200 ? 'border-green-500/30 text-green-400' : 'border-red-500/50 text-red-500 animate-pulse'}`}>
            {ping < 200 ? 'STABLE' : 'UNSTABLE'}
        </div>
      </header>

      <main className="flex-1 space-y-4 relative z-10">
        
        {/* 🔥 [NEW] 真实用户数据面板 (最显眼的位置) */}
        <div className="border border-green-500/30 bg-green-900/10 p-5 rounded-lg flex items-center justify-between relative overflow-hidden group">
            {/* 动态扫描线装饰 */}
            <div className="absolute top-0 left-0 w-1 h-full bg-green-500/50 shadow-[0_0_10px_#22c55e] opacity-50 animate-[scan_3s_infinite_linear]"></div>
            
            <div className="flex flex-col">
                <span className="text-xs text-green-500/70 mb-1 flex items-center gap-2 tracking-wider">
                    <Globe size={14} /> ACTIVE (10m)
                </span>
                <span className="text-4xl font-black text-white tracking-tighter drop-shadow-[0_0_10px_rgba(34,197,94,0.5)]">
                    {userStats.active}
                </span>
            </div>

            <div className="text-right">
                <span className="text-xs text-green-500/70 mb-1 flex items-center justify-end gap-2 tracking-wider">
                    TOTAL USERS <Users size={14} />
                </span>
                <span className="text-2xl font-bold text-green-400/80">
                    {userStats.total}
                </span>
            </div>
        </div>

        {/* 延迟和数据库状态 */}
        <div className="grid grid-cols-2 gap-4">
            <div className={`border p-4 rounded-lg transition-colors ${ping > 300 ? 'border-red-500/50 bg-red-900/10' : 'border-green-500/20 bg-green-900/5'}`}>
                <div className="flex items-center gap-2 text-xs opacity-70 mb-1">
                    <Wifi size={14} /> LATENCY
                </div>
                <div className={`text-2xl font-bold ${ping > 300 ? 'text-red-500' : 'text-green-400'}`}>
                    {ping} <span className="text-xs font-normal opacity-50">ms</span>
                </div>
            </div>
            
            <div className="border border-green-500/20 bg-green-900/5 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-xs opacity-70 mb-1">
                    <Database size={14} /> DB STATUS
                </div>
                <div className={`text-xl font-bold ${dbStatus === 'online' ? 'text-green-400' : 'text-red-500'}`}>
                    {dbStatus.toUpperCase()}
                </div>
            </div>
        </div>

        {/* 模块状态列表 */}
        <div className="border border-green-500/20 rounded-lg overflow-hidden">
            <div className="bg-green-900/20 px-4 py-2 text-xs font-bold border-b border-green-500/20 flex justify-between">
                <span>MODULE</span>
                <span>STATE</span>
            </div>
            <div className="p-4 space-y-3 text-sm">
                <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2"><Database size={14} /> Supabase</span>
                    <span className="font-bold flex items-center gap-1">{renderStatusIcon(dbStatus)} {dbStatus.toUpperCase()}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2"><Cpu size={14} /> AI Engine</span>
                    <span className="font-bold flex items-center gap-1">{renderStatusIcon(aiStatus)} {aiStatus.toUpperCase()}</span>
                </div>
            </div>
        </div>

        {/* 实时日志 */}
        <div className="flex-1 min-h-[200px] border border-green-500/30 bg-black rounded-lg p-4 font-mono text-[10px] overflow-hidden relative flex flex-col shadow-inner">
            <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-black to-transparent pointer-events-none"></div>
            <div className="flex-1 overflow-y-auto no-scrollbar space-y-1 opacity-90">
                {logs.map((log, i) => (
                    <div key={i} className={`break-words ${log.includes('❌') ? 'text-red-400 font-bold' : 'text-green-500/80'}`}>
                        <span className="opacity-30 mr-2">{`>`}</span>
                        {log}
                    </div>
                ))}
                <div ref={logEndRef} />
            </div>
        </div>

      </main>

      <footer className="mt-6 relative z-10">
          <button 
            onClick={handleEmergencyFix}
            className="w-full py-4 border border-red-500/50 text-red-500 hover:bg-red-900/20 transition-colors rounded-lg font-bold tracking-widest flex items-center justify-center gap-2 uppercase text-sm"
          >
              <RefreshCw size={16} /> Force Reconnect
          </button>
      </footer>
    </div>
  );
}