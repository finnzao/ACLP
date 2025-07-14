import { Comparecimento } from './index';

export interface ExportOptions {
  filename?: string;
  sheetName?: string;
  includeFilters?: boolean;
  filterInfo?: ExportFilterInfo;
}

export interface ExportFilterInfo {
  filtro?: string;
  status?: 'todos' | 'em conformidade' | 'inadimplente';
  urgencia?: 'todos' | 'hoje' | 'atrasados' | 'proximos';
  dataInicio?: string;
  dataFim?: string;
}

export interface ExportResult {
  success: boolean;
  message: string;
  count?: number;
  error?: any;
}

export interface ExportData {
  '#': number;
  'Nome': string;
  'CPF': string;
  'RG': string;
  'Contato': string;
  'Processo': string;
  'Vara': string;
  'Comarca': string;
  'Data da Decisão': string;
  'Periodicidade': string;
  'Status': string;
  'Primeiro Comparecimento': string;
  'Último Comparecimento': string;
  'Próximo Comparecimento': string;
  'Status de Urgência': string;
  'Dias em Atraso': number;
}

export type ExportFormat = 'xlsx' | 'csv' | 'pdf';

export interface ExportStatistics {
  totalRegistros: number;
  emConformidade: number;
  inadimplentes: number;
  comparecimentosHoje: number;
  atrasados: number;
  proximosPrazos: number;
}

export interface ExportMetadata {
  geradoEm: string;
  geradoPor?: string;
  filtrosAplicados: ExportFilterInfo;
  estatisticas: ExportStatistics;
}