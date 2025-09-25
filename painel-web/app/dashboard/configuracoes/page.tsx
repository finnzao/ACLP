'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils/cn';
import { NotificacaoConfig } from '@/types';
import { InputGroup } from '@/components/InputGroup';
import { NotificacaoItem } from '@/components/NotificacaoItem';
import { formatEmail, isValidEmail } from '@/lib/utils/formatting';
import { useAuth, usePermissions } from '@/contexts/AuthContext';
import { PermissionGuard, AdminArea, PermissionIndicator } from '@/components/PermissionGuard';
import { UserPermissions } from '@/types/user';
import { 
  User, 
  Settings, 
  Bell, 
  Shield, 
  Users, 
  Database, 
  Lock,
  Eye,
  EyeOff,
  Save,
  Crown,
  Mail,
  Phone,
  LogOut,
  Check,
  Edit,
  Send,
  Clock,
  X,
  RefreshCw,
  UserCheck,
  Info,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';
import { useToast } from '@/components/Toast';

// Interface para convite de usuário
interface ConviteUsuario {
  id: string;
  nome: string;
  email: string;
  tipo: 'ADMIN' | 'USUARIO';
  departamento?: string;
  status: 'PENDENTE' | 'ACEITO' | 'EXPIRADO' | 'CANCELADO';
  criadoPor: string;
  criadoEm: string;
  expiraEm: string;
  aceiteEm?: string;
}

// Interface para usuário ativo
interface UsuarioAtivo {
  id: string;
  nome: string;
  email: string;
  tipo: 'ADMIN' | 'USUARIO';
  departamento?: string;
  telefone?: string;
  ativo: boolean;
  criadoEm: string;
  ultimoLogin?: string;
}

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

// Modal de convite de usuário
const ModalConviteUsuario = ({ 
  isOpen, 
  onClose, 
  onConfirm 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onConfirm: (data: any) => void;
}) => {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    tipo: 'USUARIO' as 'ADMIN' | 'USUARIO',
    departamento: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = 'Email inválido';
    } else if (!formData.email.endsWith('@tjba.jus.br')) {
      newErrors.email = 'Use o email institucional (@tjba.jus.br)';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onConfirm(formData);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Send className="w-5 h-5 text-blue-600" />
            Convidar Novo Usuário
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome Completo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.nome}
              onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-lg ${
                errors.nome ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="João da Silva"
            />
            {errors.nome && <p className="text-red-500 text-xs mt-1">{errors.nome}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Institucional <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-lg ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="joao.silva@tjba.jus.br"
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            <p className="text-gray-500 text-xs mt-1">Use o email @tjba.jus.br</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Usuário <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.tipo}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                tipo: e.target.value as 'ADMIN' | 'USUARIO' 
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="USUARIO">Usuário Padrão</option>
              <option value="ADMIN">Administrador</option>
            </select>
            <p className="text-gray-500 text-xs mt-1">
              {formData.tipo === 'ADMIN' 
                ? 'Acesso completo ao sistema' 
                : 'Acesso para registro de comparecimentos'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Departamento
            </label>
            <input
              type="text"
              value={formData.departamento}
              onChange={(e) => setFormData(prev => ({ ...prev, departamento: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Central de Comparecimentos"
            />
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-blue-800">Como funciona o convite?</p>
              <ul className="text-xs text-blue-700 mt-1 space-y-1">
                <li>• O usuário receberá um email com link de ativação</li>
                <li>• O link expira em 72 horas</li>
                <li>• O usuário definirá sua própria senha</li>
                <li>• Você pode reenviar ou cancelar o convite se necessário</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            Enviar Convite
          </button>
        </div>
      </div>
    </div>
  );
};

// Lista de convites pendentes
const ListaConvitesPendentes = ({ 
  convites, 
  onReenviar, 
  onCancelar 
}: { 
  convites: ConviteUsuario[]; 
  onReenviar: (id: string) => void;
  onCancelar: (id: string) => void;
}) => {
  const getStatusBadge = (status: ConviteUsuario['status']) => {
    const badges = {
      PENDENTE: 'bg-yellow-100 text-yellow-800',
      ACEITO: 'bg-green-100 text-green-800',
      EXPIRADO: 'bg-red-100 text-red-800',
      CANCELADO: 'bg-gray-100 text-gray-800'
    };
    return badges[status];
  };

  const getStatusIcon = (status: ConviteUsuario['status']) => {
    switch(status) {
      case 'PENDENTE': return <Clock className="w-3 h-3" />;
      case 'ACEITO': return <CheckCircle className="w-3 h-3" />;
      case 'EXPIRADO': return <XCircle className="w-3 h-3" />;
      case 'CANCELADO': return <X className="w-3 h-3" />;
    }
  };

  return (
    <div className="space-y-3">
      {convites.map(convite => (
        <div key={convite.id} className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-medium text-gray-800">{convite.nome}</h4>
              <p className="text-sm text-gray-600">{convite.email}</p>
              <div className="flex items-center gap-3 mt-2">
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(convite.status)}`}>
                  {getStatusIcon(convite.status)}
                  {convite.status}
                </span>
                <span className="text-xs text-gray-500">
                  {convite.tipo === 'ADMIN' ? 'Administrador' : 'Usuário'}
                </span>
                {convite.departamento && (
                  <span className="text-xs text-gray-500">
                    {convite.departamento}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Enviado em {new Date(convite.criadoEm).toLocaleDateString('pt-BR')}
                {convite.status === 'PENDENTE' && (
                  <span className="text-orange-600 ml-2">
                    • Expira em {new Date(convite.expiraEm).toLocaleDateString('pt-BR')}
                  </span>
                )}
              </p>
            </div>
            
            {convite.status === 'PENDENTE' && (
              <div className="flex gap-2">
                <button
                  onClick={() => onReenviar(convite.id)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Reenviar convite"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onCancelar(convite.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Cancelar convite"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

// Lista de usuários ativos
const ListaUsuariosAtivos = ({ 
  usuarios, 
  onEditar, 
  onDesativar 
}: { 
  usuarios: UsuarioAtivo[]; 
  onEditar: (id: string) => void;
  onDesativar: (id: string) => void;
}) => {
  return (
    <div className="space-y-3">
      {usuarios.map(usuario => (
        <div key={usuario.id} className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                usuario.tipo === 'ADMIN' ? 'bg-yellow-100' : 'bg-gray-100'
              }`}>
                {usuario.tipo === 'ADMIN' ? (
                  <Crown className="w-5 h-5 text-yellow-600" />
                ) : (
                  <User className="w-5 h-5 text-gray-600" />
                )}
              </div>
              <div>
                <h4 className="font-medium text-gray-800">{usuario.nome}</h4>
                <p className="text-sm text-gray-600">{usuario.email}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-gray-500">
                    {usuario.tipo === 'ADMIN' ? 'Administrador' : 'Usuário'}
                  </span>
                  {usuario.departamento && (
                    <span className="text-xs text-gray-500">
                      {usuario.departamento}
                    </span>
                  )}
                  {usuario.telefone && (
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {usuario.telefone}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {usuario.ultimoLogin ? (
                    <>Último acesso: {new Date(usuario.ultimoLogin).toLocaleString('pt-BR')}</>
                  ) : (
                    'Nunca acessou'
                  )}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                usuario.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {usuario.ativo ? 'Ativo' : 'Inativo'}
              </span>
              
              <button
                onClick={() => onEditar(usuario.id)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Editar usuário"
              >
                <Edit className="w-4 h-4" />
              </button>
              
              {usuario.ativo && (
                <button
                  onClick={() => onDesativar(usuario.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Desativar usuário"
                >
                  <Lock className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const tabs = [
  { id: 'perfil', label: 'Perfil', icon: User },
  { id: 'seguranca', label: 'Segurança', icon: Lock },
  { id: 'notificacoes', label: 'Notificações', icon: Bell },
  { id: 'usuarios', label: 'Usuários', icon: Users, requiresAdmin: true },
  { id: 'sistema', label: 'Sistema', icon: Settings, requiresAdmin: true },
  { id: 'backup', label: 'Backup & Logs', icon: Database, requiresAdmin: true }
] as const;

type TabId = typeof tabs[number]['id'];

export default function ConfiguracoesPage() {
  const { user, updateUser, logout } = useAuth();
  const { isAdmin, hasPermission } = usePermissions();
  const { showToast } = useToast();
  
  const [activeTab, setActiveTab] = useState<TabId>('perfil');
  const [isMobile, setIsMobile] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Estados do perfil
  const [nomeUsuario, setNomeUsuario] = useState(user?.nome || '');
  const [emailUsuario, setEmailUsuario] = useState(user?.email || '');
  const [telefoneUsuario, setTelefoneUsuario] = useState(user?.telefone || '');
  const [departamentoUsuario, setDepartamentoUsuario] = useState(user?.departamento || '');
  
  // Estados de segurança
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [mostrarSenhaAtual, setMostrarSenhaAtual] = useState(false);
  const [mostrarNovaSenha, setMostrarNovaSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);
  
  // Estados de usuários
  const [showModalConvite, setShowModalConvite] = useState(false);
  const [convitesPendentes, setConvitesPendentes] = useState<ConviteUsuario[]>([]);
  const [usuariosAtivos, setUsuariosAtivos] = useState<UsuarioAtivo[]>([]);
  const [abaUsuarios, setAbaUsuarios] = useState<'ativos' | 'convites'>('ativos');
  
  // Estados das notificações
  const [notificacoes, setNotificacoes] = useState<NotificacaoConfig[]>([
    { email: 'supervisao@email.com', dias: 3 }
  ]);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Carregar dados de usuários
  useEffect(() => {
    if (activeTab === 'usuarios' && isAdmin()) {
      carregarUsuarios();
      carregarConvites();
    }
  }, [activeTab, isAdmin]);

  const carregarUsuarios = async () => {
    try {
      // Chamar API para buscar usuários
      // const response = await api.get('/usuarios');
      // setUsuariosAtivos(response.data);
      
      // Dados mock para demonstração
      setUsuariosAtivos([
        {
          id: '1',
          nome: 'João Silva',
          email: 'joao.silva@tjba.jus.br',
          tipo: 'ADMIN',
          departamento: 'Central de Comparecimentos',
          telefone: '(71) 9999-9999',
          ativo: true,
          criadoEm: '2024-01-01',
          ultimoLogin: new Date().toISOString()
        }
      ]);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    }
  };

  const carregarConvites = async () => {
    try {
      // Chamar API para buscar convites
      // const response = await api.get('/convites');
      // setConvitesPendentes(response.data);
      
      // Dados mock para demonstração
      setConvitesPendentes([
        {
          id: '1',
          nome: 'Maria Santos',
          email: 'maria.santos@tjba.jus.br',
          tipo: 'USUARIO',
          departamento: 'Atendimento',
          status: 'PENDENTE',
          criadoPor: 'João Silva',
          criadoEm: new Date(Date.now() - 86400000).toISOString(),
          expiraEm: new Date(Date.now() + 172800000).toISOString()
        }
      ]);
    } catch (error) {
      console.error('Erro ao carregar convites:', error);
    }
  };

  const handleEnviarConvite = async (data: any) => {
    setLoading(true);
    try {
      // Chamar API para enviar convite
      // await api.post('/convites', data);
      
      showToast({
        type: 'success',
        title: 'Convite Enviado',
        message: `Convite enviado para ${data.email}`,
        duration: 5000
      });
      
      setShowModalConvite(false);
      carregarConvites();
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Erro ao enviar convite',
        message: 'Não foi possível enviar o convite',
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReenviarConvite = async (id: string) => {
    try {
      // Chamar API para reenviar convite
      // await api.post(`/convites/${id}/reenviar`);
      
      showToast({
        type: 'success',
        title: 'Convite Reenviado',
        message: 'O convite foi reenviado com sucesso',
        duration: 3000
      });
      
      carregarConvites();
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Erro',
        message: 'Não foi possível reenviar o convite',
        duration: 3000
      });
    }
  };

  const handleCancelarConvite = async (id: string) => {
    if (!confirm('Tem certeza que deseja cancelar este convite?')) return;
    
    try {
      // Chamar API para cancelar convite
      // await api.delete(`/convites/${id}`);
      
      showToast({
        type: 'success',
        title: 'Convite Cancelado',
        message: 'O convite foi cancelado com sucesso',
        duration: 3000
      });
      
      carregarConvites();
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Erro',
        message: 'Não foi possível cancelar o convite',
        duration: 3000
      });
    }
  };

  const handleAlterarSenha = async () => {
    // Validações
    if (!senhaAtual) {
      showToast({
        type: 'error',
        title: 'Erro',
        message: 'Digite sua senha atual',
        duration: 3000
      });
      return;
    }
    
    if (novaSenha.length < 8) {
      showToast({
        type: 'error',
        title: 'Erro',
        message: 'A nova senha deve ter pelo menos 8 caracteres',
        duration: 3000
      });
      return;
    }
    
    if (novaSenha !== confirmarSenha) {
      showToast({
        type: 'error',
        title: 'Erro',
        message: 'As senhas não coincidem',
        duration: 3000
      });
      return;
    }
    
    setLoading(true);
    try {
      // Chamar API para alterar senha
      // await api.post('/usuarios/alterar-senha', {
      //   senhaAtual,
      //   novaSenha
      // });
      
      showToast({
        type: 'success',
        title: 'Senha Alterada',
        message: 'Sua senha foi alterada com sucesso',
        duration: 3000
      });
      
      // Limpar campos
      setSenhaAtual('');
      setNovaSenha('');
      setConfirmarSenha('');
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Erro',
        message: 'Senha atual incorreta',
        duration: 3000
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = () => {
    updateUser({
      nome: nomeUsuario,
      email: emailUsuario,
      telefone: telefoneUsuario,
      departamento: departamentoUsuario
    });
    
    setShowSaveSuccess(true);
    setTimeout(() => setShowSaveSuccess(false), 3000);
  };

  // Verificar permissões das abas
  const canViewTab = (tabId: TabId): boolean => {
    const tab = tabs.find(t => t.id === tabId);
    if (!tab) return false;
    
    if (tab.requiresAdmin) {
      return isAdmin();
    }
    
    return true;
  };

  const availableTabs = tabs.filter(tab => canViewTab(tab.id));

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header Mobile */}
        <div className="bg-white sticky top-0 z-20 shadow-sm">
          <div className="p-4">
            <h1 className="text-xl font-bold text-primary-dark">Configurações</h1>
            <div className="flex items-center gap-2 mt-1">
              <User className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">{user?.nome}</span>
              {isAdmin() && (
                <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium flex items-center gap-1">
                  <Crown className="w-3 h-3" />
                  Admin
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation - Mobile */}
        <div className="bg-white mb-4">
          <div className="flex overflow-x-auto scrollbar-hide">
            {availableTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex-shrink-0 px-4 py-3 border-b-2 text-sm font-medium transition-colors',
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500'
                )}
              >
                <div className="flex items-center gap-2">
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Content Mobile */}
        <div className="pb-20 px-4">
          {/* Conteúdo das abas */}
          {/* ... implementar conteúdo mobile das abas ... */}
        </div>
      </div>
    );
  }

  // Desktop Layout
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

      {/* Tab Navigation */}
      <div className="flex gap-4 mb-8 border-b border-border pb-2 overflow-x-auto">
        {availableTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap flex items-center gap-2',
              activeTab === tab.id ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.requiresAdmin && (
              <Shield className="w-3 h-3 text-yellow-500" />
            )}
          </button>
        ))}
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
              <InputGroup 
                label="Telefone"
                value={telefoneUsuario} 
                onChange={e => setTelefoneUsuario(e.target.value)} 
                placeholder="(00) 00000-0000" 
              />
              <InputGroup 
                label="Departamento"
                value={departamentoUsuario} 
                onChange={e => setDepartamentoUsuario(e.target.value)} 
                placeholder="Departamento" 
              />
            </div>
            
            <div className="flex justify-end mt-6">
              <button 
                onClick={handleSaveProfile}
                className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Salvar Alterações
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
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarSenhaAtual(!mostrarSenhaAtual)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
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
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarNovaSenha(!mostrarNovaSenha)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
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
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarConfirmarSenha(!mostrarConfirmarSenha)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                  >
                    {mostrarConfirmarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmarSenha && novaSenha !== confirmarSenha && (
                  <p className="text-red-500 text-sm mt-1">As senhas não coincidem</p>
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

      {/* Usuários Tab */}
      {activeTab === 'usuarios' && isAdmin() && (
        <AdminArea>
          <div className="space-y-6">
            <section className="bg-white p-6 rounded-xl shadow">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-primary-dark">Gerenciar Usuários</h3>
                <button
                  onClick={() => setShowModalConvite(true)}
                  className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Convidar Usuário
                </button>
              </div>

              {/* Tabs de Usuários */}
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setAbaUsuarios('ativos')}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition',
                    abaUsuarios === 'ativos'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4" />
                    Usuários Ativos ({usuariosAtivos.length})
                  </div>
                </button>
                <button
                  onClick={() => setAbaUsuarios('convites')}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition',
                    abaUsuarios === 'convites'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Convites Pendentes ({convitesPendentes.filter(c => c.status === 'PENDENTE').length})
                  </div>
                </button>
              </div>

              {/* Conteúdo das abas */}
              {abaUsuarios === 'ativos' ? (
                <ListaUsuariosAtivos
                  usuarios={usuariosAtivos}
                  onEditar={(id) => console.log('Editar:', id)}
                  onDesativar={(id) => console.log('Desativar:', id)}
                />
              ) : (
                <ListaConvitesPendentes
                  convites={convitesPendentes}
                  onReenviar={handleReenviarConvite}
                  onCancelar={handleCancelarConvite}
                />
              )}
            </section>
          </div>
        </AdminArea>
      )}

      {/* Modal de Convite */}
      <ModalConviteUsuario
        isOpen={showModalConvite}
        onClose={() => setShowModalConvite(false)}
        onConfirm={handleEnviarConvite}
      />
    </div>
  );
}