// painel-web/app/dashboard/registrar/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePermissions, useAudit } from '@/contexts/AuthContext';
import { PermissionGuard } from '@/components/PermissionGuard';
import { Lock, Shield, AlertTriangle, ArrowLeft, UserPlus, CheckCircle } from 'lucide-react';

// Componente original de cadastro simplificado
function OriginalRegistrarPage() {
  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    rg: '',
    contato: '',
    processo: '',
    vara: '',
    comarca: '',
    decisao: '',
    periodicidade: 'mensal',
    dataComparecimentoInicial: ''
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Simular salvamento
      await new Promise(resolve => setTimeout(resolve, 2000));
      setSuccess(true);
      setTimeout(() => {
        router.push('/dashboard/geral');
      }, 2000);
    } catch (error) {
      console.error('Erro ao cadastrar:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center border border-green-100">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-green-800 mb-3">
              Cadastro Realizado!
            </h1>
            <p className="text-green-700 mb-6">
              A pessoa foi cadastrada com sucesso no sistema.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
            <UserPlus className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-primary-dark">Cadastrar Nova Pessoa</h1>
            <p className="text-gray-600">Adicione uma nova pessoa ao sistema de comparecimentos</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nome Completo *</label>
              <input
                type="text"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Digite o nome completo"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">CPF</label>
              <input
                type="text"
                name="cpf"
                value={formData.cpf}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="000.000.000-00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">RG</label>
              <input
                type="text"
                name="rg"
                value={formData.rg}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="00.000.000-0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Contato *</label>
              <input
                type="text"
                name="contato"
                value={formData.contato}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="(00) 00000-0000"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Número do Processo *</label>
              <input
                type="text"
                name="processo"
                value={formData.processo}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="0000000-00.0000.0.00.0000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Vara *</label>
              <input
                type="text"
                name="vara"
                value={formData.vara}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Ex: 1ª Vara Criminal"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Comarca *</label>
              <input
                type="text"
                name="comarca"
                value={formData.comarca}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Ex: Salvador"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Data da Decisão *</label>
              <input
                type="date"
                name="decisao"
                value={formData.decisao}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Periodicidade *</label>
              <select
                name="periodicidade"
                value={formData.periodicidade}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="mensal">Mensal</option>
                <option value="bimensal">Bimensal</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Data do Primeiro Comparecimento *</label>
              <input
                type="date"
                name="dataComparecimentoInicial"
                value={formData.dataComparecimentoInicial}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex justify-between items-center pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex items-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-8 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Salvando...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Cadastrar Pessoa
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProtectedRegistrarPage() {
  const router = useRouter();
  const { canCreatePeople, isAdmin } = usePermissions();
  const { logAction } = useAudit();

  useEffect(() => {
    // Log da tentativa de acesso
    logAction('page_access', 'registrar_pessoa', { 
      hasPermission: canCreatePeople(),
      userType: isAdmin() ? 'admin' : 'usuario' 
    });
  }, [canCreatePeople, isAdmin, logAction]);

  // Componente de acesso negado personalizado
  const AccessDeniedContent = () => (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center border border-red-100">
          {/* Ícone de bloqueio */}
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-10 h-10 text-red-600" />
          </div>

          {/* Título e mensagem */}
          <h1 className="text-2xl font-bold text-red-800 mb-3">
            Acesso Negado
          </h1>
          
          <div className="space-y-3 mb-6">
            <p className="text-red-700 font-medium">
              Você não tem permissão para cadastrar novas pessoas.
            </p>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="text-left">
                  <p className="text-sm font-medium text-red-800 mb-1">
                    Funcionalidade Restrita
                  </p>
                  <p className="text-sm text-red-700">
                    O cadastro de novas pessoas é uma funcionalidade exclusiva para 
                    administradores do sistema. Esta restrição existe para garantir 
                    a integridade e segurança dos dados.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-left">
                  <p className="text-sm font-medium text-blue-800 mb-1">
                    Suas Permissões Atuais
                  </p>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Visualizar lista de pessoas</li>
                    <li>• Registrar comparecimentos</li>
                    <li>• Exportar relatórios</li>
                    <li>• Verificar reconhecimento facial</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Ações disponíveis */}
          <div className="space-y-3">
            <button
              onClick={() => router.push('/dashboard/geral')}
              className="w-full bg-primary text-white py-3 px-4 rounded-lg hover:bg-primary-dark transition-colors font-medium flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar ao Painel Geral
            </button>

            <button
              onClick={() => router.push('/dashboard/comparecimento/confirmar')}
              className="w-full bg-green-500 text-white py-3 px-4 rounded-lg hover:bg-green-600 transition-colors font-medium"
            >
              Registrar Comparecimento
            </button>

            <div className="pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 mb-2">
                Precisa cadastrar uma nova pessoa?
              </p>
              <p className="text-sm text-gray-700">
                Entre em contato com um <strong>administrador</strong> do sistema 
                para solicitar o cadastro ou elevação de suas permissões.
              </p>
            </div>
          </div>
        </div>

        {/* Informações de contato (opcional) */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            <strong>Suporte:</strong> suporte@tjba.jus.br
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <PermissionGuard
      resource="pessoas"
      action="cadastrar"
      fallback={<AccessDeniedContent />}
      showMessage={false}
    >
      <OriginalRegistrarPage />
    </PermissionGuard>
  );
}

// Wrapper para auditoria de tentativas de acesso
export function withPermissionAudit<T extends object>(
  Component: React.ComponentType<T>,
  resource: string,
  action: string
) {
  return function PermissionAuditWrapper(props: T) {
    const { logAction } = useAudit();
    const { hasPermission } = usePermissions();

    useEffect(() => {
      logAction('permission_check', resource, {
        action,
        granted: hasPermission(resource, action),
        timestamp: new Date().toISOString()
      });
    }, [logAction, hasPermission]);

    return <Component {...props} />;
  };
}