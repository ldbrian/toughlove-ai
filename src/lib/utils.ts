// src/lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export function getDeviceId(): string {
  if (typeof window === 'undefined') return 'server-side-id';
  
  let id = localStorage.getItem('toughlove_device_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('toughlove_device_id', id);
  }
  
  // 🔥 加这行日志，每次调用都打印出来
  console.log("%c[Current UserID]: " + id, "color: yellow; font-size: 14px; font-weight: bold;");
  
  return id;
}