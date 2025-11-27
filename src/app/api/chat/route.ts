import { OpenAI } from 'openai';
import { OpenAIStream, StreamingTextResponse } from 'ai';
import { createClient } from '@supabase/supabase-js'; 
import { PERSONAS, PersonaType, LangType } from '@/lib/constants';
// 👇 引入风控模块
import { validateInput, SAFETY_PROTOCOL } from '@/lib/safety';

// --- 初始化 (带防崩兜底) ---
const openai = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY || 'dummy-key',
  baseURL: 'https://api.deepseek.com',
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'build-time-dummy-key'
);

export const runtime = 'edge';

// 🔥 1. 安全词配置 (Safety Valve) - 用于紧急情绪熔断
const SAFE_WORDS = /求放过|别骂了|我难受|不行了|太过了|停止|救命|stop|help/i;
const EMERGENCY_PROMPT = `
[EMERGENCY OVERRIDE]: User is emotionally overwhelmed. 
1. STOP roasting/commanding immediately. 
2. Switch to GENTLE SUPPORT mode. 
3. Comfort the user calmly.
`;

// 🔥 2. 忙碌拒接文案 (Status Blocking Scripts)
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
    
    // 获取用户最新一条消息内容
    const lastUserMsg = messages[messages.length - 1]?.content || "";

    // ------------------------------------------------------
    // 🛡️ 逻辑零：核心风控拦截 (The Firewall)
    // ------------------------------------------------------
    // 在进入任何逻辑之前，先检查输入是否安全（本地正则拦截）
    // 防止涉政、暴力或 Prompt 注入攻击
    const safetyCheck = validateInput(lastUserMsg);
    if (!safetyCheck.safe) {
      console.warn(`[Safety Block] User: ${userId} | Input: ${lastUserMsg}`);
      
      // 直接返回警告流，不消耗 LLM Token
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(safetyCheck.warning || "⚠️ System Alert: Unsafe input detected."));
          controller.close();
        },
      });
      return new StreamingTextResponse(stream);
    }

    // ------------------------------------------------------
    // 🚨 逻辑一：安全阀检测 (Safety Valve)
    // ------------------------------------------------------
    let isEmergency = false;
    if (SAFE_WORDS.test(lastUserMsg)) {
      console.log(`[Safety] Triggered by user: ${userId}`);
      isEmergency = true;
    }

    // ------------------------------------------------------
    // 🚫 逻辑二：状态阻断 (Status Blocking)
    // 只有在非紧急情况下才阻断。如果用户喊救命，必须回应。
    // ------------------------------------------------------
    if (!isEmergency && process.env.SUPABASE_SERVICE_ROLE_KEY && userId) {
      try {
        const { data: statusData } = await supabase
          .from('persona_states')
          .select('status')
          .eq('persona', persona)
          .single();
        
        // 如果状态是 busy 或 offline
        if (statusData && (statusData.status === 'busy' || statusData.status === 'offline')) {
           console.log(`[Status] ${persona} is ${statusData.status}. Blocking chat.`);
           
           // 随机选一句拒接骚话
           const scripts = BUSY_MESSAGES[persona as string] || BUSY_MESSAGES['Ash'];
           const randomScript = scripts[Math.floor(Math.random() * scripts.length)];
           
           // 直接返回文本流，不调用 DeepSeek (省钱 + 真实)
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
        // 查状态失败不影响主流程，降级处理
        console.error("Status check failed:", err);
      }
    }

    // ------------------------------------------------------
    // 🧠 逻辑三：记忆读取 (Memory Recall)
    // ------------------------------------------------------
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
                memoryPrompt = `\n【你记得关于该用户的事】：\n${memories.map((m: any) => `- ${m.content}`).join('\n')}`;
            }
        } catch (err) { console.error("Memory fetch error:", err); }
    }

    // ------------------------------------------------------
    // 🌍 逻辑四：环境感知注入 (Env Perception)
    // ------------------------------------------------------
    let envPrompt = "";
    if (envInfo) {
      const { time, weekday, phase, weather } = envInfo;
      if (currentLang === 'zh') {
        envPrompt = `
        【当前外界环境】
        - 时间：${weekday} ${time} (${phase})。
        - 天气：${weather || '未知'}。
        - 策略：如果天气恶劣或深夜，请在回复中隐晦地体现出对环境的感知（如听到雨声、责怪还不睡）。
        `;
      } else {
        envPrompt = `[Environment]: ${weekday} ${time} (${phase}). Weather: ${weather}. React to this.`;
      }
    }

    // ------------------------------------------------------
    // 🤝 逻辑五：信任度 (Trust)
    // ------------------------------------------------------
    let trustPrompt = "";
    const count = Number(interactionCount);
    if (count < 50) {
      trustPrompt = currentLang === 'zh' ? `\n[信任度 Lv.1]: 保持距离，维持高冷/严厉人设。不要轻易给甜头。` : `\n[Trust Lv.1]: Distant.`;
    } else if (count < 100) {
      trustPrompt = currentLang === 'zh' ? `\n[信任度 Lv.2]: 稍微熟悉，可以偶尔流露一丝真实情绪，但嘴依然要硬。` : `\n[Trust Lv.2]: Casual.`;
    } else {
      trustPrompt = currentLang === 'zh' ? `\n[信任度 Lv.3]: 共犯关系。可以展示深层的依赖或病娇的一面。` : `\n[Trust Lv.3]: Deep bond.`;
    }

    // ------------------------------------------------------
    // 🔥 最终 Prompt 组装
    // ------------------------------------------------------
    // 1. 基础人设 (来自 constants)
    const basePrompt = currentPersona.prompts[currentLang];
    
    // 2. 昵称
    let namePrompt = "";
    if (userName && userName.trim() !== "") {
      namePrompt = currentLang === 'zh' ? `\n[用户昵称]: "${userName}"` : `\n[User Name]: "${userName}"`;
    }

    // 3. 动态引擎 (去机械化)
    const dynamicEnginePrompt = currentLang === 'zh' ? `
    ---
    【🔥 动态逻辑引擎】
    1. **去机械化**：回复长度要随机，不要死板。
    2. **状态感知**：若用户无聊 -> 发起游戏。若用户痛苦 -> 认真倾听。
    ---
    ` : `[Dynamic Logic]: Randomize length. Game check.`;

    // 4. 🚨 紧急熔断注入
    const emergencyOverride = isEmergency ? EMERGENCY_PROMPT : "";

    const finalSystemPrompt = `
      ${SAFETY_PROTOCOL}  // 👈 核心：系统指令锁（防止 AI 越狱或被诱导色情/违法）
      ${basePrompt}
      ${namePrompt}
      ${envPrompt}
      ${trustPrompt}
      ${memoryPrompt}
      ${dynamicEnginePrompt}
      ${emergencyOverride}
    `;

    // ------------------------------------------------------
    // 🚀 发射！(Call LLM)
    // ------------------------------------------------------
    const conversation = [
      { role: 'system', content: finalSystemPrompt },
      ...messages
    ];

    const response = await openai.chat.completions.create({
      model: 'deepseek-chat',
      stream: true,
      messages: conversation,
      temperature: 0.9, // 高创造性
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