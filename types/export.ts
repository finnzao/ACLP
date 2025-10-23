/**
 * Estrutura de dados para exportação Excel
 * Usa Record para permitir colunas dinâmicas
 */
export type ExportData = Record<string, string | number>;

/**
 * Estatísticas calculadas para o relatório
 */
export interface ExportStatistics {
  totalRegistros: number;
  emConformidade: number;
  inadimplentes: number;
  comparecimentosHoje: number;
  atrasados: number;
  proximosPrazos: number;
}

/**
 * Informações sobre filtros aplicados
 */
export interface ExportFilterInfo {
  filtro?: string;
  status?: string;
  urgencia?: string;
  dataInicio?: string;
  dataFim?: string;
}

/**
 * Configurações de estilo para células do Excel
 */
export interface CellStyle {
  font?: {
    bold?: boolean;
    size?: number;
    color?: { argb: string };
    name?: string;
  };
  fill?: {
    type: 'pattern';
    pattern: 'solid';
    fgColor: { argb: string };
  };
  border?: {
    top?: { style: string; color: { argb: string } };
    bottom?: { style: string; color: { argb: string } };
    left?: { style: string; color: { argb: string } };
    right?: { style: string; color: { argb: string } };
  };
  alignment?: {
    horizontal?: 'left' | 'center' | 'right';
    vertical?: 'top' | 'middle' | 'bottom';
    wrapText?: boolean;
  };
  numberFormat?: string;
}

/**
 * Configurações de coluna do Excel
 */
export interface ColumnConfig {
  key: string;
  header: string;
  width?: number;
  style?: CellStyle;
}

/**
 * Opções para exportação
 */
export interface ExportOptions {
  filename?: string;
  sheetName?: string;
  includeStatistics?: boolean;
  includeFilters?: boolean;
  applyStyles?: boolean;
  autoFilter?: boolean;
  freezeHeader?: boolean;
}

/**
 * Resultado da exportação
 */
export interface ExportResult {
  success: boolean;
  filename?: string;
  message?: string;
  error?: string;
  recordCount?: number;
}

/**
 * Configuração de página para impressão
 */
export interface PageSetup {
  orientation?: 'portrait' | 'landscape';
  paperSize?: number;
  fitToPage?: boolean;
  margins?: {
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
    header?: number;
    footer?: number;
  };
}

/**
 * Metadados do arquivo Excel
 */
export interface ExcelMetadata {
  creator?: string;
  lastModifiedBy?: string;
  created?: Date;
  modified?: Date;
  title?: string;
  subject?: string;
  description?: string;
  keywords?: string;
  category?: string;
  company?: string;
}