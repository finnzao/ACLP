/* eslint-disable @typescript-eslint/no-explicit-any */

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

// DTOs de Setup
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

// DTOs de Verificação de Email
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

// DTOs de Endereço
export interface EnderecoDTO {
  cep: string;
  logradouro: string;
  numero?: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: EstadoBrasil | string;
}


// DTOs de Pessoas
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

export interface EnderecoResponse extends EnderecoDTO {
  id: number;
  criadoEm: string;
  atualizadoEm?: string;
  version: number;
  
  // Campos calculados/derivados
  enderecoCompleto: string;
  enderecoResumido: string;
  completo: boolean;
  nomeEstado: string;
  regiaoEstado: string;
  cepSomenteNumeros: string;
  estadoBrasil: string;
}

export interface PessoaResponse extends Omit<PessoaDTO, 'cep' | 'logradouro' | 'numero' | 'complemento' | 'bairro' | 'cidade' | 'estado'> {
  // Sobrescrever campos que têm tipo diferente no response
  id: number; // Obrigatório na response
  status: StatusComparecimento; // Sempre presente na response
  primeiroComparecimento: string; // Sempre presente na response
  ultimoComparecimento: string; // Sempre presente na response
  proximoComparecimento: string; // Sempre presente na response
  endereco: EnderecoResponse; // Objeto completo em vez de campos separados
  
  // Campos de auditoria
  criadoEm: string;
  atualizadoEm?: string;
  version: number;
  
  // Relacionamentos
  historicoComparecimentos: any[]; // Array de histórico
  
  // Campos calculados/derivados
  enderecoCompleto: string;
  enderecoResumido: string;
  cep: string;
  nomeEstado: string;
  regiaoEstado: string;
  periodicidadeDescricao: string;
  comparecimentoHoje: boolean;
  documentosValidos: boolean;
  resumo: string;
  diasAtraso: number;
  enderecoValido: boolean;
  identificacao: string;
  atrasado: boolean;
  cidadeEstado: string;
}
// Interface para a resposta completa da API
export interface ListarPessoasResponse {
  success: boolean;
  message: string;
  data: PessoaResponse[];
}
// DTOs de Comparecimentos
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

// DTOs de Histórico de Endereços
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

// DTOs de Usuários
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

// Responses Padrão da API
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

// Parâmetros de Query
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

// Health Check Response
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