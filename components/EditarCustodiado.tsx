/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { X, Save, AlertCircle, User, FileText, MapPin, Calendar, Hash, Loader2 } from 'lucide-react';
import type { Comparecimento } from '@/types';
import { custodiadosService } from '@/lib/api/services';
import { useToast } from '@/components/Toast';
import {
  FormattingCPF,
  FormattingRG,
  FormattingPhone,
  FormattingCEP,
} from '@/lib/utils/formatting';
import { ValidationCPF, ValidationPhone, ValidationCEP } from '@/lib/utils/validation';
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

const formatProcessoCNJ = (processo: string): string => {
  if (!processo) return '';

  const numeros = processo.replace(/\D/g, '');

  if (numeros.length < 13) {
    return numeros;
  }

  const numerosLimitados = numeros.slice(0, 20);

  if (numerosLimitados.length >= 20) {
    return `${numerosLimitados.slice(0, 7)}-${numerosLimitados.slice(7, 9)}.${numerosLimitados.slice(9, 13)}.${numerosLimitados.slice(13, 14)}.${numerosLimitados.slice(14, 16)}.${numerosLimitados.slice(16, 20)}`;
  } else if (numerosLimitados.length >= 13) {
    const sequencial = numerosLimitados.slice(0, 7);
    const digitos = numerosLimitados.slice(7, 9);
    const ano = numerosLimitados.slice(9, 13);
    const resto = numerosLimitados.slice(13);

    let formatted = `${sequencial}-${digitos}.${ano}`;

    if (resto.length >= 1) {
      formatted += `.${resto.slice(0, 1)}`;
      if (resto.length >= 3) {
        formatted += `.${resto.slice(1, 3)}`;
        if (resto.length >= 7) {
          formatted += `.${resto.slice(3, 7)}`;
        } else if (resto.length > 3) {
          formatted += `.${resto.slice(3)}`;
        }
      } else if (resto.length > 1) {
        formatted += `.${resto.slice(1)}`;
      }
    }

    return formatted;
  }

  return numerosLimitados;
};

const isValidProcessoCNJ = (processo: string): boolean => {
  if (!processo) return false;

  const numeros = processo.replace(/\D/g, '');

  if (numeros.length < 13 || numeros.length > 20) return false;

  if (numeros.length === 20) {
    try {
      const ano = parseInt(numeros.slice(9, 13));
      const anoAtual = new Date().getFullYear();
      if (ano < 1990 || ano > anoAtual + 2) return false;

      const segmento = parseInt(numeros.slice(13, 14));
      if (segmento < 1 || segmento > 9) return false;

      const tribunal = parseInt(numeros.slice(14, 16));
      if (tribunal < 1 || tribunal > 99) return false;

      const sequencial = numeros.slice(0, 7);
      const digitosVerificadores = numeros.slice(7, 9);
      const parteResto = numeros.slice(9);

      let soma = 0;
      let multiplicador = 2;

      const parteCalculo = sequencial + parteResto;

      for (let i = parteCalculo.length - 1; i >= 0; i--) {
        soma += parseInt(parteCalculo[i]) * multiplicador;
        multiplicador = multiplicador === 9 ? 2 : multiplicador + 1;
      }

      const resto = soma % 97;
      const digitoCalculado = 98 - resto;
      const digitoCalculadoStr = digitoCalculado.toString().padStart(2, '0');

      const isDigitoValido = digitoCalculadoStr === digitosVerificadores;
      if (!isDigitoValido) {
        console.warn(`Dígito verificador divergente. Esperado: ${digitoCalculadoStr}, Recebido: ${digitosVerificadores}`);
      }

      return true;

    } catch (error) {
      console.error('Erro na validação do processo:', error);
      return false;
    }
  }

  return true;
};

export default function EditarCustodiadoModal({ dados, onClose, onVoltar, onSave }: Props) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [errors, setErrors] = useState<ValidationErrors>({});

  const [form, setForm] = useState<Comparecimento>(() => ({
    ...dados,
    cpf: FormattingCPF(String(dados.cpf || '')),
    rg: FormattingRG(String(dados.rg || '')),
    processo: formatProcessoCNJ(String(dados.processo)),
    contato: FormattingPhone(String(dados.contato)),
    periodicidade: typeof dados.periodicidade === 'number'
      ? dados.periodicidade
      : parseInt(String(dados.periodicidade)) || 30,
    endereco: dados.endereco || {
      cep: '',
      logradouro: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      estado: ''
    }
  }));

  const [periodicidadePersonalizada, setPeriodicidadePersonalizada] = useState(
    typeof dados.periodicidade === 'number' ? dados.periodicidade : 30
  );

  useEffect(() => {
    const carregarDadosCompletos = async () => {
      if (!dados.id) {
        setLoadingData(false);
        return;
      }

      setLoadingData(true);

      try {
        const custodiadoId = typeof dados.id === 'string' ? parseInt(dados.id) : dados.id;
        console.log('Buscando dados completos para ID:', custodiadoId);

        const custodiadoRequest = await custodiadosService.buscarPorId(custodiadoId);
        const custodiado = custodiadoRequest?.data
         // { };
        if (custodiado) {
          console.log('Dados completos recebidos:', custodiado);

          setForm({
            ...dados,
            ...custodiado,
            cpf: FormattingCPF(String(custodiado.cpf || dados.cpf || '')),
            rg: FormattingRG(String(custodiado.rg || dados.rg || '')),
            processo: formatProcessoCNJ(String(custodiado.processo || dados.processo)),
            contato: FormattingPhone(String(custodiado.contato || dados.contato)),
            decisao: formatDateForInput(custodiado.dataDecisao || dados.decisao),
            dataComparecimentoInicial: formatDateForInput(
              custodiado.dataComparecimentoInicial || dados.dataComparecimentoInicial || dados.primeiroComparecimento
            ),
            primeiroComparecimento: formatDateForInput(dados.primeiroComparecimento),
            ultimoComparecimento: formatDateForInput(
              custodiado.ultimoComparecimento || dados.ultimoComparecimento
            ),
            proximoComparecimento: formatDateForInput(
              custodiado.proximoComparecimento || dados.proximoComparecimento
            ),
            periodicidade: typeof custodiado.periodicidade === 'number'
              ? custodiado.periodicidade
              : parseInt(String(custodiado.periodicidade)) || 30,
            endereco: custodiado.endereco ? {
              cep: FormattingCEP(String(custodiado.endereco.cep || '')),
              logradouro: String(custodiado.endereco.logradouro || ''),
              numero: String(custodiado.endereco.numero || ''),
              complemento: String(custodiado.endereco.complemento || ''),
              bairro: String(custodiado.endereco.bairro || ''),
              cidade: String(custodiado.endereco.cidade || ''),
              estado: String(custodiado.endereco.estado || '').toUpperCase()
            } : dados.endereco || {
              cep: '',
              logradouro: '',
              numero: '',
              complemento: '',
              bairro: '',
              cidade: '',
              estado: ''
            },
            observacoes: String(custodiado.observacoes || dados.observacoes || ''),
            status: (custodiado.status || dados.status) as any
          });

          setPeriodicidadePersonalizada(
            typeof custodiado.periodicidade === 'number'
              ? custodiado.periodicidade
              : 30
          );
        }
      } catch (error) {
        console.error('Erro ao buscar dados completos:', error);
        showToast({
          type: 'warning',
          title: 'Aviso',
          message: 'Alguns dados podem estar incompletos',
          duration: 3000
        });
      } finally {
        setLoadingData(false);
      }
    };

    carregarDadosCompletos();
  }, [dados.id, showToast, dados]);

  function formatDateForInput(date: string | Date | null | undefined): string {
    if (!date) return '';

    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return dateObj.toISOString().split('T')[0];
    } catch (error) {
      console.error('Erro ao formatar data:', date, error);
      return '';
    }
  }

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!form.nome?.trim()) {
      newErrors.nome = 'Nome é obrigatório';
    } else if (form.nome.trim().length < 2) {
      newErrors.nome = 'Nome deve ter pelo menos 2 caracteres';
    }

    if (!form.processo?.trim()) {
      newErrors.processo = 'Processo é obrigatório';
    } else {
      const processoNumeros = String(form.processo).replace(/\D/g, '');

      if (processoNumeros.length < 13) {
        newErrors.processo = 'Processo deve ter pelo menos 13 dígitos';
      } else if (processoNumeros.length > 20) {
        newErrors.processo = 'Processo não pode ter mais de 20 dígitos';
      } else if (!isValidProcessoCNJ(String(form.processo))) {
        const ano = parseInt(processoNumeros.slice(9, 13));
        const anoAtual = new Date().getFullYear();

        if (processoNumeros.length === 20 && (ano < 1990 || ano > anoAtual + 2)) {
          newErrors.processo = `Ano do processo inválido: ${ano}. Deve estar entre 1990 e ${anoAtual + 2}`;
        } else if (processoNumeros.length === 20) {
          console.warn('Processo aceito com possível divergência nos dígitos verificadores:', form.processo);
        }
      }
    }

    const cpfLimpo = String(form.cpf || '').replace(/\D/g, '');
    const rgLimpo = String(form.rg || '').replace(/\D/g, '');

    if (!cpfLimpo && !rgLimpo) {
      newErrors.documentos = 'Pelo menos CPF ou RG deve ser informado';
    }

    if (cpfLimpo && !ValidationCPF(String(form.cpf))) {
      newErrors.cpf = 'CPF inválido';
    }

    if (!form.contato?.trim()) {
      newErrors.contato = 'Contato é obrigatório';
    } else if (!ValidationPhone(String(form.contato))) {
      newErrors.contato = 'Telefone inválido';
    }

    if (!form.vara?.trim()) {
      newErrors.vara = 'Vara é obrigatória';
    }

    if (!form.comarca?.trim()) {
      newErrors.comarca = 'Comarca é obrigatória';
    }

    if (!form.decisao) {
      newErrors.decisao = 'Data da decisão é obrigatória';
    }

    if (periodicidadePersonalizada < 1) {
      newErrors.periodicidade = 'Periodicidade deve ser maior que zero';
    } else if (periodicidadePersonalizada > 365) {
      newErrors.periodicidade = 'Periodicidade não pode ser maior que 365 dias';
    }

    if (!form.status) {
      newErrors.status = 'Status é obrigatório';
    }

    if (!form.ultimoComparecimento) {
      newErrors.ultimoComparecimento = 'Último comparecimento é obrigatório';
    }

    if (!form.proximoComparecimento) {
      newErrors.proximoComparecimento = 'Próximo comparecimento é obrigatório';
    }

    if (form.endereco) {
      if (!form.endereco.cep?.trim()) {
        newErrors.cep = 'CEP é obrigatório';
      } else if (!ValidationCEP(String(form.endereco.cep))) {
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
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }

    const formatters: Record<string, (v: string) => string> = {
      cpf: FormattingCPF,
      rg: FormattingRG,
      processo: formatProcessoCNJ,
      contato: FormattingPhone,
    };

    const formattedValue = formatters[name] ? formatters[name](value) : value;
    setForm((prev) => ({ ...prev, [name]: formattedValue }));
  }

  function handleEnderecoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }

    let formattedValue = value;

    if (name === 'cep') {
      formattedValue = FormattingCEP(value);
    }

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
            cep: FormattingCEP(cepLimpo),
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
      console.error('Erro ao buscar CEP:', error);
    } finally {
      setLoading(false);
    }
  }

  function handlePeriodicidadeChange(value: string) {
    const numValue = parseInt(value) || 0;

    if (errors.periodicidade) {
      setErrors(prev => ({ ...prev, periodicidade: '' }));
    }

    if (numValue > 365) {
      setErrors(prev => ({ ...prev, periodicidade: 'Máximo de 365 dias' }));
      return;
    }

    setPeriodicidadePersonalizada(numValue);
    setForm(prev => ({ ...prev, periodicidade: numValue }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

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
      const dadosAtualizacao = {
        nome: String(form.nome).trim(),
        cpf: String(form.cpf || '').replace(/\D/g, '') || undefined,
        rg: String(form.rg || '').replace(/\D/g, '') || undefined,
        contato: String(form.contato).replace(/\D/g, ''),
        processo: formatProcessoCNJ(String(form.processo)).replace(/\D/g, ''),
        vara: String(form.vara).trim(),
        comarca: String(form.comarca).trim(),
        dataDecisao: String(form.decisao),
        periodicidade: periodicidadePersonalizada,
        dataComparecimentoInicial: String(form.dataComparecimentoInicial || form.decisao),
        observacoes: String(form.observacoes || '').trim(),
        cep: String(form.endereco?.cep || '').replace(/\D/g, ''),
        logradouro: String(form.endereco?.logradouro || '').trim(),
        numero: String(form.endereco?.numero || '').trim(),
        complemento: String(form.endereco?.complemento || '').trim(),
        bairro: String(form.endereco?.bairro || '').trim(),
        cidade: String(form.endereco?.cidade || '').trim(),
        estado: (String(form.endereco?.estado || 'BA').toUpperCase()) as EstadoBrasil
      };

      const custodiadoId = typeof form.id === 'string' ? parseInt(form.id) : form.id;

      if (!custodiadoId) {
        throw new Error('ID do custodiado inválido');
      }

      console.log('Atualizando custodiado:', custodiadoId, dadosAtualizacao);

      const resultado = await custodiadosService.atualizar(custodiadoId, dadosAtualizacao);

      if (resultado.success) {
        showToast({
          type: 'success',
          title: 'Sucesso',
          message: 'Dados atualizados com sucesso!',
          duration: 3000
        });

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
      console.error('Erro ao atualizar:', error);

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

  if (loadingData) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
        <div className="bg-white p-8 rounded-2xl shadow-2xl">
          <div className="flex flex-col items-center">
            <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
            <p className="text-lg text-gray-600">Carregando dados completos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
      <form
        onSubmit={handleSubmit}
        className="relative bg-white p-8 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
      >
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

        {errors.documentos && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <p className="text-sm text-red-700">{errors.documentos}</p>
            </div>
          </div>
        )}

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
                value={form.nome || ''}
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
                value={form.contato || ''}
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
                value={String(form.cpf || '')}
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
                value={String(form.rg || '')}
                onChange={handleChange}
                placeholder="00.000.000-0"
                disabled={loading}
              />
              {errors.rg && <p className="text-red-500 text-xs mt-1">{errors.rg}</p>}
            </div>
          </div>
        </div>

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
                value={form.processo || ''}
                onChange={handleChange}
                placeholder="0000000-00.0000.0.00.0000"
                disabled={loading}
              />
              {errors.processo && <p className="text-red-500 text-xs mt-1">{errors.processo}</p>}
              <p className="text-gray-500 text-xs mt-1">
                Formato CNJ: NNNNNNN-DD.AAAA.J.TR.OOOO
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data da Decisão <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                className={`w-full border ${errors.decisao ? 'border-red-500' : 'border-gray-300'} p-2 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent`}
                name="decisao"
                value={form.decisao || ''}
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
                value={form.vara || ''}
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
                value={form.comarca || ''}
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
                value={form.status || ''}
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
                value={form.ultimoComparecimento || ''}
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
                value={form.proximoComparecimento || ''}
                onChange={handleChange}
                disabled={loading}
              />
              {errors.proximoComparecimento && <p className="text-red-500 text-xs mt-1">{errors.proximoComparecimento}</p>}
            </div>
          </div>
        </div>

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
            {(form.observacoes || '').length}/500 caracteres
          </p>
        </div>

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