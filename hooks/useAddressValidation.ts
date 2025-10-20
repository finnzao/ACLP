import { useState } from 'react';
import { Endereco } from '@/types/comparecimento';

interface ValidateCEPResult {
  success: boolean;
  data?: Endereco;
  error?: string;
}

export function useAddressValidation() {
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<ValidateCEPResult | null>(null);

  /**
   * Valida e busca dados de endereço a partir do CEP
   * @param cep
   */
  const validateCEP = async (cep: string): Promise<ValidateCEPResult> => {
    setIsLoading(true);
    
    try {
      // Remover caracteres não numéricos
      const cleanCep = cep.replace(/\D/g, '');
      
      // Validar formato
      if (cleanCep.length !== 8) {
        const result = { success: false, error: 'CEP deve conter 8 dígitos' };
        setLastResult(result);
        return result;
      }

      // Consultar o serviço ViaCEP
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();

      // Verificar se houve erro na API (viacep retorna "erro": true quando não encontra)
      if (data.erro) {
        const result = { success: false, error: 'CEP não encontrado' };
        setLastResult(result);
        return result;
      }

      // Converter dados da API para o formato da aplicação
      const endereco: Endereco = {
        cep: data.cep,
        logradouro: data.logradouro,
        bairro: data.bairro,
        cidade: data.localidade,
        estado: data.uf,
      };

      const result = { success: true, data: endereco };
      setLastResult(result);
      return result;
    } catch (error) {
      console.error('Erro ao consultar CEP:', error);
      const result = { success: false, error: 'Erro ao consultar CEP. Tente novamente.' };
      setLastResult(result);
      return result;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Formatar CEP com máscara #####-###
   * @param cep CEP com ou sem formatação
   */
  const formatCEP = (cep: string): string => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length <= 5) {
      return cleanCep;
    }
    return cleanCep.replace(/^(\d{5})(\d{0,3}).*/, '$1-$2');
  };

  return {
    validateCEP,
    formatCEP,
    isLoading,
    lastResult,
  };
}