// src/config/tasks.ts

export const TASK_POOL: Record<string, { title: { zh: string, en: string }, desc: { zh: string, en: string }, reward: number }[]> = {
    // 通用任务
    common: [
        { title: { zh: "去洗一把脸。", en: "Go wash your face." }, desc: { zh: "别让屏幕把你的脸照得油光满面。", en: "Don't let the screen make your face shiny." }, reward: 10 },
        { title: { zh: "喝一杯温水。", en: "Drink warm water." }, desc: { zh: "你的身体现在比沙漠还干。", en: "Your body is drier than a desert right now." }, reward: 10 },
        { title: { zh: "清理你的桌面。", en: "Clean your desk." }, desc: { zh: "环境的混乱会导致思维的混乱。", en: "A messy desk leads to a messy mind." }, reward: 15 },
    ],
    // Ash (严厉/健康)
    ash: [
        { title: { zh: "坐直了！", en: "Sit up straight!" }, desc: { zh: "你的脊柱正在发出哀嚎，听到了吗？", en: "Your spine is screaming. Can you hear it?" }, reward: 20 },
        { title: { zh: "做一次深呼吸。", en: "Deep breath." }, desc: { zh: "吸气4秒，憋气4秒，呼气4秒。现在。", en: "In 4s, hold 4s, out 4s. Now." }, reward: 10 },
    ],
    // Rin (情绪/氛围)
    rin: [
        { title: { zh: "看窗外一分钟。", en: "Look outside." }, desc: { zh: "别盯着电子屏幕了，看看真实的世界。", en: "Stop staring at pixels. Look at the real world." }, reward: 15 },
        { title: { zh: "听一首纯音乐。", en: "Listen to music." }, desc: { zh: "让大脑的频率降下来。", en: "Lower your brain's frequency." }, reward: 15 },
    ],
    // Sol (运动/热血)
    sol: [
        { title: { zh: "做 10 个俯卧撑！", en: "10 Pushups! Now!" }, desc: { zh: "别找借口！就在地上做！", en: "No excuses! Do it on the floor!" }, reward: 30 },
        { title: { zh: "站起来走两步！", en: "Stand up & Walk!" }, desc: { zh: "你的腿要退化了！动起来！", en: "Your legs are atrophying! Move!" }, reward: 15 },
    ],
    // Vee (搞怪/反常规)
    vee: [
        { title: { zh: "删一张丑照。", en: "Delete a bad photo." }, desc: { zh: "释放一点存储空间，也释放一点黑历史。", en: "Free up space, free up history." }, reward: 20 },
        { title: { zh: "断网 5 分钟。", en: "Disconnect 5m." }, desc: { zh: "试试没有网络能不能活下来？", en: "Can you survive offline?" }, reward: 50 },
    ]
};