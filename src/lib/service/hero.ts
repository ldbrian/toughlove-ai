// src/lib/service/hero.ts
import { prisma } from '@/lib/prisma';
import { HeroFeedItem, CommentConfig } from '@prisma/client';

export type HeroItemWithComments = HeroFeedItem & {
  comments: CommentConfig[];
};

export async function getHeroFeed(): Promise<HeroItemWithComments[]> {
  const now = new Date();
  const items = await prisma.heroFeedItem.findMany({
    where: {
      startTime: { lte: now },
      OR: [
        { endTime: null },
        { endTime: { gte: now } }
      ]
    },
    include: {
      comments: true,
    },
    orderBy: {
      priority: 'desc',
    }
  });
  return items;
}

// ✅ 新增：获取单条详情
export async function getHeroItem(id: string): Promise<HeroItemWithComments | null> {
  const item = await prisma.heroFeedItem.findUnique({
    where: { id },
    include: {
      comments: true, // 获取内环回响
    },
  });
  return item;
}