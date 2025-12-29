'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShopModal } from '@/components/modals/ShopModal';
import { useAppLanguage } from '@/hooks/useAppLanguage';
import { getDeviceId } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export default function ShopPageClient({ initialCatalog }: { initialCatalog?: any[] }) {
  const router = useRouter();
  const { lang } = useAppLanguage();
  
  const [balance, setBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(!initialCatalog || initialCatalog.length === 0);

  useEffect(() => {
    async function initShop() {
      try {
        const userId = getDeviceId();
        if (!userId) {
            console.warn("[Shop] No UserId found, redirecting.");
            router.push('/');
            return;
        }

        console.log(`[Shop] Fetching balance for UserID: ${userId}`);

        // 🔥 核心修复：
        // 1. 加时间戳参数 &_t=${Date.now()} 强制让 URL 变得唯一
        // 2. 加 cache: 'no-store' 告诉浏览器别存
        const res = await fetch(`/api/wallet/balance?userId=${userId}&_t=${Date.now()}`, {
            cache: 'no-store',
            headers: {
                'Pragma': 'no-cache',
                'Cache-Control': 'no-cache'
            }
        });
        
        const data = await res.json();
        console.log(`[Shop] Balance API Response:`, data);
        
        if (data && typeof data.balance === 'number') {
            setBalance(data.balance);
        }
      } catch (e) {
        console.error("Failed to fetch balance:", e);
      } finally {
        setIsLoading(false);
      }
    }

    initShop();
  }, [router]);

  const handleBalanceUpdate = (newVal: number) => {
    console.log(`[Shop] Balance updated locally: ${newVal}`);
    setBalance(newVal);
  };

  if (isLoading) {
    return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="animate-spin text-cyan-500" size={32} />
                <p className="text-xs text-cyan-500/50 font-mono">CONNECTING TO VAULT...</p>
            </div>
        </div>
    );
  }

  return (
    <ShopModal 
        show={true}
        isPage={true}
        onClose={() => {}} 
        userRin={balance} 
        onBalanceUpdate={handleBalanceUpdate} 
        lang={lang}
        initialCatalog={initialCatalog}
    />
  );
}