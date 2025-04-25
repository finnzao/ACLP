import type { Periodicidade, StatusComparecimento } from './index';

export interface Comparecimento {
  nome: string;
  cpf: string;
  rg: string;
  contato: string;
  processo: string;
  vara: string;
  comarca: string;
  decisao: string;
  periodicidade: Periodicidade;
  dataComparecimentoInicial: string;
  status: StatusComparecimento;
  primeiroComparecimento: string;
  ultimoComparecimento: string;
  proximoComparecimento: string;
}
