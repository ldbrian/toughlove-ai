import { createClient } from '@/utils/supabase/server'; // 注意这里引用的是 server
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  // 1. 初始化服务端 Supabase 客户端
  const supabase = await createClient();
  
  // 2. 获取请求体
  const { code } = await request.json();

  // 3. 验证用户鉴权 (User Auth)
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized: 请先登录' }, { status: 401 });
  }

  // 4. 查询兑换码 (Check Code)
  const { data: codeData, error: fetchError } = await supabase
    .from('redemption_codes')
    .select('*')
    .eq('code', code)
    .single();

  if (fetchError || !codeData) {
    return NextResponse.json({ error: '无效的兑换码' }, { status: 400 });
  }

  if (codeData.is_used) {
    return NextResponse.json({ error: '该兑换码已被使用' }, { status: 400 });
  }

  // 5. 执行核销 (Redeem Logic)
  // 这里我们调用一个 RPC 函数来保证“标记使用”和“增加余额”是原子操作
  // 避免出现“码用了但钱没到账”的情况
  const { data: rpcData, error: rpcError } = await supabase.rpc('redeem_code_transaction', {
    code_input: code,
    user_id_input: user.id
  });

  if (rpcError) {
    console.error('Redeem Error:', rpcError);
    // 这里可以细化错误，比如根据 rpcError.message 返回 "已被抢先使用"
    return NextResponse.json({ error: '兑换失败，请稍后重试' }, { status: 500 });
  }

  return NextResponse.json({ 
    success: true, 
    message: `兑换成功！`,
    reward: rpcData // 返回 RPC 函数吐出的奖励信息
  });
}