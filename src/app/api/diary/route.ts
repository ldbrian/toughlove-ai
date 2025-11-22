import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { PERSONAS, PersonaType, LangType } from '@/lib/constants';

const openai = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com',
});

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { messages, persona, language, userName } = await req.json();

    // 1. 如果没有聊天记录，写不出日记
    if (!messages || messages.length < 4) {
      return NextResponse.json({ diary: null });
    }

    const currentLang = (language as LangType) || 'zh';
    
    // 2. 提取最近的对话素材
    const recentContext = messages.slice(-20).map((m: any) => 
      `[${m.role === 'user' ? 'User' : 'Me'}]: ${m.content}`
    ).join('\n');

    const nameStr = userName ? `(用户名字叫 ${userName})` : "";

    // 3. 🔥 核心：针对不同人格的“内心独白”指令
    let stylePrompt = "";
    
    if (persona === 'Ash') {
      stylePrompt = currentLang === 'zh'
        ? `风格：冷酷、厌世、毒舌。你正在写私人日记。
           内容要求：
           1. 吐槽那个笨蛋(用户)${nameStr}今天又犯了什么蠢。
           2. 用刻薄的语言描述他狼狈的样子。
           3. **关键点**：在最后，流露出一丝丝（仅仅一丝丝）对他现状的在意，或者恨铁不成钢。
           4. 只有一段话。不要写日期。`
        : `Style: Cold, cynical. Private diary.
           Content: Roast the idiot user. Describe their pathetic state. 
           Crucial: Show a TINY hint of concern or annoyance at their weakness at the end.`;
    } else if (persona === 'Rin') {
      stylePrompt = currentLang === 'zh'
        ? `风格：傲娇、暴躁。你正在写私人日记。
           内容要求：
           1. 大骂${nameStr}今天有多麻烦，浪费了你多少时间。
           2. 提到你其实想帮他（或者已经帮了倒忙）。
           3. 结尾要自我否定：“我才不是关心他呢，哼。”`
        : `Style: Tsundere. Private diary.
           Content: Complain how annoying the user is. Mention you wanted to help. Deny your care at the end.`;
    } else if (persona === 'Echo') {
      stylePrompt = currentLang === 'zh'
        ? `风格：深邃、观察者。你正在写观察笔记。
           内容要求：
           1. 用手术刀般的精准度，记录${nameStr}今天暴露出的一个心理弱点。
           2. 不要带情绪，要带悲悯。
           3. 用一个简短的隐喻作为结尾。`
        : `Style: Soul Anatomist. Observation log.
           Content: Record a psychological weakness the user revealed. Be detached but compassionate. End with a metaphor.`;
    } else {
      // 通用
      stylePrompt = "写一段关于今天对话的简短内心独白，风格要符合你的人设。";
    }

    const systemPrompt = `你现在不是在对话，你是在**写私人日记**。
    不要用第二人称“你”，要用第三人称“他/她/这家伙”。
    不要客套，要写出内心深处没说出口的真实想法（窥私感）。
    ${stylePrompt}`;

    // 4. 生成
    const response = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `今日对话记录：\n${recentContext}` }
      ],
      temperature: 0.85, // 高创造性
      max_tokens: 300,
    });

    const diaryContent = response.choices[0].message.content;

    return NextResponse.json({ diary: diaryContent });

  } catch (error) {
    console.error("Diary Gen Error:", error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}