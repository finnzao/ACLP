'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePermissions, useAudit } from '@/contexts/AuthContext';
import { PermissionGuard } from '@/components/PermissionGuard';
import { usePessoas } from '@/hooks/useBackendApi';
import { Lock, AlertTriangle, ArrowLeft, UserPlus, CheckCircle } from 'lucide-react';
import EnderecoForm from '@/components/EnderecoForm';
import DocumentForm from '@/components/DocumentForm';
import { PessoaDTO, EstadoBrasil } from '@/types/backend';
import { Endereco } from '@/types/index';

// Função para converter Endereco (frontend) para EnderecoDTO (backend)
function convertEnderecoToDTO(endereco: Endereco): PessoaDTO['endereco'] {
  return {
    cep: endereco.cep,
    logradouro: endereco.logradouro,
    numero: endereco.numero,
    complemento: endereco.complemento,
    bairro: endereco.bairro,
    cidade: endereco.cidade,
    estado: endereco.estado as EstadoBrasil // Conversão de string para enum
  };
}

// Componente principal de cadastro
function OriginalRegistrarPage() {
  const { criarPessoa } = usePessoas();
  const router = useRouter();

  // Estado do formulário usando o DTO do backend
  const [formData, setFormData] = useState<PessoaDTO>({
    nome: '',
    cpf: '',
    rg: '',
    contato: '',
    processo: '',
    vara: '',
    comarca: '',
    dataDecisao: '',
    dataComparecimentoInicial: '',
    periodicidade: 30,
    observacoes: '',
    endereco: {
      cep: '',
      logradouro: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      estado: EstadoBrasil.BA // Valor padrão para Bahia
    }
  });

  // Estados de controle
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [periodicidadeCustomizada, setPeriodicidadeCustomizada] = useState(false);
  const [diasCustomizados, setDiasCustomizados] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Validação do formulário
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validações obrigatórias
    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório';
    }

    if (!formData.contato.trim()) {
      newErrors.contato = 'Contato é obrigatório';
    }

    if (!formData.processo.trim()) {
      newErrors.processo = 'Número do processo é obrigatório';
    }

    if (!formData.vara.trim()) {
      newErrors.vara = 'Vara é obrigatória';
    }

    if (!formData.comarca.trim()) {
      newErrors.comarca = 'Comarca é obrigatória';
    }

    if (!formData.dataDecisao) {
      newErrors.dataDecisao = 'Data da decisão é obrigatória';
    }

    if (!formData.dataComparecimentoInicial) {
      newErrors.dataComparecimentoInicial = 'Data do primeiro comparecimento é obrigatória';
    }

    // Validação de endereço
    if (!formData.endereco.cep.trim()) {
      newErrors.cep = 'CEP é obrigatório';
    }

    if (!formData.endereco.logradouro.trim()) {
      newErrors.logradouro = 'Logradouro é obrigatório';
    }

    if (!formData.endereco.bairro.trim()) {
      newErrors.bairro = 'Bairro é obrigatório';
    }

    if (!formData.endereco.cidade.trim()) {
      newErrors.cidade = 'Cidade é obrigatória';
    }

    // Validação de documentos - pelo menos um deve ser fornecido
    if (!formData.cpf?.trim() && !formData.rg?.trim()) {
      newErrors.documentos = 'Pelo menos CPF ou RG deve ser fornecido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      alert('Corrija os erros no formulário antes de continuar.');
      return;
    }

    setLoading(true);

    try {
      // Preparar dados para envio - seguir exatamente as validações do Java
      const dataToSend: PessoaDTO = {
        nome: formData.nome.trim(),
        contato: formData.contato.trim(),
        processo: formData.processo.trim(),
        vara: formData.vara.trim(),
        comarca: formData.comarca.trim(),
        dataDecisao: formData.dataDecisao,
        dataComparecimentoInicial: formData.dataComparecimentoInicial,
        periodicidade: formData.periodicidade,
        // Campos de endereço obrigatórios
        cep: formData.cep.trim(),
        logradouro: formData.logradouro.trim(),
        bairro: formData.bairro.trim(),
        cidade: formData.cidade.trim(),
        estado: formData.estado.trim().toUpperCase(), // Garantir maiúsculo
        // Campos opcionais - só incluir se não estiverem vazios
        ...(formData.numero?.trim() && { numero: formData.numero.trim() }),
        ...(formData.complemento?.trim() && { complemento: formData.complemento.trim() }),
        ...(formData.observacoes?.trim() && { observacoes: formData.observacoes.trim() }),
        // Documentos - pelo menos um deve estar presente (validado anteriormente)
        ...(formData.cpf?.trim() && { cpf: formData.cpf.trim() }),
        ...(formData.rg?.trim() && { rg: formData.rg.trim() })
      };

      console.log('[Cadastro] Dados preparados para envio:', dataToSend);

      // Chamar API do backend
      const result = await criarPessoa(dataToSend);
      
      console.log('[Cadastro] Resultado da criação:', result);
      
      if (result.success) {
        console.log('[Cadastro] Pessoa criada com sucesso');
        setSuccess(true);
        
        // Redirecionar após 2 segundos
        setTimeout(() => {
          router.push('/dashboard/geral');
        }, 2000);
      } else {
        console.error('[Cadastro] Erro ao criar pessoa:', result.message);
        alert(`Erro ao cadastrar pessoa: ${result.message}`);
      }
    } catch (error) {
      console.error('[Cadastro] Erro inesperado:', error);
      alert('Erro interno do sistema. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof PessoaDTO, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpar erro do campo quando usuário começar a digitar
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleEnderecoChange = (endereco: Endereco) => {
    const enderecoDTO = convertEnderecoToDTO(endereco);
    setFormData(prev => ({ ...prev, endereco: enderecoDTO }));
    
    // Limpar erros de endereço
    const enderecoFields = ['cep', 'logradouro', 'bairro', 'cidade'];
    setErrors(prev => {
      const newErrors = { ...prev };
      enderecoFields.forEach(field => delete newErrors[field]);
      return newErrors;
    });
  };

  const handleDocumentChange = (field: 'cpf' | 'rg', value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpar erro de documentos quando algum documento for preenchido
    if (value.trim() && errors.documentos) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.documentos;
        return newErrors;
      });
    }
  };

  const handlePeriodicidadeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    
    if (value === 'custom') {
      setPeriodicidadeCustomizada(true);
      setDiasCustomizados('');
    } else {
      setPeriodicidadeCustomizada(false);
      handleInputChange('periodicidade', parseInt(value));
    }
  };

  const handleDiasCustomizadosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDiasCustomizados(value);
    
    if (value) {
      const dias = parseInt(value);
      if (!isNaN(dias) && dias > 0) {
        handleInputChange('periodicidade', dias);
      }
    }
  };

  // Página de sucesso
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
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
              ✅ Dados enviados para o backend<br />
              🔄 Redirecionando para a lista...
            </div>
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
            <p className="text-gray-600">Integração com backend API do TJBA</p>
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
                  errors.nome ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Digite o nome completo"
              />
              {errors.nome && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" />
                  {errors.nome}
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
                  errors.contato ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="(00) 00000-0000"
              />
              {errors.contato && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" />
                  {errors.contato}
                </p>
              )}
            </div>
          </div>

          {/* Documentos */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-primary-dark border-b pb-2">Documentos</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">CPF</label>
                <input
                  type="text"
                  value={formData.cpf || ''}
                  onChange={(e) => handleDocumentChange('cpf', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="000.000.000-00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">RG</label>
                <input
                  type="text"
                  value={formData.rg || ''}
                  onChange={(e) => handleDocumentChange('rg', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="00.000.000-0"
                />
              </div>
            </div>
            {errors.documentos && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-800 text-sm flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" />
                  {errors.documentos}
                </p>
              </div>
            )}
            <p className="text-sm text-gray-600">
              * Pelo menos um documento (CPF ou RG) deve ser fornecido
            </p>
          </div>

          {/* Endereço */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-primary-dark border-b pb-2">Endereço</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">CEP *</label>
                <input
                  type="text"
                  value={formData.endereco.cep}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    endereco: { ...prev.endereco, cep: e.target.value }
                  }))}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                    errors.cep ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="00000-000"
                />
                {errors.cep && <p className="text-red-500 text-sm mt-1">{errors.cep}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Logradouro *</label>
                <input
                  type="text"
                  value={formData.endereco.logradouro}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    endereco: { ...prev.endereco, logradouro: e.target.value }
                  }))}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                    errors.logradouro ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Rua, Avenida, etc."
                />
                {errors.logradouro && <p className="text-red-500 text-sm mt-1">{errors.logradouro}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Número</label>
                <input
                  type="text"
                  value={formData.endereco.numero || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    endereco: { ...prev.endereco, numero: e.target.value }
                  }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="123"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Complemento</label>
                <input
                  type="text"
                  value={formData.endereco.complemento || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    endereco: { ...prev.endereco, complemento: e.target.value }
                  }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Apto, Casa, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bairro *</label>
                <input
                  type="text"
                  value={formData.endereco.bairro}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    endereco: { ...prev.endereco, bairro: e.target.value }
                  }))}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                    errors.bairro ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Nome do bairro"
                />
                {errors.bairro && <p className="text-red-500 text-sm mt-1">{errors.bairro}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cidade *</label>
                <input
                  type="text"
                  value={formData.endereco.cidade}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    endereco: { ...prev.endereco, cidade: e.target.value }
                  }))}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                    errors.cidade ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Nome da cidade"
                />
                {errors.cidade && <p className="text-red-500 text-sm mt-1">{errors.cidade}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Estado *</label>
                <select
                  value={formData.endereco.estado}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    endereco: { ...prev.endereco, estado: e.target.value as EstadoBrasil }
                  }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  {Object.values(EstadoBrasil).map(estado => (
                    <option key={estado} value={estado}>{estado}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

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
                    errors.processo ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="0000000-00.0000.0.00.0000"
                />
                {errors.processo && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" />
                    {errors.processo}
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
                    errors.vara ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Ex: 1ª Vara Criminal"
                />
                {errors.vara && <p className="text-red-500 text-sm mt-1">{errors.vara}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Comarca *</label>
                <input
                  type="text"
                  value={formData.comarca}
                  onChange={(e) => handleInputChange('comarca', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                    errors.comarca ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Ex: Salvador"
                />
                {errors.comarca && <p className="text-red-500 text-sm mt-1">{errors.comarca}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Data da Decisão *</label>
                <input
                  type="date"
                  value={formData.dataDecisao}
                  onChange={(e) => handleInputChange('dataDecisao', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                    errors.dataDecisao ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.dataDecisao && <p className="text-red-500 text-sm mt-1">{errors.dataDecisao}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Data do Primeiro Comparecimento *</label>
                <input
                  type="date"
                  value={formData.dataComparecimentoInicial}
                  onChange={(e) => handleInputChange('dataComparecimentoInicial', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                    errors.dataComparecimentoInicial ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.dataComparecimentoInicial && <p className="text-red-500 text-sm mt-1">{errors.dataComparecimentoInicial}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Periodicidade (dias) *</label>
                <select
                  value={periodicidadeCustomizada ? 'custom' : formData.periodicidade.toString()}
                  onChange={handlePeriodicidadeChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="7">Semanal (7 dias)</option>
                  <option value="15">Quinzenal (15 dias)</option>
                  <option value="30">Mensal (30 dias)</option>
                  <option value="60">Bimestral (60 dias)</option>
                  <option value="90">Trimestral (90 dias)</option>
                  <option value="custom">Personalizada</option>
                </select>
              </div>
            </div>

            {periodicidadeCustomizada && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantidade de dias personalizada *
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
            )}
          </div>

          {/* Observações */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Observações</label>
            <textarea
              value={formData.observacoes || ''}
              onChange={(e) => handleInputChange('observacoes', e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Observações adicionais sobre o caso..."
            />
          </div>

          {/* Indicador de erro geral */}
          {Object.keys(errors).length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-red-800 mb-2">
                    Corrija os erros para continuar:
                  </p>
                  <ul className="text-sm text-red-700 list-disc list-inside space-y-1">
                    {Object.entries(errors).map(([field, error]) => (
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
              disabled={loading || Object.keys(errors).length > 0}
              className="flex items-center gap-2 px-8 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Enviando para API...
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