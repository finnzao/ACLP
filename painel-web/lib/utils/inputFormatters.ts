import { ValidationNumericKey, ValidationAlphabeticKey, ValidationPhoneKey } from './validation';

export const InputFormatCPF = (value: string): string => {
  const numbers = value.replace(/\D/g, '').slice(0, 11);
  
  if (numbers.length <= 3) return numbers;
  if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
  if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
  return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9)}`;
};

export const InputFormatRG = (value: string): string => {
  const numbers = value.replace(/\D/g, '').slice(0, 9);
  
  if (numbers.length <= 2) return numbers;
  if (numbers.length <= 5) return `${numbers.slice(0, 2)}.${numbers.slice(2)}`;
  if (numbers.length <= 8) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5)}`;
  return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}-${numbers.slice(8)}`;
};

export const InputFormatPhone = (value: string): string => {
  const numbers = value.replace(/\D/g, '').slice(0, 11);
  
  if (numbers.length === 0) return '';
  if (numbers.length <= 2) return `(${numbers}`;
  if (numbers.length <= 6) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  if (numbers.length <= 10) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
  }
  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
};

export const InputFormatCEP = (value: string): string => {
  const numbers = value.replace(/\D/g, '').slice(0, 8);
  
  if (numbers.length <= 5) return numbers;
  return `${numbers.slice(0, 5)}-${numbers.slice(5)}`;
};

export const InputFormatProcessNumber = (value: string): string => {
  const numbers = value.replace(/\D/g, '').slice(0, 20);
  
  if (numbers.length <= 7) return numbers;
  if (numbers.length <= 9) return `${numbers.slice(0, 7)}-${numbers.slice(7)}`;
  if (numbers.length <= 13) return `${numbers.slice(0, 7)}-${numbers.slice(7, 9)}.${numbers.slice(9)}`;
  if (numbers.length <= 14) return `${numbers.slice(0, 7)}-${numbers.slice(7, 9)}.${numbers.slice(9, 13)}.${numbers.slice(13)}`;
  if (numbers.length <= 16) return `${numbers.slice(0, 7)}-${numbers.slice(7, 9)}.${numbers.slice(9, 13)}.${numbers.slice(13, 14)}.${numbers.slice(14)}`;
  return `${numbers.slice(0, 7)}-${numbers.slice(7, 9)}.${numbers.slice(9, 13)}.${numbers.slice(13, 14)}.${numbers.slice(14, 16)}.${numbers.slice(16)}`;
};

export const InputFormatName = (value: string): string => {
  let cleaned = value.replace(/[^a-zA-ZÀ-ÿ\s\-'.]/g, '');
  
  cleaned = cleaned.slice(0, 150);
  
  cleaned = cleaned.replace(/\s+/g, ' ');
  
  return cleaned;
};

export const InputFormatPeriodicidade = (value: string): string => {
  const numbers = value.replace(/\D/g, '');
  const num = parseInt(numbers);
  
  if (isNaN(num)) return '';
  if (num > 365) return '365';
  if (num < 1 && numbers.length > 0) return '1';
  
  return numbers.slice(0, 3);
};

export const InputFormatAddressNumber = (value: string): string => {
  return value.replace(/\D/g, '').slice(0, 6);
};

export const InputFormatEmail = (value: string): string => {
  return value.trim().toLowerCase().replace(/\s+/g, '');
};

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
    format: InputFormatCPF,
    maxLength: 14,
    placeholder: '000.000.000-00',
    keyValidator: ValidationNumericKey,
    pattern: '[0-9]{3}\\.[0-9]{3}\\.[0-9]{3}-[0-9]{2}',
    inputMode: 'numeric'
  },
  rg: {
    format: InputFormatRG,
    maxLength: 12,
    placeholder: '00.000.000-0',
    keyValidator: ValidationNumericKey,
    pattern: '[0-9]{2}\\.[0-9]{3}\\.[0-9]{3}-[0-9]',
    inputMode: 'numeric'
  },
  telefone: {
    format: InputFormatPhone,
    maxLength: 15,
    placeholder: '(00) 00000-0000',
    keyValidator: ValidationPhoneKey,
    pattern: '\\([0-9]{2}\\) [0-9]{4,5}-[0-9]{4}',
    inputMode: 'tel'
  },
  cep: {
    format: InputFormatCEP,
    maxLength: 9,
    placeholder: '00000-000',
    keyValidator: ValidationNumericKey,
    pattern: '[0-9]{5}-[0-9]{3}',
    inputMode: 'numeric'
  },
  processo: {
    format: InputFormatProcessNumber,
    maxLength: 25,
    placeholder: '0000000-00.0000.0.00.0000',
    keyValidator: ValidationNumericKey,
    pattern: '[0-9]{7}-[0-9]{2}\\.[0-9]{4}\\.[0-9]\\.[0-9]{2}\\.[0-9]{4}',
    inputMode: 'numeric'
  },
  nome: {
    format: InputFormatName,
    maxLength: 150,
    placeholder: 'Nome completo',
    keyValidator: ValidationAlphabeticKey,
    inputMode: 'text'
  },
  numeroEndereco: {
    format: InputFormatAddressNumber,
    maxLength: 6,
    placeholder: '123',
    keyValidator: ValidationNumericKey,
    inputMode: 'numeric'
  },
  periodicidade: {
    format: InputFormatPeriodicidade,
    maxLength: 3,
    placeholder: '30',
    keyValidator: ValidationNumericKey,
    pattern: '[0-9]{1,3}',
    inputMode: 'numeric'
  },
  email: {
    format: InputFormatEmail,
    maxLength: 254,
    placeholder: 'email@exemplo.com',
    inputMode: 'email'
  }
};

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

export interface MaskedInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  mask: keyof typeof INPUT_MASKS;
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
  showCounter?: boolean;
}