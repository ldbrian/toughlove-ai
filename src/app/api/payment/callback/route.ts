// src/app/api/payment/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { processPaymentCallback } from '@/lib/payment-service';

export const runtime = 'nodejs'; // ⚠️ 必须使用 nodejs runtime，因为 pg 库不支持 edge runtime

export async function POST(req: NextRequest) {
  try {
    // 获取原始文本 body (用于验签) 和 JSON
    const rawBody = await req.text();
    let jsonBody;
    try {
        jsonBody = JSON.parse(rawBody);
    } catch {
        jsonBody = {};
    }
    
    // 调用业务逻辑
    const result = await processPaymentCallback(req.headers, rawBody, jsonBody);

    return new NextResponse(result.body, { status: result.status });

  } catch (error) {
    console.error('API Route Error:', error);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}