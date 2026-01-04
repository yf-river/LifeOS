'use client';

import { useAuthStore } from '@/store';
import { MainLayout } from '@/components/layout/MainLayout';
import { LoginForm } from '@/components/auth/LoginForm';

export default function Home() {
  const { token } = useAuthStore();

  // 未登录显示登录表单
  if (!token) {
    return <LoginForm />;
  }

  // 已登录显示主布局
  return <MainLayout />;
}
