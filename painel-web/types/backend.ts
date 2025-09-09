// types/backend.ts
// Enums utilizados no backend
export enum StatusComparecimento {
  EM_CONFORMIDADE = 'EM_CONFORMIDADE',
  INADIMPLENTE = 'INADIMPLENTE'
}

export enum TipoValidacao {
  PRESENCIAL = 'PRESENCIAL',
  ONLINE = 'ONLINE',
  CADASTRO_INICIAL = 'CADASTRO_INICIAL'
}

export enum TipoUsuario {
  ADMIN = 'ADMIN',
  USUARIO = 'USUARIO'
}

export enum EstadoBrasil {
  AC = 'AC', AL = 'AL', AP = 'AP', AM = 'AM', BA = 'BA', CE = 'CE',
  DF = 'DF', ES = 'ES', GO = 'GO', MA = 'MA', MT = 'MT', MS = 'MS',
  MG = 'MG', PA = 'PA', PB = 'PB', PR = 'PR', PE = 'PE', PI = 'PI',
  RJ = 'RJ', RN = 'RN', RS = 'RS', RO = 'RO', RR = 'RR', SC = 'SC',
  SP = 'SP', SE = 'SE', TO = 'TO'
}

// =====================
// DTOs de Setup
// =====================
export interface SetupAdminDTO {
  nome: string;
  email: string;
  senha: string;
  confirmaSenha: string;
  departamento?: string;
  telefone?: string;
}

export interface SetupStatusResponse {
  configured: boolean;
  message: string;
  timestamp: string;
}

// =====================
// DTOs de Verificação de Email
// =====================
export interface SolicitarCodigoDTO {
  email: string;
  tipoUsuario: TipoUsuario;
}

export interface VerificarCodigoDTO {
  email: string;
  codigo: string;
}

export interface ReenviarCodigoDTO {
  email: string;
}

export interface VerificacaoStatusResponse {
  email: string;
  verified: boolean;
  expiresAt?: string;
}

// =====================
// DTOs de Pessoas
// =====================
export interface PessoaDTO {
  id?: number; // Opcional para criação
  nome: string; // @NotBlank, 2-150 caracteres
  cpf?: string; // Opcional, mas deve seguir padrão 000.000.000-00
  rg?: string; // Opcional, máximo 20 caracteres
  contato: string; // @NotBlank, formato de telefone válido
  processo: string; // @NotBlank, formato 0000000-00.0000.0.00.0000
  vara: string; // @NotBlank, máximo 100 caracteres
  comarca: string; // @NotBlank, máximo 100 caracteres
  dataDecisao: string; // LocalDate como string (YYYY-MM-DD)
  periodicidade: number; // @NotNull Integer
  dataComparecimentoInicial: string; // LocalDate como string
  status?: StatusComparecimento; // Calculado pelo backend
  primeiroComparecimento?: string; // LocalDate
  ultimoComparecimento?: string; // LocalDate
  proximoComparecimento?: string; // LocalDate
  observacoes?: string; // Opcional, máximo 500 caracteres
  
  // Campos de endereço - TODOS OBRIGATÓRIOS
  cep: string; // @NotBlank, formato 00000-000
  logradouro: string; // @NotBlank, 5-200 caracteres
  numero?: string; // Opcional, máximo 20 caracteres
  complemento?: string; // Opcional, máximo 100 caracteres
  bairro: string; // @NotBlank, 2-100 caracteres
  cidade: string; // @NotBlank, 2-100 caracteres
  estado: string; // @NotBlank, exatamente 2 caracteres maiúsculos [A-Z]{2}
}

export interface PessoaResponse extends PessoaDTO {
  id: number; // Sempre presente na resposta
  status: StatusComparecimento;
  proximoComparecimento: string;
  criadoEm: string; // LocalDateTime
  atualizadoEm: string; // LocalDateTime
}

// =====================
// DTOs de Comparecimentos
// =====================
export interface ComparecimentoDTO {
  pessoaId: number;
  dataComparecimento: string; // LocalDate
  horaComparecimento: string; // LocalTime (HH:mm:ss)
  tipoValidacao: TipoValidacao;
  observacoes?: string;
  validadoPor: string;
  anexos?: string; // JSON string
  mudancaEndereco: boolean;
  motivoMudancaEndereco?: string;
  novoEndereco?: EnderecoDTO; // Se mudancaEndereco = true
}

export interface ComparecimentoResponse extends ComparecimentoDTO {
  id: number;
  pessoa: PessoaResponse;
  registradoEm: string; // LocalDateTime
}

export interface EstatisticasComparecimentoResponse {
  totalPessoas: number;
  emConformidade: number;
  inadimplentes: number;
  comparecimentosHoje: number;
  comparecimentosPeriodo: number;
  percentualConformidade: number;
}

// =====================
// DTOs de Histórico de Endereços
// =====================
export interface HistoricoEnderecoResponse {
  id: number;
  pessoa: PessoaResponse;
  endereco: EnderecoDTO;
  dataInicio: string; // LocalDate
  dataFim?: string; // LocalDate
  motivo: string;
  ativo: boolean;
  criadoEm: string; // LocalDateTime
}

export interface EstatisticasEnderecoResponse {
  totalMudancas: number;
  mudancasUltimoMes: number;
  cidadesMaisFrequentes: Array<{
    cidade: string;
    count: number;
  }>;
  estadosMaisFrequentes: Array<{
    estado: EstadoBrasil;
    count: number;
  }>;
}

// =====================
// DTOs de Usuários
// =====================
export interface UsuarioDTO {
  nome: string;
  email: string;
  senha: string;
  tipo: TipoUsuario;
  departamento?: string;
  telefone?: string;
}

export interface UsuarioResponse extends Omit<UsuarioDTO, 'senha'> {
  id: number;
  ativo: boolean;
  criadoEm: string; // LocalDateTime
  ultimoLogin?: string; // LocalDateTime
}

// =====================
// Responses Padrão da API
// =====================
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

export interface ErrorResponse {
  error: string;
  message: string;
  timestamp: string;
  path: string;
  status: number;
}

// =====================
// Parâmetros de Query
// =====================
export interface PeriodoParams {
  inicio: string; // LocalDate (YYYY-MM-DD)
  fim: string; // LocalDate (YYYY-MM-DD)
}

export interface BuscarParams {
  termo: string;
  page?: number;
  size?: number;
}

export interface PaginationParams {
  page?: number;
  size?: number;
  sort?: string;
  direction?: 'ASC' | 'DESC';
}

// =====================
// Health Check Response
// =====================
export interface HealthResponse {
  status: 'UP' | 'DOWN';
  timestamp: string;
  details?: Record<string, any>;
}

export interface AppInfoResponse {
  name: string;
  version: string;
  description: string;
  environment: string;
  buildTime: string;
  javaVersion: string;
  springBootVersion: string;
}