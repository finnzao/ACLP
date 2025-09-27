/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiClient, ApiResponse } from '../http/client';
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
// Configuração Global

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

// Serviços de Custodiados

export const custodiadosService = {
  async listar(): Promise<ListarCustodiadosResponse> {
    const response = await apiClient.get<any>('/custodiados');
    console.log('[CustodiadosService] Resposta bruta:', response);


    let parsedData: any;

    try {
      if (typeof response.data === 'string') {
        parsedData = JSON.parse(response.data);
        console.log('[CustodiadosService] JSON parseado:', parsedData);
      } else {
        parsedData = response.data;
        console.log('[CustodiadosService]  Data já é objeto:', parsedData);
      }
    } catch (parseError) {
      console.error('[CustodiadosService]  Erro no parse do JSON:', parseError);
      return {
        success: false,
        message: 'Erro ao processar resposta do servidor',
        data: []
      };
    }

    if (parsedData && parsedData.success && Array.isArray(parsedData.data)) {
      console.log('[CustodiadosService]  Estrutura correta encontrada:', parsedData.data.length);
      return {
        success: true,
        message: parsedData.message || `${parsedData.data.length} custodiados carregados`,
        data: parsedData.data
      };
    }

    if (Array.isArray(parsedData)) {
      console.log('[CustodiadosService]  Dados são array direto:', parsedData.length);
      return {
        success: true,
        message: `${parsedData.length} custodiados carregados (array direto)`,
        data: parsedData
      };
    }

    if (parsedData && typeof parsedData === 'object') {
      for (const [key, value] of Object.entries(parsedData)) {
        if (Array.isArray(value)) {
          console.log('[CustodiadosService]  Array encontrado em:', key, value.length);
          return {
            success: true,
            message: `${value.length} custodiados carregados (${key})`,
            data: value
          };
        }
      }
    }

    console.error('[CustodiadosService]  Nenhum array encontrado em:', parsedData);
    return {
      success: false,
      message: 'Nenhum custodiado encontrado na resposta',
      data: []
    };
  },

  async buscarPorId(id: number): Promise<CustodiadoResponse | null> {
    console.log(`[CustodiadosService] Buscando custodiado ID: ${id}`);
    const response = await apiClient.get<CustodiadoResponse>(`/custodiados/${id}`);
    return response.success ? response.data || null : null;
  },

  async criar(data: CustodiadoDTO): Promise<ApiResponse<CustodiadoResponse>> {
    console.log('[CustodiadosService] Criando custodiado:', data);
    return await apiClient.post<CustodiadoResponse>('/custodiados', data);
  },

  async atualizar(id: number, data: Partial<CustodiadoDTO>): Promise<ApiResponse<CustodiadoResponse>> {
    console.log(`[CustodiadosService] Atualizando custodiado ID: ${id}`, data);
    return await apiClient.put<CustodiadoResponse>(`/custodiados/${id}`, data);
  },

  async excluir(id: number): Promise<ApiResponse<void>> {
    console.log(`[CustodiadosService] Excluindo custodiado ID: ${id}`);
    return await apiClient.delete<void>(`/custodiados/${id}`);
  },

  async buscarPorProcesso(processo: string): Promise<CustodiadoResponse | null> {
    console.log(`[CustodiadosService] Buscando por processo: ${processo}`);
    const response = await apiClient.get<CustodiadoResponse>(`/custodiados/processo/${encodeURIComponent(processo)}`);
    return response.success ? response.data || null : null;
  },

  async buscarPorStatus(status: StatusComparecimento): Promise<CustodiadoResponse[]> {
    console.log(`[CustodiadosService] Buscando por status: ${status}`);
    const response = await apiClient.get<CustodiadoResponse[]>(`/custodiados/status/${status}`);
    return response.success ? response.data || [] : [];
  },

  async buscarInadimplentes(): Promise<CustodiadoResponse[]> {
    console.log('[CustodiadosService] Buscando inadimplentes');
    const response = await apiClient.get<CustodiadoResponse[]>('/custodiados/inadimplentes');
    return response.success ? response.data || [] : [];
  },

  async buscar(params: BuscarParams): Promise<CustodiadoResponse[]> {
    console.log('[CustodiadosService] Fazendo busca com parâmetros:', params);
    const response = await apiClient.get<CustodiadoResponse[]>('/custodiados/buscar', params);
    return response.success ? response.data || [] : [];
  }
};


// Serviços de Comparecimentos

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

    // Retorna dados padrão em caso de erro
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

    //Parse do JSON se necessário (similar ao custodiadosService)
    let parsedData: any;

    try {
      if (typeof response.data === 'string') {
        console.log('[ComparecimentosService] 🔧 Fazendo parse da string JSON...');
        parsedData = JSON.parse(response.data);
      } else {
        parsedData = response.data;
      }
    } catch (parseError) {
      console.error('[ComparecimentosService]  Erro no parse do JSON:', parseError);
      parsedData = null;
    }

    // Retorna dados padrão em caso de erro
    if (!response.success || !parsedData) {
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
        // Campos extras para o dashboard
        totalPessoas: 0,
        emConformidade: 0,
        inadimplentes: 0,
        atrasados: 0,
        proximos7Dias: 0,
        proximosComparecimentos: [],
        alertasUrgentes: []
      };
    }

    // Se parsedData tem success e data, usar data
    if (parsedData.success && parsedData.data) {
      parsedData = parsedData.data;
    }

    return parsedData || {
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
  }
};
// Serviços de Usuários

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

// Serviços de Autenticação

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



// ===========================
// Serviços de Convites
// ===========================

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

export const convitesService = {
  /**
   * Criar e enviar convite (Admin)
   */
  async criarConvite(data: ConviteDTO): Promise<ApiResponse<ConviteResponse>> {
    console.log('[ConvitesService] Criando convite para:', data.email);
    return await apiClient.post<ConviteResponse>('/usuarios/convites', data);
  },

  /**
   * Listar convites (Admin)
   */
  async listarConvites(status?: string): Promise<ApiResponse<ConviteResponse[]>> {
    console.log('[ConvitesService] Listando convites', status ? `com status: ${status}` : '');
    const params = status ? { status } : undefined;
    return await apiClient.get<ConviteResponse[]>('/usuarios/convites', params);
  },

  /**
   * Validar token de convite (Público)
   */
  async validarToken(token: string): Promise<ApiResponse<ValidarTokenConviteResponse>> {
    console.log('[ConvitesService] Validando token de convite');
    return await apiClient.get<ValidarTokenConviteResponse>(`/usuarios/convites/validar/${token}`);
  },

  /**
   * Ativar conta com convite (Público)
   */
  async ativarConta(data: AtivarContaDTO): Promise<ApiResponse<{
    id: number;
    email: string;
    nome: string;
    tipo: string;
  }>> {
    console.log('[ConvitesService] Ativando conta');
    return await apiClient.post('/usuarios/convites/ativar', data);
  },

  /**
   * Reenviar convite (Admin)
   */
  async reenviarConvite(id: number, data: ReenviarConviteDTO): Promise<ApiResponse<ConviteResponse>> {
    console.log('[ConvitesService] Reenviando convite:', id);
    return await apiClient.post<ConviteResponse>(`/usuarios/convites/${id}/reenviar`, data);
  },

  /**
   * Cancelar convite (Admin)
   */
  async cancelarConvite(id: number, motivo?: string): Promise<ApiResponse<void>> {
    console.log('[ConvitesService] Cancelando convite:', id);
    return await apiClient.delete<void>(`/usuarios/convites/${id}`, {
      body: motivo ? { motivo } : undefined
    });
  }
};

export const authService = {
  /**
   * Realizar login
   */
  async login(data: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    console.log('[AuthService] Realizando login para:', data.email);
    return await apiClient.post<LoginResponse>('/auth/login', data);
  },

  /**
   * Realizar logout
   */
  async logout(data: LogoutRequest): Promise<ApiResponse<void>> {
    console.log('[AuthService] Realizando logout');
    return await apiClient.post<void>('/auth/logout', data);
  },

  /**
   * Renovar token de acesso
   */
  async refreshToken(data: RefreshTokenRequest): Promise<ApiResponse<LoginResponse>> {
    console.log('[AuthService] Renovando token');
    return await apiClient.post<LoginResponse>('/auth/refresh', data);
  },

  /**
   * Validar token atual
   */
  async validateToken(): Promise<ApiResponse<{
    valid: boolean;
    email: string;
    expiration: string;
    authorities: string[];
  }>> {
    console.log('[AuthService] Validando token');
    return await apiClient.get('/auth/validate');
  },

  /**
   * Alterar senha (usuário autenticado)
   */
  async alterarSenha(data: AlterarSenhaRequest): Promise<ApiResponse<void>> {
    console.log('[AuthService] Alterando senha');
    return await apiClient.post<void>('/auth/password/change', data);
  },

  /**
   * Solicitar reset de senha
   */
  async solicitarResetSenha(data: ResetSenhaRequest): Promise<ApiResponse<void>> {
    console.log('[AuthService] Solicitando reset de senha para:', data.email);
    return await apiClient.post<void>('/auth/password/reset-request', data);
  },

  /**
   * Confirmar reset de senha
   */
  async confirmarResetSenha(data: ConfirmarResetRequest): Promise<ApiResponse<void>> {
    console.log('[AuthService] Confirmando reset de senha');
    return await apiClient.post<void>('/auth/password/reset-confirm', data);
  },

  /**
   * Obter usuário atual (perfil)
   */
  async getProfile(): Promise<ApiResponse<UsuarioResponse>> {
    console.log('[AuthService] Obtendo perfil do usuário');
    return await apiClient.get<UsuarioResponse>('/usuarios/me');
  }
};

// Serviços de Status

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
// Serviços de Setup

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
// Serviços de Teste/Health

export const testService = {
  async health(): Promise<HealthResponse> {
    console.log('[TestService] Verificando health');

    try {
      // Tentar endpoint de custodiados para verificar se API está funcionando
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

    // Fallback: tentar endpoint de info
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
    console.log('[TestService] Obtendo info da aplicação');

    // Tentar endpoint de info do actuator primeiro
    try {
      const response = await apiClient.get<AppInfoResponse>('/actuator/info');

      if (response.success && response.data) {
        return response.data;
      }
    } catch (error) {
      console.log(`[TestService] Actuator/info não disponível, tentando status/info${error}`);
    }

    // Se não funcionar, usar dados do status/info
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

    // Retorno padrão se tudo falhar
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