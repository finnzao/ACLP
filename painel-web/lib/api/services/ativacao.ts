

import { api } from '../backend-api';
import { ApiResponse } from '@/types/api';

// Tipos específicos para ativação
export interface ValidarTokenResponse {
  success: boolean;
  message: string;
  data?: {
    id: string;
    nome: string;
    email: string;
    tipo: 'ADMIN' | 'USUARIO';
    departamento?: string;
    criadoPor: string;
    criadoEm: string;
    expiraEm: string;
    status: 'PENDENTE' | 'ACEITO' | 'EXPIRADO' | 'CANCELADO';
  };
}

export interface AtivarContaDTO {
  token: string;
  senha: string;
  confirmaSenha: string;
  aceitouTermos: boolean;
}

export interface AtivarContaResponse {
  success: boolean;
  message: string;
  data?: {
    id: string;
    nome: string;
    email: string;
    tipo: string;
  };
}

export interface SolicitarNovoConviteDTO {
  email: string;
  nome?: string;
  mensagem?: string;
}

// Serviço de Ativação
export const ativacaoService = {
  /**
   * Validar token de ativação
   * @param token Token recebido por email
   */
  validarToken: async (token: string): Promise<ValidarTokenResponse> => {
    try {
      const response = await api.get<ValidarTokenResponse>(`/api/convites/validar/${token}`);
      return response.data;
    } catch (error: any) {
      console.error('[ativacaoService] Erro ao validar token:', error);
      
      // Tratar erros específicos
      if (error.response?.status === 404) {
        return {
          success: false,
          message: 'Token de ativação não encontrado ou inválido'
        };
      }
      
      if (error.response?.status === 410) {
        return {
          success: false,
          message: 'Este convite já expirou'
        };
      }
      
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao validar token'
      };
    }
  },

  /**
   * Ativar conta com nova senha
   * @param data Dados para ativação
   */
  ativarConta: async (data: AtivarContaDTO): Promise<AtivarContaResponse> => {
    try {
      // Validações locais antes de enviar
      if (data.senha !== data.confirmaSenha) {
        return {
          success: false,
          message: 'As senhas não coincidem'
        };
      }

      if (data.senha.length < 8) {
        return {
          success: false,
          message: 'A senha deve ter pelo menos 8 caracteres'
        };
      }

      if (!data.aceitouTermos) {
        return {
          success: false,
          message: 'Você deve aceitar os termos de uso'
        };
      }

      const response = await api.post<AtivarContaResponse>('/api/usuarios/ativar', {
        token: data.token,
        senha: data.senha,
        confirmaSenha: data.confirmaSenha,
        aceitouTermos: data.aceitouTermos
      });

      return response.data;
    } catch (error: any) {
      console.error('[ativacaoService] Erro ao ativar conta:', error);
      
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao ativar conta'
      };
    }
  },

  /**
   * Solicitar reenvio de convite
   * @param email Email do usuário
   */
  solicitarNovoConvite: async (data: SolicitarNovoConviteDTO): Promise<ApiResponse> => {
    try {
      const response = await api.post<ApiResponse>('/api/convites/solicitar-reenvio', data);
      return response.data;
    } catch (error: any) {
      console.error('[ativacaoService] Erro ao solicitar novo convite:', error);
      
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao solicitar novo convite',
        timestamp: new Date().toISOString()
      };
    }
  },

  /**
   * Verificar se email tem convite pendente
   * @param email Email para verificar
   */
  verificarConvitePendente: async (email: string): Promise<{
    temConvite: boolean;
    status?: string;
    expiraEm?: string;
  }> => {
    try {
      const response = await api.get(`/api/convites/verificar/${encodeURIComponent(email)}`);
      return response.data;
    } catch (error) {
      console.error('[ativacaoService] Erro ao verificar convite:', error);
      return { temConvite: false };
    }
  },

  /**
   * Cancelar convite (admin only)
   * @param tokenOuId Token ou ID do convite
   */
  cancelarConvite: async (tokenOuId: string): Promise<ApiResponse> => {
    try {
      const response = await api.delete<ApiResponse>(`/api/convites/${tokenOuId}`);
      return response.data;
    } catch (error: any) {
      console.error('[ativacaoService] Erro ao cancelar convite:', error);
      
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao cancelar convite',
        timestamp: new Date().toISOString()
      };
    }
  }
};

// Hook customizado para usar na tela de ativação
import { useState, useCallback } from 'react';

export function useAtivacao() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validarToken = useCallback(async (token: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await ativacaoService.validarToken(token);
      
      if (!result.success) {
        setError(result.message);
      }
      
      return result;
    } catch (err) {
      setError('Erro ao validar token');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const ativarConta = useCallback(async (data: AtivarContaDTO) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await ativacaoService.ativarConta(data);
      
      if (!result.success) {
        setError(result.message);
      }
      
      return result;
    } catch (err) {
      setError('Erro ao ativar conta');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    validarToken,
    ativarConta
  };
}

// Exportar tudo junto
export default ativacaoService;