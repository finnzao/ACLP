'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePermissions, useAudit } from '@/contexts/AuthContext';
import { PermissionGuard } from '@/components/PermissionGuard';
import { usePessoas } from '@/hooks/useBackendApi';
import { 
  Lock, 
  AlertTriangle, 
  ArrowLeft, 
  UserPlus, 
  CheckCircle,
  X,
  Info,
  AlertCircle
} from 'lucide-react';
import { PessoaDTO, EstadoBrasil } from '@/types/backend';

// Componente de Alerta Melhorado
interface AlertMessageProps {
  type: 'error' | 'warning' | 'info' | 'success';
  title?: string;
  message: string;
  details?: string[];
  onClose?: () => void;
  className?: string;
}

function AlertMessage({ type, title, message, details, onClose, className = '' }: AlertMessageProps) {
  const configs = {
    error: {
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-800',
      iconColor: 'text-red-500',
      icon: AlertCircle,
      defaultTitle: 'Erro'
    },
    warning: {
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      textColor: 'text-yellow-800',
      iconColor: 'text-yellow-500',
      icon: AlertTriangle,
      defaultTitle: 'Atenção'
    },
    info: {
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-800',
      iconColor: 'text-blue-500',
      icon: Info,
      defaultTitle: 'Informação'
    },
    success: {
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-800',
      iconColor: 'text-green-500',
      icon: CheckCircle,
      defaultTitle: 'Sucesso'
    }
  };

  const config = configs[type];
  const Icon = config.icon;

  return (
    <div className={`${config.bgColor} ${config.borderColor} border rounded-lg p-4 ${className}`}>
      <div className="flex items-start">
        <Icon className={`w-5 h-5 ${config.iconColor} mt-0.5 flex-shrink-0`} />
        <div className="ml-3 flex-1">
          <h3 className={`text-sm font-medium ${config.textColor}`}>
            {title || config.defaultTitle}
          </h3>
          <div className={`mt-1 text-sm ${config.textColor}`}>
            <p>{message}</p>
            {details && details.length > 0 && (
              <ul className="mt-2 list-disc list-inside space-y-1">
                {details.map((detail, index) => (
                  <li key={index} className="text-xs">{detail}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className={`ml-3 inline-flex rounded-md ${config.bgColor} p-1.5 ${config.iconColor} hover:bg-opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-${type === 'error' ? 'red' : type === 'warning' ? 'yellow' : type === 'info' ? 'blue' : 'green'}-500`}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

// Componente principal de cadastro
function OriginalRegistrarPage() {
  const { criarPessoa } = usePessoas();
  const router = useRouter();

  // Estado do formulário usando o DTO do backend com campos de endereço na raiz
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
    // Campos de endereço na raiz
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: 'BA'
  });

  // Estados de controle
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [periodicidadeCustomizada, setPeriodicidadeCustomizada] = useState(false);
  const [diasCustomizados, setDiasCustomizados] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Estados para mensagens de API
  const [apiMessage, setApiMessage] = useState<{
    type: 'error' | 'warning' | 'info' | 'success';
    message: string;
    details?: string[];
  } | null>(null);

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
    if (!formData.cep.trim()) {
      newErrors.cep = 'CEP é obrigatório';
    }

    if (!formData.logradouro.trim()) {
      newErrors.logradouro = 'Logradouro é obrigatório';
    }

    if (!formData.bairro.trim()) {
      newErrors.bairro = 'Bairro é obrigatório';
    }

    if (!formData.cidade.trim()) {
      newErrors.cidade = 'Cidade é obrigatória';
    }

    // Validação de documentos - pelo menos um deve ser fornecido
    if (!formData.cpf?.trim() && !formData.rg?.trim()) {
      newErrors.documentos = 'Pelo menos CPF ou RG deve ser fornecido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Função para processar mensagens de erro do backend
  const processBackendError = (message: string): { message: string; details: string[] } => {
    const details: string[] = [];
    let mainMessage = message;

    // Extrair detalhes específicos da mensagem de erro
    if (message.includes('CPF já cadastrado')) {
      mainMessage = 'CPF já existe no sistema';
      details.push('Este CPF já está cadastrado para outra pessoa');
      details.push('Verifique se o CPF está correto ou busque a pessoa existente');
    } else if (message.includes('Processo já cadastrado')) {
      mainMessage = 'Processo duplicado';
      details.push('Este número de processo já está cadastrado');
      details.push('Verifique o número ou acesse o registro existente');
    } else if (message.includes('validation')) {
      mainMessage = 'Erro de validação dos dados';
      // Tentar extrair campos específicos da mensagem
      if (message.includes('nome')) details.push('Nome deve ter entre 2 e 150 caracteres');
      if (message.includes('cpf')) details.push('CPF deve seguir o formato 000.000.000-00');
      if (message.includes('processo')) details.push('Processo deve seguir o formato 0000000-00.0000.0.00.0000');
      if (message.includes('telefone')) details.push('Telefone deve ser válido');
    } else if (message.includes('Connection') || message.includes('Network')) {
      mainMessage = 'Erro de conexão';
      details.push('Não foi possível conectar ao servidor');
      details.push('Verifique sua conexão e tente novamente');
    }

    return { message: mainMessage, details };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Limpar mensagens anteriores
    setApiMessage(null);
    
    if (!validateForm()) {
      setApiMessage({
        type: 'warning',
        message: 'Corrija os erros no formulário antes de continuar',
        details: Object.values(errors)
      });
      
      // Scroll para o topo para ver a mensagem
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setLoading(true);

    try {
      // Preparar dados para envio - todos os campos já estão na estrutura correta
      const dataToSend: PessoaDTO = {
        nome: formData.nome.trim(),
        contato: formData.contato.trim(),
        processo: formData.processo.trim(),
        vara: formData.vara.trim(),
        comarca: formData.comarca.trim(),
        dataDecisao: formData.dataDecisao,
        dataComparecimentoInicial: formData.dataComparecimentoInicial,
        periodicidade: formData.periodicidade,
        // Campos de endereço
        cep: formData.cep.trim(),
        logradouro: formData.logradouro.trim(),
        bairro: formData.bairro.trim(),
        cidade: formData.cidade.trim(),
        estado: formData.estado.trim().toUpperCase(),
        // Campos opcionais
        ...(formData.numero?.trim() && { numero: formData.numero.trim() }),
        ...(formData.complemento?.trim() && { complemento: formData.complemento.trim() }),
        ...(formData.observacoes?.trim() && { observacoes: formData.observacoes.trim() }),
        ...(formData.cpf?.trim() && { cpf: formData.cpf.trim() }),
        ...(formData.rg?.trim() && { rg: formData.rg.trim() })
      };

      console.log('[Cadastro] Enviando dados para API:', dataToSend);

      const result = await criarPessoa(dataToSend);
      
      console.log('[Cadastro] Resposta da API:', result);
      
      if (result.success) {
        setSuccess(true);
        setApiMessage({
          type: 'success',
          message: 'Pessoa cadastrada com sucesso!',
          details: ['Redirecionando para a lista geral...']
        });
        
        // Redirecionar após 2 segundos
        setTimeout(() => {
          router.push('/dashboard/geral');
        }, 2000);
      } else {
        // Processar mensagem de erro do backend
        const { message, details } = processBackendError(result.message || 'Erro desconhecido');
        
        setApiMessage({
          type: 'error',
          message,
          details: details.length > 0 ? details : undefined
        });
        
        // Scroll para o topo para ver a mensagem de erro
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (error: unknown) {
      console.error('[Cadastro] Erro inesperado:', error);
      
      // Tratar erro de rede ou outros erros
      let errorMessage = 'Erro interno do sistema';
      let errorDetails: string[] = [];
      
      // Type guard para verificar se é um erro com response
      if (error && typeof error === 'object' && 'response' in error) {
        const errorWithResponse = error as { response?: { data?: { message?: string }, status?: number } };
        
        if (errorWithResponse.response) {
          // Erro de resposta do servidor
          if (errorWithResponse.response.data?.message) {
            const { message, details } = processBackendError(errorWithResponse.response.data.message);
            errorMessage = message;
            errorDetails = details;
          } else if (errorWithResponse.response.status === 400) {
            errorMessage = 'Dados inválidos';
            errorDetails = ['Verifique os dados informados e tente novamente'];
          } else if (errorWithResponse.response.status === 409) {
            errorMessage = 'Conflito de dados';
            errorDetails = ['Alguns dados já existem no sistema'];
          } else if (errorWithResponse.response.status === 500) {
            errorMessage = 'Erro no servidor';
            errorDetails = ['O servidor encontrou um erro. Tente novamente mais tarde'];
          }
        }
      } else if (error && typeof error === 'object' && 'request' in error) {
        // Erro de rede
        errorMessage = 'Erro de conexão';
        errorDetails = [
          'Não foi possível conectar ao servidor',
          'Verifique sua conexão com a internet'
        ];
      }
      
      setApiMessage({
        type: 'error',
        message: errorMessage,
        details: errorDetails.length > 0 ? errorDetails : undefined
      });
      
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
    
    // Limpar mensagem de API quando usuário começar a corrigir
    if (apiMessage?.type === 'error') {
      setApiMessage(null);
    }
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
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-green-800 mb-3">
              Cadastro Realizado com Sucesso!
            </h1>
            <p className="text-green-700 mb-6">
              A pessoa foi cadastrada no sistema e está pronta para o acompanhamento.
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-700">
              <div className="space-y-2">
                <p className="flex items-center justify-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Dados salvos com sucesso
                </p>
                <p className="flex items-center justify-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Próximo comparecimento calculado
                </p>
                <p className="text-xs text-green-600 mt-3">
                  Redirecionando para a lista geral...
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Mensagem de API no topo */}
      {apiMessage && (
        <div className="mb-6 animate-in slide-in-from-top-2">
          <AlertMessage
            type={apiMessage.type}
            message={apiMessage.message}
            details={apiMessage.details}
            onClose={() => setApiMessage(null)}
          />
        </div>
      )}

      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
            <UserPlus className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-primary-dark">Cadastrar Nova Pessoa</h1>
            <p className="text-gray-600">Preencha todos os campos obrigatórios (*)</p>
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
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors ${
                  errors.nome ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Digite o nome completo"
              />
              {errors.nome && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
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
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors ${
                  errors.contato ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="(00) 00000-0000"
              />
              {errors.contato && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.contato}
                </p>
              )}
            </div>
          </div>

          {/* Documentos */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-primary-dark border-b pb-2">Documentos</h3>
            
            {errors.documentos && (
              <AlertMessage
                type="warning"
                message={errors.documentos}
                className="mb-4"
              />
            )}
            
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
            <p className="text-sm text-gray-600 flex items-center gap-1">
              <Info className="w-4 h-4" />
              Pelo menos um documento (CPF ou RG) deve ser fornecido
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
                  value={formData.cep}
                  onChange={(e) => handleInputChange('cep', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors ${
                    errors.cep ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="00000-000"
                />
                {errors.cep && <p className="text-red-500 text-sm mt-1">{errors.cep}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Logradouro *</label>
                <input
                  type="text"
                  value={formData.logradouro}
                  onChange={(e) => handleInputChange('logradouro', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors ${
                    errors.logradouro ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Rua, Avenida, etc."
                />
                {errors.logradouro && <p className="text-red-500 text-sm mt-1">{errors.logradouro}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Número</label>
                <input
                  type="text"
                  value={formData.numero || ''}
                  onChange={(e) => handleInputChange('numero', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="123"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Complemento</label>
                <input
                  type="text"
                  value={formData.complemento || ''}
                  onChange={(e) => handleInputChange('complemento', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Apto, Casa, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bairro *</label>
                <input
                  type="text"
                  value={formData.bairro}
                  onChange={(e) => handleInputChange('bairro', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors ${
                    errors.bairro ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Nome do bairro"
                />
                {errors.bairro && <p className="text-red-500 text-sm mt-1">{errors.bairro}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cidade *</label>
                <input
                  type="text"
                  value={formData.cidade}
                  onChange={(e) => handleInputChange('cidade', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors ${
                    errors.cidade ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Nome da cidade"
                />
                {errors.cidade && <p className="text-red-500 text-sm mt-1">{errors.cidade}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Estado *</label>
                <select
                  value={formData.estado}
                  onChange={(e) => handleInputChange('estado', e.target.value)}
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
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors ${
                    errors.processo ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="0000000-00.0000.0.00.0000"
                />
                {errors.processo && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
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
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors ${
                    errors.vara ? 'border-red-300 bg-red-50' : 'border-gray-300'
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
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors ${
                    errors.comarca ? 'border-red-300 bg-red-50' : 'border-gray-300'
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
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors ${
                    errors.dataDecisao ? 'border-red-300 bg-red-50' : 'border-gray-300'
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
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors ${
                    errors.dataComparecimentoInicial ? 'border-red-300 bg-red-50' : 'border-gray-300'
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

          {/* Botões de Ação */}
          <div className="flex justify-between items-center pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex items-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              disabled={loading}
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-8 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Cadastrando...
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