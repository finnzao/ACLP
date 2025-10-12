// painel-web/lib/api/services/convite.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { httpClient } from '@/lib/http/client';
import type { ApiResponse } from '@/types/api';

export interface ConviteDTO {
  email: string;
  tipoUsuario: 'ADMIN' | 'USUARIO';
}

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
  usosRestantes?: number;
  totalUsos?: number;
}

export const convitesService = {
  /**
   * Criar novo convite
   */
  async criarConvite(data: ConviteDTO): Promise<ApiResponse<ConviteResponse>> {
    console.log('[ConvitesService] Criando convite:', data);
    
    try {
      const response = await httpClient.post<ConviteResponse>(
        '/usuarios/convites',
        data
      );

      console.log('[ConvitesService] Resposta:', response);

      //  Garantir que message sempre seja string
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

      //  Garantir que message sempre seja string
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
  async reenviarConvite(id: number, data: { novaValidadeHoras?: number }): Promise<ApiResponse<void>> {
    console.log('[ConvitesService] Reenviando convite:', id);
    
    try {
      const response = await httpClient.post<void>(
        `/usuarios/convites/${id}/reenviar`,
        data
      );

      //  Garantir que message sempre seja string
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
  async cancelarConvite(id: number, motivo?: string): Promise<ApiResponse<void>> {
    console.log('[ConvitesService] Cancelando convite:', id);
    
    try {
      //  DELETE não aceita body, enviar como query param ou não enviar
      const response = await httpClient.delete<void>(
        `/usuarios/convites/${id}`
      );

      //  Garantir que message sempre seja string
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