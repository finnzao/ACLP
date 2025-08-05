'use client';

import { useState, useEffect } from 'react';
import { MapPin, Search, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Endereco } from '@/types/comparecimento';
import { useAddressValidation } from '@/hooks/useAddressValidation';

interface EnderecoFormProps {
  endereco: Endereco;
  onEnderecoChange: (endereco: Endereco) => void;
  disabled?: boolean;
  showTitle?: boolean;
  className?: string;
  required?: boolean; // Novo prop para indicar se é obrigatório
}

export default function EnderecoForm({
  endereco,
  onEnderecoChange,
  disabled = false,
  showTitle = true,
  className = '',
  required = false
}: EnderecoFormProps) {
  const [localEndereco, setLocalEndereco] = useState<Endereco>(endereco);
  const [cepError, setCepError] = useState('');
  const [cepSuccess, setCepSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const { validateCEP, formatCEP, isLoading } = useAddressValidation();

  // Atualizar estado local quando props mudarem
  useEffect(() => {
    setLocalEndereco(endereco);
  }, [endereco]);

  // Validar campos obrigatórios se required for true
  useEffect(() => {
    if (required) {
      const errors: Record<string, string> = {};
      
      if (!localEndereco.cep?.trim()) {
        errors.cep = 'CEP é obrigatório';
      }
      if (!localEndereco.logradouro?.trim()) {
        errors.logradouro = 'Logradouro é obrigatório';
      }
      if (!localEndereco.bairro?.trim()) {
        errors.bairro = 'Bairro é obrigatório';
      }
      if (!localEndereco.cidade?.trim()) {
        errors.cidade = 'Cidade é obrigatória';
      }
      if (!localEndereco.estado?.trim()) {
        errors.estado = 'Estado é obrigatório';
      }
      
      setValidationErrors(errors);
    }
  }, [localEndereco, required]);

  const handleInputChange = (field: keyof Endereco, value: string) => {
    const updatedEndereco = { ...localEndereco, [field]: value };
    setLocalEndereco(updatedEndereco);
    onEnderecoChange(updatedEndereco);
    
    // Limpar erro do campo quando preenchido
    if (required && value.trim()) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    
    // Se estiver editando campos manualmente, resetar o status de sucesso do CEP
    if (field !== 'cep' && field !== 'numero' && field !== 'complemento') {
      setCepSuccess(false);
    }
  };

  const handleCepChange = async (value: string) => {
    // Limpar status
    setCepSuccess(false);
    setCepError('');
    
    // Formatar CEP
    const formatted = formatCEP(value);
    handleInputChange('cep', formatted);

    // Validar CEP se tiver 8 dígitos
    const cleanCep = value.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      try {
        const result = await validateCEP(cleanCep);
        
        if (result.success && result.data) {
          // Preencher os campos com os dados retornados
          const enderecoAtualizado = {
            ...localEndereco,
            cep: formatted,
            logradouro: result.data.logradouro || '',
            bairro: result.data.bairro || '',
            cidade: result.data.cidade || '',
            estado: result.data.estado || ''
          };
          
          // Manter número e complemento se já existirem
          if (localEndereco.numero) {
            enderecoAtualizado.numero = localEndereco.numero;
          }
          if (localEndereco.complemento) {
            enderecoAtualizado.complemento = localEndereco.complemento;
          }
          
          setLocalEndereco(enderecoAtualizado);
          onEnderecoChange(enderecoAtualizado);
          setCepSuccess(true);
          
          // Exibir mensagem de sucesso temporária
          setTimeout(() => {
            setCepSuccess(false);
          }, 3000);
        } else {
          setCepError(result.error || 'CEP não encontrado');
        }
      } catch (error) {
        console.error('Erro ao buscar CEP:', error);
        setCepError('Erro ao consultar o CEP. Tente novamente.');
      }
    }
  };

  const handleCepBlur = () => {
    // Quando o campo perder o foco, verificar se tem 8 dígitos
    const cleanCep = localEndereco.cep?.replace(/\D/g, '') || '';
    if (cleanCep.length > 0 && cleanCep.length < 8) {
      setCepError('CEP incompleto. Digite 8 dígitos.');
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {showTitle && (
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="w-5 h-5 text-primary" />
          <h4 className="text-lg font-medium text-gray-800">
            Endereço {required && <span className="text-red-500">*</span>}
          </h4>
        </div>
      )}

      {required && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-blue-800">
            <strong>Informação:</strong> Todos os campos de endereço são obrigatórios para o cadastro inicial.
          </p>
        </div>
      )}

      {/* CEP */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            CEP {required && <span className="text-red-500">*</span>}
          </label>
          <div className="relative">
            <input
              type="text"
              value={localEndereco.cep || ''}
              onChange={(e) => handleCepChange(e.target.value)}
              onBlur={handleCepBlur}
              disabled={disabled}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed
                ${cepError || validationErrors.cep ? 'border-red-300' : cepSuccess ? 'border-green-300' : 'border-gray-300'}`}
              placeholder="00000-000"
              maxLength={9}
            />
            <div className="absolute right-3 top-3">
              {isLoading && (
                <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
              )}
              {!isLoading && cepSuccess && (
                <CheckCircle className="w-5 h-5 text-green-500" />
              )}
              {!isLoading && !cepSuccess && !cepError && !validationErrors.cep && (
                <Search className="w-5 h-5 text-gray-400" />
              )}
              {!isLoading && (cepError || validationErrors.cep) && (
                <AlertCircle className="w-5 h-5 text-red-500" />
              )}
            </div>
          </div>
          {(cepError || validationErrors.cep) && (
            <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {cepError || validationErrors.cep}
            </p>
          )}
          {cepSuccess && (
            <p className="text-green-500 text-sm mt-1 flex items-center gap-1">
              <CheckCircle className="w-4 h-4" />
              Endereço encontrado!
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Estado {required && <span className="text-red-500">*</span>}
          </label>
          <input
            type="text"
            value={localEndereco.estado || ''}
            onChange={(e) => handleInputChange('estado', e.target.value.toUpperCase())}
            disabled={disabled}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed
              ${validationErrors.estado ? 'border-red-300' : 'border-gray-300'}`}
            placeholder="UF"
            maxLength={2}
          />
          {validationErrors.estado && (
            <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {validationErrors.estado}
            </p>
          )}
        </div>
      </div>

      {/* Logradouro e Número */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Logradouro {required && <span className="text-red-500">*</span>}
          </label>
          <input
            type="text"
            value={localEndereco.logradouro || ''}
            onChange={(e) => handleInputChange('logradouro', e.target.value)}
            disabled={disabled}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed
              ${validationErrors.logradouro ? 'border-red-300' : 'border-gray-300'}`}
            placeholder="Rua, Avenida, etc."
          />
          {validationErrors.logradouro && (
            <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {validationErrors.logradouro}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Número
          </label>
          <input
            type="text"
            value={localEndereco.numero || ''}
            onChange={(e) => handleInputChange('numero', e.target.value)}
            disabled={disabled}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder="123"
          />
        </div>
      </div>

      {/* Complemento e Bairro */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Complemento
          </label>
          <input
            type="text"
            value={localEndereco.complemento || ''}
            onChange={(e) => handleInputChange('complemento', e.target.value)}
            disabled={disabled}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder="Apto, Casa, etc."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bairro {required && <span className="text-red-500">*</span>}
          </label>
          <input
            type="text"
            value={localEndereco.bairro || ''}
            onChange={(e) => handleInputChange('bairro', e.target.value)}
            disabled={disabled}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed
              ${validationErrors.bairro ? 'border-red-300' : 'border-gray-300'}`}
            placeholder="Centro, Barra, etc."
          />
          {validationErrors.bairro && (
            <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {validationErrors.bairro}
            </p>
          )}
        </div>
      </div>

      {/* Cidade */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Cidade {required && <span className="text-red-500">*</span>}
        </label>
        <input
          type="text"
          value={localEndereco.cidade || ''}
          onChange={(e) => handleInputChange('cidade', e.target.value)}
          disabled={disabled}
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed
            ${validationErrors.cidade ? 'border-red-300' : 'border-gray-300'}`}
          placeholder="Salvador, Feira de Santana, etc."
        />
        {validationErrors.cidade && (
          <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {validationErrors.cidade}
          </p>
        )}
      </div>

      {/* Informação de ajuda */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-sm text-blue-800">
          <strong>Dica:</strong> Digite o CEP para preenchimento automático dos campos de endereço.
          {required && " Todos os campos marcados com * são obrigatórios."}
        </p>
      </div>

      {/* Indicador de validação geral */}
      {required && Object.keys(validationErrors).length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-800 mb-1">
                Preencha todos os campos obrigatórios:
              </p>
              <ul className="text-sm text-red-700 list-disc list-inside">
                {Object.entries(validationErrors).map(([field, error]) => (
                  <li key={field}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}