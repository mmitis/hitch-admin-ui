'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Sidebar } from '@/components/layout/sidebar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { apiKey } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Wait one tick for localStorage hydration before redirecting
    const timer = setTimeout(() => {
      if (!localStorage.getItem('hitch_api_key')) {
        router.replace('/login');
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [apiKey, router]);

  return (
    <div className="flex h-screen bg-zinc-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
}
