/* eslint-disable @typescript-eslint/no-explicit-any */
import { httpClient } from '@/lib/http/client';

// ===========================
// Interfaces
// ===========================

interface LoginRequest {
  email: string;
  senha: string;
  rememberMe?: boolean;
}

interface LoginResponseData {
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

interface RefreshTokenResponseData {
  success: boolean;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

interface LogoutRequest {
  refreshToken: string;
}

interface GetProfileResponseData {
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

// ===========================
// Helper para extrair dados
// ===========================

/**
 * Extrai dados de uma resposta que pode vir em diferentes formatos
 */
function extractResponseData<T>(response: any): T | null {
  // Se já tem os dados diretamente
  if (response && typeof response === 'object') {
    // Verificar se tem success e data
    if ('data' in response && response.data) {
      return response.data as T;
    }
    // Se a resposta já é o dado esperado
    return response as T;
  }
  return null;
}

/**
 * Verifica se a resposta indica sucesso
 */
function isSuccessResponse(response: any): boolean {
  if (!response) return false;
  
  // Se tem propriedade success
  if ('success' in response) {
    return response.success === true;
  }
  
  // Se tem data com success
  if ('data' in response && response.data && typeof response.data === 'object') {
    if ('success' in response.data) {
      return response.data.success === true;
    }
  }
  
  // Se chegou aqui e tem dados, considerar sucesso
  return true;
}

// ===========================
// AuthService Class
// ===========================

class AuthService {
  private readonly ACCESS_TOKEN_KEY = 'access-token';
  private readonly REFRESH_TOKEN_KEY = 'refresh-token';
  private readonly USER_KEY = 'user-data';

  async login(credentials: LoginRequest): Promise<{ 
    success: boolean; 
    data?: LoginResponseData; 
    message?: string 
  }> {
    console.log('[AuthService] Realizando login:', credentials.email);
    
    try {
      const response = await httpClient.post<any>('/auth/login', {
        email: credentials.email,
        senha: credentials.senha,
        rememberMe: credentials.rememberMe
      });

      console.log('[AuthService] Resposta do login:', response);

      // Verificar se foi sucesso
      if (!isSuccessResponse(response)) {
        return {
          success: false,
          message: response?.message || 'Erro ao realizar login'
        };
      }

      // Extrair dados da resposta
      const loginData = extractResponseData<LoginResponseData>(response);
      
      if (!loginData) {
        console.error('[AuthService] Não foi possível extrair dados da resposta');
        return {
          success: false,
          message: 'Estrutura de resposta inválida'
        };
      }

      // Verificar se tem os campos obrigatórios
      if (!loginData.accessToken || !loginData.refreshToken || !loginData.usuario) {
        console.error('[AuthService] Resposta sem campos obrigatórios:', loginData);
        return {
          success: false,
          message: 'Resposta incompleta do servidor'
        };
      }

      console.log('[AuthService] Login bem-sucedido, salvando tokens');
      console.log('[AuthService] AccessToken:', loginData.accessToken.substring(0, 20) + '...');
      console.log('[AuthService] RefreshToken:', loginData.refreshToken);
      
      // Salvar tokens
      this.setAccessToken(loginData.accessToken);
      this.setRefreshToken(loginData.refreshToken);
      this.setUserData(loginData.usuario);
      
      // Configurar header de autenticação
      httpClient.setAuthToken(loginData.accessToken);
      
      console.log('[AuthService] Tokens salvos com sucesso');
      
      return { 
        success: true, 
        data: loginData 
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
      const response = await httpClient.get<any>('/auth/validate');
      return extractResponseData<ValidateTokenResponse>(response) || { success: false };
    } catch (error) {
      console.error('[AuthService] Erro ao validar token:', error);
      return { success: false };
    }
  }

  async refreshToken(request: RefreshTokenRequest): Promise<{ 
    success: boolean; 
    data?: RefreshTokenResponseData 
  }> {
    console.log('[AuthService] Renovando token');
    
    try {
      const response = await httpClient.post<any>('/auth/refresh', request);

      console.log('[AuthService] Resposta do refresh:', response);

      // Verificar se foi sucesso
      if (!isSuccessResponse(response)) {
        return { success: false };
      }

      // Extrair dados
      const refreshData = extractResponseData<RefreshTokenResponseData>(response);
      
      if (!refreshData || !refreshData.accessToken || !refreshData.refreshToken) {
        console.error('[AuthService] Dados de refresh inválidos');
        return { success: false };
      }

      console.log('[AuthService] Token renovado com sucesso');
      console.log('[AuthService] Novo AccessToken:', refreshData.accessToken.substring(0, 20) + '...');
      
      this.setAccessToken(refreshData.accessToken);
      this.setRefreshToken(refreshData.refreshToken);
      
      httpClient.setAuthToken(refreshData.accessToken);
      
      return { 
        success: true, 
        data: refreshData
      };
      
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

  async getProfile(): Promise<GetProfileResponseData> {
    console.log('[AuthService] Buscando perfil do usuário');
    
    try {
      const response = await httpClient.get<any>('/auth/me');
      
      // Extrair dados do perfil
      const profileData = extractResponseData<GetProfileResponseData>(response);
      
      if (!profileData) {
        throw new Error('Dados de perfil não encontrados');
      }
      
      return profileData;
    } catch (error) {
      console.error('[AuthService] Erro ao buscar perfil:', error);
      throw error;
    }
  }

  async alterarSenha(data: ChangePasswordRequest): Promise<{ 
    success: boolean; 
    message?: string 
  }> {
    console.log('[AuthService] Alterando senha');
    
    try {
      const response = await httpClient.put<any>('/auth/change-password', data);
      
      return {
        success: isSuccessResponse(response),
        message: response?.message
      };
    } catch (error: any) {
      console.error('[AuthService] Erro ao alterar senha:', error);
      return {
        success: false,
        message: error.message || 'Erro ao alterar senha'
      };
    }
  }

  // ===========================
  // Métodos de armazenamento
  // ===========================

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

  // ===========================
  // Métodos utilitários
  // ===========================

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

// ===========================
// Exportações
// ===========================

export const authService = new AuthService();

export function configureAuthHeaders(token: string): void {
  httpClient.setAuthToken(token);
}

export function clearAuthHeaders(): void {
  httpClient.clearAuthToken();
}