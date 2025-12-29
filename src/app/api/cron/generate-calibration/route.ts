import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';

// ----------------------------------------------------------------------
// 1. 兜底数据 (当 AI 罢工时使用)
// ----------------------------------------------------------------------
const FALLBACK_QUESTION = {
  content: "系统检测到你的压力值波动。此刻，你最想做的是什么？",
  options: [
    { label: "关闭所有通知，独处一小时", dimension: "ego", score: 80 },
    { label: "找个朋友大吃一顿", dimension: "empathy", score: 60 },
    { label: "疯狂工作，麻痹自己", dimension: "reality", score: 90 },
    { label: "去虚拟空间漫无目的地游荡", dimension: "chaos", score: 70 }
  ]
};

export async function GET() {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    const baseUrl = process.env.OPENAI_BASE_URL;
    const modelName = process.env.OPENAI_MODEL_NAME || "deepseek-chat";

    console.log(`[Calibration Gen] Init. URL: ${baseUrl}, Model: ${modelName}`);

    if (!apiKey) throw new Error("Missing OPENAI_API_KEY");

    const openai = new OpenAI({ apiKey, baseURL: baseUrl });

    // ------------------------------------------------------------------
    // 2. 环境感知
    // ------------------------------------------------------------------
    const now = new Date();
    const localHour = (now.getUTCHours() + 8) % 24;
    const weekday = now.toLocaleDateString('zh-CN', { weekday: 'long' });
    
    let timeSlot = '深夜';
    if (localHour >= 5 && localHour < 12) timeSlot = '早晨';
    else if (localHour >= 12 && localHour < 18) timeSlot = '下午';
    else if (localHour >= 18 && localHour < 22) timeSlot = '晚上';

    // ------------------------------------------------------------------
    // 3. 构建 Prompt (System + User 分离)
    // ------------------------------------------------------------------
    
    const systemPrompt = `
你是一款赛博朋克风格伴侣应用 "Tough Love OS" 的每日校准系统。
你的任务是生成一道【每日校准题】，用于评估用户的心理状态。

**输出语言：简体中文 (Simplified Chinese)**
**输出格式：纯 JSON 对象 (不要包含 Markdown 代码块)**

JSON 结构要求：
{
  "content": "问题描述 (犀利、简短、赛博风格)",
  "options": [
    { 
      "label": "选项文案", 
      "dimension": "维度 (只能选: reality, chaos, empathy, ego)", 
      "score": 1-100 (整数) 
    },
    ... (共4个选项)
  ]
}
`;

    const userPrompt = `
当前时间: ${weekday} ${timeSlot}。
请根据这个时间段生成一道最相关的问题。
例如：周一早晨关于"启动困难"，周五晚上关于"释放"，深夜关于"孤独"或"思考"。
风格：冷静、科技感、略带一点"Tough Love"的严厉。
`;

    // ------------------------------------------------------------------
    // 4. 调用 AI (带错误捕获)
    // ------------------------------------------------------------------
    let result = null;

    try {
        console.log("[Calibration Gen] Sending request...");
        const completion = await openai.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            model: modelName,
            temperature: 0.7,
            max_tokens: 1000,
            stream: false, 
            // 🔥 关键修复：移除 response_format
        });

        let raw = completion.choices[0].message.content || "";
        // 暴力清洗 Markdown
        raw = raw.replace(/```json/g, "").replace(/```/g, "").trim();
        
        result = JSON.parse(raw);
        console.log("[Calibration Gen] Success.");
    } catch (apiError: any) {
        console.error("❌ [Calibration Gen] API Failed:", apiError.message);
        console.warn("⚠️ Switching to FALLBACK question.");
        result = FALLBACK_QUESTION;
    }

    if (!result || !result.content || !Array.isArray(result.options)) {
        result = FALLBACK_QUESTION;
    }

    // ------------------------------------------------------------------
    // 5. 写入数据库
    // ------------------------------------------------------------------
    const newQuestion = await prisma.dailyQuestion.create({
      data: {
        content: result.content,
        type: 'STRONG_CONTEXT', // 标记为强时效题
        weight: 100,
        cooldown: 0,
        options: {
          create: result.options.map((opt: any) => ({
            label: opt.label, // 注意：Schema 里是 label
            value: String(opt.score), // 这里为了兼容旧逻辑，value 存分数的字符串
            dimension: opt.dimension || 'reality',
            score: Number(opt.score) || 10
          }))
        }
      }
    });

    return NextResponse.json({ success: true, question: newQuestion, source: result === FALLBACK_QUESTION ? "fallback" : "ai" });

  } catch (error: any) {
    console.error('Calibration Route Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}