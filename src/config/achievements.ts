// src/config/achievements.ts
import { Terminal, Heart, Zap, Skull, Eye } from 'lucide-react';

export interface Achievement {
  id: string;
  title: { zh: string; en: string };
  desc: { zh: string; en: string };
  exp: number;
  icon: any;
  hidden?: boolean;
}

export const ACHIEVEMENTS_DB: Achievement[] = [
  {
    id: 'hello_world',
    title: { zh: '首次链接', en: 'Hello World' },
    desc: { zh: '成功登录系统并接收来自未来的信。', en: 'Login and receive the letter.' },
    exp: 100,
    icon: Terminal
  },
  {
    id: 'survivor',
    title: { zh: '幸存者', en: 'Survivor' },
    desc: { zh: '在一次 S 级危机（剧本杀）中存活。', en: 'Survive an S-Class Crisis.' },
    exp: 500,
    icon: Skull
  },
  {
    id: 'heart_of_steel',
    title: { zh: '钢铁之心', en: 'Heart of Steel' },
    desc: { zh: '做出一次完全理性的冷酷决策。', en: 'Make a purely rational choice.' },
    exp: 300,
    icon: Zap
  },
  {
    id: 'simp_king',
    title: { zh: '情感过载', en: 'Emotional Overload' },
    desc: { zh: '单日内给同一位伙伴发送超过 50 条消息。', en: 'Send 50+ messages to one partner in a day.' },
    exp: 200,
    icon: Heart,
    hidden: true
  },
  {
    id: 'truth_seeker',
    title: { zh: '真相探求者', en: 'Truth Seeker' },
    desc: { zh: '收集齐 4 位伙伴的专属信物。', en: 'Collect all 4 partner artifacts.' },
    exp: 1000,
    icon: Eye
  }
];