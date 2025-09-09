/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/http/client.ts
interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retries?: number;
}

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
  success: boolean;
  status: number;
}

class HttpClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;
  private timeout: number;
  private retries: number;

  constructor() {
    // Configurar base URL baseado no ambiente
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
    
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    
    this.timeout = 30000; // 30 segundos
    this.retries = 3;

    // Log da inicialização em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.log('[HttpClient] Inicializado com baseURL:', this.baseURL);
    }
  }

  // Método para adicionar token de autenticação
  setAuthToken(token: string) {
    this.defaultHeaders['Authorization'] = `Bearer ${token}`;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[HttpClient] Token de autorização configurado');
    }
  }

  // Método para remover token de autenticação
  removeAuthToken() {
    delete this.defaultHeaders['Authorization'];
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[HttpClient] Token de autorização removido');
    }
  }

  // Método para adicionar headers customizados
  setHeaders(headers: Record<string, string>) {
    this.defaultHeaders = { ...this.defaultHeaders, ...headers };
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[HttpClient] Headers atualizados:', Object.keys(headers));
    }
  }

  // Método para remover um header específico
  removeHeader(headerName: string) {
    delete this.defaultHeaders[headerName];
  }

  // Método principal para fazer requisições
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

    // Construir URL completa
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`;
    
    const requestHeaders = {
      ...this.defaultHeaders,
      ...headers,
    };

    // Log da requisição em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.log(`[HttpClient] ${method} ${url}`, {
        headers: this.sanitizeHeadersForLog(requestHeaders),
        body: body ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined
      });
    }

    // Configurar AbortController para timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const requestConfig: RequestInit = {
      method,
      headers: requestHeaders,
      signal: controller.signal,
    };

    // Adicionar body para métodos que suportam
    if (body && method !== 'GET') {
      if (body instanceof FormData) {
        // Para FormData, remover Content-Type para deixar o browser definir
        delete requestConfig.headers;
        requestConfig.headers = { ...requestHeaders };
        delete (requestConfig.headers as any)['Content-Type'];
        requestConfig.body = body;
      } else {
        requestConfig.body = typeof body === 'string' ? body : JSON.stringify(body);
      }
    }

    let lastError: Error | null = null;

    // Sistema de retry
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, requestConfig);
        clearTimeout(timeoutId);

        let responseData: any;
        const contentType = response.headers.get('content-type');
        
        // Processar resposta baseado no Content-Type
        if (contentType && contentType.includes('application/json')) {
          try {
            responseData = await response.json();
          } catch (jsonError) {
            // Se não conseguir fazer parse do JSON, usar texto
            responseData = await response.text();
          }
        } else {
          responseData = await response.text();
        }

        // Log da resposta em desenvolvimento
        if (process.env.NODE_ENV === 'development') {
          console.log(`[HttpClient] Response ${response.status} for ${method} ${url}`, {
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries()),
            data: responseData
          });
        }

        const apiResponse: ApiResponse<T> = {
          data: responseData,
          success: response.ok,
          status: response.status,
          error: !response.ok ? this.extractErrorMessage(responseData) : undefined,
        };

        // Se não foi bem-sucedida e ainda temos tentativas, continue
        if (!response.ok && attempt < retries) {
          lastError = new Error(`HTTP ${response.status}: ${apiResponse.error}`);
          await this.delay(1000 * Math.pow(2, attempt)); // Backoff exponencial
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
          await this.delay(1000 * Math.pow(2, attempt)); // Backoff exponencial
          continue;
        }
      }
    }

    // Se chegou aqui, todas as tentativas falharam
    const errorMessage = this.getErrorMessage(lastError);
    
    if (process.env.NODE_ENV === 'development') {
      console.error(`[HttpClient] Todas as tentativas falharam para ${method} ${url}:`, lastError);
    }

    return {
      success: false,
      status: 0,
      error: errorMessage,
    };
  }

  // Método utilitário para delay
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Extrair mensagem de erro da resposta
  private extractErrorMessage(data: any): string {
    if (typeof data === 'string') {
      return data;
    }
    
    if (data && typeof data === 'object') {
      return data.message || data.error || data.detail || 'Erro na requisição';
    }
    
    return 'Erro desconhecido';
  }

  // Obter mensagem de erro amigável
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

  // Sanitizar headers para log (remover informações sensíveis)
  private sanitizeHeadersForLog(headers: Record<string, string>): Record<string, string> {
    const sanitized = { ...headers };
    
    // Mascarar informações sensíveis
    if (sanitized['Authorization']) {
      sanitized['Authorization'] = sanitized['Authorization'].replace(/Bearer .+/, 'Bearer [HIDDEN]');
    }
    
    return sanitized;
  }

  // Métodos de conveniência
  async get<T>(endpoint: string, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { ...config, method: 'GET' });
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

  // Método para upload de arquivos
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

  // Método para download de arquivos
  async download(endpoint: string, filename?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        headers: this.defaultHeaders,
      });

      if (!response.ok) {
        return { success: false, error: `HTTP ${response.status}` };
      }

      const blob = await response.blob();
      
      // Criar URL para download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Tentar obter filename do header ou usar o fornecido
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
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      return { success: true };
    } catch (error) {
      console.error('Erro no download:', error);
      return { success: false, error: 'Erro no download' };
    }
  }

  // Método para fazer requisições com interceptadores
  async requestWithInterceptors<T>(
    endpoint: string,
    config: RequestConfig = {},
    beforeRequest?: (config: RequestConfig) => RequestConfig,
    afterResponse?: (response: ApiResponse<T>) => ApiResponse<T>
  ): Promise<ApiResponse<T>> {
    
    // Interceptador de requisição
    let finalConfig = config;
    if (beforeRequest) {
      finalConfig = beforeRequest(config);
    }

    // Fazer requisição
    let response = await this.makeRequest<T>(endpoint, finalConfig);

    // Interceptador de resposta
    if (afterResponse) {
      response = afterResponse(response);
    }

    return response;
  }

  // Configurar timeout global
  setTimeout(timeout: number) {
    this.timeout = timeout;
  }

  // Configurar número de tentativas global
  setRetries(retries: number) {
    this.retries = retries;
  }

  // Configurar base URL
  setBaseURL(baseURL: string) {
    this.baseURL = baseURL;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[HttpClient] Base URL atualizada para:', baseURL);
    }
  }

  // Obter configurações atuais
  getConfig() {
    return {
      baseURL: this.baseURL,
      timeout: this.timeout,
      retries: this.retries,
      headers: { ...this.defaultHeaders }
    };
  }

  // Método para verificar saúde da API
  async healthCheck(): Promise<{ healthy: boolean; latency?: number; error?: string }> {
    const startTime = Date.now();
    
    try {
      const response = await this.get('/test/health', { timeout: 5000, retries: 0 });
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

// Instância singleton do cliente HTTP
export const httpClient = new HttpClient();

// Hook para usar o cliente HTTP em componentes React
export const useHttpClient = () => {
  return httpClient;
};

// Função para configurar o cliente globalmente
export const configureHttpClient = (config: {
  baseURL?: string;
  timeout?: number;
  retries?: number;
  headers?: Record<string, string>;
}) => {
  if (config.baseURL) httpClient.setBaseURL(config.baseURL);
  if (config.timeout) httpClient.setTimeout(config.timeout);
  if (config.retries) httpClient.setRetries(config.retries);
  if (config.headers) httpClient.setHeaders(config.headers);
};

// Função para criar interceptadores globais
export const setupInterceptors = () => {
  // Exemplo: interceptador para refresh automático de token
  const originalRequest = httpClient.requestWithInterceptors;
  
  // Você pode implementar interceptadores aqui
  // Por exemplo, para renovar tokens automaticamente
};

// Export do tipo para uso em outros lugares
export type { ApiResponse, RequestConfig };