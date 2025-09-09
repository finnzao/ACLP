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
  Check,
  MapPin,
  Building,
  Plus,
  Trash2,
  Edit
} from 'lucide-react';

// Interfaces para Comarca e Vara
interface Vara {
  id: string;
  nome: string;
  numero: string;
  especialidade: string;
  ativa: boolean;
}

interface Comarca {
  id: string;
  nome: string;
  cidade: string;
  estado: string;
  varas: Vara[];
  ativa: boolean;
  criadaEm: Date;
}

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

  // Estados para Comarcas e Varas
  const [comarcas, setComarcas] = useState<Comarca[]>([
    {
      id: '1',
      nome: 'Comarca de Salvador',
      cidade: 'Salvador',
      estado: 'BA',
      ativa: true,
      criadaEm: new Date(),
      varas: [
        { id: '1', nome: '1ª Vara de Execuções Penais', numero: '001', especialidade: 'Criminal', ativa: true },
        { id: '2', nome: '2ª Vara de Execuções Penais', numero: '002', especialidade: 'Criminal', ativa: true }
      ]
    }
  ]);

  // Estados do formulário unificado
  const [formularioComarca, setFormularioComarca] = useState({
    nome: '',
    cidade: '',
    estado: '',
    varas: [{ nome: '', numero: '', especialidade: '' }] as Array<{ nome: string; numero: string; especialidade: string }>
  });
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  // Configurações do usuário (removidas preferências, mantido apenas notificações)
  const [configuracoes, setConfiguracoes] = useState({
    notificacoes: user?.configuracoes?.notificacoes || {
      sistema: true,
    },
    interface: user?.configuracoes?.interface || {
      tema: 'light' as const,
      itensPerPage: 20,
      idioma: 'pt-BR' as const,
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

  // Funções de notificação
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

  // Funções de Comarca e Vara
  const adicionarVaraFormulario = () => {
    setFormularioComarca(prev => ({
      ...prev,
      varas: [...prev.varas, { nome: '', numero: '', especialidade: '' }]
    }));
  };

  const removerVaraFormulario = (index: number) => {
    if (formularioComarca.varas.length > 1) {
      setFormularioComarca(prev => ({
        ...prev,
        varas: prev.varas.filter((_, i) => i !== index)
      }));
    }
  };

  const atualizarVaraFormulario = (index: number, campo: string, valor: string) => {
    setFormularioComarca(prev => ({
      ...prev,
      varas: prev.varas.map((vara, i) => 
        i === index ? { ...vara, [campo]: valor } : vara
      )
    }));
  };

  const salvarComarca = () => {
    // Validações
    if (!formularioComarca.nome || !formularioComarca.cidade || !formularioComarca.estado) {
      alert('Preencha todos os campos da comarca');
      return;
    }

    const varasInvalidas = formularioComarca.varas.some(vara => 
      !vara.nome || !vara.numero || !vara.especialidade
    );

    if (varasInvalidas) {
      alert('Preencha todos os campos das varas');
      return;
    }

    // Criar varas com IDs únicos
    const varas: Vara[] = formularioComarca.varas.map((vara, index) => ({
      id: `${Date.now()}-${index}`,
      nome: vara.nome,
      numero: vara.numero,
      especialidade: vara.especialidade,
      ativa: true
    }));

    // Criar comarca
    const comarca: Comarca = {
      id: Date.now().toString(),
      nome: formularioComarca.nome,
      cidade: formularioComarca.cidade,
      estado: formularioComarca.estado.toUpperCase(),
      varas,
      ativa: true,
      criadaEm: new Date()
    };

    setComarcas(prev => [...prev, comarca]);
    setFormularioComarca({
      nome: '',
      cidade: '',
      estado: '',
      varas: [{ nome: '', numero: '', especialidade: '' }]
    });
    setMostrarFormulario(false);
    setShowSaveSuccess(true);
    setTimeout(() => setShowSaveSuccess(false), 3000);
  };

  const cancelarFormulario = () => {
    setFormularioComarca({
      nome: '',
      cidade: '',
      estado: '',
      varas: [{ nome: '', numero: '', especialidade: '' }]
    });
    setMostrarFormulario(false);
  };

  const removerComarca = (comarcaId: string) => {
    if (confirm('Tem certeza que deseja remover esta comarca? Esta ação não pode ser desfeita.')) {
      setComarcas(prev => prev.filter(comarca => comarca.id !== comarcaId));
      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 3000);
    }
  };

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

              {/* Notificações do Sistema */}
              <div className="bg-white rounded-lg shadow-sm">
                <div className="p-4 border-b">
                  <h3 className="font-semibold text-gray-800">Notificações</h3>
                </div>
                <div className="p-4">
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

          {/* Sistema Tab - Comarcas e Varas */}
          {activeTab === 'sistema' && isAdmin() && (
            <AdminArea>
              <div className="space-y-4">
                {/* Adicionar Nova Comarca */}
                <div className="bg-white rounded-lg shadow-sm">
                  <div className="p-4 border-b">
                    <h3 className="font-semibold text-gray-800">Nova Comarca</h3>
                  </div>
                  <div className="p-4 space-y-3">
                    <input
                      type="text"
                      value={novaComarca.nome}
                      onChange={(e) => setNovaComarca(prev => ({ ...prev, nome: e.target.value }))}
                      placeholder="Nome da Comarca"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={novaComarca.cidade}
                        onChange={(e) => setNovaComarca(prev => ({ ...prev, cidade: e.target.value }))}
                        placeholder="Cidade"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                      <input
                        type="text"
                        value={novaComarca.estado}
                        onChange={(e) => setNovaComarca(prev => ({ ...prev, estado: e.target.value }))}
                        placeholder="UF"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        maxLength={2}
                      />
                    </div>
                    <button
                      onClick={adicionarComarca}
                      className="w-full bg-blue-500 text-white py-2 rounded-lg text-sm font-medium"
                    >
                      Criar Comarca
                    </button>
                  </div>
                </div>

                {/* Lista de Comarcas */}
                {comarcas.map((comarca) => (
                  <div key={comarca.id} className="bg-white rounded-lg shadow-sm">
                    <div className="p-4 border-b">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-800">{comarca.nome}</h3>
                          <p className="text-sm text-gray-600">{comarca.cidade} - {comarca.estado}</p>
                        </div>
                        <button
                          onClick={() => removerComarca(comarca.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="p-4">
                      {/* Adicionar Nova Vara */}
                      {comarcaSelecionada === comarca.id ? (
                        <div className="space-y-3 mb-4 p-3 bg-gray-50 rounded-lg">
                          <input
                            type="text"
                            value={novaVara.nome}
                            onChange={(e) => setNovaVara(prev => ({ ...prev, nome: e.target.value }))}
                            placeholder="Nome da Vara"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={novaVara.numero}
                              onChange={(e) => setNovaVara(prev => ({ ...prev, numero: e.target.value }))}
                              placeholder="Número"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            />
                            <input
                              type="text"
                              value={novaVara.especialidade}
                              onChange={(e) => setNovaVara(prev => ({ ...prev, especialidade: e.target.value }))}
                              placeholder="Especialidade"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => adicionarVara(comarca.id)}
                              className="flex-1 bg-green-500 text-white py-2 rounded-lg text-sm font-medium"
                            >
                              Salvar Vara
                            </button>
                            <button
                              onClick={() => {
                                setComarcaSelecionada(null);
                                setNovaVara({ nome: '', numero: '', especialidade: '' });
                              }}
                              className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setComarcaSelecionada(comarca.id)}
                          className="w-full bg-green-100 text-green-700 py-2 rounded-lg text-sm font-medium mb-4 flex items-center justify-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          Adicionar Vara
                        </button>
                      )}

                      {/* Lista de Varas */}
                      <div className="space-y-2">
                        {comarca.varas.map((vara) => (
                          <div key={vara.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="font-medium text-sm">{vara.nome}</p>
                              <p className="text-xs text-gray-500">
                                Nº {vara.numero} • {vara.especialidade}
                              </p>
                            </div>
                            <button
                              onClick={() => removerVara(comarca.id, vara.id)}
                              className="text-red-500 text-sm p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
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

  // Desktop Layout
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

      {/* Success Message */}
      {showSaveSuccess && (
        <div className="fixed top-4 right-4 bg-green-500 text-white p-3 rounded-lg shadow-lg z-30 flex items-center gap-2 animate-in slide-in-from-top-2">
          <Check className="w-5 h-5" />
          <span className="font-medium">Salvo com sucesso!</span>
        </div>
      )}

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

      {/* Perfil do Usuário */}
      {activeTab === 'perfil' && (
        <div className="space-y-6">
          <section className="bg-white p-6 rounded-xl shadow space-y-4">
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
                label="E-mail"
                type="email"
                value={emailUsuario}
                onChange={handleEmailUsuarioChange}
                placeholder="E-mail"
                error={erroEmailUsuario}
              />
            </div>
            
            <InputGroup 
              label="Telefone"
              value={telefoneUsuario} 
              onChange={e => setTelefoneUsuario(e.target.value)} 
              placeholder="(00) 00000-0000" 
            />

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-blue-800">Informações do Perfil</span>
              </div>
              <div className="text-sm text-blue-700 space-y-1">
                <p><strong>Tipo de Usuário:</strong> {isAdmin() ? 'Administrador' : 'Usuário'}</p>
                <p><strong>Departamento:</strong> {user?.departamento || 'Não informado'}</p>
                <p><strong>Último Login:</strong> {user?.ultimoLogin ? new Date(user.ultimoLogin).toLocaleString('pt-BR') : 'Nunca'}</p>
              </div>
            </div>
          </section>

          <section className="bg-white p-6 rounded-xl shadow space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <Lock className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-medium text-primary-dark">Segurança</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <InputGroup 
                  label="Nova Senha"
                  type={mostrarSenha ? "text" : "password"} 
                  value={novaSenha} 
                  onChange={e => setNovaSenha(e.target.value)} 
                  placeholder="Digite a nova senha" 
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
                >
                  {mostrarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              
              <InputGroup 
                label="Confirmar Nova Senha"
                type={mostrarSenha ? "text" : "password"} 
                value={confirmarSenha} 
                onChange={e => setConfirmarSenha(e.target.value)} 
                placeholder="Confirme a nova senha" 
              />
            </div>

            {novaSenha && confirmarSenha && novaSenha !== confirmarSenha && (
              <p className="text-red-500 text-sm">As senhas não coincidem</p>
            )}
          </section>

          <section className="bg-white p-6 rounded-xl shadow space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <Settings className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-medium text-primary-dark">Notificações</h3>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={configuracoes.notificacoes.sistema}
                  onChange={e => setConfiguracoes(prev => ({
                    ...prev,
                    notificacoes: { ...prev.notificacoes, sistema: e.target.checked }
                  }))}
                  className="rounded"
                />
                <span className="text-sm">Notificações do sistema</span>
              </label>
            </div>
          </section>

          <div className="flex justify-end">
            <button 
              onClick={handleSaveProfile}
              className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Salvar Perfil
            </button>
          </div>
        </div>
      )}

      {/* Notificações */}
      {activeTab === 'notificacoes' && (
        <section className="bg-white p-6 rounded-xl shadow space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-medium text-primary-dark">Notificações de Prazo</h3>
            </div>
            <PermissionIndicator resource="sistema" action="configurar" />
          </div>

          <PermissionGuard resource="sistema" action="configurar">
            <label className="block font-medium mb-1">Adicionar nova notificação</label>
            <div className="flex gap-2 mb-4">
              <div className="flex-1">
                <InputGroup
                  type="email"
                  value={novoEmail}
                  onChange={(e) => setNovoEmail(e.target.value)}
                  placeholder="E-mail"
                  error={erroEmail}
                />
              </div>
              <InputGroup
                type="number"
                value={novoDias}
                onChange={(e) => setNovoDias(Number(e.target.value))}
                placeholder="Dias"
                className="w-28"
              />
              <button
                type="button"
                onClick={adicionarEmail}
                className="bg-secondary text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
              >
                Adicionar
              </button>
            </div>

            <ul className="space-y-2 text-sm">
              {notificacoes.map((item, i) => (
                <NotificacaoItem
                  key={i}
                  email={item.email}
                  dias={item.dias}
                  editando={editando === i}
                  editandoEmail={editandoEmail}
                  editandoDias={editandoDias}
                  error={editando === i ? erroEdicao : ''}
                  onChangeEmail={(e) => setEditandoEmail(e.target.value)}
                  onChangeDias={(e) => setEditandoDias(Number(e.target.value))}
                  onSalvar={() => salvarEdicao(i)}
                  onEditar={() => iniciarEdicao(i)}
                  onRemover={() => removerEmail(i)}
                />
              ))}
            </ul>

            <button 
              onClick={handleSaveSettings}
              className="bg-primary text-white px-5 py-2 rounded hover:bg-primary-dark flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Salvar Notificações
            </button>
          </PermissionGuard>
        </section>
      )}

      {/* Sistema - Comarcas e Varas */}
      {activeTab === 'sistema' && (
        <AdminArea>
          <div className="space-y-6">
            <section className="bg-white p-6 rounded-xl shadow">
              <h3 className="text-lg font-medium text-primary-dark mb-4 flex items-center gap-2">
                <Building className="w-5 h-5" />
                Gestão de Comarcas e Varas
              </h3>
              
              {/* Formulário Unificado para Comarca e Varas */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-blue-900">Gestão de Comarcas e Varas</h4>
                  <button
                    onClick={() => setMostrarFormulario(!mostrarFormulario)}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    {mostrarFormulario ? 'Cancelar' : 'Nova Comarca'}
                  </button>
                </div>

                {mostrarFormulario && (
                  <div className="space-y-4">
                    {/* Dados da Comarca */}
                    <div className="bg-white rounded-lg p-4">
                      <h5 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                        <Building className="w-4 h-4" />
                        Dados da Comarca
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <InputGroup
                          label="Nome da Comarca"
                          value={formularioComarca.nome}
                          onChange={(e) => setFormularioComarca(prev => ({ ...prev, nome: e.target.value }))}
                          placeholder="Ex: Comarca de Salvador"
                        />
                        <InputGroup
                          label="Cidade"
                          value={formularioComarca.cidade}
                          onChange={(e) => setFormularioComarca(prev => ({ ...prev, cidade: e.target.value }))}
                          placeholder="Salvador"
                        />
                        <InputGroup
                          label="Estado (UF)"
                          value={formularioComarca.estado}
                          onChange={(e) => setFormularioComarca(prev => ({ ...prev, estado: e.target.value.toUpperCase() }))}
                          placeholder="BA"
                          maxLength={2}
                        />
                      </div>
                    </div>

                    {/* Varas */}
                    <div className="bg-white rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="font-medium text-gray-800 flex items-center gap-2">
                          ⚖️ Varas ({formularioComarca.varas.length})
                        </h5>
                        <button
                          onClick={adicionarVaraFormulario}
                          className="bg-green-500 text-white px-3 py-1.5 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-1 text-sm"
                        >
                          <Plus className="w-3 h-3" />
                          Adicionar Vara
                        </button>
                      </div>
                      
                      <div className="space-y-3">
                        {formularioComarca.varas.map((vara, index) => (
                          <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end p-3 bg-gray-50 rounded-lg border">
                            <InputGroup
                              label="Nome da Vara"
                              value={vara.nome}
                              onChange={(e) => atualizarVaraFormulario(index, 'nome', e.target.value)}
                              placeholder="1ª Vara de Execuções Penais"
                            />
                            <InputGroup
                              label="Número"
                              value={vara.numero}
                              onChange={(e) => atualizarVaraFormulario(index, 'numero', e.target.value)}
                              placeholder="001"
                            />
                            <InputGroup
                              label="Especialidade"
                              value={vara.especialidade}
                              onChange={(e) => atualizarVaraFormulario(index, 'especialidade', e.target.value)}
                              placeholder="Criminal"
                            />
                            <div className="flex justify-end">
                              {formularioComarca.varas.length > 1 && (
                                <button
                                  onClick={() => removerVaraFormulario(index)}
                                  className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                                  title="Remover vara"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Botões de Ação */}
                    <div className="flex gap-3">
                      <button
                        onClick={salvarComarca}
                        className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                      >
                        <Save className="w-4 h-4" />
                        Salvar Comarca
                      </button>
                      <button
                        onClick={cancelarFormulario}
                        className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Lista de Comarcas Existentes */}
              <div className="space-y-4">
                {comarcas.map((comarca) => (
                  <div key={comarca.id} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 p-4 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            {comarca.nome}
                          </h4>
                          <p className="text-sm text-gray-600">{comarca.cidade} - {comarca.estado}</p>
                          <p className="text-xs text-gray-500">
                            {comarca.varas.length} vara(s) • Criada em {comarca.criadaEm.toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <button
                          onClick={() => removerComarca(comarca.id)}
                          className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                          title="Remover comarca"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="p-4">
                      {comarca.varas.length > 0 ? (
                        <div className="space-y-2">
                          <h5 className="font-medium text-gray-700 text-sm mb-3">Varas Cadastradas</h5>
                          {comarca.varas.map((vara) => (
                            <div key={vara.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div>
                                <p className="font-medium text-sm">{vara.nome}</p>
                                <p className="text-xs text-gray-500">
                                  Número: {vara.numero} • Especialidade: {vara.especialidade}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                                  Ativa
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm text-center py-4">
                          Nenhuma vara cadastrada para esta comarca
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {comarcas.length === 0 && (
                <div className="text-center py-8">
                  <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhuma comarca cadastrada</p>
                  <p className="text-gray-400 text-sm">Adicione uma comarca para começar</p>
                </div>
              )}
            </section>
          </div>
        </AdminArea>
      )}

      {/* Usuários */}
      {activeTab === 'usuarios' && (
        <AdminArea>
          <div className="space-y-6">
            <section className="bg-white p-6 rounded-xl shadow">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-primary-dark">Gerenciar Usuários</h3>
                <button className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark flex items-center gap-2">
                  <UserPlus className="w-4 h-4" />
                  Novo Usuário
                </button>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Crown className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">João Silva</p>
                      <p className="text-sm text-gray-600">admin@tjba.com.br • Administrador</p>
                    </div>
                  </div>
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Ativo</span>
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium">Maria Santos</p>
                      <p className="text-sm text-gray-600">usuario@tjba.com.br • Usuário</p>
                    </div>
                  </div>
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Ativo</span>
                </div>
              </div>
            </section>
          </div>
        </AdminArea>
      )}

      {/* Backup & Logs */}
      {activeTab === 'backup' && (
        <AdminArea>
          <div className="space-y-6">
            <section className="bg-white p-6 rounded-xl shadow">
              <h3 className="text-lg font-medium text-primary-dark mb-4">Backup e Logs</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Backup</h4>
                  <div className="space-y-3">
                    <button className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600">
                      Gerar Backup Manual
                    </button>
                    <button className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600">
                      Download Último Backup
                    </button>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-3">Logs do Sistema</h4>
                  <div className="space-y-3">
                    <button className="w-full bg-purple-500 text-white py-2 rounded hover:bg-purple-600">
                      <FileText className="w-4 h-4 inline mr-2" />
                      Visualizar Logs
                    </button>
                    <button className="w-full bg-orange-500 text-white py-2 rounded hover:bg-orange-600">
                      Exportar Logs
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </AdminArea>
      )}

      {/* Aviso para usuários sem permissão */}
      {!availableTabs.some(tab => tab.id === activeTab) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <AlertCircle className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">Acesso Restrito</h3>
          <p className="text-yellow-700">
            Você não tem permissão para acessar esta seção. Entre em contato com um administrador se precisar de acesso.
          </p>
        </div>
      )}
    </div>
  );
}