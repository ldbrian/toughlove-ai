import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { userId, amount, reason } = await req.json();
    
    // 这里应该是数据库操作：
    // await db.wallet.update({ where: { userId }, data: { balance: { increment: amount } } });
    
    // 模拟成功返回
    return NextResponse.json({ 
      success: true, 
      newBalance: 100 + amount, // 假装余额增加了
      message: "Sync success" 
    });
  } catch (e) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// 获取余额
export async function GET(req: Request) {
    // 模拟返回一个初始余额
    return NextResponse.json({ balance: 100 }); 
}