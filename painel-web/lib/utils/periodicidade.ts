// painel-web/lib/utils/periodicidade.ts

export type TipoPeriodicidade = 'mensal' | 'bimensal' | 'personalizada';

export interface ConfigPeriodicidade {
  tipo: TipoPeriodicidade;
  dias: number;
  descricao: string;
  sugestoes?: string[];
}

// Configurações padrão de periodicidade
export const PERIODICIDADES: Record<TipoPeriodicidade, ConfigPeriodicidade> = {
  mensal: {
    tipo: 'mensal',
    dias: 30,
    descricao: 'Comparecimento a cada 30 dias',
    sugestoes: ['Ideal para casos com maior necessidade de acompanhamento']
  },
  bimensal: {
    tipo: 'bimensal',
    dias: 60,
    descricao: 'Comparecimento a cada 60 dias',
    sugestoes: ['Padrão para a maioria dos casos']
  },
  personalizada: {
    tipo: 'personalizada',
    dias: 0, // Será definido pelo usuário
    descricao: 'Período personalizado definido pelo usuário',
    sugestoes: [
      'Use para casos especiais que requerem periodicidade específica',
      'Considere múltiplos de 7 (semanas) para facilitar o agendamento'
    ]
  }
};

// Sugestões de períodos personalizados comuns
export const PERIODOS_SUGERIDOS = [
  { dias: 7, descricao: 'Semanal (7 dias)' },
  { dias: 14, descricao: 'Quinzenal (14 dias)' },
  { dias: 21, descricao: 'Tri-semanal (21 dias)' },
  { dias: 30, descricao: 'Mensal (30 dias)' },
  { dias: 45, descricao: 'Um mês e meio (45 dias)' },
  { dias: 60, descricao: 'Bimensal (60 dias)' },
  { dias: 90, descricao: 'Trimestral (90 dias)' },
  { dias: 120, descricao: 'Quadrimestral (120 dias)' },
  { dias: 180, descricao: 'Semestral (180 dias)' }
];

/**
 * Calcula a próxima data de comparecimento baseada na periodicidade
 */
export function calcularProximoComparecimento(
  dataBase: string | Date,
  periodicidade: TipoPeriodicidade,
  diasPersonalizados?: number
): Date {
  const data = typeof dataBase === 'string' ? new Date(dataBase) : dataBase;
  const novaData = new Date(data);
  
  let diasParaAdicionar: number;
  
  switch (periodicidade) {
    case 'mensal':
      diasParaAdicionar = PERIODICIDADES.mensal.dias;
      break;
    case 'bimensal':
      diasParaAdicionar = PERIODICIDADES.bimensal.dias;
      break;
    case 'personalizada':
      if (!diasPersonalizados || diasPersonalizados < 1) {
        throw new Error('Dias personalizados deve ser um número maior que zero');
      }
      diasParaAdicionar = diasPersonalizados;
      break;
    default:
      throw new Error(`Periodicidade inválida: ${periodicidade}`);
  }
  
  novaData.setDate(novaData.getDate() + diasParaAdicionar);
  return novaData;
}

/**
 * Gera uma sequência de datas de comparecimento
 */
export function gerarSequenciaComparecimentos(
  dataInicial: string | Date,
  periodicidade: TipoPeriodicidade,
  quantidade: number,
  diasPersonalizados?: number
): Date[] {
  const datas: Date[] = [];
  let dataAtual = typeof dataInicial === 'string' ? new Date(dataInicial) : dataInicial;
  
  for (let i = 0; i < quantidade; i++) {
    if (i === 0) {
      datas.push(new Date(dataAtual));
    } else {
      dataAtual = calcularProximoComparecimento(dataAtual, periodicidade, diasPersonalizados);
      datas.push(new Date(dataAtual));
    }
  }
  
  return datas;
}

/**
 * Valida se um período personalizado é adequado
 */
export function validarPeriodoPersonalizado(dias: number): {
  isValid: boolean;
  warnings: string[];
  errors: string[];
} {
  const warnings: string[] = [];
  const errors: string[] = [];
  
  // Validações de erro (impedem o salvamento)
  if (!Number.isInteger(dias) || dias < 1) {
    errors.push('O período deve ser um número inteiro maior que zero');
  }
  
  if (dias > 365) {
    errors.push('O período não pode ser maior que 365 dias (1 ano)');
  }
  
  // Validações de aviso (não impedem o salvamento)
  if (dias < 7 && dias >= 1) {
    warnings.push('Período muito curto pode gerar sobrecarga administrativa');
  }
  
  if (dias > 180) {
    warnings.push('Período muito longo pode não ser adequado para o acompanhamento');
  }
  
  if (dias % 7 !== 0 && dias > 7) {
    warnings.push('Considere usar múltiplos de 7 dias para facilitar o agendamento');
  }
  
  // Verificar se há uma periodicidade padrão similar
  if (Math.abs(dias - 30) <= 2) {
    warnings.push('Este período é similar ao mensal (30 dias). Considere usar a opção "Mensal"');
  }
  
  if (Math.abs(dias - 60) <= 2) {
    warnings.push('Este período é similar ao bimensal (60 dias). Considere usar a opção "Bimensal"');
  }
  
  return {
    isValid: errors.length === 0,
    warnings,
    errors
  };
}

/**
 * Converte periodicidade para formato legível
 */
export function formatarPeriodicidade(
  periodicidade: TipoPeriodicidade,
  diasPersonalizados?: number
): string {
  switch (periodicidade) {
    case 'mensal':
      return 'Mensal (30 dias)';
    case 'bimensal':
      return 'Bimensal (60 dias)';
    case 'personalizada':
      if (!diasPersonalizados) return 'Personalizada';
      return `Personalizada (${diasPersonalizados} dias)`;
    default:
      return 'Não definida';
  }
}

/**
 * Obtém recomendações baseadas no tipo de caso
 */
export function obterRecomendacoesPeriodo(tipoCaso?: string): {
  recomendado: TipoPeriodicidade;
  dias?: number;
  justificativa: string;
} {
  // Aqui você pode implementar lógica baseada no tipo de caso
  // Por ora, retorna recomendação padrão
  
  return {
    recomendado: 'bimensal',
    justificativa: 'Periodicidade bimensal é adequada para a maioria dos casos de liberdade provisória'
  };
}

/**
 * Calcula estatísticas de uma periodicidade
 */
export function calcularEstatisticasPeriodicidade(
  periodicidade: TipoPeriodicidade,
  diasPersonalizados?: number
): {
  diasEntrePeriodos: number;
  comparecimentosPorAno: number;
  comparecimentosPorMes: number;
  observacoes: string[];
} {
  let dias: number;
  
  switch (periodicidade) {
    case 'mensal':
      dias = 30;
      break;
    case 'bimensal':
      dias = 60;
      break;
    case 'personalizada':
      dias = diasPersonalizados || 30;
      break;
    default:
      dias = 30;
  }
  
  const comparecimentosPorAno = Math.round(365 / dias);
  const comparecimentosPorMes = Math.round(30 / dias * 10) / 10; // Uma casa decimal
  
  const observacoes: string[] = [];
  
  if (comparecimentosPorMes > 4) {
    observacoes.push('Alta frequência de comparecimentos (mais de 4 por mês)');
  } else if (comparecimentosPorMes < 0.5) {
    observacoes.push('Baixa frequência de comparecimentos (menos de 1 a cada 2 meses)');
  }
  
  return {
    diasEntrePeriodos: dias,
    comparecimentosPorAno,
    comparecimentosPorMes,
    observacoes
  };
}

/**
 * Utilitário para migrar periodicidade antiga para nova
 */
export function migrarPeriodicidade(
  periodicidadeAntiga: 'mensal' | 'bimensal'
): { tipo: TipoPeriodicidade; dias: number } {
  switch (periodicidadeAntiga) {
    case 'mensal':
      return { tipo: 'mensal', dias: 30 };
    case 'bimensal':
      return { tipo: 'bimensal', dias: 60 };
    default:
      return { tipo: 'mensal', dias: 30 };
  }
}