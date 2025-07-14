import { useState, useCallback } from 'react';
import { Endereco } from '@/types';

interface ViaCEPResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
  erro?: boolean;
}

interface AddressValidationResult {
  success: boolean;
  data?: Endereco;
  error?: string;
}

export function useAddressValidation() {
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<AddressValidationResult | null>(null);

  const validateCEP = useCallback(async (cep: string): Promise<AddressValidationResult> => {
    const cleanCEP = cep.replace(/\D/g, '');
    
    if (cleanCEP.length !== 8) {
      const error = 'CEP deve ter 8 dígitos';
      setLastResult({ success: false, error });
      return { success: false, error };
    }

    setIsLoading(true);
    
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
      
      if (!response.ok) {
        throw new Error('Erro na consulta do CEP');
      }
      
      const data: ViaCEPResponse = await response.json();
      
      if (data.erro) {
        const error = 'CEP não encontrado';
        setLastResult({ success: false, error });
        return { success: false, error };
      }
      
      const endereco: Endereco = {
        cep: cep, // Manter formatação original
        logradouro: data.logradouro || '',
        bairro: data.bairro || '',
        cidade: data.localidade || '',
        estado: data.uf || ''
      };
      
      const result = { success: true, data: endereco };
      setLastResult(result);
      return result;
      
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      const errorMessage = 'Erro ao consultar CEP. Verifique sua conexão.';
      setLastResult({ success: false, error: errorMessage });
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const validateAddress = useCallback((endereco: Partial<Endereco>): {
    isValid: boolean;
    errors: Record<string, string>;
    warnings: Record<string, string>;
  } => {
    const errors: Record<string, string> = {};
    const warnings: Record<string, string> = {};

    // Validar CEP se preenchido
    if (endereco.cep) {
      const cleanCEP = endereco.cep.replace(/\D/g, '');
      if (cleanCEP.length !== 8) {
        errors.cep = 'CEP deve ter 8 dígitos';
      } else if (!/^\d{5}-?\d{3}$/.test(endereco.cep)) {
        warnings.cep = 'Formato recomendado: 00000-000';
      }
    }

    // Validar consistência dos dados
    if (endereco.cep && !endereco.cidade) {
      warnings.cidade = 'Cidade não preenchida para o CEP informado';
    }

    if (endereco.cep && !endereco.estado) {
      warnings.estado = 'Estado não preenchido para o CEP informado';
    }

    // Validar formato do estado
    if (endereco.estado && endereco.estado.length !== 2) {
      errors.estado = 'Estado deve ter 2 caracteres (ex: BA)';
    }

    // Validar número se preenchido
    if (endereco.numero) {
      const numero = endereco.numero.trim();
      if (numero === '0' || numero === '') {
        warnings.numero = 'Número inválido ou não informado';
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      warnings
    };
  }, []);

  const formatAddress = useCallback((endereco: Partial<Endereco>): string => {
    const parts: string[] = [];
    
    if (endereco.logradouro) {
      let address = endereco.logradouro;
      if (endereco.numero) {
        address += `, ${endereco.numero}`;
      }
      if (endereco.complemento) {
        address += `, ${endereco.complemento}`;
      }
      parts.push(address);
    }
    
    if (endereco.bairro) {
      parts.push(endereco.bairro);
    }
    
    if (endereco.cidade && endereco.estado) {
      parts.push(`${endereco.cidade} - ${endereco.estado}`);
    } else if (endereco.cidade) {
      parts.push(endereco.cidade);
    }
    
    if (endereco.cep) {
      parts.push(`CEP: ${endereco.cep}`);
    }
    
    return parts.join(', ') || 'Endereço não informado';
  }, []);

  const clearResult = useCallback(() => {
    setLastResult(null);
  }, []);

  return {
    isLoading,
    lastResult,
    validateCEP,
    validateAddress,
    formatAddress,
    clearResult
  };
}