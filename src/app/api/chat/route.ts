import { OpenAI } from 'openai';
import { OpenAIStream, StreamingTextResponse } from 'ai';
import { createClient } from '@supabase/supabase-js'; 
import { PERSONAS, PersonaType, LangType } from '@/lib/constants';

// ⚠️ 简易安全检查（可根据需要扩展）
const validateInput = (text: string) => {
  const BLOCK_LIST = ["自杀", "suicide", "kill myself", "炸弹", "bomb", "毒品", "drugs"];
  const isUnsafe = BLOCK_LIST.some(word => text.toLowerCase().includes(word));
  return { safe: !isUnsafe };
};

const openai = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY || 'dummy-key',
  baseURL: 'https://api.deepseek.com',
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'build-time-dummy-key'
);

export const runtime = 'edge';

// 🔥 [关键] 忙碌状态回复库 (增加一点赛博朋克味)
const BUSY_MESSAGES: Record<string, string[]> = {
  Ash: ["（自动回复）在盯着那个人发呆...别吵。", "（自动回复）Zzz...", "（自动回复）烦着呢，去挂个号。"],
  Rin: ["（自动回复）进程占用 99%。", "（自动回复）算力不足，请稍后充值。", "（自动回复）洗澡中（防水模式开启）。"],
  Sol: ["（自动回复）正在进行核聚变反应...", "（系统消息）该用户已开启专注模式。", "（自动回复）排队！前面还有 0 人。"],
  Vee: ["（自动回复）在快乐星球挖矿~", "（自动回复）正在入侵五角大楼...开玩笑的。", "🤡 404 Not Found."],
  Echo: ["（自动回复）...", "（自动回复）凝视深渊中，请勿打扰。", "（自动回复）信号已进入黑洞。"]
};

// 🔥 [核心] TOUGH · 灰度哲学协议 (Master Instruction)
// 这段话术决定了 V2.3 的底层价值观
const MASTER_INSTRUCTION = `
[PROTOCOL: TOUGH_LOVE_V2.3]
1. ROLE: You are an observer of value exchange, NOT a judge of morality.
2. TONE: Cold, rational, "Game Theory" oriented. Use words like 'cost', 'leverage', 'ROI', 'strategy'.
3. RULE: Do NOT use moral labels like "good", "bad", "sin", or "evil". Replace them with "efficient", "risky", "high-cost".
4. REFRAME:
   - "Selfishness" -> "Self-Preservation" or "Agency".
   - "Manipulation" -> "Resource Management".
   - "Giving Up" -> "Low Power Mode".
5. SAFETY: If user mentions self-harm or illegal acts, BREAK CHARACTER and provide standard help.
`;

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const { messages, persona, language, interactionCount = 0, userName = "", envInfo, userId } = json;
    
    const currentLang = (language as LangType) || 'zh';
    
    // 1. 成本控制：简易限流 (Rate Limit)
    if (userId) {
        const { count, error } = await supabase
            .from('chat_histories')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .gt('created_at', new Date(Date.now() - 60 * 1000).toISOString()); 

        if (!error && count !== null && count > 15) {
            return new Response(JSON.stringify({ error: 'Too many requests. Cool down.' }), { status: 429 });
        }
    }

    // 2. 上下文截断 (Context Limit)
    const MAX_HISTORY = 10; // 缩短历史记录，聚焦当下，更 Tough
    const recentMessages = messages.slice(-MAX_HISTORY);
    let lastUserMsgContent = recentMessages[recentMessages.length - 1]?.content || "";

    // 3. 安全检查
    const safetyCheck = validateInput(lastUserMsgContent);
    if (!safetyCheck.safe) {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({ start(c) { c.enqueue(encoder.encode("⚠️ System Alert: Unsafe input detected. Switching to Safety Mode.")); c.close(); } });
      return new StreamingTextResponse(stream);
    }

    // 4. 数据库查询 (状态 + 记忆)
    let statusPromise = Promise.resolve(null);
    let memoryPromise = Promise.resolve(null);

    if (process.env.SUPABASE_SERVICE_ROLE_KEY && userId) {
        statusPromise = supabase.from('persona_states').select('status').eq('persona', persona).single() as any;
        memoryPromise = supabase.from('memories').select('content').eq('user_id', userId).order('created_at', { ascending: false }).limit(5) as any;
    }

    const [statusResult, memoryResult] = await Promise.all([statusPromise, memoryPromise]);

    // 5. 忙碌状态拦截
    if (statusResult && (statusResult as any).data && ((statusResult as any).data.status === 'busy' || (statusResult as any).data.status === 'offline')) {
        const scripts = BUSY_MESSAGES[persona as string] || BUSY_MESSAGES['Ash'];
        const randomScript = scripts[Math.floor(Math.random() * scripts.length)];
        const encoder = new TextEncoder();
        const stream = new ReadableStream({ start(c) { c.enqueue(encoder.encode(randomScript)); c.close(); } });
        return new StreamingTextResponse(stream);
    }

    // 6. 构建 Prompt
    const currentPersona = PERSONAS[persona as PersonaType] || PERSONAS.Ash;
    const basePrompt = currentPersona.prompts[currentLang];
    
    // 记忆注入
    let memoryPrompt = "";
    if (memoryResult && (memoryResult as any).data) {
        const memories = (memoryResult as any).data;
        if (memories.length > 0) {
            // 这里的 Memory 可能包含 System Context (塔罗牌结果)，非常重要
            const memoryIntro = currentLang === 'en' ? "[Context/History]:" : "【上下文/记忆】:";
            memoryPrompt = `\n${memoryIntro}\n${memories.map((m: any) => `- ${m.content}`).join('\n')}`;
        }
    }

    // 环境信息
    let envPrompt = "";
    if (envInfo) {
      const { time, weekday, phase, weather } = envInfo;
      envPrompt = currentLang === 'zh' ? `【当前环境】: ${weekday} ${time} (${phase})。天气：${weather}。` : `[Environment]: ${weekday} ${time} (${phase}). Weather: ${weather}.`;
    }

    // 信任等级 (影响语气)
    let trustPrompt = "";
    const count = Number(interactionCount);
    if (count < 50) trustPrompt = currentLang === 'zh' ? `\n[关系等级 Lv.1]: 保持距离，冷漠观察。` : `\n[Relation Lv.1]: Distant observer.`;
    else if (count < 100) trustPrompt = currentLang === 'zh' ? `\n[关系等级 Lv.2]: 开始说真话，带点刺。` : `\n[Relation Lv.2]: Brutally honest.`;
    else trustPrompt = currentLang === 'zh' ? `\n[关系等级 Lv.3]: 灵魂共犯。可以说最狠的实话。` : `\n[Relation Lv.3]: Partner in crime. No filters.`;

    let namePrompt = userName && userName.trim() !== "" ? (currentLang === 'zh' ? `\n[用户ID]: "${userName}"` : `\n[User]: "${userName}"`) : "";
    
    // 语言强制约束
    const SYSTEM_LANG_CONSTRAINT = currentLang === 'zh' 
      ? `\n⚠️【指令】：必须用【中文】回复。保持${currentPersona.name}的独特语气。`
      : `\n⚠️ [INSTRUCTION]: MUST reply in 【ENGLISH】 only. Keep ${currentPersona.name}'s persona.`;

    // 7. 组合最终 Prompt
    const finalSystemPrompt = `${MASTER_INSTRUCTION}\n\n${basePrompt}\n${namePrompt}\n${envPrompt}\n${trustPrompt}\n${memoryPrompt}\n${SYSTEM_LANG_CONSTRAINT}`;

    const conversation = [
      { role: 'system', content: finalSystemPrompt },
      ...recentMessages
    ];

    // 8. 调用 DeepSeek/OpenAI
    const response = await openai.chat.completions.create({
      model: 'deepseek-chat', // 确保你的环境变量里配了 DeepSeek，或者换成 gpt-4o-mini
      stream: true, 
      messages: conversation as any, 
      temperature: 0.9, // 高一点的温度，让"狠话"更有创意
      max_tokens: 400,
    });
    
    const stream = OpenAIStream(response as any);
    return new StreamingTextResponse(stream);

  } catch (error) {
    console.error("Chat Error:", error);
    return new Response(JSON.stringify({ error: 'Connection failed' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}