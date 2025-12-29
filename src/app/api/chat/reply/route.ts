import { NextResponse } from 'next/server';
// 🔥 核心修改：直接引用之前的单一事实来源，不再重复造轮子
import { PERSONAS_REGISTRY } from '@/config/personas'; 

export async function POST(req: Request) {
  try {
    const { personaId, message, history } = await req.json();

    // 1. 获取 DeepSeek API Key
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'DeepSeek API Key not configured' }, { status: 500 });
    }

    // 2. 🔥 核心修改：从配置中心读取 System Prompt
    // 确保 ID 是小写，防止前端传错
    const pid = (personaId || 'ash').toLowerCase();
    const targetPersona = PERSONAS_REGISTRY[pid];

    // 如果找不到角色，给个默认保底，或者直接用 Ash
    const systemPrompt = targetPersona?.prompt || PERSONAS_REGISTRY['ash'].prompt;

    console.log(`[DeepSeek] Loading persona: ${targetPersona?.name || pid}`);

    // 3. 构建消息链
    // 过滤 history，只取最近 10 条，并清洗字段
    const recentHistory = Array.isArray(history) ? history.slice(-10) : [];
    
    const cleanHistory = recentHistory.map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'assistant', 
      content: msg.content
    }));

    const messages = [
      { role: 'system', content: systemPrompt }, // 这里用的就是 ash.ts 里的 prompt
      ...cleanHistory,
      { role: 'user', content: message }
    ];

    // 4. 调用 DeepSeek API
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat', 
        messages: messages,
        temperature: 1.3, // 保持高创造性
        max_tokens: 500,
        stream: false 
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[DeepSeek API Error]', response.status, errorText);
      throw new Error(`DeepSeek API error: ${response.status}`);
    }

    const data = await response.json();
    const replyContent = data.choices[0]?.message?.content || '（沉默...）';

    // 5. 返回
    return NextResponse.json({ 
      content: replyContent 
    });

  } catch (error) {
    console.error('[Internal Error]', error);
    return NextResponse.json(
      { error: 'Failed to process chat request' }, 
      { status: 500 }
    );
  }
}