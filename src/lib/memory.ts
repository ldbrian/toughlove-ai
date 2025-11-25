import { createClient } from '@supabase/supabase-js';
import { OpenAI } from 'openai';

// 1. 初始化防崩配置 (Build Safe)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

const openai = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY || 'dummy',
  baseURL: 'https://api.deepseek.com',
});

// 🔥 核心函数：滚动记忆处理
export async function processRollingMemory(userId: string, persona: string) {
  try {
    // 2. 这里的链式调用必须完整，不能断
    const { count } = await supabase
      .from('chat_histories')
      .select('*', { count: 'exact', head: true }) // head: true 表示只查数量，不查数据，速度快
      .eq('user_id', userId)
      .eq('persona', persona);

    // 🔴 阈值：100 条
    if (!count || count <= 100) return;

    console.log(`[Memory] User ${userId} (${persona}) has ${count} msgs. Starting distillation...`);

    // 3. 捞出旧数据
    const retainCount = 80; 
    const limit = count - retainCount;

    const { data: oldLogs } = await supabase
      .from('chat_histories')
      .select('id, role, content')
      .eq('user_id', userId)
      .eq('persona', persona)
      .order('created_at', { ascending: true }) // 最旧的在前
      .limit(limit);

    if (!oldLogs || oldLogs.length === 0) return;

    // 4. 拼接文本
    const conversationText = oldLogs
      .map((log: any) => `${log.role}: ${log.content}`)
      .join('\n');

    // 5. DeepSeek 提炼
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

    // 6. 存入 memories
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

    // 7. 删除旧记录
    const idsToDelete = oldLogs.map((log: any) => log.id);
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