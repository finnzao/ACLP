import type { Periodicidade, StatusComparecimento } from './index';

export interface Endereco {
  cep: string; // Obrigatório
  logradouro: string; // Obrigatório
  numero?: string;
  complemento?: string;
  bairro: string; // Obrigatório
  cidade: string; // Obrigatório
  estado: string; // Obrigatório
}

// Tipo utilitário para garantir que pelo menos um documento seja fornecido
type AtLeastOneDocument = 
  | { cpf: string; rg?: string }  // CPF obrigatório, RG opcional
  | { cpf?: string; rg: string }  // RG obrigatório, CPF opcional
  | { cpf: string; rg: string };  // Ambos fornecidos

// Interface base sem CPF/RG
interface ComparecimentoBase {
  nome: string;
  contato: string;
  processo: string;
  vara: string;
  comarca: string;
  decisao: string;
  periodicidade: Periodicidade;
  dataComparecimentoInicial: string;
  status: StatusComparecimento;
  primeiroComparecimento: string;
  ultimoComparecimento: string;
  proximoComparecimento: string;
  endereco: Endereco;
  observacoes?: string;
  dataCadastro?: string;
  ultimaAtualizacao?: string;
}

// Interface principal que garante pelo menos um documento
export interface Comparecimento extends ComparecimentoBase, AtLeastOneDocument {}

// Interface para novo comparecimento
interface NovoComparecimentoBase {
  nome: string;
  contato: string;
  processo: string;
  vara: string;
  comarca: string;
  decisao: string;
  periodicidade: Periodicidade;
  dataComparecimentoInicial: string;
  endereco: Endereco;
  observacoes?: string;
}

export interface NovoComparecimento extends NovoComparecimentoBase, AtLeastOneDocument {}

// Interface mais flexível para formulários (antes da validação)
export interface ComparecimentoFormData {
  nome: string;
  cpf?: string; // Ambos opcionais no formulário
  rg?: string;  // Mas validação garantirá que pelo menos um existe
  contato: string;
  processo: string;
  vara: string;
  comarca: string;
  decisao: string;
  periodicidade: Periodicidade;
  dataComparecimentoInicial: string;
  endereco: Endereco;
  observacoes?: string;
}

// Type Guards para verificação em runtime
export function hasRequiredDocuments(data: ComparecimentoFormData): data is NovoComparecimento {
  return !!(data.cpf?.trim() || data.rg?.trim());
}

export function validateDocuments(cpf?: string, rg?: string): { isValid: boolean; error?: string } {
  const hasCpf = cpf?.trim();
  const hasRg = rg?.trim();
  
  if (!hasCpf && !hasRg) {
    return {
      isValid: false,
      error: 'Pelo menos CPF ou RG deve ser informado'
    };
  }
  
  return { isValid: true };
}

// Interface para validação de formulário
export interface FormValidation {
  isValid: boolean;
  errors: Record<string, string>;
  warnings?: Record<string, string>;
}

// Interface para histórico de comparecimentos
export interface HistoricoComparecimento {
  id: string;
  processo: string;
  dataComparecimento: string;
  horaComparecimento?: string;
  tipoValidacao: 'presencial' | 'documental' | 'justificado';
  validadoPor: string;
  observacoes?: string;
  anexos?: string[]; // URLs dos arquivos anexados
  criadoEm: string;
}

// Interface para notificações de prazo
export interface NotificacaoPrazo {
  id: string;
  processo: string;
  nome: string;
  dataComparecimento: string;
  diasParaVencimento: number;
  enviado: boolean;
  dataEnvio?: string;
  emailDestino: string;
  tipoNotificacao: 'aviso' | 'urgente' | 'vencido';
}

// Interface para atualização de endereço durante comparecimento
export interface AtualizacaoEndereco {
  houveAlteracao: boolean;
  endereco?: Endereco;
  motivoAlteracao?: string;
}

// Interface ampliada para registro de comparecimento
export interface RegistroComparecimentoCompleto {
  processo: string;
  nome: string;
  dataComparecimento?: string;
  horaComparecimento?: string;
  observacoes: string;
  validadoPor: string;
  tipoValidacao: 'presencial' | 'documental' | 'justificado';
  // Novos campos para endereço
  atualizacaoEndereco?: AtualizacaoEndereco;
}

// Interface para relatórios
export interface RelatorioComparecimento {
  periodo: {
    inicio: string;
    fim: string;
  };
  estatisticas: {
    totalCadastrados: number;
    emConformidade: number;
    inadimplentes: number;
    comparecimentosRealizados: number;
    comparecimentosPendentes: number;
    percentualConformidade: number;
  };
  detalhes: Comparecimento[];
  geradoEm: string;
  geradoPor: string;
}