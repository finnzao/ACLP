export type UserRole = 'admin' | 'usuario';

export interface User {
  id: string;
  nome: string;
  email: string;
  role: UserRole;
  departamento?: string;
  telefone?: string;
  avatar?: string;
  ativo: boolean;
  criadoEm: string;
  ultimoLogin?: string;
  configuracoes?: UserSettings;
}

export interface UserSettings {
  notificacoes: {
    email: boolean;
    sistema: boolean;
    prazoVencimento: boolean;
  };
  interface: {
    tema: 'light' | 'dark';
    itensPerPage: number;
    idioma: 'pt-BR' | 'en';
  };
  privacidade: {
    mostrarEmail: boolean;
    mostrarTelefone: boolean;
  };
}

export interface Permission {
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'export';
  allowed: boolean;
}

export interface UserPermissions {
  // Permissões de Pessoas
  pessoas: {
    listar: boolean;
    visualizar: boolean;
    cadastrar: boolean;
    editar: boolean;
    excluir: boolean;
    exportar: boolean;
  };
  // Permissões de Comparecimentos
  comparecimentos: {
    listar: boolean;
    visualizar: boolean;
    registrar: boolean;
    editar: boolean;
    cancelar: boolean;
    exportar: boolean;
  };
  // Permissões de Relatórios
  relatorios: {
    visualizar: boolean;
    gerar: boolean;
    exportar: boolean;
  };
  // Permissões de Sistema
  sistema: {
    configurar: boolean;
    gerenciarUsuarios: boolean;
    backup: boolean;
    logs: boolean;
  };
  // Permissões de Reconhecimento Facial
  biometria: {
    cadastrar: boolean;
    verificar: boolean;
    gerenciar: boolean;
  };
}

// Definição das permissões por role
export const ROLE_PERMISSIONS: Record<UserRole, UserPermissions> = {
  admin: {
    pessoas: {
      listar: true,
      visualizar: true,
      cadastrar: true,
      editar: true,
      excluir: true,
      exportar: true,
    },
    comparecimentos: {
      listar: true,
      visualizar: true,
      registrar: true,
      editar: true,
      cancelar: true,
      exportar: true,
    },
    relatorios: {
      visualizar: true,
      gerar: true,
      exportar: true,
    },
    sistema: {
      configurar: true,
      gerenciarUsuarios: true,
      backup: true,
      logs: true,
    },
    biometria: {
      cadastrar: true,
      verificar: true,
      gerenciar: true,
    },
  },
  usuario: {
    pessoas: {
      listar: true,
      visualizar: true,
      cadastrar: false, // Usuário comum não pode cadastrar
      editar: false,
      excluir: false,
      exportar: true,
    },
    comparecimentos: {
      listar: true,
      visualizar: true,
      registrar: true, // Pode registrar comparecimentos
      editar: false,
      cancelar: false,
      exportar: true,
    },
    relatorios: {
      visualizar: true,
      gerar: false,
      exportar: true,
    },
    sistema: {
      configurar: false,
      gerenciarUsuarios: false,
      backup: false,
      logs: false,
    },
    biometria: {
      cadastrar: false,
      verificar: true, // Pode verificar biometria
      gerenciar: false,
    },
  },
};

export interface AuthContextType {
  user: User | null;
  permissions: UserPermissions | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  hasPermission: (resource: keyof UserPermissions, action: keyof UserPermissions[keyof UserPermissions]) => boolean;
  isAdmin: () => boolean;
  isUsuario: () => boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  message?: string;
  permissions?: UserPermissions;
}

// Interface para criação/edição de usuários (admin only)
export interface CreateUserRequest {
  nome: string;
  email: string;
  password: string;
  role: UserRole;
  departamento?: string;
  telefone?: string;
}

export interface UpdateUserRequest {
  nome?: string;
  email?: string;
  role?: UserRole;
  departamento?: string;
  telefone?: string;
  ativo?: boolean;
}

// Tipos para auditoria
export interface UserAction {
  id: string;
  userId: string;
  action: string;
  resource: string;
  details?: any;
  ip?: string;
  userAgent?: string;
  timestamp: string;
}

// Labels para exibição
export const USER_ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador',
  usuario: 'Usuário'
};

export const USER_ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  admin: 'Acesso completo ao sistema, incluindo cadastro de pessoas e configurações',
  usuario: 'Acesso limitado para consulta e registro de comparecimentos'
};