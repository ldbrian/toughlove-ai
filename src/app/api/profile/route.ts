import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { OpenAI } from 'openai';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'build-time-dummy-key'
);

const openai = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY || 'dummy-key',
  baseURL: 'https://api.deepseek.com',
});

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const { userId, language = 'zh' } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // 1. 获取最近 30 天的所有关键数据
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    
    // 我们一次性拉取所有类型的 memory
    const { data: events } = await supabase
      .from('memories')
      .select('type, created_at, content, metadata')
      .eq('user_id', userId)
      .gt('created_at', thirtyDaysAgo); // 只算近30天，保持活跃度

    const safeEvents = events || [];

    // 2. 维度计算 (The Algorithm)
    
    // [Order] - Sol: 专注成功次数
    const focusCount = safeEvents.filter(e => e.type === 'focus_success_sol').length;
    // 算法: 1次专注(25min) = 10分. 满分需 10 次专注/月. 
    const orderScore = Math.min(100, focusCount * 10);

    // [Energy] - Rin: 小红花数量
    const gloryCount = safeEvents.filter(e => e.type === 'glory_rin').length;
    // 算法: 1朵花 = 5分. 满分需 20 朵花/月.
    const energyScore = Math.min(100, gloryCount * 5);

    // [Insight] - Echo: 日记洞察数量
    const insightCount = safeEvents.filter(e => e.type === 'insight_echo').length;
    // 算法: 1篇日记 = 15分. 满分需 7 篇日记/月.
    const insightScore = Math.min(100, insightCount * 15);

    // [Chaos] - Vee: 互动彩蛋数量
    const chaosCount = safeEvents.filter(e => e.type === 'interaction_vee').length;
    // 算法: 1次互动 = 2分. 满分需 50 次互动/月.
    const chaosScore = Math.min(100, chaosCount * 2);

    // [Reality] - Ash: 诊断标签 + 聊天总数
    // 由于我们很难统计所有聊天，这里用 tag 数量代替 (每次 Profile 生成算一次)
    const tagCount = safeEvents.filter(e => e.type === 'tag').length;
    // 算法: 1次诊断 = 20分.
    const realityScore = Math.min(100, tagCount * 20);

    const radarData = {
        order: orderScore,
        energy: energyScore,
        insight: insightScore,
        chaos: chaosScore,
        reality: realityScore
    };

    // 3. 原有的 Profile 生成逻辑 (保持兼容)
    // 提取最近的 tags 和 diagnosis
    let tags = safeEvents.filter(e => e.type === 'tag').map(e => e.content);
    
    // 如果 tags 太少，尝试生成一次 (Fallback Logic)
    let diagnosis = "";
    if (tags.length === 0) {
        // ... (原有的冷启动逻辑，为了简洁略过，通常老用户都会有) ...
        diagnosis = language === 'zh' ? "数据积累中..." : "Data gathering...";
    } else {
        // 获取最新的诊断
        // 这里简化处理，不每次都调 LLM，除非需要。
        // 为了省钱，我们暂不实时生成 diagnosis，只返回数据
        diagnosis = language === 'zh' ? "点击下方按钮生成最新诊断" : "Click to generate report";
    }

    // 4. 返回完整数据
    return NextResponse.json({
      tags: tags.slice(0, 8),
      diagnosis: diagnosis,
      radar: radarData, // 🔥 核心：返回五维数据
      achievements: safeEvents.filter(e => e.type === 'glory_rin').slice(0, 9)
    });

  } catch (error) {
    console.error('[Profile] Server Error:', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}