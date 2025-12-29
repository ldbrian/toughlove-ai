import { NextResponse } from 'next/server';
import { pgPool } from '@/lib/db-pg';

// 计算 Buff 结束时间
const getBuffEndTime = (minutes: number) => {
    return new Date(Date.now() + minutes * 60000).toISOString();
};

export async function POST(req: Request) {
  try {
    const { userId, itemId, targetPersona } = await req.json();
    const client = await pgPool.connect();

    try {
        await client.query('BEGIN');

        // 1. 验证用户背包 (user_inventory)
        // 确保物品确实存在于用户背包中
        const inventoryRes = await client.query(
            `SELECT * FROM user_inventory 
             WHERE user_id = $1 AND item_id = $2 
             LIMIT 1 
             FOR UPDATE SKIP LOCKED`,
            [userId, itemId]
        );

        if (inventoryRes.rowCount === 0) {
             throw new Error('Item not owned'); 
        }
        
        const inventoryItem = inventoryRes.rows[0];

        // 2. 获取物品定义 (只查数据库 system_items)
        let itemDef: any = null;
        
        // 🔥 修改点：表名改为 system_items，且直接读取数据库中的 effect 配置
        const dbItemRes = await client.query(
            `SELECT * FROM system_items WHERE id = $1`, 
            [itemId]
        );

        if (dbItemRes.rows.length > 0) {
            itemDef = dbItemRes.rows[0];
            // 注意：Postgres 的 JSONB 字段会被自动解析为 JS 对象
            // 如果数据库里 effect 为空，给个默认值防止报错
            if (!itemDef.effect) {
                itemDef.effect = { mood_value: 5, favorability: 1 };
            }
        } 

        // 🔥 修改点：移除了原本查找 CONSTANTS 的兜底逻辑
        // 现在数据库是唯一的真理来源

        if (!itemDef) {
            throw new Error(`Invalid Item: ${itemId} not found in system_items table.`); 
        }

        // 3. 消耗物品 (从背包删除)
        // 暂时简单处理：直接删除一条记录（如果是堆叠逻辑，这里应该是 quantity - 1）
        await client.query(
            `DELETE FROM user_inventory WHERE id = $1`,
            [inventoryItem.id]
        );

        // 4. 记录日志
        // 如果你有 item_usage_logs 表，保留此逻辑；如果没有，可以注释掉或建表
        // 为了稳健性，这里加个简单的 try-catch 或者假设表存在
        try {
            await client.query(
                `INSERT INTO item_usage_logs (user_id, item_id, target_persona, created_at) VALUES ($1, $2, $3, NOW())`,
                [userId, itemId, targetPersona]
            );
        } catch (logError) {
            console.warn("Usage log failed (non-critical):", logError);
        }

        // 5. 应用效果 (修改人格状态)
        const isTargetCorrect = true; // 后续可以加逻辑判断物品是否只能给特定人
        let moodBoost = 0;
        let favBoost = 0;

        if (isTargetCorrect) {
            const stateRes = await client.query(
                `SELECT mood, favorability FROM persona_states WHERE user_id = $1 AND persona = $2`,
                [userId, targetPersona]
            );
            
            const currentMood = stateRes.rows[0]?.mood || 60;
            const currentFav = stateRes.rows[0]?.favorability || 0;

            const effect = itemDef.effect || { mood_value: 5, favorability: 1 };
            
            // 计算新数值
            const newMood = Math.min(100, Math.max(0, currentMood + (effect.mood_value || 0)));
            const newFav = currentFav + (effect.favorability || 0);
            
            // 处理 Buff 时间
            const buffEnd = effect.buff_duration ? getBuffEndTime(effect.buff_duration) : null;

            // 更新状态 (Upsert)
            await client.query(`
                INSERT INTO persona_states (user_id, persona, mood, favorability, buff_end_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, NOW())
                ON CONFLICT (user_id, persona) 
                DO UPDATE SET 
                    mood = $3,
                    favorability = $4,
                    buff_end_at = CASE WHEN $5 IS NOT NULL THEN $5 ELSE persona_states.buff_end_at END,
                    updated_at = NOW()
            `, [userId, targetPersona, newMood, newFav, buffEnd]);
            
            moodBoost = effect.mood_value || 0;
            favBoost = effect.favorability || 0;
        }

        await client.query('COMMIT');

        // 构建返回消息
        // 兼容 JSON 类型的 name ({zh, en}) 或 纯字符串
        const itemName = itemDef.name?.zh || itemDef.name?.en || itemDef.name || '物品';

        return NextResponse.json({ 
            success: true, 
            message: `(使用成功) ${targetPersona} 使用了 ${itemName}。`,
            moodBoost,
            favBoost,
            removedItemId: itemId 
        });

    } catch (e: any) {
        await client.query('ROLLBACK');
        console.error("Transaction failed:", e);
        return NextResponse.json({ error: e.message || 'Transaction failed' }, { status: 400 });
    } finally {
        client.release();
    }

  } catch (error) {
    console.error("System Error:", error);
    return NextResponse.json({ error: 'System Error' }, { status: 500 });
  }
}