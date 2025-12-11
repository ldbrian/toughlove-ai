import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// 移除 Edge Runtime，因为某些 OpenAI 库在 Edge 上可能表现不同
// export const runtime = 'edge'; 

export async function GET() {
  const start = Date.now();
  
  const healthStatus = {
    database: 'checking',
    ai_service: 'checking',
    latency: 0,
    details: ''
  };

  try {
    // 1. 检查数据库
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { error: dbError } = await supabase.from('items').select('id').limit(1);
    healthStatus.database = dbError ? 'offline' : 'online';

    // 2. 🚀 真实检查 AI 服务 (发起一个极小的请求)
    const openai = new OpenAI({
        apiKey: process.env.DEEPSEEK_API_KEY || 'dummy',
        baseURL: 'https://api.deepseek.com',
        timeout: 5000 // 5秒超时
    });

    try {
        await openai.models.list(); // 列出模型列表通常比生成文本快且便宜
        healthStatus.ai_service = 'online';
    } catch (aiErr: any) {
        console.error("Health Check AI Error:", aiErr);
        healthStatus.ai_service = 'offline';
        healthStatus.details = `AI Error: ${aiErr.message}`;
    }

    healthStatus.latency = Date.now() - start;

    return NextResponse.json(healthStatus);

  } catch (e: any) {
    return NextResponse.json({
        database: 'critical_fail',
        ai_service: 'offline',
        message: e.message
    }, { status: 500 });
  }
}