'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log('Home page - isAuthenticated:', isAuthenticated, 'isLoading:', isLoading);
    
    if (!isLoading) {
      if (isAuthenticated) {
        console.log('User is authenticated, redirecting to dashboard');
        router.push('/dashboard');
      } else {
        console.log('User is not authenticated, redirecting to login');
        router.push('/login');
      }
    }
  }, [isAuthenticated, isLoading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-primary">Carregando...</p>
      </div>
    </div>
  );
}