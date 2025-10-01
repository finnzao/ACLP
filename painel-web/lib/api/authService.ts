import { httpClient } from '@/lib/http/client';

interface LoginRequest {
  email: string;
  senha: string;
  rememberMe?: boolean;
}

interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    usuario: {
      id: number;
      nome: string;
      email: string;
      tipo: 'ADMIN' | 'USUARIO';
      departamento?: string;
      telefone?: string;
      ativo: boolean;
      ultimoLogin?: string;
    };
  };
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
  data: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    usuario: {
      id: number;
      nome: string;
      email: string;
      tipo: 'ADMIN' | 'USUARIO';
    };
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

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    console.log('[AuthService] Realizando login:', credentials.email);
    
    const response = await httpClient.post<LoginResponse>('/auth/login', {
      email: credentials.email,
      senha: credentials.senha,
      rememberMe: credentials.rememberMe
    });

    if (response.success && response.data?.data) {
      console.log('[AuthService] Login bem-sucedido, salvando tokens');
      
      this.setAccessToken(response.data.data.accessToken);
      this.setRefreshToken(response.data.data.refreshToken);
      this.setUserData(response.data.data.usuario);
      
      httpClient.setAuthToken(response.data.data.accessToken);
    }

    return response.data as LoginResponse;
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

  async refreshToken(request: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    console.log('[AuthService] Renovando token');
    
    const response = await httpClient.post<RefreshTokenResponse>('/auth/refresh', request);

    if (response.success && response.data?.data) {
      console.log('[AuthService] Token renovado com sucesso');
      
      this.setAccessToken(response.data.data.accessToken);
      this.setRefreshToken(response.data.data.refreshToken);
      
      httpClient.setAuthToken(response.data.data.accessToken);
    }

    return response.data as RefreshTokenResponse;
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
    localStorage.setItem(this.ACCESS_TOKEN_KEY, token);
  }

  getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  setRefreshToken(token: string): void {
    localStorage.setItem(this.REFRESH_TOKEN_KEY, token);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  setUserData(usuario: any): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(usuario));
  }

  getUserData(): any | null {
    const data = localStorage.getItem(this.USER_KEY);
    return data ? JSON.parse(data) : null;
  }

  clearAuth(): void {
    console.log('[AuthService] Limpando dados de autenticação');
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
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