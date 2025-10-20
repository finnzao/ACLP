/* eslint-disable @typescript-eslint/no-explicit-any */

// Enums

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
  AC = 'AC', AL = 'AL', AP = 'AP', AM = 'AM', BA = 'BA',
  CE = 'CE', DF = 'DF', ES = 'ES', GO = 'GO', MA = 'MA',
  MT = 'MT', MS = 'MS', MG = 'MG', PA = 'PA', PB = 'PB',
  PR = 'PR', PE = 'PE', PI = 'PI', RJ = 'RJ', RN = 'RN',
  RS = 'RS', RO = 'RO', RR = 'RR', SC = 'SC', SP = 'SP',
  SE = 'SE', TO = 'TO'
}

// DTOs - Data Transfer Objects

export interface EnderecoDTO {
  cep: string;
  logradouro: string;
  numero?: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
}

export interface CustodiadoDTO {
  nome: string;
  cpf?: string;
  rg?: string;
  contato: string;
  processo: string;
  vara: string;
  comarca: string;
  dataDecisao: string;
  periodicidade: number;
  dataComparecimentoInicial: string;
  observacoes?: string;
  cep: string;
  logradouro: string;
  numero?: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
}

export interface ComparecimentoDTO {
  custodiadoId: number;
  dataComparecimento: string;
  horaComparecimento: string;
  tipoValidacao: TipoValidacao | string;
  observacoes?: string;
  validadoPor: string;
  anexos?: string;
  mudancaEndereco?: boolean;
  motivoMudancaEndereco?: string;
  novoEndereco?: EnderecoDTO;
}

export interface UsuarioDTO {
  nome: string;
  email: string;
  senha?: string;
  tipo: TipoUsuario | string;
  departamento?: string;
  telefone?: string;
  ativo?: boolean;
}

export interface SetupAdminDTO {
  nome: string;
  email: string;
  senha: string;
  confirmaSenha: string;
  departamento?: string;
  telefone?: string;
}

export interface SolicitarCodigoDTO {
  email: string;
  tipoUsuario?: TipoUsuario | string;
}

export interface VerificarCodigoDTO {
  email: string;
  codigo: string;
}

export interface ReenviarCodigoDTO {
  email: string;
}

// Response Types

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  timestamp?: string;
  status?: number;
  error?: string;
}

export interface CustodiadoResponse {
  id: number;
  nome: string;
  cpf?: string;
  rg?: string;
  contato: string;
  processo: string;
  vara: string;
  comarca: string;
  dataDecisao: string;
  periodicidade: number;
  periodicidadeDescricao: string;
  dataComparecimentoInicial: string;
  status: StatusComparecimento | string;
  ultimoComparecimento: string;
  proximoComparecimento: string;
  diasAtraso: number;
  observacoes?: string;
  endereco: EnderecoResponse;
  criadoEm: string;
  atualizadoEm: string | null;
  identificacao: string;
  inadimplente: boolean;
  comparecimentoHoje: boolean;
  atrasado?: boolean;
  enderecoCompleto?: string;
  cidadeEstado?: string;
}

export interface ListarCustodiadosResponse {
  success: boolean;
  message: string;
  data: CustodiadoResponse[];
  timestamp?: string;
  total?: number;
}

export function isListarCustodiadosResponse(data: any): data is ListarCustodiadosResponse {
  return (
    data &&
    typeof data === 'object' &&
    typeof data.success === 'boolean' &&
    typeof data.message === 'string' &&
    Array.isArray(data.data)
  );
}

export function isCustodiadoResponse(data: any): data is CustodiadoResponse {
  return (
    data &&
    typeof data === 'object' &&
    typeof data.id === 'number' &&
    typeof data.nome === 'string' &&
    typeof data.processo === 'string' &&
    typeof data.status === 'string' &&
    data.endereco &&
    typeof data.endereco === 'object'
  );
}

export interface ComparecimentoResponse {
  id: number;
  custodiadoId: number;
  custodiadoNome?: string;
  nomeCustodiado?: string;
  processoCustodiado?: string;
  dataComparecimento: string;
  horaComparecimento: string;
  tipoValidacao: TipoValidacao | string;
  observacoes?: string;
  validadoPor: string;
  anexos?: string;
  mudancaEndereco?: boolean;
  motivoMudancaEndereco?: string;
  criadoEm: string;
  atualizadoEm?: string;
  version?: number;
}

export interface ListarComparecimentosParams {
  page?: number;
  size?: number;
}

export interface ListarComparecimentosResponse {
  comparecimentos: ComparecimentoResponse[];
  paginaAtual: number;
  totalPaginas: number;
  totalItens: number;
  itensPorPagina: number;
  temProxima?: boolean;
  temAnterior?: boolean;
}

export interface EnderecoResponse {
  id: number;
  cep: string;
  logradouro: string;
  numero?: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  nomeEstado: string;
  regiaoEstado: string;
  dataInicio: string;
  dataFim: string | null;
  ativo: boolean;
  motivoAlteracao?: string;
  validadoPor?: string;
  enderecoCompleto: string;
  enderecoResumido: string;
  diasResidencia: number;
  periodoResidencia: string;
  criadoEm: string;
  atualizadoEm: string | null;
}

export interface HistoricoEnderecoResponse {
  id: number;
  custodiadoId: number;
  endereco: EnderecoDTO;
  dataInicio: string;
  dataFim?: string;
  enderecoAtivo: boolean;
  motivoAlteracao?: string;
  criadoEm: string;
}

export interface UsuarioResponse {
  id: number;
  nome: string;
  email: string;
  tipo: TipoUsuario | string;
  departamento?: string;
  telefone?: string;
  ativo: boolean;
  criadoEm: string;
  ultimoLogin?: string;
  atualizadoEm?: string;
}

export interface EstatisticasComparecimentoResponse {
  periodo?: {
    dataInicio?: string;
    dataFim?: string;
  };
  totalComparecimentos: number;
  comparecimentosPresenciais: number;
  comparecimentosOnline: number;
  cadastrosIniciais: number;
  mudancasEndereco: number;
  mediaDiasEntreMudancas?: number;
  percentualPresencial?: number;
  percentualOnline?: number;
}

export interface ResumoSistemaResponse {
  totalCustodiados: number;
  custodiadosEmConformidade: number;
  custodiadosInadimplentes: number;
  comparecimentosHoje: number;
  comparecimentosAtrasados?: number;
  proximosComparecimentos7Dias?: number;
  totalComparecimentos?: number;
  totalComparecimentosRegistrados?: number;
  comparecimentosEsteMes?: number;
  totalMudancasEndereco?: number;
  enderecosAtivos?: number;
  custodiadosSemHistorico?: number;
  custodiadosSemEnderecoAtivo?: number;
  percentualConformidade?: number;
  percentualInadimplencia?: number;
  dataConsulta?: string;
  ultimaAtualizacao?: string;
  analiseAtrasos?: {
    totalCustodiadosAtrasados: number;
    totalAtrasados30Dias: number;
    totalAtrasados60Dias: number;
    totalAtrasados90Dias: number;
    mediaDiasAtraso: number;
  };
  totalPessoas?: number;
  emConformidade?: number;
  inadimplentes?: number;
  atrasados?: number;
  proximos7Dias?: number;
  proximosComparecimentos?: CustodiadoResponse[];
  alertasUrgentes?: CustodiadoResponse[];
  pessoasAtrasadas?: CustodiadoResponse[];
}

export interface EstatisticasEnderecoResponse {
  totalMudancas: number;
  mudancasUltimoMes: number;
  cidadesMaisFrequentes: Array<{ cidade: string; total: number }>;
  estadosMaisFrequentes: Array<{ estado: string; total: number }>;
}

export interface SetupStatusResponse {
  setupRequired?: boolean;
  setupCompleted?: boolean;
  configured?: boolean;
  appName?: string;
  version?: string;
  message?: string;
  timestamp: string;
}

export interface VerificacaoStatusResponse {
  email: string;
  verified: boolean;
  validadePorMinutos?: number;
  tentativasPermitidas?: number;
}

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

// Parametros de Consulta

export interface PeriodoParams {
  inicio?: string;
  fim?: string;
  dataInicio?: string;
  dataFim?: string;
}

export interface BuscarParams {
  termo?: string;
  nome?: string;
  cpf?: string;
  processo?: string;
  status?: 'EM_CONFORMIDADE' | 'INADIMPLENTE';
  dataInicio?: string;
  dataFim?: string;
  page?: number;
  size?: number;
}

export interface PaginationParams {
  page?: number;
  size?: number;
  sort?: string;
  direction?: 'ASC' | 'DESC';
}

export interface StatusVerificacaoResponse {
  pessoasMarcadas: number;
  executadoEm: string;
  tipo: string;
}

export interface StatusEstatisticasResponse {
  totalCustodiados: number;
  emConformidade: number;
  inadimplentes: number;
  dataConsulta: string;
  percentualConformidade: number;
}

export interface LoginRequest {
  email: string;
  senha: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  usuario: {
    id: number;
    nome: string;
    email: string;
    tipo: string;
    departamento?: string;
    telefone?: string;
    ultimoLogin?: string;
  };
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AlterarSenhaRequest {
  senhaAtual: string;
  novaSenha: string;
  confirmaSenha: string;
}

export interface ConviteDTO {
  nome: string;
  email: string;
  tipoUsuario: 'ADMIN' | 'USUARIO';
  departamento?: string;
  telefone?: string;
  validadeHoras?: number;
}

export interface ConviteResponse {
  id: number;
  nome: string;
  email: string;
  tipoUsuario: string;
  departamento?: string;
  telefone?: string;
  token: string;
  dataExpiracao: string;
  status: string;
  criadoEm: string;
  criadoPor: string;
}

export interface AceitarConviteRequest {
  token: string;
  senha: string;
  confirmaSenha: string;
}

export interface ReenviarConviteRequest {
  novaValidadeHoras?: number;
}