// src/lib/payment-security.ts
import crypto from 'crypto';

export function verifySignature(payload: any, signature: string | null, appSecret: string | undefined): boolean {
  if (!payload || !signature || !appSecret) {
    console.error('[Payment Security] Missing verification params');
    return false;
  }

  // 注意：不同平台规则不同。面包多通常是对 raw body 签名，或者是 JSON.stringify 后的字符串
  // 这里演示标准的 HMAC-SHA256
  const contentToSign = typeof payload === 'string' ? payload : JSON.stringify(payload);

  const expectedSignature = crypto
    .createHmac('sha256', appSecret)
    .update(contentToSign)
    .digest('hex');

  // 时间恒定比较，防止时序攻击
  const sigBuffer = Buffer.from(signature);
  const expBuffer = Buffer.from(expectedSignature);

  if (sigBuffer.length !== expBuffer.length) return false;
  return crypto.timingSafeEqual(sigBuffer, expBuffer);
}