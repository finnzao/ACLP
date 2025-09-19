'use client';

import { useState, useEffect } from 'react';
import { X, Save, AlertCircle, User, FileText, MapPin, Calendar, Hash, Loader2 } from 'lucide-react';
import type { Comparecimento } from '@/types';
import { custodiadosService } from '@/lib/api/services';
import { useToast } from '@/components/Toast';
import { 
  formatCPF, 
  formatRG, 
  formatProcesso, 
  formatContato,
  formatCEP,
  validationUtils 
} from '@/lib/utils/formatting';
import { EstadoBrasil } from '@/types/api';

interface Props {
  dados: Comparecimento;
  onClose: () => void;
  onVoltar: () => void;
  onSave: (novo: Comparecimento) => void;
}

interface ValidationErrors {
  [key: string]: string;
}

export default function EditarSubmetidoModal({ dados, onClose, onVoltar, onSave }: Props) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  
  // Garantir que o endereço existe com valores padrão se necessário
  const enderecoInicial = dados.endereco || {
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: ''
  };
  
  const [form, setForm] = useState<Comparecimento>({
    ...dados,
    cpf: formatCPF(dados.cpf || ''),
    rg: formatRG(dados.rg || ''),
    processo: formatProcesso(dados.processo),
    contato: formatContato(dados.contato),
    // Garantir que o endereço seja sempre um objeto válido
    endereco: {
      cep: formatCEP(enderecoInicial.cep || ''),
      logradouro: enderecoInicial.logradouro || '',
      numero: enderecoInicial.numero || '',
      complemento: enderecoInicial.complemento || '',
      bairro: enderecoInicial.bairro || '',
      cidade: enderecoInicial.cidade || '',
      estado: enderecoInicial.estado?.toUpperCase() || ''
    },
    // Garantir que periodicidade seja um número
    periodicidade: typeof dados.periodicidade === 'number' 
      ? dados.periodicidade 
      : parseInt(String(dados.periodicidade)) || 30
  });

  // Estado para periodicidade personalizada
  const [periodicidadePersonalizada, setPeriodicidadePersonalizada] = useState(
    typeof form.periodicidade === 'number' ? form.periodicidade : 30
  );

  // Buscar dados completos do custodiado ao montar o componente
  useEffect(() => {
    const carregarDadosCompletos = async () => {
      if (!dados.id) return;
      
      try {
        const custodiadoId = typeof dados.id === 'string' ? parseInt(dados.id) : dados.id;
        const custodiado = await custodiadosService.buscarPorId(custodiadoId);
        
        if (custodiado) {
          // Atualizar o formulário com os dados completos incluindo endereço
          setForm(prev => ({
            ...prev,
            endereco: {
              cep: formatCEP(custodiado.endereco?.cep || ''),
              logradouro: custodiado.endereco?.logradouro || '',
              numero: custodiado.endereco?.numero || '',
              complemento: custodiado.endereco?.complemento || '',
              bairro: custodiado.endereco?.bairro || '',
              cidade: custodiado.endereco?.cidade || '',
              estado: custodiado.endereco?.estado?.toUpperCase() || ''
            }
          }));
          
          console.log('[EditarSubmetido] Dados completos carregados:', custodiado);
        }
      } catch (error) {
        console.error('[EditarSubmetido] Erro ao buscar dados completos:', error);
        // Se falhar, usar os dados já disponíveis
      }
    };
    
    carregarDadosCompletos();
  }, [dados.id]);

  // Validar formulário
  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    // Validação do nome
    if (!form.nome?.trim()) {
      newErrors.nome = 'Nome é obrigatório';
    } else if (form.nome.trim().length < 2) {
      newErrors.nome = 'Nome deve ter pelo menos 2 caracteres';
    }

    // Validação de documentos (pelo menos um)
    const cpfLimpo = form.cpf?.replace(/\D/g, '');
    const rgLimpo = form.rg?.replace(/\D/g, '');
    
    if (!cpfLimpo && !rgLimpo) {
      newErrors.documentos = 'Pelo menos CPF ou RG deve ser informado';
    }
    
    // Validar CPF se fornecido
    if (cpfLimpo && !validationUtils.isValidCPF(form.cpf)) {
      newErrors.cpf = 'CPF inválido';
    }

    // Validação do contato
    if (!form.contato?.trim()) {
      newErrors.contato = 'Contato é obrigatório';
    } else if (!validationUtils.isValidPhone(form.contato)) {
      newErrors.contato = 'Telefone inválido';
    }

    // Validação do processo
    if (!form.processo?.trim()) {
      newErrors.processo = 'Processo é obrigatório';
    } else if (!validationUtils.isValidProcess(form.processo)) {
      newErrors.processo = 'Formato de processo inválido';
    }

    // Validação da vara
    if (!form.vara?.trim()) {
      newErrors.vara = 'Vara é obrigatória';
    }

    // Validação da comarca
    if (!form.comarca?.trim()) {
      newErrors.comarca = 'Comarca é obrigatória';
    }

    // Validação da data da decisão
    if (!form.decisao) {
      newErrors.decisao = 'Data da decisão é obrigatória';
    }

    // Validação da periodicidade
    if (periodicidadePersonalizada < 1) {
      newErrors.periodicidade = 'Periodicidade deve ser maior que zero';
    } else if (periodicidadePersonalizada > 365) {
      newErrors.periodicidade = 'Periodicidade não pode ser maior que 365 dias';
    } else if (!Number.isInteger(periodicidadePersonalizada)) {
      newErrors.periodicidade = 'Periodicidade deve ser um número inteiro';
    }

    // Validação do status
    if (!form.status) {
      newErrors.status = 'Status é obrigatório';
    }

    // Validações de datas
    if (!form.ultimoComparecimento) {
      newErrors.ultimoComparecimento = 'Último comparecimento é obrigatório';
    }

    if (!form.proximoComparecimento) {
      newErrors.proximoComparecimento = 'Próximo comparecimento é obrigatório';
    }

    // Validação de endereço (campos obrigatórios)
    if (form.endereco) {
      if (!form.endereco.cep?.trim()) {
        newErrors.cep = 'CEP é obrigatório';
      } else if (!validationUtils.isValidCEP(form.endereco.cep)) {
        newErrors.cep = 'CEP inválido';
      }

      if (!form.endereco.logradouro?.trim()) {
        newErrors.logradouro = 'Logradouro é obrigatório';
      }

      if (!form.endereco.bairro?.trim()) {
        newErrors.bairro = 'Bairro é obrigatório';
      }

      if (!form.endereco.cidade?.trim()) {
        newErrors.cidade = 'Cidade é obrigatória';
      }

      if (!form.endereco.estado?.trim()) {
        newErrors.estado = 'Estado é obrigatório';
      } else if (form.endereco.estado.length !== 2) {
        newErrors.estado = 'Estado deve ter 2 letras';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manipulador de mudanças genérico
  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;

    // Limpar erro do campo quando o usuário começar a digitar
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }

    // Formatadores específicos
    const formatters: Record<string, (v: string) => string> = {
      cpf: formatCPF,
      rg: formatRG,
      processo: formatProcesso,
      contato: formatContato,
    };

    const formattedValue = formatters[name] ? formatters[name](value) : value;
    setForm((prev) => ({ ...prev, [name]: formattedValue }));
  }

  // Manipulador para campos de endereço
  function handleEnderecoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    
    // Limpar erro do campo
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }

    let formattedValue = value;
    
    // Formatar CEP
    if (name === 'cep') {
      formattedValue = formatCEP(value);
    }
    
    // Formatar estado para maiúsculas
    if (name === 'estado') {
      formattedValue = value.toUpperCase().slice(0, 2);
    }

    setForm(prev => ({
      ...prev,
      endereco: {
        ...prev.endereco,
        [name]: formattedValue
      }
    }));
  }

  // Buscar endereço pelo CEP
  async function buscarEnderecoPorCEP(cep: string) {
    const cepLimpo = cep.replace(/\D/g, '');
    
    if (cepLimpo.length !== 8) return;
    
    try {
      setLoading(true);
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await response.json();
      
      if (!data.erro) {
        setForm(prev => ({
          ...prev,
          endereco: {
            ...prev.endereco,
            cep: formatCEP(cepLimpo),
            logradouro: data.logradouro || prev.endereco.logradouro,
            bairro: data.bairro || prev.endereco.bairro,
            cidade: data.localidade || prev.endereco.cidade,
            estado: data.uf || prev.endereco.estado
          }
        }));
        
        showToast({
          type: 'success',
          title: 'CEP encontrado',
          message: 'Endereço preenchido automaticamente',
          duration: 3000
        });
      }
    } catch (error) {
      console.error('[EditarSubmetido] Erro ao buscar CEP:', error);
    } finally {
      setLoading(false);
    }
  }

  // Manipulador para periodicidade
  function handlePeriodicidadeChange(value: string) {
    const numValue = parseInt(value) || 0;
    
    // Limpar erro
    if (errors.periodicidade) {
      setErrors(prev => ({ ...prev, periodicidade: '' }));
    }

    // Validação em tempo real
    if (numValue > 365) {
      setErrors(prev => ({ ...prev, periodicidade: 'Máximo de 365 dias' }));
      return;
    }

    setPeriodicidadePersonalizada(numValue);
    setForm(prev => ({ ...prev, periodicidade: numValue }));
  }

  // Submeter formulário
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Validar formulário
    if (!validateForm()) {
      showToast({
        type: 'error',
        title: 'Erro na validação',
        message: 'Verifique os campos destacados e tente novamente',
        duration: 5000
      });
      return;
    }

    setLoading(true);

    try {
      // Preparar dados para API
      const dadosAtualizacao = {
        nome: form.nome.trim(),
        cpf: form.cpf?.replace(/\D/g, '') || undefined,
        rg: form.rg?.replace(/\D/g, '') || undefined,
        contato: form.contato.replace(/\D/g, ''),
        processo: form.processo.replace(/\D/g, ''),
        vara: form.vara.trim(),
        comarca: form.comarca.trim(),
        dataDecisao: form.decisao,
        periodicidade: periodicidadePersonalizada,
        dataComparecimentoInicial: form.dataComparecimentoInicial || form.decisao,
        observacoes: form.observacoes?.trim(),
        // Campos de endereço - garantir que existem
        cep: form.endereco?.cep?.replace(/\D/g, '') || '',
        logradouro: form.endereco?.logradouro?.trim() || '',
        numero: form.endereco?.numero?.trim() || '',
        complemento: form.endereco?.complemento?.trim() || '',
        bairro: form.endereco?.bairro?.trim() || '',
        cidade: form.endereco?.cidade?.trim() || '',
        estado: (form.endereco?.estado?.toUpperCase() || 'BA') as EstadoBrasil
      };

      // Converter ID para número
      const custodiadoId = typeof form.id === 'string' ? parseInt(form.id) : form.id;
      
      if (!custodiadoId) {
        throw new Error('ID do custodiado inválido');
      }

      console.log('[EditarSubmetido] Atualizando custodiado:', custodiadoId, dadosAtualizacao);

      // Chamar API
      const resultado = await custodiadosService.atualizar(custodiadoId, dadosAtualizacao);

      if (resultado.success) {
        showToast({
          type: 'success',
          title: 'Sucesso',
          message: 'Dados atualizados com sucesso!',
          duration: 3000
        });

        // Atualizar dados localmente
        const dadosAtualizados = {
          ...form,
          periodicidade: periodicidadePersonalizada
        };
        
        onSave(dadosAtualizados);
        onClose();
      } else {
        throw new Error(resultado.message || 'Erro ao atualizar dados');
      }
    } catch (error: any) {
      console.error('[EditarSubmetido] Erro:', error);
      
      showToast({
        type: 'error',
        title: 'Erro ao atualizar',
        message: error.message || 'Erro ao atualizar dados. Tente novamente.',
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
      <form
        onSubmit={handleSubmit}
        className="relative bg-white p-8 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b">
          <h3 className="text-2xl font-bold text-primary-dark">Editar Dados do Custodiado</h3>
          <button
            onClick={onClose}
            type="button"
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Indicador de carregamento de dados */}
        {loading && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
              <p className="text-sm text-blue-700">Carregando dados completos...</p>
            </div>
          </div>
        )}

        {/* Mensagem de erro geral */}
        {errors.documentos && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <p className="text-sm text-red-700">{errors.documentos}</p>
            </div>
          </div>
        )}

        {/* Seção: Dados Pessoais */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-primary" />
            <h4 className="text-lg font-semibold text-gray-800">Dados Pessoais</h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome <span className="text-red-500">*</span>
              </label>
              <input 
                className={`w-full border ${errors.nome ? 'border-red-500' : 'border-gray-300'} p-2 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent`}
                name="nome" 
                value={form.nome} 
                onChange={handleChange}
                disabled={loading}
              />
              {errors.nome && <p className="text-red-500 text-xs mt-1">{errors.nome}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contato <span className="text-red-500">*</span>
              </label>
              <input 
                className={`w-full border ${errors.contato ? 'border-red-500' : 'border-gray-300'} p-2 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent`}
                name="contato" 
                value={form.contato}
                onChange={handleChange}
                placeholder="(00) 00000-0000"
                disabled={loading}
              />
              {errors.contato && <p className="text-red-500 text-xs mt-1">{errors.contato}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
              <input 
                className={`w-full border ${errors.cpf ? 'border-red-500' : 'border-gray-300'} p-2 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent`}
                name="cpf" 
                value={form.cpf} 
                onChange={handleChange}
                placeholder="000.000.000-00"
                disabled={loading}
              />
              {errors.cpf && <p className="text-red-500 text-xs mt-1">{errors.cpf}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">RG</label>
              <input 
                className={`w-full border ${errors.rg ? 'border-red-500' : 'border-gray-300'} p-2 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent`}
                name="rg" 
                value={form.rg} 
                onChange={handleChange}
                placeholder="00.000.000-0"
                disabled={loading}
              />
              {errors.rg && <p className="text-red-500 text-xs mt-1">{errors.rg}</p>}
            </div>
          </div>
        </div>

        {/* Seção: Dados Processuais */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-primary" />
            <h4 className="text-lg font-semibold text-gray-800">Dados Processuais</h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número do Processo <span className="text-red-500">*</span>
              </label>
              <input 
                className={`w-full border ${errors.processo ? 'border-red-500' : 'border-gray-300'} p-2 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-mono`}
                name="processo" 
                value={form.processo} 
                onChange={handleChange}
                placeholder="0000000-00.0000.0.00.0000"
                disabled={loading}
              />
              {errors.processo && <p className="text-red-500 text-xs mt-1">{errors.processo}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data da Decisão <span className="text-red-500">*</span>
              </label>
              <input 
                type="date" 
                className={`w-full border ${errors.decisao ? 'border-red-500' : 'border-gray-300'} p-2 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent`}
                name="decisao" 
                value={form.decisao} 
                onChange={handleChange}
                disabled={loading}
              />
              {errors.decisao && <p className="text-red-500 text-xs mt-1">{errors.decisao}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vara <span className="text-red-500">*</span>
              </label>
              <input 
                className={`w-full border ${errors.vara ? 'border-red-500' : 'border-gray-300'} p-2 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent`}
                name="vara" 
                value={form.vara} 
                onChange={handleChange}
                disabled={loading}
              />
              {errors.vara && <p className="text-red-500 text-xs mt-1">{errors.vara}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Comarca <span className="text-red-500">*</span>
              </label>
              <input 
                className={`w-full border ${errors.comarca ? 'border-red-500' : 'border-gray-300'} p-2 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent`}
                name="comarca" 
                value={form.comarca} 
                onChange={handleChange}
                disabled={loading}
              />
              {errors.comarca && <p className="text-red-500 text-xs mt-1">{errors.comarca}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status <span className="text-red-500">*</span>
              </label>
              <select 
                className={`w-full border ${errors.status ? 'border-red-500' : 'border-gray-300'} p-2 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent`}
                name="status" 
                value={form.status} 
                onChange={handleChange}
                disabled={loading}
              >
                <option value="em conformidade">Em Conformidade</option>
                <option value="inadimplente">Inadimplente</option>
              </select>
              {errors.status && <p className="text-red-500 text-xs mt-1">{errors.status}</p>}
            </div>
          </div>
        </div>

        {/* Seção: Periodicidade e Datas */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-primary" />
            <h4 className="text-lg font-semibold text-gray-800">Periodicidade e Datas</h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Hash className="w-4 h-4 inline mr-1" />
                Periodicidade (dias) <span className="text-red-500">*</span>
              </label>
              <input 
                type="number"
                min="1"
                max="365"
                className={`w-full border ${errors.periodicidade ? 'border-red-500' : 'border-gray-300'} p-2 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent`}
                value={periodicidadePersonalizada}
                onChange={(e) => handlePeriodicidadeChange(e.target.value)}
                disabled={loading}
              />
              {errors.periodicidade && <p className="text-red-500 text-xs mt-1">{errors.periodicidade}</p>}
              <p className="text-gray-500 text-xs mt-1">Digite o número de dias entre comparecimentos</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Último Comparecimento <span className="text-red-500">*</span>
              </label>
              <input 
                type="date" 
                className={`w-full border ${errors.ultimoComparecimento ? 'border-red-500' : 'border-gray-300'} p-2 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent`}
                name="ultimoComparecimento" 
                value={form.ultimoComparecimento} 
                onChange={handleChange}
                disabled={loading}
              />
              {errors.ultimoComparecimento && <p className="text-red-500 text-xs mt-1">{errors.ultimoComparecimento}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Próximo Comparecimento <span className="text-red-500">*</span>
              </label>
              <input 
                type="date" 
                className={`w-full border ${errors.proximoComparecimento ? 'border-red-500' : 'border-gray-300'} p-2 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent`}
                name="proximoComparecimento" 
                value={form.proximoComparecimento} 
                onChange={handleChange}
                disabled={loading}
              />
              {errors.proximoComparecimento && <p className="text-red-500 text-xs mt-1">{errors.proximoComparecimento}</p>}
            </div>
          </div>
        </div>

        {/* Seção: Endereço */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-primary" />
            <h4 className="text-lg font-semibold text-gray-800">Endereço</h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CEP <span className="text-red-500">*</span>
              </label>
              <input 
                className={`w-full border ${errors.cep ? 'border-red-500' : 'border-gray-300'} p-2 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent`}
                name="cep"
                value={form.endereco?.cep || ''}
                onChange={handleEnderecoChange}
                onBlur={(e) => buscarEnderecoPorCEP(e.target.value)}
                placeholder="00000-000"
                maxLength={9}
                disabled={loading}
              />
              {errors.cep && <p className="text-red-500 text-xs mt-1">{errors.cep}</p>}
              <p className="text-gray-500 text-xs mt-1">Digite o CEP para buscar o endereço</p>
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Logradouro <span className="text-red-500">*</span>
              </label>
              <input 
                className={`w-full border ${errors.logradouro ? 'border-red-500' : 'border-gray-300'} p-2 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent`}
                name="logradouro"
                value={form.endereco?.logradouro || ''}
                onChange={handleEnderecoChange}
                disabled={loading}
              />
              {errors.logradouro && <p className="text-red-500 text-xs mt-1">{errors.logradouro}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Número</label>
              <input 
                className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                name="numero"
                value={form.endereco?.numero || ''}
                onChange={handleEnderecoChange}
                disabled={loading}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Complemento</label>
              <input 
                className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                name="complemento"
                value={form.endereco?.complemento || ''}
                onChange={handleEnderecoChange}
                disabled={loading}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bairro <span className="text-red-500">*</span>
              </label>
              <input 
                className={`w-full border ${errors.bairro ? 'border-red-500' : 'border-gray-300'} p-2 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent`}
                name="bairro"
                value={form.endereco?.bairro || ''}
                onChange={handleEnderecoChange}
                disabled={loading}
              />
              {errors.bairro && <p className="text-red-500 text-xs mt-1">{errors.bairro}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cidade <span className="text-red-500">*</span>
              </label>
              <input 
                className={`w-full border ${errors.cidade ? 'border-red-500' : 'border-gray-300'} p-2 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent`}
                name="cidade"
                value={form.endereco?.cidade || ''}
                onChange={handleEnderecoChange}
                disabled={loading}
              />
              {errors.cidade && <p className="text-red-500 text-xs mt-1">{errors.cidade}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado (UF) <span className="text-red-500">*</span>
              </label>
              <input 
                className={`w-full border ${errors.estado ? 'border-red-500' : 'border-gray-300'} p-2 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent`}
                name="estado"
                value={form.endereco?.estado || ''}
                onChange={handleEnderecoChange}
                placeholder="BA"
                maxLength={2}
                disabled={loading}
              />
              {errors.estado && <p className="text-red-500 text-xs mt-1">{errors.estado}</p>}
            </div>
          </div>
        </div>

        {/* Observações */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
          <textarea
            className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            name="observacoes"
            value={form.observacoes || ''}
            onChange={handleChange}
            rows={3}
            maxLength={500}
            disabled={loading}
          />
          <p className="text-gray-500 text-xs mt-1">
            {form.observacoes?.length || 0}/500 caracteres
          </p>
        </div>

        {/* Botões de Ação */}
        <div className="pt-4 flex justify-between border-t">
          <button
            type="button"
            onClick={onVoltar}
            disabled={loading}
            className="bg-gray-200 text-gray-700 px-5 py-2 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Voltar
          </button>

          <button
            type="submit"
            disabled={loading}
            className="bg-primary text-white px-5 py-2 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Salvar Alterações
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}