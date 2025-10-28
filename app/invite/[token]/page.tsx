'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';
import { convitesService } from '@/lib/api/services';
import {
  User,
  Lock,
  Building,
  MapPin,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle,
  AlertCircle,
  Shield
} from 'lucide-react';
import { extractDateFromTimestamp } from '@/lib/utils/dateutils';

interface ConviteData {
  tipoUsuario: 'ADMIN' | 'USUARIO';
  comarca?: string;
  departamento?: string;
  expiraEm: string;
}

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const token = params.token as string;

  // Estados de carregamento
  const [validando, setValidando] = useState(true);
  const [conviteValido, setConviteValido] = useState(false);
  const [ativando, setAtivando] = useState(false);

  // Dados do convite
  const [conviteData, setConviteData] = useState<ConviteData | null>(null);

  // Formulário
  const [nome, setNome] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [aceitouTermos, setAceitouTermos] = useState(false);

  // UI States
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);

  // Validar token ao montar
  useEffect(() => {
    validarToken();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const validarToken = async () => {
    if (!token) {
      showToast({
        type: 'error',
        title: 'Token inválido',
        message: 'Link de convite inválido',
        duration: 5000
      });
      router.push('/login');
      return;
    }

    setValidando(true);

    try {
      const response = await convitesService.validarToken(token);

      if (response.success && response.data) {
        setConviteValido(true);
        
        const dados = response.data;
        setConviteData({
          tipoUsuario: dados.tipoUsuario as 'ADMIN' | 'USUARIO',
          comarca: dados.comarca || 'Não informado',
          departamento: dados.departamento || 'Não informado',
          expiraEm: dados.expiraEm || ''
        });
      } else {
        setConviteValido(false);
        showToast({
          type: 'error',
          title: 'Convite inválido',
          message: response.message || 'Este convite não é válido ou já expirou',
          duration: 5000
        });
      }
    } catch (error) {
      console.error('Erro ao validar token:', error);
      setConviteValido(false);
      showToast({
        type: 'error',
        title: 'Erro',
        message: 'Não foi possível validar o convite',
        duration: 5000
      });
    } finally {
      setValidando(false);
    }
  };

  const calcularForcaSenha = () => {
    let strength = 0;
    if (senha.length >= 8) strength++;
    if (senha.length >= 12) strength++;
    if (/[a-z]/.test(senha)) strength++;
    if (/[A-Z]/.test(senha)) strength++;
    if (/[0-9]/.test(senha)) strength++;
    if (/[^a-zA-Z0-9]/.test(senha)) strength++;
    return Math.min(5, strength);
  };

  const validarFormulario = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!nome.trim()) {
      errors.push('Nome completo é obrigatório');
    } else if (nome.trim().length < 3) {
      errors.push('Nome deve ter pelo menos 3 caracteres');
    }

    if (!senha) {
      errors.push('Senha é obrigatória');
    } else {
      if (senha.length < 8) {
        errors.push('Senha deve ter pelo menos 8 caracteres');
      }
      if (!/[a-z]/.test(senha)) {
        errors.push('Senha deve conter letras minúsculas');
      }
      if (!/[A-Z]/.test(senha)) {
        errors.push('Senha deve conter letras maiúsculas');
      }
      if (!/[0-9]/.test(senha)) {
        errors.push('Senha deve conter números');
      }
      if (!/[^a-zA-Z0-9]/.test(senha)) {
        errors.push('Senha deve conter caracteres especiais');
      }
    }

    if (senha !== confirmarSenha) {
      errors.push('As senhas não coincidem');
    }

    if (!aceitouTermos) {
      errors.push('Você deve aceitar os termos de uso');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validacao = validarFormulario();

    if (!validacao.isValid) {
      showToast({
        type: 'error',
        title: 'Dados inválidos',
        message: validacao.errors[0],
        duration: 5000
      });
      return;
    }

    setAtivando(true);

    try {
      const result = await convitesService.ativarConta({
        token,
        senha,
        confirmaSenha: confirmarSenha,
        nome
      });

      if (result.success) {
        showToast({
          type: 'success',
          title: 'Conta ativada!',
          message: 'Sua conta foi criada com sucesso. Redirecionando...',
          duration: 3000
        });

        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        showToast({
          type: 'error',
          title: 'Erro ao ativar conta',
          message: result.message || 'Não foi possível ativar sua conta',
          duration: 5000
        });
      }
    } catch (error) {
      console.error('Erro ao ativar conta:', error);
      showToast({
        type: 'error',
        title: 'Erro',
        message: 'Ocorreu um erro ao ativar sua conta',
        duration: 5000
      });
    } finally {
      setAtivando(false);
    }
  };

  const forcaSenha = calcularForcaSenha();
  const strengthLabels = ['Muito Fraca', 'Fraca', 'Razoável', 'Boa', 'Forte', 'Muito Forte'];
  const strengthColors = [
    'bg-red-500',
    'bg-orange-500',
    'bg-yellow-500',
    'bg-blue-500',
    'bg-green-500',
    'bg-green-600'
  ];

  // Loading State
  if (validando) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <Loader2 className="w-16 h-16 animate-spin text-primary mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800">Validando convite...</h2>
          <p className="text-gray-600 mt-2">Por favor, aguarde</p>
        </div>
      </div>
    );
  }

  // Invalid Token State
  if (!conviteValido || !conviteData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Convite Inválido</h2>
          <p className="text-gray-600 mb-6">
            Este convite não é válido ou já expirou. Entre em contato com o administrador.
          </p>
          <button
            onClick={() => router.push('/login')}
            className="w-full bg-primary text-white py-3 rounded-lg hover:bg-primary-dark transition-colors"
          >
            Ir para Login
          </button>
        </div>
      </div>
    );
  }

  // Main Form
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-blue-600 p-6 text-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Shield className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Ativar Conta</h1>
              <p className="text-sm text-blue-100">Complete seu cadastro</p>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 space-y-1.5">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4" />
              <span className="text-blue-100">Comarca: <strong>{conviteData.comarca}</strong></span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Building className="w-4 h-4" />
              <span className="text-blue-100">Departamento: <strong>{conviteData.departamento}</strong></span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4" />
              <span className="text-blue-100">Perfil: <strong>{conviteData.tipoUsuario === 'ADMIN' ? 'Administrador' : 'Usuário'}</strong></span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4" />
              <span className="text-blue-100">Expira em: <strong>{extractDateFromTimestamp(conviteData.expiraEm)}</strong></span>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Campo Nome */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Nome Completo <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute left-3 top-3 text-gray-400">
                <User className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Digite seu nome completo"
                required
              />
            </div>
          </div>

          {/* Campo Senha */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Senha <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute left-3 top-3 text-gray-400">
                <Lock className="w-5 h-5" />
              </div>
              <input
                type={mostrarSenha ? 'text' : 'password'}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Digite sua senha"
                required
              />
              <button
                type="button"
                onClick={() => setMostrarSenha(!mostrarSenha)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              >
                {mostrarSenha ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            
            {senha && (
              <div className="mt-2">
                <div className="flex gap-1 mb-1">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        i < forcaSenha ? strengthColors[forcaSenha] : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
                <p className={`text-xs ${forcaSenha < 3 ? 'text-red-600' : 'text-green-600'}`}>
                  Força: {strengthLabels[forcaSenha]}
                </p>
              </div>
            )}
          </div>

          {/* Campo Confirmar Senha */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Confirmar Senha <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute left-3 top-3 text-gray-400">
                <Lock className="w-5 h-5" />
              </div>
              <input
                type={mostrarConfirmarSenha ? 'text' : 'password'}
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Confirme sua senha"
                required
              />
              <button
                type="button"
                onClick={() => setMostrarConfirmarSenha(!mostrarConfirmarSenha)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              >
                {mostrarConfirmarSenha ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            
            {confirmarSenha && (
              <p className={`text-xs mt-1.5 flex items-center gap-1 ${senha === confirmarSenha ? 'text-green-600' : 'text-red-600'}`}>
                {senha === confirmarSenha ? (
                  <>
                    <CheckCircle className="w-3 h-3" />
                    Senhas coincidem
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3 h-3" />
                    Senhas não coincidem
                  </>
                )}
              </p>
            )}
          </div>

          {/* Requisitos de Senha */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs font-medium text-blue-800 mb-1.5">Requisitos de senha:</p>
            <ul className="text-xs text-blue-700 space-y-0.5">
              <li className={senha.length >= 8 ? 'text-green-600 font-medium' : ''}>
                {senha.length >= 8 ? '✓' : '○'} Mínimo de 8 caracteres
              </li>
              <li className={/[a-z]/.test(senha) && /[A-Z]/.test(senha) ? 'text-green-600 font-medium' : ''}>
                {/[a-z]/.test(senha) && /[A-Z]/.test(senha) ? '✓' : '○'} Maiúsculas e minúsculas
              </li>
              <li className={/[0-9]/.test(senha) ? 'text-green-600 font-medium' : ''}>
                {/[0-9]/.test(senha) ? '✓' : '○'} Pelo menos um número
              </li>
              <li className={/[^a-zA-Z0-9]/.test(senha) ? 'text-green-600 font-medium' : ''}>
                {/[^a-zA-Z0-9]/.test(senha) ? '✓' : '○'} Caractere especial
              </li>
            </ul>
          </div>

          {/* Termos */}
          <div className="flex items-start gap-2">
            <input
              type="checkbox"
              id="termos"
              checked={aceitouTermos}
              onChange={(e) => setAceitouTermos(e.target.checked)}
              className="mt-0.5 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
            />
            <label htmlFor="termos" className="text-xs text-gray-700 cursor-pointer">
              Aceito os termos de uso e política de privacidade
            </label>
          </div>

          {/* Botão Submit */}
          <button
            type="submit"
            disabled={ativando || !aceitouTermos}
            className="w-full bg-primary text-white py-3 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
          >
            {ativando ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Ativando...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                Ativar Conta
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}