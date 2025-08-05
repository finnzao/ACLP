import * as XLSX from 'xlsx';
import { Comparecimento } from '@/types';
import { formatarPeriodicidade } from './periodicidade';

export interface ExportOptions {
  filename?: string;
  sheetName?: string;
  includeFilters?: boolean;
  filterInfo?: {
    filtro?: string;
    status?: string;
    urgencia?: string;
    dataInicio?: string;
    dataFim?: string;
  };
}

export interface ExportData extends Comparecimento {
  diasAtraso?: number;
  statusUrgencia?: string;
}

// Utilitários de data para cálculos
const dateUtils = {
  formatToBR: (date: string | Date): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('pt-BR');
  },

  getDaysUntil: (date: string): number => {
    const today = new Date();
    const targetDate = new Date(date);
    const diffTime = targetDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  },

  isToday: (date: string): boolean => {
    return date === new Date().toISOString().split('T')[0];
  },

  isOverdue: (date: string): boolean => {
    return dateUtils.getDaysUntil(date) < 0;
  }
};

/**
 * Prepara os dados para exportação, adicionando campos calculados
 */
export function prepareExportData(dados: Comparecimento[]): ExportData[] {
  return dados.map(item => {
    const diasRestantes = dateUtils.getDaysUntil(item.proximoComparecimento);
    const isHoje = dateUtils.isToday(item.proximoComparecimento);
    const isAtrasado = dateUtils.isOverdue(item.proximoComparecimento);

    let statusUrgencia = 'Normal';
    let diasAtraso = 0;

    if (isAtrasado) {
      statusUrgencia = 'Atrasado';
      diasAtraso = Math.abs(diasRestantes);
    } else if (isHoje) {
      statusUrgencia = 'Hoje';
    } else if (diasRestantes <= 7 && diasRestantes > 0) {
      statusUrgencia = 'Próximo (7 dias)';
    }

    return {
      ...item,
      diasAtraso,
      statusUrgencia
    };
  });
}

/**
 * Converte dados para formato de planilha
 */
export function convertToSheetData(dados: ExportData[]) {
  return dados.map((item, index) => ({
    '#': index + 1,
    'Nome': item.nome,
    'CPF': item.cpf,
    'RG': item.rg,
    'Contato': item.contato,
    'Processo': item.processo,
    'Vara': item.vara,
    'Comarca': item.comarca,
    'Data da Decisão': dateUtils.formatToBR(item.decisao),
    'Periodicidade': formatarPeriodicidade(item.periodicidade),
    'Status': item.status === 'em conformidade' ? 'Em Conformidade' : 'Inadimplente',
    'Primeiro Comparecimento': dateUtils.formatToBR(item.primeiroComparecimento),
    'Último Comparecimento': dateUtils.formatToBR(item.ultimoComparecimento),
    'Próximo Comparecimento': dateUtils.formatToBR(item.proximoComparecimento),
    'Status de Urgência': item.statusUrgencia,
    'Dias em Atraso': item.diasAtraso || 0,
    // Adicionar dados de endereço
    'Endereço Completo': formatarEnderecoCompleto(item.endereco)
  }));
}

/**
 * Formatar endereço completo para exibição
 */
function formatarEnderecoCompleto(endereco: Comparecimento['endereco']): string {
  if (!endereco) return '';

  const partes: string[] = [];

  if (endereco.logradouro) {
    let enderecoLinha = endereco.logradouro;
    if (endereco.numero) enderecoLinha += `, ${endereco.numero}`;
    if (endereco.complemento) enderecoLinha += `, ${endereco.complemento}`;
    partes.push(enderecoLinha);
  }

  if (endereco.bairro) partes.push(endereco.bairro);
  if (endereco.cidade && endereco.estado) {
    partes.push(`${endereco.cidade} - ${endereco.estado}`);
  }
  if (endereco.cep) partes.push(`CEP: ${endereco.cep}`);

  return partes.join(', ');
}

/**
 * Cria informações de filtros aplicados
 */
export function createFilterInfo(filterInfo?: ExportOptions['filterInfo']) {
  if (!filterInfo) return [];

  const info = [];

  if (filterInfo.filtro) {
    info.push(['Busca:', filterInfo.filtro]);
  }

  if (filterInfo.status && filterInfo.status !== 'todos') {
    const statusLabel = filterInfo.status === 'em conformidade' ? 'Em Conformidade' : 'Inadimplente';
    info.push(['Status:', statusLabel]);
  }

  if (filterInfo.urgencia && filterInfo.urgencia !== 'todos') {
    let urgenciaLabel = '';
    switch (filterInfo.urgencia) {
      case 'hoje': urgenciaLabel = 'Comparecimentos de Hoje'; break;
      case 'atrasados': urgenciaLabel = 'Em Atraso'; break;
      case 'proximos': urgenciaLabel = 'Próximos 7 dias'; break;
    }
    info.push(['Urgência:', urgenciaLabel]);
  }

  if (filterInfo.dataInicio && filterInfo.dataFim) {
    info.push(['Período:', `${dateUtils.formatToBR(filterInfo.dataInicio)} até ${dateUtils.formatToBR(filterInfo.dataFim)}`]);
  }

  return info;
}

/**
 * Aplica formatação à planilha
 */
export function formatWorksheet(worksheet: XLSX.WorkSheet, dataLength: number) {
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');

  // Definir larguras das colunas (incluindo nova coluna de endereço)
  const colWidths = [
    { wch: 5 },   // #
    { wch: 25 },  // Nome
    { wch: 15 },  // CPF
    { wch: 12 },  // RG
    { wch: 15 },  // Contato
    { wch: 25 },  // Processo
    { wch: 20 },  // Vara
    { wch: 20 },  // Comarca
    { wch: 15 },  // Data da Decisão
    { wch: 20 },  // Periodicidade (agora com descrição mais longa)
    { wch: 15 },  // Status
    { wch: 18 },  // Primeiro Comparecimento
    { wch: 18 },  // Último Comparecimento
    { wch: 18 },  // Próximo Comparecimento
    { wch: 18 },  // Status de Urgência
    { wch: 15 },  // Dias em Atraso
    { wch: 50 }   // Endereço Completo
  ];

  worksheet['!cols'] = colWidths;

  // Aplicar estilos ao cabeçalho
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const cellAddress = XLSX.utils.encode_cell({ c: C, r: 0 });
    if (!worksheet[cellAddress]) continue;

    worksheet[cellAddress].s = {
      font: { bold: true },
      fill: { fgColor: { rgb: "4A90E2" } },
      color: { rgb: "FFFFFF" },
      alignment: { horizontal: "center" }
    };
  }

  // Aplicar formatação condicional para status de urgência
  for (let R = 1; R <= dataLength; R++) {
    const urgenciaCell = XLSX.utils.encode_cell({ c: 14, r: R }); // Status de Urgência
    const atrasoCell = XLSX.utils.encode_cell({ c: 15, r: R }); // Dias em Atraso

    if (worksheet[urgenciaCell]) {
      const urgencia = worksheet[urgenciaCell].v;

      if (urgencia === 'Atrasado') {
        worksheet[urgenciaCell].s = {
          fill: { fgColor: { rgb: "FFEBEE" } },
          font: { color: { rgb: "C62828" }, bold: true }
        };
      } else if (urgencia === 'Hoje') {
        worksheet[urgenciaCell].s = {
          fill: { fgColor: { rgb: "FFF8E1" } },
          font: { color: { rgb: "F57F17" }, bold: true }
        };
      } else if (urgencia === 'Próximo (7 dias)') {
        worksheet[urgenciaCell].s = {
          fill: { fgColor: { rgb: "E3F2FD" } },
          font: { color: { rgb: "1976D2" } }
        };
      }
    }

    // Destacar dias em atraso
    if (worksheet[atrasoCell] && worksheet[atrasoCell].v > 0) {
      worksheet[atrasoCell].s = {
        fill: { fgColor: { rgb: "FFEBEE" } },
        font: { color: { rgb: "C62828" }, bold: true },
        alignment: { horizontal: "center" }
      };
    }
  }
}

/**
 * Função principal para exportar dados para Excel
 */
export function exportToExcel(dados: Comparecimento[], options: ExportOptions = {}) {
  const {
    filename = `comparecimentos_${new Date().toISOString().split('T')[0]}.xlsx`,
    sheetName = 'Comparecimentos',
    includeFilters = false,
    filterInfo
  } = options;

  try {
    // Preparar dados com campos calculados
    const exportData = prepareExportData(dados);
    const sheetData = convertToSheetData(exportData);

    // Criar workbook
    const workbook = XLSX.utils.book_new();

    // Criar dados da planilha
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let finalData: any[] = sheetData;

    // Adicionar informações de filtros se solicitado
    if (includeFilters && filterInfo) {
      const filterInfoData = createFilterInfo(filterInfo);
      if (filterInfoData.length > 0) {
        const headerRows = [
          ['RELATÓRIO DE COMPARECIMENTOS'],
          ['Gerado em:', new Date().toLocaleString('pt-BR')],
          [''],
          ['FILTROS APLICADOS:'],
          ...filterInfoData,
          [''],
          ['DADOS:']
        ];

        finalData = [
          ...headerRows,
          Object.keys(sheetData[0] || {}), // Cabeçalhos das colunas
          ...sheetData.map(row => Object.values(row))
        ];
      }
    }

    // Criar worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(
      includeFilters && filterInfo ? finalData : [Object.keys(sheetData[0] || {}), ...sheetData.map(row => Object.values(row))]
    );

    // Aplicar formatação
    formatWorksheet(worksheet, sheetData.length);

    // Adicionar worksheet ao workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Fazer download
    XLSX.writeFile(workbook, filename);

    return {
      success: true,
      message: `Arquivo ${filename} baixado com sucesso!`,
      count: dados.length
    };

  } catch (error) {
    console.error('Erro ao exportar para Excel:', error);
    return {
      success: false,
      message: 'Erro ao gerar arquivo Excel. Tente novamente.',
      error
    };
  }
}

/**
 * Função para exportar dados filtrados
 */
export function exportFilteredData(
  dadosOriginais: Comparecimento[],
  dadosFiltrados: Comparecimento[],
  filterInfo?: ExportOptions['filterInfo']
) {
  const hasFilters = filterInfo && Object.values(filterInfo).some(value => value && value !== 'todos');

  return exportToExcel(dadosFiltrados, {
    filename: hasFilters
      ? `comparecimentos_filtrados_${new Date().toISOString().split('T')[0]}.xlsx`
      : `comparecimentos_completo_${new Date().toISOString().split('T')[0]}.xlsx`,
    sheetName: 'Comparecimentos',
    includeFilters: hasFilters,
    filterInfo: hasFilters ? filterInfo : undefined
  });
}