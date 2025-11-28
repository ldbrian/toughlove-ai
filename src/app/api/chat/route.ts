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

// 🔥 1. 触发词库 (大幅扩充)
const FOCUS_KEYWORDS = /学习|工作|作业|专注|复习|赶ddl|冲刺|考研|备考|效率|拖延|摸鱼|不想动|累了|救命|管管我|自律|书|题|study|work|focus|homework|deadline|grind|lock in|procrastinat|distracted|lazy/i;

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const { messages, persona, language, interactionCount = 0, userName = "", envInfo, userId } = json;
    
    const currentLang = (language as LangType) || 'zh';
    const currentPersona = PERSONAS[persona as PersonaType] || PERSONAS.Ash;
    const lastUserMsg = messages[messages.length - 1]?.content || "";

    // 2. 风控拦截
    const safetyCheck = validateInput(lastUserMsg);
    if (!safetyCheck.safe) {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({ start(c) { c.enqueue(encoder.encode("⚠️ System Alert: Unsafe input.")); c.close(); } });
      return new StreamingTextResponse(stream);
    }

    let isEmergency = false;
    if (SAFE_WORDS.test(lastUserMsg)) isEmergency = true;

    // 3. 数据库并行查询
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

    // 系统级语言锁
    const SYSTEM_LANG_CONSTRAINT = currentLang === 'zh' 
      ? `\n⚠️【严格指令】：必须用【中文】回复。`
      : `\n⚠️ [CRITICAL]: MUST reply in 【ENGLISH】 only. NO CHINESE. Actions in parentheses MUST be English.`;

    const finalSystemPrompt = `${SAFETY_PROTOCOL} ${basePrompt} ${namePrompt} ${envPrompt} ${trustPrompt} ${memoryPrompt} ${dynamicEnginePrompt} ${emergencyOverride} ${SYSTEM_LANG_CONSTRAINT}`;

    // 4. 构造消息队列
    const conversation = [
      { role: 'system', content: finalSystemPrompt },
      ...messages
    ];

    // 🔥🔥🔥 核心修复：如果触发了专注关键词，强制插入一条 System 消息在最后 🔥🔥🔥
    // 这比修改 System Prompt 有效得多，因为它是最新的上下文
    if (persona === 'Sol' && FOCUS_KEYWORDS.test(lastUserMsg)) {
        const triggerInstruction = currentLang === 'zh'
          ? `[系统强制指令]: 检测到用户有学习/工作意向。请严厉嘲讽他的拖延行为，并在你的回复末尾必须加上 "[CMD:FOCUS_OFFER]" 标签。这很重要，用于触发前端功能。`
          : `[SYSTEM TRIGGER]: User wants to study/work. Roast them. You MUST append "[CMD:FOCUS_OFFER]" at the end of your response to trigger the Focus UI.`;
        
        conversation.push({ role: 'system', content: triggerInstruction });
    }

    // 5. 英文模式下的语言锁 (三明治策略尾部)
    if (currentLang === 'en') {
       conversation.push({ role: 'system', content: "OUTPUT ENGLISH ONLY." });
    }

    const response = await openai.chat.completions.create({ model: 'deepseek-chat', stream: true, messages: conversation, temperature: 0.9 });
    const stream = OpenAIStream(response as any);
    return new StreamingTextResponse(stream);

  } catch (error) {
    return new Response(JSON.stringify({ error: 'Connection failed' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}