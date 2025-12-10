// app/page.tsx (v2.9 新入口)
import { redirect } from 'next/navigation';

export default function Home() {
  // 用户一进来，直接跳到“共鸣”页面
  // 那里将展示你原来的 Lobby 内容
  redirect('/resonance');
}

