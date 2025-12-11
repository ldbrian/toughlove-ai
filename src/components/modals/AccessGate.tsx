import { useState, useEffect } from 'react';
import { Lock, Terminal, ArrowRight, AlertTriangle } from 'lucide-react';
import { getDeviceId } from '@/lib/utils';

interface AccessGateProps {
  onUnlock: () => void;
}

// 🔐 硬编码的内测邀请码
const VALID_CODES = ['TOUGH2025', 'CYBER50', 'ECHO', 'ASH', 'SOL', 'RIN', 'VEE']; 

export const AccessGate = ({ onUnlock }: AccessGateProps) => {
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [glitch, setGlitch] = useState(false);
  
  // 🔥 FIX: 使用 state 来存储 Device ID，解决 Hydration Mismatch
  const [deviceId, setDeviceId] = useState('UNKNOWN');

  useEffect(() => {
    // 仅在客户端挂载后执行读取
    const id = getDeviceId();
    if (id) {
        setDeviceId(id.slice(0,8).toUpperCase());
    } else {
        // 如果没有 ID，顺手生成一个 (可选)
        const newId = Math.random().toString(36).substring(2, 10).toUpperCase();
        localStorage.setItem('toughlove_device_id', newId);
        setDeviceId(newId);
    }
  }, []);

  const handleLogin = async () => {
    if (!input) return;
    setLoading(true);
    setError(false);

    setTimeout(() => {
      if (VALID_CODES.includes(input.trim().toUpperCase())) {
        localStorage.setItem('toughlove_access_token', 'GRANTED');
        setGlitch(true); 
        setTimeout(onUnlock, 800); 
      } else {
        setError(true);
        setLoading(false);
      }
    }, 800);
  };

  return (
    <div className={`fixed inset-0 z-[999] bg-black flex flex-col items-center justify-center p-6 transition-opacity duration-1000 ${glitch ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      <div className="absolute top-0 left-0 w-full h-1 bg-green-500/50 shadow-[0_0_20px_#22c55e] animate-scan"></div>

      <div className="w-full max-w-sm relative z-10 space-y-8">
        
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-green-900/20 border border-green-500/30 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <Lock size={32} className="text-green-500" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-[0.2em] font-mono">RESTRICTED AREA</h1>
          <p className="text-xs text-green-500/70 font-mono">
            CLOSED BETA // SERVER ENCRYPTED
          </p>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <Terminal className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input 
              type="text" 
              value={input}
              onChange={(e) => { setInput(e.target.value); setError(false); }}
              placeholder="ENTER ACCESS KEY"
              className="w-full bg-[#111] border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white font-mono tracking-widest focus:outline-none focus:border-green-500 transition-all uppercase placeholder-gray-700"
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-500 text-xs font-mono animate-bounce">
              <AlertTriangle size={12} />
              <span>ACCESS DENIED: INVALID KEY</span>
            </div>
          )}

          <button 
            onClick={handleLogin}
            disabled={loading || !input}
            className="w-full py-4 bg-green-600 hover:bg-green-500 text-black font-bold tracking-widest rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(34,197,94,0.3)]"
          >
            {loading ? 'VERIFYING...' : 'INITIALIZE LINK'} 
            {!loading && <ArrowRight size={16} />}
          </button>
        </div>

        <div className="text-center mt-12">
          <p className="text-[10px] text-gray-600 font-mono">
            {/* 🔥 这里直接渲染 state，不再进行条件判断 */}
            DEVICE_ID: {deviceId}
          </p>
        </div>

      </div>
    </div>
  );
};