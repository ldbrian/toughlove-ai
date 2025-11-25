import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { processRollingMemory } from '@/lib/memory'; 

// 🔥 防崩修改
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'build-time-dummy-key'
);

// ... 下面的代码保持不变 ...
export async function POST(req: NextRequest) {
    // ...
}