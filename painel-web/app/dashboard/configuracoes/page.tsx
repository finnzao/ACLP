'use client';

import { useState } from 'react';
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
  Crown
} from 'lucide-react';

const tabs = [
  'Perfil do Usuário', 
  'Notificações', 
  'Sistema',
  'Usuários',
  'Backup & Logs'
] as const;
type Tab = typeof tabs[number];

export default function ConfiguracoesPage() {
  const { user, updateUser, logout } = useAuth();
  const { isAdmin, hasPermission } = usePermissions();
  
  const [activeTab, setActiveTab] = useState<Tab>('Perfil do Usuário');
  
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

  // Verificar se o usuário pode ver determinadas abas
  const canViewTab = (tab: Tab): boolean => {
    switch (tab) {
      case 'Perfil do Usuário':
      case 'Notificações':
        return true;
      case 'Sistema':
        return hasPermission('sistema', 'configurar');
      case 'Usuários':
        return hasPermission('sistema', 'gerenciarUsuarios');
      case 'Backup & Logs':
        return hasPermission('sistema', 'backup') || hasPermission('sistema', 'logs');
      default:
        return false;
    }
  };

  // Filtrar abas disponíveis
  const availableTabs = tabs.filter(canViewTab);

  // Funções de notificações
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

    alert('Perfil atualizado com sucesso!');
  };

  const handleSaveSettings = () => {
    updateUser({ configuracoes });
    alert('Configurações salvas com sucesso!');
  };

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

      <div className="flex gap-4 mb-8 border-b border-border pb-2 overflow-x-auto">
        {availableTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap flex items-center gap-2',
              activeTab === tab ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            {tab === 'Perfil do Usuário' && <User className="w-4 h-4" />}
            {tab === 'Notificações' && <Bell className="w-4 h-4" />}
            {tab === 'Sistema' && <Settings className="w-4 h-4" />}
            {tab === 'Usuários' && <Users className="w-4 h-4" />}
            {tab === 'Backup & Logs' && <Database className="w-4 h-4" />}
            {tab}
            {(tab === 'Sistema' || tab === 'Usuários' || tab === 'Backup & Logs') && (
              <Shield className="w-3 h-3 text-yellow-500" />
            )}
          </button>
        ))}
      </div>

      {/* Perfil do Usuário */}
      {activeTab === 'Perfil do Usuário' && (
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
              <h3 className="text-lg font-medium text-primary-dark">Preferências</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3">Notificações</h4>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={configuracoes.notificacoes.email}
                      onChange={e => setConfiguracoes(prev => ({
                        ...prev,
                        notificacoes: { ...prev.notificacoes, email: e.target.checked }
                      }))}
                      className="rounded"
                    />
                    <span className="text-sm">Notificações por e-mail</span>
                  </label>
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
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={configuracoes.notificacoes.prazoVencimento}
                      onChange={e => setConfiguracoes(prev => ({
                        ...prev,
                        notificacoes: { ...prev.notificacoes, prazoVencimento: e.target.checked }
                      }))}
                      className="rounded"
                    />
                    <span className="text-sm">Alertas de prazo</span>
                  </label>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3">Interface</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Itens por página</label>
                    <select
                      value={configuracoes.interface.itensPerPage}
                      onChange={e => setConfiguracoes(prev => ({
                        ...prev,
                        interface: { ...prev.interface, itensPerPage: Number(e.target.value) }
                      }))}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                </div>
              </div>
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
      {activeTab === 'Notificações' && (
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

      {/* Sistema */}
      {activeTab === 'Sistema' && (
        <AdminArea>
          <div className="space-y-6">
            <section className="bg-white p-6 rounded-xl shadow">
              <h3 className="text-lg font-medium text-primary-dark mb-4">Configurações do Sistema</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h4 className="font-medium">Backup Automático</h4>
                    <p className="text-sm text-gray-600">Realizar backup diário dos dados</p>
                  </div>
                  <input type="checkbox" defaultChecked className="rounded" />
                </div>
                
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h4 className="font-medium">Logs de Auditoria</h4>
                    <p className="text-sm text-gray-600">Registrar todas as ações dos usuários</p>
                  </div>
                  <input type="checkbox" defaultChecked className="rounded" />
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h4 className="font-medium">Reconhecimento Facial</h4>
                    <p className="text-sm text-gray-600">Ativar verificação biométrica</p>
                  </div>
                  <input type="checkbox" defaultChecked className="rounded" />
                </div>
              </div>
            </section>
          </div>
        </AdminArea>
      )}

      {/* Usuários */}
      {activeTab === 'Usuários' && (
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
      {activeTab === 'Backup & Logs' && (
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
      {!availableTabs.includes(activeTab) && (
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