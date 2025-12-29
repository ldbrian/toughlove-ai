import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { userId, itemId, itemType, metadata } = await req.json();

    if (!userId || !itemId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // 1. 如果是唯一物品 (Artifact)，先检查是否存在，防止重复
    if (itemType === 'artifact') {
       const exists = await prisma.userInventory.findFirst({
         where: { 
            userId: userId, // Prisma 会自动映射到 user_id 列
            item_id: itemId 
         }
       });
       if (exists) {
           return NextResponse.json({ success: true, message: 'Already exists' });
       }
    }

    // 2. 入库
    await prisma.userInventory.create({
      data: {
        userId, 
        item_id: itemId,
        item_type: itemType || 'loot',
        metadata: metadata || {}
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Inventory API] Add Failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}