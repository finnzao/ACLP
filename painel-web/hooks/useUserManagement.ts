import { useState, useCallback } from 'react';
import { usuariosService, convitesService, authService } from '@/lib/api/services';
import { useToast } from '@/components/Toast';

export interface AlterarSenhaData {
  senhaAtual: string;
  novaSenha: string;
  confirmaSenha: string;
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
   * Criar convite de usuário (Admin)
   */
  const criarConvite = useCallback(async (data: {
    nome: string;
    email: string;
    tipo: 'ADMIN' | 'USUARIO';
    departamento?: string;
    telefone?: string;
  }) => {
    setLoading(true);
    setError(null);

    try {
      const result = await convitesService.criarConvite({
        nome: data.nome,
        email: data.email,
        tipoUsuario: data.tipo,
        departamento: data.departamento,
        telefone: data.telefone,
        validadeHoras: 72
      });

      if (result.success) {
        showToast({
          type: 'success',
          title: 'Convite Enviado',
          message: `Convite enviado para ${data.email}`,
          duration: 5000
        });
        return { success: true, data: result.data };
      } else {
        throw new Error(result.message || 'Erro ao enviar convite');
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
   * Listar convites
   */
  const listarConvites = useCallback(async (status?: string) => {
    setLoading(true);
    setError(null);

    try {
      const result = await convitesService.listarConvites(status);

      if (result.success) {
        return { success: true, data: result.data || [] };
      } else {
        throw new Error(result.message || 'Erro ao listar convites');
      }
    } catch (error: any) {
      const errorMsg = error.message || 'Erro ao listar convites';
      setError(errorMsg);
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
      const result = await convitesService.reenviarConvite(id, {
        novaValidadeHoras: 72
      });

      if (result.success) {
        showToast({
          type: 'success',
          title: 'Convite Reenviado',
          message: 'O convite foi reenviado com sucesso',
          duration: 3000
        });
        return { success: true };
      } else {
        throw new Error(result.message || 'Erro ao reenviar convite');
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
      const result = await convitesService.cancelarConvite(id, motivo);

      if (result.success) {
        showToast({
          type: 'success',
          title: 'Convite Cancelado',
          message: 'O convite foi cancelado com sucesso',
          duration: 3000
        });
        return { success: true };
      } else {
        throw new Error(result.message || 'Erro ao cancelar convite');
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
    listarConvites,
    reenviarConvite,
    cancelarConvite
  };
}