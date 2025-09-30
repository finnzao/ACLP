// Parte 1: Seção de Perfil e Segurança para app/dashboard/configuracoes/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils/cn';
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
  Shield,
  AlertCircle,
  CheckCircle
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

// Componente Principal
export default function ConfiguracoesPerfilSeguranca() {
  const { user, updateUser, logout } = useAuth();
  const { isAdmin } = usePermissions();
  const { showToast } = useToast();
  const { 
    loading, 
    alterarSenha, 
    atualizarPerfil 
  } = useUserManagement();
  
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
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

  // Atualizar campos quando user mudar
  useEffect(() => {
    if (user) {
      setNomeUsuario(user.nome || '');
      setEmailUsuario(user.email || '');
      setTelefoneUsuario(user.telefone || '');
      setDepartamentoUsuario(user.departamento || '');
    }
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;

    // Validações
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

    setIsSaving(true);

    try {
      const result = await atualizarPerfil({
        nome: nomeUsuario,
        email: emailUsuario,
        telefone: telefoneUsuario,
        departamento: departamentoUsuario
      });

      if (result.success) {
        // Atualizar contexto
        updateUser({
          nome: nomeUsuario,
          email: emailUsuario,
          telefone: telefoneUsuario,
          departamento: departamentoUsuario
        });

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
      confirmarSenha
    });

    if (result.success) {
      // Limpar campos
      setSenhaAtual('');
      setNovaSenha('');
      setConfirmarSenha('');
      setMostrarSenhaAtual(false);
      setMostrarNovaSenha(false);
      setMostrarConfirmarSenha(false);
    }
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

      {/* Perfil Tab */}
      <div className="space-y-6 mb-8">
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

      {/* Segurança Tab */}
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
    </div>
  );
}