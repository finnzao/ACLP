'use client';

import { useState, useEffect } from 'react';
import { FaUser, FaLock, FaChevronRight } from 'react-icons/fa';
import { Crown, User, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { isValidEmail } from '@/lib/utils/formatting';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  const router = useRouter();
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      console.log('[LoginPage] Usuário já autenticado, redirecionando imediatamente...');
      router.replace('/dashboard');
    }
  }, [isAuthenticated, authLoading, router]);

  const validateForm = (): boolean => {
    if (!email.trim()) {
      setError('Digite seu e-mail');
      return false;
    }

    if (!isValidEmail(email)) {
      setError('E-mail inválido');
      return false;
    }

    if (!password) {
      setError('Digite sua senha');
      return false;
    }

    if (password.length < 3) {
      setError('Senha muito curta');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
  
    setLoading(true);
    setError('');

    try {
      console.log('[LoginPage] Tentando login...');
      const success = await login(email, password);
      
      if (success) {
        console.log('[LoginPage] Login bem-sucedido!');
        
        await new Promise(resolve => setTimeout(resolve, 100));
        
        console.log('[LoginPage] Redirecionando para dashboard...');
        window.location.href = '/dashboard';
      } else {
        setError('E-mail ou senha inválidos. Verifique suas credenciais.');
        setLoading(false);
      }
    } catch (error) {
      console.error('[LoginPage] Erro no login:', error);
      setError('Erro ao conectar com o servidor. Tente novamente.');
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-background to-primary-light">
        <div className="text-center">
          <Loader2 className="animate-spin h-16 w-16 text-primary mx-auto mb-4" />
          <p className="text-primary font-medium">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-background to-primary-light">
        <div className="text-center">
          <Loader2 className="animate-spin h-16 w-16 text-primary mx-auto mb-4" />
          <p className="text-primary font-medium">Redirecionando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-background to-primary-light font-sans px-4">
      <div className="relative w-[400px] min-h-[700px] bg-gradient-to-br from-primary-dark to-primary rounded-xl shadow-2xl overflow-hidden">
        
        <span className="absolute bg-primary h-[520px] w-[520px] top-[-50px] right-[120px] rounded-tr-[72px] rotate-45"></span>
        <span className="absolute bg-primary-light h-[220px] w-[220px] top-[-172px] right-0 rounded-[32px] rotate-45"></span>
        <span className="absolute bg-accent-blue h-[540px] w-[190px] top-[-24px] right-0 rounded-[32px] rotate-45"></span>
        <span className="absolute bg-primary h-[400px] w-[200px] top-[420px] right-[50px] rounded-[60px] rotate-45"></span>

        <div className="relative z-10 h-full flex flex-col justify-center items-center px-6 py-8">
          <div className="text-center mb-6">
            <h1 className="text-white text-2xl font-bold drop-shadow-sm">SCC</h1>
            <h3 className="text-white text-sm opacity-80 font-medium">Sistema de Controle de Comparecimento</h3>
            <div className="mt-3 flex justify-center">
              <Image
                src="/img/logo_poderJudiciariodaBahia_transparente.png"
                alt="Logo"
                width={70}
                height={70}
                className="object-contain"
              />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="w-full space-y-6">
            {error && (
              <div className="bg-red-500 text-white px-4 py-3 text-sm rounded flex items-center gap-2 shadow animate-in slide-in-from-top-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="relative">
              <FaUser className="absolute top-3 left-3 text-primary-light" />
              <input
                type="email"
                placeholder="E-mail institucional"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                disabled={loading}
                className="w-full pl-10 pr-4 py-3 text-white bg-primary-dark/30 border-b-2 border-primary-light placeholder:text-white/70 font-semibold focus:outline-none focus:border-white transition disabled:opacity-50"
                autoComplete="email"
              />
            </div>

            <div className="relative">
              <FaLock className="absolute top-3 left-3 text-primary-light" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Senha"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                disabled={loading}
                className="w-full pl-10 pr-12 py-3 text-white bg-primary-dark/30 border-b-2 border-primary-light placeholder:text-white/70 font-semibold focus:outline-none focus:border-white transition disabled:opacity-50"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-white/70 hover:text-white transition-colors"
                disabled={loading}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-white/80 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={loading}
                  className="w-4 h-4 rounded border-white/30 bg-white/10 text-primary focus:ring-primary focus:ring-offset-0"
                />
                <span>Lembrar-me</span>
              </label>

              <button
                type="button"
                onClick={() => {
                  alert('Funcionalidade em desenvolvimento');
                }}
                className="text-white/80 text-sm hover:text-white transition-colors"
                disabled={loading}
              >
                Esqueci a senha
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-background-deep text-primary-dark font-bold py-3 px-4 rounded-full flex justify-between items-center shadow-md hover:bg-background transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="uppercase text-sm tracking-wide">
                {loading ? 'Entrando...' : 'Entrar'}
              </span>
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FaChevronRight className="text-primary" />
              )}
            </button>
          </form>

          <div className="mt-8 w-full">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <h4 className="text-white font-medium mb-2 text-sm">Acesso ao Sistema</h4>
              <ul className="text-xs text-white/80 space-y-1">
                <li className="flex items-center gap-2">
                  <Crown className="w-3 h-3 text-yellow-300" />
                  <span>Administradores: Acesso completo</span>
                </li>
                <li className="flex items-center gap-2">
                  <User className="w-3 h-3 text-blue-300" />
                  <span>Usuários: Registro de comparecimentos</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-white/60 text-xs">
              Sistema protegido por autenticação JWT
            </p>
            <p className="text-white/40 text-xs mt-1">
              Versão 2.0.0 - {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}