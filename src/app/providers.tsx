import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { Analytics } from '@vercel/analytics/react';

export function AppProvider() {
  const { checkAuth } = useAuthStore();
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60, // 1 minute
      },
    },
  }));

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // children is ignored here because RouterProvider renders the tree
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Analytics />
    </QueryClientProvider>
  );
}
