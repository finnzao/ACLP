'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePermissions, useAudit } from '@/contexts/AuthContext';
import { PermissionGuard } from '@/components/PermissionGuard';
import { Lock, AlertTriangle, ArrowLeft, UserPlus, CheckCircle } from 'lucide-react';
import EnderecoForm from '@/components/EnderecoForm';
import DocumentForm from '@/components/DocumentForm';
import { Endereco, Periodicidade, ComparecimentoFormData } from '@/types/comparecimento';
import { PERIODICIDADES_PADROES, PERIODOS_SUGERIDOS, formatarPeriodicidade } from '@/lib/utils/periodicidade';
import { validateComparecimentoForm, sanitizeComparecimentoData } from '@/lib/utils/validation';

// Componente original de cadastro atualizado
function OriginalRegistrarPage() {
  const [formData, setFormData] = useState<ComparecimentoFormData>({
    nome: '',
    cpf: '',
    rg: '',
    contato: '',
    processo: '',
    vara: '',
    comarca: '',
    decisao: '',
    periodicidade: PERIODICIDADES_PADROES.MENSAL as Periodicidade,
    dataComparecimentoInicial: '',
    endereco: {
      cep: '',
      logradouro: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      estado: ''
    }
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [periodicidadeCustomizada, setPeriodicidadeCustomizada] = useState(false);
  const [diasCustomizados, setDiasCustomizados] = useState('');
  const [validationState, setValidationState] = useState({
    errors: {} as Record<string, string>,
    warnings: {} as Record<string, string>,
    isValid: false
  });

  const router = useRouter();

  // Validar formulário sempre que dados mudarem
  useEffect(() => {
    const validation = validateComparecimentoForm(formData);
    setValidationState({
      errors: validation.errors,
      warnings: validation.warnings || {},
      isValid: validation.isValid
    });
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação final
    const validation = validateComparecimentoForm(formData);
    if (!validation.isValid) {
      alert(`Corrija os erros no formulário:\n${Object.values(validation.errors).join('\n')}`);
      return;
    }

    setLoading(true);

    try {
      // Sanitizar dados
      const cleanData = sanitizeComparecimentoData(formData);
      
      // Simular salvamento
      console.log('Dados para salvar:', cleanData);
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setSuccess(true);
      setTimeout(() => {
        router.push('/dashboard/geral');
      }, 2000);
    } catch (error) {
      console.error('Erro ao cadastrar:', error);
      alert('Erro ao cadastrar pessoa. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof ComparecimentoFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleEnderecoChange = (endereco: Endereco) => {
    setFormData(prev => ({ ...prev, endereco }));
  };

  const handleDocumentChange = (field: 'cpf' | 'rg', value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePeriodicidadeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    
    if (value === 'custom') {
      setPeriodicidadeCustomizada(true);
      setDiasCustomizados('');
    } else {
      setPeriodicidadeCustomizada(false);
      handleInputChange('periodicidade', parseInt(value) as Periodicidade);
    }
  };

  const handleDiasCustomizadosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDiasCustomizados(value);
    
    if (value) {
      const dias = parseInt(value);
      if (!isNaN(dias)) {
        handleInputChange('periodicidade', dias);
      }
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center border border-green-100">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-green-800 mb-3">
              Cadastro Realizado!
            </h1>
            <p className="text-green-700 mb-6">
              A pessoa foi cadastrada com sucesso no sistema.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
            <UserPlus className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-primary-dark">Cadastrar Nova Pessoa</h1>
            <p className="text-gray-600">Adicione uma nova pessoa ao sistema de comparecimentos</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Dados Pessoais */}
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-primary-dark border-b pb-2">Dados Pessoais</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nome Completo *</label>
              <input
                type="text"
                value={formData.nome}
                onChange={(e) => handleInputChange('nome', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                  validationState.errors.nome ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Digite o nome completo"
              />
              {validationState.errors.nome && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" />
                  {validationState.errors.nome}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Contato *</label>
              <input
                type="text"
                value={formData.contato}
                onChange={(e) => handleInputChange('contato', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                  validationState.errors.contato ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="(00) 00000-0000"
              />
              {validationState.errors.contato && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" />
                  {validationState.errors.contato}
                </p>
              )}
              {validationState.warnings.contato && (
                <p className="text-yellow-600 text-sm mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" />
                  {validationState.warnings.contato}
                </p>
              )}
            </div>
          </div>

          {/* Documentos */}
          <DocumentForm
            cpf={formData.cpf}
            rg={formData.rg}
            onDocumentChange={handleDocumentChange}
          />
          {validationState.errors.documentos && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-800 text-sm flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" />
                {validationState.errors.documentos}
              </p>
            </div>
          )}

          {/* Endereço */}
          <EnderecoForm
            endereco={formData.endereco}
            onEnderecoChange={handleEnderecoChange}
            required={true}
          />

          {/* Dados Processuais */}
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-primary-dark border-b pb-2">Dados Processuais</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Número do Processo *</label>
                <input
                  type="text"
                  value={formData.processo}
                  onChange={(e) => handleInputChange('processo', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                    validationState.errors.processo ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="0000000-00.0000.0.00.0000"
                />
                {validationState.errors.processo && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" />
                    {validationState.errors.processo}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Vara *</label>
                <input
                  type="text"
                  value={formData.vara}
                  onChange={(e) => handleInputChange('vara', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                    validationState.errors.vara ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Ex: 1ª Vara Criminal"
                />
                {validationState.errors.vara && (
                  <p className="text-red-500 text-sm mt-1">{validationState.errors.vara}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Comarca *</label>
                <input
                  type="text"
                  value={formData.comarca}
                  onChange={(e) => handleInputChange('comarca', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                    validationState.errors.comarca ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Ex: Salvador"
                />
                {validationState.errors.comarca && (
                  <p className="text-red-500 text-sm mt-1">{validationState.errors.comarca}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Data da Decisão *</label>
                <input
                  type="date"
                  value={formData.decisao}
                  onChange={(e) => handleInputChange('decisao', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                    validationState.errors.decisao ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {validationState.errors.decisao && (
                  <p className="text-red-500 text-sm mt-1">{validationState.errors.decisao}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Data do Primeiro Comparecimento *</label>
                <input
                  type="date"
                  value={formData.dataComparecimentoInicial}
                  onChange={(e) => handleInputChange('dataComparecimentoInicial', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                    validationState.errors.dataComparecimentoInicial ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {validationState.errors.dataComparecimentoInicial && (
                  <p className="text-red-500 text-sm mt-1">{validationState.errors.dataComparecimentoInicial}</p>
                )}
                {validationState.warnings.dataComparecimentoInicial && (
                  <p className="text-yellow-600 text-sm mt-1">{validationState.warnings.dataComparecimentoInicial}</p>
                )}
              </div>
            </div>
          </div>

          {/* Periodicidade */}
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-primary-dark border-b pb-2">Periodicidade de Comparecimento</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Periodicidade *</label>
              <select
                onChange={handlePeriodicidadeChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                {Object.entries(PERIODICIDADES_PADROES).map(([nome, dias]) => (
                  <option key={nome} value={dias}>
                    {formatarPeriodicidade(dias)}
                  </option>
                ))}
                <option value="custom">Personalizada</option>
              </select>
            </div>

            {periodicidadeCustomizada && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantidade de dias *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={diasCustomizados}
                    onChange={handleDiasCustomizadosChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Ex: 45"
                  />
                </div>

                {/* Sugestões */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Sugestões:</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {PERIODOS_SUGERIDOS.map((periodo) => (
                      <button
                        key={periodo.dias}
                        type="button"
                        onClick={() => setDiasCustomizados(periodo.dias.toString())}
                        className="text-sm px-3 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50 text-left"
                      >
                        {periodo.descricao.split('(')[0].trim()}
                        <br />
                        <span className="text-xs text-gray-500">({periodo.dias} dias)</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Validação de periodicidade */}
                {diasCustomizados && validationState.errors.periodicidade && (
                  <div className="bg-red-50 border border-red-200 rounded p-3">
                    <p className="text-sm text-red-800">{validationState.errors.periodicidade}</p>
                  </div>
                )}
              </div>
            )}

            {/* Prévia da periodicidade */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Periodicidade selecionada:</strong> {formatarPeriodicidade(formData.periodicidade)}
              </p>
            </div>
          </div>

          {/* Indicador de validação geral */}
          {Object.keys(validationState.errors).length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-red-800 mb-2">
                    Corrija os erros para continuar:
                  </p>
                  <ul className="text-sm text-red-700 list-disc list-inside space-y-1">
                    {Object.entries(validationState.errors).map(([field, error]) => (
                      <li key={field}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Botões de Ação */}
          <div className="flex justify-between items-center pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex items-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </button>

            <button
              type="submit"
              disabled={loading || !validationState.isValid}
              className="flex items-center gap-2 px-8 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Salvando...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Cadastrar Pessoa
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProtectedRegistrarPage() {
  const router = useRouter();
  const { canCreatePeople, isAdmin } = usePermissions();
  const { logAction } = useAudit();

  useEffect(() => {
    logAction('page_access', 'registrar_pessoa', { 
      hasPermission: canCreatePeople(),
      userType: isAdmin() ? 'admin' : 'usuario' 
    });
  }, [canCreatePeople, isAdmin, logAction]);

  const AccessDeniedContent = () => (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center border border-red-100">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-10 h-10 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-red-800 mb-3">Acesso Negado</h1>
          <p className="text-red-700 font-medium mb-6">
            Você não tem permissão para cadastrar novas pessoas.
          </p>
          <button
            onClick={() => router.push('/dashboard/geral')}
            className="w-full bg-primary text-white py-3 px-4 rounded-lg hover:bg-primary-dark transition-colors font-medium flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Painel Geral
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <PermissionGuard
      resource="pessoas"
      action="cadastrar"
      fallback={<AccessDeniedContent />}
      showMessage={false}
    >
      <OriginalRegistrarPage />
    </PermissionGuard>
  );
}