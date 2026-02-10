'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

/**
 * Página legada /ativar-conta
 * O fluxo simplificado usa /invite/[token] agora.
 * Esta página redireciona para /login já que não possui token na URL.
 */
export default function AtivarContaRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/login');
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <Loader2 className="w-16 h-16 animate-spin text-primary mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-800">Redirecionando...</h2>
        <p className="text-gray-600 mt-2">Você será redirecionado para a página de login</p>
      </div>
    </div>
  );
}