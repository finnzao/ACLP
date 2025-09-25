'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Shield, 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Loader2,
  User,
  Mail,
  Building,
  Info,
  Key,
  UserCheck,
  Clock,
  RefreshCw,
} from 'lucide-react';

// Tipos
interface DadosConvite {
  id: string;
  nome: string;
  email: string;
  tipo: 'ADMIN' | 'USUARIO';
  departamento?: string;
  criadoPor: string;
  expiraEm: string;
  status: 'PENDENTE' | 'ACEITO' | 'EXPIRADO' | 'CANCELADO';
}

interface PassoAtivacao {
  numero: number;
  titulo: string;
  descricao: string;
  icone: React.ElementType;
  concluido: boolean;
}

// Componente de Força da Senha
const PasswordStrengthIndicator = ({ password }: { password: string }) => {
  const calculateStrength = () => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    return Math.min(5, strength);
  };

  const strength = calculateStrength();
  const strengthLabels = ['Muito Fraca', 'Fraca', 'Razoável', 'Boa', 'Forte', 'Muito Forte'];
  const strengthColors = [
    'bg-red-500',
    'bg-orange-500',
    'bg-yellow-500',
    'bg-blue-500',
    'bg-green-500',
    'bg-green-600'
  ];

  if (!password) return null;

  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              i < strength ? strengthColors[strength] : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
      <p className={`text-xs font-medium ${strength < 3 ? 'text-red-600' : 'text-green-600'}`}>
        Força da senha: {strengthLabels[strength]}
      </p>
    </div>
  );
};

// Componente de Requisitos da Senha
const PasswordRequirements = ({ password }: { password: string }) => {
  const requirements = [
    { 
      label: 'Mínimo de 8 caracteres', 
      met: password.length >= 8 
    },
    { 
      label: 'Pelo menos uma letra maiúscula', 
      met: /[A-Z]/.test(password) 
    },
    { 
      label: 'Pelo menos uma letra minúscula', 
      met: /[a-z]/.test(password) 
    },
    { 
      label: 'Pelo menos um número', 
      met: /[0-9]/.test(password) 
    },
    { 
      label: 'Pelo menos um caractere especial (!@#$%^&*)', 
      met: /[^a-zA-Z0-9]/.test(password) 
    }
  ];

  const allMet = requirements.every(req => req.met);

  return (
    <div className={`mt-4 p-4 rounded-lg border ${
      allMet ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'
    }`}>
      <div className="flex items-center gap-2 mb-2">
        {allMet ? (
          <>
            <CheckCircle className="w-4 h-4 text-green-600" />
            <p className="text-sm font-medium text-green-800">
              Senha atende todos os requisitos
            </p>
          </>
        ) : (
          <>
            <Info className="w-4 h-4 text-blue-600" />
            <p className="text-sm font-medium text-blue-800">
              Requisitos de senha segura:
            </p>
          </>
        )}
      </div>
      <ul className="space-y-1">
        {requirements.map((req, index) => (
          <li 
            key={index}
            className={`flex items-center gap-2 text-xs transition-colors ${
              req.met ? 'text-green-700' : 'text-gray-600'
            }`}
          >
            {req.met ? (
              <CheckCircle className="w-3 h-3 text-green-600 flex-shrink-0" />
            ) : (
              <div className="w-3 h-3 rounded-full border border-gray-400 flex-shrink-0" />
            )}
            <span className={req.met ? 'font-medium' : ''}>{req.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

// Componente de Steps/Progresso
const StepsIndicator = ({ steps }: { steps: PassoAtivacao[] }) => {
  return (
    <div className="flex items-center justify-between mb-8">
      {steps.map((step, index) => {
        const Icon = step.icone;
        const isActive = !steps.slice(0, index).every(s => s.concluido) && 
                        steps.slice(0, index).every(s => s.concluido);
        const isCompleted = step.concluido;

        return (
          <div key={step.numero} className="flex-1 flex items-center">
            <div className="flex flex-col items-center flex-1">
              <div className={`
                w-12 h-12 rounded-full flex items-center justify-center transition-all
                ${isCompleted ? 'bg-green-500 text-white' : 
                  isActive ? 'bg-blue-500 text-white animate-pulse' : 
                  'bg-gray-200 text-gray-500'}
              `}>
                {isCompleted ? (
                  <CheckCircle className="w-6 h-6" />
                ) : (
                  <Icon className="w-6 h-6" />
                )}
              </div>
              <p className={`text-xs mt-2 text-center font-medium ${
                isCompleted ? 'text-green-600' : 
                isActive ? 'text-blue-600' : 
                'text-gray-500'
              }`}>
                {step.titulo}
              </p>
            </div>
            {index < steps.length - 1 && (
              <div className={`h-1 flex-1 mx-2 rounded ${
                isCompleted ? 'bg-green-500' : 'bg-gray-200'
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
};

// Componente Principal
export default function AtivarContaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  // Estados
  const [estado, setEstado] = useState<'validando' | 'expirado' | 'formulario' | 'sucesso' | 'erro'>('validando');
  const [dadosConvite, setDadosConvite] = useState<DadosConvite | null>(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  // Estados do formulário
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);
  const [aceitouTermos, setAceitouTermos] = useState(false);

  // Estados de validação
  const [erroSenha, setErroSenha] = useState('');
  const [erroConfirmarSenha, setErroConfirmarSenha] = useState('');

  // Passos da ativação
  const [passos, setPassos] = useState<PassoAtivacao[]>([
    { numero: 1, titulo: 'Validar Token', descricao: 'Verificando convite', icone: Shield, concluido: false },
    { numero: 2, titulo: 'Criar Senha', descricao: 'Defina sua senha', icone: Lock, concluido: false },
    { numero: 3, titulo: 'Confirmar', descricao: 'Ativar conta', icone: UserCheck, concluido: false }
  ]);

  // Validar token ao carregar a página
  useEffect(() => {
    if (!token) {
      setEstado('erro');
      setErro('Token de ativação não encontrado');
      return;
    }

    validarToken();
  }, [token]);

  // Validar token com o backend
  const validarToken = async () => {
    setLoading(true);
    try {
      // Simular chamada à API
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Dados mock do convite
      const conviteMock: DadosConvite = {
        id: '1',
        nome: 'João da Silva',
        email: 'joao.silva@tjba.jus.br',
        tipo: 'USUARIO',
        departamento: 'Central de Comparecimentos',
        criadoPor: 'Admin Sistema',
        expiraEm: new Date(Date.now() + 86400000).toISOString(),
        status: 'PENDENTE'
      };

      // Verificar se o token expirou
      const dataExpiracao = new Date(conviteMock.expiraEm);
      if (dataExpiracao < new Date()) {
        setEstado('expirado');
      } else if (conviteMock.status !== 'PENDENTE') {
        setEstado('erro');
        setErro('Este convite já foi utilizado');
      } else {
        setDadosConvite(conviteMock);
        setEstado('formulario');
        
        // Marcar primeiro passo como concluído
        setPassos(prev => prev.map((p, i) => 
          i === 0 ? { ...p, concluido: true } : p
        ));
      }
    } catch (error) {
      console.error('Erro ao validar token:', error);
      setEstado('erro');
      setErro('Erro ao validar o token de ativação');
    } finally {
      setLoading(false);
    }
  };

  // Validar senha
  const validarSenha = (): boolean => {
    // Limpar erros anteriores
    setErroSenha('');
    setErroConfirmarSenha('');

    let valido = true;

    // Validar requisitos da senha
    if (senha.length < 8) {
      setErroSenha('A senha deve ter pelo menos 8 caracteres');
      valido = false;
    } else if (!/[A-Z]/.test(senha)) {
      setErroSenha('A senha deve conter pelo menos uma letra maiúscula');
      valido = false;
    } else if (!/[a-z]/.test(senha)) {
      setErroSenha('A senha deve conter pelo menos uma letra minúscula');
      valido = false;
    } else if (!/[0-9]/.test(senha)) {
      setErroSenha('A senha deve conter pelo menos um número');
      valido = false;
    } else if (!/[^a-zA-Z0-9]/.test(senha)) {
      setErroSenha('A senha deve conter pelo menos um caractere especial');
      valido = false;
    }

    // Validar confirmação
    if (confirmarSenha !== senha) {
      setErroConfirmarSenha('As senhas não coincidem');
      valido = false;
    }

    // Validar termos
    if (!aceitouTermos) {
      setErro('Você deve aceitar os termos de uso');
      valido = false;
    }

    return valido;
  };

  // Ativar conta
  const handleAtivarConta = async () => {
    if (!validarSenha()) {
      return;
    }

    setLoading(true);
    setErro('');

    try {
      // Marcar segundo passo como concluído
      setPassos(prev => prev.map((p, i) => 
        i <= 1 ? { ...p, concluido: true } : p
      ));

      // Simular chamada à API
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Dados para enviar
      const dadosAtivacao = {
        token,
        senha,
        aceitouTermos
      };

      console.log('Ativando conta:', dadosAtivacao);

      // Marcar todos os passos como concluídos
      setPassos(prev => prev.map(p => ({ ...p, concluido: true })));

      // Sucesso
      setEstado('sucesso');

      // Redirecionar para login após 3 segundos
      setTimeout(() => {
        router.push('/login?activated=true');
      }, 3000);

    } catch (error) {
      console.error('Erro ao ativar conta:', error);
      setErro('Erro ao ativar a conta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Solicitar novo convite
  const handleSolicitarNovoConvite = () => {
    router.push('/login?request-invite=true');
  };

  // Renderização condicional baseada no estado
  if (estado === 'validando') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <Loader2 className="w-16 h-16 text-blue-500 animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Validando Convite</h2>
          <p className="text-gray-600">Verificando seu token de ativação...</p>
        </div>
      </div>
    );
  }

  if (estado === 'expirado') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-10 h-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Convite Expirado</h2>
            <p className="text-gray-600">
              Este convite expirou e não pode mais ser utilizado.
            </p>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-orange-800">O que fazer agora?</p>
                <ul className="text-sm text-orange-700 mt-1 space-y-1">
                  <li>• Entre em contato com o administrador</li>
                  <li>• Solicite um novo convite</li>
                  <li>• O convite é válido por 72 horas</li>
                </ul>
              </div>
            </div>
          </div>

          <button
            onClick={handleSolicitarNovoConvite}
            className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-5 h-5" />
            Solicitar Novo Convite
          </button>
        </div>
      </div>
    );
  }

  if (estado === 'erro') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-10 h-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Erro na Ativação</h2>
            <p className="text-gray-600">{erro}</p>
          </div>

          <button
            onClick={() => router.push('/login')}
            className="w-full bg-gray-500 text-white py-3 rounded-lg hover:bg-gray-600 transition-colors"
          >
            Voltar ao Login
          </button>
        </div>
      </div>
    );
  }

  if (estado === 'sucesso') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          <div className="text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Conta Ativada com Sucesso!</h2>
            <p className="text-gray-600 mb-6">
              Sua conta foi ativada e você já pode fazer login no sistema.
            </p>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-sm font-medium text-green-800 mb-2">Próximos passos:</p>
              <ul className="text-sm text-green-700 space-y-1 text-left">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  <span>Faça login com seu email e senha</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  <span>Complete seu perfil</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  <span>Configure suas preferências</span>
                </li>
              </ul>
            </div>

            <div className="flex items-center justify-center text-sm text-gray-600 mb-4">
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Redirecionando para o login...
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Estado: formulario
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Ativar Conta - ACLP
          </h1>
          <p className="text-gray-600">
            Complete seu cadastro para acessar o sistema
          </p>
        </div>

        {/* Steps Indicator */}
        <StepsIndicator steps={passos} />

        {/* Card Principal */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Informações do Convite */}
          {dadosConvite && (
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
              <h2 className="text-xl font-bold mb-4">Informações do Convite</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 opacity-80" />
                  <div>
                    <p className="text-xs opacity-80">Nome</p>
                    <p className="font-medium">{dadosConvite.nome}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 opacity-80" />
                  <div>
                    <p className="text-xs opacity-80">Email</p>
                    <p className="font-medium">{dadosConvite.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 opacity-80" />
                  <div>
                    <p className="text-xs opacity-80">Tipo de Acesso</p>
                    <p className="font-medium">
                      {dadosConvite.tipo === 'ADMIN' ? 'Administrador' : 'Usuário Padrão'}
                    </p>
                  </div>
                </div>
                {dadosConvite.departamento && (
                  <div className="flex items-center gap-3">
                    <Building className="w-5 h-5 opacity-80" />
                    <div>
                      <p className="text-xs opacity-80">Departamento</p>
                      <p className="font-medium">{dadosConvite.departamento}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Formulário */}
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
              <Key className="w-5 h-5 text-blue-600" />
              Crie sua Senha de Acesso
            </h3>

            {/* Campo de Senha */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nova Senha <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={mostrarSenha ? 'text' : 'password'}
                  value={senha}
                  onChange={(e) => {
                    setSenha(e.target.value);
                    setErroSenha('');
                  }}
                  className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    erroSenha ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Digite sua senha"
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                >
                  {mostrarSenha ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {erroSenha && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {erroSenha}
                </p>
              )}
              <PasswordStrengthIndicator password={senha} />
            </div>

            {/* Campo de Confirmação */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar Senha <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={mostrarConfirmarSenha ? 'text' : 'password'}
                  value={confirmarSenha}
                  onChange={(e) => {
                    setConfirmarSenha(e.target.value);
                    setErroConfirmarSenha('');
                  }}
                  className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    erroConfirmarSenha ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Digite a senha novamente"
                />
                <button
                  type="button"
                  onClick={() => setMostrarConfirmarSenha(!mostrarConfirmarSenha)}
                  className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                >
                  {mostrarConfirmarSenha ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {erroConfirmarSenha && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {erroConfirmarSenha}
                </p>
              )}
              {confirmarSenha && senha && confirmarSenha === senha && (
                <p className="text-green-600 text-sm mt-1 flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  Senhas coincidem
                </p>
              )}
            </div>

            {/* Requisitos de Senha */}
            <PasswordRequirements password={senha} />

            {/* Termos de Uso */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={aceitouTermos}
                  onChange={(e) => {
                    setAceitouTermos(e.target.checked);
                    setErro('');
                  }}
                  className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">
                    Aceito os Termos de Uso e Política de Privacidade
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    Ao ativar sua conta, você concorda com nossos termos de uso, 
                    política de privacidade e uso responsável do sistema ACLP.
                  </p>
                </div>
              </label>
            </div>

            {/* Mensagem de erro geral */}
            {erro && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {erro}
                </p>
              </div>
            )}

            {/* Botões de Ação */}
            <div className="flex gap-3 mt-8">
              <button
                onClick={() => router.push('/login')}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAtivarConta}
                disabled={loading || !senha || !confirmarSenha || !aceitouTermos}
                className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                  loading || !senha || !confirmarSenha || !aceitouTermos
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Ativando...
                  </>
                ) : (
                  <>
                    <UserCheck className="w-5 h-5" />
                    Ativar Conta
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Footer Informativo */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>
            Problemas com a ativação? Entre em contato com o administrador do sistema.
          </p>
          <p className="mt-2">
            © 2024 ACLP - Sistema de Controle de Comparecimentos
          </p>
        </div>
      </div>
    </div>
  );
}