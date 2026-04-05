'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-client';
import { AuthProvider } from '@/contexts/auth-context';
import { ContestProvider } from '@/contexts/contest-context';
import type { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ContestProvider>
          {children}
        </ContestProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
