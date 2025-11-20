// src/lib/utils.ts
export function getDeviceId(): string {
    if (typeof window === 'undefined') return 'server-side';
    
    let id = localStorage.getItem('toughlove_device_id');
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem('toughlove_device_id', id);
    }
    return id;
  }