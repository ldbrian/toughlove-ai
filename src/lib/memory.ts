import { createClient } from '@supabase/supabase-js';
import { OpenAI } from 'openai';

// 🔥 防崩修改
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'build-time-dummy-key'
);

const openai = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY || 'dummy',
  baseURL: 'https://api.deepseek.com',
});

// ... 下面的 processRollingMemory 函数保持不变 ...
export async function processRollingMemory(userId: string, persona: string) {
    // ...
}