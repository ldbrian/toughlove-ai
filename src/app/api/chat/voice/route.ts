import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { PERSONAS_REGISTRY } from '@/config/personas';

const siliconFlow = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, 
  baseURL: process.env.OPENAI_BASE_URL || 'https://api.siliconflow.cn/v1',
});

const TTS_MODEL = "FunAudioLLM/CosyVoice2-0.5B";

const VOICE_MAP: Record<string, string> = {
    ash: "FunAudioLLM/CosyVoice2-0.5B:benjamin", 
    rin: "FunAudioLLM/CosyVoice2-0.5B:claire",  
    sol: "FunAudioLLM/CosyVoice2-0.5B:david",   
    echo: "FunAudioLLM/CosyVoice2-0.5B:alex",   
};

// 文本清洗
function cleanTextForTTS(text: string): string {
    return text
        .replace(/\*.*?\*/g, '')      
        .replace(/\（.*?\）/g, '')    
        .replace(/\(.*?\)/g, '')      
        .replace(/\[.*?\]/g, '')      
        .trim();                      
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const personaId = (formData.get('personaId') as string) || 'ash';
    const pKey = personaId.toLowerCase();

    if (!file || file.size === 0) {
        return NextResponse.json({ error: 'No audio uploaded' }, { status: 400 });
    }

    // 1. 听 (STT)
    let userText = "";
    try {
        const sttFormData = new FormData();
        sttFormData.append('file', file);
        sttFormData.append('model', 'FunAudioLLM/SenseVoiceSmall'); 
        
        const sttResponse = await fetch('https://api.siliconflow.cn/v1/audio/transcriptions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
            body: sttFormData,
        });

        if (!sttResponse.ok) throw new Error('STT Error');
        const sttJson = await sttResponse.json();
        userText = sttJson.text;
    } catch (error) {
        userText = "（听不清）";
    }

    // 2. 想 (LLM) - 极速高冷版
    const personaConfig = PERSONAS_REGISTRY[pKey] || PERSONAS_REGISTRY['ash'];
    let styleInstructions = "";
    if (pKey === 'ash') {
        styleInstructions = `
[STYLE: ALOOF & MINIMALIST]
1. Tone: Cool, deep, detached.
2. Length: MAX 15 WORDS. Short and sharp.
3. Example: "我在。" "睡吧。"
        `.trim();
    }

    const systemPrompt = `
${personaConfig.prompt}
[MODE: VOICE_ONLY]
REPLY IN CHINESE.
${styleInstructions}
NO markdown.
    `.trim();

    let aiText = "...";
    try {
        const completion = await siliconFlow.chat.completions.create({
          model: 'deepseek-ai/DeepSeek-V3', 
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userText }
          ],
          temperature: 0.6, 
          max_tokens: 40, 
        });
        aiText = completion.choices[0].message.content || "...";
    } catch (llmError) {
        aiText = "我在。";
    }

    // 3. 说 (TTS) - 🔥 流式传输改造 🔥
    const textToSpeak = cleanTextForTTS(aiText);
    
    try {
        if (textToSpeak.length > 0) {
            const mp3Response = await siliconFlow.audio.speech.create({
              model: TTS_MODEL,
              voice: VOICE_MAP[pKey] || VOICE_MAP['ash'],
              input: textToSpeak,
              speed: 1.1, 
            });

            // 关键：不 await arrayBuffer()，直接把流扔给前端
            // @ts-ignore: OpenAI SDK 类型定义可能没跟上，但 body 是存在的
            const stream = mp3Response.body as ReadableStream;

            const headers = new Headers();
            headers.set('Content-Type', 'audio/mpeg');
            // 把文本信息放在 Header 里传回去，方便前端显示字幕
            headers.set('X-User-Text', encodeURIComponent(userText));
            headers.set('X-AI-Text', encodeURIComponent(aiText));

            return new NextResponse(stream, { headers });
        }
    } catch (ttsError) {
        console.error("TTS Stream Failed:", ttsError);
    }

    // 兜底：如果 TTS 失败，返回 JSON
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    headers.set('X-User-Text', encodeURIComponent(userText));
    headers.set('X-AI-Text', encodeURIComponent(aiText));
    return new NextResponse(JSON.stringify({ useFallback: true }), { headers });

  } catch (error: any) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}