import { NextRequest, NextResponse } from 'next/server';
import { pgPool } from '@/lib/db-pg'; // 复用我们刚才配好的数据库连接

export const runtime = 'nodejs'; // pg 库必须用 nodejs 环境

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ balance: 0 });
  }

  const client = await pgPool.connect();
  
  try {
    // 查询 user_wallets 表
    const res = await client.query(
      'SELECT rin_balance FROM user_wallets WHERE user_id = $1', 
      [userId]
    );

    // 如果查到了，返回余额；查不到（新用户）返回 0
    const balance = res.rows[0]?.rin_balance || 0;
    
    return NextResponse.json({ balance });

  } catch (error) {
    console.error('[API Balance] Error:', error);
    return NextResponse.json({ balance: 0 }); // 出错兜底返回 0
  } finally {
    client.release(); // 释放连接
  }
}