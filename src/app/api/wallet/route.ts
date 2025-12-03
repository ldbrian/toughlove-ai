import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { userId, amount, reason } = await req.json();
    // 模拟 DB 操作
    return NextResponse.json({ 
      success: true, 
      newBalance: 100 + amount, 
      message: "Sync success" 
    });
  } catch (e) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function GET(req: Request) {
    return NextResponse.json({ balance: 100 }); 
}