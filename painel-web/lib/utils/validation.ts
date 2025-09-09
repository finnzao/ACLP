// lib/utils/validation.ts
import { ComparecimentoFormData, FormValidation } from '@/types/comparecimento';

// Função para validar CPF (deve corresponder ao padrão do Java)
export function isValidCPF(cpf: string): boolean {
  if (!cpf) return true; // CPF é opcional
  
  // Padrão do Java: \\d{3}\\.?\\d{3}\\.?\\d{3}-?\\d{2}
  const cpfRegex = /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/;
  if (!cpfRegex.test(cpf)) return false;
  
  // Remove caracteres especiais para validação dos dígitos
  const cleanCPF = cpf.replace(/[^\d]/g, '');
  
  // Verifica se tem 11 dígitos
  if (cleanCPF.length !== 11) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
  
  // Validação dos dígitos verificadores
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  
  let checkDigit = 11 - (sum % 11);
  if (checkDigit === 10 || checkDigit === 11) checkDigit = 0;
  if (checkDigit !== parseInt(cleanCPF.charAt(9))) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  
  checkDigit = 11 - (sum % 11);
  if (checkDigit === 10 || checkDigit === 11) checkDigit = 0;
  if (checkDigit !== parseInt(cleanCPF.charAt(10))) return false;
  
  return true;
}

// Função para validar telefone brasileiro (padrão do Java)
export function isValidPhone(phone: string): boolean {
  if (!phone) return false;
  
  // Padrão do Java: \\(?\\d{2}\\)?\\s?\\d{4,5}-?\\d{4}
  const phoneRegex = /^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/;
  return phoneRegex.test(phone);
}

// Função para validar número de processo judicial (padrão do Java)
export function isValidProcessNumber(process: string): boolean {
  if (!process) return false;
  
  // Padrão do Java: \\d{7}-\\d{2}\\.\\d{4}\\.\\d{1}\\.\\d{2}\\.\\d{4}
  const processRegex = /^\d{7}-\d{2}\.\d{4}\.\d{1}\.\d{2}\.\d{4}$/;
  return processRegex.test(process);
}

// Função para validar CEP (padrão do Java)
export function isValidCEP(cep: string): boolean {
  if (!cep) return false;
  
  // Padrão do Java: \\d{5}-?\\d{3}
  const cepRegex = /^\d{5}-?\d{3}$/;
  return cepRegex.test(cep);
}

// Função para validar estado (padrão do Java)
export function isValidEstado(estado: string): boolean {
  if (!estado) return false;
  
  // Padrão do Java: [A-Z]{2}
  const estadoRegex = /^[A-Z]{2}$/;
  return estadoRegex.test(estado);
}

// Função principal de validação do formulário baseada nas validações do Java
export function validatePessoaDTO(data: any): FormValidation {
  const errors: Record<string, string> = {};
  const warnings: Record<string, string> = {};

  // Validação do nome
  if (!data.nome?.trim()) {
    errors.nome = 'Nome é obrigatório';
  } else if (data.nome.trim().length < 2 || data.nome.trim().length > 150) {
    errors.nome = 'Nome deve ter entre 2 e 150 caracteres';
  }

  // Validação do CPF (opcional, mas se fornecido deve ser válido)
  if (data.cpf?.trim() && !isValidCPF(data.cpf)) {
    errors.cpf = 'CPF deve ter o formato 000.000.000-00';
  }

  // Validação do RG (opcional)
  if (data.rg?.trim() && data.rg.trim().length > 20) {
    errors.rg = 'RG deve ter no máximo 20 caracteres';
  }

  // Validação do contato
  if (!data.contato?.trim()) {
    errors.contato = 'Contato é obrigatório';
  } else if (!isValidPhone(data.contato)) {
    errors.contato = 'Contato deve ter formato válido de telefone';
  }

  // Validação do processo
  if (!data.processo?.trim()) {
    errors.processo = 'Processo é obrigatório';
  } else if (!isValidProcessNumber(data.processo)) {
    errors.processo = 'Processo deve ter o formato 0000000-00.0000.0.00.0000';
  }

  // Validação da vara
  if (!data.vara?.trim()) {
    errors.vara = 'Vara é obrigatória';
  } else if (data.vara.trim().length > 100) {
    errors.vara = 'Vara deve ter no máximo 100 caracteres';
  }

  // Validação da comarca
  if (!data.comarca?.trim()) {
    errors.comarca = 'Comarca é obrigatória';
  } else if (data.comarca.trim().length > 100) {
    errors.comarca = 'Comarca deve ter no máximo 100 caracteres';
  }

  // Validação da data da decisão
  if (!data.dataDecisao) {
    errors.dataDecisao = 'Data da decisão é obrigatória';
  }

  // Validação da periodicidade
  if (!data.periodicidade || data.periodicidade < 1) {
    errors.periodicidade = 'Periodicidade é obrigatória';
  }

  // Validação da data do comparecimento inicial
  if (!data.dataComparecimentoInicial) {
    errors.dataComparecimentoInicial = 'Data do comparecimento inicial é obrigatória';
  }

  // Validação das observações
  if (data.observacoes?.trim() && data.observacoes.trim().length > 500) {
    errors.observacoes = 'Observações deve ter no máximo 500 caracteres';
  }

  // === VALIDAÇÕES DE ENDEREÇO - OBRIGATÓRIAS ===

  // Validação do CEP
  if (!data.cep?.trim()) {
    errors.cep = 'CEP é obrigatório';
  } else if (!isValidCEP(data.cep)) {
    errors.cep = 'CEP deve ter o formato 00000-000';
  }

  // Validação do logradouro
  if (!data.logradouro?.trim()) {
    errors.logradouro = 'Logradouro é obrigatório';
  } else if (data.logradouro.trim().length < 5 || data.logradouro.trim().length > 200) {
    errors.logradouro = 'Logradouro deve ter entre 5 e 200 caracteres';
  }

  // Validação do número (opcional)
  if (data.numero?.trim() && data.numero.trim().length > 20) {
    errors.numero = 'Número deve ter no máximo 20 caracteres';
  }

  // Validação do complemento (opcional)
  if (data.complemento?.trim() && data.complemento.trim().length > 100) {
    errors.complemento = 'Complemento deve ter no máximo 100 caracteres';
  }

  // Validação do bairro
  if (!data.bairro?.trim()) {
    errors.bairro = 'Bairro é obrigatório';
  } else if (data.bairro.trim().length < 2 || data.bairro.trim().length > 100) {
    errors.bairro = 'Bairro deve ter entre 2 e 100 caracteres';
  }

  // Validação da cidade
  if (!data.cidade?.trim()) {
    errors.cidade = 'Cidade é obrigatória';
  } else if (data.cidade.trim().length < 2 || data.cidade.trim().length > 100) {
    errors.cidade = 'Cidade deve ter entre 2 e 100 caracteres';
  }

  // Validação do estado
  if (!data.estado?.trim()) {
    errors.estado = 'Estado é obrigatório';
  } else if (!isValidEstado(data.estado)) {
    errors.estado = 'Estado deve ser uma sigla válida com 2 letras maiúsculas';
  }

  // Validação de documentos - pelo menos um deve estar presente
  const hasCpf = data.cpf?.trim();
  const hasRg = data.rg?.trim();
  
  if (!hasCpf && !hasRg) {
    errors.documentos = 'Pelo menos CPF ou RG deve ser informado';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    warnings
  };
}

// Função para sanitizar dados antes do envio
export function sanitizeComparecimentoData(data: ComparecimentoFormData): ComparecimentoFormData {
  return {
    ...data,
    nome: data.nome?.trim(),
    cpf: data.cpf?.replace(/[^\d]/g, '') || '',
    rg: data.rg?.trim() || '',
    contato: data.contato?.replace(/[^\d]/g, '') || '',
    processo: data.processo?.replace(/[^\d]/g, '') || '',
    vara: data.vara?.trim(),
    comarca: data.comarca?.trim(),
    observacoes: data.observacoes?.trim() || '',
    endereco: {
      ...data.endereco,
      cep: data.endereco.cep?.replace(/[^\d]/g, '') || '',
      logradouro: data.endereco.logradouro?.trim() || '',
      numero: data.endereco.numero?.trim() || '',
      complemento: data.endereco.complemento?.trim() || '',
      bairro: data.endereco.bairro?.trim() || '',
      cidade: data.endereco.cidade?.trim() || '',
      estado: data.endereco.estado?.trim() || ''
    }
  };
}

// Função para validar documentos separadamente
export function validateDocuments(cpf?: string, rg?: string): { isValid: boolean; error?: string } {
  const hasCpf = cpf?.trim();
  const hasRg = rg?.trim();

  if (!hasCpf && !hasRg) {
    return {
      isValid: false,
      error: 'Pelo menos CPF ou RG deve ser informado'
    };
  }

  if (hasCpf && !isValidCPF(cpf!)) {
    return {
      isValid: false,
      error: 'CPF inválido'
    };
  }

  return { isValid: true };
}

// Função para formatar CPF
export function formatCPF(cpf: string): string {
  const clean = cpf.replace(/[^\d]/g, '');
  return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

// Função para formatar telefone
export function formatPhone(phone: string): string {
  const clean = phone.replace(/[^\d]/g, '');
  
  if (clean.length === 10) {
    return clean.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  } else if (clean.length === 11) {
    return clean.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  
  return phone;
}

// Função para formatar CEP
export function formatCEP(cep: string): string {
  const clean = cep.replace(/[^\d]/g, '');
  return clean.replace(/(\d{5})(\d{3})/, '$1-$2');
}

// Função para formatar número do processo
export function formatProcessNumber(process: string): string {
  const clean = process.replace(/[^\d]/g, '');
  
  if (clean.length === 20) {
    return clean.replace(
      /(\d{7})(\d{2})(\d{4})(\d{1})(\d{2})(\d{4})/,
      '$1-$2.$3.$4.$5.$6'
    );
  }
  
  return process;
}