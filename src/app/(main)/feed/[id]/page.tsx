// src/app/feed/[id]/page.tsx
import { notFound } from 'next/navigation';
import { getHeroItem } from '@/lib/service/hero';
import FeedDetailClient from '@/components/feed/FeedDetailClient';

interface PageProps {
    // 🔥 修正点 1: 类型定义为 Promise
    params: Promise<{
        id: string;
    }>;
}

export const dynamic = 'force-dynamic';

export default async function FeedDetailPage({ params }: PageProps) {
    // 🔥 修正点 2: 必须先 await params
    const { id } = await params;
    
    // 现在 id 是字符串了，可以安全传给数据库
    const item = await getHeroItem(id);

    if (!item) {
        notFound();
    }

    return <FeedDetailClient item={item} />;
}