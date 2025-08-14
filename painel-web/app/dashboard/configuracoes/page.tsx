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
  FileText,
  Lock,
  Eye,
  EyeOff,
  Save,
  UserPlus,
  AlertCircle,
  Crown,
  ChevronRight,
  Smartphone,
  Mail,
  Phone,
  Key,
  BellRing,
  Monitor,
  LogOut,
  Check
} from 'lucide-react';

const tabs = [
  { id: 'perfil', label: 'Perfil', icon: User },
  { id: 'notificacoes', label: 'Notificações', icon: Bell },
  { id: 'sistema', label: 'Sistema', icon: Settings, requiresAdmin: true },
  { id: 'usuarios', label: 'Usuários', icon: Users, requiresAdmin: true },
  { id: 'backup', label: 'Backup & Logs', icon: Database, requiresAdmin: true }
] as const;

type TabId = typeof tabs[number]['id'];

export default function ConfiguracoesPage() {
  const { user, updateUser, logout } = useAuth();
  const { isAdmin, hasPermission } = usePermissions();
  
  const [activeTab, setActiveTab] = useState<TabId>('perfil');
  const [isMobile, setIsMobile] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  
  // Estados do perfil do usuário
  const [nomeUsuario, setNomeUsuario] = useState(user?.nome || '');
  const [emailUsuario, setEmailUsuario] = useState(user?.email || '');
  const [telefoneUsuario, setTelefoneUsuario] = useState(user?.telefone || '');
  const [erroEmailUsuario, setErroEmailUsuario] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);

  // Estados das notificações
  const [novoEmail, setNovoEmail] = useState('');
  const [novoDias, setNovoDias] = useState<number>(3);
  const [erroEmail, setErroEmail] = useState('');
  const [editando, setEditando] = useState<number | null>(null);
  const [editandoEmail, setEditandoEmail] = useState('');
  const [editandoDias, setEditandoDias] = useState<number>(3);
  const [erroEdicao, setErroEdicao] = useState('');

  const [notificacoes, setNotificacoes] = useState<NotificacaoConfig[]>([
    { email: 'supervisao@email.com', dias: 3 }
  ]);

  // Configurações do usuário
  const [configuracoes, setConfiguracoes] = useState({
    notificacoes: user?.configuracoes?.notificacoes || {
      email: true,
      sistema: true,
      prazoVencimento: true,
    },
    interface: user?.configuracoes?.interface || {
      tema: 'light' as const,
      itensPerPage: 20,
      idioma: 'pt-BR' as const,
    },
    privacidade: user?.configuracoes?.privacidade || {
      mostrarEmail: true,
      mostrarTelefone: false,
    },
  });

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Verificar se o usuário pode ver determinadas abas
  const canViewTab = (tabId: TabId): boolean => {
    const tab = tabs.find(t => t.id === tabId);
    if (!tab) return false;
    
    if (tab.requiresAdmin) {
      return isAdmin();
    }
    
    switch (tabId) {
      case 'perfil':
      case 'notificacoes':
        return true;
      default:
        return false;
    }
  };

  // Filtrar abas disponíveis
  const availableTabs = tabs.filter(tab => canViewTab(tab.id));

  // Funções
  function adicionarEmail() {
    const emailFormatado = formatEmail(novoEmail);
    if (!isValidEmail(emailFormatado)) {
      setErroEmail('E-mail inválido.');
      return;
    }
    setErroEmail('');

    if (!notificacoes.some(n => n.email === emailFormatado)) {
      setNotificacoes(prev => [...prev, { email: emailFormatado, dias: novoDias }]);
      setNovoEmail('');
      setNovoDias(3);
    } else {
      setErroEmail('E-mail já adicionado.');
    }
  }

  function removerEmail(index: number) {
    setNotificacoes(prev => prev.filter((_, i) => i !== index));
    if (editando === index) {
      setEditando(null);
    }
  }

  function iniciarEdicao(index: number) {
    setEditando(index);
    setEditandoEmail(notificacoes[index].email);
    setEditandoDias(notificacoes[index].dias);
    setErroEdicao('');
  }

  function salvarEdicao(index: number) {
    const emailFormatado = formatEmail(editandoEmail);
    if (!isValidEmail(emailFormatado)) {
      setErroEdicao('E-mail inválido.');
      return;
    }
    setErroEdicao('');

    setNotificacoes(prev =>
      prev.map((item, i) => (i === index ? { email: emailFormatado, dias: editandoDias } : item))
    );
    setEditando(null);
    setEditandoEmail('');
    setEditandoDias(3);
  }

  function handleEmailUsuarioChange(e: React.ChangeEvent<HTMLInputElement>) {
    const email = e.target.value;
    setEmailUsuario(email);
    setErroEmailUsuario(isValidEmail(email) ? '' : 'E-mail inválido.');
  }

  const handleSaveProfile = () => {
    if (erroEmailUsuario) {
      alert('Corrija os erros antes de salvar');
      return;
    }

    updateUser({
      nome: nomeUsuario,
      email: emailUsuario,
      telefone: telefoneUsuario,
      configuracoes
    });

    setShowSaveSuccess(true);
    setTimeout(() => setShowSaveSuccess(false), 3000);
  };

  const handleSaveSettings = () => {
    updateUser({ configuracoes });
    setShowSaveSuccess(true);
    setTimeout(() => setShowSaveSuccess(false), 3000);
  };

  // Mobile Settings Item Component
  const MobileSettingItem = ({ 
    icon, 
    title, 
    subtitle, 
    onClick, 
    showArrow = true,
    rightElement 
  }: { 
    icon: React.ReactNode; 
    title: string; 
    subtitle?: string; 
    onClick?: () => void;
    showArrow?: boolean;
    rightElement?: React.ReactNode;
  }) => (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors"
    >
      <div className="flex-shrink-0">{icon}</div>
      <div className="flex-1 text-left">
        <p className="font-medium text-gray-800">{title}</p>
        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
      </div>
      {rightElement}
      {showArrow && <ChevronRight className="w-5 h-5 text-gray-400" />}
    </button>
  );

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

        {/* Success Message */}
        {showSaveSuccess && (
          <div className="fixed top-20 left-4 right-4 bg-green-500 text-white p-3 rounded-lg shadow-lg z-30 flex items-center gap-2 animate-in slide-in-from-top-2">
            <Check className="w-5 h-5" />
            <span className="font-medium">Salvo com sucesso!</span>
          </div>
        )}

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

        {/* Content */}
        <div className="pb-20">
          {/* Perfil Tab */}
          {activeTab === 'perfil' && (
            <div className="space-y-4">
              {/* Informações Pessoais */}
              <div className="bg-white rounded-lg shadow-sm">
                <div className="p-4 border-b">
                  <h3 className="font-semibold text-gray-800">Informações Pessoais</h3>
                </div>
                <div className="p-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome Completo
                    </label>
                    <input
                      type="text"
                      value={nomeUsuario}
                      onChange={e => setNomeUsuario(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      E-mail
                    </label>
                    <input
                      type="email"
                      value={emailUsuario}
                      onChange={handleEmailUsuarioChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                    {erroEmailUsuario && (
                      <p className="text-red-500 text-xs mt-1">{erroEmailUsuario}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Telefone
                    </label>
                    <input
                      type="text"
                      value={telefoneUsuario}
                      onChange={e => setTelefoneUsuario(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                </div>
              </div>

              {/* Segurança */}
              <div className="bg-white rounded-lg shadow-sm">
                <div className="p-4 border-b">
                  <h3 className="font-semibold text-gray-800">Segurança</h3>
                </div>
                <div className="divide-y">
                  <MobileSettingItem
                    icon={<Key className="w-5 h-5 text-gray-600" />}
                    title="Alterar Senha"
                    subtitle="Última alteração: nunca"
                    onClick={() => {/* Abrir modal de senha */}}
                  />
                  <MobileSettingItem
                    icon={<Smartphone className="w-5 h-5 text-gray-600" />}
                    title="Autenticação em Dois Fatores"
                    subtitle="Desativado"
                    rightElement={
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        Em breve
                      </span>
                    }
                    showArrow={false}
                  />
                </div>
              </div>

              {/* Preferências */}
              <div className="bg-white rounded-lg shadow-sm">
                <div className="p-4 border-b">
                  <h3 className="font-semibold text-gray-800">Preferências</h3>
                </div>
                <div className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-gray-600" />
                      <span className="text-sm">Notificações por e-mail</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={configuracoes.notificacoes.email}
                      onChange={e => setConfiguracoes(prev => ({
                        ...prev,
                        notificacoes: { ...prev.notificacoes, email: e.target.checked }
                      }))}
                      className="rounded"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <BellRing className="w-5 h-5 text-gray-600" />
                      <span className="text-sm">Alertas de prazo</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={configuracoes.notificacoes.prazoVencimento}
                      onChange={e => setConfiguracoes(prev => ({
                        ...prev,
                        notificacoes: { ...prev.notificacoes, prazoVencimento: e.target.checked }
                      }))}
                      className="rounded"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Monitor className="w-5 h-5 text-gray-600" />
                      <span className="text-sm">Notificações do sistema</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={configuracoes.notificacoes.sistema}
                      onChange={e => setConfiguracoes(prev => ({
                        ...prev,
                        notificacoes: { ...prev.notificacoes, sistema: e.target.checked }
                      }))}
                      className="rounded"
                    />
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="p-4">
                <button
                  onClick={handleSaveProfile}
                  className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-primary-dark transition-colors"
                >
                  Salvar Alterações
                </button>
              </div>
            </div>
          )}

          {/* Notificações Tab */}
          {activeTab === 'notificacoes' && (
            <div className="space-y-4">
              <PermissionGuard resource="sistema" action="configurar">
                <div className="bg-white rounded-lg shadow-sm">
                  <div className="p-4 border-b">
                    <h3 className="font-semibold text-gray-800">Notificações de Prazo</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Configure e-mails para receber alertas
                    </p>
                  </div>
                  
                  <div className="p-4">
                    {/* Add Email Form */}
                    <div className="space-y-3 mb-4">
                      <input
                        type="email"
                        value={novoEmail}
                        onChange={(e) => setNovoEmail(e.target.value)}
                        placeholder="E-mail para notificação"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={novoDias}
                          onChange={(e) => setNovoDias(Number(e.target.value))}
                          placeholder="Dias"
                          className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                        <button
                          onClick={adicionarEmail}
                          className="flex-1 bg-secondary text-white py-2 rounded-lg text-sm font-medium"
                        >
                          Adicionar
                        </button>
                      </div>
                      {erroEmail && (
                        <p className="text-red-500 text-xs">{erroEmail}</p>
                      )}
                    </div>

                    {/* Email List */}
                    <div className="space-y-2">
                      {notificacoes.map((item, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div>
                            <p className="font-medium text-sm">{item.email}</p>
                            <p className="text-xs text-gray-500">
                              Notificar {item.dias} dias antes
                            </p>
                          </div>
                          <button
                            onClick={() => removerEmail(i)}
                            className="text-red-500 text-sm"
                          >
                            Remover
                          </button>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={handleSaveSettings}
                      className="w-full mt-4 bg-primary text-white py-2 rounded-lg text-sm font-medium"
                    >
                      Salvar Notificações
                    </button>
                  </div>
                </div>
              </PermissionGuard>
            </div>
          )}

          {/* Admin Tabs */}
          {activeTab === 'sistema' && isAdmin() && (
            <AdminArea>
              <div className="bg-white rounded-lg shadow-sm">
                <div className="p-4 border-b">
                  <h3 className="font-semibold text-gray-800">Configurações do Sistema</h3>
                </div>
                <div className="divide-y">
                  <MobileSettingItem
                    icon={<Database className="w-5 h-5 text-gray-600" />}
                    title="Backup Automático"
                    subtitle="Diário às 03:00"
                    rightElement={
                      <input type="checkbox" defaultChecked className="rounded" />
                    }
                    showArrow={false}
                  />
                  <MobileSettingItem
                    icon={<FileText className="w-5 h-5 text-gray-600" />}
                    title="Logs de Auditoria"
                    subtitle="Registrar todas as ações"
                    rightElement={
                      <input type="checkbox" defaultChecked className="rounded" />
                    }
                    showArrow={false}
                  />
                </div>
              </div>
            </AdminArea>
          )}

          {activeTab === 'usuarios' && isAdmin() && (
            <AdminArea>
              <div className="bg-white rounded-lg shadow-sm">
                <div className="p-4 border-b flex items-center justify-between">
                  <h3 className="font-semibold text-gray-800">Usuários</h3>
                  <button className="bg-primary text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-1">
                    <UserPlus className="w-4 h-4" />
                    Novo
                  </button>
                </div>
                <div className="divide-y">
                  <MobileSettingItem
                    icon={
                      <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                        <Crown className="w-5 h-5 text-yellow-600" />
                      </div>
                    }
                    title="João Silva"
                    subtitle="admin@tjba.com.br"
                    rightElement={
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        Ativo
                      </span>
                    }
                  />
                  <MobileSettingItem
                    icon={
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-gray-600" />
                      </div>
                    }
                    title="Maria Santos"
                    subtitle="usuario@tjba.com.br"
                    rightElement={
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        Ativo
                      </span>
                    }
                  />
                </div>
              </div>
            </AdminArea>
          )}

          {activeTab === 'backup' && isAdmin() && (
            <AdminArea>
              <div className="space-y-4">
                <div className="bg-white rounded-lg shadow-sm p-4">
                  <h3 className="font-semibold text-gray-800 mb-3">Backup</h3>
                  <div className="space-y-2">
                    <button className="w-full bg-blue-500 text-white py-2 rounded-lg text-sm">
                      Gerar Backup Manual
                    </button>
                    <button className="w-full bg-green-500 text-white py-2 rounded-lg text-sm">
                      Download Último Backup
                    </button>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow-sm p-4">
                  <h3 className="font-semibold text-gray-800 mb-3">Logs do Sistema</h3>
                  <div className="space-y-2">
                    <button className="w-full bg-purple-500 text-white py-2 rounded-lg text-sm">
                      Visualizar Logs
                    </button>
                    <button className="w-full bg-orange-500 text-white py-2 rounded-lg text-sm">
                      Exportar Logs
                    </button>
                  </div>
                </div>
              </div>
            </AdminArea>
          )}
        </div>

        {/* Logout Button - Fixed Bottom */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 safe-area-bottom">
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-3 text-red-600 font-medium hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sair da Conta
          </button>
        </div>
      </div>
    );
  }

  // Desktop Layout (mantido como estava)
  return (
    <div className="max-w-6xl mx-auto p-6">
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
          <Lock className="w-4 h-4" />
          Sair
        </button>
      </div>

      {/* Desktop tabs content (mantido como estava) */}
      {/* ... resto do código desktop ... */}
    </div>
  );
}