/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/api/authService';
import { httpClient } from '@/lib/http/client';

interface Usuario {
  id: number;
  nome: string;
  email: string;
  tipo: 'ADMIN' | 'USUARIO';
  departamento?: string;
  telefone?: string;
  ultimoLogin?: string;
}

interface AuthContextType {
  user: Usuario | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, senha: string, rememberMe?: boolean) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  logAction: (action: string, resource: string, details?: Record<string, any>) => void;
}

interface PermissionsContextType {
  hasPermission: (resource: string, action: string) => boolean;
  isAdmin: () => boolean;
  isUsuario: () => boolean;
  getUserPermissions: () => string[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

const PERMISSIONS = {
  ADMIN: {
    pessoas: ['listar', 'visualizar', 'cadastrar', 'editar', 'excluir', 'exportar'],
    comparecimentos: ['listar', 'visualizar', 'registrar', 'editar', 'cancelar', 'exportar'],
    sistema: ['configurar', 'gerenciarUsuarios', 'backup', 'logs'],
    relatorios: ['visualizar', 'gerar', 'exportar'],
    biometria: ['cadastrar', 'verificar', 'gerenciar']
  },
  USUARIO: {
    pessoas: ['listar', 'visualizar', 'exportar'],
    comparecimentos: ['listar', 'visualizar', 'registrar', 'exportar'],
    sistema: [] as string[],
    relatorios: ['visualizar', 'exportar'],
    biometria: ['verificar']
  }
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<Usuario | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const isAuthenticated = !!user;

  const isTokenExpired = (token: string): boolean => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expirationTime = payload.exp * 1000;
      const currentTime = Date.now();
      const timeUntilExpiry = expirationTime - currentTime;
      
      return timeUntilExpiry < 60000;
    } catch (error) {
      console.error('[AuthContext] Erro ao verificar expiração do token:', error);
      return true;
    }
  };

  const clearAuthData = () => {
    console.log('[AuthContext] Limpando dados de autenticação');
    authService.clearAuth();
    document.cookie = 'auth-token=; path=/; max-age=0';
    setUser(null);
  };

  const loadUser = async () => {
    try {
      console.log('[AuthContext] Carregando dados do usuário');

      const accessToken = authService.getAccessToken();
      
      if (!accessToken) {
        console.log('[AuthContext] Nenhum token encontrado');
        clearAuthData();
        setIsLoading(false);
        return;
      }

      if (isTokenExpired(accessToken)) {
        console.log('[AuthContext] Token expirado, tentando renovar');
        
        const refreshToken = authService.getRefreshToken();
        
        if (refreshToken) {
          try {
            const refreshResult = await authService.refreshToken({ refreshToken });
            
            if (refreshResult.success && refreshResult.data) {
              console.log('[AuthContext] Token renovado com sucesso');
              
              httpClient.setAuthToken(refreshResult.data.accessToken);
              
              const maxAge = refreshResult.data.expiresIn || 3600;
              document.cookie = `auth-token=${refreshResult.data.accessToken}; path=/; max-age=${maxAge}; samesite=lax`;
            } else {
              console.warn('[AuthContext] Falha ao renovar token');
              clearAuthData();
              setIsLoading(false);
              return;
            }
          } catch (error) {
            console.error('[AuthContext] Erro ao renovar token:', error);
            clearAuthData();
            setIsLoading(false);
            return;
          }
        } else {
          console.warn('[AuthContext] Token expirado e sem refresh token');
          clearAuthData();
          setIsLoading(false);
          return;
        }
      } else {
        console.log('[AuthContext] Token válido, configurando no httpClient');
        httpClient.setAuthToken(accessToken);
      }

      console.log('[AuthContext] Buscando perfil do usuário');
      const profileResponse = await authService.getProfile();

      if (profileResponse.success && profileResponse.data) {
        console.log('[AuthContext] Perfil carregado com sucesso:', profileResponse.data);
        
        const userData = profileResponse.data.data || profileResponse.data;
        
        setUser({
          id: userData.id,
          nome: userData.nome,
          email: userData.email,
          tipo: userData.tipo,
          departamento: userData.departamento,
          telefone: userData.telefone,
          ultimoLogin: userData.ultimoLogin
        });
      } else {
        console.warn('[AuthContext] Falha ao carregar perfil, limpando autenticação');
        clearAuthData();
      }
    } catch (error: any) {
      console.error('[AuthContext] Erro ao carregar usuário:', error);
      
      if (error.message?.includes('401') || error.message?.includes('expirada')) {
        console.log('[AuthContext] Sessão expirada, limpando autenticação');
        clearAuthData();
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handleTokenExpired = () => {
      console.log('[AuthContext] Evento de token expirado recebido');
      clearAuthData();
      router.push('/login');
    };

    window.addEventListener('token-expired', handleTokenExpired);

    return () => {
      window.removeEventListener('token-expired', handleTokenExpired);
    };
  }, [router]);

  useEffect(() => {
    loadUser();

    const intervalId = setInterval(() => {
      const token = authService.getAccessToken();
      
      if (!token) {
        console.log('[AuthContext] Token não encontrado no intervalo');
        clearAuthData();
        router.push('/login');
        return;
      }
      
      const decoded = authService.decodeToken(token);
      
      if (!decoded) {
        console.log('[AuthContext] Token inválido detectado no intervalo');
        clearAuthData();
        router.push('/login');
        return;
      }

      const now = Date.now() / 1000;
      
      if (decoded.exp < now) {
        console.log('[AuthContext] Token expirado detectado no intervalo');
        
        const refreshToken = authService.getRefreshToken();
        
        if (refreshToken) {
          authService.refreshToken({ refreshToken }).then(result => {
            if (result.success && result.data) {
              console.log('[AuthContext] Token renovado automaticamente');
              httpClient.setAuthToken(result.data.accessToken);
              
              const maxAge = result.data.expiresIn || 3600;
              document.cookie = `auth-token=${result.data.accessToken}; path=/; max-age=${maxAge}; samesite=lax`;
            } else {
              console.log('[AuthContext] Falha ao renovar token automaticamente');
              clearAuthData();
              router.push('/login');
            }
          }).catch(error => {
            console.error('[AuthContext] Erro ao renovar token automaticamente:', error);
            clearAuthData();
            router.push('/login');
          });
        } else {
          console.log('[AuthContext] Sem refresh token, fazendo logout');
          clearAuthData();
          router.push('/login');
        }
      }
      else if ((decoded.exp - now) < 300) {
        console.log('[AuthContext] Token próximo de expirar, renovando...');
        
        const refreshToken = authService.getRefreshToken();
        
        if (refreshToken) {
          authService.refreshToken({ refreshToken }).then(result => {
            if (result.success && result.data) {
              console.log('[AuthContext] Token renovado preventivamente');
              httpClient.setAuthToken(result.data.accessToken);
              
              const maxAge = result.data.expiresIn || 3600;
              document.cookie = `auth-token=${result.data.accessToken}; path=/; max-age=${maxAge}; samesite=lax`;
            }
          }).catch(error => {
            console.error('[AuthContext] Erro ao renovar token preventivamente:', error);
          });
        }
      }
    }, 60000);

    return () => clearInterval(intervalId);
  }, [router]);

  const login = async (email: string, senha: string, rememberMe: boolean = false): Promise<boolean> => {
    try {
      console.log('[AuthContext] Iniciando login para:', email);

      const result = await authService.login({
        email,
        senha,
        rememberMe
      });

      if (result.success && result.data) {
        console.log('[AuthContext] Login bem-sucedido');
        
        httpClient.setAuthToken(result.data.accessToken);
        
        const maxAge = result.data.expiresIn || 3600;
        document.cookie = `auth-token=${result.data.accessToken}; path=/; max-age=${maxAge}; samesite=lax`;
        
        console.log('[AuthContext] Cookie salvo:', document.cookie.includes('auth-token') ? 'SIM' : 'NÃO');
        
        setUser({
          id: result.data.usuario.id,
          nome: result.data.usuario.nome,
          email: result.data.usuario.email,
          tipo: result.data.usuario.tipo,
          departamento: result.data.usuario.departamento,
          telefone: result.data.usuario.telefone,
          ultimoLogin: result.data.usuario.ultimoLogin
        });

        console.log('[AuthContext] Estado atualizado, retornando true');
        return true;
      }

      console.log('[AuthContext] Login falhou:', result.message);
      return false;
    } catch (error: any) {
      console.error('[AuthContext] Erro no login:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      console.log('[AuthContext] Realizando logout');

      const refreshToken = authService.getRefreshToken();
      
      if (refreshToken) {
        try {
          await authService.logout({ refreshToken });
          console.log('[AuthContext] Logout no servidor realizado com sucesso');
        } catch (error) {
          console.error('[AuthContext] Erro ao fazer logout no servidor:', error);
        }
      }
    } catch (error) {
      console.error('[AuthContext] Erro no logout:', error);
    } finally {
      clearAuthData();
      console.log('[AuthContext] Dados locais limpos após logout');
      router.push('/login');
    }
  };

  const refreshUser = async () => {
    await loadUser();
  };

  const logAction = (action: string, resource: string, details?: Record<string, any>) => {
    if (!user) return;

    const logEntry = {
      timestamp: new Date().toISOString(),
      userId: user.id,
      userName: user.nome,
      userType: user.tipo,
      action,
      resource,
      details: details || {}
    };

    console.log('[Audit]', logEntry);

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const auditLogs = JSON.parse(localStorage.getItem('audit_logs') || '[]');
        auditLogs.push(logEntry);
        
        if (auditLogs.length > 1000) {
          auditLogs.shift();
        }
        
        localStorage.setItem('audit_logs', JSON.stringify(auditLogs));
      } catch (error) {
        console.error('[Audit] Erro ao salvar log:', error);
      }
    }
  };

  const hasPermission = (resource: string, action: string): boolean => {
    if (!user) return false;
    
    const userPermissions = user.tipo === 'ADMIN' ? PERMISSIONS.ADMIN : PERMISSIONS.USUARIO;
    const resourcePermissions = userPermissions[resource as keyof typeof userPermissions] || [];
    
    return resourcePermissions.includes(action);
  };

  const isAdmin = (): boolean => {
    return user?.tipo === 'ADMIN';
  };

  const isUsuario = (): boolean => {
    return user?.tipo === 'USUARIO';
  };

  const getUserPermissions = (): string[] => {
    if (!user) return [];
    
    const userPermissions = user.tipo === 'ADMIN' ? PERMISSIONS.ADMIN : PERMISSIONS.USUARIO;
    const allPermissions: string[] = [];
    
    Object.entries(userPermissions).forEach(([resource, actions]) => {
      actions.forEach(action => {
        allPermissions.push(`${resource}:${action}`);
      });
    });
    
    return allPermissions;
  };

  const authValue: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    refreshUser,
    logAction
  };

  const permissionsValue: PermissionsContextType = {
    hasPermission,
    isAdmin,
    isUsuario,
    getUserPermissions
  };

  return (
    <AuthContext.Provider value={authValue}>
      <PermissionsContext.Provider value={permissionsValue}>
        {children}
      </PermissionsContext.Provider>
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}

export function usePermissions(): PermissionsContextType {
  const context = useContext(PermissionsContext);
  if (context === undefined) {
    throw new Error('usePermissions deve ser usado dentro de um AuthProvider');
  }
  return context;
}