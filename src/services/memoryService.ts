import { createClient } from '@/utils/supabase/client';
import { ARTIFACTS_DB } from '@/config/artifacts';

export const memoryService = {
  
  // 1. 获取用户所有物品 (聚合版)
  // 在 memoryService 对象里找到 getUserInventory 并替换：
  
  async getUserInventory() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return [];

    try {
        // 🔥 核心修改：走 API 避免 RLS 报错，且数据格式由后端统一处理
        const res = await fetch(`/api/inventory?userId=${user.id}`);
        const data = await res.json();
        
        if (data.error) {
            console.error("[MemoryService] API Error:", data.error);
            return [];
        }
        return data.inventory || [];
    } catch (e) {
        console.error("[MemoryService] Fetch Failed:", e);
        return [];
    }
  },

  // 2. 检查是否拥有
  async hasItem(itemId: string) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { count } = await supabase
        .from('user_inventory')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('item_id', itemId);
    
    return (count || 0) > 0;
  },

  // 3. 添加核心藏品 (走 API)
  async addArtifactToInventory(artifactId: string) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        console.error("User not found during addArtifact");
        return;
    }

    // 前端快速检查，减少不必要的请求
    const hasIt = await this.hasItem(artifactId);
    if (hasIt) return;

    try {
        await fetch('/api/inventory/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: user.id,
                itemId: artifactId,
                itemType: 'artifact',
                metadata: {} 
            })
        });
        console.log(`[Memory] Artifact ${artifactId} added request sent.`);
    } catch (error) {
        console.error("Add Artifact Failed:", error);
    }
  },

  // 4. 保存塔罗牌 (走 API)
  async addTarotToInventory(cardId: number | string) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const cleanId = String(cardId).replace('tarot_', '');

    try {
        await fetch('/api/inventory/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: user.id,
                itemId: cleanId,
                itemType: 'tarot',
                metadata: { source: 'daily_draw' }
            })
        });
    } catch (error) {
        console.error(`[Memory] Add Tarot ${cleanId} Failed:`, error);
    }
  },

  // 5. 成就相关 (Upsert)
  async getUnlockedAchievements() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    
    const { data } = await supabase.from('user_achievements').select('achievement_id').eq('user_id', user.id);
    return data?.map(row => row.achievement_id) || [];
  },

  async unlockAchievement(achievementId: string) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 成就通常不敏感，暂时保留 Supabase 调用，如果报错也可以改为 API
    await supabase.from('user_achievements').upsert(
      { user_id: user.id, achievement_id: achievementId },
      { onConflict: 'user_id, achievement_id', ignoreDuplicates: true }
    );
  },

  // 6. 添加通用物品 (走 API)
  async addLootToInventory(lootData: any) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
        await fetch('/api/inventory/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: user.id,
                itemId: lootData.id,
                itemType: lootData.type || 'loot',
                metadata: {
                    name: lootData.name,
                    desc: lootData.desc,
                    icon: lootData.icon, 
                    rarity: lootData.rarity
                }
            })
        });
    } catch (error) {
        console.error("Add Loot Failed:", error);
    }
  }
};