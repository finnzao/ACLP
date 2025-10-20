'use client';

import { useState, useEffect } from 'react';
import { InputGroup } from '@/components/InputGroup';
import { useAuth, usePermissions } from '@/contexts/AuthContext';
import { useUserManagement } from '@/hooks/useUserManagement';
import { useToast } from '@/components/Toast';
import { 
  User, 
  Lock,
  Eye,
  EyeOff,
  Save,
  Crown,
  LogOut,
  Check,
  Loader2,
  AlertCircle,
  CheckCircle,
  Mail,
  UserPlus,
  Send,
  Clock,
  XCircle,
  RefreshCw,
  Copy,
  Trash2,
  CheckCheck,
  Link as LinkIcon,
  Calendar,
  X
} from 'lucide-react';

// Componente de validação de senha
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
            className={`h-1 flex-1 rounded-full transition-colors ${
              i < strength ? strengthColors[strength] : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
      <p className={`text-xs ${strength < 3 ? 'text-red-600' : 'text-green-600'}`}>
        Força da senha: {strengthLabels[strength]}
      </p>
    </div>
  );
};

// Modal de confirmação de senha removido - não é mais necessário
// O backend valida através do token JWT

// Tipo para abas
type Tab = 'perfil' | 'seguranca' | 'convites';

// Interface para Convite
interface Convite {
  id: number;
  email: string | null;
  tipoUsuario: 'ADMIN' | 'USUARIO';
  status: 'PENDENTE' | 'ATIVADO' | 'EXPIRADO' | 'CANCELADO';
  linkConvite: string;
  expiraEm: string;
  criadoEm: string;
  criadoPorNome?: string;
  comarca?: string;
  departamento?: string;
}

// Componente Principal
export default function ConfiguracoesPage() {
  const { user, logout } = useAuth();
  const { isAdmin } = usePermissions();
  const { showToast } = useToast();
  const { 
    loading, 
    alterarSenha, 
    atualizarPerfilComSenha,
    criarConvite,
    gerarLinkConvite,
    listarConvites,
    reenviarConvite,
    cancelarConvite
  } = useUserManagement();
  
  const [activeTab, setActiveTab] = useState<Tab>('perfil');
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Estados do perfil
  const [nomeUsuario, setNomeUsuario] = useState(user?.nome || '');
  const [emailUsuario, setEmailUsuario] = useState(user?.email || '');
  const [departamentoUsuario, setDepartamentoUsuario] = useState(user?.departamento || '');
  
  // Modal de confirmação de senha
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  
  // Estados de segurança
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [mostrarSenhaAtual, setMostrarSenhaAtual] = useState(false);
  const [mostrarNovaSenha, setMostrarNovaSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);

  // Estados de convites
  const [convites, setConvites] = useState<Convite[]>([]);
  const [loadingConvites, setLoadingConvites] = useState(false);
  
  // Estados para convite com email
  const [novoConviteEmail, setNovoConviteEmail] = useState('');
  const [novoConviteTipo, setNovoConviteTipo] = useState<'ADMIN' | 'USUARIO'>('USUARIO');
  const [mostrarFormConviteEmail, setMostrarFormConviteEmail] = useState(false);
  
  // Estados para link genérico
  const [tipoUsuarioLink, setTipoUsuarioLink] = useState<'ADMIN' | 'USUARIO'>('USUARIO');
  const [diasValidadeLink, setDiasValidadeLink] = useState(30);
  const [mostrarFormGerarLink, setMostrarFormGerarLink] = useState(false);

  useEffect(() => {
    if (user) {
      setNomeUsuario(user.nome || '');
      setEmailUsuario(user.email || '');
      setDepartamentoUsuario(user.departamento || '');
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'convites' && isAdmin()) {
      carregarConvites();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const carregarConvites = async () => {
    setLoadingConvites(true);
    try {
      const result = await listarConvites();
      
      if (result && result.success) {
        if (Array.isArray(result.data)) {
          setConvites(result.data);
        } else if (result.data && typeof result.data === 'object') {
          if (Array.isArray(result.data.data)) {
            setConvites(result.data.data);
          } else {
            setConvites([]);
          }
        } else {
          setConvites([]);
        }
      } else {
        setConvites([]);
      }
    } catch (error) {
      console.error('[ConfiguracoesPage] Erro ao carregar convites:', error);
      setConvites([]);
      
      showToast({
        type: 'error',
        title: 'Erro ao carregar convites',
        message: 'Não foi possível carregar a lista de convites',
        duration: 3000
      });
    } finally {
      setLoadingConvites(false);
    }
  };

  const handleSaveProfileClick = () => {
    if (!user) return;

    if (!nomeUsuario.trim()) {
      showToast({
        type: 'error',
        title: 'Campo obrigatório',
        message: 'Nome não pode estar vazio',
        duration: 3000
      });
      return;
    }

    if (!emailUsuario.trim()) {
      showToast({
        type: 'error',
        title: 'Campo obrigatório',
        message: 'E-mail não pode estar vazio',
        duration: 3000
      });
      return;
    }

    // Verificar se houve alterações
    const houveAlteracao = 
      nomeUsuario !== user.nome ||
      emailUsuario !== user.email ||
      departamentoUsuario !== user.departamento;

    if (!houveAlteracao) {
      showToast({
        type: 'info',
        title: 'Nenhuma alteração',
        message: 'Não há alterações para salvar',
        duration: 3000
      });
      return;
    }

    // Abrir modal de confirmação de senha
    setShowPasswordModal(true);
  };

  const handleConfirmPassword = async (senha: string) => {
    if (!user) return;

    setIsSaving(true);

    try {
      // Preparar dados alterados
      const dadosAtualizacao: {
        nome?: string;
        email?: string;
        departamento?: string;
      } = {};

      if (nomeUsuario !== user.nome) dadosAtualizacao.nome = nomeUsuario;
      if (emailUsuario !== user.email) dadosAtualizacao.email = emailUsuario;
      if (departamentoUsuario !== user.departamento) dadosAtualizacao.departamento = departamentoUsuario;

      const result = await atualizarPerfilComSenha(dadosAtualizacao, senha);

      if (result.success) {
        setShowPasswordModal(false);
        setShowSaveSuccess(true);
        setTimeout(() => setShowSaveSuccess(false), 3000);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleAlterarSenha = async () => {
    const result = await alterarSenha({
      senhaAtual,
      novaSenha,
      confirmaSenha: confirmarSenha
    });

    if (result.success) {
      setSenhaAtual('');
      setNovaSenha('');
      setConfirmarSenha('');
      setMostrarSenhaAtual(false);
      setMostrarNovaSenha(false);
      setMostrarConfirmarSenha(false);
    }
  };

  const handleCriarConviteEmail = async () => {
    if (!novoConviteEmail.trim()) {
      showToast({
        type: 'error',
        title: 'Campo obrigatório',
        message: 'Preencha o e-mail',
        duration: 3000
      });
      return;
    }

    const result = await criarConvite({
      email: novoConviteEmail,
      tipoUsuario: novoConviteTipo
    });

    if (result.success) {
      setNovoConviteEmail('');
      setNovoConviteTipo('USUARIO');
      setMostrarFormConviteEmail(false);
      carregarConvites();
    }
  };

  const handleGerarLink = async () => {
    const result = await gerarLinkConvite({
      tipoUsuario: tipoUsuarioLink,
      diasValidade: diasValidadeLink
    });
  
    if (result.success) {
      if (result.data?.link) {
        navigator.clipboard.writeText(result.data.link);
      }
      carregarConvites();
      setMostrarFormGerarLink(false);
      setTipoUsuarioLink('USUARIO');
      setDiasValidadeLink(30);
    }
  };

  const handleReenviarConvite = async (id: number) => {
    const result = await reenviarConvite(id);
    if (result.success) {
      carregarConvites();
    }
  };

  const handleCancelarConvite = async (id: number) => {
    if (!confirm('Deseja realmente cancelar este convite?')) return;
    
    const result = await cancelarConvite(id);
    if (result.success) {
      carregarConvites();
    }
  };

  const copiarLink = (link: string) => {
    navigator.clipboard.writeText(link);
    showToast({
      type: 'success',
      title: 'Link copiado',
      message: 'Link do convite copiado para a área de transferência',
      duration: 2000
    });
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      PENDENTE: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pendente' },
      ATIVADO: { color: 'bg-green-100 text-green-800', icon: CheckCheck, label: 'Ativado' },
      EXPIRADO: { color: 'bg-gray-100 text-gray-800', icon: XCircle, label: 'Expirado' },
      CANCELADO: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Cancelado' }
    };

    const badge = badges[status as keyof typeof badges] || badges.PENDENTE;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="w-3 h-3" />
        {badge.label}
      </span>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-primary mb-2">Configurações</h2>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <User className="w-4 h-4" />
            <span>{user?.nome}</span>
            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium flex items-center gap-1">
              {isAdmin() && <Crown className="w-3 h-3" />}
              {isAdmin() ? 'Administrador' : 'Usuário'}
            </span>
          </div>
        </div>
        
        <button
          onClick={logout}
          className="flex items-center gap-2 px-4 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sair
        </button>
      </div>

      {/* Success Message */}
      {showSaveSuccess && (
        <div className="fixed top-4 right-4 bg-green-500 text-white p-3 rounded-lg shadow-lg z-30 flex items-center gap-2 animate-in slide-in-from-top-2">
          <Check className="w-5 h-5" />
          <span className="font-medium">Salvo com sucesso!</span>
        </div>
      )}

      {/* Modal de Confirmação de Senha */}
      <PasswordConfirmModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onConfirm={handleConfirmPassword}
        loading={isSaving}
      />

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('perfil')}
          className={`px-4 py-2 font-medium transition-colors relative ${
            activeTab === 'perfil'
              ? 'text-primary border-b-2 border-primary'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <User className="w-4 h-4" />
            <span>Perfil</span>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('seguranca')}
          className={`px-4 py-2 font-medium transition-colors relative ${
            activeTab === 'seguranca'
              ? 'text-primary border-b-2 border-primary'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4" />
            <span>Segurança</span>
          </div>
        </button>

        {isAdmin() && (
          <button
            onClick={() => setActiveTab('convites')}
            className={`px-4 py-2 font-medium transition-colors relative ${
              activeTab === 'convites'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              <span>Convites</span>
            </div>
          </button>
        )}
      </div>

      {/* Perfil Tab */}
      {activeTab === 'perfil' && (
        <div className="space-y-6">
          <section className="bg-white p-6 rounded-xl shadow">
            <div className="flex items-center gap-3 mb-4">
              <User className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-medium text-primary-dark">Informações Pessoais</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputGroup 
                label="Nome Completo"
                value={nomeUsuario} 
                onChange={e => setNomeUsuario(e.target.value)} 
                placeholder="Nome completo" 
              />
              <InputGroup
                label="Email"
                type="email"
                value={emailUsuario}
                onChange={e => setEmailUsuario(e.target.value)}
                placeholder="Email"
              />
              <div className="md:col-span-2">
                <InputGroup 
                  label="Departamento"
                  value={departamentoUsuario} 
                  onChange={e => setDepartamentoUsuario(e.target.value)} 
                  placeholder="Departamento" 
                />
              </div>
            </div>

            {/* Info sobre senha */}
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2">
                <Lock className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-800">Segurança</p>
                  <p className="text-sm text-blue-700 mt-1">
                    Ao salvar alterações, você precisará confirmar sua senha atual por segurança.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end mt-6">
              <button 
                onClick={handleSaveProfileClick}
                disabled={isSaving}
                className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Salvar Alterações
                  </>
                )}
              </button>
            </div>
          </section>
        </div>
      )}

      {/* Segurança Tab */}
      {activeTab === 'seguranca' && (
        <div className="space-y-6">
          <section className="bg-white p-6 rounded-xl shadow">
            <div className="flex items-center gap-3 mb-6">
              <Lock className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-medium text-primary-dark">Alterar Senha</h3>
            </div>
            
            <div className="max-w-md space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Senha Atual <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input 
                    type={mostrarSenhaAtual ? "text" : "password"} 
                    value={senhaAtual} 
                    onChange={e => setSenhaAtual(e.target.value)} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Digite sua senha atual"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarSenhaAtual(!mostrarSenhaAtual)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                    disabled={loading}
                  >
                    {mostrarSenhaAtual ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nova Senha <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input 
                    type={mostrarNovaSenha ? "text" : "password"} 
                    value={novaSenha} 
                    onChange={e => setNovaSenha(e.target.value)} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Digite a nova senha"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarNovaSenha(!mostrarNovaSenha)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                    disabled={loading}
                  >
                    {mostrarNovaSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <PasswordStrengthIndicator password={novaSenha} />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmar Nova Senha <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input 
                    type={mostrarConfirmarSenha ? "text" : "password"} 
                    value={confirmarSenha} 
                    onChange={e => setConfirmarSenha(e.target.value)} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Confirme a nova senha"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarConfirmarSenha(!mostrarConfirmarSenha)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                    disabled={loading}
                  >
                    {mostrarConfirmarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmarSenha && novaSenha !== confirmarSenha && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    As senhas não coincidem
                  </p>
                )}
                {confirmarSenha && novaSenha === confirmarSenha && (
                  <p className="text-green-500 text-sm mt-1 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Senhas coincidem
                  </p>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm font-medium text-blue-800">Requisitos de senha:</p>
                <ul className="text-xs text-blue-700 mt-1 space-y-1">
                  <li className={novaSenha.length >= 8 ? 'text-green-600' : ''}>
                    • Mínimo de 8 caracteres
                  </li>
                  <li className={/[a-z]/.test(novaSenha) && /[A-Z]/.test(novaSenha) ? 'text-green-600' : ''}>
                    • Letras maiúsculas e minúsculas
                  </li>
                  <li className={/[0-9]/.test(novaSenha) ? 'text-green-600' : ''}>
                    • Pelo menos um número
                  </li>
                  <li className={/[^a-zA-Z0-9]/.test(novaSenha) ? 'text-green-600' : ''}>
                    • Pelo menos um caractere especial
                  </li>
                </ul>
              </div>

              <button 
                onClick={handleAlterarSenha}
                disabled={loading || !senhaAtual || !novaSenha || novaSenha !== confirmarSenha}
                className="w-full bg-primary text-white py-3 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Alterando...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    Alterar Senha
                  </>
                )}
              </button>
            </div>
          </section>
        </div>
      )}

      {/* Convites Tab */}
      {activeTab === 'convites' && isAdmin() && (
        <div className="space-y-6">
          {/* Opções de Criar Convites */}
          <section className="bg-white p-6 rounded-xl shadow">
            <div className="flex items-center gap-3 mb-4">
              <UserPlus className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-medium text-primary-dark">Criar Convites</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Card: Link Genérico */}
              <div className="border-2 border-dashed border-blue-300 rounded-lg p-4 hover:border-blue-500 transition-colors">
                <div className="flex items-start gap-3 mb-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <LinkIcon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">Link Genérico</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Gere um link reutilizável para compartilhar por qualquer meio
                    </p>
                  </div>
                </div>
                
                {!mostrarFormGerarLink ? (
                  <button
                    onClick={() => setMostrarFormGerarLink(true)}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <LinkIcon className="w-4 h-4" />
                    Gerar Link
                  </button>
                ) : (
                  <div className="space-y-3 border-t pt-3 mt-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tipo de Usuário
                      </label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            value="USUARIO"
                            checked={tipoUsuarioLink === 'USUARIO'}
                            onChange={() => setTipoUsuarioLink('USUARIO')}
                            className="w-4 h-4"
                          />
                          <span className="text-sm">Usuário</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            value="ADMIN"
                            checked={tipoUsuarioLink === 'ADMIN'}
                            onChange={() => setTipoUsuarioLink('ADMIN')}
                            className="w-4 h-4"
                          />
                          <span className="text-sm">Administrador</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Validade (dias)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="365"
                        value={diasValidadeLink}
                        onChange={(e) => setDiasValidadeLink(parseInt(e.target.value) || 30)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>

                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => setMostrarFormGerarLink(false)}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleGerarLink}
                        disabled={loading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                      >
                        {loading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <LinkIcon className="w-4 h-4" />
                        )}
                        Gerar
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Card: Convite com Email */}
              <div className="border-2 border-dashed border-green-300 rounded-lg p-4 hover:border-green-500 transition-colors">
                <div className="flex items-start gap-3 mb-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Mail className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">Convite por Email</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Envie convite diretamente para um email específico
                    </p>
                  </div>
                </div>

                {!mostrarFormConviteEmail ? (
                  <button
                    onClick={() => setMostrarFormConviteEmail(true)}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Enviar por Email
                  </button>
                ) : (
                  <div className="space-y-3 border-t pt-3 mt-3">
                    <InputGroup
                      label="E-mail"
                      type="email"
                      value={novoConviteEmail}
                      onChange={e => setNovoConviteEmail(e.target.value)}
                      placeholder="email@exemplo.com"
                    />

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tipo de Usuário
                      </label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            value="USUARIO"
                            checked={novoConviteTipo === 'USUARIO'}
                            onChange={() => setNovoConviteTipo('USUARIO')}
                            className="w-4 h-4"
                          />
                          <span className="text-sm">Usuário</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            value="ADMIN"
                            checked={novoConviteTipo === 'ADMIN'}
                            onChange={() => setNovoConviteTipo('ADMIN')}
                            className="w-4 h-4"
                          />
                          <span className="text-sm">Administrador</span>
                        </label>
                      </div>
                    </div>

                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => setMostrarFormConviteEmail(false)}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleCriarConviteEmail}
                        disabled={loading}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                      >
                        {loading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                        Enviar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Lista de Convites */}
          <section className="bg-white p-6 rounded-xl shadow">
            <div className="flex items-center gap-3 mb-4">
              <Mail className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-medium text-primary-dark">Convites Criados</h3>
            </div>

            {loadingConvites ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : !Array.isArray(convites) || convites.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Mail className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Nenhum convite criado ainda</p>
              </div>
            ) : (
              <div className="space-y-3">
                {convites.map(convite => (
                  <div
                    key={convite.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {convite.email ? (
                            <Mail className="w-4 h-4 text-gray-400" />
                          ) : (
                            <LinkIcon className="w-4 h-4 text-blue-500" />
                          )}
                          <h4 className="font-medium">
                            {convite.email || 'Link Genérico'}
                          </h4>
                          {getStatusBadge(convite.status)}
                        </div>
                        <p className="text-sm text-gray-600">
                          Tipo: {convite.tipoUsuario === 'ADMIN' ? 'Administrador' : 'Usuário'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Expira em: {new Date(convite.expiraEm).toLocaleDateString('pt-BR')}
                        </p>
                        {convite.comarca && (
                          <p className="text-xs text-gray-500">
                            Comarca: {convite.comarca}
                          </p>
                        )}
                      </div>

                      <div className="flex gap-2">
                        {convite.status === 'PENDENTE' && (
                          <>
                            <button
                              onClick={() => copiarLink(convite.linkConvite)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Copiar link"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            {convite.email && (
                              <button
                                onClick={() => handleReenviarConvite(convite.id)}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="Reenviar"
                              >
                                <RefreshCw className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleCancelarConvite(convite.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Cancelar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}