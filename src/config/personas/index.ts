// src/config/personas/index.ts

// 1. 引入宪法 (类型定义)
import { PersonaConfig } from '@/types'; 

// 2. 引入各个角色的配置文件
import { ASH_CONFIG } from './ash';
import { RIN_CONFIG } from './rin';
import { VEE_CONFIG } from './vee';
// 如果有 sol.ts 和 echo.ts 也要在这里引入
// import { SOL_CONFIG } from './sol';
// import { ECHO_CONFIG } from './echo';

// 3. 导出汇总注册表
export const PERSONAS_REGISTRY: Record<string, PersonaConfig> = {
    ash: ASH_CONFIG,
    rin: RIN_CONFIG,
    vee: VEE_CONFIG,
    // sol: SOL_CONFIG,
    // echo: ECHO_CONFIG,
};