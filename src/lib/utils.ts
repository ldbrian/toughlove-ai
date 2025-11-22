import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 👇 核心修复：确保生成标准的 UUID v4 格式
export function getDeviceId(): string {
  if (typeof window === 'undefined') return '00000000-0000-0000-0000-000000000000';
  
  let id = localStorage.getItem('toughlove_device_id');
  
  // 简单的正则检查：如果旧 ID 不是 UUID 格式，就重新生成
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  
  if (!id || !uuidRegex.test(id)) {
    // 生成标准 UUID
    id = crypto.randomUUID ? crypto.randomUUID() : '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, c =>
      (Number(c) ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> Number(c) / 4).toString(16)
    );
    localStorage.setItem('toughlove_device_id', id);
  }
  return id;
}