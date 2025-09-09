/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/config/endpoints.ts
export const API_CONFIG = {
  // Base URLs - configura automaticamente baseado no ambiente
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api',
  
  // Configurações gerais
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  
  // Headers padrão
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  
  // Configurações por ambiente
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
} as const;

// Mapeamento completo de todos os endpoints do backend
export const ENDPOINTS = {
  // 🔧 SETUP CONTROLLER
  SETUP: {
    STATUS: '/setup/status',
    CREATE_ADMIN: '/setup/admin',
    AUDIT: '/setup/audit', 
    RESET: '/setup/reset',
    HEALTH: '/setup/health',
  },

  // 📧 EMAIL VERIFICATION
  VERIFICACAO: {
    SOLICITAR_CODIGO: '/verificacao/solicitar-codigo',
    VERIFICAR_CODIGO: '/verificacao/verificar-codigo',
    STATUS: '/verificacao/status',
    REENVIAR_CODIGO: '/verificacao/reenviar-codigo',
    VALIDAR_TOKEN: '/verificacao/validar-token',
    HEALTH: '/verificacao/health',
  },

  // 👥 PESSOAS CONTROLLER
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

  // ✅ COMPARECIMENTOS CONTROLLER
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
  },

  // 🏠 HISTÓRICO ENDEREÇOS
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

  // 👨‍💼 USUÁRIOS CONTROLLER
  USUARIOS: {
    BASE: '/usuarios',
    LIST: '/usuarios',
    CREATE: '/usuarios',
    BY_ID: (id: number) => `/usuarios/${id}`,
    UPDATE: (id: number) => `/usuarios/${id}`,
    DELETE: (id: number) => `/usuarios/${id}`,
    BY_TIPO: (tipo: string) => `/usuarios/tipo/${tipo}`,
  },

  // 🧪 TEST CONTROLLER
  TEST: {
    HEALTH: '/test/health',
    INFO: '/test/info',
  },

  // 🌐 SETUP VIEWS (páginas)
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