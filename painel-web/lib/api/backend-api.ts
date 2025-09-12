// lib/services/backend-api.ts
import { httpClient } from '@/lib/http/client';
import { ENDPOINTS, buildUrl } from '@/lib/config/endpoints';
import {
  // Setup types
  SetupAdminDTO,
  SetupStatusResponse,

  // Verificação types
  SolicitarCodigoDTO,
  VerificarCodigoDTO,
  ReenviarCodigoDTO,
  VerificacaoStatusResponse,

  // Pessoas types
  PessoaDTO,
  PessoaResponse,
  ListarPessoasResponse,

  // Comparecimentos types
  ComparecimentoDTO,
  ComparecimentoResponse,
  EstatisticasComparecimentoResponse,

  // Histórico endereços types
  HistoricoEnderecoResponse,
  EstatisticasEnderecoResponse,

  // Usuários types
  UsuarioDTO,
  UsuarioResponse,

  // Utility types
  ApiResponse,
  PeriodoParams,
  BuscarParams,
  PaginationParams,
  HealthResponse,
  AppInfoResponse,

  // Enums
  StatusComparecimento,
  TipoUsuario,
  EstadoBrasil
} from '@/types/backend';

// SETUP SERVICE
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

// EMAIL VERIFICATION SERVICE
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

// PESSOAS SERVICE
export const pessoasService = {
  // Corrigido para usar ListarPessoasResponse
  async listar(): Promise<ListarPessoasResponse> {
    console.log('[pessoasService] Listando pessoas...');
    const response = await httpClient.get<ListarPessoasResponse>(ENDPOINTS.PESSOAS.LIST);
    console.log('[pessoasService] Resposta da listagem:', response);

    // Retornar a resposta completa ou estrutura padrão em caso de erro
    if (response.success && response.data) {
      return response.data;
    }

    // Estrutura padrão quando há erro
    return {
      success: false,
      message: response.error || 'Erro ao carregar pessoas',
      data: []
    };
  },

  async criar(data: PessoaDTO): Promise<ApiResponse<PessoaResponse>> {
    console.log('[pessoasService] Criando pessoa:', data);

    const response = await httpClient.post<ApiResponse<PessoaResponse>>(ENDPOINTS.PESSOAS.CREATE, data);

    console.log('[pessoasService] Resposta da criação:', response);

    // Se a resposta foi bem-sucedida, retornar os dados
    if (response.success && response.data) {
      return response.data;
    }

    // Se houve erro, retornar estrutura de erro
    return {
      success: false,
      message: response.error || 'Erro ao criar pessoa',
      timestamp: new Date().toISOString()
    };
  },

  async buscarPorId(id: number): Promise<PessoaResponse | null> {
    const response = await httpClient.get<ApiResponse<PessoaResponse>>(ENDPOINTS.PESSOAS.BY_ID(id));
    return response.success && response.data?.data ? response.data.data : null;
  },

  async atualizar(id: number, data: Partial<PessoaDTO>): Promise<ApiResponse<PessoaResponse>> {
    const response = await httpClient.put<ApiResponse<PessoaResponse>>(ENDPOINTS.PESSOAS.UPDATE(id), data);
    return response.data || { success: false, message: response.error, timestamp: new Date().toISOString() };
  },

  async excluir(id: number): Promise<ApiResponse> {
    const response = await httpClient.delete<ApiResponse>(ENDPOINTS.PESSOAS.DELETE(id));
    return response.data || { success: false, message: response.error, timestamp: new Date().toISOString() };
  },

  async buscarPorProcesso(processo: string): Promise<PessoaResponse | null> {
    const response = await httpClient.get<ApiResponse<PessoaResponse>>(ENDPOINTS.PESSOAS.BY_PROCESSO(processo));
    return response.success && response.data?.data ? response.data.data : null;
  },

  async buscarPorStatus(status: StatusComparecimento): Promise<PessoaResponse[]> {
    const response = await httpClient.get<ListarPessoasResponse>(ENDPOINTS.PESSOAS.BY_STATUS(status));
    return response.success && response.data?.data ? response.data.data : [];
  },

  async comparecimentosHoje(): Promise<PessoaResponse[]> {
    const response = await httpClient.get<ListarPessoasResponse>(ENDPOINTS.PESSOAS.COMPARECIMENTOS_HOJE);
    return response.success && response.data?.data ? response.data.data : [];
  },

  async atrasados(): Promise<PessoaResponse[]> {
    const response = await httpClient.get<ListarPessoasResponse>(ENDPOINTS.PESSOAS.ATRASADOS);
    return response.success && response.data?.data ? response.data.data : [];
  },

  async buscar(params: BuscarParams): Promise<PessoaResponse[]> {
    const response = await httpClient.get<ListarPessoasResponse>(
      buildUrl(ENDPOINTS.PESSOAS.BUSCAR, params)
    );
    return response.success && response.data?.data ? response.data.data : [];
  }
};

// COMPARECIMENTOS SERVICE
export const comparecimentosService = {

  async obterResumoSistema(): Promise<any> {
    console.log('[comparecimentosService] Buscando resumo do sistema...');
    const response = await httpClient.get<ApiResponse<any>>(ENDPOINTS.COMPARECIMENTOS.RESUMO_SISTEMA);

    console.log(response)
    if (response.success && response.data?.data) {
      return response.data.data;
    }

    return {
      totalPessoas: 0,
      emConformidade: 0,
      inadimplentes: 0,
      comparecimentosHoje: 0,
      atrasados: 0,
      proximos7Dias: 0,
      percentualConformidade: 0,
      proximosComparecimentos: [],
      alertasUrgentes: [],
      pessoasAtrasadas: []
    };
  },

  async registrar(data: ComparecimentoDTO): Promise<ApiResponse<ComparecimentoResponse>> {
    const response = await httpClient.post<ApiResponse<ComparecimentoResponse>>(ENDPOINTS.COMPARECIMENTOS.CREATE, data);
    return response.data || { success: false, message: response.error, timestamp: new Date().toISOString() };
  },

  async buscarPorPessoa(pessoaId: number): Promise<ComparecimentoResponse[]> {
    const response = await httpClient.get<ApiResponse<ComparecimentoResponse[]>>(ENDPOINTS.COMPARECIMENTOS.BY_PESSOA(pessoaId));
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

  async mudancasEndereco(pessoaId: number): Promise<HistoricoEnderecoResponse[]> {
    const response = await httpClient.get<ApiResponse<HistoricoEnderecoResponse[]>>(
      ENDPOINTS.COMPARECIMENTOS.MUDANCAS_ENDERECO(pessoaId)
    );
    return response.success && response.data?.data ? response.data.data : [];
  },

  async atualizarObservacoes(historicoId: number, observacoes: string): Promise<ApiResponse> {
    const response = await httpClient.put<ApiResponse>(
      ENDPOINTS.COMPARECIMENTOS.UPDATE_OBSERVACOES(historicoId),
      { observacoes }
    );
    return response.data || { success: false, message: response.error, timestamp: new Date().toISOString() };
  },

  async verificarInadimplentes(): Promise<ApiResponse> {
    const response = await httpClient.post<ApiResponse>(ENDPOINTS.COMPARECIMENTOS.VERIFICAR_INADIMPLENTES);
    return response.data || { success: false, message: response.error, timestamp: new Date().toISOString() };
  },

  async obterEstatisticas(params?: PeriodoParams): Promise<EstatisticasComparecimentoResponse> {
    const response = await httpClient.get<ApiResponse<EstatisticasComparecimentoResponse>>(
      buildUrl(ENDPOINTS.COMPARECIMENTOS.ESTATISTICAS, params)
    );
    return response.success && response.data?.data ? response.data.data : {
      totalPessoas: 0,
      emConformidade: 0,
      inadimplentes: 0,
      comparecimentosHoje: 0,
      comparecimentosPeriodo: 0,
      percentualConformidade: 0
    };
  }
};

// HISTÓRICO ENDEREÇOS SERVICE
export const historicoEnderecosService = {
  async buscarPorPessoa(pessoaId: number): Promise<HistoricoEnderecoResponse[]> {
    const response = await httpClient.get<ApiResponse<HistoricoEnderecoResponse[]>>(
      ENDPOINTS.HISTORICO_ENDERECOS.BY_PESSOA(pessoaId)
    );
    return response.success && response.data?.data ? response.data.data : [];
  },

  async obterEnderecoAtivo(pessoaId: number): Promise<HistoricoEnderecoResponse | null> {
    const response = await httpClient.get<ApiResponse<HistoricoEnderecoResponse>>(
      ENDPOINTS.HISTORICO_ENDERECOS.ENDERECO_ATIVO(pessoaId)
    );
    return response.success && response.data?.data ? response.data.data : null;
  },

  async obterHistoricos(pessoaId: number): Promise<HistoricoEnderecoResponse[]> {
    const response = await httpClient.get<ApiResponse<HistoricoEnderecoResponse[]>>(
      ENDPOINTS.HISTORICO_ENDERECOS.HISTORICOS(pessoaId)
    );
    return response.success && response.data?.data ? response.data.data : [];
  },

  async buscarPorPeriodo(pessoaId: number, params: PeriodoParams): Promise<HistoricoEnderecoResponse[]> {
    const response = await httpClient.get<ApiResponse<HistoricoEnderecoResponse[]>>(
      buildUrl(ENDPOINTS.HISTORICO_ENDERECOS.BY_PERIODO(pessoaId), params)
    );
    return response.success && response.data?.data ? response.data.data : [];
  },

  async buscarPorCidade(cidade: string): Promise<PessoaResponse[]> {
    const response = await httpClient.get<ListarPessoasResponse>(
      ENDPOINTS.HISTORICO_ENDERECOS.BY_CIDADE(cidade)
    );
    return response.success && response.data?.data ? response.data.data : [];
  },

  async buscarPorEstado(estado: EstadoBrasil): Promise<PessoaResponse[]> {
    const response = await httpClient.get<ListarPessoasResponse>(
      ENDPOINTS.HISTORICO_ENDERECOS.BY_ESTADO(estado)
    );
    return response.success && response.data?.data ? response.data.data : [];
  },

  async mudancasPorPeriodo(params: PeriodoParams): Promise<HistoricoEnderecoResponse[]> {
    const response = await httpClient.get<ApiResponse<HistoricoEnderecoResponse[]>>(
      buildUrl(ENDPOINTS.HISTORICO_ENDERECOS.MUDANCAS_PERIODO, params)
    );
    return response.success && response.data?.data ? response.data.data : [];
  },

  async obterEstatisticas(): Promise<EstatisticasEnderecoResponse> {
    const response = await httpClient.get<ApiResponse<EstatisticasEnderecoResponse>>(
      ENDPOINTS.HISTORICO_ENDERECOS.ESTATISTICAS
    );
    return response.success && response.data?.data ? response.data.data : {
      totalMudancas: 0,
      mudancasUltimoMes: 0,
      cidadesMaisFrequentes: [],
      estadosMaisFrequentes: []
    };
  }
};

// USUÁRIOS SERVICE
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

// TEST SERVICE
export const testService = {
  async health(): Promise<HealthResponse> {
    try {
      console.log('[testService] Fazendo health check...');
      const response = await httpClient.get<HealthResponse>(ENDPOINTS.TEST.HEALTH);

      console.log('[testService] Resposta do health check:', response);

      if (response.success && response.data) {
        return response.data;
      } else {
        // Se a requisição falhou, mas houve resposta, considerar DOWN
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
        // Se a requisição falhou, retornar dados padrão
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

// UTILITY FUNCTIONS

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
  // Configurar interceptors ou configurações iniciais se necessário
  console.log('Backend API initialized');
};