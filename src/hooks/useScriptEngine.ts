// src/hooks/useScriptEngine.ts
import { useState, useCallback } from 'react';
import { ScriptMetadata, ScriptScene, GameState } from '@/types/script';
import { LootItem, LangType } from '@/types/index';
import { DEMO_SCENES, DEMO_ITEMS, DEMO_SCRIPT_META } from '@/data/demo-script';

export function useScriptEngine(lang: LangType = 'zh') {
  const [meta] = useState<ScriptMetadata>(DEMO_SCRIPT_META);
  
  // 游戏核心状态
  const [gameState, setGameState] = useState<GameState>({
    currentSceneId: 'start',
    history: [],
    inventory: [],
    flags: {},
    isGameOver: false
  });

  const [isLoading, setIsLoading] = useState(false);

  // 获取当前场景对象
  const currentScene = DEMO_SCENES[gameState.currentSceneId];

  // 核心：发送消息给 LLM
  const sendAction = useCallback(async (userContent: string, hiddenCommand?: string) => {
    if (isLoading) return;
    setIsLoading(true);

    // 1. 构建显示在 UI 上的消息
    const displayMsg = { role: 'user' as const, content: userContent };
    
    // 2. 构建发送给 AI 的隐藏 Prompt (Context Injection)
    // 这里是关键！我们把当前场景信息注入给 AI，用户看不到
    const sceneDesc = lang === 'zh' ? currentScene.description.zh : currentScene.description.en;
    const systemInjection = `
    [SYSTEM STATUS]
    - Current Location: ${currentScene.name.en}
    - Scene Description: "${sceneDesc}"
    - Player Inventory: ${gameState.inventory.map(i => i.name.en).join(', ') || 'Empty'}
    - Hidden Items Here: ${currentScene.hiddenLoot?.join(', ') || 'None'}
    
    [INSTRUCTION]
    You are the DM. React to user's action: "${hiddenCommand || userContent}". 
    If user finds an item, wrap it in {{icon:ITEM_ID}}.
    Do not repeat the scene description unless asked.
    `;

    const newHistory = [...gameState.history, displayMsg];
    setGameState(prev => ({ ...prev, history: newHistory }));

    try {
      // 3. 复用你现有的 API
      // 注意：这里我们借用 'System' 或 'Ash' 作为 DM 的身份
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: systemInjection, // 发送注入后的文本
          history: newHistory.slice(-10), // 只带最近的历史
          partnerId: 'system', // 使用 System 身份
          // 这里可以传 envInfo 等，保持和你原有的 page.tsx 一致
        })
      });

      const data = await response.json();
      
      // 4. 处理回复
      const aiMsg = { role: 'assistant' as const, content: data.reply };
      
      // 5. 检查是否触发了物品获取 (解析 {{icon:xxx}})
      const lootMatch = data.reply.match(/{{icon:([^}]+)}}/);
      let newInventory = [...gameState.inventory];
      
      if (lootMatch) {
        const itemId = lootMatch[1];
        if (DEMO_ITEMS[itemId] && !newInventory.find(i => i.id === itemId)) {
           newInventory.push(DEMO_ITEMS[itemId]);
        }
      }

      setGameState(prev => ({
        ...prev,
        history: [...newHistory, aiMsg],
        inventory: newInventory
      }));

    } catch (e) {
      console.error("Script Engine Error:", e);
      setGameState(prev => ({ 
        ...prev, 
        history: [...prev.history, { role: 'assistant', content: lang === 'zh' ? '[连接中断] DM 掉线了...' : '[Connection Lost]' }] 
      }));
    } finally {
      setIsLoading(false);
    }
  }, [gameState, currentScene, lang, isLoading]);

  // 场景切换函数
  const transitionTo = (sceneId: string) => {
    if (DEMO_SCENES[sceneId]) {
      setGameState(prev => ({
        ...prev,
        currentSceneId: sceneId,
        history: [...prev.history, { 
            role: 'system', 
            content: lang === 'zh' ? `>>> 进入场景：${DEMO_SCENES[sceneId].name.zh}` : `>>> Enter Scene: ${DEMO_SCENES[sceneId].name.en}` 
        }]
      }));
    }
  };

  return {
    meta,
    gameState,
    currentScene,
    isLoading,
    sendAction,
    transitionTo
  };
}