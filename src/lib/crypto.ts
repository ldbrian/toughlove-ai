import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

// 算法配置
const ALGORITHM = 'aes-256-cbc';
const KEY = process.env.ENCRYPTION_KEY || ''; // 必须32位
const IV_LENGTH = 16; // AES 初始向量长度

export function encrypt(text: string): string {
  if (!KEY || KEY.length !== 32) {
    console.error("❌ ENCRYPTION_KEY must be 32 chars");
    return text; // 如果没配好key，降级为明文，防止崩坏
  }
  
  try {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, Buffer.from(KEY), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    // 返回格式：IV:密文 (IV是随机的，每次加密结果都不同，更安全)
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  } catch (e) {
    console.error("Encrypt failed", e);
    return text;
  }
}

export function decrypt(text: string): string {
  if (!KEY || !text.includes(':')) return text; // 不是加密格式，直接返回

  try {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift()!, 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = createDecipheriv(ALGORITHM, Buffer.from(KEY), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (e) {
    console.error("Decrypt failed", e);
    return text; // 解密失败返回原文（或空）
  }
}