// painel-web/contexts/AuthContext.tsx
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, UserPermissions, AuthContextType, UserRole, ROLE_PERMISSIONS } from '@/types/user';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

// Usuários fictícios para desenvolvimento
const MOCK_USERS: User[] = [
  {
    id: '1',
    nome: 'João Silva',
    email: 'admin@tjba.com.br',
    role: 'admin',
    departamento: 'Central de Comparecimentos',
    telefone: '(71) 9999-9999',
    ativo: true,
    criadoEm: '2024-01-01T00:00:00.000Z',
    ultimoLogin: new Date().toISOString(),
    configuracoes: {
      notificacoes: {
        email: true,
        sistema: true,
        prazoVencimento: true,
      },
      interface: {
        tema: 'light',
        itensPerPage: 20,
        idioma: 'pt-BR',
      },
      privacidade: {
        mostrarEmail: true,
        mostrarTelefone: false,
      },
    },
  },
  {
    id: '2',
    nome: 'Maria Santos',
    email: 'usuario@tjba.com.br',
    role: 'usuario',
    departamento: 'Atendimento',
    telefone: '(71) 8888-8888',
    ativo: true,
    criadoEm: '2024-01-15T00:00:00.000Z',
    ultimoLogin: new Date().toISOString(),
    configuracoes: {
      notificacoes: {
        email: true,
        sistema: false,
        prazoVencimento: true,
      },
      interface: {
        tema: 'light',
        itensPerPage: 10,
        idioma: 'pt-BR',
      },
      privacidade: {
        mostrarEmail: false,
        mostrarTelefone: false,
      },
    },
  },
];

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar usuário do localStorage na inicialização
  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = localStorage.getItem('auth-token');
        const savedUser = localStorage.getItem('auth-user');
        
        if (token && savedUser) {
          const userData = JSON.parse(savedUser);
          setUser(userData);
          setPermissions(ROLE_PERMISSIONS[userData.role]);
        }
      } catch (error) {
        console.error('Erro ao carregar usuário:', error);
        // Limpar dados corrompidos
        localStorage.removeItem('auth-token');
        localStorage.removeItem('auth-user');
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // Simular chamada à API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Verificar credenciais (simulação)
      const foundUser = MOCK_USERS.find(u => u.email === email);
      
      if (!foundUser) {
        return false;
      }
      
      // Verificar senha (em produção seria hash)
      const validPasswords = {
        'admin@tjba.com.br': '123',
        'usuario@tjba.com.br': '123'
      };
      
      if (validPasswords[email as keyof typeof validPasswords] !== password) {
        return false;
      }
      
      // Atualizar último login
      const updatedUser = {
        ...foundUser,
        ultimoLogin: new Date().toISOString()
      };
      
      // Salvar no estado e localStorage
      setUser(updatedUser);
      setPermissions(ROLE_PERMISSIONS[updatedUser.role]);
      
      localStorage.setItem('auth-token', 'fake-jwt-token');
      localStorage.setItem('auth-user', JSON.stringify(updatedUser));
      
      return true;
    } catch (error) {
      console.error('Erro no login:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setPermissions(null);
    localStorage.removeItem('auth-token');
    localStorage.removeItem('auth-user');
    
    // Redirecionar para login
    window.location.href = '/login';
  };

  const updateUser = (userData: Partial<User>) => {
    if (!user) return;
    
    const updatedUser = { ...user, ...userData };
    setUser(updatedUser);
    localStorage.setItem('auth-user', JSON.stringify(updatedUser));
  };

  const hasPermission = (
    resource: keyof UserPermissions, 
    action: keyof UserPermissions[keyof UserPermissions]
  ): boolean => {
    if (!permissions || !user) return false;
    
    const resourcePermissions = permissions[resource];
    if (!resourcePermissions) return false;
    
    return resourcePermissions[action] === true;
  };

  const isAdmin = (): boolean => {
    return user?.role === 'admin';
  };

  const isUsuario = (): boolean => {
    return user?.role === 'usuario';
  };

  const value: AuthContextType = {
    user,
    permissions,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    updateUser,
    hasPermission,
    isAdmin,
    isUsuario,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
}

// Hook para verificar permissões específicas
export function usePermissions() {
  const { permissions, hasPermission, isAdmin, isUsuario } = useAuth();
  
  return {
    permissions,
    hasPermission,
    isAdmin,
    isUsuario,
    // Helpers específicos
    canCreatePeople: () => hasPermission('pessoas', 'cadastrar'),
    canEditPeople: () => hasPermission('pessoas', 'editar'),
    canDeletePeople: () => hasPermission('pessoas', 'excluir'),
    canRegisterAttendance: () => hasPermission('comparecimentos', 'registrar'),
    canEditAttendance: () => hasPermission('comparecimentos', 'editar'),
    canExportData: () => hasPermission('pessoas', 'exportar') || hasPermission('comparecimentos', 'exportar'),
    canManageSystem: () => hasPermission('sistema', 'configurar'),
    canManageUsers: () => hasPermission('sistema', 'gerenciarUsuarios'),
    canManageBiometric: () => hasPermission('biometria', 'gerenciar'),
  };
}

// Hook para auditoria de ações
export function useAudit() {
  const { user } = useAuth();
  
  const logAction = (action: string, resource: string, details?: any) => {
    if (!user) return;
    
    const auditLog = {
      userId: user.id,
      userName: user.nome,
      action,
      resource,
      details,
      timestamp: new Date().toISOString(),
      ip: 'unknown', // Em produção, capturar IP real
      userAgent: navigator.userAgent
    };
    
    // Em produção, enviar para API
    console.log('Audit Log:', auditLog);
    
    // Salvar localmente para debug
    const existingLogs = JSON.parse(localStorage.getItem('audit-logs') || '[]');
    existingLogs.push(auditLog);
    
    // Manter apenas os últimos 100 logs
    if (existingLogs.length > 100) {
      existingLogs.splice(0, existingLogs.length - 100);
    }
    
    localStorage.setItem('audit-logs', JSON.stringify(existingLogs));
  };
  
  return { logAction };
}