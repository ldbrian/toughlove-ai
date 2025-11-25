import { createClient } from '@supabase/supabase-js';
import { OpenAI } from 'openai';

// 服务端 Supabase 客户端
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com',
});

// 🔥 核心函数：滚动记忆处理 (Sliding Window)
export async function processRollingMemory(userId: string, persona: string) {
  try {
    // 1. 检查消息数量
    // 注意：这里用的是你的表名 chat_histories
    // 我们假设 user_id 存的是 deviceId
    const { count } = await supabase
      .from('chat_histories')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId) // 如果你表里叫 device_id，请把这里改成 .eq('device_id', userId)
      .eq('persona', persona);

    // 🔴 阈值：100 条
    if (!count || count <= 100) return;

    console.log(`[Memory] User ${userId} (${persona}) has ${count} msgs. Starting distillation...`);

    // 2. 捞出需要“炼丹”的旧数据 (超出 100 条的部分)
    // 比如有 105 条，我们把最旧的 5 条捞出来提炼并删除
    // 为了防止一次删太少，我们可以一次性处理 20 条，留 80 条缓冲区
    const retainCount = 80; 
    const limit = count - retainCount;

    const { data: oldLogs } = await supabase
      .from('chat_histories')
      .select('id, role, content') // 查出 ID 方便删除
      .eq('user_id', userId)
      .eq('persona', persona)
      .order('created_at', { ascending: true }) // 最旧的在前
      .limit(limit);

    if (!oldLogs || oldLogs.length === 0) return;

    // 3. 拼接对话文本
    const conversationText = oldLogs
      .map(log => `${log.role}: ${log.content}`)
      .join('\n');

    // 4. 调用 DeepSeek 提炼 (Prompt)
    const systemPrompt = `
      你是一个记忆整理员。阅读这段过期的对话记录。
      任务：
      1. 提取关于用户的【关键事实】(如职业、宠物、居住地)。
      2. 提取用户的【鲜明标签/性格】(如#熬夜党、#细节控)。
      3. 提取用户的【重要偏好】(如喜欢被骂、讨厌香菜)。
      4. 忽略所有“你好”、“在吗”等无意义废话。
      5. 如果全是废话，返回 "NULL"。
      
      输出格式(JSON)：
      {
        "memories": [
          {"type": "fact", "content": "用户有一只叫旺财的狗"},
          {"type": "tag", "content": "熬夜冠军"}
        ]
      }
    `;

    const response = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: conversationText }
      ],
      response_format: { type: "json_object" }
    });

    const resultStr = response.choices[0].message.content || '{}';
    let result;
    try {
        result = JSON.parse(resultStr);
    } catch (e) {
        console.error("JSON Parse Error:", e);
    }

    // 5. 存入 memories 表 (沿用你的表名)
    if (result && result.memories && Array.isArray(result.memories)) {
      const memoryRows = result.memories.map((m: any) => ({
        user_id: userId,
        persona: persona,
        type: m.type || 'fact',
        content: m.content,
        importance: 3
      }));

      if (memoryRows.length > 0) {
        await supabase.from('memories').insert(memoryRows);
        console.log(`[Memory] Saved ${memoryRows.length} new memories.`);
      }
    }

    // 6. 🔥 销毁旧记录 (清理 chat_histories)
    // 我们删除刚才捞出来的那些 ID
    const idsToDelete = oldLogs.map(log => log.id);
    if (idsToDelete.length > 0) {
        await supabase
          .from('chat_histories')
          .delete()
          .in('id', idsToDelete);
        console.log(`[Memory] Deleted ${idsToDelete.length} old chat logs.`);
    }

  } catch (error) {
    console.error("[Memory] Engine Error:", error);
  }
}