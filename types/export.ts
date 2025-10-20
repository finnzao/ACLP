/* eslint-disable @typescript-eslint/no-explicit-any */
export interface ExportFilterInfo {
    filtro?: string;
    status?: string;
    urgencia?: string;
    tipo?: string;
    dataInicio?: string;
    dataFim?: string;
  }
  
  export interface ExportResult {
    success: boolean;
    message: string;
    filename?: string;
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
    'Endereço Completo'?: string;
  }
  
  export interface ExportStatistics {
    totalRegistros: number;
    emConformidade: number;
    inadimplentes: number;
    comparecimentosHoje: number;
    atrasados: number;
    proximosPrazos: number;
  }