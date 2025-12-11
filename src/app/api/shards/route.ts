// src/app/api/shards/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 初始化超级客户端 (这就有了上帝视角)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const runtime = 'edge';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || 'user_01'; // 默认 user_01

    // 此时使用的是 Service Role Key，无视 RLS 限制
    const { data, error } = await supabase
        .from('memory_shards')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Supabase Error:', error);
        return NextResponse.json({ data: [] });
    }

    return NextResponse.json({ data: data || [] });

  } catch (error) {
    return NextResponse.json({ data: [] });
  }
}