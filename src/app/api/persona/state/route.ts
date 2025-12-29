import { NextResponse } from 'next/server';
import { pgPool } from '@/lib/db-pg';

export const dynamic = 'force-dynamic'; 

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  const persona = searchParams.get('persona') || 'ash'; // 默认查 ash

  if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });

  const client = await pgPool.connect();
  try {
    const res = await client.query(
        `SELECT mood, favorability FROM persona_states WHERE user_id = $1 AND persona = $2`,
        [userId, persona]
    );

    if (res.rows.length === 0) {
        // 如果还没有记录，返回默认值
        return NextResponse.json({ mood: 60, favorability: 0 });
    }

    return NextResponse.json(res.rows[0]);
  } catch (error) {
    return NextResponse.json({ error: 'DB Error' }, { status: 500 });
  } finally {
    client.release();
  }
}