/* eslint-disable @typescript-eslint/no-explicit-any */
// painel-web/hooks/useUserManagement.ts
import { useState, useCallback } from 'react';
import { usuariosService, authService } from '@/lib/api/services';
import { useToast } from '@/components/Toast';
import { httpClient } from '@/lib/http/client';

export interface AlterarSenhaData {
  senhaAtual: string;
  novaSenha: string;
  confirmaSenha: string;
}

export interface CriarConviteData {
  email: string;
  tipoUsuario: 'ADMIN' | 'USUARIO';
}

export interface GerarLinkData {
  tipoUsuario: 'ADMIN' | 'USUARIO';
  quantidadeUsos?: number;
  diasValidade?: number;
}

export function useUserManagement() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  /**
   * Alterar senha do usuário atual
   */
  const alterarSenha = useCallback(async (data: AlterarSenhaData) => {
    // Validações
    if (!data.senhaAtual) {
      showToast({
        type: 'error',
        title: 'Campo obrigatório',
        message: 'Digite sua senha atual',
        duration: 3000
      });
      return { success: false };
    }

    if (data.novaSenha.length < 8) {
      showToast({
        type: 'error',
        title: 'Senha inválida',
        message: 'A nova senha deve ter pelo menos 8 caracteres',
        duration: 3000
      });
      return { success: false };
    }

    if (data.novaSenha !== data.confirmaSenha) {
      showToast({
        type: 'error',
        title: 'Erro de validação',
        message: 'As senhas não coincidem',
        duration: 3000
      });
      return { success: false };
    }

    // Validar força da senha
    const hasUpperCase = /[A-Z]/.test(data.novaSenha);
    const hasLowerCase = /[a-z]/.test(data.novaSenha);
    const hasNumber = /[0-9]/.test(data.novaSenha);
    const hasSpecial = /[^a-zA-Z0-9]/.test(data.novaSenha);

    if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecial) {
      showToast({
        type: 'error',
        title: 'Senha fraca',
        message: 'A senha deve conter letras maiúsculas, minúsculas, números e caracteres especiais',
        duration: 5000
      });
      return { success: false };
    }

    setLoading(true);
    setError(null);

    try {
      const result = await authService.alterarSenha(data);

      if (result.success) {
        showToast({
          type: 'success',
          title: 'Senha Alterada',
          message: 'Sua senha foi alterada com sucesso',
          duration: 3000
        });
        return { success: true };
      } else {
        showToast({
          type: 'error',
          title: 'Erro ao alterar senha',
          message: result.message || 'Senha atual incorreta',
          duration: 3000
        });
        return { success: false };
      }
    } catch (error: any) {
      const errorMsg = error.message || 'Erro ao alterar senha';
      setError(errorMsg);
      showToast({
        type: 'error',
        title: 'Erro',
        message: errorMsg,
        duration: 3000
      });
      return { success: false };
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  /**
   * Atualizar perfil do usuário
   */
  const atualizarPerfil = useCallback(async (data: {
    nome: string;
    email: string;
    telefone?: string;
    departamento?: string;
  }) => {
    setLoading(true);
    setError(null);

    try {
      // Obter ID do usuário atual
      const profileResult = await authService.getProfile();
      
      if (!profileResult.success || !profileResult.data) {
        throw new Error('Não foi possível obter dados do usuário');
      }

      const userId = profileResult.data.id;

      // Atualizar usuário
      const result = await usuariosService.atualizar(userId, data);

      if (result.success) {
        showToast({
          type: 'success',
          title: 'Perfil Atualizado',
          message: 'Suas informações foram atualizadas com sucesso',
          duration: 3000
        });
        return { success: true, data: result.data };
      } else {
        throw new Error(result.message || 'Erro ao atualizar perfil');
      }
    } catch (error: any) {
      const errorMsg = error.message || 'Erro ao atualizar perfil';
      setError(errorMsg);
      showToast({
        type: 'error',
        title: 'Erro',
        message: errorMsg,
        duration: 3000
      });
      return { success: false };
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  /**
   * Criar convite com email específico (Admin)
   */
  const criarConvite = useCallback(async (data: CriarConviteData) => {
    setLoading(true);
    setError(null);

    try {
      console.log('[useUserManagement] Criando convite com email:', data);

      const response = await httpClient.post<any>(
        '/usuarios/convites',
        data
      );

      console.log('[useUserManagement] Resposta da API:', response);

      if (response.success && response.data) {
        showToast({
          type: 'success',
          title: 'Convite Enviado',
          message: `Convite enviado para ${data.email}`,
          duration: 5000
        });
        return { success: true, data: response.data };
      } else {
        throw new Error(response.message || 'Erro ao enviar convite');
      }
    } catch (error: any) {
      const errorMsg = error.message || 'Erro ao enviar convite';
      setError(errorMsg);
      showToast({
        type: 'error',
        title: 'Erro',
        message: errorMsg,
        duration: 3000
      });
      return { success: false };
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  /**
   * ✅ NOVA FUNÇÃO: Gerar link genérico (Admin)
   */
  const gerarLinkConvite = useCallback(async (data: GerarLinkData) => {
    setLoading(true);
    setError(null);

    try {
      console.log('[useUserManagement] Gerando link genérico:', data);

      const payload = {
        tipoUsuario: data.tipoUsuario,
        quantidadeUsos: data.quantidadeUsos || 1,
        diasValidade: data.diasValidade || 30
      };

      const response = await httpClient.post<any>(
        '/usuarios/convites/gerar-link',
        payload
      );

      console.log('[useUserManagement] Resposta do link genérico:', response);

      if (response.success && response.data) {
        showToast({
          type: 'success',
          title: 'Link Gerado',
          message: 'Link de convite criado com sucesso',
          duration: 5000
        });
        return { success: true, data: response.data };
      } else {
        throw new Error(response.message || 'Erro ao gerar link');
      }
    } catch (error: any) {
      const errorMsg = error.message || 'Erro ao gerar link de convite';
      setError(errorMsg);
      showToast({
        type: 'error',
        title: 'Erro',
        message: errorMsg,
        duration: 3000
      });
      return { success: false };
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  /**
   * Listar convites
   */
  const listarConvites = useCallback(async (status?: string) => {
    setLoading(true);
    setError(null);

    try {
      console.log('[useUserManagement] Listando convites, status:', status);

      const params = status ? { status } : undefined;
      
      const response = await httpClient.get<any>(
        '/usuarios/convites',
        params
      );

      console.log('[useUserManagement] Resposta da listagem:', response);

      if (response.success) {
        return { 
          success: true, 
          data: response.data || [] 
        };
      } else {
        throw new Error(response.message || 'Erro ao listar convites');
      }
    } catch (error: any) {
      const errorMsg = error.message || 'Erro ao listar convites';
      setError(errorMsg);
      console.error('[useUserManagement] Erro ao listar convites:', error);
      return { success: false, data: [] };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Reenviar convite
   */
  const reenviarConvite = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);

    try {
      console.log('[useUserManagement] Reenviando convite ID:', id);

      const response = await httpClient.post<any>(
        `/usuarios/convites/${id}/reenviar`,
        { novaValidadeHoras: 72 }
      );

      if (response.success) {
        showToast({
          type: 'success',
          title: 'Convite Reenviado',
          message: 'O convite foi reenviado com sucesso',
          duration: 3000
        });
        return { success: true };
      } else {
        throw new Error(response.message || 'Erro ao reenviar convite');
      }
    } catch (error: any) {
      const errorMsg = error.message || 'Erro ao reenviar convite';
      setError(errorMsg);
      showToast({
        type: 'error',
        title: 'Erro',
        message: errorMsg,
        duration: 3000
      });
      return { success: false };
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  /**
   * Cancelar convite
   */
  const cancelarConvite = useCallback(async (id: number, motivo?: string) => {
    setLoading(true);
    setError(null);

    try {
      console.log('[useUserManagement] Cancelando convite ID:', id);

      const response = await httpClient.delete<any>(
        `/usuarios/convites/${id}`
      );

      if (response.success) {
        showToast({
          type: 'success',
          title: 'Convite Cancelado',
          message: 'O convite foi cancelado com sucesso',
          duration: 3000
        });
        return { success: true };
      } else {
        throw new Error(response.message || 'Erro ao cancelar convite');
      }
    } catch (error: any) {
      const errorMsg = error.message || 'Erro ao cancelar convite';
      setError(errorMsg);
      showToast({
        type: 'error',
        title: 'Erro',
        message: errorMsg,
        duration: 3000
      });
      return { success: false };
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  return {
    loading,
    error,
    alterarSenha,
    atualizarPerfil,
    criarConvite,
    gerarLinkConvite, // ✅ Função adicionada
    listarConvites,
    reenviarConvite,
    cancelarConvite
  };
}