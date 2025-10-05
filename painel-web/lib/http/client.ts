/* eslint-disable @typescript-eslint/no-explicit-any */

// Interfaces e Tipos

export interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retries?: number;
}

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
  success: boolean;
  status: number;
  timestamp?: string;
}

interface ClientConfig {
  baseURL?: string;
  timeout?: number;
  retries?: number;
  headers?: Record<string, string>;
}

// Classe do Cliente HTTP

class HttpClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;
  private timeout: number;
  private retries: number;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value?: any) => void;
    reject: (reason?: any) => void;
  }> = [];

  constructor(config?: ClientConfig) {
    this.baseURL = config?.baseURL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...config?.headers
    };

    this.timeout = config?.timeout || 30000;
    this.retries = config?.retries || 3;

    if (process.env.NODE_ENV === 'development') {
      console.log('[HttpClient] Inicializado com baseURL:', this.baseURL);
    }
  }

  // Métodos de Autenticação

  setAuthToken(token: string) {
    this.defaultHeaders['Authorization'] = `Bearer ${token}`;

    if (process.env.NODE_ENV === 'development') {
      console.log('[HttpClient] Token de autorização configurado');
    }
  }

  clearAuthToken() {
    delete this.defaultHeaders['Authorization'];

    if (process.env.NODE_ENV === 'development') {
      console.log('[HttpClient] Token de autorização removido');
    }
  }

  private processQueue(error: any, token: string | null = null): void {
    this.failedQueue.forEach((prom) => {
      if (error) {
        prom.reject(error);
      } else {
        prom.resolve(token);
      }
    });

    this.failedQueue = [];
  }

  private clearAuthData(): void {
    console.log('[HttpClient] Limpando dados de autenticação');
    
    this.clearAuthToken();
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access-token');
      localStorage.removeItem('refresh-token');
      localStorage.removeItem('user-data');
      document.cookie = 'auth-token=; path=/; max-age=0';
    }
  }

  private async handleUnauthorized(originalConfig: RequestConfig, endpoint: string): Promise<any> {
    // Não tentar renovar se for endpoint de auth ou se já falhou antes
    if (endpoint.includes('/auth/login') || endpoint.includes('/auth/refresh')) {
      console.log('[HttpClient] Não renovando token para endpoint de autenticação');
      this.clearAuthData();
      this.handleLogout();
      return Promise.reject(new Error('Não autenticado'));
    }

    // Se já estiver renovando, adicionar à fila
    if (this.isRefreshing) {
      return new Promise((resolve, reject) => {
        this.failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalConfig.headers = {
            ...originalConfig.headers,
            Authorization: `Bearer ${token}`
          };
          return this.makeRequest(endpoint, originalConfig);
        })
        .catch((err) => Promise.reject(err));
    }

    this.isRefreshing = true;

    const refreshToken = typeof window !== 'undefined' 
      ? localStorage.getItem('refresh-token') 
      : null;

    if (!refreshToken) {
      console.log('[HttpClient] Sem refresh token disponível');
      this.isRefreshing = false;
      this.clearAuthData();
      this.handleLogout();
      return Promise.reject(new Error('Não autenticado'));
    }

    try {
      console.log('[HttpClient] Tentando renovar token...');
      
      const response = await fetch(`${this.baseURL}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();

        if (data.success && data.data) {
          const { accessToken, refreshToken: newRefreshToken, expiresIn } = data.data;

          console.log('[HttpClient] Token renovado com sucesso');

          // Salvar novos tokens
          if (typeof window !== 'undefined') {
            localStorage.setItem('access-token', accessToken);
            localStorage.setItem('refresh-token', newRefreshToken);
            
            // Atualizar cookie
            const maxAge = expiresIn || 3600;
            document.cookie = `auth-token=${accessToken}; path=/; max-age=${maxAge}; samesite=lax`;
          }

          this.setAuthToken(accessToken);

          originalConfig.headers = {
            ...originalConfig.headers,
            Authorization: `Bearer ${accessToken}`
          };

          this.processQueue(null, accessToken);
          this.isRefreshing = false;

          return this.makeRequest(endpoint, originalConfig);
        }
      }

      throw new Error('Falha ao renovar token');
    } catch (refreshError) {
      console.error('[HttpClient] Erro ao renovar token:', refreshError);
      this.processQueue(refreshError, null);
      this.isRefreshing = false;
      this.clearAuthData();
      this.handleLogout();
      return Promise.reject(refreshError);
    }
  }

 

  // Métodos de Configuração

  setHeaders(headers: Record<string, string>) {
    this.defaultHeaders = { ...this.defaultHeaders, ...headers };

    if (process.env.NODE_ENV === 'development') {
      console.log('[HttpClient] Headers atualizados:', Object.keys(headers));
    }
  }

  removeHeader(headerName: string) {
    delete this.defaultHeaders[headerName];
  }

  setBaseURL(baseURL: string) {
    this.baseURL = baseURL;

    if (process.env.NODE_ENV === 'development') {
      console.log('[HttpClient] Base URL atualizada para:', baseURL);
    }
  }

  setTimeout(timeout: number) {
    this.timeout = timeout;
  }

  setRetries(retries: number) {
    this.retries = retries;
  }

  clearAuth() {
    this.clearAuthToken();
    this.clearAuthData();
  }

  // Método Principal de Requisição

  private async makeRequest<T>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      headers = {},
      body,
      timeout = this.timeout,
      retries = this.retries
    } = config;

    const url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`;

    const requestHeaders = {
      ...this.defaultHeaders,
      ...headers,
    };

    if (process.env.NODE_ENV === 'development') {
      console.log(`[HttpClient] ${method} ${url}`, {
        headers: this.sanitizeHeadersForLog(requestHeaders),
        body: body ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined
      });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const requestConfig: RequestInit = {
      method,
      headers: requestHeaders,
      signal: controller.signal,
    };

    if (body && method !== 'GET') {
      if (body instanceof FormData) {
        const { 'Content-Type': _, ...headersWithoutContentType } = requestHeaders;
        requestConfig.headers = headersWithoutContentType;
        requestConfig.body = body;
      } else {
        requestConfig.body = typeof body === 'string' ? body : JSON.stringify(body);
      }
    }

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, requestConfig);
        clearTimeout(timeoutId);

        // Tratar token expirado
        if (response.status === 401) {
          console.warn('[HttpClient] Token expirado ou inválido (401)');
          return this.handleUnauthorized(config, endpoint);
        }

        let responseData: any;
        const contentType = response.headers.get('content-type');

        try {
          if (contentType && contentType.includes('application/json')) {
            responseData = await response.json();
            if (process.env.NODE_ENV === 'development') {
              console.log(`[HttpClient] JSON parseado automaticamente`);
            }
          } else {
            const textData = await response.text();

            try {
              responseData = JSON.parse(textData);
              if (process.env.NODE_ENV === 'development') {
                console.log(`[HttpClient] JSON parseado manualmente de texto`);
              }
            } catch (jsonError) {
              responseData = textData;
              if (process.env.NODE_ENV === 'development') {
                console.log(`[HttpClient] Mantendo como texto`);
              }
            }
          }
        } catch (readError) {
          console.error('[HttpClient] Erro ao ler resposta:', readError);
          responseData = null;
        }

        if (process.env.NODE_ENV === 'development') {
          console.log(`[HttpClient] Response ${response.status} for ${method} ${url}`, {
            status: response.status,
            statusText: response.statusText,
            contentType,
            dataType: typeof responseData,
            data: responseData
          });
        }

        const apiResponse: ApiResponse<T> = {
          data: responseData,
          success: response.ok,
          status: response.status,
          error: !response.ok ? this.extractErrorMessage(responseData) : undefined,
          message: this.extractMessage(responseData),
          timestamp: new Date().toISOString()
        };

        // Retry apenas para erros de servidor (5xx), não para erros do cliente (4xx)
        if (!response.ok && response.status >= 500 && attempt < retries) {
          lastError = new Error(`HTTP ${response.status}: ${apiResponse.error}`);
          await this.delay(1000 * Math.pow(2, attempt));
          continue;
        }

        return apiResponse;

      } catch (error) {
        clearTimeout(timeoutId);
        lastError = error as Error;

        if (attempt < retries) {
          if (process.env.NODE_ENV === 'development') {
            console.log(`[HttpClient] Tentativa ${attempt + 1} falhou, tentando novamente...`, error);
          }
          await this.delay(1000 * Math.pow(2, attempt));
          continue;
        }
      }
    }

    const errorMessage = this.getErrorMessage(lastError);

    if (process.env.NODE_ENV === 'development') {
      console.error(`[HttpClient] Todas as tentativas falharam para ${method} ${url}:`, lastError);
    }

    return {
      success: false,
      status: 0,
      error: errorMessage,
      timestamp: new Date().toISOString()
    };
  }

  // Métodos Utilitários

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private extractErrorMessage(data: any): string {
    if (typeof data === 'string') {
      return data;
    }

    if (data && typeof data === 'object') {
      return data.message || data.error || data.detail || data.errorMessage || 'Erro na requisição';
    }

    return 'Erro desconhecido';
  }

  private extractMessage(data: any): string | undefined {
    if (data && typeof data === 'object') {
      return data.message || data.msg;
    }
    return undefined;
  }

  private getErrorMessage(error: Error | null): string {
    if (!error) return 'Erro desconhecido';

    if (error.name === 'AbortError') {
      return 'Timeout na requisição';
    }

    if (error.message.includes('fetch')) {
      return 'Erro de conexão com o servidor';
    }

    return error.message;
  }

  private sanitizeHeadersForLog(headers: Record<string, string>): Record<string, string> {
    const sanitized = { ...headers };

    if (sanitized['Authorization']) {
      sanitized['Authorization'] = sanitized['Authorization'].replace(/Bearer .+/, 'Bearer [HIDDEN]');
    }

    return sanitized;
  }

  // Métodos de Conveniência

  async get<T>(endpoint: string, params?: Record<string, any>, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<ApiResponse<T>> {
    let url = endpoint;
    if (params && Object.keys(params).length > 0) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      url += `?${searchParams.toString()}`;
    }

    return this.makeRequest<T>(url, { ...config, method: 'GET' });
  }

  async post<T>(endpoint: string, body?: any, config?: Omit<RequestConfig, 'method'>): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { ...config, method: 'POST', body });
  }

  async put<T>(endpoint: string, body?: any, config?: Omit<RequestConfig, 'method'>): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { ...config, method: 'PUT', body });
  }

  async patch<T>(endpoint: string, body?: any, config?: Omit<RequestConfig, 'method'>): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { ...config, method: 'PATCH', body });
  }

  async delete<T>(endpoint: string, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { ...config, method: 'DELETE' });
  }

  // Métodos Especiais

  async upload<T>(
    endpoint: string,
    file: File | FormData,
    config?: Omit<RequestConfig, 'method' | 'body'>
  ): Promise<ApiResponse<T>> {
    let formData: FormData;

    if (file instanceof FormData) {
      formData = file;
    } else {
      formData = new FormData();
      formData.append('file', file);
    }

    return this.makeRequest<T>(endpoint, {
      ...config,
      method: 'POST',
      body: formData,
    });
  }

  async download(endpoint: string, filename?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        headers: this.defaultHeaders,
      });

      if (!response.ok) {
        return { success: false, error: `HTTP ${response.status}` };
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      const contentDisposition = response.headers.get('content-disposition');
      let downloadFilename = filename;

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch) {
          downloadFilename = filenameMatch[1];
        }
      }

      a.download = downloadFilename || 'download';
      document.body.appendChild(a);
      a.click();

      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      return { success: true };
    } catch (error) {
      console.error('Erro no download:', error);
      return { success: false, error: 'Erro no download' };
    }
  }

  getConfig() {
    return {
      baseURL: this.baseURL,
      timeout: this.timeout,
      retries: this.retries,
      headers: { ...this.defaultHeaders }
    };
  }

  async healthCheck(): Promise<{ healthy: boolean; latency?: number; error?: string }> {
    const startTime = Date.now();

    try {
      const response = await this.get('/health', undefined, { timeout: 5000, retries: 0 });
      const latency = Date.now() - startTime;

      return {
        healthy: response.success,
        latency,
        error: response.error
      };
    } catch (error) {
      return {
        healthy: false,
        latency: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }
}

export const apiClient = new HttpClient();
export const createHttpClient = (config?: ClientConfig) => new HttpClient(config);
export const httpClient = apiClient;
export { HttpClient };
export type { ClientConfig };