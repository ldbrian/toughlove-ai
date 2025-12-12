import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

export const runtime = 'edge'; // 使用 Edge Runtime 提高响应速度

export async function GET() {
  const start = Date.now();
  
  const healthStatus = {
    database: 'checking',
    ai_service: 'checking',
    latency: 0,
    details: '',
    // 🔥 新增：用户统计字段
    user_stats: {
        total: 0,
        active_10min: 0
    }
  };

  try {
    // 1. 初始化 Supabase (Service Role 权限，用于读取所有用户数据)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 2. 数据库健康检查 & 用户统计 (并行执行以提速)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    
    const [dbCheck, activeCount, totalCount] = await Promise.all([
        // A. 查一行数据测连通性
        supabase.from('items').select('id').limit(1),
        // B. 查活跃人数 (head: true 只返回数量，不返回数据体，极快)
        supabase.from('profiles').select('*', { count: 'exact', head: true }).gt('last_active', tenMinutesAgo),
        // C. 查总注册人数
        supabase.from('profiles').select('*', { count: 'exact', head: true })
    ]);

    if (dbCheck.error) {
        healthStatus.database = 'offline';
        healthStatus.details = `DB Error: ${dbCheck.error.message}`;
    } else {
        healthStatus.database = 'online';
        // 填充真实数据 (如果出错则默认为 0)
        healthStatus.user_stats.active_10min = activeCount.count || 0;
        healthStatus.user_stats.total = totalCount.count || 0;
    }

    // 3. AI 服务检查 (保持简单 Ping)
    const openai = new OpenAI({
        apiKey: process.env.DEEPSEEK_API_KEY || 'dummy',
        baseURL: 'https://api.deepseek.com',
        timeout: 5000
    });

    try {
        await openai.models.list();
        healthStatus.ai_service = 'online';
    } catch (aiErr: any) {
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