// src/lib/payment-service.ts
import { pgPool } from './db-pg';
import { verifySignature } from './payment-security';

export async function processPaymentCallback(headers: Headers, rawBody: string, jsonBody: any) {
  const appSecret = process.env.PAYMENT_APP_SECRET;
  
  // 1. 获取签名 (Header Key 视具体平台而定，通常是 'x-signature' 或 'sign')
  const signature = headers.get('x-signature') || headers.get('sign');

  console.log(`[Payment] Received webhook. Order: ${jsonBody?.custom_order_id}`);

  // 🛡️ 防线一：签名校验 (传入 rawBody 以确保签名匹配)
  if (!verifySignature(jsonBody, signature, appSecret)) { // 有些平台要验 rawBody，有些验 JSON，需调试确认
    console.warn(`[Payment] Invalid Signature.`);
    return { status: 403, body: 'Invalid Signature' };
  }

  const { custom_order_id, trade_status, amount } = jsonBody;
  
  // 获取一个客户端连接
  const client = await pgPool.connect();

  try {
    // 🛡️ 防线二：开启事务
    await client.query('BEGIN');

    // 🛡️ 防线三：行级锁 (FOR UPDATE)
    // 这一步会锁住该订单行，任何并发请求都会卡住等待，直到事务结束
    const orderRes = await client.query(
      `SELECT * FROM orders WHERE order_id = $1 FOR UPDATE`, 
      [custom_order_id]
    );
    
    if (orderRes.rows.length === 0) {
      await client.query('ROLLBACK');
      console.error(`[Payment] Order not found: ${custom_order_id}`);
      return { status: 200, body: 'Order not found (skipped)' }; 
    }

    const order = orderRes.rows[0];

    // 🛡️ 防线四：幂等性检查
    // 如果已经是终态，直接返回
    if (['PAID', 'FAILED', 'SCAM_ATTEMPT'].includes(order.status)) {
      console.log(`[Payment] Order ${custom_order_id} already ${order.status}. Ignoring.`);
      await client.query('ROLLBACK');
      return { status: 200, body: 'success' };
    }

    // 🛡️ 防线五：金额校验 (转为 Number 比较，注意精度)
    const paidAmount = parseFloat(amount);
    const orderAmount = parseFloat(order.amount);
    
    // 允许极其微小的浮点误差 (0.01)
    if (paidAmount < orderAmount - 0.01) {
      console.warn(`[Payment] SCAM: Paid ${paidAmount}, Expected ${orderAmount}`);
      await client.query(
        `UPDATE orders SET status = 'SCAM_ATTEMPT', updated_at = NOW() WHERE order_id = $1`,
        [custom_order_id]
      );
      await client.query('COMMIT');
      return { status: 200, body: 'scam detected' };
    }

    // ✅ 核心业务：发货
    if (trade_status === 'TRADE_SUCCESS' || trade_status === 'SUCCESS') {
      // 1. 更新订单
      await client.query(
        `UPDATE orders SET status = 'PAID', paid_at = NOW(), updated_at = NOW() WHERE order_id = $1`,
        [custom_order_id]
      );

      // 2. 加余额
      await client.query(
        `UPDATE user_wallets 
         SET rin_balance = rin_balance + $1, 
             total_recharged = total_recharged + $2,
             updated_at = NOW() 
         WHERE user_id = $3`,
        [order.rin_quantity, paidAmount, order.user_id]
      );
      
      console.log(`[Payment] Success! User ${order.user_id} got ${order.rin_quantity} Rin.`);
    } else {
      // 支付失败
      await client.query(
        `UPDATE orders SET status = 'FAILED', updated_at = NOW() WHERE order_id = $1`,
        [custom_order_id]
      );
    }

    await client.query('COMMIT');
    return { status: 200, body: 'success' };

  } catch (error) {
    await client.query('ROLLBACK'); // 💥 遇到报错，全部撤回
    console.error('[Payment] Critical DB Error:', error);
    return { status: 500, body: 'Internal Error' };
  } finally {
    client.release(); // 释放连接回池子
  }
}