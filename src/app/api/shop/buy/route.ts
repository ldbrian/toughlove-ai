import { NextRequest, NextResponse } from 'next/server';
import { pgPool } from '@/lib/db-pg';

// 🎲 盲盒逻辑：也需要改为读库
async function rollLoot(inventory: string[], client: any) {
  // 1. 获取所有可掉落物品 (假设 type != 'special' 且不是密钥)
  // 这里简化逻辑：随机抽一个 rarity=common/rare/epic 的物品
  const rand = Math.random();
  let targetRarity = 'common';
  if (rand > 0.99) targetRarity = 'legendary';
  else if (rand > 0.90) targetRarity = 'epic';
  else if (rand > 0.60) targetRarity = 'rare';

  // 查询符合稀有度的物品
  const res = await client.query(
    "SELECT * FROM items WHERE rarity = $1 AND id NOT LIKE 'tarot%' AND id NOT LIKE 'key_v3'", 
    [targetRarity]
  );
  
  let pool = res.rows;
  
  // 过滤掉已拥有的 unique 物品 (假设数据库有 unique 字段，如果没有，暂时忽略或全部视为可重复)
  // 如果 items 表没有 unique 字段，我们可以假设所有非消耗品都是 unique
  // 这里简单处理：过滤掉背包里已有的 ID
  pool = pool.filter((i: any) => !inventory.includes(i.id));

  // 降级兜底
  if (pool.length === 0) {
      const commonRes = await client.query("SELECT * FROM items WHERE rarity = 'common'");
      pool = commonRes.rows;
  }
  
  if (pool.length === 0) return null;
  const selected = pool[Math.floor(Math.random() * pool.length)];
  return selected; // 返回完整对象以便前端展示
}

export async function POST(req: NextRequest) {
  try {
    const { userId, itemId, currentInventory = [] } = await req.json();
    
    const client = await pgPool.connect();

    try {
      await client.query('BEGIN');

      // 1. 🔥 [FIX] 从数据库查询商品信息，不再查 constants
      const itemRes = await client.query('SELECT * FROM items WHERE id = $1', [itemId]);
      if (itemRes.rows.length === 0) {
          throw new Error('Item not found');
      }
      const shopItem = itemRes.rows[0];

      // 2. 查余额并锁行
      const userRes = await client.query(
        `SELECT rin_balance FROM user_wallets WHERE user_id = $1 FOR UPDATE`, 
        [userId]
      );
      
      if (userRes.rows.length === 0) {
          // 容错：如果用户没钱包，尝试创建一个
          await client.query(`INSERT INTO user_wallets (user_id, rin_balance) VALUES ($1, 0) ON CONFLICT DO NOTHING`, [userId]);
          throw new Error('Insufficient funds (New Wallet)');
      }
      
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
      let droppedItem = null;
      let logData: any = { type: 'direct_buy' };

      if (itemId === 'supply_crate_v1') {
          droppedItem = await rollLoot(currentInventory, client);
          if (droppedItem) {
             logData = { type: 'gacha', dropped: droppedItem.id };
          }
      }

      // 6. 记录购买日志
      await client.query(
        `INSERT INTO purchases (user_id, item_id, cost, metadata) VALUES ($1, $2, $3, $4)`,
        [userId, itemId, shopItem.price, JSON.stringify(logData)]
      );

      await client.query('COMMIT');
      
      return NextResponse.json({ 
          success: true, 
          newBalance: balance - shopItem.price,
          droppedItem: droppedItem, // 返回完整对象
          message: droppedItem ? 'Gacha success' : 'Purchase success'
      });

    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }

  } catch (error: any) {
    console.error('Shop Buy Error:', error);
    return NextResponse.json({ error: error.message || 'Transaction failed' }, { status: 500 });
  }
}