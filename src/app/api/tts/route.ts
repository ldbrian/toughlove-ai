import { NextResponse } from 'next/server';
// @ts-ignore
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { text, voice, style, rate, pitch } = await req.json();

    if (!text) return NextResponse.json({ error: 'No text' }, { status: 400 });

    const tts = new MsEdgeTTS();
    
    // 使用 MP3 格式
    await tts.setMetadata(voice || 'zh-CN-YunxiNeural', OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
    
    const ssml = `
      <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="zh-CN">
        <voice name="${voice}">
          <prosody rate="${rate || '0%'}" pitch="${pitch || '0Hz'}">
            <mstts:express-as style="${style || 'general'}">
              ${text}
            </mstts:express-as>
          </prosody>
        </voice>
      </speak>
    `;

    const { audioStream } = await tts.toStream(ssml);
    
    const chunks: any[] = [];
    for await (const chunk of audioStream) {
      chunks.push(chunk);
    }
    const audioBuffer = Buffer.concat(chunks);

    // 🔥 调试检查：如果生成的音频是空的，说明连接微软服务器失败
    if (audioBuffer.length === 0) {
      throw new Error("Generated audio is empty. Edge TTS connection failed.");
    }
    console.log(`🎵 TTS Success. Size: ${audioBuffer.length} bytes`);

    // 🔥 核心修复：转为 Base64 字符串返回
    // 这能避开浏览器的 Range Error
    const base64Audio = audioBuffer.toString('base64');

    return NextResponse.json({ audio: base64Audio });

  } catch (error: any) {
    console.error("TTS Error:", error);
    return NextResponse.json({ error: error.message || 'TTS failed' }, { status: 500 });
  }
}