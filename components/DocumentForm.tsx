'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, FileText, User } from 'lucide-react';
import { validateDocuments, getDocumentSummary } from '@/lib/utils/validation';
import { formatCPF, formatRG } from '@/lib/utils/formatting';

interface DocumentFormProps {
  cpf?: string;
  rg?: string;
  onDocumentChange: (field: 'cpf' | 'rg', value: string) => void;
  disabled?: boolean;
  className?: string;
}

export default function DocumentForm({
  cpf = '',
  rg = '',
  onDocumentChange,
  disabled = false,
  className = ''
}: DocumentFormProps) {
  const [localCpf, setLocalCpf] = useState(cpf);
  const [localRg, setLocalRg] = useState(rg);
  const [validation, setValidation] = useState<{ isValid: boolean; error?: string }>({ isValid: true });

  // Atualizar estados locais quando props mudarem
  useEffect(() => {
    setLocalCpf(cpf);
    setLocalRg(rg);
  }, [cpf, rg]);

  // Validar documentos quando mudarem
  useEffect(() => {
    const result = validateDocuments(localCpf, localRg);
    setValidation(result);
  }, [localCpf, localRg]);

  const handleCpfChange = (value: string) => {
    const formatted = formatCPF(value);
    setLocalCpf(formatted);
    onDocumentChange('cpf', formatted);
  };

  const handleRgChange = (value: string) => {
    const formatted = formatRG(value);
    setLocalRg(formatted);
    onDocumentChange('rg', formatted);
  };

  const documentSummary = getDocumentSummary(localCpf, localRg);
  const hasAnyDocument = !!(localCpf?.trim() || localRg?.trim());

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-5 h-5 text-primary" />
        <h4 className="text-lg font-medium text-gray-800">
          Documentos de Identificação
          <span className="text-red-500 ml-1">*</span>
        </h4>
      </div>

      {/* Informação sobre obrigatoriedade */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-800 mb-1">
              Pelo menos um documento deve ser informado
            </p>
            <p className="text-sm text-blue-700">
              Você pode informar apenas o CPF, apenas o RG, ou ambos os documentos.
            </p>
          </div>
        </div>
      </div>

      {/* Campos de documento */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* CPF */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            CPF
            <span className="text-gray-500 text-xs ml-1">(opcional)</span>
          </label>
          <div className="relative">
            <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={localCpf}
              onChange={(e) => handleCpfChange(e.target.value)}
              disabled={disabled}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="000.000.000-00"
              maxLength={14}
            />
          </div>
        </div>

        {/* RG */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            RG
            <span className="text-gray-500 text-xs ml-1">(opcional)</span>
          </label>
          <div className="relative">
            <FileText className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={localRg}
              onChange={(e) => handleRgChange(e.target.value)}
              disabled={disabled}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="00.000.000-0"
              maxLength={12}
            />
          </div>
        </div>
      </div>

      {/* Status da validação */}
      <div className="mt-4">
        {!validation.isValid && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-800 mb-1">Documento obrigatório</p>
                <p className="text-sm text-red-700">{validation.error}</p>
              </div>
            </div>
          </div>
        )}

        {validation.isValid && hasAnyDocument && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-green-800 mb-1">Documentos válidos</p>
                <p className="text-sm text-green-700">{documentSummary}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Dicas de preenchimento */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
        <h5 className="text-sm font-medium text-gray-800 mb-2">Dicas de preenchimento:</h5>
        <ul className="text-sm text-gray-600 space-y-1">
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>CPF: Informe apenas números ou use o formato 000.000.000-00</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>RG: Informe apenas números ou use o formato 00.000.000-0</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Pelo menos um dos dois documentos deve ser preenchido</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Se possível, informe ambos os documentos para maior segurança</span>
          </li>
        </ul>
      </div>

      {/* Indicador visual da obrigatoriedade */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">
          Status: {documentSummary}
        </span>
        {validation.isValid && hasAnyDocument && (
          <span className="flex items-center gap-1 text-green-600">
            <CheckCircle className="w-4 h-4" />
            Válido
          </span>
        )}
        {!validation.isValid && (
          <span className="flex items-center gap-1 text-red-600">
            <AlertCircle className="w-4 h-4" />
            Pendente
          </span>
        )}
      </div>
    </div>
  );
}