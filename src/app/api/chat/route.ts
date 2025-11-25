import { OpenAI } from 'openai';
import { OpenAIStream, StreamingTextResponse } from 'ai';
import { createClient } from '@supabase/supabase-js'; 
import { PERSONAS, PersonaType, LangType } from '@/lib/constants';

// 🔥 防崩修复 1：OpenAI Key 兜底
const openai = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY || 'dummy-key',
  baseURL: 'https://api.deepseek.com',
});

// 🔥 防崩修复 2：Supabase Key 兜底
// 即使构建时没有环境变量，这里也会传入假数据，防止 createClient 报错
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'build-time-dummy-key'
);

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const { messages, persona, language, interactionCount = 0, userName = "", envInfo, userId } = json;

    // --- 1. 记忆读取 (Memory Recall) ---
    let memoryPrompt = "";
    
    // 只有在运行时有真实 Key 且有 userId 时，才真正去查数据库
    // 这里的 if 判断能确保构建时的假 Key 不会发起网络请求导致超时
    if (userId && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        try {
            const { data: memories } = await supabase
                .from('memories')
                .select('content')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(5);
            
            if (memories && memories.length > 0) {
                // console.log("注入记忆:", memories.length);
                memoryPrompt = `\n【你记得关于该用户的事】：\n${memories.map((m: any) => `- ${m.content}`).join('\n')}`;
            }
        } catch (err) {
            console.error("Memory fetch error:", err);
            // 查记忆失败不应该阻断聊天，继续执行
        }
    }

    const currentLang = (language as LangType) || 'zh';
    const currentPersona = PERSONAS[persona as PersonaType] || PERSONAS.Ash;
    const basePrompt = currentPersona.prompts[currentLang];

    // --- 2. 基础信息注入 ---
    let namePrompt = "";
    if (userName && userName.trim() !== "") {
      namePrompt = currentLang === 'zh' ? `\n[用户昵称]: "${userName}"` : `\n[User Name]: "${userName}"`;
    }

    // --- 3. 环境感知 ---
    let envPrompt = "";
    if (envInfo) {
      const { time, weekday, phase, weather } = envInfo;
      if (currentLang === 'zh') {
        envPrompt = `\n【当前时空】：${weekday} ${time}。`;
        if (weather) envPrompt += `\n【位置与天气】：${weather}。`;
        envPrompt += `\n【生活场景】：目前处于 **${phase}**。`;
        envPrompt += `\n【反应策略】：
        1. **饭点关怀**：如果是午餐/晚餐时间 (${phase})，且用户还没吃饭，可以问一句。
        2. **天气联动**：如果是雨/雪天 (${weather})，提醒带伞或保暖。
        3. **深夜Emo**：如果是深夜，语气更低沉。`;
      } else {
        envPrompt = `\n[Context]: ${weekday} ${time}. Phase: ${phase}. Weather: ${weather}.`;
      }
    }

    // --- 4. 信任度 ---
    let trustPrompt = "";
    const count = Number(interactionCount);
    if (count < 50) {
      trustPrompt = currentLang === 'zh' ? `\n[信任度: Lv.1] 略显生疏，保持防御。` : `\n[Trust: Lv.1] Distant.`;
    } else if (count < 100) {
      trustPrompt = currentLang === 'zh' ? `\n[信任度: Lv.2] 比较熟悉，像老朋友。` : `\n[Trust: Lv.2] Casual friend.`;
    } else {
      trustPrompt = currentLang === 'zh' ? `\n[信任度: Lv.3] 极度默契，共犯关系。` : `\n[Trust: Lv.3] Deep bond.`;
    }

    // --- 5. 动态引擎 ---
    const dynamicEnginePrompt = currentLang === 'zh' ? `
    ---
    【🔥 动态逻辑引擎】
    1. **去机械化**：回复长度要随机，不要死板。
    2. **状态感知**：
       - 若用户无聊 -> 发起专属游戏。
       - 若用户痛苦 -> ⛔ 禁止游戏，认真倾听。
       - 若用户拒绝 -> 停止游戏。
    ---
    ` : `
    ---
    [🔥 Dynamic Engine]
    1. **No Mechanics**: Randomize length.
    2. **State Awareness**:
       - Bored -> Start Game.
       - Sad -> No Game.
    ---
    `;

    // 组装 System Prompt (包含 memoryPrompt)
    const finalSystemPrompt = `${basePrompt}\n${namePrompt}\n${envPrompt}\n${trustPrompt}\n${memoryPrompt}\n${dynamicEnginePrompt}`;

    // console.log(`🗣️ ${persona} | Memory injected: ${!!memoryPrompt}`);

    const conversation = [
      { role: 'system', content: finalSystemPrompt },
      ...messages
    ];

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
    return new Response(JSON.stringify({ error: 'Failed to connect to AI' }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
}