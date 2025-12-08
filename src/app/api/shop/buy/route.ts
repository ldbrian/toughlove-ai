import { NextRequest, NextResponse } from 'next/server';
import { pgPool } from '@/lib/db-pg';
import { SHOP_CATALOG, LOOT_TABLE } from '@/lib/constants';

// 🎲 抽奖概率配置 (The Gacha Logic)
const rollLoot = (inventory: string[]): string | null => {
  const rand = Math.random();
  let targetRarity = 'common';
  
  if (rand > 0.99) targetRarity = 'legendary'; // 1% 传奇
  else if (rand > 0.90) targetRarity = 'epic';     // 9% 史诗
  else if (rand > 0.60) targetRarity = 'rare';     // 30% 稀有
  // 剩余 60% 为 common

  // 筛选符合稀有度 且 (非唯一 或 未拥有) 的物品
  const pool = Object.values(LOOT_TABLE).filter(item => 
    item.rarity === targetRarity && 
    (!item.unique || !inventory.includes(item.id))
  );

  // 如果该稀有度池子空了（比如传奇全齐了），降级处理
  if (pool.length === 0) {
      // 降级到 common 池子
      const commonPool = Object.values(LOOT_TABLE).filter(i => i.rarity === 'common');
      if (commonPool.length === 0) return null; // 极罕见
      return commonPool[Math.floor(Math.random() * commonPool.length)].id;
  }

  const selected = pool[Math.floor(Math.random() * pool.length)];
  return selected.id;
};

export async function POST(req: NextRequest) {
  try {
    const { userId, itemId, currentInventory = [] } = await req.json();
    
    // 1. 校验商品
    const shopItem = SHOP_CATALOG.find(i => i.id === itemId);
    if (!shopItem) return NextResponse.json({ error: 'Item not found' }, { status: 400 });

    const client = await pgPool.connect();

    try {
      await client.query('BEGIN');

      // 2. 查余额并锁行
      const userRes = await client.query(
        `SELECT rin_balance FROM user_wallets WHERE user_id = $1 FOR UPDATE`, 
        [userId]
      );
      
      if (userRes.rows.length === 0) throw new Error('Wallet not found');
      
      // 注意：pg 返回的 numeric 类型可能是 string，需转 float
      const balance = parseFloat(userRes.rows[0].rin_balance);

      // 3. 余额检查
      if (balance < shopItem.price) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: 'Insufficient funds' }, { status: 402 });
      }

      // 4. 扣款
      await client.query(
        `UPDATE user_wallets SET rin_balance = rin_balance - $1 WHERE user_id = $2`,
        [shopItem.price, userId]
      );

      // 5. 处理盲盒掉落
      let droppedItemId = null;
      let logData = {};

      if (itemId === 'supply_crate_v1') {
          droppedItemId = rollLoot(currentInventory);
          logData = { type: 'gacha', dropped: droppedItemId };
      } else {
          // 普通商品购买
          logData = { type: 'direct_buy' };
      }

      // 6. 记录购买日志 (防作弊/客服查询用)
      await client.query(
        `INSERT INTO purchases (user_id, item_id, cost, metadata) VALUES ($1, $2, $3, $4)`,
        [userId, itemId, shopItem.price, JSON.stringify(logData)]
      );

      await client.query('COMMIT');
      
      // 返回结果：前端根据 droppedItemId 判断是否弹窗展示开箱动画
      return NextResponse.json({ 
          success: true, 
          newBalance: balance - shopItem.price,
          droppedItemId: droppedItemId, 
          message: droppedItemId ? 'Gacha success' : 'Purchase success'
      });

    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Shop Buy Error:', error);
    return NextResponse.json({ error: 'Transaction failed' }, { status: 500 });
  }
}