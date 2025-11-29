import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 移除 Edge Runtime 确保日志能完整打印
// export const runtime = 'edge'; 

export async function POST(req: Request) {
  console.log("👉 [API Debug] POST Request Received");

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error("❌ [API Debug] Critical: Missing Env Vars");
    return NextResponse.json({ 
        error: 'Config Error', 
        details: 'SUPABASE_SERVICE_ROLE_KEY is missing' 
    }, { status: 500 });
  }

  try {
    const supabase = createClient(url, key);
    const body = await req.json();
    // 🔥 关键修复：解构出 persona
    const { userId, type, content, persona } = body;

    console.log(`👉 [API Debug] Attempting insert: User=${userId}, Type=${type}, Persona=${persona}`);

    const { data, error } = await supabase.from('memories').insert({
      user_id: userId,
      type: type,
      content: content || '',
      // 🔥 关键修复：写入 persona，如果前端没传，默认给 'System'
      persona: persona || 'System' 
    }).select();

    if (error) {
      console.error("❌ [API Debug] Supabase Insert Failed:", JSON.stringify(error, null, 2));
      return NextResponse.json({ 
          error: 'Database Error', 
          message: error.message 
      }, { status: 500 });
    }

    console.log("✅ [API Debug] Insert Success!");
    return NextResponse.json({ success: true, data });

  } catch (e: any) {
    console.error("❌ [API Debug] Server Exception:", e);
    return NextResponse.json({ error: 'Server Exception', details: e.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  const type = searchParams.get('type');
  const limit = searchParams.get('limit') || '9';
  
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  try {
    const { data, error } = await supabase
      .from('memories')
      .select('created_at, content')
      .eq('user_id', userId)
      .eq('type', type)
      .order('created_at', { ascending: false })
      .limit(9);

    if (error) throw error;
    return NextResponse.json({ data: data || [] });
  } catch (e: any) {
    console.error("❌ [API Debug] GET Error:", e.message);
    return NextResponse.json({ data: [] });
  }
}