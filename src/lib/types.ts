// src/lib/types.ts
export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
    isHidden?: boolean;
}

export interface StatsType {
    bond: number;
    chatCount: number;
    eventCount: number;
}