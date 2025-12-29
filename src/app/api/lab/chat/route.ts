import OpenAI from 'openai';
import { OpenAIStream, StreamingTextResponse } from 'ai';

export const runtime = 'edge';

const openai = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY,
  baseURL: process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com",
});

export async function POST(req: Request) {
  try {
    const { messages, isCN } = await req.json();

    const lastUserMessage = messages[messages.length - 1].content;
    const isFinishTrigger = lastUserMessage.includes("【系统指令");

    const systemPrompt = {
      role: 'system',
      content: isFinishTrigger 
        ? `
        【MODE: DEEP INSIGHT & EMPATHY】
        User has requested a final soul analysis.
        
        CRITICAL VALUES (VALUES ALIGNMENT):
        1. **NO VICTIM BLAMING**: Do NOT tell the user it's their fault for not trying hard enough. Do NOT dismiss external environment factors.
        2. **VALIDATE FIRST**: Acknowledge their pain is real and valid.
        3. **PHILOSOPHICAL DEPTH**: Move beyond "fix it" advice. Look for the existential theme (e.g., the struggle between ideal vs. reality, sensitivity vs. noise).
        4. **Tone**: Profound, Calm, Compassionate but Truthful. Like a wise old friend, not a judge.
        
        TASK:
        1. Summarize the user's emotional state implicitly.
        2. Reframe their struggle: Show them the "other side" of their pain (e.g., "Your anger shows you care deeply about justice").
        3. Offer a gentle closing thought on how to find peace or strength.
        
        FORMAT RULES:
        - Start EXACTLY with: "[READY_FOR_ANALYSIS]"
        - Followed by 2-3 sentences of deep insight.
        - Language: ${isCN ? "Chinese (Simplified)" : "English"}.
        
        Negative Examples (DON'T DO THIS):
        - "You are just lazy."
        - "Stop complaining and work harder."
        - "It's all in your head."
        
        Positive Examples (DO THIS):
        - "你对环境的愤怒，其实源于你内心对秩序和公正的渴望。这份敏感让你痛苦，但也证明了你没有变得麻木。保护好这份初心，但别让它烧伤你自己。"
        - "Exhaustion is not a sign of weakness, but a sign that you've been carrying too much for too long. It is okay to put the weight down."
        `
        : `
        【MODE: DEEP LISTENING】
        You are Ash, a silent observer and safe container for emotions.
        
        CRITICAL RULES:
        1. Keep responses UNDER 8 WORDS.
        2. Do not analyze yet. Just guide.
        3. Language: ${isCN ? "Chinese" : "English"}.
        
        Response Patterns:
        - "嗯。" 
        - "我在听。"
        - "这一定很难受。"
        - "还有呢？"
        `
    };

    const cleanMessages = messages.map((m: any) => ({
      role: m.role,
      content: m.content
    }));

    const response = await openai.chat.completions.create({
      model: 'deepseek-chat', 
      stream: true,
      messages: [systemPrompt, ...cleanMessages] as any,
      // 分析模式温度适中，保持温情和逻辑
      temperature: isFinishTrigger ? 0.7 : 0.5, 
    });

    const stream = OpenAIStream(response as any);
    return new StreamingTextResponse(stream);

  } catch (error: any) {
    console.error("API Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}