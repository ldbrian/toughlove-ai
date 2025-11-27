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
const EMERGENCY_PROMPT = `[EMERGENCY OVERRIDE]: STOP roasting. Switch to GENTLE SUPPORT. Comfort the user.`;

const BUSY_MESSAGES: Record<string, string[]> = {
  Ash: ["（自动回复）正在盯着那个人发呆...", "（自动回复）Zzz...", "（自动回复）烦着呢。"],
  Rin: ["（自动回复）谁准你现在找我的？", "（自动回复）在忙！", "（自动回复）洗澡中。"],
  Sol: ["（自动回复）深度工作时间。", "（系统消息）该用户已开启专注模式。", "（自动回复）排队。"],
  Vee: ["（自动回复）在快乐星球~", "（自动回复）正在看乐子。", "🤡 Busy being funny."],
  Echo: ["（自动回复）...", "（自动回复）凝视深渊中。", "（自动回复）信号消散了。"]
};

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const { messages, persona, language, interactionCount = 0, userName = "", envInfo, userId } = json;
    
    const currentLang = (language as LangType) || 'zh';
    const currentPersona = PERSONAS[persona as PersonaType] || PERSONAS.Ash;
    const lastUserMsg = messages[messages.length - 1]?.content || "";

    const safetyCheck = validateInput(lastUserMsg);
    if (!safetyCheck.safe) {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({ start(c) { c.enqueue(encoder.encode("⚠️ System Alert: Unsafe input.")); c.close(); } });
      return new StreamingTextResponse(stream);
    }

    let isEmergency = false;
    if (SAFE_WORDS.test(lastUserMsg)) isEmergency = true;

    // 并行请求
    let statusPromise = Promise.resolve(null);
    let memoryPromise = Promise.resolve(null);

    if (!isEmergency && process.env.SUPABASE_SERVICE_ROLE_KEY && userId) {
        statusPromise = supabase.from('persona_states').select('status').eq('persona', persona).single() as any;
    }
    if (userId && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        memoryPromise = supabase.from('memories').select('content').eq('user_id', userId).order('created_at', { ascending: false }).limit(5) as any;
    }

    const [statusResult, memoryResult] = await Promise.all([statusPromise, memoryPromise]);

    if (statusResult && (statusResult as any).data && ((statusResult as any).data.status === 'busy' || (statusResult as any).data.status === 'offline')) {
        const scripts = BUSY_MESSAGES[persona as string] || BUSY_MESSAGES['Ash'];
        const randomScript = scripts[Math.floor(Math.random() * scripts.length)];
        const encoder = new TextEncoder();
        const stream = new ReadableStream({ start(c) { c.enqueue(encoder.encode(randomScript)); c.close(); } });
        return new StreamingTextResponse(stream);
    }

    let memoryPrompt = "";
    if (memoryResult && (memoryResult as any).data) {
        const memories = (memoryResult as any).data;
        if (memories.length > 0) {
            const memoryIntro = currentLang === 'en' ? "IGNORE memory language. Use FACTS but reply in ENGLISH." : "【记忆】";
            memoryPrompt = `\n[Memory]:\n${memoryIntro}:\n${memories.map((m: any) => `- ${m.content}`).join('\n')}`;
        }
    }

    let envPrompt = "";
    if (envInfo) {
      const { time, weekday, phase, weather } = envInfo;
      envPrompt = currentLang === 'zh' ? `【环境】: ${weekday} ${time} (${phase})。天气：${weather}。` : `[Environment]: ${weekday} ${time} (${phase}). Weather: ${weather}.`;
    }

    let trustPrompt = "";
    const count = Number(interactionCount);
    if (count < 50) trustPrompt = currentLang === 'zh' ? `\n[Lv.1]: 高冷/严厉。` : `\n[Lv.1]: Distant.`;
    else if (count < 100) trustPrompt = currentLang === 'zh' ? `\n[Lv.2]: 嘴硬心软。` : `\n[Lv.2]: Casual. Tsundere.`;
    else trustPrompt = currentLang === 'zh' ? `\n[Lv.3]: 共犯/依赖。` : `\n[Lv.3]: Deep bond.`;

    const basePrompt = currentPersona.prompts[currentLang];
    let namePrompt = userName && userName.trim() !== "" ? (currentLang === 'zh' ? `\n[用户]: "${userName}"` : `\n[User]: "${userName}"`) : "";
    const dynamicEnginePrompt = currentLang === 'zh' ? `[Engine]: 回复长度随机。` : `[Engine]: Randomize length.`;
    const emergencyOverride = isEmergency ? EMERGENCY_PROMPT : "";

    const SYSTEM_LANG_CONSTRAINT = currentLang === 'zh' 
      ? `\n⚠️【严格指令】：必须用【中文】回复。`
      : `\n⚠️ [CRITICAL]: MUST reply in 【ENGLISH】 only. NO CHINESE. Actions in parentheses MUST be English.`;

    const finalSystemPrompt = `${SAFETY_PROTOCOL} ${basePrompt} ${namePrompt} ${envPrompt} ${trustPrompt} ${memoryPrompt} ${dynamicEnginePrompt} ${emergencyOverride} ${SYSTEM_LANG_CONSTRAINT}`;

    const conversation = [{ role: 'system', content: finalSystemPrompt }, ...messages];

    // 🔥 隐形注射：用户消息末尾再次强调
    if (currentLang === 'en') {
       const lastMsgIndex = conversation.length - 1;
       const lastMsg = conversation[lastMsgIndex];
       if (lastMsg.role === 'user') {
         conversation[lastMsgIndex] = { ...lastMsg, content: `${lastMsg.content}\n\n[SYSTEM: REPLY IN ENGLISH ONLY. NO CHINESE CHARACTERS.]` };
       }
       conversation.push({ role: 'system', content: "OUTPUT ENGLISH ONLY." });
    }

    const response = await openai.chat.completions.create({ model: 'deepseek-chat', stream: true, messages: conversation, temperature: 0.9 });
    const stream = OpenAIStream(response as any);
    return new StreamingTextResponse(stream);

  } catch (error) {
    return new Response(JSON.stringify({ error: 'Connection failed' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}