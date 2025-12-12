import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const bgPattern = `radial-gradient(circle at 25px 25px, #333 2%, transparent 0%), radial-gradient(circle at 75px 75px, #333 2%, transparent 0%)`;

// 图片加载器：自动搜寻
function loadLocalImageToBase64(filename: string | null) {
    if (!filename) return null;

    const possiblePaths = [
        path.join(process.cwd(), 'public/tarot', filename),
        path.join(process.cwd(), 'public', filename), // 🔥 这里能匹配到 public/qrcode.png
        path.join(process.cwd(), 'src/assets/tarot', filename),
    ];

    for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
            const fileData = fs.readFileSync(p);
            const ext = path.extname(p).substring(1).toLowerCase();
            const mime = (ext === 'png') ? 'image/png' : 'image/jpeg';
            return `data:${mime};base64,${fileData.toString('base64')}`;
        }
    }
    return null;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ type: string }> }) {
  try {
    const { type } = await params;
    const { searchParams } = new URL(req.url);

    // 1. 加载字体
    const possibleFontPaths = [
        path.join(process.cwd(), 'public/fonts/zpix.ttf'),
        path.join(process.cwd(), 'src/assets/fonts/zpix.ttf'),
        path.join(process.cwd(), 'public/fonts/pixel.ttf')
    ];
    let fontData: Buffer | null = null;
    for (const p of possibleFontPaths) {
        if (fs.existsSync(p)) { fontData = fs.readFileSync(p); break; }
    }
    if (!fontData) throw new Error('Font file not found');

    const fontConfig = [
        { name: 'Zpix', data: fontData, style: 'normal' as const, weight: 400 as const },
        { name: 'Zpix', data: fontData, style: 'normal' as const, weight: 700 as const },
    ];

    // 🔥 2. 预加载二维码 (公共资产)
    const qrCodeBase64 = loadLocalImageToBase64('qrcode.png');

    // 通用样式
    const containerStyle = {
        height: '100%', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#050505', backgroundImage: bgPattern, backgroundSize: '100px 100px',
        color: 'white', fontFamily: 'Zpix', position: 'relative',
    };

    // ---------------- TAROT 模板 ----------------
    if (type === 'tarot') {
        // 1. 获取语言参数 (默认为英文)
        const lang = searchParams.get('lang');
    
        // 2. 根据语言取对应的描述，如果取不到则使用对应语言的默认文案
        const desc = lang === 'zh' 
        ? (searchParams.get('desc_zh') )
        : (searchParams.get('desc_en') );
        const cardName = lang === 'zh' ? searchParams.get('name_zh'): (searchParams.get('name_en') ) ;
        const keyword = lang === 'zh' ? searchParams.get('keyword_zh') : searchParams.get('keyword_en') || 'MYSTERY';
        const imgFilename = searchParams.get('img');
        const base64Image = loadLocalImageToBase64(imgFilename);

        return new ImageResponse(
            (
                <div style={containerStyle as any}>
                    <div style={{ position: 'absolute', inset: 20, border: '4px solid #7F5CFF', opacity: 0.5, display: 'flex' }} />
                    <div style={{ position: 'absolute', top: 30, right: 30, color: '#7F5CFF', fontSize: 24, display: 'flex' }}>
                        NO. {Math.floor(Math.random() * 22)}
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: -40 }}>
                        <div style={{ 
                            width: 300, height: 480, 
                            border: '4px solid white', 
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            backgroundColor: '#1a1a1a',
                            boxShadow: '0 0 50px rgba(127,92,255,0.4)',
                            position: 'relative', overflow: 'hidden'
                        }}>
                            {base64Image ? (
                                <img src={base64Image} width="300" height="480" style={{ objectFit: 'cover' }} />
                            ) : (
                                <div style={{ width: 100, height: 100, borderRadius: '50%', border: '6px solid #7F5CFF', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px #7F5CFF' }}>
                                    <div style={{ fontSize: 60, color: '#7F5CFF', display: 'flex' }}>?</div>
                                </div>
                            )}
                            <div style={{ 
                                position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px 10px',
                                background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)',
                                display: 'flex', justifyContent: 'center'
                            }}>
                                <div style={{ fontSize: 32, fontWeight: 'bold', textTransform: 'uppercase', display: 'flex', textShadow: '2px 2px 0px black' }}>
                                    {cardName}
                                </div>
                            </div>
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 40, maxWidth: 500, textAlign: 'center' }}>
                            <div style={{ fontSize: 24, color: '#7F5CFF', marginBottom: 10, display: 'flex' }}>&lt; {keyword} &gt;</div>
                            <div style={{ fontSize: 32, lineHeight: 1.4, display: 'flex' }}>{desc}</div>
                        </div>
                    </div>

                    <div style={{ position: 'absolute', bottom: 30, fontSize: 20, opacity: 0.6, display: 'flex' }}>
                        TOUGHLOVE // CYBERPUNK COMPANION
                    </div>
                    
                    {/* 🔥 二维码区域 (右下角) */}
                    {qrCodeBase64 && (
                        <div style={{ position: 'absolute', bottom: 30, right: 30, display: 'flex', border: '2px solid white', padding: 4, backgroundColor: 'white' }}>
                            <img src={qrCodeBase64} width="150" height="150" />
                        </div>
                    )}
                </div>
            ),
            { width: 800, height: 1000, fonts: fontConfig }
        );
    }

    // ---------------- FOCUS 模板 ----------------
    if (type === 'focus') {
        const duration = searchParams.get('duration') || '25';
        const reward = searchParams.get('reward') || '50';
        return new ImageResponse(
            (
                <div style={containerStyle as any}>
                    <div style={{ position: 'absolute', inset: 0, border: '20px solid #050505' }} /> 
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ fontSize: 24, color: '#ef4444', letterSpacing: 4, marginBottom: 20, display: 'flex' }}>FOCUS PROTOCOL COMPLETED</div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: 500, height: 300, border: '2px solid #ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 20 }}>
                            <div style={{ fontSize: 120, fontWeight: 'bold', color: 'white', textShadow: '4px 4px 0px #ef4444', display: 'flex' }}>{duration}:00</div>
                            <div style={{ fontSize: 24, color: '#eca1a1', display: 'flex' }}>MINUTES FOCUSED</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', marginTop: 40, gap: 20 }}>
                            <div style={{ fontSize: 40, fontWeight: 'bold', color: '#fbbf24', display: 'flex' }}>[RIN]</div>
                            <div style={{ fontSize: 40, color: '#fbbf24', display: 'flex' }}>EARNED {reward}</div>
                        </div>
                    </div>
                    
                    {/* 底部左侧信息 */}
                    <div style={{ position: 'absolute', bottom: 40, left: 40, display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 10, height: 10, backgroundColor: '#22c55e', borderRadius: '50%' }} />
                        <div style={{ fontSize: 24, display: 'flex' }}>SOL APPROVED</div>
                    </div>

                    {/* 🔥 二维码区域 (右下角) */}
                    {qrCodeBase64 && (
                        <div style={{ position: 'absolute', bottom: 30, right: 30, display: 'flex', border: '2px solid #ef4444', padding: 4, backgroundColor: 'white' }}>
                            <img src={qrCodeBase64} width="1500" height="150" />
                        </div>
                    )}
                </div>
            ),
            { width: 800, height: 800, fonts: fontConfig }
        );
    }

    // ---------------- MEMO 模板 ----------------
    if (type === 'memo') {
        const title = searchParams.get('title') || 'SECRET MEMO';
        const text = searchParams.get('text') || '...';
        const from = searchParams.get('from') || 'UNKNOWN';

        return new ImageResponse(
            (
                <div style={{ 
                    height: '100%', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    backgroundColor: '#fffdf0', color: '#2d2d2d', fontFamily: 'Zpix', position: 'relative',
                }}>
                    <div style={{ position: 'absolute', top: -20, left: '50%', transform: 'translateX(-50%) rotate(-2deg)', width: 200, height: 60, backgroundColor: 'rgba(255,255,255,0.4)', border: '2px solid rgba(0,0,0,0.1)' }} />
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 60, textAlign: 'center' }}>
                        <div style={{ fontSize: 24, color: '#9ca3af', marginBottom: 40, letterSpacing: 4, display: 'flex' }}>FROM: {from}</div>
                        <div style={{ fontSize: 60, fontWeight: 'bold', marginBottom: 40, lineHeight: 1.1, display: 'flex' }}>{title}</div>
                        <div style={{ fontSize: 36, lineHeight: 1.6, maxWidth: 650, color: '#4b5563', display: 'flex', wordBreak: 'break-all' }}>"{text}"</div>
                    </div>

                    <div style={{ position: 'absolute', bottom: 30, left: 40, fontSize: 24, color: '#9ca3af', fontFamily: 'sans-serif', display: 'flex' }}>
                        ToughLove App
                    </div>

                    {/* 🔥 二维码区域 (右下角) */}
                    {qrCodeBase64 && (
                        <div style={{ position: 'absolute', bottom: 30, right: 30, display: 'flex', padding: 4, backgroundColor: 'white', border: '1px solid #ccc', transform: 'rotate(-3deg)' }}>
                            <img src={qrCodeBase64} width="150" height="150" />
                        </div>
                    )}
                </div>
            ),
            { width: 800, height: 800, fonts: fontConfig }
        );
    }

    return new Response('Invalid type', { status: 400 });
  } catch (e: any) {
    console.error("OG Gen Error:", e);
    return new Response(JSON.stringify({ error: 'Generation Failed', details: e.message }), { status: 500 });
  }
}