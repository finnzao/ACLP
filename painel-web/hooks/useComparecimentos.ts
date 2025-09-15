/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useCallback } from 'react';
import { comparecimentosService } from '@/lib/api/services';
import { ComparecimentoDTO, ComparecimentoResponse, ResumoSistemaResponse } from '@/types/api';
import { useToastHelpers } from '@/components/Toast';

interface RegistrarComparecimentoData {
  custodiadoId: number;
  dataComparecimento: string;
  horaComparecimento: string; // Será convertido para HH:mm:ss
  tipoValidacao: string;
  observacoes?: string;
  validadoPor: string;
  mudancaEndereco?: boolean;
  motivoMudancaEndereco?: string;
  novoEndereco?: {
    cep: string;
    logradouro: string;
    numero?: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    estado: string;
  };
}

interface UseComparecimentosReturn {
  // Estados
  loading: boolean;
  error: string | null;
  comparecimentos: ComparecimentoResponse[];
  resumo: ResumoSistemaResponse | null;
  
  // Operações
  registrarComparecimento: (data: RegistrarComparecimentoData) => Promise<{ success: boolean; message: string; data?: any }>;
  buscarPorCustodiado: (custodiadoId: number) => Promise<ComparecimentoResponse[]>;
  buscarComparecimentosHoje: () => Promise<ComparecimentoResponse[]>;
  obterResumoSistema: () => Promise<ResumoSistemaResponse | null>;
  
  // Utilitários
  formatarHoraParaAPI: (hora: string) => string;
  validarDadosComparecimento: (data: RegistrarComparecimentoData) => { isValid: boolean; errors: string[] };
  limparEstados: () => void;
}

export function useComparecimentos(): UseComparecimentosReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [comparecimentos, setComparecimentos] = useState<ComparecimentoResponse[]>([]);
  const [resumo, setResumo] = useState<ResumoSistemaResponse | null>(null);
  
  const { success, error: showError } = useToastHelpers();

  /**
   * Formatar hora para o formato HH:mm:ss esperado pela API
   */
  const formatarHoraParaAPI = useCallback((hora: string): string => {
    if (!hora) return '00:00:00';
    
    // Se já está no formato HH:mm:ss, retorna como está
    if (hora.match(/^\d{2}:\d{2}:\d{2}$/)) {
      return hora;
    }
    
    // Se está no formato HH:mm, adiciona :00
    if (hora.match(/^\d{2}:\d{2}$/)) {
      return `${hora}:00`;
    }
    
    // Se está em outro formato, tenta converter
    const [hours, minutes] = hora.split(':');
    const h = hours?.padStart(2, '0') || '00';
    const m = minutes?.padStart(2, '0') || '00';
    return `${h}:${m}:00`;
  }, []);

  /**
   * Validar dados antes do envio
   */
  const validarDadosComparecimento = useCallback((data: RegistrarComparecimentoData): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!data.custodiadoId || data.custodiadoId <= 0) {
      errors.push('ID do custodiado é obrigatório');
    }

    if (!data.dataComparecimento) {
      errors.push('Data do comparecimento é obrigatória');
    }

    if (!data.horaComparecimento) {
      errors.push('Hora do comparecimento é obrigatória');
    }

    if (!data.tipoValidacao) {
      errors.push('Tipo de validação é obrigatório');
    }

    if (!data.validadoPor?.trim()) {
      errors.push('Nome do validador é obrigatório');
    }

    // Validar endereço se houver mudança
    if (data.mudancaEndereco && data.novoEndereco) {
      if (!data.novoEndereco.cep?.trim()) {
        errors.push('CEP é obrigatório para mudança de endereço');
      }
      if (!data.novoEndereco.logradouro?.trim()) {
        errors.push('Logradouro é obrigatório para mudança de endereço');
      }
      if (!data.novoEndereco.bairro?.trim()) {
        errors.push('Bairro é obrigatório para mudança de endereço');
      }
      if (!data.novoEndereco.cidade?.trim()) {
        errors.push('Cidade é obrigatória para mudança de endereço');
      }
      if (!data.novoEndereco.estado?.trim()) {
        errors.push('Estado é obrigatório para mudança de endereço');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }, []);

  /**
   * Registrar comparecimento
   */
  const registrarComparecimento = useCallback(async (data: RegistrarComparecimentoData) => {
    console.log('[useComparecimentos] Iniciando registro de comparecimento:', data);

    // Validar dados
    const validacao = validarDadosComparecimento(data);
    if (!validacao.isValid) {
      const errorMessage = `Dados inválidos: ${validacao.errors.join(', ')}`;
      setError(errorMessage);
      showError('Erro de validação', errorMessage);
      return { success: false, message: errorMessage };
    }

    setLoading(true);
    setError(null);

    try {
      // Preparar dados para API
      const dadosAPI: ComparecimentoDTO = {
        custodiadoId: data.custodiadoId,
        dataComparecimento: data.dataComparecimento,
        horaComparecimento: formatarHoraParaAPI(data.horaComparecimento), // ✅ Formato correto HH:mm:ss
        tipoValidacao: data.tipoValidacao,
        observacoes: data.observacoes || '',
        validadoPor: data.validadoPor.trim(),
        anexos: '', // Campo obrigatório na API
        mudancaEndereco: data.mudancaEndereco || false,
        motivoMudancaEndereco: data.motivoMudancaEndereco,
        novoEndereco: data.mudancaEndereco && data.novoEndereco ? {
          cep: data.novoEndereco.cep.trim(),
          logradouro: data.novoEndereco.logradouro.trim(),
          numero: data.novoEndereco.numero?.trim() || '',
          complemento: data.novoEndereco.complemento?.trim() || '',
          bairro: data.novoEndereco.bairro.trim(),
          cidade: data.novoEndereco.cidade.trim(),
          estado: data.novoEndereco.estado.trim().toUpperCase()
        } : undefined
      };

      console.log('[useComparecimentos] Dados preparados para API:', dadosAPI);

      // Chamar serviço
      const resultado = await comparecimentosService.registrar(dadosAPI);

      console.log('[useComparecimentos] Resposta da API:', resultado);

      if (resultado.success) {
        success('Comparecimento registrado', resultado.message || 'Presença confirmada com sucesso');
        return { 
          success: true, 
          message: resultado.message || 'Comparecimento registrado com sucesso',
          data: resultado.data 
        };
      } else {
        const errorMsg = resultado.message || 'Erro ao registrar comparecimento';
        setError(errorMsg);
        showError('Erro no registro', errorMsg);
        return { success: false, message: errorMsg };
      }

    } catch (err: any) {
      console.error('[useComparecimentos] Erro na requisição:', err);
      
      let errorMessage = 'Erro interno do sistema';
      
      // Tratar diferentes tipos de erro
      if (err?.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      // Mensagens específicas para problemas comuns
      if (errorMessage.includes('hora') || errorMessage.includes('time')) {
        errorMessage = `Formato de hora inválido. Use HH:mm (ex: 14:30). Erro: ${errorMessage}`;
      }
      
      setError(errorMessage);
      showError('Erro na requisição', errorMessage);
      
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [validarDadosComparecimento, formatarHoraParaAPI, success, showError]);

  /**
   * Buscar comparecimentos por custodiado
   */
  const buscarPorCustodiado = useCallback(async (custodiadoId: number): Promise<ComparecimentoResponse[]> => {
    if (custodiadoId <= 0) {
      return [];
    }

    setLoading(true);
    setError(null);

    try {
      console.log('[useComparecimentos] Buscando comparecimentos para custodiado:', custodiadoId);
      const dados = await comparecimentosService.buscarPorCustodiado(custodiadoId);
      setComparecimentos(dados);
      console.log('[useComparecimentos] Comparecimentos encontrados:', dados.length);
      return dados;
    } catch (err: any) {
      const errorMsg = 'Erro ao buscar comparecimentos';
      console.error('[useComparecimentos]', errorMsg, err);
      setError(errorMsg);
      showError('Erro na busca', errorMsg);
      return [];
    } finally {
      setLoading(false);
    }
  }, [showError]);

  /**
   * Buscar comparecimentos de hoje
   */
  const buscarComparecimentosHoje = useCallback(async (): Promise<ComparecimentoResponse[]> => {
    setLoading(true);
    setError(null);

    try {
      console.log('[useComparecimentos] Buscando comparecimentos de hoje');
      const dados = await comparecimentosService.comparecimentosHoje();
      console.log('[useComparecimentos] Comparecimentos hoje:', dados.length);
      return dados;
    } catch (err: any) {
      const errorMsg = 'Erro ao buscar comparecimentos de hoje';
      console.error('[useComparecimentos]', errorMsg, err);
      setError(errorMsg);
      showError('Erro na busca', errorMsg);
      return [];
    } finally {
      setLoading(false);
    }
  }, [showError]);

  /**
   * Obter resumo do sistema
   */
  const obterResumoSistema = useCallback(async (): Promise<ResumoSistemaResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      console.log('[useComparecimentos] Buscando resumo do sistema');
      const dados = await comparecimentosService.obterResumoSistema();
      setResumo(dados);
      console.log('[useComparecimentos] Resumo obtido:', dados);
      return dados;
    } catch (err: any) {
      const errorMsg = 'Erro ao obter resumo do sistema';
      console.error('[useComparecimentos]', errorMsg, err);
      setError(errorMsg);
      showError('Erro na busca', errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  }, [showError]);

  /**
   * Limpar estados
   */
  const limparEstados = useCallback(() => {
    setError(null);
    setComparecimentos([]);
    setResumo(null);
  }, []);

  return {
    // Estados
    loading,
    error,
    comparecimentos,
    resumo,

    // Operações
    registrarComparecimento,
    buscarPorCustodiado,
    buscarComparecimentosHoje,
    obterResumoSistema,

    // Utilitários
    formatarHoraParaAPI,
    validarDadosComparecimento,
    limparEstados
  };
}