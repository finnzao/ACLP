export const FormattingEmailClean = (email: string): string => {
  if (!email) return '';

  let formatted = email.trim();
  formatted = formatted.toLowerCase();
  formatted = formatted.replace(/\s+/g, '');
  formatted = formatted.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');

  const atCount = (formatted.match(/@/g) || []).length;
  if (atCount > 1) {
    const parts = formatted.split('@');
    formatted = parts[0] + '@' + parts.slice(1).join('');
  }

  formatted = formatted.replace(/\.{2,}/g, '.');

  const atIndex = formatted.indexOf('@');
  if (atIndex > 0) {
    let localPart = formatted.substring(0, atIndex);
    const domainPart = formatted.substring(atIndex);
    localPart = localPart.replace(/^\.+|\.+$/g, '');
    formatted = localPart + domainPart;
  }

  formatted = formatted.replace(/@\./, '@');

  return formatted;
};

export const FormattingEmailObfuscate = (email: string, visibleChars: number = 2): string => {
  if (!email) return '';

  const formatted = FormattingEmailClean(email);
  const [localPart, domainPart] = formatted.split('@');

  if (!domainPart) return formatted;

  if (localPart.length <= visibleChars) {
    return `${localPart}@${domainPart}`;
  }

  const visible = localPart.substring(0, visibleChars);
  const hiddenCount = Math.min(localPart.length - visibleChars, 4);
  const hidden = '*'.repeat(hiddenCount);

  return `${visible}${hidden}@${domainPart}`;
};

export const FormattingEmailGetDomain = (email: string): string => {
  if (!email) return '';

  const formatted = FormattingEmailClean(email);
  const atIndex = formatted.indexOf('@');
  
  if (atIndex === -1) return '';
  
  return formatted.substring(atIndex + 1);
};

export const FormattingEmailGetUsername = (email: string): string => {
  if (!email) return '';

  const formatted = FormattingEmailClean(email);
  const atIndex = formatted.indexOf('@');
  
  if (atIndex === -1) return '';
  
  return formatted.substring(0, atIndex);
};

export const FormattingEmailSuggestCorrections = (email: string): string[] => {
  if (!email) return [];

  const suggestions: string[] = [];
  const formatted = FormattingEmailClean(email);

  const commonDomains = {
    'gmail.com': ['gmai.com', 'gmial.com', 'gmail.co', 'gmail.cm'],
    'hotmail.com': ['hotmai.com', 'hotmial.com', 'hotmail.co'],
    'yahoo.com': ['yaho.com', 'yahoo.co', 'yahooo.com'],
    'outlook.com': ['outlok.com', 'outlook.co', 'outloo.com'],
    'tjba.jus.br': ['tjba.gov.br', 'tjba.com.br', 'tjba.jus.com']
  };

  if (formatted.includes('@')) {
    const [localPart, domainPart] = formatted.split('@');

    for (const [correct, wrongs] of Object.entries(commonDomains)) {
      if (wrongs.includes(domainPart)) {
        suggestions.push(`${localPart}@${correct}`);
      }
    }

    if (domainPart.includes('..')) {
      suggestions.push(`${localPart}@${domainPart.replace(/\.+/g, '.')}`);
    }

    if (!domainPart.includes('.')) {
      if (domainPart === 'gmail') suggestions.push(`${localPart}@gmail.com`);
      if (domainPart === 'hotmail') suggestions.push(`${localPart}@hotmail.com`);
      if (domainPart === 'outlook') suggestions.push(`${localPart}@outlook.com`);
      if (domainPart === 'tjba') suggestions.push(`${localPart}@tjba.jus.br`);
    }
  } else {
    if (formatted.endsWith('gmail')) suggestions.push(`${formatted}@gmail.com`);
    if (formatted.endsWith('hotmail')) suggestions.push(`${formatted}@hotmail.com`);
    if (formatted.endsWith('tjba')) suggestions.push(`${formatted}@tjba.jus.br`);
  }

  return [...new Set(suggestions)];
};

export const FormattingCPF = (cpf: string): string => {
  if (!cpf) return '';
  
  const clean = cpf.replace(/\D/g, '');
  
  if (clean.length !== 11) return cpf;
  
  return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

export const FormattingCPFRemove = (cpf: string): string => {
  return cpf.replace(/\D/g, '');
};

export const FormattingRG = (rg: string): string => {
  if (!rg) return '';
  
  const clean = rg.replace(/\D/g, '');
  
  if (clean.length !== 9) return rg;
  
  return clean.replace(/(\d{2})(\d{3})(\d{3})(\d{1})/, '$1.$2.$3-$4');
};

export const FormattingPhone = (phone: string): string => {
  if (!phone) return '';
  
  const clean = phone.replace(/\D/g, '');
  
  if (clean.length === 10) {
    return clean.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  } else if (clean.length === 11) {
    return clean.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  
  return phone;
};

export const FormattingPhoneRemove = (phone: string): string => {
  return phone.replace(/\D/g, '');
};

export const FormattingCEP = (cep: string): string => {
  if (!cep) return '';
  
  const clean = cep.replace(/\D/g, '');
  
  if (clean.length !== 8) return cep;
  
  return clean.replace(/(\d{5})(\d{3})/, '$1-$2');
};

export const FormattingCEPRemove = (cep: string): string => {
  return cep.replace(/\D/g, '');
};

export const FormattingProcessNumber = (process: string): string => {
  if (!process) return '';
  
  const clean = process.replace(/\D/g, '');
  
  if (clean.length !== 20) return process;
  
  return clean.replace(
    /(\d{7})(\d{2})(\d{4})(\d{1})(\d{2})(\d{4})/,
    '$1-$2.$3.$4.$5.$6'
  );
};

export const FormattingProcessNumberRemove = (process: string): string => {
  return process.replace(/\D/g, '');
};

export const FormattingName = (name: string): string => {
  if (!name) return '';

  let cleaned = name.replace(/[^a-zA-ZÀ-ÿ\s\-'.]/g, '');
  
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  return cleaned
    .split(' ')
    .map(word => {
      if (word.length === 0) return '';
      
      const lowercase = ['de', 'da', 'do', 'das', 'dos', 'e'];
      if (lowercase.includes(word.toLowerCase())) {
        return word.toLowerCase();
      }
      
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
};

export const FormattingDateBR = (date: Date | string): string => {
  if (!date) return '';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(d.getTime())) return '';
  
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  
  return `${day}/${month}/${year}`;
};

export const FormattingDateTimeBR = (date: Date | string): string => {
  if (!date) return '';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(d.getTime())) return '';
  
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

export const FormattingCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

export const FormattingNumber = (value: number): string => {
  return new Intl.NumberFormat('pt-BR').format(value);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const FormattingSanitizeComparecimento = (data: any): any => {
  return {
    ...data,
    nome: data.nome?.trim(),
    cpf: data.cpf?.replace(/\D/g, '') || '',
    rg: data.rg?.trim() || '',
    contato: data.contato?.replace(/\D/g, '') || '',
    processo: data.processo?.replace(/\D/g, '') || '',
    vara: data.vara?.trim(),
    comarca: data.comarca?.trim(),
    observacoes: data.observacoes?.trim() || '',
    endereco: {
      ...data.endereco,
      cep: data.endereco?.cep?.replace(/\D/g, '') || '',
      logradouro: data.endereco?.logradouro?.trim() || '',
      numero: data.endereco?.numero?.trim() || '',
      complemento: data.endereco?.complemento?.trim() || '',
      bairro: data.endereco?.bairro?.trim() || '',
      cidade: data.endereco?.cidade?.trim() || '',
      estado: data.endereco?.estado?.trim().toUpperCase() || ''
    }
  };
};



/**
 * Garante que a data seja enviada APENAS no formato YYYY-MM-DD
 * Remove qualquer informação de hora, timezone ou timestamp
 * 
 * @param dataInput - Data em qualquer formato (string, Date, ISO)
 * @returns String no formato YYYY-MM-DD
 */
export const normalizarDataParaEnvio = (dataInput: string | Date): string => {
  // Se for string no formato correto, retornar direto
  if (typeof dataInput === 'string' && dataInput.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return dataInput;
  }

  // Se for string com hora/timezone, limpar
  if (typeof dataInput === 'string') {
    return dataInput.split('T')[0].split(' ')[0];
  }

  // Se for Date object, extrair apenas YYYY-MM-DD
  if (dataInput instanceof Date) {
    const year = dataInput.getFullYear();
    const month = String(dataInput.getMonth() + 1).padStart(2, '0');
    const day = String(dataInput.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Fallback: retornar data atual
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};