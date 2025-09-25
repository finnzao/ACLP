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

  constructor(config?: ClientConfig) {
    // Configurar base URL baseado no ambiente
    this.baseURL = config?.baseURL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
    
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...config?.headers
    };
    
    this.timeout = config?.timeout || 30000; // 30 segundos
    this.retries = config?.retries || 3;

    // Log da inicialização em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.log('[HttpClient] Inicializado com baseURL:', this.baseURL);
    }
  }


  // Métodos de Configuração


  setAuthToken(token: string) {
    this.defaultHeaders['Authorization'] = `Bearer ${token}`;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[HttpClient] Token de autorização configurado');
    }
  }

  clearAuth() {
    delete this.defaultHeaders['Authorization'];
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[HttpClient] Token de autorização removido');
    }
  }

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
        const { 'Content-Type': _, ...headersWithoutContentType } = requestHeaders;
        requestConfig.headers = headersWithoutContentType;
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
        
        // ✅ CORREÇÃO MELHORADA: Processar resposta baseado no Content-Type
        try {
          if (contentType && contentType.includes('application/json')) {
            // É JSON, usar response.json() diretamente
            responseData = await response.json();
            if (process.env.NODE_ENV === 'development') {
              console.log(`[HttpClient] ✅ JSON parseado automaticamente`);
            }
          } else {
            // Não é JSON, ler como texto
            const textData = await response.text();
            
            // Tentar fazer parse como JSON mesmo assim (algumas APIs não setam Content-Type correto)
            try {
              responseData = JSON.parse(textData);
              if (process.env.NODE_ENV === 'development') {
                console.log(`[HttpClient] ✅ JSON parseado manualmente de texto`);
              }
            } catch (jsonError) {
              // Se não conseguir, usar como texto mesmo
              responseData = textData;
              if (process.env.NODE_ENV === 'development') {
                console.log(`[HttpClient] ✅ Mantendo como texto`);
              }
            }
          }
        } catch (readError) {
          console.error('[HttpClient] ❌ Erro ao ler resposta:', readError);
          responseData = null;
        }

        // Log da resposta em desenvolvimento
        if (process.env.NODE_ENV === 'development') {
          console.log(`[HttpClient] Response ${response.status} for ${method} ${url}`, {
            status: response.status,
            statusText: response.statusText,
            contentType,
            dataType: typeof responseData,
            isObject: typeof responseData === 'object',
            isArray: Array.isArray(responseData),
            hasSuccessField: responseData && typeof responseData === 'object' && 'success' in responseData,
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
      timestamp: new Date().toISOString()
    };
  }


  // Métodos Utilitários


  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Parse robusto de JSON que lida com múltiplos casos problemáticos
   */
  private parseRobustJSON(text: string): any {
    if (!text || !text.trim()) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[HttpClient] 📄 Texto vazio, retornando null`);
      }
      return null;
    }

    const trimmedText = text.trim();
    
    // Estratégia 1: Parse simples
    try {
      const result = JSON.parse(trimmedText);
      if (process.env.NODE_ENV === 'development') {
        console.log(`[HttpClient] ✅ JSON parseado normalmente`);
      }
      return result;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[HttpClient] ⚠️ Parse simples falhou:`, error.message);
      }
    }

    // Estratégia 2: Tentar extrair primeiro objeto JSON válido
    try {
      // Procurar pelo primeiro { ou [
      const firstBrace = trimmedText.indexOf('{');
      const firstBracket = trimmedText.indexOf('[');
      
      let startIndex = -1;
      if (firstBrace !== -1 && firstBracket !== -1) {
        startIndex = Math.min(firstBrace, firstBracket);
      } else if (firstBrace !== -1) {
        startIndex = firstBrace;
      } else if (firstBracket !== -1) {
        startIndex = firstBracket;
      }

      if (startIndex === -1) {
        throw new Error('Nenhum objeto/array JSON encontrado');
      }

      // Encontrar o fim do primeiro objeto/array JSON válido
      let braceCount = 0;
      let bracketCount = 0;
      let inString = false;
      let escaped = false;
      let endIndex = -1;
      
      const startChar = trimmedText[startIndex];
      
      for (let i = startIndex; i < trimmedText.length; i++) {
        const char = trimmedText[i];
        
        if (escaped) {
          escaped = false;
          continue;
        }
        
        if (char === '\\') {
          escaped = true;
          continue;
        }
        
        if (char === '"') {
          inString = !inString;
          continue;
        }
        
        if (inString) {
          continue;
        }
        
        if (char === '{') {
          braceCount++;
        } else if (char === '}') {
          braceCount--;
        } else if (char === '[') {
          bracketCount++;
        } else if (char === ']') {
          bracketCount--;
        }
        
        // Se estamos balanceados e começamos com o caractere correto
        if (startChar === '{' && braceCount === 0 && i > startIndex) {
          endIndex = i;
          break;
        } else if (startChar === '[' && bracketCount === 0 && i > startIndex) {
          endIndex = i;
          break;
        }
      }

      if (endIndex !== -1) {
        const extractedJSON = trimmedText.substring(startIndex, endIndex + 1);
        const result = JSON.parse(extractedJSON);
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`[HttpClient] ✅ JSON extraído com sucesso (${startIndex}-${endIndex})`);
          const remaining = trimmedText.substring(endIndex + 1).trim();
          if (remaining) {
            console.warn(`[HttpClient] ⚠️ Dados extras ignorados: "${remaining.substring(0, 100)}..."`);
          }
        }
        
        return result;
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[HttpClient] ⚠️ Extração de JSON falhou:`, error.message);
      }
    }

    // Estratégia 3: Tentar limpar caracteres problemáticos
    try {
      // Remover possíveis BOM, caracteres de controle, etc.
      const cleanText = trimmedText
        .replace(/^\uFEFF/, '') // Remove BOM
        .replace(/[\x00-\x1F\x7F]/g, '') // Remove caracteres de controle
        .replace(/,\s*([}\]])/g, '$1'); // Remove vírgulas trailing
      
      // Tentar encontrar JSON válido no início
      const jsonMatch = cleanText.match(/^(\{.*\}|\[.*\])/s);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[1]);
        if (process.env.NODE_ENV === 'development') {
          console.log(`[HttpClient] ✅ JSON limpo e parseado`);
        }
        return result;
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[HttpClient] ⚠️ Limpeza de JSON falhou:`, error.message);
      }
    }

    // Estratégia 4: Verificar se é uma resposta com múltiplos JSONs
    try {
      const jsonObjects = [];
      const lines = trimmedText.split('\n');
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine && (trimmedLine.startsWith('{') || trimmedLine.startsWith('['))) {
          try {
            const parsed = JSON.parse(trimmedLine);
            jsonObjects.push(parsed);
          } catch (e) {
            // Linha não é JSON válido, ignorar
          }
        }
      }
      
      if (jsonObjects.length > 0) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`[HttpClient] ✅ ${jsonObjects.length} objetos JSON encontrados em linhas separadas`);
        }
        return jsonObjects.length === 1 ? jsonObjects[0] : jsonObjects;
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[HttpClient] ⚠️ Parse de múltiplos JSONs falhou:`, error.message);
      }
    }

    // Última tentativa: retornar como texto
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[HttpClient] 📄 Todas as estratégias de parse falharam, retornando como texto`);
      console.warn(`[HttpClient] 📄 Amostra do texto:`, trimmedText.substring(0, 200) + '...');
    }
    
    return trimmedText;
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
    
    // Mascarar informações sensíveis
    if (sanitized['Authorization']) {
      sanitized['Authorization'] = sanitized['Authorization'].replace(/Bearer .+/, 'Bearer [HIDDEN]');
    }
    
    return sanitized;
  }


  // Métodos de Conveniência


  async get<T>(endpoint: string, params?: Record<string, any>, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<ApiResponse<T>> {
    // Adicionar parâmetros de query se fornecidos
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


  // Métodos de Interceptação


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


  // Métodos de Configuração e Status


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


  // Método para Request Raw (sem parsing)


  async requestRaw(endpoint: string, config: RequestConfig = {}): Promise<Response> {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`;
    
    const requestConfig: RequestInit = {
      method: config.method || 'GET',
      headers: { ...this.defaultHeaders, ...config.headers },
      signal: AbortSignal.timeout(config.timeout || this.timeout)
    };

    if (config.body && config.method !== 'GET') {
      if (config.body instanceof FormData) {
        const { 'Content-Type': _, ...headersWithoutContentType } = requestConfig.headers as Record<string, string>;
        requestConfig.headers = headersWithoutContentType;
        requestConfig.body = config.body;
      } else {
        requestConfig.body = typeof config.body === 'string' ? config.body : JSON.stringify(config.body);
      }
    }

    return await fetch(url, requestConfig);
  }
}

// Instância Singleton e Exports

// Instância padrão do cliente
export const apiClient = new HttpClient();

// Instância customizável
export const createHttpClient = (config?: ClientConfig) => new HttpClient(config);

// Hook para usar o cliente HTTP em componentes React
export const useHttpClient = () => {
  return apiClient;
};

// Função para configurar o cliente globalmente
export const configureHttpClient = (config: ClientConfig) => {
  if (config.baseURL) apiClient.setBaseURL(config.baseURL);
  if (config.timeout) apiClient.setTimeout(config.timeout);
  if (config.retries) apiClient.setRetries(config.retries);
  if (config.headers) apiClient.setHeaders(config.headers);
};

// Função para criar interceptadores globais
export const setupGlobalInterceptors = () => {
  // Interceptador de resposta para renovação de token
  const originalRequest = apiClient.requestWithInterceptors;
  
  // Exemplo de interceptador para tratamento global de erros
  return (endpoint: string, config: RequestConfig = {}) => {
    return originalRequest.call(apiClient, endpoint, config,
      // Before request
      (config) => {
        // Adicionar timestamp a todas as requisições
        return {
          ...config,
          headers: {
            ...config.headers,
            'X-Request-Time': new Date().toISOString()
          }
        };
      },
      // After response
      (response) => {
        // Log de erros globais
        if (!response.success && response.status >= 500) {
          console.error('[HttpClient] Erro do servidor:', response.error);
        }
        return response;
      }
    );
  };
};

// Aliases para compatibilidade
export const httpClient = apiClient;
export { HttpClient };

// Export dos tipos
export type { RequestConfig, ApiResponse, ClientConfig };