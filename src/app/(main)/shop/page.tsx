// src/app/shop/page.tsx
import ShopPageClient from '@/components/shop/ShopPageClient';
import { pgPool } from '@/lib/db-pg'; // 直接复用服务端连接池
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Store | ToughLove',
  description: 'Exchange your resonance for artifacts.',
};

// 允许缓存商品列表 1小时 (ISR)，极大提升速度
export const revalidate = 3600; 

async function getShopCatalog() {
  const client = await pgPool.connect();
  try {
    const res = await client.query(`
      SELECT * FROM shop_items 
      WHERE price > 0 
      ORDER BY price ASC
    `);
    
    // 格式化数据以匹配前端组件需求
    return res.rows.map((item: any) => ({
      id: item.id,
      name_json: item.name_json || { zh: '未知商品', en: 'Unknown' },
      desc_json: item.desc_json || { zh: '...', en: '...' },
      price: item.price,
      type: item.type,
      icon: item.icon || '📦',
      rarity: item.rarity || 'common'
    }));
  } catch (e) {
    console.error("Server-side shop fetch failed:", e);
    return []; // 失败降级为空数组，客户端再试
  } finally {
    client.release();
  }
}

export default async function ShopPage() {
  // 在服务端并发获取数据
  const initialCatalog = await getShopCatalog();

  return (
    <main className="min-h-screen bg-[#050505]">
      {/* 把预取的数据传给客户端组件 */}
      <ShopPageClient initialCatalog={initialCatalog} />
    </main>
  );
}