// FORMATAÇÃO E VALIDAÇÃO DE EMAIL

/**
 * Formatar email - remove espaços, converte para minúsculas e valida formato básico
 * @param email Email com ou sem formatação
 * @returns Email formatado em minúsculas e sem espaços
 */
export const formatEmail = (email: string): string => {
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

  // Remove ponto no início do domínio
  formatted = formatted.replace(/@\./, '@');

  return formatted;
};

/**
 * Validar email com regras rigorosas
 * @param email Email a ser validado
 * @returns true se o email é válido
 */
export const isValidEmail = (email: string): boolean => {
  if (!email) return false;

  // Formata o email antes de validar
  const formatted = formatEmail(email);

  // Verifica comprimento mínimo e máximo
  if (formatted.length < 5 || formatted.length > 254) return false;

  // Regex completa para validação de email segundo RFC 5322 (simplificada)
  // Esta regex valida:
  // - Local part: letras, números, pontos, hífens, underscores
  // - Deve ter exatamente um @
  // - Domain part: letras, números, pontos, hífens
  // - Deve ter pelo menos um ponto no domínio
  // - TLD deve ter 2-6 caracteres
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  if (!emailRegex.test(formatted)) return false;

  // Validações adicionais
  const [localPart, domainPart] = formatted.split('@');

  // Valida o local part (antes do @)
  if (localPart.length > 64) return false; // Limite RFC
  if (localPart.startsWith('.') || localPart.endsWith('.')) return false;
  if (localPart.includes('..')) return false;

  // Valida o domain part (depois do @)
  if (!domainPart || domainPart.length < 3) return false;
  if (domainPart.startsWith('-') || domainPart.endsWith('-')) return false;
  if (domainPart.startsWith('.') || domainPart.endsWith('.')) return false;
  if (domainPart.includes('..')) return false;

  // Verifica se tem pelo menos um ponto no domínio (para ter TLD)
  if (!domainPart.includes('.')) return false;

  // Valida TLD (top-level domain)
  const parts = domainPart.split('.');
  const tld = parts[parts.length - 1];
  if (tld.length < 2 || tld.length > 6) return false;
  if (!/^[a-zA-Z]+$/.test(tld)) return false;

  return true;
};

/**
 * Validar email institucional do TJBA
 * @param email Email a ser validado
 * @returns true se o email é do domínio @tjba.jus.br
 */
export const isValidEmailInstitucional = (email: string): boolean => {
  if (!isValidEmail(email)) return false;

  const formatted = formatEmail(email);
  return formatted.endsWith('@tjba.jus.br');
};

/**
 * Validar lista de emails
 * @param emails Array de emails ou string com emails separados por vírgula/ponto-vírgula
 * @returns Objeto com emails válidos, inválidos e total
 */
export const validateEmailList = (emails: string[] | string): {
  valid: string[];
  invalid: string[];
  total: number;
  allValid: boolean;
} => {
  // Converte string em array se necessário
  let emailList: string[] = [];
  
  if (typeof emails === 'string') {
    // Separa por vírgula, ponto-vírgula ou quebra de linha
    emailList = emails
      .split(/[,;\n]+/)
      .map(e => e.trim())
      .filter(e => e.length > 0);
  } else {
    emailList = emails.map(e => e.trim()).filter(e => e.length > 0);
  }

  const valid: string[] = [];
  const invalid: string[] = [];

  emailList.forEach(email => {
    if (isValidEmail(email)) {
      valid.push(formatEmail(email));
    } else {
      invalid.push(email);
    }
  });

  return {
    valid,
    invalid,
    total: emailList.length,
    allValid: invalid.length === 0
  };
};

/**
 * Extrair domínio do email
 * @param email Email completo
 * @returns Domínio do email ou string vazia
 */
export const getEmailDomain = (email: string): string => {
  if (!isValidEmail(email)) return '';

  const formatted = formatEmail(email);
  const atIndex = formatted.indexOf('@');
  
  if (atIndex === -1) return '';
  
  return formatted.substring(atIndex + 1);
};

/**
 * Extrair nome de usuário do email
 * @param email Email completo
 * @returns Nome de usuário (parte antes do @) ou string vazia
 */
export const getEmailUsername = (email: string): string => {
  if (!isValidEmail(email)) return '';

  const formatted = formatEmail(email);
  const atIndex = formatted.indexOf('@');
  
  if (atIndex === -1) return '';
  
  return formatted.substring(0, atIndex);
};

/**
 * Ofuscar email para exibição pública
 * @param email Email a ser ofuscado
 * @param visibleChars Número de caracteres visíveis no início
 * @returns Email ofuscado (ex: jo****@tjba.jus.br)
 */
export const obfuscateEmail = (email: string, visibleChars: number = 2): string => {
  if (!isValidEmail(email)) return '';

  const formatted = formatEmail(email);
  const [localPart, domainPart] = formatted.split('@');

  if (localPart.length <= visibleChars) {
    return `${localPart}@${domainPart}`;
  }

  const visible = localPart.substring(0, visibleChars);
  const hiddenCount = Math.min(localPart.length - visibleChars, 4);
  const hidden = '*'.repeat(hiddenCount);

  return `${visible}${hidden}@${domainPart}`;
};

/**
 * Sugerir correções para emails com erros comuns
 * @param email Email com possível erro de digitação
 * @returns Array de sugestões de correção
 */
export const suggestEmailCorrections = (email: string): string[] => {
  if (!email || isValidEmail(email)) return [];

  const suggestions: string[] = [];
  const formatted = formatEmail(email);

  // Domínios comuns com erros de digitação
  const commonDomains = {
    'gmail.com': ['gmai.com', 'gmial.com', 'gmail.co', 'gmail.cm'],
    'hotmail.com': ['hotmai.com', 'hotmial.com', 'hotmail.co'],
    'yahoo.com': ['yaho.com', 'yahoo.co', 'yahooo.com'],
    'outlook.com': ['outlok.com', 'outlook.co', 'outloo.com'],
    'tjba.jus.br': ['tjba.gov.br', 'tjba.com.br', 'tjba.jus.com']
  };

  // Verifica se o email tem estrutura básica (algo@algo)
  if (formatted.includes('@')) {
    const [localPart, domainPart] = formatted.split('@');

    // Procura por domínios similares
    for (const [correct, wrongs] of Object.entries(commonDomains)) {
      if (wrongs.includes(domainPart)) {
        suggestions.push(`${localPart}@${correct}`);
      }
    }

    // Verifica domínios com duplo ponto
    if (domainPart.includes('..')) {
      suggestions.push(`${localPart}@${domainPart.replace(/\.+/g, '.')}`);
    }

    // Verifica falta de TLD
    if (!domainPart.includes('.')) {
      // Sugere domínios comuns
      if (domainPart === 'gmail') suggestions.push(`${localPart}@gmail.com`);
      if (domainPart === 'hotmail') suggestions.push(`${localPart}@hotmail.com`);
      if (domainPart === 'outlook') suggestions.push(`${localPart}@outlook.com`);
      if (domainPart === 'tjba') suggestions.push(`${localPart}@tjba.jus.br`);
    }
  } else {
    // Se não tem @, tenta adicionar domínios comuns
    if (formatted.endsWith('gmail')) suggestions.push(`${formatted}@gmail.com`);
    if (formatted.endsWith('hotmail')) suggestions.push(`${formatted}@hotmail.com`);
    if (formatted.endsWith('tjba')) suggestions.push(`${formatted}@tjba.jus.br`);
  }

  // Remove duplicatas e retorna apenas emails válidos
  return [...new Set(suggestions)].filter(s => isValidEmail(s));
};
