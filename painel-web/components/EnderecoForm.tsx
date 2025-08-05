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
}

export default function EnderecoForm({
  endereco,
  onEnderecoChange,
  disabled = false,
  showTitle = true,
  className = ''
}: EnderecoFormProps) {
  const [localEndereco, setLocalEndereco] = useState<Endereco>(endereco);
  const [cepError, setCepError] = useState('');
  const [cepSuccess, setCepSuccess] = useState(false);
  const { validateCEP, formatCEP, isLoading } = useAddressValidation();

  // Atualizar estado local quando props mudarem
  useEffect(() => {
    setLocalEndereco(endereco);
  }, [endereco]);

  const handleInputChange = (field: keyof Endereco, value: string) => {
    const updatedEndereco = { ...localEndereco, [field]: value };
    setLocalEndereco(updatedEndereco);
    onEnderecoChange(updatedEndereco);
    
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
          <h4 className="text-lg font-medium text-gray-800">Endereço</h4>
        </div>
      )}

      {/* CEP */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            CEP
          </label>
          <div className="relative">
            <input
              type="text"
              value={localEndereco.cep || ''}
              onChange={(e) => handleCepChange(e.target.value)}
              onBlur={handleCepBlur}
              disabled={disabled}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed
                ${cepError ? 'border-red-300' : cepSuccess ? 'border-green-300' : 'border-gray-300'}`}
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
              {!isLoading && !cepSuccess && !cepError && (
                <Search className="w-5 h-5 text-gray-400" />
              )}
              {!isLoading && cepError && (
                <AlertCircle className="w-5 h-5 text-red-500" />
              )}
            </div>
          </div>
          {cepError && (
            <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {cepError}
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
            Estado
          </label>
          <input
            type="text"
            value={localEndereco.estado || ''}
            onChange={(e) => handleInputChange('estado', e.target.value.toUpperCase())}
            disabled={disabled}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder="UF"
            maxLength={2}
          />
        </div>
      </div>

      {/* Logradouro e Número */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Logradouro
          </label>
          <input
            type="text"
            value={localEndereco.logradouro || ''}
            onChange={(e) => handleInputChange('logradouro', e.target.value)}
            disabled={disabled}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder="Rua, Avenida, etc."
          />
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
            Bairro
          </label>
          <input
            type="text"
            value={localEndereco.bairro || ''}
            onChange={(e) => handleInputChange('bairro', e.target.value)}
            disabled={disabled}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder="Centro, Barra, etc."
          />
        </div>
      </div>

      {/* Cidade */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Cidade
        </label>
        <input
          type="text"
          value={localEndereco.cidade || ''}
          onChange={(e) => handleInputChange('cidade', e.target.value)}
          disabled={disabled}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          placeholder="Salvador, Feira de Santana, etc."
        />
      </div>

      {/* Informação de ajuda */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-sm text-blue-800">
          <strong>Dica:</strong> Digite o CEP para preenchimento automático dos campos de endereço.
        </p>
      </div>
    </div>
  );
}