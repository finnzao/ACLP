/* eslint-disable @typescript-eslint/no-explicit-any */
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
} as const;

// Mapeamento completo de todos os endpoints do backend
export const ENDPOINTS = {
  // Setup Controller
  SETUP: {
    STATUS: '/setup/status',
    CREATE_ADMIN: '/setup/admin',
    AUDIT: '/setup/audit', 
    RESET: '/setup/reset',
    HEALTH: '/setup/health',
  },

  // Email Verification
  VERIFICACAO: {
    SOLICITAR_CODIGO: '/verificacao/solicitar-codigo',
    VERIFICAR_CODIGO: '/verificacao/verificar-codigo',
    STATUS: '/verificacao/status',
    REENVIAR_CODIGO: '/verificacao/reenviar-codigo',
    VALIDAR_TOKEN: '/verificacao/validar-token',
    HEALTH: '/verificacao/health',
  },

  // Pessoas Controller
  PESSOAS: {
    BASE: '/pessoas',
    LIST: '/pessoas',
    CREATE: '/pessoas',
    BY_ID: (id: number) => `/pessoas/${id}`,
    UPDATE: (id: number) => `/pessoas/${id}`,
    DELETE: (id: number) => `/pessoas/${id}`,
    BY_PROCESSO: (processo: string) => `/pessoas/processo/${encodeURIComponent(processo)}`,
    BY_STATUS: (status: string) => `/pessoas/status/${status}`,
    COMPARECIMENTOS_HOJE: '/pessoas/comparecimentos/hoje',
    ATRASADOS: '/pessoas/atrasados',
    BUSCAR: (termo: string) => `/pessoas/buscar?termo=${encodeURIComponent(termo)}`,
  },

  // Comparecimentos Controller
  COMPARECIMENTOS: {
    BASE: '/comparecimentos',
    CREATE: '/comparecimentos',
    BY_PESSOA: (pessoaId: number) => `/comparecimentos/pessoa/${pessoaId}`,
    BY_PERIODO: '/comparecimentos/periodo',
    HOJE: '/comparecimentos/hoje',
    MUDANCAS_ENDERECO: (pessoaId: number) => `/comparecimentos/pessoa/${pessoaId}/mudancas-endereco`,
    UPDATE_OBSERVACOES: (historicoId: number) => `/comparecimentos/${historicoId}/observacoes`,
    VERIFICAR_INADIMPLENTES: '/comparecimentos/verificar-inadimplentes',
    ESTATISTICAS: '/comparecimentos/estatisticas',
    ESTATISTICAS_GERAL: '/comparecimentos/estatisticas/geral',
    RESUMO_SISTEMA: '/comparecimentos/resumo/sistema',
    MIGRAR_CADASTROS_INICIAIS: '/comparecimentos/migrar/cadastros-iniciais',
  },

  // Histórico Endereços
  HISTORICO_ENDERECOS: {
    BY_PESSOA: (pessoaId: number) => `/historico-enderecos/pessoa/${pessoaId}`,
    ENDERECO_ATIVO: (pessoaId: number) => `/historico-enderecos/pessoa/${pessoaId}/ativo`,
    HISTORICOS: (pessoaId: number) => `/historico-enderecos/pessoa/${pessoaId}/historicos`,
    BY_PERIODO: (pessoaId: number) => `/historico-enderecos/pessoa/${pessoaId}/periodo`,
    BY_CIDADE: (cidade: string) => `/historico-enderecos/cidade/${encodeURIComponent(cidade)}/pessoas`,
    BY_ESTADO: (estado: string) => `/historico-enderecos/estado/${estado}/pessoas`,
    MUDANCAS_PERIODO: '/historico-enderecos/mudancas/periodo',
    TOTAL_ENDERECOS: (pessoaId: number) => `/historico-enderecos/pessoa/${pessoaId}/total`,
    ATIVOS_POR_DATA: (data: string) => `/historico-enderecos/data/${data}/ativos`,
    BY_MOTIVO: '/historico-enderecos/motivo',
    ANTERIOR: (pessoaId: number) => `/historico-enderecos/pessoa/${pessoaId}/anterior`,
    ESTATISTICAS: '/historico-enderecos/estatisticas',
  },

  // Usuários Controller
  USUARIOS: {
    BASE: '/usuarios',
    LIST: '/usuarios',
    CREATE: '/usuarios',
    BY_ID: (id: number) => `/usuarios/${id}`,
    UPDATE: (id: number) => `/usuarios/${id}`,
    DELETE: (id: number) => `/usuarios/${id}`,
    BY_TIPO: (tipo: string) => `/usuarios/tipo/${tipo}`,
  },

  // Test Controller
  TEST: {
    HEALTH: '/test/health',
    INFO: '/test/info',
  },

  // Setup Views (páginas)
  SETUP_VIEWS: {
    SETUP: '/setup',
    SUCCESS: '/setup/success',
  },
} as const;

// Função para construir URL completa
export const buildUrl = (endpoint: string, params?: Record<string, string | number>): string => {
  let url = `${API_CONFIG.BASE_URL}${endpoint}`;
  
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      searchParams.append(key, String(value));
    });
    url += `?${searchParams.toString()}`;
  }
  
  return url;
};

// Função para logs condicionais
export const apiLog = (message: string, data?: any) => {
  if (API_CONFIG.IS_DEVELOPMENT) {
    console.log(`[API] ${message}`, data || '');
  }
};