import { ComparecimentoFormData, NovoComparecimento, FormValidation } from '@/types/comparecimento';
import { validationUtils } from '@/lib/utils/formatting';

/**
 * Valida se pelo menos um documento (CPF ou RG) foi fornecido
 */
export function validateDocuments(cpf?: string, rg?: string): { isValid: boolean; error?: string } {
  const hasCpf = cpf?.trim();
  const hasRg = rg?.trim();
  
  if (!hasCpf && !hasRg) {
    return {
      isValid: false,
      error: 'Pelo menos CPF ou RG deve ser informado'
    };
  }
  
  // Validar formato do CPF se fornecido
  if (hasCpf && !validationUtils.isValidCPF(hasCpf)) {
    return {
      isValid: false,
      error: 'CPF informado é inválido'
    };
  }
  
  // Validar formato do RG se fornecido
  if (hasRg && !validationUtils.isValidRG(hasRg)) {
    return {
      isValid: false,
      error: 'RG informado é inválido'
    };
  }
  
  return { isValid: true };
}

/**
 * Type guard para verificar se os dados têm documentos válidos
 */
export function hasRequiredDocuments(data: ComparecimentoFormData): data is NovoComparecimento {
  const validation = validateDocuments(data.cpf, data.rg);
  return validation.isValid;
}

/**
 * Valida todos os campos obrigatórios do formulário de comparecimento
 */
export function validateComparecimentoForm(data: ComparecimentoFormData): FormValidation {
  const errors: Record<string, string> = {};
  const warnings: Record<string, string> = {};

  // Validar nome
  if (!data.nome?.trim()) {
    errors.nome = 'Nome é obrigatório';
  } else if (data.nome.trim().length < 2) {
    errors.nome = 'Nome deve ter pelo menos 2 caracteres';
  }

  // Validar documentos (CPF ou RG)
  const docValidation = validateDocuments(data.cpf, data.rg);
  if (!docValidation.isValid) {
    errors.documentos = docValidation.error!;
  }

  // Validar contato
  if (!data.contato?.trim()) {
    errors.contato = 'Contato é obrigatório';
  } else if (!validationUtils.isValidPhone(data.contato)) {
    warnings.contato = 'Formato de telefone pode estar incorreto';
  }

  // Validar processo
  if (!data.processo?.trim()) {
    errors.processo = 'Número do processo é obrigatório';
  } else if (!validationUtils.isValidProcess(data.processo)) {
    errors.processo = 'Número do processo deve ter 20 dígitos';
  }

  // Validar vara
  if (!data.vara?.trim()) {
    errors.vara = 'Vara é obrigatória';
  }

  // Validar comarca
  if (!data.comarca?.trim()) {
    errors.comarca = 'Comarca é obrigatória';
  }

  // Validar data da decisão
  if (!data.decisao) {
    errors.decisao = 'Data da decisão é obrigatória';
  } else {
    const dataDecisao = new Date(data.decisao);
    const hoje = new Date();
    if (dataDecisao > hoje) {
      errors.decisao = 'Data da decisão não pode ser futura';
    }
  }

  // Validar data do comparecimento inicial
  if (!data.dataComparecimentoInicial) {
    errors.dataComparecimentoInicial = 'Data do primeiro comparecimento é obrigatória';
  } else {
    const dataComparecimento = new Date(data.dataComparecimentoInicial);
    const dataDecisao = new Date(data.decisao);
    if (dataComparecimento < dataDecisao) {
      warnings.dataComparecimentoInicial = 'Data do comparecimento é anterior à data da decisão';
    }
  }

  // Validar periodicidade
  if (!data.periodicidade || data.periodicidade < 1) {
    errors.periodicidade = 'Periodicidade deve ser maior que zero';
  } else if (data.periodicidade > 365) {
    errors.periodicidade = 'Periodicidade não pode ser maior que 365 dias';
  }

  // Validar endereço
  const enderecoErrors = validateEndereco(data.endereco);
  Object.assign(errors, enderecoErrors);

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    warnings
  };
}

/**
 * Valida campos obrigatórios do endereço
 */
export function validateEndereco(endereco: any): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!endereco?.cep?.trim()) {
    errors['endereco.cep'] = 'CEP é obrigatório';
  } else if (!validationUtils.isValidCEP(endereco.cep)) {
    errors['endereco.cep'] = 'CEP deve ter 8 dígitos';
  }

  if (!endereco?.logradouro?.trim()) {
    errors['endereco.logradouro'] = 'Logradouro é obrigatório';
  }

  if (!endereco?.bairro?.trim()) {
    errors['endereco.bairro'] = 'Bairro é obrigatório';
  }

  if (!endereco?.cidade?.trim()) {
    errors['endereco.cidade'] = 'Cidade é obrigatória';
  }

  if (!endereco?.estado?.trim()) {
    errors['endereco.estado'] = 'Estado é obrigatório';
  } else if (endereco.estado.length !== 2) {
    errors['endereco.estado'] = 'Estado deve ter 2 caracteres (UF)';
  }

  return errors;
}

/**
 * Função para sanitizar dados antes de salvar
 */
export function sanitizeComparecimentoData(data: ComparecimentoFormData): ComparecimentoFormData {
  return {
    ...data,
    nome: data.nome?.trim() || '',
    cpf: data.cpf?.trim() || undefined,
    rg: data.rg?.trim() || undefined,
    contato: data.contato?.trim() || '',
    processo: data.processo?.trim() || '',
    vara: data.vara?.trim() || '',
    comarca: data.comarca?.trim() || '',
    endereco: {
      cep: data.endereco?.cep?.trim() || '',
      logradouro: data.endereco?.logradouro?.trim() || '',
      numero: data.endereco?.numero?.trim() || undefined,
      complemento: data.endereco?.complemento?.trim() || undefined,
      bairro: data.endereco?.bairro?.trim() || '',
      cidade: data.endereco?.cidade?.trim() || '',
      estado: data.endereco?.estado?.trim().toUpperCase() || ''
    },
    observacoes: data.observacoes?.trim() || undefined
  };
}

/**
 * Valida dados específicos para atualização (permite campos opcionais)
 */
export function validateUpdateData(data: Partial<ComparecimentoFormData>): FormValidation {
  const errors: Record<string, string> = {};
  const warnings: Record<string, string> = {};

  // Se CPF ou RG estão sendo atualizados, validar
  if ((data.cpf !== undefined || data.rg !== undefined)) {
    const docValidation = validateDocuments(data.cpf, data.rg);
    if (!docValidation.isValid) {
      errors.documentos = docValidation.error!;
    }
  }

  // Validar outros campos apenas se fornecidos
  if (data.nome !== undefined && !data.nome.trim()) {
    errors.nome = 'Nome não pode estar vazio';
  }

  if (data.contato !== undefined && !data.contato.trim()) {
    errors.contato = 'Contato não pode estar vazio';
  }

  if (data.processo !== undefined) {
    if (!data.processo.trim()) {
      errors.processo = 'Processo não pode estar vazio';
    } else if (!validationUtils.isValidProcess(data.processo)) {
      errors.processo = 'Número do processo inválido';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    warnings
  };
}

/**
 * Utilitário para verificar quais documentos estão presentes
 */
export function getDocumentInfo(cpf?: string, rg?: string): {
  hasCpf: boolean;
  hasRg: boolean;
  hasAnyDocument: boolean;
  documentTypes: string[];
} {
  const hasCpf = !!(cpf?.trim());
  const hasRg = !!(rg?.trim());
  const hasAnyDocument = hasCpf || hasRg;
  
  const documentTypes: string[] = [];
  if (hasCpf) documentTypes.push('CPF');
  if (hasRg) documentTypes.push('RG');

  return {
    hasCpf,
    hasRg,
    hasAnyDocument,
    documentTypes
  };
}

/**
 * Gera mensagem descritiva sobre os documentos presentes
 */
export function getDocumentSummary(cpf?: string, rg?: string): string {
  const info = getDocumentInfo(cpf, rg);
  
  if (!info.hasAnyDocument) {
    return 'Nenhum documento informado';
  }
  
  if (info.hasCpf && info.hasRg) {
    return 'CPF e RG informados';
  }
  
  if (info.hasCpf) {
    return 'Apenas CPF informado';
  }
  
  return 'Apenas RG informado';
}