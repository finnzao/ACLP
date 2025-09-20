// lib/utils/formatting.ts
/**
 * Utilitários para formatação e validação de dados
 */

// ===========================
// FORMATAÇÃO DE DOCUMENTOS
// ===========================

/**
 * Formatar CPF no padrão XXX.XXX.XXX-XX
 * @param cpf CPF com ou sem formatação
 * @returns CPF formatado ou string vazia se inválido
 */
export const formatCPF = (cpf: string): string => {
  if (!cpf) return '';
  
  // Remove todos os caracteres não numéricos
  const numbers = cpf.replace(/\D/g, '');
  
  // Limita a 11 dígitos
  const limitedNumbers = numbers.slice(0, 11);
  
  // Aplica a formatação conforme a quantidade de dígitos
  if (limitedNumbers.length <= 3) {
    return limitedNumbers;
  } else if (limitedNumbers.length <= 6) {
    return limitedNumbers.replace(/(\d{3})(\d{0,3})/, '$1.$2');
  } else if (limitedNumbers.length <= 9) {
    return limitedNumbers.replace(/(\d{3})(\d{3})(\d{0,3})/, '$1.$2.$3');
  } else {
    return limitedNumbers.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, '$1.$2.$3-$4');
  }
};

/**
 * Formatar RG no padrão XX.XXX.XXX-X
 * @param rg RG com ou sem formatação
 * @returns RG formatado ou string vazia se inválido
 */
export const formatRG = (rg: string): string => {
  if (!rg) return '';
  
  // Remove todos os caracteres não alfanuméricos, mantendo apenas números e letras
  const alphanumeric = rg.replace(/[^0-9A-Za-z]/g, '').toUpperCase();
  
  // Limita a 9 caracteres
  const limited = alphanumeric.slice(0, 9);
  
  // Aplica formatação para RG numérico (mais comum)
  if (/^\d+$/.test(limited)) {
    if (limited.length <= 2) {
      return limited;
    } else if (limited.length <= 5) {
      return limited.replace(/(\d{2})(\d{0,3})/, '$1.$2');
    } else if (limited.length <= 8) {
      return limited.replace(/(\d{2})(\d{3})(\d{0,3})/, '$1.$2.$3');
    } else {
      return limited.replace(/(\d{2})(\d{3})(\d{3})(\d{0,1})/, '$1.$2.$3-$4');
    }
  }
  
  // Se contém letras, aplica formatação básica
  return limited;
};

/**
 *  NOVA FUNÇÃO: Formatar processo no padrão CNJ
 * @param processo Processo com ou sem formatação
 * @returns Processo formatado no padrão CNJ ou string original se muito curto
 */
export const formatProcesso = (processo: string): string => {
  if (!processo) return '';
  
  // Remove todos os caracteres não numéricos
  const numeros = processo.replace(/\D/g, '');
  
  // Se não tem números suficientes, retorna como está
  if (numeros.length < 13) {
    return numeros;
  }
  
  // Aplica formatação CNJ: NNNNNNN-DD.AAAA.J.TR.OOOO
  // Exemplo: 1234567-89.2024.8.05.0001
  
  // Pega os primeiros 20 dígitos (máximo para processo CNJ)
  const numerosLimitados = numeros.slice(0, 20);
  
  if (numerosLimitados.length >= 20) {
    // Formato completo: NNNNNNN-DD.AAAA.J.TR.OOOO
    return `${numerosLimitados.slice(0, 7)}-${numerosLimitados.slice(7, 9)}.${numerosLimitados.slice(9, 13)}.${numerosLimitados.slice(13, 14)}.${numerosLimitados.slice(14, 16)}.${numerosLimitados.slice(16, 20)}`;
  } else if (numerosLimitados.length >= 13) {
    // Formato parcial baseado no que tem disponível
    const sequencial = numerosLimitados.slice(0, 7);
    const digitos = numerosLimitados.slice(7, 9);
    const ano = numerosLimitados.slice(9, 13);
    const resto = numerosLimitados.slice(13);
    
    let formatted = `${sequencial}-${digitos}.${ano}`;
    
    if (resto.length >= 1) {
      formatted += `.${resto.slice(0, 1)}`;
      if (resto.length >= 3) {
        formatted += `.${resto.slice(1, 3)}`;
        if (resto.length >= 7) {
          formatted += `.${resto.slice(3, 7)}`;
        } else if (resto.length > 3) {
          formatted += `.${resto.slice(3)}`;
        }
      } else if (resto.length > 1) {
        formatted += `.${resto.slice(1)}`;
      }
    }
    
    return formatted;
  }
  
  return numerosLimitados;
};

// ===========================
// FORMATAÇÃO DE CONTATO
// ===========================

/**
 * Formatar telefone no padrão brasileiro
 * @param phone Telefone com ou sem formatação
 * @returns Telefone formatado
 */
export const formatContato = (phone: string): string => {
  if (!phone) return '';
  
  // Remove todos os caracteres não numéricos
  const numbers = phone.replace(/\D/g, '');
  
  // Limita a 11 dígitos
  const limitedNumbers = numbers.slice(0, 11);
  
  // Aplica formatação baseada no tamanho
  if (limitedNumbers.length <= 2) {
    return limitedNumbers;
  } else if (limitedNumbers.length <= 7) {
    // Formato: (XX) XXXXX
    return limitedNumbers.replace(/(\d{2})(\d{0,5})/, '($1) $2');
  } else if (limitedNumbers.length <= 10) {
    // Formato: (XX) XXXX-XXXX (telefone fixo)
    return limitedNumbers.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
  } else {
    // Formato: (XX) XXXXX-XXXX (celular)
    return limitedNumbers.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
  }
};

// ===========================
// FORMATAÇÃO DE ENDEREÇO
// ===========================

/**
 * Formatar CEP no padrão XXXXX-XXX
 * @param cep CEP com ou sem formatação
 * @returns CEP formatado
 */
export const formatCEP = (cep: string): string => {
  if (!cep) return '';
  
  // Remove todos os caracteres não numéricos
  const numbers = cep.replace(/\D/g, '');
  
  // Limita a 8 dígitos
  const limitedNumbers = numbers.slice(0, 8);
  
  // Aplica formatação
  if (limitedNumbers.length <= 5) {
    return limitedNumbers;
  } else {
    return limitedNumbers.replace(/(\d{5})(\d{0,3})/, '$1-$2');
  }
};

// ===========================
// UTILITÁRIOS DE VALIDAÇÃO
// ===========================

export const validationUtils = {
  /**
   * Validar CPF usando algoritmo oficial
   * @param cpf CPF formatado ou apenas números
   * @returns true se CPF é válido
   */
  isValidCPF: (cpf: string): boolean => {
    if (!cpf) return false;
    
    // Remove formatação
    const numbers = cpf.replace(/\D/g, '');
    
    // Verifica se tem 11 dígitos
    if (numbers.length !== 11) return false;
    
    // Verifica se não são todos iguais (ex: 111.111.111-11)
    if (/^(\d)\1{10}$/.test(numbers)) return false;
    
    // Cálculo dos dígitos verificadores
    let sum = 0;
    let remainder;
    
    // Primeiro dígito
    for (let i = 1; i <= 9; i++) {
      sum += parseInt(numbers.substring(i - 1, i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(numbers.substring(9, 10))) return false;
    
    // Segundo dígito
    sum = 0;
    for (let i = 1; i <= 10; i++) {
      sum += parseInt(numbers.substring(i - 1, i)) * (12 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(numbers.substring(10, 11))) return false;
    
    return true;
  },

  /**
   *  NOVA FUNÇÃO: Validar processo CNJ
   * @param processo Processo formatado ou apenas números
   * @returns true se processo segue padrão CNJ
   */
  isValidProcess: (processo: string): boolean => {
    if (!processo) return false;
    
    // Remove formatação
    const numeros = processo.replace(/\D/g, '');
    
    // Deve ter exatamente 20 dígitos
    if (numeros.length !== 20) return false;
    
    // Verificar se o ano é válido (entre 1990 e ano atual + 1)
    const ano = parseInt(numeros.slice(9, 13));
    const anoAtual = new Date().getFullYear();
    if (ano < 1990 || ano > anoAtual + 1) return false;
    
    // Validação dos dígitos verificadores (algoritmo CNJ)
    const sequencial = numeros.slice(0, 7);
    const digitosVerificadores = numeros.slice(7, 9);
    
    // Cálculo dos dígitos verificadores
    let soma = 0;
    let multiplicador = 2;
    
    // Calcula para os 7 primeiros dígitos + ano + segmento + tribunal + origem
    const parteCalculo = sequencial + numeros.slice(9);
    
    for (let i = parteCalculo.length - 1; i >= 0; i--) {
      soma += parseInt(parteCalculo[i]) * multiplicador;
      multiplicador = multiplicador === 9 ? 2 : multiplicador + 1;
    }
    
    const resto = soma % 97;
    const digitoCalculado = 98 - resto;
    
    return digitoCalculado.toString().padStart(2, '0') === digitosVerificadores;
  },

  /**
   * Validar telefone brasileiro
   * @param phone Telefone formatado ou apenas números
   * @returns true se telefone é válido
   */
  isValidPhone: (phone: string): boolean => {
    if (!phone) return false;
    
    // Remove formatação
    const numbers = phone.replace(/\D/g, '');
    
    // Telefone deve ter 10 ou 11 dígitos
    if (numbers.length < 10 || numbers.length > 11) return false;
    
    // Verifica se começa com código de área válido (11 a 99)
    const areaCode = parseInt(numbers.substring(0, 2));
    if (areaCode < 11 || areaCode > 99) return false;
    
    // Para celular (11 dígitos), o terceiro dígito deve ser 9
    if (numbers.length === 11) {
      const thirdDigit = parseInt(numbers.substring(2, 3));
      if (thirdDigit !== 9) return false;
    }
    
    return true;
  },

  /**
   * Validar CEP brasileiro
   * @param cep CEP formatado ou apenas números
   * @returns true se CEP é válido
   */
  isValidCEP: (cep: string): boolean => {
    if (!cep) return false;
    
    // Remove formatação
    const numbers = cep.replace(/\D/g, '');
    
    // CEP deve ter exatamente 8 dígitos
    if (numbers.length !== 8) return false;
    
    // Verifica se não são todos zeros ou todos iguais
    if (/^0{8}$/.test(numbers) || /^(\d)\1{7}$/.test(numbers)) return false;
    
    return true;
  },

  /**
   * Validar data no formato ISO (YYYY-MM-DD)
   * @param date Data em formato string
   * @returns true se data é válida
   */
  isValidDate: (date: string): boolean => {
    if (!date) return false;
    
    const dateObj = new Date(date);
    return dateObj instanceof Date && !isNaN(dateObj.getTime());
  },

  /**
   * Verificar se data não é futura
   * @param date Data em formato string
   * @returns true se data não é futura
   */
  isNotFutureDate: (date: string): boolean => {
    if (!date) return false;
    
    const dateObj = new Date(date);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Final do dia atual
    
    return dateObj <= today;
  }
};

// ===========================
// UTILITÁRIOS DE TEXTO
// ===========================

/**
 * Capitalizar primeira letra de cada palavra
 * @param text Texto a ser capitalizado
 * @returns Texto capitalizado
 */
export const capitalizeWords = (text: string): string => {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Remover acentos de um texto
 * @param text Texto com acentos
 * @returns Texto sem acentos
 */
export const removeAccents = (text: string): string => {
  if (!text) return '';
  
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
};

/**
 * Limitar texto por número de caracteres
 * @param text Texto a ser limitado
 * @param maxLength Número máximo de caracteres
 * @param suffix Sufixo a ser adicionado se truncado (ex: '...')
 * @returns Texto limitado
 */
export const truncateText = (text: string, maxLength: number, suffix: string = '...'): string => {
  if (!text || text.length <= maxLength) return text;
  
  return text.substring(0, maxLength - suffix.length) + suffix;
};

// ===========================
// UTILITÁRIOS DE CONVERSÃO
// ===========================

/**
 * Converter data para formato brasileiro (DD/MM/YYYY)
 * @param date Data em formato ISO ou objeto Date
 * @returns Data formatada em português brasileiro
 */
export const formatDateToBR = (date: string | Date): string => {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('pt-BR');
  } catch {
    return '';
  }
};

/**
 * Converter data e hora para formato brasileiro
 * @param datetime Data/hora em formato ISO ou objeto Date
 * @returns Data/hora formatada em português brasileiro
 */
export const formatDateTimeToBR = (datetime: string | Date): string => {
  if (!datetime) return '';
  
  try {
    const dateObj = typeof datetime === 'string' ? new Date(datetime) : datetime;
    return dateObj.toLocaleString('pt-BR');
  } catch {
    return '';
  }
};

/**
 * Converter valor monetário para formato brasileiro
 * @param value Valor numérico
 * @returns Valor formatado em reais (R$ X.XXX,XX)
 */
export const formatCurrency = (value: number): string => {
  if (typeof value !== 'number') return 'R$ 0,00';
  
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
};

/**
 * Converter número para formato brasileiro
 * @param value Valor numérico
 * @param decimals Número de casas decimais
 * @returns Número formatado
 */
export const formatNumber = (value: number, decimals: number = 0): string => {
  if (typeof value !== 'number') return '0';
  
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};
/**
 *  FUNÇÃO CORRIGIDA: Formatar processo no padrão CNJ
 * @param processo Processo com ou sem formatação
 * @returns Processo formatado no padrão CNJ
 */
export const formatProcessoCNJ = (processo: string): string => {
  if (!processo) return '';
  
  // Remove todos os caracteres não numéricos
  const numeros = processo.replace(/\D/g, '');
  
  // Se não tem números suficientes para formato mínimo, retorna como está
  if (numeros.length < 13) {
    return numeros;
  }
  
  // Pega no máximo 20 dígitos (formato CNJ completo)
  const numerosLimitados = numeros.slice(0, 20);
  
  if (numerosLimitados.length >= 20) {
    // Formato completo: NNNNNNN-DD.AAAA.J.TR.OOOO
    // Exemplo: 4767193-87.2025.5.01.4044
    return `${numerosLimitados.slice(0, 7)}-${numerosLimitados.slice(7, 9)}.${numerosLimitados.slice(9, 13)}.${numerosLimitados.slice(13, 14)}.${numerosLimitados.slice(14, 16)}.${numerosLimitados.slice(16, 20)}`;
  } else if (numerosLimitados.length >= 13) {
    // Formatação progressiva baseada nos dígitos disponíveis
    const sequencial = numerosLimitados.slice(0, Math.min(7, numerosLimitados.length));
    const resto = numerosLimitados.slice(7);
    
    let formatted = sequencial;
    
    if (resto.length >= 2) {
      // Adiciona dígitos verificadores
      formatted += `-${resto.slice(0, 2)}`;
      
      if (resto.length >= 6) {
        // Adiciona ano
        formatted += `.${resto.slice(2, 6)}`;
        
        if (resto.length >= 7) {
          // Adiciona segmento
          formatted += `.${resto.slice(6, 7)}`;
          
          if (resto.length >= 9) {
            // Adiciona tribunal
            formatted += `.${resto.slice(7, 9)}`;
            
            if (resto.length >= 13) {
              // Adiciona origem
              formatted += `.${resto.slice(9, 13)}`;
            } else if (resto.length > 9) {
              formatted += `.${resto.slice(9)}`;
            }
          } else if (resto.length > 7) {
            formatted += `.${resto.slice(7)}`;
          }
        } else if (resto.length > 6) {
          formatted += `.${resto.slice(6)}`;
        }
      } else if (resto.length > 2) {
        formatted += `.${resto.slice(2)}`;
      }
    } else if (resto.length > 0) {
      formatted += `-${resto}`;
    }
    
    return formatted;
  }
  
  return numerosLimitados;
};

/**
 *  FUNÇÃO CORRIGIDA: Validar processo CNJ (versão mais flexível)
 * @param processo Processo formatado ou apenas números
 * @returns true se processo segue padrão CNJ básico
 */
export const isValidProcessoCNJ = (processo: string): boolean => {
  if (!processo) return false;
  
  // Remove formatação
  const numeros = processo.replace(/\D/g, '');
  
  // Deve ter pelo menos 13 dígitos (mínimo para formato CNJ básico)
  if (numeros.length < 13) return false;
  
  // Para validação completa, deve ter exatamente 20 dígitos
  if (numeros.length !== 20) {
    // Se não tem 20 dígitos, aceita como válido se tem pelo menos estrutura básica
    console.log(`[ProcessoCNJ] Processo com ${numeros.length} dígitos - aceito como válido`);
    return numeros.length >= 13;
  }
  
  try {
    // Validações básicas para processo de 20 dígitos
    
    // 1. Verificar se o ano é válido (posições 9-12)
    const ano = parseInt(numeros.slice(9, 13));
    const anoAtual = new Date().getFullYear();
    if (ano < 1990 || ano > anoAtual + 2) {
      console.log(`[ProcessoCNJ] Ano inválido: ${ano}`);
      return false;
    }
    
    // 2. Verificar segmento do poder judiciário (posição 13)
    const segmento = parseInt(numeros.slice(13, 14));
    if (segmento < 1 || segmento > 9) {
      console.log(`[ProcessoCNJ] Segmento inválido: ${segmento}`);
      return false;
    }
    
    // 3. Verificar tribunal (posições 14-15)
    const tribunal = parseInt(numeros.slice(14, 16));
    if (tribunal < 1 || tribunal > 99) {
      console.log(`[ProcessoCNJ] Tribunal inválido: ${tribunal}`);
      return false;
    }
    
    // 4. Validação dos dígitos verificadores (posições 7-8)
    const sequencial = numeros.slice(0, 7);
    const digitosVerificadores = numeros.slice(7, 9);
    const parteResto = numeros.slice(9); // ano + segmento + tribunal + origem
    
    // Cálculo dos dígitos verificadores (algoritmo CNJ)
    let soma = 0;
    let multiplicador = 2;
    
    // Concatena sequencial + resto para o cálculo
    const parteCalculo = sequencial + parteResto;
    
    // Calcula o somatório
    for (let i = parteCalculo.length - 1; i >= 0; i--) {
      soma += parseInt(parteCalculo[i]) * multiplicador;
      multiplicador = multiplicador === 9 ? 2 : multiplicador + 1;
    }
    
    // Calcula o resto da divisão por 97
    const resto = soma % 97;
    const digitoCalculado = 98 - resto;
    
    // Converte para string com zero à esquerda se necessário
    const digitoCalculadoStr = digitoCalculado.toString().padStart(2, '0');
    
    const isDigitoValido = digitoCalculadoStr === digitosVerificadores;
    
    if (!isDigitoValido) {
      console.log(`[ProcessoCNJ] Dígito verificador inválido. Esperado: ${digitoCalculadoStr}, Recebido: ${digitosVerificadores}`);
      console.log(`[ProcessoCNJ] Cálculo - Soma: ${soma}, Resto: ${resto}, Dígito: ${digitoCalculado}`);
      console.log(`[ProcessoCNJ] Parte do cálculo: ${parteCalculo}`);
    }
    
    return isDigitoValido;
    
  } catch (error) {
    console.error('[ProcessoCNJ] Erro na validação:', error);
    return false;
  }
};

export const isValidProcessoCNJSimple = (processo: string): boolean => {
  if (!processo) return false;
  
  // Remove formatação
  const numeros = processo.replace(/\D/g, '');
  
  // Verificações básicas
  if (numeros.length < 13 || numeros.length > 20) return false;
  
  // Se tem 20 dígitos, verifica estrutura básica
  if (numeros.length === 20) {
    // Verifica ano (posições 9-12)
    const ano = parseInt(numeros.slice(9, 13));
    const anoAtual = new Date().getFullYear();
    if (ano < 1990 || ano > anoAtual + 2) return false;
    
    // Verifica segmento (posição 13) - deve ser 1-9
    const segmento = parseInt(numeros.slice(13, 14));
    if (segmento < 1 || segmento > 9) return false;
    
    // Verifica tribunal (posições 14-15) - deve ser 01-99
    const tribunal = parseInt(numeros.slice(14, 16));
    if (tribunal < 1 || tribunal > 99) return false;
  }
  
  return true;
};

// ===========================
// EXEMPLO DE USO E TESTE
// ===========================


// ===========================
// EXPORT PRINCIPAL
// ===========================

export default {
  formatCPF,
  formatRG,
  formatProcesso, 
  formatContato,
  formatCEP,
  
  validationUtils,
  
  capitalizeWords,
  removeAccents,
  truncateText,
  
  formatDateToBR,
  formatDateTimeToBR,
  formatCurrency,
  formatNumber
};