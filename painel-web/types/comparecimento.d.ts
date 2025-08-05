import type { Periodicidade, StatusComparecimento } from './index';

export interface Endereco {
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
}

export interface Comparecimento {
  nome: string;
  cpf: string;
  rg: string;
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
  // Novos campos opcionais
  endereco?: Endereco;
  periodoEmDias?: number; // Para periodicidade personalizada
  observacoes?: string;
  dataCadastro?: string;
  ultimaAtualizacao?: string;
}

export interface NovoComparecimento {
  nome: string;
  cpf?: string; // Opcional, mas pelo menos um documento deve existir
  rg?: string; // Opcional, mas pelo menos um documento deve existir
  contato: string;
  processo: string;
  vara: string;
  comarca: string;
  decisao: string;
  periodicidade: Periodicidade | 'personalizada';
  diasPersonalizados?: number; // Para quando periodicidade = 'personalizada'
  dataComparecimentoInicial: string;
  endereco?: Endereco;
  observacoes?: string;
}

export interface ComparecimentoFormData extends NovoComparecimento {
  periodoEmDias: number;
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