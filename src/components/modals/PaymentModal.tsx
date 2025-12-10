import React, { useState, useEffect } from 'react';

const PaymentModal = () => {
  const [status, setStatus] = useState('idle'); // idle, processing, ash_intervene, success, limit_reached
  const [showAshDialog, setShowAshDialog] = useState(false);

  // 检查本地是否有“已帮付”的记录
  useEffect(() => {
    const hasUsed = localStorage.getItem('ash_one_time_gift');
    if (hasUsed) {
      // 如果需要，可以在这里初始化某些状态，或者等到点击时再判断
    }
  }, []);

  const handlePayClick = () => {
    // 1. 检查是否已经用过机会
    const hasUsed = localStorage.getItem('ash_one_time_gift');

    if (hasUsed) {
      setStatus('limit_reached');
      return;
    }

    // 2. 开始模拟支付流程
    setStatus('processing');

    // 3. 模拟网络延迟 (1.5秒后 Ash 介入)
    setTimeout(() => {
      setStatus('ash_intervene');
      setShowAshDialog(true);
      
      // 4. Ash 介入动画结束后，显示成功 (再过 2秒)
      setTimeout(() => {
        completePayment();
      }, 2500);
      
    }, 1500);
  };

  const completePayment = () => {
    localStorage.setItem('ash_one_time_gift', 'true'); // 写入本地标记
    setShowAshDialog(false);
    setStatus('success');
    // 这里触发你的回调，比如 unlockFeature()
    console.log("功能已解锁");
  };

  return (
    <div className="p-6 bg-gray-900 text-white rounded-xl border border-gray-700 max-w-md mx-auto mt-10 shadow-2xl">
      
      {/* 标题区域 */}
      <h2 className="text-xl font-bold mb-4 text-cyan-400">
        解锁高级功能
      </h2>
      <p className="text-gray-400 mb-6 text-sm">
        需要支付 <span className="text-white font-bold text-lg">¥9.90</span> 以继续使用。
      </p>

      {/* 核心按钮区域 */}
      <div className="relative">
        
        {/* 状态：普通/处理中 */}
        {(status === 'idle' || status === 'processing') && (
          <button 
            onClick={handlePayClick}
            disabled={status === 'processing'}
            className={`w-full py-3 rounded-lg font-bold transition-all duration-300 
              ${status === 'processing' ? 'bg-gray-600 cursor-not-allowed' : 'bg-cyan-600 hover:bg-cyan-500 hover:shadow-lg hover:shadow-cyan-500/20'}`}
          >
            {status === 'processing' ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                正在连接支付网关...
              </span>
            ) : (
              '立即支付 ¥9.90'
            )}
          </button>
        )}

        {/* 状态：Ash 介入 (彩蛋层) */}
        {status === 'ash_intervene' && (
          <div className="absolute inset-0 z-10">
            <div className="bg-black/90 absolute inset-0 rounded-lg backdrop-blur-sm flex items-center justify-center p-4 border border-pink-500/50">
              <div className="text-center animate-bounce-short">
                {/* Ash 的头像或图标 */}
                <div className="w-12 h-12 bg-pink-600 rounded-full mx-auto mb-2 flex items-center justify-center text-xl font-bold shadow-[0_0_15px_rgba(219,39,119,0.6)]">
                  Ash
                </div>
                {/* Ash 的台词 */}
                <p className="text-pink-300 font-medium italic typing-effect">
                  “啧，真麻烦... 这次算我的。<br/>下不为例哦。”
                </p>
                <div className="mt-2 text-xs text-gray-500">
                  * Ash 正在代付订单... *
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 状态：支付成功 */}
        {status === 'success' && (
          <button className="w-full py-3 bg-green-600 text-white rounded-lg font-bold cursor-default flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
            解锁成功 (Ash已买单)
          </button>
        )}

        {/* 状态：次数用尽 (第二次点击) */}
        {status === 'limit_reached' && (
          <div className="w-full py-3 bg-gray-800 border border-gray-600 text-gray-400 rounded-lg text-center text-sm px-4">
             🚧 支付系统升级中 (等营业执照ing)... <br/>
             Ash: "我的私房钱也花光了！"
          </div>
        )}

      </div>
    </div>
  );
};

export default PaymentModal;