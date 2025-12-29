import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    // 使用 Prisma 进行 Upsert (有则更新，无则创建)
    // Prisma 使用数据库直连，无视 RLS 限制
    await prisma.user.upsert({
      where: { id: userId },
      update: {
        // 如果用户已存在，更新一下时间，证明活过
        updatedAt: new Date(),
      },
      create: {
        id: userId,
        // 生成一个伪造的匿名邮箱
        email: `anon_${userId.slice(0, 8)}@toughlove.ai`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Server Sync Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}