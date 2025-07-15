'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function RedirectHandler() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log('RedirectHandler - isAuthenticated:', isAuthenticated, 'isLoading:', isLoading);
    
    if (!isLoading && isAuthenticated) {
      console.log('Redirecting to dashboard...');
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-primary">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  return null;
}