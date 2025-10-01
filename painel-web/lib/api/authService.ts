/* eslint-disable @typescript-eslint/no-explicit-any */
import { httpClient } from '@/lib/http/client';

interface LoginRequest {
  email: string;
  senha: string;
  rememberMe?: boolean;
}

interface LoginResponse {
  success: boolean;
  message: string;
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  sessionId: string;
  usuario: {
    id: number;
    nome: string;
    email: string;
    tipo: 'ADMIN' | 'USUARIO';
    departamento?: string;
    telefone?: string;
    avatar?: string | null;
    ultimoLogin?: string;
    mfaEnabled: boolean;
  };
  requiresMfa: boolean;
  requiresPasswordChange: boolean;
}

interface ValidateTokenResponse {
  success: boolean;
  data?: {
    valid: boolean;
    usuario?: {
      id: number;
      email: string;
      tipo: 'ADMIN' | 'USUARIO';
    };
  };
  message?: string;
}

interface RefreshTokenRequest {
  refreshToken: string;
}

interface RefreshTokenResponse {
  success: boolean;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  usuario: {
    id: number;
    nome: string;
    email: string;
    tipo: 'ADMIN' | 'USUARIO';
  };
}

interface LogoutRequest {
  refreshToken: string;
}

interface GetProfileResponse {
  success: boolean;
  data: {
    id: number;
    nome: string;
    email: string;
    tipo: 'ADMIN' | 'USUARIO';
    departamento?: string;
    telefone?: string;
    ativo: boolean;
    criadoEm: string;
    ultimoLogin?: string;
  };
}

interface ChangePasswordRequest {
  senhaAtual: string;
  novaSenha: string;
  confirmaSenha: string;
}

interface TokenPayload {
  userId: number;
  email: string;
  nome: string;
  tipo: 'ADMIN' | 'USUARIO';
  roles: string[];
  sessionId: string;
  iat: number;
  exp: number;
  iss: string;
}

class AuthService {
  private readonly ACCESS_TOKEN_KEY = 'access-token';
  private readonly REFRESH_TOKEN_KEY = 'refresh-token';
  private readonly USER_KEY = 'user-data';

  async login(credentials: LoginRequest): Promise<{ success: boolean; data?: LoginResponse; message?: string }> {
    console.log('[AuthService] Realizando login:', credentials.email);
    
    try {
      const response = await httpClient.post<LoginResponse>('/auth/login', {
        email: credentials.email,
        senha: credentials.senha,
        rememberMe: credentials.rememberMe
      });

      console.log('[AuthService] Resposta do login:', response);

      // A resposta já vem no formato correto direto do httpClient
      if (response.success && response.data) {
        const loginData = response.data;
        
        console.log('[AuthService] Login bem-sucedido, salvando tokens');
        console.log('[AuthService] AccessToken:', loginData.accessToken?.substring(0, 20) + '...');
        console.log('[AuthService] RefreshToken:', loginData.refreshToken);
        
        // Salvar tokens
        this.setAccessToken(loginData.accessToken);
        this.setRefreshToken(loginData.refreshToken);
        this.setUserData(loginData.usuario);
        
        // Configurar header de autenticação
        httpClient.setAuthToken(loginData.accessToken);
        
        console.log('[AuthService] Tokens salvos com sucesso');
        console.log('[AuthService] AccessToken armazenado:', this.getAccessToken()?.substring(0, 20) + '...');
        
        return { 
          success: true, 
          data: loginData 
        };
      }

      return { 
        success: false, 
        message: response.data?.message || 'Erro ao realizar login' 
      };
      
    } catch (error: any) {
      console.error('[AuthService] Erro no login:', error);
      return { 
        success: false, 
        message: error.message || 'Erro ao conectar com o servidor' 
      };
    }
  }

  async validateToken(): Promise<ValidateTokenResponse> {
    console.log('[AuthService] Validando token');
    
    try {
      const response = await httpClient.get<ValidateTokenResponse>('/auth/validate');
      return response.data as ValidateTokenResponse;
    } catch (error) {
      console.error('[AuthService] Erro ao validar token:', error);
      return { success: false };
    }
  }

  async refreshToken(request: RefreshTokenRequest): Promise<{ success: boolean; data?: RefreshTokenResponse }> {
    console.log('[AuthService] Renovando token');
    
    try {
      const response = await httpClient.post<RefreshTokenResponse>('/auth/refresh', request);

      if (response.success && response.data) {
        const refreshData = response.data;
        
        console.log('[AuthService] Token renovado com sucesso');
        
        this.setAccessToken(refreshData.accessToken);
        this.setRefreshToken(refreshData.refreshToken);
        
        httpClient.setAuthToken(refreshData.accessToken);
        
        return { success: true, data: refreshData };
      }

      return { success: false };
      
    } catch (error) {
      console.error('[AuthService] Erro ao renovar token:', error);
      return { success: false };
    }
  }

  async logout(request: LogoutRequest): Promise<void> {
    console.log('[AuthService] Realizando logout');
    
    try {
      await httpClient.post('/auth/logout', request);
    } catch (error) {
      console.error('[AuthService] Erro no logout:', error);
    } finally {
      this.clearAuth();
    }
  }

  async getProfile(): Promise<GetProfileResponse> {
    console.log('[AuthService] Buscando perfil do usuário');
    const response = await httpClient.get<GetProfileResponse>('/auth/me');
    return response.data as GetProfileResponse;
  }

  async alterarSenha(data: ChangePasswordRequest): Promise<{ success: boolean; message?: string }> {
    console.log('[AuthService] Alterando senha');
    const response = await httpClient.put('/auth/change-password', data);
    return response.data as { success: boolean; message?: string };
  }

  setAccessToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.ACCESS_TOKEN_KEY, token);
      console.log('[AuthService] AccessToken salvo no localStorage');
    }
  }

  getAccessToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(this.ACCESS_TOKEN_KEY);
    }
    return null;
  }

  setRefreshToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.REFRESH_TOKEN_KEY, token);
      console.log('[AuthService] RefreshToken salvo no localStorage');
    }
  }

  getRefreshToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(this.REFRESH_TOKEN_KEY);
    }
    return null;
  }

  setUserData(usuario: any): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.USER_KEY, JSON.stringify(usuario));
      console.log('[AuthService] Dados do usuário salvos');
    }
  }

  getUserData(): any | null {
    if (typeof window !== 'undefined') {
      const data = localStorage.getItem(this.USER_KEY);
      return data ? JSON.parse(data) : null;
    }
    return null;
  }

  clearAuth(): void {
    console.log('[AuthService] Limpando dados de autenticação');
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.ACCESS_TOKEN_KEY);
      localStorage.removeItem(this.REFRESH_TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
    }
    httpClient.clearAuthToken();
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  isAdmin(): boolean {
    const user = this.getUserData();
    return user?.tipo === 'ADMIN';
  }

  decodeToken(token: string): TokenPayload | null {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('[AuthService] Erro ao decodificar token:', error);
      return null;
    }
  }

  isTokenExpiring(minutesThreshold: number = 5): boolean {
    const token = this.getAccessToken();
    if (!token) return true;

    const decoded = this.decodeToken(token);
    if (!decoded) return true;

    const now = Date.now() / 1000;
    const timeUntilExpiry = decoded.exp - now;
    const minutesUntilExpiry = timeUntilExpiry / 60;

    return minutesUntilExpiry <= minutesThreshold;
  }

  getTokenExpirationTime(): Date | null {
    const token = this.getAccessToken();
    if (!token) return null;

    const decoded = this.decodeToken(token);
    if (!decoded) return null;

    return new Date(decoded.exp * 1000);
  }
}

export const authService = new AuthService();

export function configureAuthHeaders(token: string): void {
  httpClient.setAuthToken(token);
}

export function clearAuthHeaders(): void {
  httpClient.clearAuthToken();
}