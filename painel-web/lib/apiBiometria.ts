const API_URL = process.env.NEXT_PUBLIC_FACIAL_API_URL || 'http://localhost:5000';

export interface FacialResponse {
  success: boolean;
  message: string;
  verified?: boolean;
  confidence?: number;
  comparecimento_id?: string;
  path?: string;
}

export interface CadastroInfo {
  processo: string;
  cadastrado_em: string;
}

/**
 * Salvar foto de referência para reconhecimento facial
 */
export async function salvarRostoReferencia(processo: string, imageBase64: string): Promise<FacialResponse> {
  try {
    const response = await fetch(`${API_URL}/salvar-rosto`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        processo,
        image: imageBase64
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Erro ao salvar foto');
    }

    return data;
  } catch (error) {
    console.error('Erro ao salvar rosto:', error);
    throw error;
  }
}

/**
 * Verificar rosto contra foto de referência
 */
export async function verificarRosto(processo: string, imageBase64: string): Promise<FacialResponse> {
  try {
    const response = await fetch(`${API_URL}/verificar-rosto`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        processo,
        image: imageBase64
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Erro na verificação');
    }

    return data;
  } catch (error) {
    console.error('Erro ao verificar rosto:', error);
    throw error;
  }
}

/**
 * Confirmar comparecimento após verificação bem-sucedida
 */
export async function confirmarComparecimento(comparecimentoId: string): Promise<FacialResponse> {
  try {
    const response = await fetch(`${API_URL}/confirmar-comparecimento/${comparecimentoId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Erro ao confirmar comparecimento');
    }

    return data;
  } catch (error) {
    console.error('Erro ao confirmar comparecimento:', error);
    throw error;
  }
}

/**
 * Listar todos os cadastros com foto
 */
export async function listarCadastrosComFoto(): Promise<{ success: boolean; total: number; cadastros: CadastroInfo[] }> {
  try {
    const response = await fetch(`${API_URL}/listar-cadastros`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Erro ao listar cadastros');
    }

    return data;
  } catch (error) {
    console.error('Erro ao listar cadastros:', error);
    throw error;
  }
}

/**
 * Deletar cadastro facial
 */
export async function deletarCadastroFacial(processo: string): Promise<FacialResponse> {
  try {
    const response = await fetch(`${API_URL}/deletar-cadastro/${processo.replace(/\//g, '-')}`, {
      method: 'DELETE',
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Erro ao deletar cadastro');
    }

    return data;
  } catch (error) {
    console.error('Erro ao deletar cadastro:', error);
    throw error;
  }
}

/**
 * Verificar se o serviço de reconhecimento facial está online
 */
export async function verificarStatusServico(): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/health`);
    const data = await response.json();
    return data.status === 'healthy';
  } catch (error) {
    console.error('Serviço de reconhecimento facial offline:', error);
    return false;
  }
}