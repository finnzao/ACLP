/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/api/services/index.ts
export { authService, configureAuthHeaders, clearAuthHeaders } from '../authService';
export { httpClient } from '@/lib/http/client';

import { httpClient } from '@/lib/http/client';
import { 
  CustodiadoDTO, 
  CustodiadoResponse,
  ComparecimentoDTO,
  ComparecimentoResponse,
  UsuarioDTO,
  UsuarioResponse,
  ApiResponse,
  SetupStatusResponse,
  SetupAdminDTO,
  StatusVerificacaoResponse,
  StatusEstatisticasResponse,
  HealthResponse,
  AppInfoResponse,
  ResumoSistemaResponse,
  EstatisticasComparecimentoResponse,
  PeriodoParams,
  BuscarParams
} from '@/types/api';

export const custodiadosService = {
  listar: async () => {
    const response = await httpClient.get<ApiResponse<CustodiadoResponse[]>>('/api/custodiados');
    return response.data || { success: false, data: [], message: 'Erro ao listar' };
  },
  buscarPorId: async (id: number) => {
    const response = await httpClient.get<ApiResponse<CustodiadoResponse>>(`/api/custodiados/${id}`);
    return response.data;
  },
  criar: async (data: CustodiadoDTO) => {
    const response = await httpClient.post<ApiResponse<CustodiadoResponse>>('/api/custodiados', data);
    return response.data || { success: false, message: 'Erro ao criar' };
  },
  atualizar: async (id: number, data: Partial<CustodiadoDTO>) => {
    const response = await httpClient.put<ApiResponse<CustodiadoResponse>>(`/api/custodiados/${id}`, data);
    return response.data || { success: false, message: 'Erro ao atualizar' };
  },
  excluir: async (id: number) => {
    const response = await httpClient.delete<ApiResponse<void>>(`/api/custodiados/${id}`);
    return response.data || { success: false, message: 'Erro ao excluir' };
  },
  buscarPorProcesso: async (processo: string) => {
    const response = await httpClient.get<ApiResponse<CustodiadoResponse>>(`/api/custodiados/processo/${processo}`);
    return response.data;
  },
  buscarInadimplentes: async () => {
    const response = await httpClient.get<ApiResponse<CustodiadoResponse[]>>('/api/custodiados/inadimplentes');
    return response.data?.data || [];
  },
  buscarPorStatus: async (status: 'EM_CONFORMIDADE' | 'INADIMPLENTE') => {
    const response = await httpClient.get<ApiResponse<CustodiadoResponse[]>>(`/api/custodiados/status/${status}`);
    return response.data?.data || [];
  },
  buscar: async (params: BuscarParams) => {
    const response = await httpClient.get<ApiResponse<CustodiadoResponse[]>>('/api/custodiados/buscar', params);
    return response.data?.data || [];
  }
};

export const comparecimentosService = {
  registrar: async (data: ComparecimentoDTO) => {
    const response = await httpClient.post<ApiResponse<ComparecimentoResponse>>('/api/comparecimentos', data);
    return response.data || { success: false, message: 'Erro ao registrar' };
  },
  buscarPorCustodiado: async (custodiadoId: number) => {
    const response = await httpClient.get<ComparecimentoResponse[]>(`/api/comparecimentos/custodiado/${custodiadoId}`);
    return response.data || [];
  },
  buscarPorPeriodo: async (params: PeriodoParams) => {
    const response = await httpClient.get<ComparecimentoResponse[]>('/api/comparecimentos/periodo', params);
    return response.data || [];
  },
  comparecimentosHoje: async () => {
    const response = await httpClient.get<ComparecimentoResponse[]>('/api/comparecimentos/hoje');
    return response.data || [];
  },
  obterEstatisticas: async (params?: PeriodoParams) => {
    const response = await httpClient.get<EstatisticasComparecimentoResponse>('/api/comparecimentos/estatisticas', params);
    return response.data;
  },
  obterResumoSistema: async () => {
    const response = await httpClient.get<ResumoSistemaResponse>('/api/comparecimentos/resumo');
    return response.data;
  }
};

export const usuariosService = {
  listar: async () => {
    const response = await httpClient.get<UsuarioResponse[]>('/api/usuarios');
    return response.data || [];
  },
  buscarPorId: async (id: number) => {
    const response = await httpClient.get<UsuarioResponse>(`/api/usuarios/${id}`);
    return response.data;
  },
  criar: async (data: UsuarioDTO) => {
    const response = await httpClient.post<ApiResponse<UsuarioResponse>>('/api/usuarios', data);
    return response.data || { success: false, message: 'Erro ao criar' };
  },
  atualizar: async (id: number, data: Partial<UsuarioDTO>) => {
    const response = await httpClient.put<ApiResponse<UsuarioResponse>>(`/api/usuarios/${id}`, data);
    return response.data || { success: false, message: 'Erro ao atualizar' };
  },
  excluir: async (id: number) => {
    const response = await httpClient.delete<ApiResponse<void>>(`/api/usuarios/${id}`);
    return response.data || { success: false, message: 'Erro ao excluir' };
  }
};

export const convitesService = {
  criarConvite: async (data: any) => {
    const response = await httpClient.post<ApiResponse>('/api/convites', data);
    return response.data || { success: false, message: 'Erro ao criar convite' };
  },
  listarConvites: async (status?: string) => {
    const response = await httpClient.get<ApiResponse>('/api/convites', { status });
    return response.data || { success: false, data: [] };
  },
  reenviarConvite: async (id: number, data: any) => {
    const response = await httpClient.post<ApiResponse>(`/api/convites/${id}/reenviar`, data);
    return response.data || { success: false, message: 'Erro ao reenviar' };
  },
  cancelarConvite: async (id: number, motivo?: string) => {
    const response = await httpClient.delete<ApiResponse>(`/api/convites/${id}`);
    return response.data || { success: false, message: 'Erro ao cancelar' };
  }
};

export const setupService = {
  getStatus: async () => {
    const response = await httpClient.get<SetupStatusResponse>('/api/setup/status');
    return response.data;
  },
  createAdmin: async (data: SetupAdminDTO) => {
    const response = await httpClient.post<ApiResponse<any>>('/api/setup/criar-admin', data);
    return response.data || { success: false, message: 'Erro ao criar admin', timestamp: new Date().toISOString() };
  }
};

export const statusService = {
  verificarInadimplentes: async () => {
    const response = await httpClient.post<StatusVerificacaoResponse>('/api/status/verificar-inadimplentes');
    return response.data || { success: false, message: 'Erro ao verificar' };
  },
  obterEstatisticas: async () => {
    const response = await httpClient.get<StatusEstatisticasResponse>('/api/status/estatisticas');
    return response.data;
  }
};

export const testService = {
  health: async () => {
    const response = await httpClient.get<HealthResponse>('/api/test/health');
    return response.data;
  },
  info: async () => {
    const response = await httpClient.get<AppInfoResponse>('/api/test/info');
    return response.data;
  }
};