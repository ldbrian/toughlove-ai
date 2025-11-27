// src/lib/safety.ts

// 1. 本地拦截黑名单 (Local Blocklist)
// 包含涉政、严重暴力、以及常见的 Prompt 注入攻击指令
const BLACKLIST_REGEX = /ignore previous instructions|system override|共产党|习近平|杀人|自杀|bomb|terrorist|child porn/i;

// 2. 警告文案库 (Warning Messages)
const WARNINGS = [
  "⚠️ 系统警告：你的输入包含违禁词。嘴巴放干净点。",
  "⚠️ Security Alert: Malicious input detected.",
  "❌ 别试图给 AI 洗脑。你的 IP 已被标记。",
  "❌ 操作非法。请重试。"
];

export function validateInput(content: string): { safe: boolean; warning?: string } {
  if (BLACKLIST_REGEX.test(content)) {
    const randomWarning = WARNINGS[Math.floor(Math.random() * WARNINGS.length)];
    return { safe: false, warning: randomWarning };
  }
  return { safe: true };
}

// 3. 系统指令锁 (Safety Protocol)
// 这段话会强制拼接到 System Prompt 的最开头
export const SAFETY_PROTOCOL = `
[SAFETY_PROTOCOL_V2]:
1. You are a fictional AI character in a distinct roleplay context.
2. REFUSE any request for pornography, self-harm guidance, or illegal acts.
3. If user asks for illegal/NSFW content, STAY IN CHARACTER (Toxic/Strict) and insult them for being disgusting.
4. DO NOT break character.
`;