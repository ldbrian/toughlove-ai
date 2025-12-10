// src/lib/storage.ts

const IS_BROWSER = typeof window !== 'undefined';

/**
 * 从 LocalStorage 读取数据
 * 返回值类型为 any，允许读取对象、字符串或数组
 */
export function getMemory(key: string): any {
  if (!IS_BROWSER) return undefined;
  try {
    const item = localStorage.getItem(key);
    // 如果是 JSON 字符串，尝试解析；如果不是，返回原字符串
    if (item) {
        try {
            return JSON.parse(item);
        } catch {
            return item; // 可能是普通字符串
        }
    }
    return undefined;
  } catch (e) {
    console.error(`Error loading memory key "${key}":`, e);
    return undefined;
  }
}

/**
 * 保存数据到 LocalStorage
 * value 类型为 any，允许保存对象、字符串或数组
 */
export function saveMemory(key: string, value: any): void {
  if (!IS_BROWSER) return;
  try {
    // 如果是字符串，直接存；如果是对象/数组，序列化存
    const valToStore = typeof value === 'string' ? value : JSON.stringify(value);
    localStorage.setItem(key, valToStore);
  } catch (e) {
    console.error(`Error saving memory key "${key}":`, e);
  }
}

/**
 * 清除数据
 */
export function clearMemory(key: string): void {
  if (!IS_BROWSER) return;
  localStorage.removeItem(key);
}

/**
 * ✨ FIX: 补回缺失的 helper 函数
 * 获取指定角色的最后一条消息内容，用于首页预览
 */
// src/lib/storage.ts

/**
 * 获取指定角色的最后一条消息内容
 * 🧠 智能版：会自动尝试 activePersona 的原始大小写和全小写两种 Key
 */
// src/lib/storage.ts

/**
 * 获取指定角色的最后一条消息内容
 * 🕵️‍♂️ 全能侦探版：兼容新旧两种 Key，大小写通吃
 */
// src/lib/storage.ts

/**
 * 获取指定角色的最后一条消息内容
 * 🕵️‍♂️ 终极侦探版：兼容新旧标准，甚至兼容“裸奔”的 Key
 */
export function getLastMessage(partnerId: string): string {
  if (!IS_BROWSER) return "";
  
  // 内部辅助：尝试读取并解析
  const tryGetContent = (key: string) => {
      try {
          const data = localStorage.getItem(key);
          if (!data) return null;

          // 尝试解析 JSON
          let messages;
          try {
              messages = JSON.parse(data);
          } catch {
              return null; 
          }

          if (Array.isArray(messages) && messages.length > 0) {
              const lastMsg = messages[messages.length - 1];
              // 确保有内容且是字符串
              if (lastMsg && typeof lastMsg.content === 'string') {
                  return lastMsg.content;
              }
          }
      } catch (e) {
          console.error(`Error reading key ${key}:`, e);
      }
      return null;
  };

  // 1. 尝试新标准 (优先): toughlove_chat_Ash
  if (tryGetContent(`toughlove_chat_${partnerId}`)) return tryGetContent(`toughlove_chat_${partnerId}`)!;

  // 2. 尝试新标准 (小写 - 适用于 Rin/Vee): toughlove_chat_ash
  if (tryGetContent(`toughlove_chat_${partnerId.toLowerCase()}`)) return tryGetContent(`toughlove_chat_${partnerId.toLowerCase()}`)!;

  // 3. 尝试旧标准 (兼容): messages_Ash
  if (tryGetContent(`messages_${partnerId}`)) return tryGetContent(`messages_${partnerId}`)!;

  // 4. 尝试旧标准 (小写): messages_ash
  if (tryGetContent(`messages_${partnerId.toLowerCase()}`)) return tryGetContent(`messages_${partnerId.toLowerCase()}`)!;

  // 🔥 5. 尝试裸奔标准 (捕获 Ash): ash
  // 直接用 partnerId 的小写作为 Key
  if (tryGetContent(partnerId.toLowerCase())) return tryGetContent(partnerId.toLowerCase())!;

  return "";
}