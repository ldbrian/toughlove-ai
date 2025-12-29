// src/config/artifacts.ts
import { Mail, Stethoscope, CloudRain, Dumbbell, Gamepad2, Disc } from 'lucide-react';

export interface Artifact {
  id: string;
  name: { zh: string; en: string };
  desc: { zh: string; en: string };
  icon: any; 
  ownerId?: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'special';
}

export const ARTIFACTS_DB: Artifact[] = [
  {
    id: 'future_letter',
    name: { zh: '来自未来的信', en: 'Letter from Future' },
    desc: { 
      zh: '“如果你能看到这行字，说明一切还来得及。不要相信那个系统，相信你的直觉。”—— 信纸已经泛黄，边缘有烧焦的痕迹。', 
      en: '"If you are reading this, there is still time. Trust your gut, not the System." -- The paper is burnt at the edges.' 
    },
    icon: Mail,
    rarity: 'special'
  },
  {
    id: 'ash_scalpel',
    name: { zh: '生锈的手术刀', en: 'Rusted Scalpel' },
    desc: { 
      zh: 'Ash 以前是拿它救人的。现在？他只用它来切断那些“毫无价值”的连接。', 
      en: 'Ash used to save lives with this. Now? He only uses it to sever "inefficient" connections.' 
    },
    icon: Stethoscope,
    ownerId: 'ash',
    rarity: 'epic'
  },
  {
    id: 'rin_doll',
    name: { zh: '湿透的晴天娃娃', en: 'Soaked Teru-teru' },
    desc: { 
      zh: 'Rin 把它挂在窗边试图祈祷雨停。但这城市的雨是酸性的，娃娃早就腐烂了。', 
      en: 'Rin hung it up to stop the rain. But the acid rain rotted it away long ago.' 
    },
    icon: CloudRain,
    ownerId: 'rin',
    rarity: 'rare'
  },
  {
    id: 'sol_dumbbell',
    name: { zh: '重力环哑铃', en: 'Gravity Dumbbell' },
    desc: { 
      zh: '来自旧时代的健身器材。上面刻着 Sol 的座右铭：“痛楚就是软弱正在离开身体”。', 
      en: 'An artifact from the old world. Engraved with: "Pain is weakness leaving the body."' 
    },
    icon: Dumbbell,
    ownerId: 'sol',
    rarity: 'rare'
  },
  {
    id: 'vee_console',
    name: { zh: '越狱掌机', en: 'Jailbroken Console' },
    desc: { 
      zh: 'Vee 把它改造成了黑客终端。屏幕上永远闪烁着“插入卡带以开始革命”。', 
      en: 'Vee turned it into a hacking deck. Screen flashes: "INSERT CARTRIDGE TO START REVOLUTION".' 
    },
    icon: Gamepad2,
    ownerId: 'vee',
    rarity: 'epic'
  }
];