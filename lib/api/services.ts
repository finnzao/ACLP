/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiClient, ApiResponse } from '../http/client';
import { httpClient } from '@/lib/http/client';
import { requestCache } from '@/lib/cache/requestCache';
import type {
  CustodiadoResponse,
  ComparecimentoResponse,
  UsuarioResponse,
  CustodiadoDTO,
  ComparecimentoDTO,
  UsuarioDTO,
  StatusComparecimento,
  PeriodoParams,
  BuscarParams,
  EstatisticasComparecimentoResponse,
  ResumoSistemaResponse,
  SetupStatusResponse,
  SetupAdminDTO,
  HealthResponse,
  AppInfoResponse,
  StatusVerificacaoResponse,
  StatusEstatisticasResponse,
  ListarCustodiadosResponse,
  ListarComparecimentosParams,
  ListarComparecimentosResponse,
  ValidarConviteResponse,
} from '@/types/api';

const ENDPOINTS = {
  BASE: '/comparecimentos',
  REGISTRAR: '/comparecimentos/registrar',
  CUSTODIADO: (id: number) => `/comparecimentos/custodiado/${id}`,
  PERIODO: '/comparecimentos/periodo',
  HOJE: '/comparecimentos/hoje',
  ESTATISTICAS: '/comparecimentos/estatisticas',
  RESUMO: '/comparecimentos/resumo/sistema',
  TODOS: '/comparecimentos/todos',
  FILTRAR: '/comparecimentos/filtrar'
} as const;

export function initializeBackendApi() {
  console.log('[Services] API inicializada');
}

export function configureAuthHeaders(token: string) {
  apiClient.setAuthToken(token);
  console.log('[Services] Token de autenticação configurado');
}

export function clearAuthHeaders() {
  apiClient.clearAuth();
  console.log('[Services] Token de autenticação removido');
}

// Custodiados Service

export const custodiadosService = {
  async listar(options?: {
    forceRefresh?: boolean;
    cacheTimeout?: number;
  }): Promise<ListarCustodiadosResponse> {
    const cacheKey = 'custodiados:list';
    const cacheTimeout = options?.cacheTimeout || 5 * 60 * 1000;

    if (!options?.forceRefresh) {
      const cached = requestCache.get<ListarCustodiadosResponse>(cacheKey);
      if (cached) {
        console.log('[CustodiadosService] Retornando dados do cache');
        return cached;
      }
    }

    try {
      const response = await apiClient.get<any>('/custodiados');
      console.log('[CustodiadosService] Resposta bruta:', response);

      let parsedData: any;

      try {
        if (typeof response.data === 'string') {
          const trimmedData = response.data.trim();

          if (trimmedData.length === 0) {
            console.warn('[CustodiadosService] Resposta vazia do servidor');
            return {
              success: false,
              message: 'Servidor retornou resposta vazia',
              data: []
            };
          }

          parsedData = JSON.parse(trimmedData);
          console.log('[CustodiadosService] JSON parseado:', parsedData);
        } else if (response.data === null || response.data === undefined) {
          console.warn('[CustodiadosService] Resposta nula do servidor');
          return {
            success: false,
            message: 'Servidor não retornou dados',
            data: []
          };
        } else {
          parsedData = response.data;
          console.log('[CustodiadosService] Data já é objeto:', parsedData);
        }
      } catch (parseError) {
        console.error('[CustodiadosService] Erro no parse do JSON:', parseError);
        return {
          success: false,
          message: 'Erro ao processar resposta do servidor',
          data: []
        };
      }

      let result: ListarCustodiadosResponse = {
        success: false,
        message: 'Nenhum custodiado encontrado',
        data: []
      };

      if (parsedData && parsedData.success && Array.isArray(parsedData.data)) {
        console.log('[CustodiadosService] Estrutura correta encontrada:', parsedData.data.length);
        result = {
          success: true,
          message: parsedData.message || `${parsedData.data.length} custodiados carregados`,
          data: parsedData.data
        };
      }
      else if (Array.isArray(parsedData)) {
        console.log('[CustodiadosService] Dados são array direto:', parsedData.length);
        result = {
          success: true,
          message: `${parsedData.length} custodiados carregados`,
          data: parsedData
        };
      }
      else if (parsedData && typeof parsedData === 'object') {
        for (const [key, value] of Object.entries(parsedData)) {
          if (Array.isArray(value)) {
            console.log('[CustodiadosService] Array encontrado em:', key, value.length);
            result = {
              success: true,
              message: `${value.length} custodiados carregados`,
              data: value
            };
            break;
          }
        }
      }

      if (result.success && result.data.length > 0) {
        requestCache.set(cacheKey, result, cacheTimeout);
        console.log(`[CustodiadosService] ${result.data.length} custodiados cacheados`);
      }

      return result;

    } catch (error) {
      console.error('[CustodiadosService] Erro ao listar custodiados:', error);

      if (error instanceof TypeError && error.message.includes('fetch')) {
        return {
          success: false,
          message: 'Erro de conexão com o servidor',
          data: []
        };
      }

      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erro ao listar custodiados',
        data: []
      };
    }
  },

  async buscarPorId(id: number, options?: {
    forceRefresh?: boolean;
    cacheTimeout?: number;
  }): Promise<CustodiadoResponse | null> {
    const cacheKey = `custodiados:id:${id}`;
    const cacheTimeout = options?.cacheTimeout || 2 * 60 * 1000;

    if (!options?.forceRefresh) {
      const cached = requestCache.get<CustodiadoResponse>(cacheKey);
      if (cached) {
        console.log(`[CustodiadosService] Retornando custodiado ${id} do cache`);
        return cached;
      }
    }

    try {
      console.log(`[CustodiadosService] Buscando custodiado ID: ${id}`);
      const response = await apiClient.get<CustodiadoResponse>(`/custodiados/${id}`);

      const result = response.success ? response.data || null : null;

      if (result) {
        requestCache.set(cacheKey, result, cacheTimeout);
      }

      return result;

    } catch (error) {
      console.error(`[CustodiadosService] Erro ao buscar custodiado ${id}:`, error);
      return null;
    }
  },

  async criar(data: CustodiadoDTO): Promise<ApiResponse<CustodiadoResponse>> {
    try {
      console.log('[CustodiadosService] Criando custodiado:', data);

      const response = await apiClient.post<CustodiadoResponse>('/custodiados', data);

      if (response.success) {
        requestCache.clear('custodiados:list');
        console.log('[CustodiadosService] Cache da lista invalidado após criação');
      }

      return response;

    } catch (error) {
      console.error('[CustodiadosService] Erro ao criar custodiado:', error);

      return {
        success: false,
        status: 500,
        message: error instanceof Error ? error.message : 'Erro ao criar custodiado',
        data: undefined
      };
    }
  },

  async atualizar(
    id: number,
    data: Partial<CustodiadoDTO>
  ): Promise<ApiResponse<CustodiadoResponse>> {
    try {
      console.log(`[CustodiadosService] Atualizando custodiado ID: ${id}`, data);

      const response = await apiClient.put<CustodiadoResponse>(`/custodiados/${id}`, data);

      if (response.success) {
        requestCache.clear('custodiados:list');
        requestCache.clear(`custodiados:id:${id}`);
        console.log('[CustodiadosService] Caches invalidados após atualização');
      }

      return response;

    } catch (error) {
      console.error(`[CustodiadosService] Erro ao atualizar custodiado ${id}:`, error);

      return {
        success: false,
        status: 500,
        message: error instanceof Error ? error.message : 'Erro ao atualizar custodiado',
        data: undefined
      };
    }
  },

  async excluir(id: number): Promise<ApiResponse<void>> {
    try {
      console.log(`[CustodiadosService] Excluindo custodiado ID: ${id}`);

      const response = await apiClient.delete<void>(`/custodiados/${id}`);

      if (response.success) {
        requestCache.clear('custodiados:list');
        requestCache.clear(`custodiados:id:${id}`);
        console.log('[CustodiadosService] Caches invalidados após exclusão');
      }

      return response;

    } catch (error) {
      console.error(`[CustodiadosService] Erro ao excluir custodiado ${id}:`, error);

      return {
        success: false,
        status: 500,
        message: error instanceof Error ? error.message : 'Erro ao excluir custodiado'
      };
    }
  },

  async buscarPorProcesso(
    processo: string,
    options?: { forceRefresh?: boolean; cacheTimeout?: number }
  ): Promise<CustodiadoResponse | null> {
    const cacheKey = `custodiados:processo:${processo}`;
    const cacheTimeout = options?.cacheTimeout || 3 * 60 * 1000;

    if (!options?.forceRefresh) {
      const cached = requestCache.get<CustodiadoResponse>(cacheKey);
      if (cached) {
        console.log(`[CustodiadosService] Retornando processo ${processo} do cache`);
        return cached;
      }
    }

    try {
      console.log(`[CustodiadosService] Buscando por processo: ${processo}`);

      const response = await apiClient.get<CustodiadoResponse>(
        `/custodiados/processo/${encodeURIComponent(processo)}`
      );

      const result = response.success ? response.data || null : null;

      if (result) {
        requestCache.set(cacheKey, result, cacheTimeout);
      }

      return result;

    } catch (error) {
      console.error(`[CustodiadosService] Erro ao buscar processo ${processo}:`, error);
      return null;
    }
  },

  async buscarPorStatus(
    status: StatusComparecimento,
    options?: { forceRefresh?: boolean; cacheTimeout?: number }
  ): Promise<CustodiadoResponse[]> {
    const cacheKey = `custodiados:status:${status}`;
    const cacheTimeout = options?.cacheTimeout || 2 * 60 * 1000;

    if (!options?.forceRefresh) {
      const cached = requestCache.get<CustodiadoResponse[]>(cacheKey);
      if (cached) {
        console.log(`[CustodiadosService] Retornando status ${status} do cache`);
        return cached;
      }
    }

    try {
      console.log(`[CustodiadosService] Buscando por status: ${status}`);

      const response = await apiClient.get<CustodiadoResponse[]>(
        `/custodiados/status/${status}`
      );

      const result = response.success ? response.data || [] : [];

      if (result.length > 0) {
        requestCache.set(cacheKey, result, cacheTimeout);
      }

      return result;

    } catch (error) {
      console.error(`[CustodiadosService] Erro ao buscar por status ${status}:`, error);
      return [];
    }
  },

  async buscarInadimplentes(options?: {
    forceRefresh?: boolean;
    cacheTimeout?: number;
  }): Promise<CustodiadoResponse[]> {
    const cacheKey = 'custodiados:inadimplentes';
    const cacheTimeout = options?.cacheTimeout || 1 * 60 * 1000;

    if (!options?.forceRefresh) {
      const cached = requestCache.get<CustodiadoResponse[]>(cacheKey);
      if (cached) {
        console.log('[CustodiadosService] Retornando inadimplentes do cache');
        return cached;
      }
    }

    try {
      console.log('[CustodiadosService] Buscando inadimplentes');

      const response = await apiClient.get<CustodiadoResponse[]>(
        '/custodiados/inadimplentes'
      );

      const result = response.success ? response.data || [] : [];

      requestCache.set(cacheKey, result, cacheTimeout);

      return result;

    } catch (error) {
      console.error('[CustodiadosService] Erro ao buscar inadimplentes:', error);
      return [];
    }
  },

  async buscar(params: BuscarParams): Promise<CustodiadoResponse[]> {
    try {
      console.log('[CustodiadosService] Fazendo busca com parâmetros:', params);

      const response = await apiClient.get<CustodiadoResponse[]>(
        '/custodiados/buscar',
        params
      );

      return response.success ? response.data || [] : [];

    } catch (error) {
      console.error('[CustodiadosService] Erro na busca:', error);
      return [];
    }
  },

  invalidarCache(): void {
    console.log('[CustodiadosService] Invalidando todo o cache de custodiados');
    requestCache.clear('custodiados:list');
    requestCache.clear('custodiados:inadimplentes');
  },

  async precarregar(): Promise<void> {
    console.log('[CustodiadosService] Pré-carregando dados...');

    try {
      await this.listar();
      await this.buscarInadimplentes();
      console.log('[CustodiadosService] Pré-carregamento concluído');
    } catch (error) {
      console.error('[CustodiadosService] Erro no pré-carregamento:', error);
    }
  },

  estatisticasCache(): {
    listaCacheada: boolean;
    inadimplentesCacheados: boolean;
  } {
    return {
      listaCacheada: requestCache.has('custodiados:list'),
      inadimplentesCacheados: requestCache.has('custodiados:inadimplentes')
    };
  }
};

// Comparecimentos Service

export const comparecimentosService = {
  async registrar(data: ComparecimentoDTO): Promise<ApiResponse<ComparecimentoResponse>> {
    try {
      console.log('[ComparecimentosService] Registrando comparecimento:', data);

      const response = await httpClient.post<ComparecimentoResponse>(
        ENDPOINTS.REGISTRAR,
        data
      );

      console.log('[ComparecimentosService] Resposta do registro:', response);

      return {
        success: response.success,
        message: response.message || (response.success ? 'Comparecimento registrado com sucesso' : 'Erro ao registrar comparecimento'),
        data: response.data,
        status: response.status,
        timestamp: response.timestamp || new Date().toISOString()
      };
    } catch (error: any) {
      console.error('[ComparecimentosService] Erro ao registrar:', error);
      return {
        success: false,
        message: error.message || 'Erro ao registrar comparecimento',
        status: error.status || 500,
        timestamp: new Date().toISOString()
      };
    }
  },

  async buscarPorCustodiado(custodiadoId: number): Promise<ComparecimentoResponse[]> {
    try {
      console.log('[ComparecimentosService] Buscando comparecimentos do custodiado:', custodiadoId);

      const response = await httpClient.get<ComparecimentoResponse[]>(
        ENDPOINTS.CUSTODIADO(custodiadoId)
      );

      if (response.success && response.data) {
        if (Array.isArray(response.data)) {
          return response.data;
        }
        if ((response.data as any).data && Array.isArray((response.data as any).data)) {
          return (response.data as any).data;
        }
      }

      console.warn('[ComparecimentosService] Resposta inesperada:', response);
      return [];
    } catch (error: any) {
      console.error('[ComparecimentosService] Erro ao buscar por custodiado:', error);
      return [];
    }
  },

  async buscarPorPeriodo(params: PeriodoParams): Promise<ComparecimentoResponse[]> {
    try {
      console.log('[ComparecimentosService] Buscando por período:', params);

      const response = await httpClient.get<ComparecimentoResponse[]>(
        ENDPOINTS.PERIODO,
        params
      );

      if (response.success && response.data) {
        if (Array.isArray(response.data)) {
          return response.data;
        }
        if ((response.data as any).data && Array.isArray((response.data as any).data)) {
          return (response.data as any).data;
        }
      }

      return [];
    } catch (error: any) {
      console.error('[ComparecimentosService] Erro ao buscar por período:', error);
      return [];
    }
  },

  async comparecimentosHoje(): Promise<ComparecimentoResponse[]> {
    try {
      console.log('[ComparecimentosService] Buscando comparecimentos de hoje');

      const response = await httpClient.get<ComparecimentoResponse[]>(ENDPOINTS.HOJE);

      if (response.success && response.data) {
        if (Array.isArray(response.data)) {
          return response.data;
        }
        if ((response.data as any).data && Array.isArray((response.data as any).data)) {
          return (response.data as any).data;
        }
      }

      return [];
    } catch (error: any) {
      console.error('[ComparecimentosService] Erro ao buscar comparecimentos de hoje:', error);
      return [];
    }
  },

  async obterEstatisticas(params?: PeriodoParams): Promise<EstatisticasComparecimentoResponse> {
    try {
      console.log('[ComparecimentosService] Obtendo estatísticas:', params);

      const response = await httpClient.get<EstatisticasComparecimentoResponse>(
        ENDPOINTS.ESTATISTICAS,
        params
      );

      if (response.success && response.data) {
        return response.data;
      }

      return {
        totalComparecimentos: 0,
        comparecimentosPresenciais: 0,
        comparecimentosOnline: 0,
        cadastrosIniciais: 0,
        mudancasEndereco: 0,
        mediaDiasEntreMudancas: 0,
        periodo: params ? {
          dataInicio: params.dataInicio,
          dataFim: params.dataFim
        } : undefined
      };
    } catch (error: any) {
      console.error('[ComparecimentosService] Erro ao obter estatísticas:', error);
      return {
        totalComparecimentos: 0,
        comparecimentosPresenciais: 0,
        comparecimentosOnline: 0,
        cadastrosIniciais: 0,
        mudancasEndereco: 0,
        mediaDiasEntreMudancas: 0
      };
    }
  },

  async obterResumoSistema(): Promise<ResumoSistemaResponse> {
    try {
      console.log('[ComparecimentosService] Obtendo resumo do sistema');

      const response = await httpClient.get<any>('/comparecimentos/resumo/sistema');

      console.log('[ComparecimentosService] Resposta recebida:', response);

      if (response.success && response.data) {
        if (response.data.data && typeof response.data.data === 'object') {
          console.log('[ComparecimentosService] Retornando response.data.data');
          return response.data.data as ResumoSistemaResponse;
        }

        if (response.data.totalCustodiados !== undefined) {
          console.log('[ComparecimentosService] Retornando response.data diretamente');
          return response.data as ResumoSistemaResponse;
        }

        if (typeof response.data === 'object' && response.data !== null) {
          const possibleData = response.data.data || response.data;
          if (possibleData && possibleData.totalCustodiados !== undefined) {
            console.log('[ComparecimentosService] Retornando dados aninhados');
            return possibleData as ResumoSistemaResponse;
          }
        }
      }


      console.warn('[ComparecimentosService] Dados não encontrados na resposta, retornando estrutura padrão');
      return {
        totalCustodiados: 0,
        custodiadosEmConformidade: 0,
        custodiadosInadimplentes: 0,
        comparecimentosHoje: 0,
        comparecimentosAtrasados: 0,
        proximosComparecimentos7Dias: 0,
        totalComparecimentos: 0,
        ultimaAtualizacao: new Date().toISOString()
      };
    } catch (error: any) {
      console.error('[ComparecimentosService] Erro ao obter resumo:', error);

      return {
        totalCustodiados: 0,
        custodiadosEmConformidade: 0,
        custodiadosInadimplentes: 0,
        comparecimentosHoje: 0,
        comparecimentosAtrasados: 0,
        proximosComparecimentos7Dias: 0,
        totalComparecimentos: 0,
        ultimaAtualizacao: new Date().toISOString()
      };
    }
  },

  async listarTodos(params?: ListarComparecimentosParams): Promise<ApiResponse<any>> {
    try {
      console.log('[ComparecimentosService] Listando todos os comparecimentos:', params);

      const queryParams = {
        page: params?.page ?? 0,
        size: params?.size ?? 50
      };

      const response = await httpClient.get<any>(
        ENDPOINTS.TODOS,
        queryParams
      );

      console.log('[ComparecimentosService] Resposta de listarTodos:', response);

      if (response.success && response.data) {
        if (response.data.comparecimentos && Array.isArray(response.data.comparecimentos)) {
          console.log('[ComparecimentosService] Estrutura paginada detectada');
          return {
            success: true,
            message: response.message || 'Comparecimentos listados com sucesso',
            data: {
              comparecimentos: response.data.comparecimentos,
              paginaAtual: response.data.paginaAtual ?? 0,
              totalPaginas: response.data.totalPaginas ?? 1,
              totalItens: response.data.totalItens ?? response.data.comparecimentos.length,
              itensPorPagina: response.data.itensPorPagina ?? response.data.comparecimentos.length,
              temProxima: response.data.temProxima ?? false,
              temAnterior: response.data.temAnterior ?? false
            },
            status: response.status,
            timestamp: response.timestamp || new Date().toISOString()
          };
        }

        if (Array.isArray(response.data)) {
          console.log('[ComparecimentosService] Array direto detectado');
          return {
            success: true,
            message: 'Comparecimentos listados com sucesso',
            data: {
              comparecimentos: response.data,
              paginaAtual: queryParams.page,
              totalPaginas: 1,
              totalItens: response.data.length,
              itensPorPagina: response.data.length,
              temProxima: false,
              temAnterior: false
            },
            status: response.status,
            timestamp: response.timestamp || new Date().toISOString()
          };
        }

        if (response.data.data && response.data.data.comparecimentos) {
          console.log('[ComparecimentosService] Estrutura aninhada detectada');
          const nested = response.data.data;
          return {
            success: true,
            message: response.message || 'Comparecimentos listados com sucesso',
            data: {
              comparecimentos: nested.comparecimentos,
              paginaAtual: nested.paginaAtual ?? 0,
              totalPaginas: nested.totalPaginas ?? 1,
              totalItens: nested.totalItens ?? nested.comparecimentos.length,
              itensPorPagina: nested.itensPorPagina ?? nested.comparecimentos.length,
              temProxima: nested.temProxima ?? false,
              temAnterior: nested.temAnterior ?? false
            },
            status: response.status,
            timestamp: response.timestamp || new Date().toISOString()
          };
        }
      }

      console.warn('[ComparecimentosService] Estrutura de resposta não reconhecida');
      return {
        success: false,
        message: response.message || 'Erro ao listar comparecimentos',
        status: response.status || 500,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      console.error('[ComparecimentosService] Erro ao listar todos:', error);
      return {
        success: false,
        message: error.message || 'Erro ao listar comparecimentos',
        status: error.status || 500,
        timestamp: new Date().toISOString()
      };
    }
  },

  async filtrar(params: {
    dataInicio?: string;
    dataFim?: string;
    tipoValidacao?: 'PRESENCIAL' | 'ONLINE' | 'CADASTRO_INICIAL';
    page?: number;
    size?: number;
  }): Promise<ApiResponse<ListarComparecimentosResponse>> {
    try {
      console.log('[ComparecimentosService] Filtrando comparecimentos:', params);

      const response = await httpClient.get<any>(
        ENDPOINTS.FILTRAR,
        params
      );

      console.log('[ComparecimentosService] Resposta de filtrar:', response);

      if (response.success && response.data) {
        if (response.data.comparecimentos) {
          return {
            success: true,
            message: response.message || 'Comparecimentos filtrados com sucesso',
            data: response.data,
            status: response.status,
            timestamp: response.timestamp || new Date().toISOString()
          };
        }

        if (Array.isArray(response.data)) {
          return {
            success: true,
            message: 'Comparecimentos filtrados com sucesso',
            data: {
              comparecimentos: response.data,
              paginaAtual: params?.page || 0,
              totalPaginas: 1,
              totalItens: response.data.length,
              itensPorPagina: response.data.length,
              temProxima: false,
              temAnterior: false
            },
            status: response.status,
            timestamp: response.timestamp || new Date().toISOString()
          };
        }
      }

      return {
        success: false,
        message: response.message || 'Erro ao filtrar comparecimentos',
        status: response.status || 500,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      console.error('[ComparecimentosService] Erro ao filtrar:', error);
      return {
        success: false,
        message: error.message || 'Erro ao filtrar comparecimentos',
        status: error.status || 500,
        timestamp: new Date().toISOString()
      };
    }
  }
};

// Usuários Service

export const usuariosService = {
  async listar(): Promise<UsuarioResponse[]> {
    console.log('[UsuariosService] Listando usuários');
    const response = await apiClient.get<UsuarioResponse[]>('/usuarios');
    return response.success ? response.data || [] : [];
  },

  async criar(data: UsuarioDTO): Promise<ApiResponse<UsuarioResponse>> {
    console.log('[UsuariosService] Criando usuário:', data);
    return await apiClient.post<UsuarioResponse>('/usuarios', data);
  },

  async atualizar(id: number, data: Partial<UsuarioDTO>): Promise<ApiResponse<UsuarioResponse>> {
    console.log(`[UsuariosService] Atualizando usuário ID: ${id}`);
    console.log('[UsuariosService] Dados recebidos:', data);
    
    const dadosLimpos: Record<string, any> = {};
    
    Object.entries(data).forEach(([key, value]) => {

      if (value !== undefined && value !== null) {
        dadosLimpos[key] = value;
      }
    });
    
    console.log('[UsuariosService] Dados limpos a serem enviados:', dadosLimpos);
    
    try {
      const response = await apiClient.put<UsuarioResponse>(
        `/usuarios/${id}`, 
        dadosLimpos
      );
      
      console.log('[UsuariosService] Resposta da API:', response);
      
      return response;
    } catch (error: any) {
      console.error('[UsuariosService] Erro ao atualizar:', error);
      
      if (error.response) {
        console.error('[UsuariosService] Status:', error.response.status);
        console.error('[UsuariosService] Data:', error.response.data);
        console.error('[UsuariosService] Headers:', error.response.headers);
      }
      
      throw error;
    }
  }
};

export interface LoginRequest {
  email: string;
  senha: string;
  rememberMe?: boolean;
  forceLogin?: boolean;
}

export interface LoginResponse {
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
    ultimoLogin: string;
    mfaEnabled: boolean;
  };
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface LogoutRequest {
  refreshToken: string;
  logoutAllDevices?: boolean;
}

export interface AlterarSenhaRequest {
  senhaAtual: string;
  novaSenha: string;
  confirmaSenha: string;
}

export interface ResetSenhaRequest {
  email: string;
}

export interface ConfirmarResetRequest {
  token: string;
  novaSenha: string;
  confirmaSenha: string;
}

export interface ConviteDTO {
  nome: string;
  email: string;
  tipoUsuario: 'ADMIN' | 'USUARIO';
  departamento?: string;
  telefone?: string;
  escopo?: string;
  validadeHoras?: number;
  mensagemPersonalizada?: string;
}

export interface ConviteResponse {
  id: number;
  token: string;
  email: string;
  nome: string;
  tipoUsuario: string;
  linkAtivacao: string;
  expiraEm: string;
  horasValidade: number;
  status: 'PENDENTE' | 'ACEITO' | 'EXPIRADO' | 'CANCELADO';
  criadoPor?: string;
  criadoEm: string;
  aceitoEm?: string;
  departamento?: string;
  telefone?: string;
}



export interface AtivarContaDTO {
  nome?:string;
  token: string;
  senha: string;
  confirmaSenha: string;
  habilitarMFA?: boolean;
}

export interface ReenviarConviteDTO {
  novaValidadeHoras?: number;
  mensagemPersonalizada?: string;
}

export const convitesService = {
  async criarConvite(data: ConviteDTO): Promise<ApiResponse<ConviteResponse>> {
    console.log('[ConvitesService] Criando convite para:', data.email);
    
    try {
      const response = await apiClient.post<ConviteResponse>(
        '/usuarios/convites', 
        data,
        { timeout: 10000 }
      );
      
      console.log('[ConvitesService] Resposta recebida:', response);
      
      if (response.success || response.status === 201) {
        return {
          ...response,
          success: true,
          message: response.message || 'Convite criado! O email será enviado em breve.',
          status: response.status || 201
        };
      }
      
      return response;
      
    } catch (error: any) {
      console.error('[ConvitesService] Erro ao criar convite:', error);
      
      if (error.name === 'AbortError') {
        return {
          success: true,
          status: 202,
          message: 'Convite está sendo processado. O email será enviado em breve.',
          timestamp: new Date().toISOString()
        };
      }
      
      return {
        success: false,
        status: error.status || 500,
        message: error.message || 'Erro ao criar convite',
        timestamp: new Date().toISOString()
      };
    }
  },

  async listarConvites(status?: string): Promise<ApiResponse<ConviteResponse[]>> {
    console.log('[ConvitesService] Listando convites', status ? `com status: ${status}` : '');
    const params = status ? { status } : undefined;
    return await apiClient.get<ConviteResponse[]>('/usuarios/convites', params);
  },

  async validarToken(token: string): Promise<ApiResponse<ValidarConviteResponse>> {
    console.log('[ConvitesService] Validando token de convite');
    return await apiClient.get<ValidarConviteResponse>(`/usuarios/convites/validar/${token}`);
  },

  async ativarConta(data: AtivarContaDTO): Promise<ApiResponse<{
    id: number;
    email: string;
    nome: string;
    tipo: string;
  }>> {
    console.log('[ConvitesService] Ativando conta');
    return await apiClient.post('/usuarios/convites/ativar', data);
  },

  async reenviarConvite(id: number, data: ReenviarConviteDTO): Promise<ApiResponse<ConviteResponse>> {
    console.log('[ConvitesService] Reenviando convite:', id);
    return await apiClient.post<ConviteResponse>(`/usuarios/convites/${id}/reenviar`, data);
  },

  async cancelarConvite(id: number, motivo?: string): Promise<ApiResponse<void>> {
    console.log('[ConvitesService] Cancelando convite:', id);
    if (motivo) {
      return await apiClient.post<void>(`/usuarios/convites/${id}/cancelar`, { motivo });
    }
    return await apiClient.delete<void>(`/usuarios/convites/${id}`);
  }
};

export const authService = {
  async login(data: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    console.log('[AuthService] Realizando login para:', data.email);
    try {
      const response = await apiClient.post<LoginResponse>('/auth/login', data);
      return response;
    } catch (error: any) {
      console.error('[AuthService] Erro no login:', error);
      if (error.response?.status === 401) {
        return {
          success: false,
          status: 401,
          message: error.response?.data?.message || 'Email ou senha incorretos',
          error: error.response?.data
        };
      }
      throw error;
    }
  },

  async logout(data?: LogoutRequest): Promise<ApiResponse<void>> {
    console.log('[AuthService] Realizando logout');
    try {
      const response = await apiClient.post<void>('/auth/logout', data || {});
      return response;
    } catch (error: any) {
      console.error('[AuthService] Erro no logout:', error);
      return { success: true, status: 200 };
    }
  },

  async refreshToken(data: RefreshTokenRequest): Promise<ApiResponse<LoginResponse>> {
    console.log('[AuthService] Renovando token');
    try {
      const response = await apiClient.post<LoginResponse>('/auth/refresh', data);
      return response;
    } catch (error: any) {
      console.error('[AuthService] Erro ao renovar token:', error);
      return {
        success: false,
        status: error.response?.status || 500,
        message: error.response?.data?.message || 'Erro ao renovar token',
        error: error.response?.data
      };
    }
  },

  async validateToken(): Promise<ApiResponse<{
    valid: boolean;
    email?: string;
    expiration?: string;
    authorities?: string[];
    message?: string;
  }>> {
    console.log('[AuthService] Validando token');
    try {
      const response = await apiClient.get<{
        valid: boolean;
        email?: string;
        expiration?: string;
        authorities?: string[];
        message?: string;
      }>('/auth/validate');
      return response;
    } catch (error: any) {
      console.error('[AuthService] Erro ao validar token:', error);
      return {
        success: false,
        status: error.response?.status || 401,
        data: { valid: false, message: 'Token inválido' }
      };
    }
  },

  async alterarSenha(data: AlterarSenhaRequest): Promise<ApiResponse<void>> {
    console.log('[AuthService] Alterando senha');
    try {
      const response = await apiClient.post<void>('/auth/change-password', data);
      return response;
    } catch (error: any) {
      console.error('[AuthService] Erro ao alterar senha:', error);
      return {
        success: false,
        status: error.response?.status || 500,
        message: error.response?.data?.message || 'Erro ao alterar senha',
        error: error.response?.data
      };
    }
  },

  async solicitarResetSenha(data: ResetSenhaRequest): Promise<ApiResponse<void>> {
    console.log('[AuthService] Solicitando reset de senha para:', data.email);
    try {
      const response = await apiClient.post<void>('/auth/forgot-password', data);
      return response;
    } catch (error: any) {
      console.error('[AuthService] Erro ao solicitar reset:', error);
      return {
        success: true,
        status: 200,
        message: 'Se o email estiver cadastrado, você receberá instruções para recuperação'
      };
    }
  },

  async confirmarResetSenha(data: ConfirmarResetRequest): Promise<ApiResponse<void>> {
    console.log('[AuthService] Confirmando reset de senha');
    try {
      const response = await apiClient.post<void>('/auth/reset-password', data);
      return response;
    } catch (error: any) {
      console.error('[AuthService] Erro ao confirmar reset:', error);
      return {
        success: false,
        status: error.response?.status || 400,
        message: error.response?.data?.message || 'Token inválido ou expirado',
        error: error.response?.data
      };
    }
  },

  async getProfile(): Promise<ApiResponse<UsuarioResponse>> {
    console.log('[AuthService] Obtendo perfil do usuário');
    try {
      const response = await apiClient.get<any>('/auth/me');

      if (response.success && response.data) {
        return {
          success: true,
          status: response.status,
          data: response.data.data || response.data
        };
      }

      return response;
    } catch (error: any) {
      console.error('[AuthService] Erro ao obter perfil:', error);
      return {
        success: false,
        status: error.response?.status || 500,
        message: error.response?.data?.message || 'Erro ao obter perfil',
        error: error.response?.data
      };
    }
  },

  async getSessionInfo(): Promise<ApiResponse<{
    sessionId: string;
    userEmail: string;
    ipAddress: string;
    userAgent: string;
    loginTime: string;
    lastActivity: string;
    expiresAt: string;
  }>> {
    console.log('[AuthService] Obtendo informações da sessão');
    try {
      const response = await apiClient.get<{
        sessionId: string;
        userEmail: string;
        ipAddress: string;
        userAgent: string;
        loginTime: string;
        lastActivity: string;
        expiresAt: string;
      }>('/auth/session');
      return response;
    } catch (error: any) {
      console.error('[AuthService] Erro ao obter sessão:', error);
      return {
        success: false,
        status: error.response?.status || 500,
        message: error.response?.data?.message || 'Erro ao obter sessão'
      };
    }
  },

  async getUserSessions(): Promise<ApiResponse<any[]>> {
    console.log('[AuthService] Listando sessões do usuário');
    try {
      const response = await apiClient.get<any[]>('/auth/sessions');
      return response;
    } catch (error: any) {
      console.error('[AuthService] Erro ao listar sessões:', error);
      return {
        success: false,
        status: error.response?.status || 500,
        message: error.response?.data?.message || 'Erro ao listar sessões',
        data: []
      };
    }
  },

  async invalidateSession(sessionId: string): Promise<ApiResponse<void>> {
    console.log('[AuthService] Invalidando sessão:', sessionId);
    try {
      const response = await apiClient.delete<void>(`/auth/sessions/${sessionId}`);
      return response;
    } catch (error: any) {
      console.error('[AuthService] Erro ao invalidar sessão:', error);
      return {
        success: false,
        status: error.response?.status || 500,
        message: error.response?.data?.message || 'Erro ao invalidar sessão'
      };
    }
  },

  async checkSetup(): Promise<ApiResponse<{
    setupRequired: boolean;
    message: string;
  }>> {
    console.log('[AuthService] Verificando setup');
    try {
      const response = await apiClient.get<{
        setupRequired: boolean;
        message: string;
      }>('/auth/check-setup');
      return response;
    } catch (error: any) {
      console.error('[AuthService] Erro ao verificar setup:', error);
      return {
        success: false,
        status: error.response?.status || 500,
        data: { setupRequired: false, message: 'Erro ao verificar setup' }
      };
    }
  }
};

export const statusService = {
  async verificarInadimplentes(): Promise<ApiResponse<StatusVerificacaoResponse>> {
    console.log('[StatusService] Verificando inadimplentes');
    return await apiClient.post<StatusVerificacaoResponse>('/status/verificar-inadimplentes');
  },

  async obterEstatisticas(): Promise<StatusEstatisticasResponse | null> {
    console.log('[StatusService] Obtendo estatísticas');
    const response = await apiClient.get<StatusEstatisticasResponse>('/status/estatisticas');
    return response.success ? response.data || null : null;
  }
};

export const setupService = {
  async getStatus(): Promise<SetupStatusResponse> {
    console.log('[SetupService] Verificando status do setup');
    const response = await apiClient.get<SetupStatusResponse>(
      '/setup/status',
      undefined,
      { requireAuth: false }
    );

    return response.data || {
      setupRequired: true,
      setupCompleted: false,
      configured: false,
      timestamp: new Date().toISOString()
    };
  },

  async createAdmin(data: SetupAdminDTO): Promise<ApiResponse<any>> {
    console.log('[SetupService] Criando administrador inicial');
    return await apiClient.post('/setup/admin', data, {
      requireAuth: false
    });
  }
};

export const testService = {
  async health(): Promise<HealthResponse> {
    console.log('[TestService] Verificando health');

    try {
      const response = await apiClient.get<any>(
        '/custodiados',
        undefined,
        { requireAuth: false }
      );

      if (response.success || response.status === 200) {
        return {
          status: 'UP',
          timestamp: new Date().toISOString(),
          details: { message: 'API respondendo normalmente' }
        };
      }
    } catch (error) {
      console.error('[TestService] Erro no health check:', error);
    }

    try {
      const response = await apiClient.get<any>(
        '/status/info',
        undefined,
        { requireAuth: false }
      );

      if (response.success) {
        return {
          status: 'UP',
          timestamp: response.data?.timestamp || new Date().toISOString(),
          details: response.data
        };
      }
    } catch (error) {
      console.error('[TestService] Fallback health check falhou:', error);
    }

    return {
      status: 'DOWN',
      timestamp: new Date().toISOString(),
      details: { error: 'API não está respondendo' }
    };
  },

  async info(): Promise<AppInfoResponse> {
    console.log('[TestService] Obtendo health da aplicação');

    try {
      const response = await apiClient.get<AppInfoResponse>(
        '/setup/health',
        undefined,
        { requireAuth: false }
      );

      if (response.success && response.data) {
        return response.data;
      }
    } catch (error) {
      console.log(`[TestService] Actuator/info não disponível, tentando status/info${error}`);
    }

    try {
      const statusResponse = await apiClient.get<any>(
        '/status/info',
        undefined,
        { requireAuth: false }
      );
      
      if (statusResponse.success) {
        return {
          name: 'Sistema de Controle de Comparecimento',
          version: '1.0.0',
          description: statusResponse.data?.descricao || 'Sistema de atualização automática de status',
          environment: process.env.NODE_ENV || 'development',
          buildTime: statusResponse.data?.timestamp || new Date().toISOString(),
          javaVersion: 'N/A',
          springBootVersion: 'N/A'
        };
      }
    } catch (error) {
      console.error('[TestService] Status/info também falhou:', error);
    }

    return {
      name: 'Sistema de Controle de Comparecimento',
      version: '1.0.0',
      description: 'Sistema de Controle de Liberdade Provisória',
      environment: process.env.NODE_ENV || 'development',
      buildTime: new Date().toISOString(),
      javaVersion: 'N/A',
      springBootVersion: 'N/A'
    };
  }
};