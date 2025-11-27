import { NextRequest, NextResponse } from 'next/server';
import * as sdk from 'microsoft-cognitiveservices-speech-sdk';

export async function POST(req: NextRequest) {
  try {
    const { 
      text, 
      voice = 'zh-CN-YunxiNeural', 
      style = 'chat',
      styledegree = 1.0, 
      role = '',
      rate = '0%',                
      pitch = '0Hz',
      lang = 'zh-CN' // 🔥 新增：接收前端传来的语言代码 (zh-CN 或 en-US)
    } = await req.json();

    if (!text) return NextResponse.json({ error: 'Text required' }, { status: 400 });

    // 文本清洗逻辑
    const cleanText = text
      .replace(/（.*?）/g, '') 
      .replace(/\(.*?\)/g, '')
      .replace(/\*.*?\*/g, '')
      .replace(/\[.*?\]/g, '')
      .replace(/\|\|\|/g, '，') // 将气泡分隔符转为逗号
      .trim();

    if (cleanText.length === 0) {
       return NextResponse.json({ error: 'No speakable text' }, { status: 400 });
    }

    const speechKey = process.env.AZURE_SPEECH_KEY;
    const speechRegion = process.env.AZURE_SPEECH_REGION;

    if (!speechKey || !speechRegion) {
      return NextResponse.json({ error: 'Server config error' }, { status: 500 });
    }

    const speechConfig = sdk.SpeechConfig.fromSubscription(speechKey, speechRegion);
    speechConfig.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Audio16Khz32KBitRateMonoMp3;

    const roleAttr = role ? `role="${role}"` : '';
    
    // 🔥 关键修改：xml:lang 动态化
    const ssml = `
      <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="${lang}">
        <voice name="${voice}">
          <mstts:express-as style="${style}" styledegree="${styledegree}" ${roleAttr}>
            <prosody rate="${rate}" pitch="${pitch}">
              ${cleanText}
            </prosody>
          </mstts:express-as>
        </voice>
      </speak>
    `;

    const synthesizer = new sdk.SpeechSynthesizer(speechConfig);

    return new Promise<NextResponse>((resolve, reject) => {
      synthesizer.speakSsmlAsync(
        ssml,
        (result) => {
          if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
            const base64Audio = Buffer.from(result.audioData).toString('base64');
            synthesizer.close();
            resolve(NextResponse.json({ audio: base64Audio }));
          } else {
            console.error("TTS Synthesis Canceled:", result.errorDetails);
            synthesizer.close();
            resolve(NextResponse.json({ error: 'TTS failed' }, { status: 500 }));
          }
        },
        (error) => {
          console.error("TTS System Error:", error);
          synthesizer.close();
          resolve(NextResponse.json({ error: 'TTS error' }, { status: 500 }));
        }
      );
    });

  } catch (error) {
    console.error("TTS Route Error:", error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}