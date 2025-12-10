'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client'; // 确保这里引用的是新版工具
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

// ------------------------------------------------------------------
// 1. 类型定义
// ------------------------------------------------------------------

// 用户档案
export interface UserProfile {
  id: string;
  email: string | null;
  nickname: string | null;
  avatar_url: string | null;
  rin_coins: number;
  current_persona: string;
  bio?: string;
  created_at?: string;
}

// ✨ 新增：塔罗牌定义
export interface TarotCard {
  id: number | string;
  name: string;        // 牌名，如 "The Fool"
  name_cn: string;     // 中文名，如 "愚者"
  image_url: string;   // 图片路径 /tarot/0_fool.png
  meaning_up: string;  // 正位含义
  meaning_rev: string; // 逆位含义
  description?: string;
}

interface ContentContextType {
  // 用户状态
  user: User | null;
  profile: UserProfile | null;
  
  // ✨ 新增：资源状态
  tarotDeck: TarotCard[]; 
  
  // 全局状态
  isLoading: boolean;
  isAuthenticated: boolean;
  
  // 动作方法
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const ContentContext = createContext<ContentContextType | undefined>(undefined);

// ------------------------------------------------------------------
// 2. Provider 组件
// ------------------------------------------------------------------

export function ContentProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [tarotDeck, setTarotDeck] = useState<TarotCard[]>([]); // ✨ 初始化为空数组
  const [isLoading, setIsLoading] = useState(true);
  
  const supabase = createClient();
  const router = useRouter();

  // 获取用户资料
  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) console.error('Error fetching profile:', error);
      else setProfile(data as UserProfile);
    } catch (error) {
      console.error('Unexpected error fetching profile:', error);
    }
  }, [supabase]);

  // ✨ 新增：获取塔罗牌数据
  // (假设你存在数据库里，或者是一个静态 JSON)
  const fetchTarotDeck = useCallback(async () => {
    try {
      // 方案 A: 如果塔罗牌数据在 Supabase 表里
      const { data, error } = await supabase
        .from('tarot_cards') // 你的表名可能不一样
        .select('*')
        .order('id', { ascending: true });

      if (error) {
        console.warn('Could not fetch tarot deck from DB, utilizing empty deck or fallback.');
        // 如果表还没建好，暂时保持空数组，或者加载本地 JSON
      } else {
        setTarotDeck(data as TarotCard[]);
      }
    } catch (error) {
      console.error('Error fetching tarot deck:', error);
    }
  }, [supabase]);

  // 初始化逻辑
  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      
      // 1. 并行加载：Session 和 塔罗牌数据(如果是公共资源)
      const sessionPromise = supabase.auth.getSession();
      const tarotPromise = fetchTarotDeck(); // 预加载资源

      const [{ data: { session } }] = await Promise.all([sessionPromise, tarotPromise]);
      
      if (session?.user) {
        setUser(session.user);
        await fetchProfile(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
      }

      setIsLoading(false);
    };

    initialize();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          if (!profile || profile.id !== session.user.id) {
            await fetchProfile(session.user.id);
          }
        } else {
          setUser(null);
          setProfile(null);
        }
        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, router, fetchProfile, fetchTarotDeck, profile]);

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    try {
      setProfile((prev) => prev ? { ...prev, ...updates } : null);
      const { error } = await supabase.from('profiles').update(updates).eq('id', user.id);
      if (error) throw error;
      await refreshProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      await refreshProfile();
    }
  };

  const value = {
    user,
    profile,
    tarotDeck, // ✨ 导出
    isLoading,
    refreshProfile,
    updateProfile,
    isAuthenticated: !!user,
  };

  return (
    <ContentContext.Provider value={value}>
      {children}
    </ContentContext.Provider>
  );
}

export const useContent = () => {
  const context = useContext(ContentContext);
  if (context === undefined) {
    throw new Error('useContent must be used within a ContentProvider');
  }
  return context;
};