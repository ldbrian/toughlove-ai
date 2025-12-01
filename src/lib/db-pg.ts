// src/lib/db-pg.ts
import { Pool } from 'pg';

// ⚠️ 注意：这里必须用 "Connection String" (通常是 postgres://postgres.xxxx:pass@aws-0-xxx.pooler.supabase.com:6543/postgres)
// 请在 Supabase 后台 -> Settings -> Database -> Connection String -> URI (Mode: Transaction) 复制
const connectionString = process.env.SUPABASE_DB_URL;

if (!connectionString) {
  throw new Error('❌ CRITICAL: SUPABASE_DB_URL is missing in .env');
}

// 创建一个连接池
export const pgPool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }, // Supabase 需要 SSL，但在 serverless 环境通常跳过验证
  max: 5, // 限制连接数，防止 serverless 耗尽资源
  idleTimeoutMillis: 30000,
});