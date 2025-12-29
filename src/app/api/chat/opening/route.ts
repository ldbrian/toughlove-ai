import { NextResponse } from 'next/server';
import { PERSONAS_REGISTRY } from '@/config/personas';

// 模拟 LLM 生成逻辑 (未来替换为真实 DeepSeek/GPT 调用)
const simulateLLMGeneration = (personaId: string, context: any) => {
  const persona = PERSONAS_REGISTRY[personaId] || PERSONAS_REGISTRY['ash'];
  const { source, topic, stance, result, action } = context;

  // 场景 A: 来自 HeroFeed (新闻/话题)
  if (source === 'herofeed' && topic) {
    if (personaId === 'ash') {
        if (stance?.includes('support')) {
            return `关于 "${topic}"... 难得我们的观点一致。在这个非理性的世界里，保持清醒是一种特权。`;
        }
        return `"${topic}"... 我看到你在 Feed 里选择了不同的立场。这很有趣，你是基于情感还是数据做出的判断？`;
    }
    if (personaId === 'vee') {
        return `喂！你也看到 "${topic}" 了？那帮老顽固简直疯了！如果是你，你会怎么搞定这事儿？`;
    }
    if (personaId === 'rin') {
        return `大家都在讨论 "${topic}"... 但我只感觉到空气里充满了焦虑。你还好吗？`;
    }
    // 默认回退
    return `我也在关注 "${topic}" 这个话题。你对这件事怎么看？`;
  }

  // 场景 B: 来自 剧本杀 (Script Murder)
  if (source === 'script_murder' && result) {
    if (personaId === 'ash') {
        return `听说你在推演中拿到了 "${result}" 的结局？如果是为了大局而做出的牺牲，我认可你的决策逻辑。`;
    }
    if (personaId === 'sol') {
        return `干得漂亮！听说你 "${action || '挺身而出'}"？这才是真正的领袖风范！下次带我一个！`;
    }
    if (personaId === 'vee') {
        return `嘿嘿，听说你在游戏里 "${result}"？虽然直接黑进去更快，但你这招挺有创意的嘛！`;
    }
    return `关于刚才那个案件的结局 "${result}"，你有什么想复盘的吗？`;
  }

  // 场景 C: 没有任何上下文 (纯新用户首次进入)
  // 如果是老用户日常打开，前端不会调用这个 API，所以这里只处理“冷启动”
  return personaId === 'ash' ? "信号已连接。有什么需要我处理的？" : "你来了？";
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { personaId, context } = body;

    // 模拟网络延迟，增加真实感
    await new Promise(resolve => setTimeout(resolve, 800));

    const content = simulateLLMGeneration(personaId, context);
    
    return NextResponse.json({ content });

  } catch (error) {
    console.error('Opening generation failed:', error);
    return NextResponse.json({ content: '连接已建立。' });
  }
}