/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiClient, ApiResponse } from '../http/client';
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
  ListarCustodiadosResponse
} from '@/types/api';

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

// ===========================
// Custodiados Service
// ===========================

export const custodiadosService = {
  /**
   * Lista todos os custodiados com cache
   */
  async listar(options?: { 
    forceRefresh?: boolean;
    cacheTimeout?: number;
  }): Promise<ListarCustodiadosResponse> {
    const cacheKey = 'custodiados:list';
    const cacheTimeout = options?.cacheTimeout || 5 * 60 * 1000; // 5 minutos padrão
    
    // Tentar buscar do cache primeiro (se não for forceRefresh)
    if (!options?.forceRefresh) {
      const cached = requestCache.get<ListarCustodiadosResponse>(cacheKey);
      if (cached) {
        console.log('[CustodiadosService] Retornando dados do cache');
        return cached;
      }
    } else {
      console.log('[CustodiadosService] forceRefresh=true, ignorando cache');
    }

    try {
      const response = await apiClient.get<any>('/custodiados');
      console.log('[CustodiadosService] Resposta bruta:', response);

      let parsedData: any;

      // Parse da resposta
      try {
        if (typeof response.data === 'string') {
          parsedData = JSON.parse(response.data);
          console.log('[CustodiadosService] JSON parseado:', parsedData);
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

      // Inicializar result com valor padrão
      let result: ListarCustodiadosResponse = {
        success: false,
        message: 'Nenhum custodiado encontrado',
        data: []
      };

      // Verificar estrutura: { success: true, data: [...] }
      if (parsedData && parsedData.success && Array.isArray(parsedData.data)) {
        console.log('[CustodiadosService] Estrutura correta encontrada:', parsedData.data.length);
        result = {
          success: true,
          message: parsedData.message || `${parsedData.data.length} custodiados carregados`,
          data: parsedData.data
        };
      }
      // Verificar se é array direto
      else if (Array.isArray(parsedData)) {
        console.log('[CustodiadosService] Dados são array direto:', parsedData.length);
        result = {
          success: true,
          message: `${parsedData.length} custodiados carregados`,
          data: parsedData
        };
      }
      // Procurar array em alguma propriedade do objeto
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

      // Cachear resultado de sucesso
      if (result.success && result.data.length > 0) {
        requestCache.set(cacheKey, result, cacheTimeout);
        console.log(`[CustodiadosService] ${result.data.length} custodiados cacheados por ${cacheTimeout}ms`);
      }

      return result;

    } catch (error) {
      console.error('[CustodiadosService] Erro ao listar custodiados:', error);
      
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erro ao listar custodiados',
        data: []
      };
    }
  },

  /**
   * Busca custodiado por ID com cache
   */
  async buscarPorId(id: number, options?: { 
    forceRefresh?: boolean;
    cacheTimeout?: number;
  }): Promise<CustodiadoResponse | null> {
    const cacheKey = `custodiados:id:${id}`;
    const cacheTimeout = options?.cacheTimeout || 2 * 60 * 1000; // 2 minutos

    // Tentar cache primeiro
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

      // Cachear se encontrou
      if (result) {
        requestCache.set(cacheKey, result, cacheTimeout);
      }

      return result;

    } catch (error) {
      console.error(`[CustodiadosService] Erro ao buscar custodiado ${id}:`, error);
      return null;
    }
  },

  /**
   * Cria novo custodiado e invalida cache
   */
  async criar(data: CustodiadoDTO): Promise<ApiResponse<CustodiadoResponse>> {
    try {
      console.log('[CustodiadosService] Criando custodiado:', data);
      
      const response = await apiClient.post<CustodiadoResponse>('/custodiados', data);
      
      // Invalidar cache da lista ao criar
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

  /**
   * Atualiza custodiado e invalida cache
   */
  async atualizar(
    id: number, 
    data: Partial<CustodiadoDTO>
  ): Promise<ApiResponse<CustodiadoResponse>> {
    try {
      console.log(`[CustodiadosService] Atualizando custodiado ID: ${id}`, data);
      
      const response = await apiClient.put<CustodiadoResponse>(`/custodiados/${id}`, data);
      
      // Invalidar caches relacionados ao atualizar
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

  /**
   * Exclui custodiado e invalida cache
   */
  async excluir(id: number): Promise<ApiResponse<void>> {
    try {
      console.log(`[CustodiadosService] Excluindo custodiado ID: ${id}`);
      
      const response = await apiClient.delete<void>(`/custodiados/${id}`);
      
      // Invalidar todos os caches relacionados ao excluir
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

  /**
   * Busca custodiado por número de processo com cache
   */
  async buscarPorProcesso(
    processo: string,
    options?: { forceRefresh?: boolean; cacheTimeout?: number }
  ): Promise<CustodiadoResponse | null> {
    const cacheKey = `custodiados:processo:${processo}`;
    const cacheTimeout = options?.cacheTimeout || 3 * 60 * 1000; // 3 minutos

    // Tentar cache primeiro
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

      // Cachear se encontrou
      if (result) {
        requestCache.set(cacheKey, result, cacheTimeout);
      }

      return result;

    } catch (error) {
      console.error(`[CustodiadosService] Erro ao buscar processo ${processo}:`, error);
      return null;
    }
  },

  /**
   * Busca custodiados por status com cache
   */
  async buscarPorStatus(
    status: StatusComparecimento,
    options?: { forceRefresh?: boolean; cacheTimeout?: number }
  ): Promise<CustodiadoResponse[]> {
    const cacheKey = `custodiados:status:${status}`;
    const cacheTimeout = options?.cacheTimeout || 2 * 60 * 1000; // 2 minutos

    // Tentar cache primeiro
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

      // Cachear resultado
      if (result.length > 0) {
        requestCache.set(cacheKey, result, cacheTimeout);
      }

      return result;

    } catch (error) {
      console.error(`[CustodiadosService] Erro ao buscar por status ${status}:`, error);
      return [];
    }
  },

  /**
   * Busca custodiados inadimplentes com cache
   */
  async buscarInadimplentes(options?: { 
    forceRefresh?: boolean; 
    cacheTimeout?: number;
  }): Promise<CustodiadoResponse[]> {
    const cacheKey = 'custodiados:inadimplentes';
    const cacheTimeout = options?.cacheTimeout || 1 * 60 * 1000; // 1 minuto (dados críticos)

    // Tentar cache primeiro
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

      // Cachear resultado
      requestCache.set(cacheKey, result, cacheTimeout);

      return result;

    } catch (error) {
      console.error('[CustodiadosService] Erro ao buscar inadimplentes:', error);
      return [];
    }
  },

  /**
   * Busca custodiados com parâmetros personalizados
   * Não usa cache por ser uma busca dinâmica
   */
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

  /**
   * Invalida todo o cache de custodiados
   */
  invalidarCache(): void {
    console.log('[CustodiadosService] Invalidando todo o cache de custodiados');
    
    // Limpar cache da lista
    requestCache.clear('custodiados:list');
    
    // Limpar cache de inadimplentes
    requestCache.clear('custodiados:inadimplentes');
    
    // Nota: caches específicos (por ID, processo, status) expiram automaticamente
    // ou são limpos individualmente nas operações de update/delete
  },

  /**
   * Pré-carrega dados em cache (útil para otimizar navegação)
   */
  async precarregar(): Promise<void> {
    console.log('[CustodiadosService] Pré-carregando dados...');
    
    try {
      // Carregar lista (vai para o cache automaticamente)
      await this.listar();
      
      // Carregar inadimplentes
      await this.buscarInadimplentes();
      
      console.log('[CustodiadosService] Pré-carregamento concluído');
    } catch (error) {
      console.error('[CustodiadosService] Erro no pré-carregamento:', error);
    }
  },

  /**
   * Estatísticas do cache (útil para debug)
   */
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

// ===========================
// Comparecimentos Service
// ===========================

export const comparecimentosService = {
  async registrar(data: ComparecimentoDTO): Promise<ApiResponse<ComparecimentoResponse>> {
    console.log('[ComparecimentosService] Registrando comparecimento:', data);
    return await apiClient.post<ComparecimentoResponse>('/comparecimentos', data);
  },

  async buscarPorCustodiado(custodiadoId: number): Promise<ComparecimentoResponse[]> {
    console.log(`[ComparecimentosService] Buscando comparecimentos do custodiado: ${custodiadoId}`);
    const response = await apiClient.get<ComparecimentoResponse[]>(`/comparecimentos/custodiado/${custodiadoId}`);
    return response.success ? response.data || [] : [];
  },

  async buscarPorPeriodo(params: PeriodoParams): Promise<ComparecimentoResponse[]> {
    console.log('[ComparecimentosService] Buscando por período:', params);
    const response = await apiClient.get<ComparecimentoResponse[]>('/comparecimentos/periodo', params);
    return response.success ? response.data || [] : [];
  },

  async comparecimentosHoje(): Promise<ComparecimentoResponse[]> {
    console.log('[ComparecimentosService] Buscando comparecimentos de hoje');
    const response = await apiClient.get<ComparecimentoResponse[]>('/comparecimentos/hoje');
    return response.success ? response.data || [] : [];
  },

  async obterEstatisticas(params?: PeriodoParams): Promise<EstatisticasComparecimentoResponse> {
    console.log('[ComparecimentosService] Obtendo estatísticas:', params);
    const response = await apiClient.get<EstatisticasComparecimentoResponse>('/comparecimentos/estatisticas', params);

    if (!response.success) {
      return {
        totalComparecimentos: 0,
        comparecimentosPresenciais: 0,
        comparecimentosOnline: 0,
        cadastrosIniciais: 0,
        mudancasEndereco: 0,
        percentualPresencial: 0,
        percentualOnline: 0
      };
    }

    return response.data || {
      totalComparecimentos: 0,
      comparecimentosPresenciais: 0,
      comparecimentosOnline: 0,
      cadastrosIniciais: 0,
      mudancasEndereco: 0,
      percentualPresencial: 0,
      percentualOnline: 0
    };
  },

  async obterResumoSistema(): Promise<ResumoSistemaResponse> {
    console.log('[ComparecimentosService] Obtendo resumo do sistema');
    const response = await apiClient.get<any>('/comparecimentos/resumo/sistema');

    let parsedData: any;

    try {
      if (typeof response.data === 'string') {
        console.log('[ComparecimentosService] Fazendo parse da string JSON...');
        parsedData = JSON.parse(response.data);
      } else {
        parsedData = response.data;
      }
    } catch (parseError) {
      console.error('[ComparecimentosService] Erro no parse do JSON:', parseError);
      parsedData = null;
    }

    const defaultResumo: ResumoSistemaResponse = {
      totalCustodiados: 0,
      custodiadosEmConformidade: 0,
      custodiadosInadimplentes: 0,
      comparecimentosHoje: 0,
      totalComparecimentos: 0,
      comparecimentosEsteMes: 0,
      totalMudancasEndereco: 0,
      enderecosAtivos: 0,
      custodiadosSemHistorico: 0,
      custodiadosSemEnderecoAtivo: 0,
      percentualConformidade: 0,
      percentualInadimplencia: 0,
      dataConsulta: new Date().toISOString(),
      totalPessoas: 0,
      emConformidade: 0,
      inadimplentes: 0,
      atrasados: 0,
      proximos7Dias: 0,
      proximosComparecimentos: [],
      alertasUrgentes: []
    };

    if (!response.success || !parsedData) {
      return defaultResumo;
    }

    if (parsedData.success && parsedData.data) {
      parsedData = parsedData.data;
    }

    return parsedData || defaultResumo;
  }
};

// ===========================
// Usuários Service
// ===========================

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
    console.log(`[UsuariosService] Atualizando usuário ID: ${id}`, data);
    return await apiClient.put<UsuarioResponse>(`/usuarios/${id}`, data);
  }
};

// ===========================
// Interfaces de Auth
// ===========================

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

export interface ValidarTokenConviteResponse {
  valido: boolean;
  status: 'VALID' | 'INVALID' | 'EXPIRED' | 'ALREADY_USED' | 'TOO_MANY_ATTEMPTS';
  email?: string;
  nome?: string;
  tipoUsuario?: string;
  departamento?: string;
  expiraEm?: string;
  horasRestantes?: number;
  message: string;
}

export interface AtivarContaDTO {
  token: string;
  senha: string;
  confirmaSenha: string;
  habilitarMFA?: boolean;
}

export interface ReenviarConviteDTO {
  novaValidadeHoras?: number;
  mensagemPersonalizada?: string;
}

// ===========================
// Convites Service
// ===========================

export const convitesService = {
  async criarConvite(data: ConviteDTO): Promise<ApiResponse<ConviteResponse>> {
    console.log('[ConvitesService] Criando convite para:', data.email);
    return await apiClient.post<ConviteResponse>('/usuarios/convites', data);
  },

  async listarConvites(status?: string): Promise<ApiResponse<ConviteResponse[]>> {
    console.log('[ConvitesService] Listando convites', status ? `com status: ${status}` : '');
    const params = status ? { status } : undefined;
    return await apiClient.get<ConviteResponse[]>('/usuarios/convites', params);
  },

  async validarToken(token: string): Promise<ApiResponse<ValidarTokenConviteResponse>> {
    console.log('[ConvitesService] Validando token de convite');
    return await apiClient.get<ValidarTokenConviteResponse>(`/usuarios/convites/validar/${token}`);
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

// ===========================
// Auth Service
// ===========================

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

// ===========================
// Status Service
// ===========================

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

// ===========================
// Setup Service
// ===========================

export const setupService = {
  async getStatus(): Promise<SetupStatusResponse> {
    console.log('[SetupService] Verificando status do setup');
    const response = await apiClient.get<SetupStatusResponse>('/setup/status');

    return response.data || {
      setupRequired: true,
      setupCompleted: false,
      configured: false,
      timestamp: new Date().toISOString()
    };
  },

  async createAdmin(data: SetupAdminDTO): Promise<ApiResponse<any>> {
    console.log('[SetupService] Criando administrador inicial');
    return await apiClient.post('/setup/admin', data);
  }
};

// ===========================
// Test Service
// ===========================

export const testService = {
  async health(): Promise<HealthResponse> {
    console.log('[TestService] Verificando health');

    try {
      const response = await apiClient.get<any>('/custodiados');

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
      const response = await apiClient.get<any>('/status/info');

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
      const response = await apiClient.get<AppInfoResponse>('/setup/health');

      if (response.success && response.data) {
        return response.data;
      }
    } catch (error) {
      console.log(`[TestService] Actuator/info não disponível, tentando status/info${error}`);
    }

    try {
      const statusResponse = await apiClient.get<any>('/status/info');
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