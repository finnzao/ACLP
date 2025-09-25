'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Lock,CheckCircle, XCircle, Loader2, Shield } from 'lucide-react';
import Image from 'next/image';
import { ativacaoService, ValidarTokenResponse } from '@/lib/api/services/ativacao';
import { useToast } from '@/components/Toast';

function AtivarContaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  
  const [token] = useState(searchParams.get('token') || '');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [tokenValido, setTokenValido] = useState(false);
  const [tokenInfo, setTokenInfo] = useState<ValidarTokenResponse['data'] | null>(null);
  
  const [formData, setFormData] = useState({
    senha: '',
    confirmaSenha: '',
    aceitouTermos: false
  });
  
  const [showSenha, setShowSenha] = useState(false);
  const [showConfirmaSenha, setShowConfirmaSenha] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Validar token ao carregar a página
  useEffect(() => {
    validarToken();
  }, [token]);

  const validarToken = async () => {
    if (!token) {
      setTokenValido(false);
      setLoading(false);
      return;
    }

    try {
      const response = await ativacaoService.validarToken(token);
      
      if (response.success && response.data) {
        setTokenValido(true);
        setTokenInfo(response.data);
      } else {
        setTokenValido(false);
        showToast({
          type: 'error',
          title: 'Token Inválido',
          message: response.message || 'O link de ativação é inválido ou expirou',
          duration: 5000
        });
      }
    } catch (error) {
      console.error('Erro ao validar token:', error);
      setTokenValido(false);
      showToast({
        type: 'error',
        title: 'Erro',
        message: 'Erro ao validar o link de ativação',
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  const validarFormulario = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validar senha
    if (!formData.senha) {
      newErrors.senha = 'Senha é obrigatória';
    } else if (formData.senha.length < 8) {
      newErrors.senha = 'A senha deve ter pelo menos 8 caracteres';
    } else if (!/(?=.*[a-z])/.test(formData.senha)) {
      newErrors.senha = 'A senha deve conter pelo menos uma letra minúscula';
    } else if (!/(?=.*[A-Z])/.test(formData.senha)) {
      newErrors.senha = 'A senha deve conter pelo menos uma letra maiúscula';
    } else if (!/(?=.*\d)/.test(formData.senha)) {
      newErrors.senha = 'A senha deve conter pelo menos um número';
    } else if (!/(?=.*[@$!%*?&])/.test(formData.senha)) {
      newErrors.senha = 'A senha deve conter pelo menos um caractere especial (@$!%*?&)';
    }

    // Validar confirmação de senha
    if (!formData.confirmaSenha) {
      newErrors.confirmaSenha = 'Confirmação de senha é obrigatória';
    } else if (formData.senha !== formData.confirmaSenha) {
      newErrors.confirmaSenha = 'As senhas não coincidem';
    }

    // Validar termos
    if (!formData.aceitouTermos) {
      newErrors.termos = 'Você deve aceitar os termos de uso';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validarFormulario()) {
      return;
    }

    setSubmitting(true);
    
    try {
      const response = await ativacaoService.ativarConta({
        token,
        senha: formData.senha,
        confirmaSenha: formData.confirmaSenha,
        aceitouTermos: formData.aceitouTermos
      });

      if (response.success) {
        showToast({
          type: 'success',
          title: 'Conta Ativada!',
          message: 'Sua conta foi ativada com sucesso. Redirecionando para o login...',
          duration: 3000
        });

        // Redirecionar para login após 2 segundos
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        showToast({
          type: 'error',
          title: 'Erro na Ativação',
          message: response.message || 'Não foi possível ativar sua conta',
          duration: 5000
        });
      }
    } catch (error) {
      console.error('Erro ao ativar conta:', error);
      showToast({
        type: 'error',
        title: 'Erro',
        message: 'Ocorreu um erro ao ativar sua conta. Tente novamente.',
        duration: 5000
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Indicador de força da senha
  const calcularForcaSenha = (senha: string): { forca: number; texto: string; cor: string } => {
    let forca = 0;
    
    if (senha.length >= 8) forca++;
    if (senha.length >= 12) forca++;
    if (/[a-z]/.test(senha)) forca++;
    if (/[A-Z]/.test(senha)) forca++;
    if (/\d/.test(senha)) forca++;
    if (/[@$!%*?&]/.test(senha)) forca++;

    const niveis = [
      { min: 0, texto: 'Muito Fraca', cor: 'bg-red-500' },
      { min: 2, texto: 'Fraca', cor: 'bg-orange-500' },
      { min: 4, texto: 'Média', cor: 'bg-yellow-500' },
      { min: 5, texto: 'Forte', cor: 'bg-green-500' },
      { min: 6, texto: 'Muito Forte', cor: 'bg-green-600' }
    ];

    const nivel = niveis.reverse().find(n => forca >= n.min) || niveis[0];
    
    return { forca, texto: nivel.texto, cor: nivel.cor };
  };

  const forcaSenha = calcularForcaSenha(formData.senha);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-background to-primary-light">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto mb-4" />
          <p className="text-lg text-gray-600">Validando link de ativação...</p>
        </div>
      </div>
    );
  }

  // Token inválido
  if (!tokenValido) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-background to-primary-light px-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-10 h-10 text-red-600" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Link Inválido</h2>
          <p className="text-gray-600 mb-6">
            Este link de ativação é inválido ou já expirou. 
            Por favor, solicite um novo convite ao administrador do sistema.
          </p>
          
          <button
            onClick={() => router.push('/login')}
            className="w-full bg-primary text-white py-3 rounded-lg hover:bg-primary-dark transition-all"
          >
            Ir para Login
          </button>
        </div>
      </div>
    );
  }

  // Formulário de ativação
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-background to-primary-light px-4 py-8">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-primary-light rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-10 h-10 text-primary" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Ative sua Conta</h2>
          <p className="text-gray-600">
            Bem-vindo(a), {tokenInfo?.nome}!
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Configure sua senha para acessar o sistema
          </p>
        </div>

        {/* Informações do usuário */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">E-mail:</span>
              <span className="font-medium text-gray-800">{tokenInfo?.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tipo de Conta:</span>
              <span className="font-medium text-gray-800">
                {tokenInfo?.tipo === 'ADMIN' ? 'Administrador' : 'Usuário'}
              </span>
            </div>
            {tokenInfo?.departamento && (
              <div className="flex justify-between">
                <span className="text-gray-600">Departamento:</span>
                <span className="font-medium text-gray-800">{tokenInfo.departamento}</span>
              </div>
            )}
          </div>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Campo de Senha */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nova Senha <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type={showSenha ? "text" : "password"}
                value={formData.senha}
                onChange={(e) => {
                  setFormData({ ...formData, senha: e.target.value });
                  if (errors.senha) setErrors({ ...errors, senha: '' });
                }}
                className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                  errors.senha ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Digite sua senha"
                disabled={submitting}
              />
              <button
                type="button"
                onClick={() => setShowSenha(!showSenha)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                disabled={submitting}
              >
                {showSenha ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.senha && (
              <p className="text-red-500 text-sm mt-1">{errors.senha}</p>
            )}

            {/* Indicador de força da senha */}
            {formData.senha && (
              <div className="mt-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-600">Força da senha:</span>
                  <span className="text-xs font-medium">{forcaSenha.texto}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${forcaSenha.cor}`}
                    style={{ width: `${(forcaSenha.forca / 6) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Campo de Confirmação de Senha */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirmar Senha <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type={showConfirmaSenha ? "text" : "password"}
                value={formData.confirmaSenha}
                onChange={(e) => {
                  setFormData({ ...formData, confirmaSenha: e.target.value });
                  if (errors.confirmaSenha) setErrors({ ...errors, confirmaSenha: '' });
                }}
                className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                  errors.confirmaSenha ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Digite a senha novamente"
                disabled={submitting}
              />
              <button
                type="button"
                onClick={() => setShowConfirmaSenha(!showConfirmaSenha)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                disabled={submitting}
              >
                {showConfirmaSenha ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.confirmaSenha && (
              <p className="text-red-500 text-sm mt-1">{errors.confirmaSenha}</p>
            )}
          </div>

          {/* Requisitos de senha */}
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs font-medium text-gray-700 mb-2">Requisitos da senha:</p>
            <ul className="text-xs text-gray-600 space-y-1">
              <li className={`flex items-center gap-1 ${formData.senha.length >= 8 ? 'text-green-600' : ''}`}>
                {formData.senha.length >= 8 ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                Mínimo de 8 caracteres
              </li>
              <li className={`flex items-center gap-1 ${/[a-z]/.test(formData.senha) ? 'text-green-600' : ''}`}>
                {/[a-z]/.test(formData.senha) ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                Uma letra minúscula
              </li>
              <li className={`flex items-center gap-1 ${/[A-Z]/.test(formData.senha) ? 'text-green-600' : ''}`}>
                {/[A-Z]/.test(formData.senha) ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                Uma letra maiúscula
              </li>
              <li className={`flex items-center gap-1 ${/\d/.test(formData.senha) ? 'text-green-600' : ''}`}>
                {/\d/.test(formData.senha) ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                Um número
              </li>
              <li className={`flex items-center gap-1 ${/[@$!%*?&]/.test(formData.senha) ? 'text-green-600' : ''}`}>
                {/[@$!%*?&]/.test(formData.senha) ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                Um caractere especial (@$!%*?&)
              </li>
            </ul>
          </div>

          {/* Checkbox dos Termos */}
          <div>
            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={formData.aceitouTermos}
                onChange={(e) => {
                  setFormData({ ...formData, aceitouTermos: e.target.checked });
                  if (errors.termos) setErrors({ ...errors, termos: '' });
                }}
                className="mt-1"
                disabled={submitting}
              />
              <span className="text-sm text-gray-600">
                Li e aceito os <a href="/termos" target="_blank" className="text-primary hover:underline">Termos de Uso</a> e 
                a <a href="/privacidade" target="_blank" className="text-primary hover:underline"> Política de Privacidade</a> do sistema
              </span>
            </label>
            {errors.termos && (
              <p className="text-red-500 text-sm mt-1">{errors.termos}</p>
            )}
          </div>

          {/* Botão de Submit */}
          <button
            type="submit"
            disabled={submitting || !formData.aceitouTermos}
            className="w-full bg-primary text-white py-3 rounded-lg hover:bg-primary-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Ativando Conta...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                Ativar Minha Conta
              </>
            )}
          </button>
        </form>

        {/* Link para login */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Já tem uma conta ativa?{' '}
            <button
              onClick={() => router.push('/login')}
              className="text-primary hover:underline font-medium"
              disabled={submitting}
            >
              Faça login
            </button>
          </p>
        </div>

        {/* Logo do TJBA */}
        <div className="mt-6 flex justify-center">
          <Image
            src="/img/logo_poderJudiciariodaBahia_transparente.png"
            alt="TJBA"
            width={60}
            height={60}
            className="opacity-50"
          />
        </div>
      </div>
    </div>
  );
}

export default function AtivarContaPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-16 h-16 animate-spin text-primary" />
      </div>
    }>
      <AtivarContaContent />
    </Suspense>
  );
}