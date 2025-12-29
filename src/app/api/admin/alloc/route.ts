// src/app/api/admin/alloc/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { pgPool } from '@/lib/db-pg'; // 复用你的 PG 连接池处理钱包

// 初始化 Supabase (Admin 权限)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { adminKey, targetUserId, type, value } = await req.json();

    // 1. 安全检查
    // 简单起见，复用 CRON_SECRET，或者你可以定义一个新的 ADMIN_SECRET
    const VALID_SECRET = process.env.CRON_SECRET || process.env.ADMIN_SECRET || 'admin123';
    
    if (adminKey !== VALID_SECRET) {
        return NextResponse.json({ error: 'Unauthorized: Invalid Admin Key' }, { status: 401 });
    }

    if (!targetUserId) {
        return NextResponse.json({ error: 'Missing Target User ID' }, { status: 400 });
    }

    // 2. 分配 RIN (使用 PG 连接池，因为钱包通常在 PG)
    if (type === 'rin') {
        const amount = parseInt(value);
        if (isNaN(amount)) return NextResponse.json({ error: 'Invalid Amount' }, { status: 400 });

        const client = await pgPool.connect();
        try {
            // Upsert 钱包并加钱
            await client.query(
                `INSERT INTO user_wallets (user_id, rin_balance) VALUES ($1, $2)
                 ON CONFLICT (user_id) 
                 DO UPDATE SET rin_balance = user_wallets.rin_balance + $2
                 RETURNING rin_balance`,
                [targetUserId, amount]
            );
            
            // 查询最新余额
            const res = await client.query('SELECT rin_balance FROM user_wallets WHERE user_id = $1', [targetUserId]);
            return NextResponse.json({ success: true, message: `Added ${amount} RIN`, newBalance: res.rows[0].rin_balance });
        } finally {
            client.release();
        }
    }

    // 3. 分配物品 (使用 Supabase 操作 profiles jsonb)
    if (type === 'item') {
        const itemId = String(value).trim();
        
        // 获取当前 Profile
        const { data: profile, error: fetchError } = await supabase
            .from('profiles')
            .select('inventory')
            .eq('id', targetUserId)
            .single();

        if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is 'row not found'
             throw new Error(fetchError.message);
        }

        // 如果用户不存在，尝试创建（可选，或直接报错）
        let currentInv = [];
        if (profile && Array.isArray(profile.inventory)) {
            currentInv = profile.inventory;
        }

        // 避免重复添加 (如果是 Unique 物品)
        // 这里不做严格限制，Admin 既然要加，就加上
        currentInv.push(itemId);

        // 更新数据库
        const { error: updateError } = await supabase
            .from('profiles')
            .upsert({ 
                id: targetUserId, 
                inventory: currentInv,
                updated_at: new Date().toISOString()
            });

        if (updateError) throw updateError;

        return NextResponse.json({ success: true, message: `Item [${itemId}] added to inventory.` });
    }

    return NextResponse.json({ error: 'Invalid action type' }, { status: 400 });

  } catch (e: any) {
    console.error('[Admin Alloc Error]', e);
    return NextResponse.json({ error: e.message || 'Internal Server Error' }, { status: 500 });
  }
}