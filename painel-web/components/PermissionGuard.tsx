'use client';

import { ReactNode } from 'react';
import { usePermissions } from '@/contexts/AuthContext';
import { Shield, Lock, AlertTriangle } from 'lucide-react';

interface PermissionGuardProps {
  resource: string;
  action: string;
  children: ReactNode;
  fallback?: ReactNode;
  showMessage?: boolean;
  requireAll?: boolean;
}

interface MultiPermissionGuardProps {
  permissions: Array<{
    resource: string;
    action: string;
  }>;
  children: ReactNode;
  fallback?: ReactNode;
  showMessage?: boolean;
  requireAll?: boolean;
}

// Componente para verificar uma única permissão
export function PermissionGuard({
  resource,
  action,
  children,
  fallback = null,
  showMessage = true
}: PermissionGuardProps) {
  const { hasPermission } = usePermissions();
  
  const hasAccess = hasPermission(resource, action);
  
  if (hasAccess) {
    return <>{children}</>;
  }
  
  if (fallback) {
    return <>{fallback}</>;
  }
  
  if (showMessage) {
    return <PermissionDeniedMessage />;
  }
  
  return null;
}

// Componente para verificar múltiplas permissões
export function MultiPermissionGuard({
  permissions,
  children,
  fallback = null,
  showMessage = true,
  requireAll = true
}: MultiPermissionGuardProps) {
  const { hasPermission } = usePermissions();
  
  const hasAccess = requireAll
    ? permissions.every(p => hasPermission(p.resource, p.action))
    : permissions.some(p => hasPermission(p.resource, p.action));
  
  if (hasAccess) {
    return <>{children}</>;
  }
  
  if (fallback) {
    return <>{fallback}</>;
  }
  
  if (showMessage) {
    return <PermissionDeniedMessage />;
  }
  
  return null;
}

// Componente para verificar se é admin
export function AdminGuard({
  children,
  fallback = null,
  showMessage = true
}: {
  children: ReactNode;
  fallback?: ReactNode;
  showMessage?: boolean;
}) {
  const { isAdmin } = usePermissions();
  
  if (isAdmin()) {
    return <>{children}</>;
  }
  
  if (fallback) {
    return <>{fallback}</>;
  }
  
  if (showMessage) {
    return <PermissionDeniedMessage message="Esta funcionalidade é restrita a administradores" />;
  }
  
  return null;
}

// Componente para mostrar conteúdo apenas para usuários comuns
export function UserOnlyGuard({
  children,
  fallback = null
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { isUsuario } = usePermissions();
  
  if (isUsuario()) {
    return <>{children}</>;
  }
  
  return <>{fallback}</>;
}

// Mensagem padrão de permissão negada
function PermissionDeniedMessage({ 
  message = "Você não tem permissão para acessar esta funcionalidade" 
}: { 
  message?: string 
}) {
  return (
    <div className="flex items-center justify-center p-8 bg-red-50 border border-red-200 rounded-lg">
      <div className="text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8 text-red-600" />
        </div>
        <h3 className="text-lg font-semibold text-red-800 mb-2">Acesso Negado</h3>
        <p className="text-red-600 max-w-md">{message}</p>
        <p className="text-sm text-red-500 mt-2">
          Entre em contato com um administrador se precisar de acesso a esta funcionalidade.
        </p>
      </div>
    </div>
  );
}

// Componente para desabilitar elementos baseado em permissões
interface ConditionalWrapperProps {
  condition: boolean;
  wrapper: (children: ReactNode) => ReactNode;
  children: ReactNode;
}

export function ConditionalWrapper({ condition, wrapper, children }: ConditionalWrapperProps) {
  return condition ? wrapper(children) : <>{children}</>;
}

// Hook para envolver elementos com base em permissões
export function usePermissionWrapper() {
  const { hasPermission } = usePermissions();
  
  const wrapWithPermission = (
    resource: string,
    action: string
  ) => {
    return (children: ReactNode) => (
      <PermissionGuard resource={resource} action={action} showMessage={false}>
        {children}
      </PermissionGuard>
    );
  };
  
  const disableIfNoPermission = (
    resource: string,
    action: string
  ) => {
    const hasAccess = hasPermission(resource, action);
    
    return (children: ReactNode) => (
      <ConditionalWrapper
        condition={!hasAccess}
        wrapper={(children) => (
          <div className="relative">
            <div className="opacity-50 pointer-events-none">
              {children}
            </div>
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50 bg-opacity-75 rounded">
              <div className="flex items-center gap-2 text-gray-600 text-sm">
                <Shield className="w-4 h-4" />
                <span>Sem permissão</span>
              </div>
            </div>
          </div>
        )}
      >
        {children}
      </ConditionalWrapper>
    );
  };
  
  return {
    wrapWithPermission,
    disableIfNoPermission
  };
}

// Componente para mostrar indicador de permissão
export function PermissionIndicator({
  resource,
  action,
  showWhenDenied = false,
  className = ""
}: {
  resource: string;
  action: string;
  showWhenDenied?: boolean;
  className?: string;
}) {
  const { hasPermission } = usePermissions();
  const hasAccess = hasPermission(resource, action);
  
  if (!hasAccess && !showWhenDenied) {
    return null;
  }
  
  return (
    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${
      hasAccess 
        ? 'bg-green-100 text-green-700' 
        : 'bg-red-100 text-red-700'
    } ${className}`}>
      {hasAccess ? (
        <>
          <Shield className="w-3 h-3" />
          <span>Permitido</span>
        </>
      ) : (
        <>
          <Lock className="w-3 h-3" />
          <span>Bloqueado</span>
        </>
      )}
    </div>
  );
}

// Componente para área administrativa
export function AdminArea({ children }: { children: ReactNode }) {
  return (
    <AdminGuard
      fallback={
        <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-yellow-600" />
            <div>
              <h3 className="font-semibold text-yellow-800">Área Administrativa</h3>
              <p className="text-yellow-700 text-sm">
                Esta seção é restrita a administradores do sistema.
              </p>
            </div>
          </div>
        </div>
      }
    >
      <div className="border-l-4 border-l-blue-500 pl-4">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-blue-600" />
          <span className="text-sm font-medium text-blue-800">Área Administrativa</span>
        </div>
        {children}
      </div>
    </AdminGuard>
  );
}