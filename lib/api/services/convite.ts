/* eslint-disable @typescript-eslint/no-explicit-any */
import { httpClient } from '@/lib/http/client';
import type { ApiResponse } from '@/types/api';

// DTO para criar convite específico (com email)
export interface ConviteDTO {
  email: string;
  tipoUsuario: 'ADMIN' | 'USUARIO';
}

// Resposta do convite
export interface ConviteResponse {
  id: number;
  email: string;
  tipoUsuario: string;
  status: 'PENDENTE' | 'ATIVADO' | 'EXPIRADO' | 'CANCELADO';
  linkConvite: string;
  expiraEm: string;
  criadoEm: string;
  criadoPorNome?: string;
  comarca?: string;
  departamento?: string;
}

// Resposta da validação de token
export interface ValidarTokenResponse {
  valido: boolean;
  email: string; // Email sempre presente
  tipoUsuario?: string;
  comarca?: string;
  departamento?: string;
  expiraEm?: string;
  mensagem?: string;
}

// DTO para ativar conta
export interface AtivarContaDTO {
  token: string;
  nome: string;
  senha: string;
  confirmaSenha: string;
  cargo?: string;
}

export const convitesService = {
  /**
   * Criar convite específico com email
   */
  async criarConvite(data: ConviteDTO): Promise<ApiResponse<ConviteResponse>> {
    console.log('[ConvitesService] Criando convite:', data);
    
    try {
      const response = await httpClient.post<ConviteResponse>(
        '/usuarios/convites',
        data
      );

      console.log('[ConvitesService] Resposta:', response);

      return {
        ...response,
        message: response.message || 'Convite criado com sucesso'
      };
    } catch (error: any) {
      console.error('[ConvitesService] Erro ao criar convite:', error);
      return {
        success: false,
        message: error.message || 'Erro ao criar convite',
        status: error.status || 500,
        timestamp: new Date().toISOString()
      };
    }
  },

  /**
   * Validar token de convite
   */
  async validarToken(token: string): Promise<ApiResponse<ValidarTokenResponse>> {
    console.log('[ConvitesService] Validando token:', token.substring(0, 10) + '...');
    
    try {
      const response = await httpClient.get<ValidarTokenResponse>(
        `/usuarios/convites/validar/${token}`,
        undefined,
        { requireAuth: false }
      );

      console.log('[ConvitesService] Token validado:', response);

      return {
        ...response,
        message: response.message || 'Token válido'
      };
    } catch (error: any) {
      console.error('[ConvitesService] Erro ao validar token:', error);
      return {
        success: false,
        message: error.message || 'Token inválido ou expirado',
        status: error.status || 400,
        timestamp: new Date().toISOString()
      };
    }
  },

  /**
   * Ativar conta usando token
   */
  async ativarConta(data: AtivarContaDTO): Promise<ApiResponse<any>> {
    console.log('[ConvitesService] Ativando conta');
    
    try {
      const response = await httpClient.post<any>(
        '/usuarios/convites/ativar',
        data,
        { requireAuth: false }
      );

      console.log('[ConvitesService] Conta ativada:', response);

      return {
        ...response,
        message: response.message || 'Conta ativada com sucesso'
      };
    } catch (error: any) {
      console.error('[ConvitesService] Erro ao ativar conta:', error);
      return {
        success: false,
        message: error.message || 'Erro ao ativar conta',
        status: error.status || 500,
        timestamp: new Date().toISOString()
      };
    }
  },

  /**
   * Listar convites
   */
  async listarConvites(status?: string): Promise<ApiResponse<ConviteResponse[]>> {
    console.log('[ConvitesService] Listando convites, status:', status);
    
    try {
      const params = status ? { status } : undefined;
      
      const response = await httpClient.get<ConviteResponse[]>(
        '/usuarios/convites',
        params
      );

      console.log('[ConvitesService] Resposta da listagem:', response);

      return {
        ...response,
        message: response.message || 'Convites listados com sucesso',
        data: response.data || []
      };
    } catch (error: any) {
      console.error('[ConvitesService] Erro ao listar convites:', error);
      return {
        success: false,
        message: error.message || 'Erro ao listar convites',
        data: [],
        status: error.status || 500,
        timestamp: new Date().toISOString()
      };
    }
  },

  /**
   * Reenviar convite
   */
  async reenviarConvite(id: number): Promise<ApiResponse<void>> {
    console.log('[ConvitesService] Reenviando convite:', id);
    
    try {
      const response = await httpClient.post<void>(
        `/usuarios/convites/${id}/reenviar`,
        {}
      );

      return {
        ...response,
        message: response.message || 'Convite reenviado com sucesso'
      };
    } catch (error: any) {
      console.error('[ConvitesService] Erro ao reenviar convite:', error);
      return {
        success: false,
        message: error.message || 'Erro ao reenviar convite',
        status: error.status || 500,
        timestamp: new Date().toISOString()
      };
    }
  },

  /**
   * Cancelar convite
   */
  async cancelarConvite(id: number): Promise<ApiResponse<void>> {
    console.log('[ConvitesService] Cancelando convite:', id);
    
    try {
      const response = await httpClient.delete<void>(
        `/usuarios/convites/${id}`
      );

      return {
        ...response,
        message: response.message || 'Convite cancelado com sucesso'
      };
    } catch (error: any) {
      console.error('[ConvitesService] Erro ao cancelar convite:', error);
      return {
        success: false,
        message: error.message || 'Erro ao cancelar convite',
        status: error.status || 500,
        timestamp: new Date().toISOString()
      };
    }
  }
};