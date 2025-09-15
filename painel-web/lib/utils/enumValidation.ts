/* eslint-disable @typescript-eslint/no-explicit-any */
// painel-web/lib/utils/enumValidation.ts

import { TipoValidacao } from '@/types/api';

/**
 * Converte enum do frontend para string aceita pelo backend
 */
export function convertTipoValidacaoToString(tipo: TipoValidacao): string {
  // Garantir que sempre enviamos string, não enum object
  switch (tipo) {
    case TipoValidacao.PRESENCIAL:
      return 'PRESENCIAL';
    case TipoValidacao.ONLINE:
      return 'ONLINE';
    case TipoValidacao.CADASTRO_INICIAL:
      return 'CADASTRO_INICIAL';
    default:
      // Se vier como string, usar diretamente
      return String(tipo).toUpperCase();
  }
}

/**
 * Valida se o estado brasileiro é válido
 */
export function validateEstadoBrasil(estado: string): string {
  const estadosValidos = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];
  
  const estadoUpper = estado.toUpperCase();
  
  if (!estadosValidos.includes(estadoUpper)) {
    throw new Error(`Estado inválido: ${estado}. Use uma sigla válida como BA, SP, RJ, etc.`);
  }
  
  return estadoUpper;
}

/**
 * Converte status para string aceita pelo backend
 */
export function convertStatusToString(status: string): string {
  const statusUpper = status.toUpperCase();
  
  if (statusUpper === 'EM CONFORMIDADE' || statusUpper === 'EM_CONFORMIDADE') {
    return 'EM_CONFORMIDADE';
  }
  
  if (statusUpper === 'INADIMPLENTE') {
    return 'INADIMPLENTE';
  }
  
  // Se não reconhece, retornar o valor original
  return statusUpper;
}

/**
 * Sanitiza dados do formulário antes do envio
 */
export function sanitizeFormData(data: any): any {
  return {
    ...data,
    // Garantir que strings sejam trimmed
    validadoPor: data.validadoPor?.trim(),
    observacoes: data.observacoes?.trim(),
    motivoMudancaEndereco: data.motivoMudancaEndereco?.trim(),
    
    // Converter enum para string
    tipoValidacao: convertTipoValidacaoToString(data.tipoValidacao),
    
    // Validar endereço se houver
    ...(data.novoEndereco && {
      novoEndereco: {
        ...data.novoEndereco,
        estado: validateEstadoBrasil(data.novoEndereco.estado),
        cep: data.novoEndereco.cep?.replace(/\D/g, ''),
        logradouro: data.novoEndereco.logradouro?.trim(),
        numero: data.novoEndereco.numero?.trim(),
        complemento: data.novoEndereco.complemento?.trim(),
        bairro: data.novoEndereco.bairro?.trim(),
        cidade: data.novoEndereco.cidade?.trim()
      }
    })
  };
}

/**
 * Valida dados antes do envio
 */
export function validateBeforeSend(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Validar campos obrigatórios
  if (!data.custodiadoId) {
    errors.push('ID do custodiado é obrigatório');
  }
  
  if (!data.dataComparecimento) {
    errors.push('Data do comparecimento é obrigatória');
  }
  
  if (!data.tipoValidacao) {
    errors.push('Tipo de validação é obrigatório');
  }
  
  if (!data.validadoPor?.trim()) {
    errors.push('Campo "Validado por" é obrigatório');
  }
  
  // Validar endereço se houver mudança
  if (data.mudancaEndereco && data.novoEndereco) {
    const endereco = data.novoEndereco;
    
    if (!endereco.cep?.trim()) {
      errors.push('CEP é obrigatório para atualização de endereço');
    }
    
    if (!endereco.logradouro?.trim()) {
      errors.push('Logradouro é obrigatório para atualização de endereço');
    }
    
    if (!endereco.bairro?.trim()) {
      errors.push('Bairro é obrigatório para atualização de endereço');
    }
    
    if (!endereco.cidade?.trim()) {
      errors.push('Cidade é obrigatória para atualização de endereço');
    }
    
    if (!endereco.estado?.trim()) {
      errors.push('Estado é obrigatório para atualização de endereço');
    } else {
      try {
        validateEstadoBrasil(endereco.estado);
      } catch (error) {
        errors.push(error.message);
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Log detalhado para debug
 */
export function logFormDataForDebug(data: any, label: string = 'FormData'): void {
  if (process.env.NODE_ENV === 'development') {
    console.group(`[${label}] Dados do formulário:`);
    console.log('Dados originais:', data);
    console.log('Tipo de tipoValidacao:', typeof data.tipoValidacao, data.tipoValidacao);
    
    if (data.novoEndereco) {
      console.log('Endereço:', data.novoEndereco);
      console.log('Estado:', data.novoEndereco.estado, typeof data.novoEndereco.estado);
    }
    
    try {
      const sanitized = sanitizeFormData(data);
      console.log('Dados sanitizados:', sanitized);
      
      const validation = validateBeforeSend(sanitized);
      console.log('Validação:', validation);
    } catch (error) {
      console.error('Erro na sanitização:', error);
    }
    
    console.groupEnd();
  }
}