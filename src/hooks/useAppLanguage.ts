import { useState, useEffect } from 'react';
import { en, zh } from '@/lib/i18n/dictionaries'; // 确保你有这个字典文件，或者你可以暂时用空对象代替

export type Language = 'zh' | 'en';

export function useAppLanguage() {
  // 1. 默认状态：先给个默认值，避免服务端渲染不匹配
  const [lang, setLang] = useState<Language>('zh');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // 2. 核心原则：用户设置 > 浏览器系统语言 > 默认中文
    const determineLanguage = (): Language => {
      // A. 检查本地存储 (用户手动设置过)
      const savedLang = localStorage.getItem('app_lang');
      if (savedLang === 'en' || savedLang === 'zh') {
        return savedLang;
      }

      // B. 检查浏览器系统语言
      if (typeof navigator !== 'undefined') {
        const sysLang = navigator.language.toLowerCase();
        if (sysLang.startsWith('en')) {
          return 'en';
        }
      }

      // C. 默认回退
      return 'zh';
    };

    const finalLang = determineLanguage();
    setLang(finalLang);
    setIsLoaded(true);
  }, []);

  // 3. 切换语言方法 (暴露给设置页用)
  const switchLanguage = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem('app_lang', newLang);
    // 可选：刷新页面以确保所有组件更新
    // window.location.reload(); 
  };

  // 4. 返回对应的字典 (t)
  const t = lang === 'zh' ? zh : en;

  return { lang, t, switchLanguage, isLoaded };
}