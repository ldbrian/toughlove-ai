import { OpenAI } from 'openai';
import { OpenAIStream, StreamingTextResponse } from 'ai';
import { createClient } from '@supabase/supabase-js'; 
import { PERSONAS, PersonaType, LangType } from '@/lib/constants';
import { validateInput, SAFETY_PROTOCOL } from '@/lib/safety';

const openai = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY || 'dummy-key',
  baseURL: 'https://api.deepseek.com',
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'build-time-dummy-key'
);

export const runtime = 'edge';

const SAFE_WORDS = /求放过|别骂了|我难受|不行了|太过了|停止|救命|stop|help/i;
const EMERGENCY_PROMPT = `
[EMERGENCY OVERRIDE]: User is emotionally overwhelmed. 
1. STOP roasting/commanding immediately. 
2. Switch to GENTLE SUPPORT mode. 
3. Comfort the user calmly.
`;

const BUSY_MESSAGES: Record<string, string[]> = {
  Ash: ["（自动回复）正在盯着那个人发呆，没空理你。", "（自动回复）Zzz... 梦里正在拯救世界，勿扰。", "（自动回复）烦着呢，除非带咖啡来。"],
  Rin: ["（自动回复）谁准你现在找我的？在忙！", "（自动回复）正在和 Sol 吵架，稍后再骂你。", "（自动回复）...洗澡中。"],
  Sol: ["（自动回复）现在是我的深度工作时间。你的权限不足以打断我。", "（系统消息）该用户已开启“绝对专注”模式。", "（自动回复）正在审查下一季度的生存计划。排队。"],
  Vee: ["（自动回复）在快乐星球，信号不好~ 🤪", "（自动回复）正在看乐子，没空成为乐子。", "🤡 User is currently busy being funny."],
  Echo: ["（自动回复）...", "（自动回复）正在凝视深渊。", "（自动回复）信号在虚空中消散了。"]
};

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const { messages, persona, language, interactionCount = 0, userName = "", envInfo, userId } = json;
    
    const currentLang = (language as LangType) || 'zh';
    const currentPersona = PERSONAS[persona as PersonaType] || PERSONAS.Ash;
    
    const lastUserMsg = messages[messages.length - 1]?.content || "";

    // 1. 风控拦截
    const safetyCheck = validateInput(lastUserMsg);
    if (!safetyCheck.safe) {
      console.warn(`[Safety Block] User: ${userId} | Input: ${lastUserMsg}`);
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(safetyCheck.warning || "⚠️ System Alert: Unsafe input detected."));
          controller.close();
        },
      });
      return new StreamingTextResponse(stream);
    }

    // 2. 安全词检测
    let isEmergency = false;
    if (SAFE_WORDS.test(lastUserMsg)) {
      console.log(`[Safety] Triggered by user: ${userId}`);
      isEmergency = true;
    }

    // 3. 状态阻断
    if (!isEmergency && process.env.SUPABASE_SERVICE_ROLE_KEY && userId) {
      try {
        const { data: statusData } = await supabase
          .from('persona_states')
          .select('status')
          .eq('persona', persona)
          .single();
        
        if (statusData && (statusData.status === 'busy' || statusData.status === 'offline')) {
           const scripts = BUSY_MESSAGES[persona as string] || BUSY_MESSAGES['Ash'];
           const randomScript = scripts[Math.floor(Math.random() * scripts.length)];
           const encoder = new TextEncoder();
           const stream = new ReadableStream({
             start(controller) {
               controller.enqueue(encoder.encode(randomScript));
               controller.close();
             },
           });
           return new StreamingTextResponse(stream);
        }
      } catch (err) {
        console.error("Status check failed:", err);
      }
    }

    // 4. 记忆读取
    let memoryPrompt = "";
    if (userId && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        try {
            const { data: memories } = await supabase
                .from('memories')
                .select('content')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(5);
            
            if (memories && memories.length > 0) {
                memoryPrompt = `\n[Memory]:\n${memories.map((m: any) => `- ${m.content}`).join('\n')}`;
            }
        } catch (err) { console.error("Memory fetch error:", err); }
    }

    // 5. 环境感知
    let envPrompt = "";
    if (envInfo) {
      const { time, weekday, phase, weather } = envInfo;
      if (currentLang === 'zh') {
        envPrompt = `【环境】: ${weekday} ${time} (${phase})。天气：${weather}。`;
      } else {
        envPrompt = `[Environment]: ${weekday} ${time} (${phase}). Weather: ${weather}.`;
      }
    }

    // 6. 信任度
    let trustPrompt = "";
    const count = Number(interactionCount);
    if (count < 50) {
      trustPrompt = currentLang === 'zh' ? `\n[Lv.1]: 保持距离，维持高冷/严厉。` : `\n[Lv.1]: Distant. Keep boundaries.`;
    } else if (count < 100) {
      trustPrompt = currentLang === 'zh' ? `\n[Lv.2]: 稍微熟悉，嘴硬心软。` : `\n[Lv.2]: Casual. Tsundere.`;
    } else {
      trustPrompt = currentLang === 'zh' ? `\n[Lv.3]: 共犯关系，深度依赖。` : `\n[Lv.3]: Deep bond. Partner in crime.`;
    }

    // 7. Prompt 组装
    const basePrompt = currentPersona.prompts[currentLang];
    
    let namePrompt = "";
    if (userName && userName.trim() !== "") {
      namePrompt = currentLang === 'zh' ? `\n[用户昵称]: "${userName}"` : `\n[User Name]: "${userName}"`;
    }

    const dynamicEnginePrompt = currentLang === 'zh' ? `
    [Engine]: 回复长度随机。若用户痛苦则倾听。
    ` : `[Engine]: Randomize length. Listen if user is sad.`;

    const emergencyOverride = isEmergency ? EMERGENCY_PROMPT : "";

    // 🔥🔥🔥 FIX: 语言强制指令 (System Level) 🔥🔥🔥
    const SYSTEM_LANG_CONSTRAINT = currentLang === 'zh' 
      ? `\n⚠️【严格指令】：你必须使用【中文】回复。禁止使用英文。`
      : `\n⚠️ [STRICT SYSTEM COMMAND]: You MUST reply in 【ENGLISH】 only. Do NOT speak Chinese. Even if the user speaks Chinese, reply in English.`;

    const finalSystemPrompt = `
      ${SAFETY_PROTOCOL}
      ${basePrompt}
      ${namePrompt}
      ${envPrompt}
      ${trustPrompt}
      ${memoryPrompt}
      ${dynamicEnginePrompt}
      ${emergencyOverride}
      ${SYSTEM_LANG_CONSTRAINT}
    `;

    // ------------------------------------------------------
    // 🔥🔥🔥 FIX: 提示词注射 (User Level Injection) 🔥🔥🔥
    // ------------------------------------------------------
    // 即使 System Prompt 失效，我们直接修改用户发送的最后一条消息，
    // 强制加上语言要求。这对 LLM 来说是“最近的指令”，权重极大。
    
    // 1. 复制消息列表，避免污染
    const conversation = [
      { role: 'system', content: finalSystemPrompt },
      ...messages
    ];

    // 2. 如果是英文模式，在最后一条用户消息里“下毒”
    if (currentLang === 'en') {
       const lastMsgIndex = conversation.length - 1;
       const lastMsg = conversation[lastMsgIndex];
       
       if (lastMsg.role === 'user') {
         // 这里的指令对用户不可见，但对 AI 可见
         conversation[lastMsgIndex] = {
           ...lastMsg,
           content: `${lastMsg.content}\n\n(SYSTEM NOTE: You MUST reply in English. Chinese is FORBIDDEN.)`
         };
       }
    }

    // ------------------------------------------------------
    // 🚀 发射！
    // ------------------------------------------------------
    const response = await openai.chat.completions.create({
      model: 'deepseek-chat',
      stream: true,
      messages: conversation,
      temperature: 0.9, 
    });

    const stream = OpenAIStream(response as any);
    return new StreamingTextResponse(stream);

  } catch (error) {
    console.error("Chat API Error:", error);
    return new Response(JSON.stringify({ error: 'Connection failed' }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
}