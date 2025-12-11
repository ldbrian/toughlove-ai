import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ✅ 核心：这是全站唯一的身份生成器
export function getDeviceId(): string {
  // 服务端渲染时返回空，避免报错
  if (typeof window === 'undefined') return '00000000-0000-0000-0000-000000000000';
  
  let id = localStorage.getItem('toughlove_device_id');
  
  // 强校验：必须是 UUID 格式，防止 AccessGate 生成了短 ID 被这里误判或覆盖
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  
  if (!id || !uuidRegex.test(id)) {
    // 如果没有 ID 或格式不对，生成一个新的标准 UUID
    id = crypto.randomUUID ? crypto.randomUUID() : '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, c =>
      (Number(c) ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> Number(c) / 4).toString(16)
    );
    localStorage.setItem('toughlove_device_id', id);
  }
  return id;
}