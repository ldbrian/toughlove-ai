import { NextRequest, NextResponse } from 'next/server';
import * as sdk from 'microsoft-cognitiveservices-speech-sdk';

export async function POST(req: NextRequest) {
  try {
    const { 
      text, 
      voice = 'zh-CN-YunxiNeural', 
      style = 'chat',              
      rate = '0%',                
      pitch = '0Hz'                 
    } = await req.json();

    if (!text) return NextResponse.json({ error: 'Text required' }, { status: 400 });

    // 🔥 核心修改：文本清洗 (Regex Cleaning)
    // 去除：中文括号（...）、英文括号(...)、星号*...*、方头括号[...]、以及分隔符 |||
    const cleanText = text
      .replace(/（.*?）/g, '') 
      .replace(/\(.*?\)/g, '')
      .replace(/\*.*?\*/g, '')
      .replace(/\[.*?\]/g, '')
      .replace(/\|\|\|/g, '，') // 分隔符变逗号停顿
      .trim();

    // 如果洗完没词了（比如只有动作），直接返回错误，不浪费 Azure 额度
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

    // 构建 SSML
    const ssml = `
      <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="zh-CN">
        <voice name="${voice}">
          <mstts:express-as style="${style}">
            <prosody rate="${rate}" pitch="${pitch}">
              ${cleanText}
            </prosody>
          </mstts:express-as>
        </voice>
      </speak>
    `;

    const synthesizer = new sdk.SpeechSynthesizer(speechConfig);

    return new Promise((resolve, reject) => {
      synthesizer.speakSsmlAsync(
        ssml,
        (result) => {
          if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
            const base64Audio = Buffer.from(result.audioData).toString('base64');
            synthesizer.close();
            resolve(NextResponse.json({ audio: base64Audio }));
          } else {
            synthesizer.close();
            resolve(NextResponse.json({ error: 'TTS failed' }, { status: 500 }));
          }
        },
        (error) => {
          synthesizer.close();
          resolve(NextResponse.json({ error: 'TTS error' }, { status: 500 }));
        }
      );
    });

  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}