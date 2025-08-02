'use client';

import { useState, useEffect } from 'react';
import { FaUser, FaLock, FaChevronRight } from 'react-icons/fa';
import { Crown, User, Eye, EyeOff, AlertCircle } from 'lucide-react';
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
  const [showDemoAccounts, setShowDemoAccounts] = useState(false);
  
  const router = useRouter();
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();

  // Redirecionar se já estiver logado
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      console.log('User is authenticated, redirecting to dashboard');
      router.push('/dashboard');
    }
  }, [isAuthenticated, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Preencha todos os campos.');
      return;
    }
    if (!isValidEmail(email)) {
      setError('E-mail ou senha inválidos.');
      return;
    }
  
    setLoading(true);
    setError('');

    try {
      console.log('Submitting login form...');
      const success = await login(email, password);
      
      if (success) {
        console.log('Login successful, redirecting...');
        // Aguardar um momento para o estado ser atualizado
        setTimeout(() => {
          router.push('/dashboard');
        }, 100);
      } else {
        setError('E-mail ou senha inválidos.');
      }
    } catch (error) {
      console.error('Erro no login:', error);
      setError('Erro interno. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const loginWithDemo = async (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
    setLoading(true);

    try {
      const success = await login(demoEmail, demoPassword);
      if (success) {
        console.log('Demo login successful, redirecting...');
        setTimeout(() => {
          router.push('/dashboard');
        }, 100);
        
      } else {
        setError('Erro ao fazer login com conta demo.');
      }
    } catch (error) {
      setError('Erro ao fazer login com conta demo.');
    } 
  };

  // Mostrar loading enquanto verifica autenticação
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-background to-primary-light">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-primary">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-background to-primary-light font-sans px-4">
      <div className="relative w-[400px] min-h-[650px] bg-gradient-to-br from-primary-dark to-primary rounded-xl shadow-2xl overflow-hidden">
        
        {/* Background decorativo */}
        <span className="absolute bg-primary h-[520px] w-[520px] top-[-50px] right-[120px] rounded-tr-[72px] rotate-45"></span>
        <span className="absolute bg-primary-light h-[220px] w-[220px] top-[-172px] right-0 rounded-[32px] rotate-45"></span>
        <span className="absolute bg-accent-blue h-[540px] w-[190px] top-[-24px] right-0 rounded-[32px] rotate-45"></span>
        <span className="absolute bg-primary h-[400px] w-[200px] top-[420px] right-[50px] rounded-[60px] rotate-45"></span>

        <div className="relative z-10 h-full flex flex-col justify-center items-center px-6 py-8">
          {/* Header */}
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

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="w-full space-y-6">
            {/* Mensagem de erro */}
            {error && (
              <div className="bg-red-500 text-white px-4 py-3 text-sm rounded flex items-center gap-2 shadow">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}

            {/* Campo de e-mail */}
            <div className="relative">
              <FaUser className="absolute top-3 left-3 text-primary-light" />
              <input
                type="text"
                placeholder="E-mail do usuário"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="w-full pl-10 pr-4 py-3 text-white bg-primary-dark/30 border-b-2 border-primary-light placeholder:text-white/70 font-semibold focus:outline-none focus:border-white transition disabled:opacity-50"
              />
            </div>

            {/* Campo de senha */}
            <div className="relative">
              <FaLock className="absolute top-3 left-3 text-primary-light" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="w-full pl-10 pr-12 py-3 text-white bg-primary-dark/30 border-b-2 border-primary-light placeholder:text-white/70 font-semibold focus:outline-none focus:border-white transition disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-white/70 hover:text-white transition-colors"
                disabled={loading}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Botão de login */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-background-deep text-primary-dark font-bold py-3 px-4 rounded-full flex justify-between items-center shadow-md hover:bg-background transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="uppercase text-sm tracking-wide">
                {loading ? 'Entrando...' : 'Login'}
              </span>
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              ) : (
                <FaChevronRight className="text-primary" />
              )}
            </button>
          </form>

          {/* Contas de demonstração */}
          <div className="mt-8 w-full">
            <button
              onClick={() => setShowDemoAccounts(!showDemoAccounts)}
              className="w-full text-white/80 text-sm underline hover:text-white transition-colors"
            >
              {showDemoAccounts ? 'Ocultar' : 'Mostrar'} contas de demonstração
            </button>

            {showDemoAccounts && (
              <div className="mt-4 space-y-3">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <h4 className="text-white font-medium mb-3 text-sm">Contas de Teste:</h4>
                  
                  {/* Conta Admin */}
                  <button
                    onClick={() => loginWithDemo('admin@tjba.com.br', '123')}
                    disabled={loading}
                    className="w-full bg-yellow-500/20 border border-yellow-300/30 text-white p-3 rounded-lg hover:bg-yellow-500/30 transition-colors mb-2 disabled:opacity-50"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Crown className="w-4 h-4 text-yellow-300" />
                        <div className="text-left">
                          <p className="font-medium text-sm">Administrador</p>
                          <p className="text-xs text-white/80">admin@tjba.com.br</p>
                        </div>
                      </div>
                      <div className="text-xs text-white/60">
                        Acesso completo
                      </div>
                    </div>
                  </button>

                  {/* Conta Usuário */}
                  <button
                    onClick={() => loginWithDemo('usuario@tjba.com.br', '123')}
                    disabled={loading}
                    className="w-full bg-blue-500/20 border border-blue-300/30 text-white p-3 rounded-lg hover:bg-blue-500/30 transition-colors disabled:opacity-50"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-blue-300" />
                        <div className="text-left">
                          <p className="font-medium text-sm">Usuário Comum</p>
                          <p className="text-xs text-white/80">usuario@tjba.com.br</p>
                        </div>
                      </div>
                      <div className="text-xs text-white/60">
                        Acesso limitado
                      </div>
                    </div>
                  </button>
                </div>

                <div className="bg-white/5 rounded-lg p-3">
                  <h5 className="text-white/80 text-xs font-medium mb-2">Diferenças de Acesso:</h5>
                  <div className="text-xs text-white/70 space-y-1">
                    <div className="flex items-center gap-2">
                      <Crown className="w-3 h-3 text-yellow-400" />
                      <span>Admin: Pode cadastrar pessoas e configurar sistema</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="w-3 h-3 text-blue-400" />
                      <span>Usuário: Apenas consulta e registro de comparecimentos</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Informações de segurança */}
          <div className="mt-6 text-center">
            <p className="text-white/60 text-xs">
              Sistema protegido por controle de acesso baseado em perfis
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}