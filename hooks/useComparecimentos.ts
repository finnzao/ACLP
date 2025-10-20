/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useCallback } from 'react';
import { comparecimentosService } from '@/lib/api/services';
import { ComparecimentoDTO, ComparecimentoResponse, ResumoSistemaResponse } from '@/types/api';
import { useToastHelpers } from '@/components/Toast';
import { 
  ValidationValidadoPor, 
  ValidationObservacoes, 
  ValidationMotivoMudanca 
} from '@/lib/utils/validation';

interface RegistrarComparecimentoData {
  custodiadoId: number;
  dataComparecimento: string;
  horaComparecimento: string;
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
  loading: boolean;
  error: string | null;
  comparecimentos: ComparecimentoResponse[];
  resumo: ResumoSistemaResponse | null;
  
  registrarComparecimento: (data: RegistrarComparecimentoData) => Promise<{ success: boolean; message: string; data?: any }>;
  buscarPorCustodiado: (custodiadoId: number) => Promise<ComparecimentoResponse[]>;
  buscarComparecimentosHoje: () => Promise<ComparecimentoResponse[]>;
  obterResumoSistema: () => Promise<ResumoSistemaResponse | null>;
  
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

  const formatarHoraParaAPI = useCallback((hora: string): string => {
    if (!hora) return '00:00:00';
    
    if (hora.match(/^\d{2}:\d{2}:\d{2}$/)) {
      return hora;
    }
    
    if (hora.match(/^\d{2}:\d{2}$/)) {
      return `${hora}:00`;
    }
    
    const [hours, minutes] = hora.split(':');
    const h = hours?.padStart(2, '0') || '00';
    const m = minutes?.padStart(2, '0') || '00';
    return `${h}:${m}:00`;
  }, []);

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

    // Validação de validadoPor: 5-100 caracteres
    const validadoPorValidation = ValidationValidadoPor(data.validadoPor);
    if (!validadoPorValidation.isValid) {
      errors.push(validadoPorValidation.error!);
    }

    // Validação de observações: 10-500 caracteres (opcional)
    const observacoesValidation = ValidationObservacoes(data.observacoes);
    if (!observacoesValidation.isValid) {
      errors.push(observacoesValidation.error!);
    }

    // Validação de motivo de mudança: 10-500 caracteres (condicional)
    const motivoValidation = ValidationMotivoMudanca(
      data.motivoMudancaEndereco, 
      data.mudancaEndereco
    );
    if (!motivoValidation.isValid) {
      errors.push(motivoValidation.error!);
    }

    // Validar endereço se houver mudança
    if (data.mudancaEndereco && data.novoEndereco) {
      if (!data.novoEndereco.cep?.trim()) {
        errors.push('CEP é obrigatório para mudança de endereço');
      } else {
        const cepLimpo = data.novoEndereco.cep.replace(/\D/g, '');
        if (cepLimpo.length < 8 || cepLimpo.length > 9) {
          errors.push('CEP deve ter entre 8 e 9 dígitos');
        }
      }

      if (!data.novoEndereco.logradouro?.trim()) {
        errors.push('Logradouro é obrigatório para mudança de endereço');
      } else {
        const logradouroTrimmed = data.novoEndereco.logradouro.trim();
        if (logradouroTrimmed.length < 5) {
          errors.push('Logradouro deve ter no mínimo 5 caracteres');
        } else if (logradouroTrimmed.length > 200) {
          errors.push('Logradouro deve ter no máximo 200 caracteres');
        }
      }

      // Validação de número: 1-20 caracteres (opcional)
      if (data.novoEndereco.numero?.trim()) {
        if (data.novoEndereco.numero.trim().length > 20) {
          errors.push('Número deve ter no máximo 20 caracteres');
        }
      }

      // Validação de complemento: 3-100 caracteres (opcional)
      if (data.novoEndereco.complemento?.trim()) {
        const compTrimmed = data.novoEndereco.complemento.trim();
        if (compTrimmed.length < 3) {
          errors.push('Complemento deve ter no mínimo 3 caracteres');
        } else if (compTrimmed.length > 100) {
          errors.push('Complemento deve ter no máximo 100 caracteres');
        }
      }

      if (!data.novoEndereco.bairro?.trim()) {
        errors.push('Bairro é obrigatório para mudança de endereço');
      } else {
        const bairroTrimmed = data.novoEndereco.bairro.trim();
        if (bairroTrimmed.length < 2) {
          errors.push('Bairro deve ter no mínimo 2 caracteres');
        } else if (bairroTrimmed.length > 100) {
          errors.push('Bairro deve ter no máximo 100 caracteres');
        }
      }

      if (!data.novoEndereco.cidade?.trim()) {
        errors.push('Cidade é obrigatória para mudança de endereço');
      } else {
        const cidadeTrimmed = data.novoEndereco.cidade.trim();
        if (cidadeTrimmed.length < 2) {
          errors.push('Cidade deve ter no mínimo 2 caracteres');
        } else if (cidadeTrimmed.length > 100) {
          errors.push('Cidade deve ter no máximo 100 caracteres');
        }
      }

      if (!data.novoEndereco.estado?.trim()) {
        errors.push('Estado é obrigatório para mudança de endereço');
      } else if (data.novoEndereco.estado.trim().length !== 2) {
        errors.push('Estado deve ter exatamente 2 caracteres');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }, []);

  const registrarComparecimento = useCallback(async (data: RegistrarComparecimentoData) => {
    console.log('[useComparecimentos] Iniciando registro de comparecimento:', data);

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
      const dadosAPI: ComparecimentoDTO = {
        custodiadoId: data.custodiadoId,
        dataComparecimento: data.dataComparecimento,
        horaComparecimento: formatarHoraParaAPI(data.horaComparecimento),
        tipoValidacao: data.tipoValidacao,
        observacoes: data.observacoes?.trim() || '',
        validadoPor: data.validadoPor.trim(),
        anexos: '',
        mudancaEndereco: data.mudancaEndereco || false,
        motivoMudancaEndereco: data.motivoMudancaEndereco?.trim(),
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
      
      if (err?.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
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

  const limparEstados = useCallback(() => {
    setError(null);
    setComparecimentos([]);
    setResumo(null);
  }, []);

  return {
    loading,
    error,
    comparecimentos,
    resumo,

    registrarComparecimento,
    buscarPorCustodiado,
    buscarComparecimentosHoje,
    obterResumoSistema,

    formatarHoraParaAPI,
    validarDadosComparecimento,
    limparEstados
  };
}