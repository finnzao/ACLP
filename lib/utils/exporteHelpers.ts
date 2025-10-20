import { Comparecimento } from '@/types';
import type { ExportData, ExportStatistics, ExportFilterInfo } from '@/types/export';

/**
 * Calcula estatísticas dos dados para incluir no relatório
 */
export function calculateExportStatistics(dados: Comparecimento[]): ExportStatistics {
    const hoje = new Date().toISOString().split('T')[0];

    const emConformidade = dados.filter(d => d.status === 'em conformidade').length;
    const inadimplentes = dados.filter(d => d.status === 'inadimplente').length;

    const comparecimentosHoje = dados.filter(d => d.proximoComparecimento === hoje).length;

    const atrasados = dados.filter(d => {
        const proximoComparecimento = new Date(d.proximoComparecimento);
        const hojeDate = new Date(hoje);
        return proximoComparecimento < hojeDate;
    }).length;

    const proximoPrazo = new Date();
    proximoPrazo.setDate(proximoPrazo.getDate() + 7);
    const proximoPrazoStr = proximoPrazo.toISOString().split('T')[0];

    const proximosPrazos = dados.filter(d => {
        const dataComparecimento = d.proximoComparecimento;
        return dataComparecimento >= hoje && dataComparecimento <= proximoPrazoStr;
    }).length;

    return {
        totalRegistros: dados.length,
        emConformidade,
        inadimplentes,
        comparecimentosHoje,
        atrasados,
        proximosPrazos
    };
}

/**
 * Gera nome de arquivo baseado nos filtros aplicados
 */
export function generateFilename(filterInfo?: ExportFilterInfo): string {
    const timestamp = new Date().toISOString().split('T')[0];
    let filename = 'comparecimentos';

    if (filterInfo) {
        const parts: string[] = [];

        if (filterInfo.status && filterInfo.status !== 'todos') {
            parts.push(filterInfo.status === 'em conformidade' ? 'conformes' : 'inadimplentes');
        }

        if (filterInfo.urgencia && filterInfo.urgencia !== 'todos') {
            const urgenciaMap = {
                'hoje': 'hoje',
                'atrasados': 'atrasados',
                'proximos': 'proximos7dias'
            };
            parts.push(urgenciaMap[filterInfo.urgencia as keyof typeof urgenciaMap]);
        }

        if (filterInfo.filtro) {
            parts.push('filtrados');
        }

        if (filterInfo.dataInicio && filterInfo.dataFim) {
            const inicio = filterInfo.dataInicio.replace(/-/g, '');
            const fim = filterInfo.dataFim.replace(/-/g, '');
            parts.push(`${inicio}_${fim}`);
        }

        if (parts.length > 0) {
            filename += `_${parts.join('_')}`;
        }
    }

    return `${filename}_${timestamp}.xlsx`;
}

/**
 * Valida dados antes da exportação
 */
export function validateExportData(dados: Comparecimento[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!dados || dados.length === 0) {
        errors.push('Nenhum dado disponível para exportação');
    }

    // Verificar se há campos obrigatórios vazios
    const camposObrigatorios: (keyof Comparecimento)[] = ['nome', 'processo', 'proximoComparecimento'];

    dados.forEach((item, index) => {
        camposObrigatorios.forEach(campo => {
            if (!item[campo] || String(item[campo]).trim() === '') {
                errors.push(`Linha ${index + 1}: Campo "${campo}" é obrigatório`);
            }
        });
    });

    // Verificar duplicatas de processo
    const processos = dados.map(d => d.processo);
    const processosDuplicados = processos.filter((processo, index) =>
        processos.indexOf(processo) !== index
    );

    if (processosDuplicados.length > 0) {
        errors.push(`Processos duplicados encontrados: ${[...new Set(processosDuplicados)].join(', ')}`);
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Transforma dados para formato de exportação com validação
 */
export function transformDataForExport(dados: Comparecimento[]): ExportData[] {
    return dados.map((item, index) => {
        const hoje = new Date();
        const proximoComparecimento = new Date(item.proximoComparecimento);
        const diffTime = proximoComparecimento.getTime() - hoje.getTime();
        const diasRestantes = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        const isHoje = item.proximoComparecimento === hoje.toISOString().split('T')[0];
        const isAtrasado = diasRestantes < 0;

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
            '#': index + 1,
            'Nome': item.nome || '',
            'CPF': item.cpf || '',
            'RG': item.rg || '',
            'Contato': item.contato || '',
            'Processo': item.processo || '',
            'Vara': item.vara || '',
            'Comarca': item.comarca || '',
            'Data da Decisão': formatDateToBR(item.decisao),
            'Periodicidade': item.periodicidade === 'mensal' ? 'Mensal' : 'Bimensal',
            'Status': item.status === 'em conformidade' ? 'Em Conformidade' : 'Inadimplente',
            'Primeiro Comparecimento': formatDateToBR(item.primeiroComparecimento),
            'Último Comparecimento': formatDateToBR(item.ultimoComparecimento),
            'Próximo Comparecimento': formatDateToBR(item.proximoComparecimento),
            'Status de Urgência': statusUrgencia,
            'Dias em Atraso': diasAtraso
        };
    });
}

/**
 * Formata data para padrão brasileiro
 */
function formatDateToBR(date: string | Date): string {
    if (!date) return '';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('pt-BR');
}

/**
 * Gera resumo textual dos filtros aplicados
 */
export function generateFilterSummary(filterInfo?: ExportFilterInfo): string {
    if (!filterInfo) return 'Nenhum filtro aplicado';

    const filtros: string[] = [];

    if (filterInfo.filtro) {
        filtros.push(`Busca: "${filterInfo.filtro}"`);
    }

    if (filterInfo.status && filterInfo.status !== 'todos') {
        const statusLabel = filterInfo.status === 'em conformidade' ? 'Em Conformidade' : 'Inadimplente';
        filtros.push(`Status: ${statusLabel}`);
    }

    if (filterInfo.urgencia && filterInfo.urgencia !== 'todos') {
        const urgenciaLabels = {
            'hoje': 'Comparecimentos de Hoje',
            'atrasados': 'Em Atraso',
            'proximos': 'Próximos 7 dias'
        };
        filtros.push(`Urgência: ${urgenciaLabels[filterInfo.urgencia as keyof typeof urgenciaLabels]}`);
    }

    if (filterInfo.dataInicio && filterInfo.dataFim) {
        const inicio = formatDateToBR(filterInfo.dataInicio);
        const fim = formatDateToBR(filterInfo.dataFim);
        filtros.push(`Período: ${inicio} até ${fim}`);
    }

    return filtros.length > 0 ? filtros.join('; ') : 'Nenhum filtro aplicado';
}

/**
 * Calcula progresso de exportação (para futuras implementações com grandes volumes)
 */
export function calculateExportProgress(processedItems: number, totalItems: number): number {
    if (totalItems === 0) return 100;
    return Math.round((processedItems / totalItems) * 100);
}

/**
 * Estima tempo de exportação baseado no volume de dados
 */
export function estimateExportTime(dataLength: number): string {
    // Estimativa grosseira: ~1000 registros por segundo
    const estimatedSeconds = Math.ceil(dataLength / 1000);

    if (estimatedSeconds < 1) return 'menos de 1 segundo';
    if (estimatedSeconds < 60) return `${estimatedSeconds} segundos`;

    const minutes = Math.ceil(estimatedSeconds / 60);
    return `${minutes} minuto${minutes > 1 ? 's' : ''}`;
}

/**
 * Limpa e normaliza dados antes da exportação
 */
export function sanitizeExportData(dados: Comparecimento[]): Comparecimento[] {
    return dados.map(item => ({
        ...item,
        nome: String(item.nome || '').trim(),
        cpf: String(item.cpf || '').trim(),
        rg: String(item.rg || '').trim(),
        contato: String(item.contato || '').trim(),
        processo: String(item.processo || '').trim(),
        vara: String(item.vara || '').trim(),
        comarca: String(item.comarca || '').trim()
    }));
}