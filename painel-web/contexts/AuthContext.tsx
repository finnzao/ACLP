'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { User, UserPermissions, AuthContextType, UserRole, ROLE_PERMISSIONS } from '@/types/user';
import { authService, configureAuthHeaders, clearAuthHeaders } from '@/lib/api/authService';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUserFromStorage = useCallback(async () => {
    try {
      const accessToken = authService.getAccessToken();
      const refreshToken = authService.getRefreshToken();
      
      console.log('[AuthProvider] Verificando tokens salvos...');
      
      if (accessToken && refreshToken) {
        configureAuthHeaders(accessToken);
        
        const validationResult = await authService.validateToken();
        
        if (validationResult.success && validationResult.data?.valid) {
          const profileResult = await authService.getProfile();
          
          if (profileResult.success && profileResult.data) {
            const userData = profileResult.data;
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
          console.log('[AuthProvider] Token inválido, tentando refresh...');
          await tryRefreshToken(refreshToken);
        }
      }
    } catch (error) {
      console.error('[AuthProvider] Erro ao carregar usuário:', error);
      handleLogout();
    } finally {
      setIsLoading(false);
    }
  }, []);

  const tryRefreshToken = async (refreshToken: string) => {
    try {
      const result = await authService.refreshToken({ refreshToken });
      
      if (result.success && result.data) {
        const { accessToken, refreshToken: newRefreshToken, usuario } = result.data;
        
        authService.setAccessToken(accessToken);
        authService.setRefreshToken(newRefreshToken);
        configureAuthHeaders(accessToken);
        
        const role: UserRole = usuario.tipo === 'ADMIN' ? 'admin' : 'usuario';
        const userMapped: User = {
          id: String(usuario.id),
          nome: usuario.nome,
          email: usuario.email,
          role,
          departamento: undefined,
          telefone: undefined,
          ativo: true,
          criadoEm: new Date().toISOString(),
          ultimoLogin: undefined
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

  useEffect(() => {
    loadUserFromStorage();

    const interval = setInterval(async () => {
      if (authService.isTokenExpiring(10)) {
        const refreshToken = authService.getRefreshToken();
        if (refreshToken) {
          console.log('[AuthProvider] Token próximo de expirar, renovando...');
          await tryRefreshToken(refreshToken);
        }
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [loadUserFromStorage]);

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
        const { accessToken, usuario } = result.data;
        
        configureAuthHeaders(accessToken);
        
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
        setIsLoading(false);
        
        console.log('[AuthProvider] Login bem-sucedido:', userMapped.nome);
        return true;
      }
      
      console.log('[AuthProvider] Falha no login:', result.message);
      setIsLoading(false);
      return false;
      
    } catch (error) {
      console.error('[AuthProvider] Erro no login:', error);
      setIsLoading(false);
      return false;
    }
  };

  const logout = async () => {
    console.log('[AuthProvider] Realizando logout...');
    
    try {
      const refreshToken = authService.getRefreshToken();
      
      if (refreshToken) {
        await authService.logout({ refreshToken });
      }
    } catch (error) {
      console.error('[AuthProvider] Erro no logout:', error);
    } finally {
      handleLogout();
    }
  };

  const handleLogout = () => {
    setUser(null);
    setPermissions(null);
    
    authService.clearAuth();
    clearAuthHeaders();
    
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  const updateUser = async (userData: Partial<User>) => {
    if (!user) return;
    
    try {
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

  const hasPermission = (resource: string, action: string): boolean => {
    if (!permissions || !user) return false;
    
    const resourcePermissions = (permissions as any)[resource];
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