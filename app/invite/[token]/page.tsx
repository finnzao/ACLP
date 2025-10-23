'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';
import { convitesService } from '@/lib/api/services';
import {
  User,
  Mail,
  Lock,
  Building,
  MapPin,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle,
  AlertCircle,
  Shield,
  Phone
} from 'lucide-react';

interface ConviteData {
  email: string;
  nome?: string;
  tipoUsuario: 'ADMIN' | 'USUARIO';
  comarca?: string;
  departamento?: string;
  telefone?: string;
  expiraEm: string;
  criadoPor?: string;
  criadoPorNome?: string;
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
  const [telefone, setTelefone] = useState('');
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
        
        // Extrair dados do convite com valores padrão
        const dados = response.data;
        setConviteData({
          email: dados.email || '',
          nome: dados.nome || '',
          tipoUsuario: dados.tipoUsuario as 'ADMIN' | 'USUARIO',
          comarca: dados.comarca || dados.departamento || 'Não informado', // Fallback para comarca
          departamento: dados.departamento || 'Não informado',
          telefone: dados.telefone || '',
          expiraEm: dados.expiraEm || dados.dataExpiracao || '',
          criadoPor: dados.criadoPor || '',
          criadoPorNome: dados.criadoPorNome || dados.criadoPor || 'Administrador' // Fallback para nome
        });

        // Preencher campos se já tiverem dados
        if (dados.nome) setNome(dados.nome);
        if (dados.telefone) setTelefone(dados.telefone);
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
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-blue-600 p-8 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Ativar Conta</h1>
              <p className="text-blue-100">Complete seu cadastro</p>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 space-y-2">
            <p className="text-sm text-blue-100">
              Você foi convidado por: <strong>{conviteData.criadoPorNome}</strong>
            </p>
            <p className="text-sm text-blue-100">
              Perfil: <strong>{conviteData.tipoUsuario === 'ADMIN' ? 'Administrador' : 'Usuário'}</strong>
            </p>
            <p className="text-sm text-blue-100">
              Expira em: <strong>{new Date(conviteData.expiraEm).toLocaleDateString('pt-BR')}</strong>
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* Dados Pré-definidos (Readonly) */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Dados da Organização
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Campo Email - ReadOnly */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="relative">
                  <div className="absolute left-3 top-3 text-gray-400">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    type="email"
                    value={conviteData.email}
                    readOnly
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                  />
                </div>
              </div>

              {/* Campo Comarca - ReadOnly */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Comarca</label>
                <div className="relative">
                  <div className="absolute left-3 top-3 text-gray-400">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    value={conviteData.comarca}
                    readOnly
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                  />
                </div>
              </div>

              {/* Campo Departamento - ReadOnly */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Departamento</label>
                <div className="relative">
                  <div className="absolute left-3 top-3 text-gray-400">
                    <Building className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    value={conviteData.departamento}
                    readOnly
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                  />
                </div>
              </div>

              {/* Campo Perfil - ReadOnly */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Perfil</label>
                <div className="relative">
                  <div className="absolute left-3 top-3 text-gray-400">
                    <User className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    value={conviteData.tipoUsuario === 'ADMIN' ? 'Administrador' : 'Usuário'}
                    readOnly
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                  />
                </div>
              </div>
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* Dados do Usuário */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Seus Dados
            </h3>

            {/* Campo Nome - Editável */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Digite seu nome completo"
                  required
                />
              </div>
            </div>

            {/* Campo Telefone - Editável */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telefone (opcional)
              </label>
              <div className="relative">
                <div className="absolute left-3 top-3 text-gray-400">
                  <Phone className="w-5 h-5" />
                </div>
                <input
                  type="tel"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>

            {/* Campo Senha */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
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
                    Força da senha: {strengthLabels[forcaSenha]}
                  </p>
                </div>
              )}
            </div>

            {/* Campo Confirmar Senha */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
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
                <p className={`text-xs mt-1 ${senha === confirmarSenha ? 'text-green-600' : 'text-red-600'}`}>
                  {senha === confirmarSenha ? '✓ Senhas coincidem' : '✗ Senhas não coincidem'}
                </p>
              )}
            </div>
          </div>

          {/* Requisitos de Senha */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm font-medium text-blue-800 mb-2">Requisitos de senha:</p>
            <ul className="text-xs text-blue-700 space-y-1">
              <li className={senha.length >= 8 ? 'text-green-600 font-medium' : ''}>
                {senha.length >= 8 ? '✓' : '○'} Mínimo de 8 caracteres
              </li>
              <li className={/[a-z]/.test(senha) && /[A-Z]/.test(senha) ? 'text-green-600 font-medium' : ''}>
                {/[a-z]/.test(senha) && /[A-Z]/.test(senha) ? '✓' : '○'} Letras maiúsculas e minúsculas
              </li>
              <li className={/[0-9]/.test(senha) ? 'text-green-600 font-medium' : ''}>
                {/[0-9]/.test(senha) ? '✓' : '○'} Pelo menos um número
              </li>
              <li className={/[^a-zA-Z0-9]/.test(senha) ? 'text-green-600 font-medium' : ''}>
                {/[^a-zA-Z0-9]/.test(senha) ? '✓' : '○'} Pelo menos um caractere especial
              </li>
            </ul>
          </div>

          {/* Termos */}
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="termos"
              checked={aceitouTermos}
              onChange={(e) => setAceitouTermos(e.target.checked)}
              className="mt-1 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
            />
            <label htmlFor="termos" className="text-sm text-gray-700 cursor-pointer">
              Eu li e aceito os{' '}
              <a href="#" className="text-primary hover:underline">
                termos de uso
              </a>{' '}
              e a{' '}
              <a href="#" className="text-primary hover:underline">
                política de privacidade
              </a>
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
                Ativando conta...
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