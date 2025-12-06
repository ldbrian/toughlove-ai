---

## 8. v2.3.x 体验深化协议 (Optimization Protocols)
*Status: Confirmed / Pending Implementation*
*Purpose: To increase user retention loop and emotional granularity without altering core architecture.*

### 8.1 情感惯性与记忆钩子 (Emotional Inertia)
* **核心逻辑**：打破模块间的“失忆症”，建立跨功能的上下文关联。
* **协议 A：信任门槛 (Trust Gating)**
    * **Lv.1 (Shield)**: AI 必须表现出“冷淡”和“拒绝”。对于无意义的闲聊（如“你好”、“天气”），Ash 需拒绝回答或嘲讽用户无聊。
    * **Lv.3 (Heart)**: 解锁“隐藏温柔”。仅在高信任度下，AI 才会对用户的负面情绪（累、痛）给予有限度的共情。
    * **验收标准**: 测试账号 Lv.1 时问“你好”，应被怼；Lv.3 时问同样问题，应得到不同回应。
* **协议 B：跨模块记忆 (Cross-Module Hook)**
    * **机制**: Sol 专注模式结束（成功/失败）后，系统需生成一条隐藏的 System Message 注入到 Chat Context 中。
    * **表现**: 用户切回对话页面时，Ash 的第一句话必须针对刚才的专注结果进行评价（嘲讽失败/勉励成功），而不是等待用户先开口。

### 8.2 稀缺性经济模型 (Scarcity Economy)
* **核心逻辑**：通过通货膨胀和限时供应，解决代币 (Rin) 价值感低的问题。
* **协议 A：动态定价 (Dynamic Pricing)**
    * **对象**: 消耗品（如 Ash's Coffee）。
    * **公式**: `Price_N = Base_Price * (1.5 ^ (N-1))`。
    * **目的**: 阻止用户依赖购买道具来“走捷径”，倒逼其参与 Sol 专注模式赚取更多代币。
* **协议 B：午夜黑市 (Night Market)**
    * **机制**: 特定商品（如特殊壁纸、赦免令）仅在服务器时间 **22:00 - 02:00** 可见或可购买。
    * **UI**: 商店界面在此时段应呈现不同的视觉风格（如色调变暗、霓虹闪烁）。

### 8.3 社交勒索与水印 (Social Ransom)
* **核心逻辑**：利用“耻辱感”和“炫耀欲”驱动病毒传播。
* **协议 A：灰度锁定 (Gray Lock)**
    * **触发**: 用户在 Sol 模式中**严重失败**（如进度 < 10% 即放弃）。
    * **惩罚**: App 主界面进入“灰度/锁定”状态，无法正常对话。
    * **解锁条件**: 分享生成的《耻辱海报》并被扫描（模拟），或支付高额赎金（500 Rin）。
* **协议 B：毒舌水印 (Toxic Watermark)**
    * **机制**: 分享《荣耀海报》时，底部必须附加一句 Ash 的随机毒舌评语。
    * **内容库**: 需在 `constants.ts` 中维护一个 `GLORY_COMMENTS` 文案库。

---