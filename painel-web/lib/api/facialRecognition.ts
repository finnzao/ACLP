// painel-web/lib/api/facialRecognition.ts
import { createCustomError, ErrorCodes } from '@/lib/utils/errorHandler';

const API_URL = process.env.NEXT_PUBLIC_FACIAL_API_URL || 'http://localhost:5000';

export interface FacialResponse {
  success: boolean;
  message: string;
  verified?: boolean;
  confidence?: number;
  comparecimento_id?: string;
  path?: string;
}

export interface ValidationResponse {
  valid: boolean;
  message: string;
  details: {
    faceCount?: number;
    faceRatio?: number;
    brightness?: number;
    sharpness?: number;
    centered?: boolean;
    faceBox?: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  };
}

export interface CadastroInfo {
  processo: string;
  cadastrado_em: string;
}

/**
 * Validar frame em tempo real
 */
export async function validarFrame(imageBase64: string): Promise<ValidationResponse> {
  try {
    const response = await fetch(`${API_URL}/validar-frame`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: imageBase64
      }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao validar frame:', error);
    return {
      valid: false,
      message: 'Erro de conexão',
      details: {}
    };
  }
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
    
    // Tratar especificamente o caso de não haver foto cadastrada
    if (response.status === 404) {
      throw createCustomError(
        data.message || 'Não há foto cadastrada para este processo',
        ErrorCodes.NO_REFERENCE_PHOTO,
        { response: data, status: 404 }
      );
    }
    
    // Outros erros HTTP
    if (!response.ok) {
      throw createCustomError(
        data.message || 'Erro na verificação',
        ErrorCodes.VERIFICATION_ERROR,
        { response: data, status: response.status }
      );
    }

    return data;
  } catch (error: any) {
    // Re-lançar erros customizados
    if (error.code) {
      throw error;
    }
    
    // Erro de rede ou outros erros
    console.error('Erro ao verificar rosto:', error);
    throw createCustomError(
      'Erro de conexão com o servidor',
      ErrorCodes.NETWORK_ERROR,
      { originalError: error }
    );
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