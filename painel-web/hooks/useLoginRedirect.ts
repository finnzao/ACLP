import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export function useLoginRedirect() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated && !hasRedirected.current) {
      console.log('[useLoginRedirect] Redirecionando usuário autenticado para dashboard');
      hasRedirected.current = true;
      
      router.replace('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  return { isAuthenticated, isLoading };
}