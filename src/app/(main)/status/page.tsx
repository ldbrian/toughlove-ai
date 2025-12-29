'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Activity, Database, Cpu, 
  ShieldCheck, XCircle, Users, Globe,
  Gift, Coins, Terminal, Lock, ChevronDown
} from 'lucide-react';
import { LOOT_TABLE, SHOP_CATALOG } from '@/lib/constants';

// 合并所有物品列表供选择
const ALL_ITEMS = [
    ...Object.values(LOOT_TABLE),
    ...SHOP_CATALOG
].sort((a, b) => a.id.localeCompare(b.id));

export default function StatusPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<string[]>([]);
  const [ping, setPing] = useState(0); 
  
  const [dbStatus, setDbStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [aiStatus, setAiStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [userStats, setUserStats] = useState({ total: 0, active: 0 });

  // 🔥 Admin State
  const [adminKey, setAdminKey] = useState('');
  const [targetUserId, setTargetUserId] = useState('');
  const [amount, setAmount] = useState(100);
  const [selectedItem, setSelectedItem] = useState(ALL_ITEMS[0]?.id || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    // 尝试自动填充本机 ID 方便测试
    const localId = localStorage.getItem('toughlove_device_id'); 
    if (localId) setTargetUserId(localId);

    const checkHealth = async () => {
        const startPing = performance.now();
        try {
            const res = await fetch('/api/health');
            const data = await res.json();
            const endPing = performance.now();
            
            setPing(Math.round(endPing - startPing));

            if (data.database === 'online') {
                setDbStatus('online');
            } else {
                setDbStatus('offline');
                addLog(`❌ DB ERROR: ${data.message || 'Unknown DB Error'}`);
            }

            const aiState = data.ai_service || data.ai_config; 
            if (aiState === 'online') {
                setAiStatus('online');
            } else {
                setAiStatus('offline');
                addLog(`❌ AI ERROR: ${data.details || 'Check Server'}`);
            }

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
    const interval = setInterval(checkHealth, 5000); 
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
      logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // 🔥 核心功能：分配资源
  const handleAllocate = async (type: 'rin' | 'item') => {
      if (!adminKey) {
          addLog("⚠️ ACCESS DENIED: Missing Admin Key");
          return;
      }
      if (!targetUserId) {
          addLog("⚠️ ERROR: Target User ID required");
          return;
      }

      setIsSubmitting(true);
      addLog(`INITIATING ${type.toUpperCase()} TRANSFER...`);

      try {
          const payload = {
              adminKey,
              targetUserId,
              type,
              value: type === 'rin' ? Number(amount) : selectedItem
          };

          const res = await fetch('/api/admin/alloc', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
          });

          const data = await res.json();

          if (res.ok) {
              addLog(`✅ SUCCESS: ${data.message}`);
              if (type === 'rin') addLog(`   -> New Balance: ${data.newBalance}`);
          } else {
              addLog(`❌ FAILED: ${data.error}`);
          }

      } catch (e: any) {
          addLog(`❌ CRITICAL: ${e.message}`);
      } finally {
          setIsSubmitting(false);
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
                <Terminal size={18} className="text-green-500" />
                SYSTEM STATUS & CONTROL
            </h1>
        </div>
        <div className="flex items-center gap-4">
            <div className={`text-xs border px-2 py-1 rounded ${ping < 200 ? 'border-green-500/30 text-green-400' : 'border-red-500/50 text-red-500 animate-pulse'}`}>
                {ping < 200 ? 'STABLE' : 'UNSTABLE'}
            </div>
        </div>
      </header>

      {/* 🔥 布局修改：移除了 max-w-5xl 和 mx-auto，改为 w-full */}
      <main className="flex-1 space-y-6 relative z-10 w-full">
        
        {/* Top Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Active Users */}
            <div className="border border-green-500/30 bg-green-900/10 p-5 rounded-lg flex items-center justify-between relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-green-500/50 shadow-[0_0_10px_#22c55e] opacity-50 animate-[scan_3s_infinite_linear]"></div>
                <div className="flex flex-col">
                    <span className="text-xs text-green-500/70 mb-1 flex items-center gap-2 tracking-wider"><Globe size={14} /> ACTIVE (10m)</span>
                    <span className="text-4xl font-black text-white tracking-tighter drop-shadow-[0_0_10px_rgba(34,197,94,0.5)]">{userStats.active}</span>
                </div>
            </div>

            {/* Total Users */}
            <div className="border border-green-500/20 bg-green-900/5 p-5 rounded-lg flex flex-col justify-center">
                <span className="text-xs text-green-500/70 mb-1 flex items-center gap-2 tracking-wider"><Users size={14} /> TOTAL USERS</span>
                <span className="text-2xl font-bold text-green-400/80">{userStats.total}</span>
            </div>

            {/* Service Status */}
            <div className="border border-green-500/20 bg-green-900/5 p-4 rounded-lg space-y-2 text-sm">
                <div className="flex justify-between items-center border-b border-green-500/10 pb-2">
                    <span className="flex items-center gap-2 opacity-70"><Database size={14} /> Database</span>
                    <span className="font-bold flex items-center gap-1">{renderStatusIcon(dbStatus)} {dbStatus.toUpperCase()}</span>
                </div>
                <div className="flex justify-between items-center pt-1">
                    <span className="flex items-center gap-2 opacity-70"><Cpu size={14} /> AI Engine</span>
                    <span className="font-bold flex items-center gap-1">{renderStatusIcon(aiStatus)} {aiStatus.toUpperCase()}</span>
                </div>
            </div>
        </div>

        {/* 🔥 Control Panel (Resource Allocation) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Left: Input Panel */}
            <div className="border border-green-500/30 bg-black/80 p-6 rounded-lg shadow-lg relative">
                <div className="absolute -top-3 left-4 bg-black px-2 text-xs font-bold text-green-400 flex items-center gap-2 border border-green-500/30 rounded">
                    <Lock size={12} /> GOD MODE_
                </div>

                <div className="space-y-4 mt-2">
                    {/* Admin Key & Target ID */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] uppercase tracking-wider opacity-70">Admin Key</label>
                            <input 
                                type="password" 
                                value={adminKey}
                                onChange={e => setAdminKey(e.target.value)}
                                className="w-full bg-green-900/10 border border-green-500/30 rounded px-3 py-2 text-sm focus:outline-none focus:border-green-400 text-green-300 placeholder-green-900/50"
                                placeholder="******"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] uppercase tracking-wider opacity-70">Target User ID</label>
                            <input 
                                type="text" 
                                value={targetUserId}
                                onChange={e => setTargetUserId(e.target.value)}
                                className="w-full bg-green-900/10 border border-green-500/30 rounded px-3 py-2 text-sm focus:outline-none focus:border-green-400 text-green-300 font-mono"
                                placeholder="UUID / DeviceID"
                            />
                        </div>
                    </div>

                    <div className="h-px bg-green-500/20 my-4" />

                    {/* Action 1: Grant RIN */}
                    <div className="flex items-end gap-4">
                        <div className="flex-1 space-y-1">
                            <label className="text-[10px] uppercase tracking-wider opacity-70 flex items-center gap-1"><Coins size={12}/> Grant RIN</label>
                            <input 
                                type="number" 
                                value={amount}
                                onChange={e => setAmount(Number(e.target.value))}
                                className="w-full bg-green-900/10 border border-green-500/30 rounded px-3 py-2 text-sm focus:outline-none focus:border-green-400 text-green-300"
                            />
                        </div>
                        <button 
                            onClick={() => handleAllocate('rin')}
                            disabled={isSubmitting}
                            className="bg-green-600/20 hover:bg-green-500/30 border border-green-500/50 text-green-300 px-4 py-2 rounded text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50"
                        >
                            {isSubmitting ? '...' : 'SEND RIN'}
                        </button>
                    </div>

                    {/* Action 2: Grant Item */}
                    <div className="flex items-end gap-4">
                        <div className="flex-1 space-y-1">
                            <label className="text-[10px] uppercase tracking-wider opacity-70 flex items-center gap-1"><Gift size={12}/> Grant Item</label>
                            <div className="relative">
                                <select 
                                    value={selectedItem}
                                    onChange={e => setSelectedItem(e.target.value)}
                                    className="w-full bg-green-900/10 border border-green-500/30 rounded px-3 py-2 text-xs focus:outline-none focus:border-green-400 text-green-300 appearance-none cursor-pointer"
                                >
                                    {ALL_ITEMS.map(item => {
                                        // 🛡️ 安全检查：rarity 是否存在
                                        // 如果是 ShopItem (无 rarity)，则显示 'SHOP'
                                        const rarityLabel = 'rarity' in item ? item.rarity?.toUpperCase() : 'SHOP';
                                        
                                        return (
                                            <option key={item.id} value={item.id} className="bg-black">
                                                [{rarityLabel}] {item.name.zh || item.name.en} ({item.id})
                                            </option>
                                        );
                                    })}
                                </select>
                                <ChevronDown size={14} className="absolute right-3 top-2.5 opacity-50 pointer-events-none"/>
                            </div>
                        </div>
                        <button 
                            onClick={() => handleAllocate('item')}
                            disabled={isSubmitting}
                            className="bg-purple-600/20 hover:bg-purple-500/30 border border-purple-500/50 text-purple-300 px-4 py-2 rounded text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50"
                        >
                            {isSubmitting ? '...' : 'SEND ITEM'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Right: Live Logs */}
            <div className="flex-1 min-h-[300px] border border-green-500/30 bg-black rounded-lg p-4 font-mono text-[10px] overflow-hidden relative flex flex-col shadow-inner">
                <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-black to-transparent pointer-events-none"></div>
                <div className="flex-1 overflow-y-auto no-scrollbar space-y-1 opacity-90">
                    {logs.map((log, i) => (
                        <div key={i} className={`break-words ${log.includes('❌') ? 'text-red-400 font-bold' : log.includes('✅') ? 'text-green-400 font-bold' : 'text-green-500/80'}`}>
                            <span className="opacity-30 mr-2">{`>`}</span>
                            {log}
                        </div>
                    ))}
                    <div ref={logEndRef} />
                </div>
            </div>
        </div>

      </main>
    </div>
  );
}