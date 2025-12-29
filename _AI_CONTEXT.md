# 🤖 AI CO-PILOT CONTEXT: TOUGH LOVE ECOSYSTEM
**最后更新**: 2025-12-27
**当前状态**: 主App收尾 (80%) + 增长黑客工具 (H5) 启动

---

## 1. 全局技术栈 (Global Tech Stack)
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS (核心色: Void Black `#050505`, Accent `#991b1b`)
- **Backend**: Supabase (Auth, Database, Storage)
- **AI Engine**: Vercel AI SDK + LLM Provider

---

## 2. 项目 A: Tough Love OS (主 APP)
**定位**: 核心产品 / 长期陪伴 / 精神档案
**当前进度**: 80% 重构完成

### ✅ 已完成功能 (Done)
- **Hero Feed**: 每日内容流 (Ash/Vee/Rin 等 AI 编辑部)。
- **Daily Calibration (每日校准)**: 价值观选择题，修正用户模型。
- **Sleep Signals (助眠信号)**: 结合白噪音与语音交互的功能。

### 🚧 待办/进行中 (To-Do Priority)
1.  **Personal Center (个人中心)**:
    -   需展示 "Soul Archive" (精神档案) 数据可视化（雷达图/流体图）。
    -   需整合背包/记忆物品展示。
2.  **Onboarding (初次登录 5 题)**:
    -   **现状**: 旧代码逻辑存在，需适配新 UI 和 Supabase 架构。
    -   **目标**: 用户首次进入时的心理侧写，决定初始 AI 关系。
3.  **Bug Bash (扫尾)**: 修复遗留报错，优化性能。

---

## 3. 项目 B: Ash's Logic Lab (H5 / 增长引擎)
**定位**: 流量入口 / 毒舌诊断 / 一次性工具 / 朋友圈海报
**当前进度**: MVP 规划阶段

### 🎯 核心功能
- **单页对话**: 极简交互，Ash 进行 2-3 轮追问。
- **诊断生成**: 生成“热敏纸/医疗小票”风格的诊断单。
- **通用海报引擎 (Poster Engine)**:
    -   **用途 1**: H5 用户生成诊断结果截图。
    -   **用途 2**: 将 Hero Feed 内容转化为宣发海报 (用于小红书/私域)。
    -   **要求**: 自动化、高颜值、代码生成图片 (Satori/html-to-image)。

---

## 4. 关键设定与约束 (Constraints)
- **Ash 人设 (对外)**: "逻辑架构师" 或 "观察员"。**严格去医疗化**，不自称医生，不称诊所，规避合规风险。
- **数据隔离**: H5 暂不强制要求登录（游客模式），通过 Session 或 URL 参数传递数据，仅在需要深度服务时引导下载 App。
- **UI 风格**: 保持 "Soft Sci-Fi" (软科幻) 调性，使用有机流体动画和磨砂质感。

---

## 5. 即刻行动指令 (Next Actions)
- [ ] **Task 1**: 开发 `Personal Center` 页面，先跑通静态布局。
- [ ] **Task 2**: 迁移/重构 `Onboarding` 的 5 道测试题逻辑。
- [ ] **Task 3**: 搭建 H5 项目的基础脚手架。