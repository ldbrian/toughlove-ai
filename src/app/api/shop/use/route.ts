import { NextResponse } from 'next/server';
import { pgPool } from '@/lib/db-pg';
import { SHOP_CATALOG, LOOT_TABLE } from '@/lib/constants';

// 计算 Buff 结束时间 (当前时间 + 分钟数)
const getBuffEndTime = (minutes: number) => {
    return new Date(Date.now() + minutes * 60000).toISOString();
};

export async function POST(req: Request) {
  try {
    const { userId, itemId, targetPersona } = await req.json();
    
    // 1. 识别物品 (可能是商店货，也可能是掉落物)
    const shopItem = SHOP_CATALOG.find(i => i.id === itemId);
    const lootItem = LOOT_TABLE[itemId];
    
    if (!shopItem && !lootItem) {
        return NextResponse.json({ error: 'Invalid Item' }, { status: 400 });
    }

    // 2. 提取效果
    // 🔥 FIX: 显式声明为 any，允许后续进行类型转换 (从 string/undefined 转为 object)
    let effect: any = shopItem?.effect || lootItem?.effect;
    
    // 默认兜底效果 (如果常量里没写 effect)
    if (!effect) {
        // 根据稀有度给默认好感
        const rarity = lootItem?.rarity || 'common';
        // 使用 Record<string, number> 避免索引类型错误
        const boostMap: Record<string, number> = { common: 1, rare: 5, epic: 20, legendary: 50 };
        effect = { 
            target: targetPersona, 
            mood_value: 5, 
            favorability: boostMap[rarity] || 1,
            buff_duration: 0 
        };
    } else if (typeof effect === 'string') {
        // 兼容旧数据格式 (String -> Object)
        effect = { target: targetPersona, mood_value: 10, favorability: 1, buff_duration: 0 };
    }

    // 🔥 双重保险：此时 effect 一定是对象，且 target 存在
    // 为了让 TS 彻底闭嘴，我们在这里默认它已经有了 target 属性
    const safeEffect = effect; 

    // 3. 校验目标 (送错人效果打折，或者无效)
    // 简单逻辑：如果目标不对，不做情绪更新，只消耗物品
    const isTargetCorrect = (safeEffect.target === 'All' || safeEffect.target === 'Any' || safeEffect.target === targetPersona);

    const client = await pgPool.connect();
    
    try {
        await client.query('BEGIN');

        // 4. 记录使用日志
        await client.query(
            `INSERT INTO item_usage_logs (user_id, item_id, target_persona, created_at) VALUES ($1, $2, $3, NOW())`,
            [userId, itemId, targetPersona]
        );

        let moodBoost = 0;
        let favBoost = 0;

        if (isTargetCorrect) {
            // 5. 更新情绪状态 (Upsert)
            // 先查当前状态
            const stateRes = await client.query(
                `SELECT mood, favorability FROM persona_states WHERE user_id = $1 AND persona = $2`,
                [userId, targetPersona]
            );
            
            const currentMood = stateRes.rows[0]?.mood || 60;
            const currentFav = stateRes.rows[0]?.favorability || 0;

            const newMood = Math.min(100, currentMood + (safeEffect.mood_value || 0));
            const newFav = currentFav + (safeEffect.favorability || 0);
            const buffEnd = safeEffect.buff_duration ? getBuffEndTime(safeEffect.buff_duration) : null;

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
            
            moodBoost = safeEffect.mood_value || 0;
            favBoost = safeEffect.favorability || 0;
        }

        await client.query('COMMIT');

        return NextResponse.json({ 
            success: true, 
            message: isTargetCorrect ? `(赠送成功) ${targetPersona} 的心情看起来不错。` : `(你递了过去，但 ${targetPersona} 似乎并不感兴趣...)`,
            moodBoost,
            favBoost
        });

    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }

  } catch (error) {
    console.error("Item Use Error:", error);
    return NextResponse.json({ error: 'System Error' }, { status: 500 });
  }
}