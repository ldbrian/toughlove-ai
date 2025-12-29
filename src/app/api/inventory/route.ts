import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ inventory: [] });
  }

  try {
    // 1. 获取用户的背包记录
    const userInv = await prisma.userInventory.findMany({
        where: { userId },
        orderBy: { acquired_at: 'desc' }
    });

    if (!userInv.length) {
        return NextResponse.json({ inventory: [] });
    }

    // 2. 获取所有物品定义和塔罗牌定义 (作为字典)
    const systemItems = await prisma.systemItem.findMany();
    const tarotCards = await prisma.tarotCard.findMany();

    const sysMap = new Map(systemItems.map(i => [i.id, i]));
    const tarotMap = new Map(tarotCards.map(t => [String(t.id), t]));

    // 3. 组装数据
    const inventory = userInv.map(ui => {
        const rawId = ui.item_id;
        
        // A. 匹配塔罗牌
        // 兼容 'tarot_1' 格式或 item_type='tarot'
        if (ui.item_type === 'tarot' || rawId.startsWith('tarot_')) {
            const cleanId = rawId.replace('tarot_', '');
            const card = tarotMap.get(cleanId);
            if (card) {
                const nameObj = card.name as any;
                return {
                    id: `tarot_${card.id}`,
                    name: { zh: `塔罗：${nameObj?.zh || ''}`, en: `Tarot: ${nameObj?.en || ''}` },
                    desc: card.meaning,
                    image: card.image,
                    rarity: 'epic',
                    type: 'tarot',
                    acquiredAt: ui.acquired_at
                };
            }
        }

        // B. 匹配系统物品 (信件、咖啡等)
        const sysItem = sysMap.get(rawId);
        if (sysItem) {
            return {
                id: sysItem.id,
                name: sysItem.name,
                desc: sysItem.description,
                image: sysItem.icon,
                rarity: sysItem.rarity,
                type: sysItem.type,
                acquiredAt: ui.acquired_at
            };
        }

        // C. 兜底 (metadata)
        if (ui.metadata && Object.keys(ui.metadata as object).length > 0) {
            const meta = ui.metadata as any;
            return {
                id: rawId,
                name: meta.name || { zh: '未知物品', en: 'Unknown' },
                desc: meta.desc || { zh: '...', en: '...' },
                image: meta.icon || '📦',
                rarity: meta.rarity || 'common',
                type: 'loot',
                acquiredAt: ui.acquired_at
            };
        }
        
        return null;
    }).filter(Boolean);

    return NextResponse.json({ inventory });

  } catch (error: any) {
    console.error('[API Inventory] Error:', error);
    return NextResponse.json({ inventory: [], error: error.message }, { status: 500 });
  }
}