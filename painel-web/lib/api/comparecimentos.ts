/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/api/comparecimentos.ts

// Constantes e mensagens
const API_ENDPOINTS = {
    BASE: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'
  } as const;
  
  const MESSAGES = {
    SUCCESS: {
      SAVE: 'Dados salvos com sucesso!',
      UPDATE: 'Dados atualizados com sucesso!',
      DELETE: 'Registro excluído com sucesso!',
      VALIDATION: 'Comparecimento validado com sucesso!'
    },
    ERROR: {
      GENERIC: 'Ocorreu um erro inesperado',
      NETWORK: 'Erro de conexão com o servidor',
      VALIDATION: 'Dados inválidos fornecidos',
      NOT_FOUND: 'Registro não encontrado'
    },
    CONFIRMATION: {
      DELETE: 'Tem certeza que deseja excluir este registro?',
      SAVE: 'Deseja salvar as alterações?'
    }
  } as const;
  
  export interface ComparecimentoResponse {
    success: boolean;
    message: string;
    data?: any;
  }
  
  export interface RegistroComparecimento {
    processo: string;
    nome: string;
    dataComparecimento: string;
    horaComparecimento: string;
    observacoes: string;
    validadoPor: string;
    tipoValidacao: 'presencial' | 'documental' | 'justificado';
  }
  
  export interface JustificativaAusencia {
    processo: string;
    dataOcorrencia: string;
    motivo: string;
    validadoPor: string;
    anexos?: File[];
  }
  
  /**
   * Registrar comparecimento manual
   */
  export async function registrarComparecimento(dados: RegistroComparecimento): Promise<ComparecimentoResponse> {
    try {
      const response = await fetch(`${API_ENDPOINTS.BASE}/comparecimentos/registrar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dados),
      });
  
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || MESSAGES.ERROR.GENERIC);
      }
  
      return {
        success: true,
        message: data.message || MESSAGES.SUCCESS.VALIDATION,
        data: data.data
      };
    } catch (error: any) {
      console.error('Erro ao registrar comparecimento:', error);
      return {
        success: false,
        message: error.message || MESSAGES.ERROR.NETWORK
      };
    }
  }
  
  /**
   * Registrar justificativa de ausência
   */
  export async function registrarJustificativa(dados: JustificativaAusencia): Promise<ComparecimentoResponse> {
    try {
      const formData = new FormData();
      
      // Adicionar dados básicos
      Object.entries(dados).forEach(([key, value]) => {
        if (key !== 'anexos' && value !== undefined) {
          formData.append(key, value);
        }
      });
  
      // Adicionar anexos se existirem
      if (dados.anexos && dados.anexos.length > 0) {
        dados.anexos.forEach((arquivo, index) => {
          formData.append(`anexo_${index}`, arquivo);
        });
      }
  
      const response = await fetch(`${API_ENDPOINTS.BASE}/comparecimentos/justificar`, {
        method: 'POST',
        body: formData,
      });
  
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || MESSAGES.ERROR.GENERIC);
      }
  
      return {
        success: true,
        message: data.message || MESSAGES.SUCCESS.SAVE,
        data: data.data
      };
    } catch (error: any) {
      console.error('Erro ao registrar justificativa:', error);
      return {
        success: false,
        message: error.message || MESSAGES.ERROR.NETWORK
      };
    }
  }
  
  /**
   * Buscar histórico de comparecimentos de uma pessoa
   */
  export async function buscarHistoricoComparecimentos(processo: string): Promise<ComparecimentoResponse> {
    try {
      const response = await fetch(`${API_ENDPOINTS.BASE}/comparecimentos/historico/${encodeURIComponent(processo)}`);
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || MESSAGES.ERROR.GENERIC);
      }
  
      return {
        success: true,
        message: 'Histórico recuperado com sucesso',
        data: data.data
      };
    } catch (error: any) {
      console.error('Erro ao buscar histórico:', error);
      return {
        success: false,
        message: error.message || MESSAGES.ERROR.NETWORK
      };
    }
  }
  
  /**
   * Buscar comparecimentos do dia
   */
  export async function buscarComparecimentosHoje(): Promise<ComparecimentoResponse> {
    try {
      const hoje = new Date().toISOString().split('T')[0];
      const response = await fetch(`${API_ENDPOINTS.BASE}/comparecimentos/data/${hoje}`);
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || MESSAGES.ERROR.GENERIC);
      }
  
      return {
        success: true,
        message: 'Comparecimentos do dia recuperados com sucesso',
        data: data.data
      };
    } catch (error: any) {
      console.error('Erro ao buscar comparecimentos do dia:', error);
      return {
        success: false,
        message: error.message || MESSAGES.ERROR.NETWORK
      };
    }
  }
  
  /**
   * Buscar pessoas com comparecimento em determinada data
   */
  export async function buscarComparecimentosPorData(data: string): Promise<ComparecimentoResponse> {
    try {
      const response = await fetch(`${API_ENDPOINTS.BASE}/comparecimentos/data/${data}`);
      
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.message || MESSAGES.ERROR.GENERIC);
      }
  
      return {
        success: true,
        message: 'Comparecimentos recuperados com sucesso',
        data: responseData.data
      };
    } catch (error: any) {
      console.error('Erro ao buscar comparecimentos por data:', error);
      return {
        success: false,
        message: error.message || MESSAGES.ERROR.NETWORK
      };
    }
  }
  
  /**
   * Atualizar status de uma pessoa
   */
  export async function atualizarStatusPessoa(processo: string, novoStatus: 'em conformidade' | 'inadimplente'): Promise<ComparecimentoResponse> {
    try {
      const response = await fetch(`${API_ENDPOINTS.BASE}/pessoas/${encodeURIComponent(processo)}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: novoStatus }),
      });
  
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || MESSAGES.ERROR.GENERIC);
      }
  
      return {
        success: true,
        message: data.message || MESSAGES.SUCCESS.UPDATE,
        data: data.data
      };
    } catch (error: any) {
      console.error('Erro ao atualizar status:', error);
      return {
        success: false,
        message: error.message || MESSAGES.ERROR.NETWORK
      };
    }
  }
  
  /**
   * Gerar relatório de comparecimentos
   */
  export async function gerarRelatorioComparecimentos(
    dataInicio: string, 
    dataFim: string, 
    formato: 'pdf' | 'excel' = 'pdf'
  ): Promise<ComparecimentoResponse> {
    try {
      const response = await fetch(`${API_ENDPOINTS.BASE}/relatorios/comparecimentos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dataInicio,
          dataFim,
          formato
        }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || MESSAGES.ERROR.GENERIC);
      }
  
      // Para download de arquivo
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio_comparecimentos_${dataInicio}_${dataFim}.${formato}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
  
      return {
        success: true,
        message: 'Relatório gerado com sucesso'
      };
    } catch (error: any) {
      console.error('Erro ao gerar relatório:', error);
      return {
        success: false,
        message: error.message || MESSAGES.ERROR.NETWORK
      };
    }
  }
  
  /**
   * Verificar se o serviço está online
   */
  export async function verificarStatusServico(): Promise<boolean> {
    try {
      const response = await fetch(`${API_ENDPOINTS.BASE}/health`);
      return response.ok;
    } catch (error) {
      console.error('Serviço offline:', error);
      return false;
    }
  }