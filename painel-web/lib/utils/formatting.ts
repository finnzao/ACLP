
// Formatação de documentos
export function formatCPF(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  return digits
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d{1,2})$/, '$1.$2.$3-$4');
}

export function formatRG(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 9);
  return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d?)$/, (match, p1, p2, p3, p4) =>
    p4 ? `${p1}.${p2}.${p3}-${p4}` : `${p1}.${p2}.${p3}`
  );
}

export function formatProcesso(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 20);
  return digits.replace(/^(\d{7})(\d{2})(\d{4})(\d{1})(\d{2})(\d{4})$/, '$1-$2.$3.$4.$5.$6');
}

/**
 * Formata número de telefone com máscara (##) #####-####
 */
export function formatContato(telefone: string): string {
  const clean = telefone.replace(/\D/g, '');
  if (clean.length <= 2) return clean;
  if (clean.length <= 7) return clean.replace(/^(\d{2})(\d+)/, '($1) $2');
  return clean.replace(/^(\d{2})(\d{5})(\d+)/, '($1) $2-$3');
}


/**
 * Formata CEP com máscara #####-###
 */
export function formatCEP(cep: string): string {
  const clean = cep.replace(/\D/g, '');
  if (clean.length <= 5) return clean;
  return clean.replace(/^(\d{5})(\d{0,3}).*/, '$1-$2');
}

// Remover formatação
export function unformat(value: string): string {
  return value.replace(/\D/g, '');
}

// Validação de email
export function isValidEmail(email: string): boolean {
  const regex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;
  return regex.test(email);
}

export function formatEmail(value: string): string {
  return value.trim().toLowerCase();
}

// Utilitários de validação aprimorados
export const validationUtils = {
  isValidCPF: (cpf: string): boolean => {
    const cleaned = cpf.replace(/\D/g, '');
    if (cleaned.length !== 11) return false;

    // Verificar se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cleaned)) return false;

    // Validar primeiro dígito verificador
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleaned.charAt(i)) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleaned.charAt(9))) return false;

    // Validar segundo dígito verificador
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleaned.charAt(i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    return remainder === parseInt(cleaned.charAt(10));
  },

  isValidRG: (rg: string): boolean => {
    const cleaned = rg.replace(/\D/g, '');
    return cleaned.length >= 7 && cleaned.length <= 9;
  },

  isValidEmail: (email: string): boolean => {
    const regex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;
    return regex.test(email);
  },

  isValidPhone: (phone: string): boolean => {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 10 && cleaned.length <= 11;
  },

  isValidProcess: (process: string): boolean => {
    const cleaned = process.replace(/\D/g, '');
    return cleaned.length === 20;
  },

  isValidCEP: (cep: string): boolean => {
    const cleaned = cep.replace(/\D/g, '');
    return cleaned.length === 8;
  },

  isValidName: (name: string): boolean => {
    const trimmed = name.trim();
    return trimmed.length >= 2 && /^[a-zA-ZÀ-ÿ\s]+$/.test(trimmed);
  },

  isValidDays: (days: number): boolean => {
    return Number.isInteger(days) && days >= 1 && days <= 365;
  }
};

// Formatação de nomes
export function formatName(name: string): string {
  return name
    .toLowerCase()
    .split(' ')
    .map(word => {
      // Palavras que devem permanecer em minúsculas
      const prepositions = ['de', 'da', 'do', 'das', 'dos', 'e'];
      if (prepositions.includes(word)) {
        return word;
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

// Formatação de números
export function formatNumber(value: string, maxLength?: number): string {
  const digits = value.replace(/\D/g, '');
  return maxLength ? digits.slice(0, maxLength) : digits;
}

// Validação de período personalizado
export function validateCustomPeriod(days: string | number): { valid: boolean; error?: string } {
  const numDays = typeof days === 'string' ? parseInt(days) : days;

  if (isNaN(numDays)) {
    return { valid: false, error: 'Período deve ser um número válido' };
  }

  if (numDays < 1) {
    return { valid: false, error: 'Período deve ser maior que zero' };
  }

  if (numDays > 365) {
    return { valid: false, error: 'Período não pode ser maior que 365 dias' };
  }

  return { valid: true };
}

// Formatação de endereço completo
export function formatFullAddress(endereco: {
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
}): string {
  const parts: string[] = [];

  if (endereco.logradouro) {
    let address = endereco.logradouro;
    if (endereco.numero) address += `, ${endereco.numero}`;
    if (endereco.complemento) address += `, ${endereco.complemento}`;
    parts.push(address);
  }

  if (endereco.bairro) parts.push(endereco.bairro);
  if (endereco.cidade && endereco.estado) {
    parts.push(`${endereco.cidade} - ${endereco.estado}`);
  } else if (endereco.cidade) {
    parts.push(endereco.cidade);
  }

  if (endereco.cep) parts.push(`CEP: ${endereco.cep}`);

  return parts.join(', ');
}

// Utilitário para limpar e validar entrada de texto
export function sanitizeInput(input: string, options: {
  allowNumbers?: boolean;
  allowSpecialChars?: boolean;
  maxLength?: number;
} = {}): string {
  let sanitized = input.trim();

  if (!options.allowNumbers) {
    sanitized = sanitized.replace(/\d/g, '');
  }

  if (!options.allowSpecialChars) {
    sanitized = sanitized.replace(/[^a-zA-ZÀ-ÿ\s]/g, '');
  }

  if (options.maxLength) {
    sanitized = sanitized.slice(0, options.maxLength);
  }

  return sanitized;
}



/**
 * Trunca texto para o tamanho máximo especificado, adicionando reticências
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Formata data em formato ISO para o formato brasileiro (DD/MM/YYYY)
 */
export function formatDateToBR(date: string | Date): string {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('pt-BR');
}
// Formatação para exibição em tabelas
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function formatForDisplay(value: any, type: 'cpf' | 'phone' | 'date' | 'text' = 'text'): string {
  if (!value) return '-';

  switch (type) {
    case 'cpf':
      return formatCPF(value);
    case 'phone':
      return formatContato(value);
    case 'date':
      return new Date(value).toLocaleDateString('pt-BR');
    default:
      return String(value);
  }


}
