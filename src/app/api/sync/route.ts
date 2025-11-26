import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { processRollingMemory } from '@/lib/memory'; 

// 初始化 Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'build-time-dummy-key';

const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, userId, persona } = body;

    // 🕵️‍♂️ 鉴证日志 1：检查入参
    console.log(`[Sync DEBUG] Request received for User: ${userId}`);
    console.log(`[Sync DEBUG] Messages count: ${messages?.length}`);
    
    // 🕵️‍♂️ 鉴证日志 2：检查 Key 是否正常 (只打印前5位，安全)
    console.log(`[Sync DEBUG] Using Key starting with: ${supabaseKey.substring(0, 5)}...`);

    if (!userId || !messages || messages.length === 0) {
      console.warn("[Sync DEBUG] ❌ Missing parameters");
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // 1. 确保 Profile 存在
    const { error: profileError } = await supabase.from('profiles').upsert(
      { id: userId, last_active: new Date().toISOString() },
      { onConflict: 'id' }
    );

    if (profileError) {
        // 🔥 这里是关键！如果这里报错，说明数据库拒收
        console.error("❌ [Sync DEBUG] Profile Upsert Failed:", profileError);
        return NextResponse.json({ error: `Profile DB Error: ${profileError.message}` }, { status: 500 });
    } else {
        console.log("✅ [Sync DEBUG] Profile updated.");
    }

    // 2. 存入新消息 (Chat Logs)
    const newMsgs = messages.slice(-2); 
    
    // 构造要插入的数据数组
    const chatRows = newMsgs.map((msg: any) => ({
        user_id: userId,
        role: msg.role,
        content: msg.content,
        persona: persona || 'Ash',
        created_at: new Date().toISOString()
    }));

    console.log(`[Sync DEBUG] Attempting to insert ${chatRows.length} chat logs...`);

    const { error: chatError } = await supabase.from('chat_histories').insert(chatRows);

    if (chatError) {
        // 🔥 这里的错误才是真相
        console.error("❌ [Sync DEBUG] Chat Insert Failed:", chatError);
        return NextResponse.json({ error: `Chat DB Error: ${chatError.message}` }, { status: 500 });
    } else {
        console.log("✅ [Sync DEBUG] Chat logs inserted.");
    }

    // 3. 触发记忆提炼 (不阻塞)
    processRollingMemory(userId, persona || 'Ash').catch(err => 
        console.error("[Sync DEBUG] Rolling memory failed:", err)
    );

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('❌ [Sync DEBUG] Fatal API Error:', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

// GET 方法保持不变
export async function GET(req: NextRequest) {
    // ... (保持原样即可，或者为了省事你可以把之前的 GET 代码贴在这里)
    return NextResponse.json({ messages: [] }); 
}