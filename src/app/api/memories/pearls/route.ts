// src/app/api/memories/pearls/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 初始化服务端客户端 (绕过 RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const runtime = 'edge';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
        return NextResponse.json({ data: [] });
    }

    // 查询类型为 summary_hollow 的记忆
    const { data, error } = await supabase
        .from('memories')
        .select('*')
        .eq('user_id', userId)
        .eq('type', 'summary_hollow') // 只看树洞总结
        .order('created_at', { ascending: false })
        .limit(20);

    if (error) {
        console.error('Pearls API Error:', error);
        return NextResponse.json({ data: [] });
    }

    return NextResponse.json({ data: data || [] });

  } catch (error) {
    console.error('Pearls API Exception:', error);
    return NextResponse.json({ data: [] });
  }
}