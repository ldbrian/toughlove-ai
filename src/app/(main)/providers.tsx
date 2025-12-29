'use client';

import posthog from 'posthog-js';
import { PostHogProvider } from 'posthog-js/react';
import { useEffect } from 'react';
import { ContentProvider } from '@/contexts/ContentContext'; // ✅ 引入 ContentProvider

// 1. 内部组件：负责初始化 PostHog
function CSPostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
        capture_pageview: false, 
        persistence: 'localStorage',
      });
    }
  }, []);

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}

// 2. ✅ 导出主组件：Providers
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CSPostHogProvider>
      {/* 🔥 关键修复：包裹 ContentProvider */}
      <ContentProvider>
        {children}
      </ContentProvider>
    </CSPostHogProvider>
  );
}