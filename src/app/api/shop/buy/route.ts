import { NextRequest, NextResponse } from 'next/server';
import { pgPool } from '@/lib/db-pg'; // 复用之前的 Postgres 连接池

export const runtime = 'nodejs'; // 必须使用 Node.js 环境以支持 pg 库

export async function POST(req: NextRequest) {
  // 从请求体获取 userId (客户端传来的 DeviceID 或 UUID) 和 itemId
  const { userId, itemId } = await req.json();

  if (!userId || !itemId) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  const client = await pgPool.connect();

  try {
    // 1. 开启事务
    await client.query('BEGIN');

    // 2. 锁定并查询用户余额 (FOR UPDATE 防止并发双花)
    // 注意：如果 user_wallets 还没记录，先尝试插入一条初始记录
    let userRes = await client.query(
      'SELECT rin_balance FROM user_wallets WHERE user_id = $1 FOR UPDATE', 
      [userId]
    );

    if (userRes.rowCount === 0) {
      // 新用户初始化 (默认 0 Rin)
      await client.query(
        'INSERT INTO user_wallets (user_id, rin_balance) VALUES ($1, 0)', 
        [userId]
      );
      // 再次锁定查询
      userRes = await client.query(
        'SELECT rin_balance FROM user_wallets WHERE user_id = $1 FOR UPDATE', 
        [userId]
      );
    }

    const currentBalance = userRes.rows[0].rin_balance;

    // 3. 查询商品详情
    const itemRes = await client.query(
      'SELECT * FROM shop_items WHERE id = $1', 
      [itemId]
    );
    
    if (itemRes.rowCount === 0) {
      throw new Error('Item not found');
    }

    const item = itemRes.rows[0];

    // 4. 余额校验
    if (currentBalance < item.price) {
      throw new Error('Insufficient funds');
    }

    // 5. 扣款
    const newBalance = currentBalance - item.price;
    await client.query(
      'UPDATE user_wallets SET rin_balance = $1, updated_at = NOW() WHERE user_id = $2', 
      [newBalance, userId]
    );

    // 6. 发货 (写入 inventory)
    // 根据商品类型决定存入 inventory 的 type
    // collectible -> loot (背包可见), consumable -> consumable (背包可见或直接使用), visual -> visual
    const invType = item.type === 'collectible' ? 'loot' : item.type;
    
    // 写入 user_inventory (复用之前的表)
    await client.query(
      `INSERT INTO user_inventory (user_id, item_id, type, acquired_at) 
       VALUES ($1, $2, $3, NOW())`,
      [userId, itemId, invType]
    );

    // 7. 提交事务
    await client.query('COMMIT');

    return NextResponse.json({ 
      success: true, 
      newBalance, 
      item,
      message: 'Transaction successful' 
    });

  } catch (error: any) {
    await client.query('ROLLBACK'); // 失败回滚
    console.error('[Shop Transaction] Error:', error);
    return NextResponse.json({ error: error.message || 'Transaction failed' }, { status: 500 });
  } finally {
    client.release();
  }
}