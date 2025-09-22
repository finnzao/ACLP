

/**
 * Formatadores e validadores de input profissionais
 */

// VALIDADORES DE TECLA

/**
 * Verifica se a tecla pressionada é permitida para campos numéricos
 */
export const isNumericKey = (event: React.KeyboardEvent): boolean => {
    const key = event.key;
    const isNumber = /^\d$/.test(key);
    const isControl = [
      'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
      'Home', 'End'
    ].includes(key);
    const isModifier = event.ctrlKey || event.metaKey; // Permite Ctrl+C, Ctrl+V, etc
    
    return isNumber || isControl || isModifier;
  };
  
  /**
   * Verifica se a tecla pressionada é permitida para campos alfabéticos
   */
  export const isAlphabeticKey = (event: React.KeyboardEvent): boolean => {
    const key = event.key;
    const char = event.key.length === 1 ? event.key : '';
    
    // Letras, espaços, acentos e caracteres especiais permitidos em nomes
    const isLetter = /^[a-zA-ZÀ-ÿ\s\-'.]$/.test(char);
    const isControl = [
      'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
      'Home', 'End'
    ].includes(key);
    const isModifier = event.ctrlKey || event.metaKey;
    
    return isLetter || isControl || isModifier;
  };
  
  /**
   * Verifica se a tecla é permitida para telefone
   */
  export const isPhoneKey = (event: React.KeyboardEvent): boolean => {
    const key = event.key;
    const isNumber = /^\d$/.test(key);
    const isAllowedChar = ['(', ')', '-', ' '].includes(key);
    const isControl = [
      'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
      'Home', 'End'
    ].includes(key);
    const isModifier = event.ctrlKey || event.metaKey;
    
    return isNumber || isAllowedChar || isControl || isModifier;
  };
  

  // FORMATADORES EM TEMPO REAL

  /**
   * Formata CPF em tempo real: 000.000.000-00
   */
  export const formatCPFInput = (value: string): string => {
    const numbers = value.replace(/\D/g, '').slice(0, 11);
    
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
    if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9)}`;
  };
  
  /**
   * Formata RG em tempo real: 00.000.000-0
   */
  export const formatRGInput = (value: string): string => {
    const numbers = value.replace(/\D/g, '').slice(0, 9);
    
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 5) return `${numbers.slice(0, 2)}.${numbers.slice(2)}`;
    if (numbers.length <= 8) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5)}`;
    return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}-${numbers.slice(8)}`;
  };
  
  /**
   * Formata telefone em tempo real: (00) 00000-0000 ou (00) 0000-0000
   */
  export const formatPhoneInput = (value: string): string => {
    const numbers = value.replace(/\D/g, '').slice(0, 11);
    
    if (numbers.length === 0) return '';
    if (numbers.length <= 2) return `(${numbers}`;
    if (numbers.length <= 6) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    if (numbers.length <= 10) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
    }
    // Celular com 9 dígitos
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
  };
  
  /**
   * Formata CEP em tempo real: 00000-000
   */
  export const formatCEPInput = (value: string): string => {
    const numbers = value.replace(/\D/g, '').slice(0, 8);
    
    if (numbers.length <= 5) return numbers;
    return `${numbers.slice(0, 5)}-${numbers.slice(5)}`;
  };
  
  /**
   * Formata processo CNJ em tempo real: 0000000-00.0000.0.00.0000
   */
  export const formatProcessoInput = (value: string): string => {
    const numbers = value.replace(/\D/g, '').slice(0, 20);
    
    if (numbers.length <= 7) return numbers;
    if (numbers.length <= 9) return `${numbers.slice(0, 7)}-${numbers.slice(7)}`;
    if (numbers.length <= 13) return `${numbers.slice(0, 7)}-${numbers.slice(7, 9)}.${numbers.slice(9)}`;
    if (numbers.length <= 14) return `${numbers.slice(0, 7)}-${numbers.slice(7, 9)}.${numbers.slice(9, 13)}.${numbers.slice(13)}`;
    if (numbers.length <= 16) return `${numbers.slice(0, 7)}-${numbers.slice(7, 9)}.${numbers.slice(9, 13)}.${numbers.slice(13, 14)}.${numbers.slice(14)}`;
    return `${numbers.slice(0, 7)}-${numbers.slice(7, 9)}.${numbers.slice(9, 13)}.${numbers.slice(13, 14)}.${numbers.slice(14, 16)}.${numbers.slice(16)}`;
  };
  
  /**
   * Formata nome próprio (capitalização)
   */
  export const formatNameInput = (value: string): string => {
    // Remove números e caracteres especiais inválidos
    let cleaned = value.replace(/[^a-zA-ZÀ-ÿ\s\-'.]/g, '');
    
    // Limita o tamanho
    cleaned = cleaned.slice(0, 150);
    
    // Não permite múltiplos espaços
    cleaned = cleaned.replace(/\s+/g, ' ');
    
    return cleaned;
  };
  
  /**
   * Formata periodicidade (apenas números)
   */
  export const formatPeriodicidadeInput = (value: string): string => {
    const numbers = value.replace(/\D/g, '');
    const num = parseInt(numbers);
    
    if (isNaN(num)) return '';
    if (num > 365) return '365';
    if (num < 1 && numbers.length > 0) return '1';
    
    return numbers.slice(0, 3);
  };
  

  // MÁSCARAS DE INPUT

  
  export interface InputMask {
    format: (value: string) => string;
    maxLength: number;
    placeholder: string;
    keyValidator?: (event: React.KeyboardEvent) => boolean;
    pattern?: string;
    inputMode?: 'text' | 'numeric' | 'tel' | 'email' | 'url';
  }
  
  export const INPUT_MASKS: Record<string, InputMask> = {
    cpf: {
      format: formatCPFInput,
      maxLength: 14,
      placeholder: '000.000.000-00',
      keyValidator: isNumericKey,
      pattern: '[0-9]{3}\\.[0-9]{3}\\.[0-9]{3}-[0-9]{2}',
      inputMode: 'numeric'
    },
    rg: {
      format: formatRGInput,
      maxLength: 12,
      placeholder: '00.000.000-0',
      keyValidator: isNumericKey,
      pattern: '[0-9]{2}\\.[0-9]{3}\\.[0-9]{3}-[0-9]',
      inputMode: 'numeric'
    },
    telefone: {
      format: formatPhoneInput,
      maxLength: 15,
      placeholder: '(00) 00000-0000',
      keyValidator: isPhoneKey,
      pattern: '\\([0-9]{2}\\) [0-9]{4,5}-[0-9]{4}',
      inputMode: 'tel'
    },
    cep: {
      format: formatCEPInput,
      maxLength: 9,
      placeholder: '00000-000',
      keyValidator: isNumericKey,
      pattern: '[0-9]{5}-[0-9]{3}',
      inputMode: 'numeric'
    },
    processo: {
      format: formatProcessoInput,
      maxLength: 25,
      placeholder: '0000000-00.0000.0.00.0000',
      keyValidator: isNumericKey,
      pattern: '[0-9]{7}-[0-9]{2}\\.[0-9]{4}\\.[0-9]\\.[0-9]{2}\\.[0-9]{4}',
      inputMode: 'numeric'
    },
    nome: {
      format: formatNameInput,
      maxLength: 150,
      placeholder: 'Nome completo',
      keyValidator: isAlphabeticKey,
      inputMode: 'text'
    },
    numeroEndereco: {
      format: (v: string) => v.replace(/\D/g, '').slice(0, 6),
      maxLength: 6,
      placeholder: '123',
      keyValidator: isNumericKey,
      inputMode: 'numeric'
    },
    periodicidade: {
      format: formatPeriodicidadeInput,
      maxLength: 3,
      placeholder: '30',
      keyValidator: isNumericKey,
      pattern: '[0-9]{1,3}',
      inputMode: 'numeric'
    }
  };
  

  // VALIDADORES DE CONTEÚDO

  
  /**
   * Valida se o CPF é válido (com dígito verificador)
   */
  export const isValidCPF = (cpf: string): boolean => {
    const cleaned = cpf.replace(/\D/g, '');
    
    if (cleaned.length !== 11) return false;
    if (/^(\d)\1+$/.test(cleaned)) return false;
    
    // Validação do dígito verificador
    let sum = 0;
    let remainder;
    
    for (let i = 1; i <= 9; i++) {
      sum += parseInt(cleaned.substring(i - 1, i)) * (11 - i);
    }
    
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleaned.substring(9, 10))) return false;
    
    sum = 0;
    for (let i = 1; i <= 10; i++) {
      sum += parseInt(cleaned.substring(i - 1, i)) * (12 - i);
    }
    
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleaned.substring(10, 11))) return false;
    
    return true;
  };
  
  /**
   * Valida telefone (celular ou fixo)
   */
  export const isValidPhone = (phone: string): boolean => {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length === 10 || cleaned.length === 11;
  };
  
  /**
   * Valida CEP
   */
  export const isValidCEP = (cep: string): boolean => {
    const cleaned = cep.replace(/\D/g, '');
    return cleaned.length === 8 && !/^0+$/.test(cleaned);
  };
  

  // COMPONENTE DE INPUT MASCARADO

  
  export interface MaskedInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
    mask: keyof typeof INPUT_MASKS;
    value: string;
    onChange: (value: string) => void;
    error?: boolean;
    showCounter?: boolean;
  }
  
  /**
   * Hook para input mascarado
   */
  export const useMaskedInput = (mask: keyof typeof INPUT_MASKS) => {
    const maskConfig = INPUT_MASKS[mask];
  
    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (maskConfig.keyValidator && !maskConfig.keyValidator(event)) {
        event.preventDefault();
      }
    };
  
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const formatted = maskConfig.format(event.target.value);
      return formatted;
    };
  
    const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
      event.preventDefault();
      const pastedText = event.clipboardData.getData('text');
      const formatted = maskConfig.format(pastedText);
      return formatted;
    };
  
    return {
      maskConfig,
      handleKeyDown,
      handleChange,
      handlePaste
    };
  };