'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, UserPermissions, AuthContextType, UserRole, ROLE_PERMISSIONS } from '@/types/user';
import { authService, configureAuthHeaders, clearAuthHeaders } from '@/lib/api/services';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar usuário do localStorage na inicialização
  useEffect(() => {
    const loadUser = async () => {
      try {
        const accessToken = localStorage.getItem('access-token');
        const refreshToken = localStorage.getItem('refresh-token');
        
        console.log('[AuthProvider] Verificando tokens salvos...');
        
        if (accessToken && refreshToken) {
          // Configurar token no cliente HTTP
          configureAuthHeaders(accessToken);
          
          // Validar token
          const validationResult = await authService.validateToken();
          
          if (validationResult.success && validationResult.data?.valid) {
            // Token válido, carregar perfil do usuário
            const profileResult = await authService.getProfile();
            
            if (profileResult.success && profileResult.data) {
              const userData = profileResult.data;
              
              // Mapear tipo do backend para role do frontend
              const role: UserRole = userData.tipo === 'ADMIN' ? 'admin' : 'usuario';
              
              const userMapped: User = {
                id: String(userData.id),
                nome: userData.nome,
                email: userData.email,
                role,
                departamento: userData.departamento,
                telefone: userData.telefone,
                ativo: userData.ativo,
                criadoEm: userData.criadoEm,
                ultimoLogin: userData.ultimoLogin
              };
              
              setUser(userMapped);
              setPermissions(ROLE_PERMISSIONS[role]);
              
              console.log('[AuthProvider] Usuário carregado:', userMapped.nome);
            }
          } else {
            // Token inválido, tentar refresh
            console.log('[AuthProvider] Token inválido, tentando refresh...');
            await tryRefreshToken(refreshToken);
          }
        }
      } catch (error) {
        console.error('[AuthProvider] Erro ao carregar usuário:', error);
        // Limpar dados corrompidos
        handleLogout();
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  // Tentar renovar token
  const tryRefreshToken = async (refreshToken: string) => {
    try {
      const result = await authService.refreshToken({ refreshToken });
      
      if (result.success && result.data) {
        const { accessToken, refreshToken: newRefreshToken, usuario } = result.data;
        
        // Salvar novos tokens
        localStorage.setItem('access-token', accessToken);
        localStorage.setItem('refresh-token', newRefreshToken);
        
        // Configurar novo token
        configureAuthHeaders(accessToken);
        
        // Mapear usuário
        const role: UserRole = usuario.tipo === 'ADMIN' ? 'admin' : 'usuario';
        const userMapped: User = {
          id: String(usuario.id),
          nome: usuario.nome,
          email: usuario.email,
          role,
          departamento: usuario.departamento,
          telefone: usuario.telefone,
          ativo: true,
          criadoEm: new Date().toISOString(),
          ultimoLogin: usuario.ultimoLogin
        };
        
        setUser(userMapped);
        setPermissions(ROLE_PERMISSIONS[role]);
        
        console.log('[AuthProvider] Token renovado com sucesso');
      } else {
        throw new Error('Falha ao renovar token');
      }
    } catch (error) {
      console.error('[AuthProvider] Erro ao renovar token:', error);
      handleLogout();
    }
  };

  // Login
  const login = async (email: string, password: string): Promise<boolean> => {
    console.log('[AuthProvider] Tentando login para:', email);
    setIsLoading(true);
    
    try {
      const result = await authService.login({
        email,
        senha: password,
        rememberMe: true
      });
      
      if (result.success && result.data) {
        const { accessToken, refreshToken, usuario } = result.data;
        
        // Salvar tokens
        localStorage.setItem('access-token', accessToken);
        localStorage.setItem('refresh-token', refreshToken);
        
        // Configurar token no cliente HTTP
        configureAuthHeaders(accessToken);
        
        // Mapear usuário
        const role: UserRole = usuario.tipo === 'ADMIN' ? 'admin' : 'usuario';
        const userMapped: User = {
          id: String(usuario.id),
          nome: usuario.nome,
          email: usuario.email,
          role,
          departamento: usuario.departamento,
          telefone: usuario.telefone,
          ativo: true,
          criadoEm: new Date().toISOString(),
          ultimoLogin: usuario.ultimoLogin
        };
        
        setUser(userMapped);
        setPermissions(ROLE_PERMISSIONS[role]);
        
        console.log('[AuthProvider] Login bem-sucedido:', userMapped.nome);
        return true;
      }
      
      console.error('[AuthProvider] Falha no login:', result.message);
      return false;
      
    } catch (error) {
      console.error('[AuthProvider] Erro no login:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout
  const logout = async () => {
    console.log('[AuthProvider] Realizando logout...');
    
    try {
      const refreshToken = localStorage.getItem('refresh-token');
      
      if (refreshToken) {
        await authService.logout({ refreshToken });
      }
    } catch (error) {
      console.error('[AuthProvider] Erro no logout:', error);
    } finally {
      handleLogout();
    }
  };

  // Limpar estado de autenticação
  const handleLogout = () => {
    setUser(null);
    setPermissions(null);
    
    // Limpar storage
    localStorage.removeItem('access-token');
    localStorage.removeItem('refresh-token');
    
    // Limpar headers
    clearAuthHeaders();
    
    // Redirecionar para login
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  // Atualizar usuário
  const updateUser = async (userData: Partial<User>) => {
    if (!user) return;
    
    try {
      // Atualizar no backend
      const result = await authService.getProfile();
      
      if (result.success && result.data) {
        const updatedData = result.data;
        const role: UserRole = updatedData.tipo === 'ADMIN' ? 'admin' : 'usuario';
        
        const updatedUser: User = {
          ...user,
          nome: updatedData.nome,
          email: updatedData.email,
          departamento: updatedData.departamento,
          telefone: updatedData.telefone,
          role
        };
        
        setUser(updatedUser);
        setPermissions(ROLE_PERMISSIONS[role]);
        
        console.log('[AuthProvider] Usuário atualizado');
      }
    } catch (error) {
      console.error('[AuthProvider] Erro ao atualizar usuário:', error);
    }
  };

  // Verificar permissão
  const hasPermission = (resource: string, action: string): boolean => {
    if (!permissions || !user) return false;
    
    const resourcePermissions = (permissions as any)[resource];
    if (!resourcePermissions) return false;
    
    return resourcePermissions[action] === true;
  };

  // Verificar se é admin
  const isAdmin = (): boolean => {
    return user?.role === 'admin';
  };

  // Verificar se é usuário
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

// Hooks adicionais
export function usePermissions() {
  const { permissions, hasPermission, isAdmin, isUsuario } = useAuth();
  
  return {
    permissions,
    hasPermission,
    isAdmin,
    isUsuario,
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