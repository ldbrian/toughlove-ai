1.1 Data & Security Architecture  - [NEW]
核心理念: Hybrid Inventory (混合背包) & RLS Security。

A. Hybrid Inventory System (混合物品架构)
    * Static Artifacts (硬编码神器): 
        * 定义: 核心剧情道具 (e.g., future_letter)，定义在 `src/config/artifacts.ts`。
        * 特点: 零数据库开销，支持复杂的前端逻辑（组件渲染），由代码逻辑控制发放。
    * Dynamic Loot (动态掉落物): 
        * 定义: 通用物品，存储在 Supabase `user_inventory` 表中。
        * 特点: 支持 RLS 隔离，用于商店购买、盲盒掉落、Feed 奖励。
    * Unified View (统一视图): 前端 `InventoryModal` 负责将两者 Merge 展示，用户无感。

B. Security Model (安全模型)
    * Authentication: 
        * 全站启用 Supabase Auth (或者基于 DeviceID 的匿名 Auth 过渡方案)。
        * 弃用传统 API Middleware 鉴权，全面拥抱 PostgreSQL Row Level Security (RLS)。
    * Policy (策略):
        * `user_inventory`, `user_wallets`: 仅允许用户 `SELECT` 自己的数据。
        * `INSERT/UPDATE`: 必须通过 Server Actions 或 Route Handlers (服务端) 执行，防止前端篡改余额。

C. Economy Transaction (Rin 货币流转)
    * Single Source of Truth: 用户的余额以 `user_wallets` 表中的 `rin_balance` 为准。
    * Transactional Integrity: 
        * 购买操作必须使用数据库事务 (Transaction)。
        * 步骤: 检查余额 -> 扣款 -> 插入物品 -> 写入日志。原子性操作，要么全成，要么全败。