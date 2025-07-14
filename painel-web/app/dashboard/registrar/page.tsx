// painel-web/app/dashboard/registrar/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePermissions, useAudit } from '@/contexts/AuthContext';
import { PermissionGuard } from '@/components/PermissionGuard';
import { Lock, Shield, AlertTriangle, ArrowLeft } from 'lucide-react';

// Importar o componente original de cadastro
import OriginalRegistrarPage from '@/components/OriginalRegistrarPage';

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
export function withPermissionAudit<T extends {}>(
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
        granted: hasPermission(resource as any, action as any),
        timestamp: new Date().toISOString()
      });
    }, [logAction, hasPermission]);

    return <Component {...props} />;
  };
}