import { prisma } from '@/lib/prisma';
import { DailyQuestion, QuestionType } from '@prisma/client';

export async function getDailyQuestion(userId: string): Promise<DailyQuestion | null> {
  // 1. 优先策略：查找过去 24 小时内生成的 STRONG_CONTEXT 题目
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  const freshQuestion = await prisma.dailyQuestion.findFirst({
    where: {
      // 假设 Prisma Schema 里 type 是 enum，则直接用字符串匹配
      // 如果报错类型不匹配，请检查 schema 是否使用了 enum QuestionType
      type: 'STRONG_CONTEXT', 
      
      // 🔥 修复点 1: created_at -> createdAt
      createdAt: {
        gte: twentyFourHoursAgo
      }
    },
    orderBy: {
      // 🔥 修复点 2: created_at -> createdAt
      createdAt: 'desc' 
    },
    include: {
      options: true
    }
  });

  if (freshQuestion) {
      return freshQuestion;
  }

  // 2. 兜底策略：如果没有生成，回退到原来的随机逻辑
  const candidates = await prisma.dailyQuestion.findMany({
    where: {
      // 排除掉那些强时效性的题目，只在通用库里捞
      type: { not: 'STRONG_CONTEXT' } 
    },
    include: {
      options: true
    }
  });

  if (candidates.length === 0) return null;

  const totalWeight = candidates.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const q of candidates) {
    if (random < q.weight) {
      return q;
    }
    random -= q.weight;
  }
  
  return candidates[0];
}

export async function submitCalibration(userId: string, questionId: string, answerValue: string) {
  return await prisma.userCalibration.create({
    data: {
      userId,
      questionId,
      answer: answerValue
    }
  });
}