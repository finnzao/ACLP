'use client';

import { useState, useEffect } from 'react';
import { MapPin, Search, AlertCircle } from 'lucide-react';
import { Endereco } from '@/types/comparecimento';
import { formatCEP } from '@/lib/utils/formatting';
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
  const { validateCEP, isLoading, lastResult } = useAddressValidation();

  // Atualizar estado local quando props mudarem
  useEffect(() => {
    setLocalEndereco(endereco);
  }, [endereco]);

  const handleInputChange = (field: keyof Endereco, value: string) => {
    const updatedEndereco = { ...localEndereco, [field]: value };
    setLocalEndereco(updatedEndereco);
    onEnderecoChange(updatedEndereco);
  };

  const handleCepChange = async (value: string) => {
    const formatted = formatCEP(value);
    handleInputChange('cep', formatted);
    setCepError('');

    // Validar CEP se tiver 8 dígitos
    const cleanCep = value.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      const result = await validateCEP(cleanCep);
      
      if (result.success && result.data) {
        const enderecoAtualizado = {
          ...localEndereco,
          cep: formatted,
          logradouro: result.data.logradouro,
          bairro: result.data.bairro,
          cidade: result.data.cidade,
          estado: result.data.estado
        };
        setLocalEndereco(enderecoAtualizado);
        onEnderecoChange(enderecoAtualizado);
      } else {
        setCepError(result.error || 'CEP não encontrado');
      }
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
              disabled={disabled}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="00000-000"
              maxLength={9}
            />
            {isLoading && (
              <div className="absolute right-3 top-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
              </div>
            )}
            {lastResult?.success && (
              <Search className="absolute right-3 top-3 w-5 h-5 text-green-500" />
            )}
          </div>
          {cepError && (
            <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {cepError}
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
            placeholder="BA"
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