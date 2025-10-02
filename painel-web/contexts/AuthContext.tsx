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
  login: (email: string, senha: string, rememberMe?: boolean) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<Usuario | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const isAuthenticated = !!user;

  const loadUser = async () => {
    try {
      console.log('[AuthContext] Carregando dados do usuário');

      const accessToken = authService.getAccessToken();
      
      if (!accessToken) {
        console.log('[AuthContext] Nenhum token encontrado');
        setUser(null);
        setIsLoading(false);
        return;
      }

      console.log('[AuthContext] Token encontrado, configurando no httpClient');
      httpClient.setAuthToken(accessToken);

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
        authService.clearAuth();
        setUser(null);
      }
    } catch (error) {
      console.error('[AuthContext] Erro ao carregar usuário:', error);
      authService.clearAuth();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  const login = async (email: string, senha: string, rememberMe: boolean = false) => {
    try {
      console.log('[AuthContext] Iniciando login para:', email);

      const result = await authService.login({
        email,
        senha,
        rememberMe
      });

      if (result.success && result.data) {
        console.log('[AuthContext] Login bem-sucedido');
        
        authService.setAccessToken(result.data.accessToken);
        authService.setRefreshToken(result.data.refreshToken);
        authService.setUserData(result.data.usuario);
        
        httpClient.setAuthToken(result.data.accessToken);
        
        setUser({
          id: result.data.usuario.id,
          nome: result.data.usuario.nome,
          email: result.data.usuario.email,
          tipo: result.data.usuario.tipo,
          departamento: result.data.usuario.departamento,
          telefone: result.data.usuario.telefone,
          ultimoLogin: result.data.usuario.ultimoLogin
        });

        return { success: true };
      }

      return { 
        success: false, 
        message: result.message || 'Erro ao realizar login' 
      };
    } catch (error: any) {
      console.error('[AuthContext] Erro no login:', error);
      return { 
        success: false, 
        message: error.message || 'Erro ao conectar com o servidor' 
      };
    }
  };

  const logout = async () => {
    try {
      console.log('[AuthContext] Realizando logout');

      const refreshToken = authService.getRefreshToken();
      
      if (refreshToken) {
        await authService.logout({ refreshToken });
      }
    } catch (error) {
      console.error('[AuthContext] Erro no logout:', error);
    } finally {
      authService.clearAuth();
      setUser(null);
      router.push('/login');
    }
  };

  const refreshUser = async () => {
    await loadUser();
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    refreshUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}