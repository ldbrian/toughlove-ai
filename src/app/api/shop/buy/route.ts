import { NextRequest, NextResponse } from 'next/server';
import { pgPool } from '@/lib/db-pg'; // 确保你之前创建了这个文件
import { SHOP_CATALOG } from '@/lib/constants';

export async function POST(req: NextRequest) {
  try {
    const { userId, itemId } = await req.json();
    
    // 1. 校验商品是否存在
    const item = SHOP_CATALOG.find(i => i.id === itemId);
    if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 400 });

    const client = await pgPool.connect();

    try {
      await client.query('BEGIN');

      // 2. 查余额并锁行
      const userRes = await client.query(
        `SELECT rin_balance FROM user_wallets WHERE user_id = $1 FOR UPDATE`, 
        [userId]
      );
      
      if (userRes.rows.length === 0) {
        throw new Error('Wallet not found');
      }

      const balance = userRes.rows[0].rin_balance;

      // 3. 余额不足
      if (balance < item.price) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: 'Insufficient funds' }, { status: 402 });
      }

      // 4. 扣款
      await client.query(
        `UPDATE user_wallets SET rin_balance = rin_balance - $1 WHERE user_id = $2`,
        [item.price, userId]
      );

      // 5. 写入背包 (inventory)
      // 假设我们有一个 user_inventory 表，或者直接存入 metadata。
      // 为简化 MVP，我们暂且把这步简化为：记录一条购买日志，
      // 实际生效逻辑（如改变背景）由前端根据 LocalStorage 或简单的 API 状态判断。
      
      // 这里建议：如果你还没建 inventory 表，先创建一个简单的购买记录表
      /*
        CREATE TABLE purchases (
          id SERIAL PRIMARY KEY,
          user_id UUID,
          item_id VARCHAR(50),
          created_at TIMESTAMP DEFAULT NOW()
        );
      */
    await client.query(
        `INSERT INTO purchases (user_id, item_id, cost) VALUES ($1, $2, $3)`,
        [userId, itemId, item.price] // <--- 这里要把 item.price 传进去
        );
    
        await client.query('COMMIT');
      return NextResponse.json({ success: true, newBalance: balance - item.price });

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