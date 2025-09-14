// lib/api/services.ts - Serviços para comunicação com a API

import { httpClient } from '@/lib/http/client';
import { ENDPOINTS, buildUrl } from '@/lib/config/endpoints';
import {
  // DTOs
  SetupAdminDTO,
  SolicitarCodigoDTO,
  VerificarCodigoDTO,
  ReenviarCodigoDTO,
  CustodiadoDTO,
  ComparecimentoDTO,
  UsuarioDTO,
  
  // Response Types
  SetupStatusResponse,
  VerificacaoStatusResponse,
  CustodiadoResponse,
  ListarCustodiadosResponse,
  ComparecimentoResponse,
  EstatisticasComparecimentoResponse,
  HistoricoEnderecoResponse,
  UsuarioResponse,
  ApiResponse,
  HealthResponse,
  AppInfoResponse,
  ResumoSistemaResponse,
  StatusVerificacaoResponse,
  StatusEstatisticasResponse,
  
  // Params
  PeriodoParams,
  BuscarParams,
  
  // Enums
  StatusComparecimento,
  TipoUsuario,
} from '@/types/api';

// ===========================
// SETUP SERVICE
// ===========================
export const setupService = {
  async getStatus(): Promise<SetupStatusResponse> {
    const response = await httpClient.get<SetupStatusResponse>(ENDPOINTS.SETUP.STATUS);
    return response.data || { configured: false, message: response.error || 'Erro', timestamp: new Date().toISOString() };
  },

  async createAdmin(data: SetupAdminDTO): Promise<ApiResponse> {
    const response = await httpClient.post<ApiResponse>(ENDPOINTS.SETUP.CREATE_ADMIN, data);
    return response.data || { success: false, message: response.error, timestamp: new Date().toISOString() };
  },

  async getAudit(): Promise<ApiResponse> {
    const response = await httpClient.get<ApiResponse>(ENDPOINTS.SETUP.AUDIT);
    return response.data || { success: false, message: response.error, timestamp: new Date().toISOString() };
  },

  async reset(confirmToken: string): Promise<ApiResponse> {
    const response = await httpClient.post<ApiResponse>(ENDPOINTS.SETUP.RESET, { confirmToken });
    return response.data || { success: false, message: response.error, timestamp: new Date().toISOString() };
  },

  async health(): Promise<HealthResponse> {
    const response = await httpClient.get<HealthResponse>(ENDPOINTS.SETUP.HEALTH);
    return response.data || { status: 'DOWN', timestamp: new Date().toISOString() };
  }
};

// ===========================
// EMAIL VERIFICATION SERVICE
// ===========================
export const verificacaoService = {
  async solicitarCodigo(data: SolicitarCodigoDTO): Promise<ApiResponse> {
    const response = await httpClient.post<ApiResponse>(ENDPOINTS.VERIFICACAO.SOLICITAR_CODIGO, data);
    return response.data || { success: false, message: response.error, timestamp: new Date().toISOString() };
  },

  async verificarCodigo(data: VerificarCodigoDTO): Promise<ApiResponse> {
    const response = await httpClient.post<ApiResponse>(ENDPOINTS.VERIFICACAO.VERIFICAR_CODIGO, data);
    return response.data || { success: false, message: response.error, timestamp: new Date().toISOString() };
  },

  async getStatus(email: string): Promise<VerificacaoStatusResponse> {
    const response = await httpClient.get<VerificacaoStatusResponse>(
      buildUrl(ENDPOINTS.VERIFICACAO.STATUS, { email })
    );
    return response.data || { email, verified: false };
  },

  async reenviarCodigo(data: ReenviarCodigoDTO): Promise<ApiResponse> {
    const response = await httpClient.post<ApiResponse>(ENDPOINTS.VERIFICACAO.REENVIAR_CODIGO, data);
    return response.data || { success: false, message: response.error, timestamp: new Date().toISOString() };
  },

  async validarToken(email: string, token: string): Promise<ApiResponse> {
    const response = await httpClient.post<ApiResponse>(ENDPOINTS.VERIFICACAO.VALIDAR_TOKEN, { email, token });
    return response.data || { success: false, message: response.error, timestamp: new Date().toISOString() };
  },

  async health(): Promise<HealthResponse> {
    const response = await httpClient.get<HealthResponse>(ENDPOINTS.VERIFICACAO.HEALTH);
    return response.data || { status: 'DOWN', timestamp: new Date().toISOString() };
  }
};

// ===========================
// CUSTODIADOS SERVICE
// ===========================
export const custodiadosService = {
  async listar(): Promise<ListarCustodiadosResponse> {
    console.log('[custodiadosService] Listando custodiados...');
    const response = await httpClient.get<ListarCustodiadosResponse>(ENDPOINTS.CUSTODIADOS.LIST);
    console.log('[custodiadosService] Resposta da listagem:', response);

    if (response.success && response.data) {
      return response.data;
    }

    return {
      success: false,
      message: response.error || 'Erro ao carregar custodiados',
      data: []
    };
  },

  async criar(data: CustodiadoDTO): Promise<ApiResponse<CustodiadoResponse>> {
    console.log('[custodiadosService] Criando custodiado:', data);
    const response = await httpClient.post<ApiResponse<CustodiadoResponse>>(ENDPOINTS.CUSTODIADOS.CREATE, data);
    console.log('[custodiadosService] Resposta da criação:', response);

    if (response.success && response.data) {
      return response.data;
    }

    return {
      success: false,
      message: response.error || 'Erro ao criar custodiado',
      timestamp: new Date().toISOString()
    };
  },

  async buscarPorId(id: number): Promise<CustodiadoResponse | null> {
    const response = await httpClient.get<ApiResponse<CustodiadoResponse>>(ENDPOINTS.CUSTODIADOS.BY_ID(id));
    return response.success && response.data?.data ? response.data.data : null;
  },

  async atualizar(id: number, data: Partial<CustodiadoDTO>): Promise<ApiResponse<CustodiadoResponse>> {
    const response = await httpClient.put<ApiResponse<CustodiadoResponse>>(ENDPOINTS.CUSTODIADOS.UPDATE(id), data);
    return response.data || { success: false, message: response.error, timestamp: new Date().toISOString() };
  },

  async excluir(id: number): Promise<ApiResponse> {
    const response = await httpClient.delete<ApiResponse>(ENDPOINTS.CUSTODIADOS.DELETE(id));
    return response.data || { success: false, message: response.error, timestamp: new Date().toISOString() };
  },

  async buscarPorProcesso(processo: string): Promise<CustodiadoResponse | null> {
    const response = await httpClient.get<ApiResponse<CustodiadoResponse>>(ENDPOINTS.CUSTODIADOS.BY_PROCESSO(processo));
    return response.success && response.data?.data ? response.data.data : null;
  },

  async buscarPorStatus(status: StatusComparecimento): Promise<CustodiadoResponse[]> {
    const response = await httpClient.get<ListarCustodiadosResponse>(ENDPOINTS.CUSTODIADOS.BY_STATUS(status));
    return response.success && response.data?.data ? response.data.data : [];
  },

  async buscarInadimplentes(): Promise<CustodiadoResponse[]> {
    const response = await httpClient.get<ListarCustodiadosResponse>(ENDPOINTS.CUSTODIADOS.INADIMPLENTES);
    return response.success && response.data?.data ? response.data.data : [];
  },

  async buscar(params: BuscarParams): Promise<CustodiadoResponse[]> {
    const response = await httpClient.get<ListarCustodiadosResponse>(
      ENDPOINTS.CUSTODIADOS.BUSCAR(params.termo || '')
    );
    return response.success && response.data?.data ? response.data.data : [];
  }
};

// ===========================
// COMPARECIMENTOS SERVICE
// ===========================
export const comparecimentosService = {
  async obterResumoSistema(): Promise<ResumoSistemaResponse> {
    console.log('[comparecimentosService] Buscando resumo do sistema...');
    const response = await httpClient.get<ApiResponse<ResumoSistemaResponse>>(ENDPOINTS.COMPARECIMENTOS.RESUMO_SISTEMA);

    if (response.success && response.data?.data) {
      return response.data.data;
    }

    // Retorno padrão com estrutura completa
    return {
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
      // Campos adicionais para o dashboard
      totalPessoas: 0,
      emConformidade: 0,
      inadimplentes: 0,
      atrasados: 0,
      proximos7Dias: 0,
      proximosComparecimentos: [],
      alertasUrgentes: [],
      pessoasAtrasadas: []
    };
  },

  async registrar(data: ComparecimentoDTO): Promise<ApiResponse<ComparecimentoResponse>> {
    const response = await httpClient.post<ApiResponse<ComparecimentoResponse>>(ENDPOINTS.COMPARECIMENTOS.CREATE, data);
    return response.data || { success: false, message: response.error, timestamp: new Date().toISOString() };
  },

  async buscarPorCustodiado(custodiadoId: number): Promise<ComparecimentoResponse[]> {
    const response = await httpClient.get<ApiResponse<ComparecimentoResponse[]>>(
      ENDPOINTS.COMPARECIMENTOS.BY_CUSTODIADO(custodiadoId)
    );
    return response.success && response.data?.data ? response.data.data : [];
  },

  async buscarPorPeriodo(params: PeriodoParams): Promise<ComparecimentoResponse[]> {
    const response = await httpClient.get<ApiResponse<ComparecimentoResponse[]>>(
      buildUrl(ENDPOINTS.COMPARECIMENTOS.BY_PERIODO, params)
    );
    return response.success && response.data?.data ? response.data.data : [];
  },

  async comparecimentosHoje(): Promise<ComparecimentoResponse[]> {
    const response = await httpClient.get<ApiResponse<ComparecimentoResponse[]>>(ENDPOINTS.COMPARECIMENTOS.HOJE);
    return response.success && response.data?.data ? response.data.data : [];
  },

  async obterEstatisticas(params?: PeriodoParams): Promise<EstatisticasComparecimentoResponse> {
    const response = await httpClient.get<ApiResponse<EstatisticasComparecimentoResponse>>(
      buildUrl(ENDPOINTS.COMPARECIMENTOS.ESTATISTICAS, params)
    );
    return response.success && response.data?.data ? response.data.data : {
      totalComparecimentos: 0,
      comparecimentosPresenciais: 0,
      comparecimentosOnline: 0,
      cadastrosIniciais: 0,
      mudancasEndereco: 0,
      percentualPresencial: 0,
      percentualOnline: 0
    };
  }
};

// ===========================
// HISTÓRICO ENDEREÇOS SERVICE
// ===========================
export const historicoEnderecosService = {
  async buscarPorCustodiado(custodiadoId: number): Promise<HistoricoEnderecoResponse[]> {
    const response = await httpClient.get<ApiResponse<HistoricoEnderecoResponse[]>>(
      ENDPOINTS.HISTORICO_ENDERECOS.BY_PESSOA(custodiadoId)
    );
    return response.success && response.data?.data ? response.data.data : [];
  },

  async obterEnderecoAtivo(custodiadoId: number): Promise<HistoricoEnderecoResponse | null> {
    const response = await httpClient.get<ApiResponse<HistoricoEnderecoResponse>>(
      ENDPOINTS.HISTORICO_ENDERECOS.ENDERECO_ATIVO(custodiadoId)
    );
    return response.success && response.data?.data ? response.data.data : null;
  }
};

// ===========================
// USUÁRIOS SERVICE
// ===========================
export const usuariosService = {
  async listar(): Promise<UsuarioResponse[]> {
    const response = await httpClient.get<ApiResponse<UsuarioResponse[]>>(ENDPOINTS.USUARIOS.LIST);
    return response.success && response.data?.data ? response.data.data : [];
  },

  async criar(data: UsuarioDTO): Promise<ApiResponse<UsuarioResponse>> {
    const response = await httpClient.post<ApiResponse<UsuarioResponse>>(ENDPOINTS.USUARIOS.CREATE, data);
    return response.data || { success: false, message: response.error, timestamp: new Date().toISOString() };
  },

  async buscarPorId(id: number): Promise<UsuarioResponse | null> {
    const response = await httpClient.get<ApiResponse<UsuarioResponse>>(ENDPOINTS.USUARIOS.BY_ID(id));
    return response.success && response.data?.data ? response.data.data : null;
  },

  async atualizar(id: number, data: Partial<UsuarioDTO>): Promise<ApiResponse<UsuarioResponse>> {
    const response = await httpClient.put<ApiResponse<UsuarioResponse>>(ENDPOINTS.USUARIOS.UPDATE(id), data);
    return response.data || { success: false, message: response.error, timestamp: new Date().toISOString() };
  },

  async desativar(id: number): Promise<ApiResponse> {
    const response = await httpClient.delete<ApiResponse>(ENDPOINTS.USUARIOS.DELETE(id));
    return response.data || { success: false, message: response.error, timestamp: new Date().toISOString() };
  },

  async buscarPorTipo(tipo: TipoUsuario): Promise<UsuarioResponse[]> {
    const response = await httpClient.get<ApiResponse<UsuarioResponse[]>>(ENDPOINTS.USUARIOS.BY_TIPO(tipo));
    return response.success && response.data?.data ? response.data.data : [];
  }
};

// ===========================
// STATUS SERVICE
// ===========================
export const statusService = {
  async verificarInadimplentes(): Promise<ApiResponse<StatusVerificacaoResponse>> {
    const response = await httpClient.post<ApiResponse<StatusVerificacaoResponse>>(ENDPOINTS.STATUS.VERIFICAR_INADIMPLENTES);
    return response.data || { success: false, message: response.error, timestamp: new Date().toISOString() };
  },

  async obterEstatisticas(): Promise<StatusEstatisticasResponse | null> {
    const response = await httpClient.get<ApiResponse<StatusEstatisticasResponse>>(ENDPOINTS.STATUS.ESTATISTICAS);
    return response.success && response.data?.data ? response.data.data : null;
  }
};

// ===========================
// TEST SERVICE
// ===========================
export const testService = {
  async health(): Promise<HealthResponse> {
    try {
      console.log('[testService] Fazendo health check...');
      const response = await httpClient.get<HealthResponse>(ENDPOINTS.TEST.HEALTH);
      console.log('[testService] Resposta do health check:', response);

      if (response.success && response.data) {
        return response.data;
      } else {
        return {
          status: 'DOWN',
          timestamp: new Date().toISOString(),
          details: { error: response.error || 'Health check failed' }
        };
      }
    } catch (error) {
      console.error('[testService] Erro no health check:', error);
      return {
        status: 'DOWN',
        timestamp: new Date().toISOString(),
        details: { error: 'Network error' }
      };
    }
  },

  async info(): Promise<AppInfoResponse> {
    try {
      console.log('[testService] Obtendo informações da aplicação...');
      const response = await httpClient.get<AppInfoResponse>(ENDPOINTS.TEST.INFO);
      console.log('[testService] Resposta do info:', response);

      if (response.success && response.data) {
        return response.data;
      } else {
        return {
          name: 'ACLP Backend',
          version: 'Unknown',
          description: 'Sistema de Controle de Liberdade Provisória',
          environment: 'unknown',
          buildTime: 'Unknown',
          javaVersion: 'Unknown',
          springBootVersion: 'Unknown'
        };
      }
    } catch (error) {
      console.error('[testService] Erro ao obter info:', error);
      return {
        name: 'ACLP Backend (Error)',
        version: 'Unknown',
        description: 'Sistema de Controle de Liberdade Provisória',
        environment: 'unknown',
        buildTime: 'Unknown',
        javaVersion: 'Unknown',
        springBootVersion: 'Unknown'
      };
    }
  }
};

// ===========================
// UTILITY FUNCTIONS
// ===========================

// Função para configurar headers de autenticação
export const configureAuthHeaders = (token: string) => {
  httpClient.setHeaders({
    'Authorization': `Bearer ${token}`
  });
};

// Função para remover headers de autenticação
export const clearAuthHeaders = () => {
  httpClient.removeAuthToken();
};

// Função para inicializar a API
export const initializeBackendApi = () => {
  console.log('Backend API initialized');
};