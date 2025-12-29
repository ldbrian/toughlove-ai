import { getDailyQuestion } from '@/lib/service/calibration';
import { getHeroFeed } from '@/lib/service/hero';
import HomeClient, { FeedItem } from '@/components/home/HomeClient';

// 强制动态渲染，确保每次请求都获取最新数据库内容
export const revalidate = 60;

export default async function Home() {
  // 1. 并行获取数据库数据
  // "user-placeholder-id" 是占位符，后续接 Auth 时替换为真实 session.user.id
  const [heroItems, dailyQuestion] = await Promise.all([
    getHeroFeed(),
    getDailyQuestion("user-placeholder-id") 
  ]);

  // 2. 数据映射 (Data Mapping): Prisma Model -> UI Component Props
  const formattedFeed: FeedItem[] = heroItems.map(item => {
    // ⚠️ 使用 (item as any) 绕过 TS 类型检查，因为 Prisma Client 类型可能还没更新
    const rawItem = item as any;
    const visual = rawItem.visualConfig as any || {};
    
    // 获取人格名称
    const personaName = rawItem.personaName || undefined;

    // 设定默认值
    let uiType: FeedItem['type'] = 'editorial';
    let label = 'SYSTEM';
    let color = 'text-cyan-400';
    
    // 🔥 核心修改：默认按钮文案改为“双语对象”，而非纯字符串
    // 这样当数据库没有 actionLabel 时，前端也能正确切换语言
    let defaultAction: any = { en: 'VIEW', zh: '查看' }; 
    let defaultLink = `/feed/${item.id}`;

    switch(item.type) {
        case 'TABLOID': 
            uiType = 'news'; 
            label = 'GLITCH'; 
            color = 'text-pink-400';
            defaultAction = { en: 'DECODE', zh: '解码' }; // 🔥 双语
            break;
        case 'SOCIAL':
            uiType = 'social_proof';
            label = 'COMMUNITY';
            color = 'text-orange-400';
            defaultAction = { en: 'JOIN', zh: '加入' }; // 🔥 双语
            break;
        case 'EDITORIAL':
        default:
            uiType = 'editorial';
            // 动态 Label (系统标签通常保留英文风格，也可以改成双语)
            label = personaName ? `${personaName.toUpperCase()}'S LOGIC` : "ASH'S LOGIC";
            color = 'text-cyan-400';
            defaultAction = { en: 'READ', zh: '阅读' }; // 🔥 双语
            break;
    }

    // 构建最终对象
    return {
        id: item.id,
        type: uiType,
        // 图片：优先用数据库配置的，没有则用默认头像
        bgImage: visual.bgImage || '/avatars/ash_hero.jpg',
        label: label,
        
        // 🔥 直接透传数据库里的 JSON 对象 (Prisma 会自动解析为对象)
        title: item.title,
        content: item.content,
        
        // 优先使用数据库的 actionLabel，如果没有则使用上面的双语默认值
        action: rawItem.actionLabel || defaultAction,
        link: rawItem.actionLink || defaultLink,
        
        // 颜色：优先用数据库配置的，没有则用默认色
        color: visual.primaryColor ? `text-[${visual.primaryColor}]` : color,
        
        personaName: personaName, 
        comments: rawItem.comments || []
    };
  });

  // 3. 渲染客户端组件
  return (
    <HomeClient 
        initialFeed={formattedFeed} 
        dailyQuestion={dailyQuestion} 
    />
  );
}