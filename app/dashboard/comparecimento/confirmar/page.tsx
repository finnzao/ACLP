'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
  Calendar,
  Clock,
  FileText,
  Save,
  ArrowLeft,
  MapPin,
  UserCheck,
  ChevronDown,
  ChevronUp,
  Smartphone,
  Building,
  Search,
  Users,
  X
} from 'lucide-react';

import { useCustodiados, useComparecimentos } from '@/hooks/useAPI';
import { CustodiadoResponse, ComparecimentoDTO, TipoValidacao } from '@/types/api';
import EnderecoForm from '@/components/EnderecoForm';
import { useToastHelpers } from '@/components/Toast';
import { calcularProximoComparecimento, formatarPeriodicidade } from '@/lib/utils/periodicidade';
import {
  sanitizeFormData,
  validateBeforeSend,
  logFormDataForDebug
} from '@/lib/utils/enumValidation';

import {
  FormularioComparecimento,
  AtualizacaoEndereco,
  MobileSectionProps,
  EstadoPagina,
  dateUtils,
  Endereco
} from '@/types/comparecimento';

declare global {
  interface Window {
    enderecoTimeout?: NodeJS.Timeout;
  }
}

export default function ConfirmarPresencaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const processo = searchParams.get('processo');
  const { success, error } = useToastHelpers();

  const { custodiados, loading: loadingCustodiados, error: errorCustodiados, refetch } = useCustodiados();
  const { registrarComparecimento, loading: loadingComparecimento } = useComparecimentos();

  const [pessoa, setPessoa] = useState<CustodiadoResponse | null>(null);
  const [estado, setEstado] = useState<EstadoPagina>('inicial');
  const [mensagem, setMensagem] = useState('');
  const [buscaProcesso, setBuscaProcesso] = useState(processo || '');

  // Estado para lista de resultados de busca
  const [resultadosBusca, setResultadosBusca] = useState<CustodiadoResponse[]>([]);
  const [mostrarResultados, setMostrarResultados] = useState(false);

  const [formulario, setFormulario] = useState<FormularioComparecimento>({
    dataComparecimento: dateUtils.getCurrentDate(),
    horaComparecimento: dateUtils.getCurrentTime(),
    tipoValidacao: TipoValidacao.PRESENCIAL,
    observacoes: '',
    validadoPor: 'Servidor Atual'
  });

  const [atualizacaoEndereco, setAtualizacaoEndereco] = useState<AtualizacaoEndereco>({
    houveAlteracao: false
  });
  const [enderecoRespondido, setEnderecoRespondido] = useState(false);

  const [isMobile, setIsMobile] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>('busca');
  const [proximoComparecimento, setProximoComparecimento] = useState<string | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Função para normalizar texto (remover acentos e converter para minúsculo)
  const normalizarTexto = useCallback((texto: string): string => {
    return texto
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }, []);

  const buscarPessoa = useCallback(async (numeroProcesso: string) => {
    if (!numeroProcesso.trim()) {
      setResultadosBusca([]);
      setMostrarResultados(false);
      return;
    }

    if (!custodiados || custodiados.length === 0) {
      error('Dados não carregados', 'Aguarde o carregamento dos dados');
      return;
    }

    setEstado('buscando');

    try {
      const termoNormalizado = normalizarTexto(numeroProcesso);

      // Buscar todas as pessoas que correspondem ao critério
      const pessoasEncontradas = custodiados.filter(p => {
        const nomeNormalizado = normalizarTexto(p.nome);
        const processoNormalizado = normalizarTexto(p.processo);
        const cpfNormalizado = p.cpf ? normalizarTexto(p.cpf) : '';

        return nomeNormalizado.includes(termoNormalizado) ||
          processoNormalizado.includes(termoNormalizado) ||
          cpfNormalizado.includes(termoNormalizado);
      });

      if (pessoasEncontradas.length > 0) {
        setResultadosBusca(pessoasEncontradas);
        setMostrarResultados(true);
        setEstado('inicial');

        // Se houver apenas um resultado, selecionar automaticamente
        if (pessoasEncontradas.length === 1) {
          selecionarPessoa(pessoasEncontradas[0]);
        } else {
          success('Resultados encontrados', `${pessoasEncontradas.length} pessoa(s) encontrada(s)`);
        }
      } else {
        setResultadosBusca([]);
        setMostrarResultados(false);
        setEstado('erro');
        setMensagem('Nenhuma pessoa encontrada para o termo de busca informado.');
        error('Pessoa não encontrada', 'Verifique o número do processo ou nome da pessoa');
      }
    } catch (err) {
      console.error('Erro ao buscar pessoa:', err);
      setEstado('erro');
      setMensagem('Erro ao buscar pessoa. Tente novamente.');
      error('Erro na busca', 'Ocorreu um erro ao buscar a pessoa');
    }
  }, [custodiados, success, error, normalizarTexto]);

  // Função para selecionar uma pessoa da lista de resultados
  const selecionarPessoa = useCallback((pessoaSelecionada: CustodiadoResponse) => {
    setPessoa(pessoaSelecionada);
    setMostrarResultados(false);
    setExpandedSection('dados-pessoais');
    success('Pessoa selecionada', `${pessoaSelecionada.nome} - ${pessoaSelecionada.processo}`);
  }, [success]);

  useEffect(() => {
    // Verificação com proteção contra null
    if (processo && custodiados && custodiados.length > 0 && !pessoa) {
      buscarPessoa(processo);
    }
  }, [processo, custodiados, pessoa, buscarPessoa]);

  useEffect(() => {
    if (estado === 'sucesso' && pessoa) {
      const proximaData = calcularProximoComparecimento(
        formulario.dataComparecimento,
        pessoa.periodicidade
      );
      setProximoComparecimento(dateUtils.formatToBR(proximaData));
    }
  }, [estado, pessoa, formulario.dataComparecimento]);

  const formatarHoraParaAPI = (hora: string): string => {
    if (!hora) return '00:00:00';

    if (hora.match(/^\d{2}:\d{2}:\d{2}$/)) {
      return hora;
    }

    if (hora.match(/^\d{2}:\d{2}$/)) {
      return `${hora}:00`;
    }

    const [hours, minutes] = hora.split(':');
    const h = hours?.padStart(2, '0') || '00';
    const m = minutes?.padStart(2, '0') || '00';
    return `${h}:${m}:00`;
  };

  const handleInputChange = (field: keyof FormularioComparecimento, value: string) => {
    setFormulario(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleRespostaAlteracaoEndereco = useCallback((houve: boolean) => {
    requestAnimationFrame(() => {
      setAtualizacaoEndereco(prev => ({
        ...prev,
        houveAlteracao: houve
      }));
      setEnderecoRespondido(true);

      if (houve) {
        setTimeout(() => {
          setExpandedSection('endereco');
        }, 50);
      }
    });
  }, []);

  const confirmarComparecimento = async () => {
    if (!pessoa) return;

    if (!enderecoRespondido) {
      error('Informação pendente', 'Responda sobre a atualização de endereço');
      setExpandedSection('endereco');
      return;
    }

    setEstado('confirmando');

    try {
      const dadosBasicos = {
        custodiadoId: pessoa.id,
        dataComparecimento: formulario.dataComparecimento,
        horaComparecimento: formatarHoraParaAPI(formulario.horaComparecimento),
        tipoValidacao: formulario.tipoValidacao,
        observacoes: formulario.observacoes,
        validadoPor: formulario.validadoPor,
        anexos: '',
        mudancaEndereco: atualizacaoEndereco.houveAlteracao,
        motivoMudancaEndereco: atualizacaoEndereco.motivoAlteracao || undefined,
        novoEndereco: atualizacaoEndereco.houveAlteracao ? {
          cep: atualizacaoEndereco.endereco?.cep || '',
          logradouro: atualizacaoEndereco.endereco?.logradouro || '',
          numero: atualizacaoEndereco.endereco?.numero || '',
          complemento: atualizacaoEndereco.endereco?.complemento || '',
          bairro: atualizacaoEndereco.endereco?.bairro || '',
          cidade: atualizacaoEndereco.endereco?.cidade || '',
          estado: atualizacaoEndereco.endereco?.estado || ''
        } : undefined
      };

      logFormDataForDebug(dadosBasicos, 'Dados Originais');

      const dadosSanitizados = sanitizeFormData(dadosBasicos);
      logFormDataForDebug(dadosSanitizados, 'Dados Sanitizados');

      const validacao = validateBeforeSend(dadosSanitizados);
      if (!validacao.isValid) {
        setEstado('erro');
        setMensagem(`Erro de validação: ${validacao.errors.join(', ')}`);
        error('Dados inválidos', validacao.errors.join(', '));
        return;
      }

      const dadosComparecimento: ComparecimentoDTO = dadosSanitizados;

      console.log('Dados finais sendo enviados:', dadosComparecimento);
      console.log('Hora formatada:', dadosComparecimento.horaComparecimento);

      const resultado = await registrarComparecimento(dadosComparecimento);

      if (resultado.success) {
        setEstado('sucesso');
        const msgEndereco = atualizacaoEndereco.houveAlteracao ? ' Endereço atualizado.' : '';
        setMensagem(`Comparecimento confirmado com sucesso!${msgEndereco}`);
        success('Comparecimento registrado', resultado.message || 'Presença confirmada com sucesso');
      } else {
        console.error('Erro na resposta:', resultado);
        setEstado('erro');
        setMensagem(resultado.message || 'Erro ao confirmar comparecimento');
        error('Erro no registro', resultado.message || 'Falha ao registrar comparecimento');
      }
    } catch (err: unknown) {
      console.error('Erro na requisição:', err);
      setEstado('erro');

      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';

      if (errorMessage.includes('JSON_INVALIDO') || errorMessage.includes('Malformed JSON')) {
        setMensagem('Erro nos dados enviados. Verifique se todos os campos estão preenchidos corretamente.');
        error('Erro de validação', 'Dados inválidos. Verifique os campos obrigatórios.');
      } else if (errorMessage.toLowerCase().includes('hora') || errorMessage.toLowerCase().includes('time')) {
        setMensagem('Erro no formato da hora. O sistema espera formato HH:mm:ss.');
        error('Formato de hora inválido', 'Use o formato HH:mm:ss para hora (ex: 14:30:00)');
      } else if (errorMessage.toLowerCase().includes('status')) {
        setMensagem('Erro na validação do status. Entre em contato com o suporte.');
        error('Erro de validação', 'Status inválido detectado');
      } else if (errorMessage.toLowerCase().includes('estado')) {
        setMensagem('Estado inválido. Use siglas como BA, SP, RJ, etc.');
        error('Estado inválido', 'Use uma sigla válida de estado brasileiro');
      } else if (errorMessage.toLowerCase().includes('tipo')) {
        setMensagem('Tipo de validação inválido. Contate o suporte.');
        error('Tipo inválido', 'Erro no tipo de validação');
      } else {
        setMensagem('Erro interno. Tente novamente.');
        error('Erro interno', 'Ocorreu um erro inesperado. Tente novamente.');
      }
    }
  };

  const MobileSection = ({
    id,
    title,
    icon,
    children,
    defaultExpanded = false,
    badge = null
  }: MobileSectionProps) => {
    const isExpanded = expandedSection === id || defaultExpanded;

    return (
      <div className="bg-white rounded-lg shadow-sm mb-3 overflow-hidden">
        <button
          onClick={() => setExpandedSection(isExpanded ? null : id)}
          className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            {icon}
            <span className="font-medium text-gray-800">{title}</span>
            {badge}
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>
        {isExpanded && (
          <div className="px-4 pb-4 slide-in-from-top-2">
            {children}
          </div>
        )}
      </div>
    );
  };

  // Componente para lista de resultados de busca
  const ListaResultadosBusca = () => {
    if (!mostrarResultados || resultadosBusca.length === 0) return null;

    return (
      <div className="mt-3 bg-white rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-y-auto">
        <div className="p-2 bg-gray-50 border-b">
          <p className="text-xs font-medium text-gray-600">
            {resultadosBusca.length} resultado(s) encontrado(s)
          </p>
        </div>
        {resultadosBusca.map((resultado) => (
          <button
            key={resultado.id}
            onClick={() => selecionarPessoa(resultado)}
            className="w-full p-3 text-left hover:bg-blue-50 border-b border-gray-100 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-800 text-sm">{resultado.nome}</p>
                <p className="text-xs text-gray-500">CPF: {resultado.cpf || 'Não informado'}</p>
                <p className="text-xs text-gray-500">Processo: {resultado.processo}</p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs ${resultado.status === 'EM_CONFORMIDADE'
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
                }`}>
                {resultado.status === 'EM_CONFORMIDADE' ? 'Conforme' : 'Inadimplente'}
              </span>
            </div>
          </button>
        ))}
      </div>
    );
  };

  if (loadingCustodiados) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Carregando dados do sistema...</p>
        </div>
      </div>
    );
  }

  if (errorCustodiados) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4">
        <div className="text-center p-6 bg-white rounded-2xl shadow-xl max-w-md w-full">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Erro ao carregar dados</h2>
          <p className="text-gray-600 mb-6 text-sm">{errorCustodiados}</p>
          <div className="flex gap-2">
            <button
              onClick={() => refetch()}
              className="flex-1 bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark transition-colors"
            >
              Tentar Novamente
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 transition-colors"
            >
              Voltar
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white sticky top-0 z-20 shadow-sm">
          <div className="flex items-center gap-4 p-4">
            <button
              onClick={() => router.back()}
              className="p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-primary-dark">
                Confirmar Presença
              </h1>
              <p className="text-xs text-gray-600">Registro de comparecimento</p>
            </div>
          </div>
        </div>

        <div className="p-4 pb-24">
          {estado === 'buscando' && (
            <div className="bg-white rounded-lg p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3"></div>
              <p className="text-gray-600">Buscando pessoa...</p>
            </div>
          )}

          {estado === 'confirmando' && (
            <div className="bg-white rounded-lg p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-3"></div>
              <p className="text-gray-600">Confirmando presença...</p>
            </div>
          )}

          {estado === 'sucesso' && (
            <div className="bg-white rounded-lg p-6 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-green-700 mb-2">Presença Confirmada!</h2>
              <p className="text-gray-600 mb-4">{mensagem}</p>
              {proximoComparecimento && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <p className="text-blue-800 text-sm font-medium">Próximo comparecimento:</p>
                  <p className="text-blue-600 font-bold">{proximoComparecimento}</p>
                </div>
              )}
              <button
                onClick={() => router.push('/dashboard')}
                className="w-full bg-primary text-white py-3 rounded-lg font-medium"
              >
                Voltar ao Dashboard
              </button>
            </div>
          )}

          {estado === 'erro' && (
            <div className="bg-white rounded-lg p-6 text-center">
              <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-red-700 mb-2">Erro</h2>
              <p className="text-gray-600 mb-4">{mensagem}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEstado('inicial');
                    setResultadosBusca([]);
                    setMostrarResultados(false);
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded"
                >
                  Tentar Novamente
                </button>
                <button
                  onClick={() => router.back()}
                  className="flex-1 bg-primary text-white py-2 rounded"
                >
                  Voltar
                </button>
              </div>
            </div>
          )}

          {estado === 'inicial' && (
            <>
              <MobileSection
                id="busca"
                title="Buscar Pessoa"
                icon={<Search className="w-5 h-5 text-blue-600" />}
                defaultExpanded={!pessoa}
                badge={
                  resultadosBusca.length > 0 ? (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      {resultadosBusca.length} encontrado(s)
                    </span>
                  ) : null
                }
              >
                <div className="space-y-3">
                  <input
                    type="text"
                    value={buscaProcesso}
                    onChange={(e) => {
                      setBuscaProcesso(e.target.value);
                      if (e.target.value.trim()) {
                        buscarPessoa(e.target.value);
                      } else {
                        setResultadosBusca([]);
                        setMostrarResultados(false);
                      }
                    }}
                    placeholder="Nome, CPF ou número do processo"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />

                  {/* Lista de resultados da busca */}
                  <ListaResultadosBusca />

                  {!mostrarResultados && (
                    <button
                      onClick={() => buscarPessoa(buscaProcesso)}
                      className="w-full bg-blue-500 text-white py-2 rounded-lg text-sm font-medium"
                    >
                      Buscar
                    </button>
                  )}
                </div>
              </MobileSection>

              {pessoa && (
                <>
                  <MobileSection
                    id="dados-pessoais"
                    title="Dados da Pessoa"
                    icon={<User className="w-5 h-5 text-green-600" />}
                    badge={
                      <span className={`px-2 py-1 rounded-full text-xs ${pessoa.status === 'EM_CONFORMIDADE'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                        }`}>
                        {pessoa.status === 'EM_CONFORMIDADE' ? 'Em Conformidade' : 'Inadimplente'}
                      </span>
                    }
                  >
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-gray-500">Nome</p>
                        <p className="font-medium text-gray-800">{pessoa.nome}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-gray-500">CPF</p>
                          <p className="font-medium text-gray-800 text-sm">{pessoa.cpf || 'Não informado'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Contato</p>
                          <p className="font-medium text-gray-800 text-sm">{pessoa.contato}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Processo</p>
                        <p className="font-medium text-gray-800 text-sm">{pessoa.processo}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Próximo Comparecimento</p>
                        <p className="font-medium text-gray-800">{dateUtils.formatToBR(pessoa.proximoComparecimento)}</p>
                      </div>
                      <button
                        onClick={() => {
                          setPessoa(null);
                          setEnderecoRespondido(false);
                          setAtualizacaoEndereco({ houveAlteracao: false });
                          setBuscaProcesso('');
                          setResultadosBusca([]);
                          setExpandedSection('busca');
                        }}
                        className="text-sm text-blue-600 underline"
                      >
                        Buscar outra pessoa
                      </button>
                    </div>
                  </MobileSection>

                  <MobileSection
                    id="endereco"
                    title="Atualização de Endereço"
                    icon={<MapPin className="w-5 h-5 text-orange-600" />}
                    badge={
                      enderecoRespondido ? (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          Respondido
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                          Pendente
                        </span>
                      )
                    }
                  >
                    {!enderecoRespondido ? (
                      <div className="space-y-3">
                        <p className="text-sm text-gray-700">
                          Houve mudança no endereço desde o último comparecimento?
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            onClick={() => handleRespostaAlteracaoEndereco(true)}
                            className="bg-yellow-500 text-white py-2 rounded text-sm font-medium transition-colors hover:bg-yellow-600"
                            type="button"
                          >
                            Sim, mudou
                          </button>
                          <button
                            onClick={() => handleRespostaAlteracaoEndereco(false)}
                            className="bg-green-500 text-white py-2 rounded text-sm font-medium transition-colors hover:bg-green-600"
                            type="button"
                          >
                            Não mudou
                          </button>
                        </div>
                      </div>
                    ) : atualizacaoEndereco.houveAlteracao ? (
                      <div className="space-y-4" style={{ transform: 'translateZ(0)' }}>
                        <div key="endereco-form-stable" className="transition-none">
                          <EnderecoForm
                            endereco={atualizacaoEndereco.endereco || {} as Endereco}
                            onEnderecoChange={(endereco) => {
                              requestAnimationFrame(() => {
                                setAtualizacaoEndereco(prev => ({
                                  ...prev,
                                  endereco
                                }));
                              });
                            }}
                            showTitle={false}
                            required={true}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Motivo da mudança
                          </label>
                          <textarea
                            value={atualizacaoEndereco.motivoAlteracao || ''}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (window.enderecoTimeout) {
                                clearTimeout(window.enderecoTimeout);
                              }
                              window.enderecoTimeout = setTimeout(() => {
                                setAtualizacaoEndereco(prev => ({
                                  ...prev,
                                  motivoAlteracao: value
                                }));
                              }, 150);
                            }}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
                            placeholder="Ex: Mudança familiar, trabalho..."
                          />
                        </div>
                        <button
                          onClick={() => {
                            setEnderecoRespondido(false);
                            setAtualizacaoEndereco({ houveAlteracao: false });
                          }}
                          className="text-sm text-gray-600 underline hover:text-gray-800 transition-colors"
                          type="button"
                        >
                          Alterar resposta
                        </button>
                      </div>
                    ) : (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <p className="text-sm text-green-800 font-medium">
                            Endereço confirmado sem alterações
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setEnderecoRespondido(false);
                            setAtualizacaoEndereco({ houveAlteracao: false });
                          }}
                          className="text-xs text-green-600 underline mt-2 hover:text-green-800 transition-colors"
                          type="button"
                        >
                          Alterar resposta
                        </button>
                      </div>
                    )}
                  </MobileSection>

                  <MobileSection
                    id="comparecimento"
                    title="Detalhes do Comparecimento"
                    icon={<UserCheck className="w-5 h-5 text-blue-600" />}
                  >
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Tipo de Validação
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => handleInputChange('tipoValidacao', TipoValidacao.PRESENCIAL)}
                            className={`p-3 rounded-lg border-2 transition-all ${formulario.tipoValidacao === TipoValidacao.PRESENCIAL
                              ? 'border-primary bg-primary text-white'
                              : 'border-gray-300 bg-white text-gray-700'
                              }`}
                          >
                            <Building className="w-4 h-4 mx-auto mb-1" />
                            <span className="text-xs font-medium">Presencial</span>
                          </button>
                          <button
                            onClick={() => handleInputChange('tipoValidacao', TipoValidacao.ONLINE)}
                            className={`p-3 rounded-lg border-2 transition-all ${formulario.tipoValidacao === TipoValidacao.ONLINE
                              ? 'border-primary bg-primary text-white'
                              : 'border-gray-300 bg-white text-gray-700'
                              }`}
                          >
                            <Smartphone className="w-4 h-4 mx-auto mb-1" />
                            <span className="text-xs font-medium">Virtual</span>
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Data
                          </label>
                          <input
                            type="date"
                            value={formulario.dataComparecimento}
                            onChange={(e) => handleInputChange('dataComparecimento', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Horário
                          </label>
                          <input
                            type="time"
                            value={formulario.horaComparecimento}
                            onChange={(e) => handleInputChange('horaComparecimento', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Observações
                        </label>
                        <textarea
                          value={formulario.observacoes}
                          onChange={(e) => handleInputChange('observacoes', e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          placeholder="Adicione observações se necessário..."
                        />
                      </div>


                    </div>
                  </MobileSection>
                </>
              )}
            </>
          )}
        </div>

        {estado === 'inicial' && pessoa && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 safe-area-bottom">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => router.back()}
                className="bg-gray-200 text-gray-700 py-3 rounded-lg font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarComparecimento}
                disabled={loadingComparecimento || !enderecoRespondido}
                className="bg-green-500 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingComparecimento ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Confirmar
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Versão Desktop continua igual, mas com as mesmas melhorias de busca
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-primary hover:text-primary-dark transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar
          </button>
          <div>
            <h1 className="text-3xl font-bold text-primary-dark">Confirmar Presença</h1>
            <p className="text-lg text-gray-600">Registro de comparecimento</p>
          </div>
        </div>

        {(estado === 'buscando' || estado === 'confirmando' || estado === 'sucesso' || estado === 'erro') && (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {estado === 'buscando' && (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-6"></div>
                <h2 className="text-2xl font-bold text-primary-dark mb-2">Buscando pessoa...</h2>
                <p className="text-gray-600">Aguarde enquanto localizamos os dados</p>
              </div>
            )}

            {estado === 'confirmando' && (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500 mx-auto mb-6"></div>
                <h2 className="text-2xl font-bold text-green-700 mb-2">Confirmando Presença...</h2>
                <p className="text-gray-600">Aguarde enquanto registramos o comparecimento</p>
              </div>
            )}

            {estado === 'sucesso' && (
              <div className="p-8 text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-12 h-12 text-green-500" />
                </div>
                <h2 className="text-2xl font-bold text-green-700 mb-2">Presença Confirmada!</h2>
                <p className="text-gray-600 mb-6">{mensagem}</p>

                {pessoa && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                    <p className="text-green-800">
                      <strong>Comparecimento registrado para:</strong><br />
                      {pessoa.nome} - Processo: {pessoa.processo}
                    </p>
                    <p className="text-green-700 text-sm mt-2">
                      Data/Hora: {dateUtils.formatToBR(formulario.dataComparecimento)} às {formulario.horaComparecimento}
                    </p>
                    {atualizacaoEndereco.houveAlteracao && (
                      <p className="text-green-700 text-sm mt-1">
                        Endereço atualizado com sucesso
                      </p>
                    )}
                  </div>
                )}

                {proximoComparecimento && pessoa && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <h3 className="text-lg font-semibold text-blue-800 mb-2">
                      Próximo Comparecimento
                    </h3>
                    <p className="text-blue-700 text-lg font-medium">
                      {proximoComparecimento}
                    </p>
                    <p className="text-blue-600 text-sm mt-1">
                      Periodicidade: {formatarPeriodicidade(pessoa.periodicidade)}
                    </p>
                  </div>
                )}

                <div className="flex gap-4 justify-center">
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="bg-primary text-white px-8 py-3 rounded-lg hover:bg-primary-dark transition-all font-medium"
                  >
                    Voltar ao Dashboard
                  </button>
                  <button
                    onClick={() => {
                      setEstado('inicial');
                      setPessoa(null);
                      setBuscaProcesso('');
                      setEnderecoRespondido(false);
                      setResultadosBusca([]);
                      setMostrarResultados(false);
                    }}
                    className="bg-green-500 text-white px-8 py-3 rounded-lg hover:bg-green-600 transition-all font-medium"
                  >
                    Nova Confirmação
                  </button>
                </div>
              </div>
            )}

            {estado === 'erro' && (
              <div className="p-8 text-center">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <XCircle className="w-12 h-12 text-red-500" />
                </div>
                <h2 className="text-2xl font-bold text-red-700 mb-2">Erro na Confirmação</h2>
                <p className="text-gray-600 mb-6">{mensagem}</p>
                <div className="flex justify-center gap-4">
                  <button
                    onClick={() => router.back()}
                    className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-all font-medium"
                  >
                    Voltar
                  </button>
                  <button
                    onClick={() => {
                      setEstado('inicial');
                      setMensagem('');
                      setResultadosBusca([]);
                      setMostrarResultados(false);
                    }}
                    className="bg-yellow-500 text-white px-6 py-3 rounded-lg hover:bg-yellow-600 transition-all font-medium"
                  >
                    Tentar Novamente
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {estado === 'inicial' && (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="p-8">
              {!pessoa && (
                <div className="mb-8">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Search className="w-6 h-6 text-blue-600" />
                      <h3 className="text-lg font-semibold text-blue-900">Buscar Pessoa</h3>
                    </div>

                    <div className="space-y-4">
                      <div className="flex gap-4">
                        <input
                          type="text"
                          value={buscaProcesso}
                          onChange={(e) => {
                            setBuscaProcesso(e.target.value);
                            if (e.target.value.trim()) {
                              buscarPessoa(e.target.value);
                            } else {
                              setResultadosBusca([]);
                              setMostrarResultados(false);
                            }
                          }}
                          placeholder="Digite o nome, CPF ou número do processo"
                          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                          onKeyPress={(e) => e.key === 'Enter' && buscarPessoa(buscaProcesso)}
                        />
                        <button
                          onClick={() => buscarPessoa(buscaProcesso)}
                          className="bg-blue-500 text-white px-8 py-3 rounded-lg hover:bg-blue-600 transition-all font-medium flex items-center gap-2"
                        >
                          <Search className="w-5 h-5" />
                          Buscar
                        </button>
                      </div>

                      {/* Lista de resultados para desktop */}
                      {mostrarResultados && resultadosBusca.length > 0 && (
                        <div className="bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
                          <div className="p-3 bg-gray-50 border-b flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-700">
                              <Users className="w-4 h-4 inline mr-2" />
                              {resultadosBusca.length} resultado(s) encontrado(s)
                            </p>
                            <button
                              onClick={() => {
                                setMostrarResultados(false);
                                setResultadosBusca([]);
                              }}
                              className="text-gray-500 hover:text-gray-700"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          {resultadosBusca.map((resultado) => (
                            <button
                              key={resultado.id}
                              onClick={() => selecionarPessoa(resultado)}
                              className="w-full p-4 text-left hover:bg-blue-50 border-b border-gray-100 transition-colors"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-semibold text-gray-800">{resultado.nome}</p>
                                  <div className="flex gap-4 mt-1">
                                    <p className="text-sm text-gray-600">CPF: {resultado.cpf || 'Não informado'}</p>
                                    <p className="text-sm text-gray-600">Processo: {resultado.processo}</p>
                                  </div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${resultado.status === 'EM_CONFORMIDADE'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                                  }`}>
                                  {resultado.status === 'EM_CONFORMIDADE' ? 'Em Conformidade' : 'Inadimplente'}
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {pessoa && (
                <>
                  <div className="bg-primary p-6 rounded-xl mb-8 text-white">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                        <User className="w-8 h-8" />
                      </div>
                      <div className="flex-1">
                        <h2 className="text-2xl font-bold">{pessoa.nome}</h2>
                        <p className="text-primary-light">Processo: {pessoa.processo}</p>
                      </div>
                      <div>
                        <span className={`px-4 py-2 rounded-full text-sm font-medium ${pessoa.status === 'EM_CONFORMIDADE'
                          ? 'bg-green-500 text-white'
                          : 'bg-red-500 text-white'
                          }`}>
                          {pessoa.status === 'EM_CONFORMIDADE' ? 'Em Conformidade' : 'Inadimplente'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="font-semibold mb-1">CPF</p>
                        <p className="text-primary-light">{pessoa.cpf || 'Não informado'}</p>
                      </div>
                      <div>
                        <p className="font-semibold mb-1">Contato</p>
                        <p className="text-primary-light">{pessoa.contato}</p>
                      </div>
                      <div>
                        <p className="font-semibold mb-1">Vara</p>
                        <p className="text-primary-light">{pessoa.vara}</p>
                      </div>
                      <div>
                        <p className="font-semibold mb-1">Próximo Comparecimento</p>
                        <p className="text-primary-light font-medium">{dateUtils.formatToBR(pessoa.proximoComparecimento)}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setPessoa(null);
                        setEnderecoRespondido(false);
                        setAtualizacaoEndereco({ houveAlteracao: false });
                        setBuscaProcesso('');
                        setResultadosBusca([]);
                        setMostrarResultados(false);
                      }}
                      className="mt-4 text-sm text-white underline hover:text-primary-light transition-colors"
                    >
                      Buscar outra pessoa
                    </button>
                  </div>

                  <div className="mb-8">
                    <div className={`bg-orange-50 border border-orange-200 rounded-lg p-6 ${!enderecoRespondido ? 'ring-2 ring-orange-500 ring-offset-2' : ''
                      }`}>
                      <div className="flex items-center gap-3 mb-4">
                        <MapPin className="w-6 h-6 text-orange-600" />
                        <h3 className="text-lg font-semibold text-orange-900">Atualização de Endereço</h3>
                        {!enderecoRespondido && (
                          <span className="bg-red-100 text-red-700 text-sm py-1 px-3 rounded-full ml-2 flex items-center">
                            <AlertCircle className="w-4 h-4 mr-1" />
                            Resposta obrigatória
                          </span>
                        )}
                      </div>

                      {!enderecoRespondido ? (
                        <>
                          <p className="text-orange-800 mb-4">
                            Houve alguma mudança no endereço do custodiado desde o último comparecimento?
                          </p>

                          <div className="flex gap-4">
                            <button
                              onClick={() => handleRespostaAlteracaoEndereco(true)}
                              className="bg-yellow-500 text-white px-8 py-3 rounded-lg hover:bg-yellow-600 transition-all font-medium flex items-center gap-2"
                            >
                              <MapPin className="w-5 h-5" />
                              Sim, houve mudança
                            </button>
                            <button
                              onClick={() => handleRespostaAlteracaoEndereco(false)}
                              className="bg-green-500 text-white px-8 py-3 rounded-lg hover:bg-green-600 transition-all font-medium flex items-center gap-2"
                            >
                              <CheckCircle className="w-5 h-5" />
                              Não, mantém o mesmo
                            </button>
                          </div>
                        </>
                      ) : atualizacaoEndereco.houveAlteracao ? (
                        <div className="space-y-6">
                          <EnderecoForm
                            endereco={atualizacaoEndereco.endereco || {} as Endereco}
                            onEnderecoChange={(endereco) =>
                              setAtualizacaoEndereco(prev => ({
                                ...prev,
                                endereco
                              }))
                            }
                            showTitle={false}
                            required={true}
                          />

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Motivo da Alteração (Opcional)
                            </label>
                            <textarea
                              value={atualizacaoEndereco.motivoAlteracao || ''}
                              onChange={(e) => {
                                const value = e.target.value.slice(0, 500);
                                setAtualizacaoEndereco(prev => ({
                                  ...prev,
                                  motivoAlteracao: value
                                }));
                              }}
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
                              placeholder="Mínimo 10 caracteres. Ex: Mudança familiar, trabalho..."
                              minLength={10}
                              maxLength={500}
                            />
                          </div>

                          <button
                            onClick={() => {
                              setEnderecoRespondido(false);
                              setAtualizacaoEndereco({ houveAlteracao: false });
                            }}
                            className="text-orange-600 hover:text-orange-800 transition-colors underline"
                          >
                            Alterar resposta
                          </button>
                        </div>
                      ) : (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <p className="text-green-800 font-medium">
                              Endereço confirmado como inalterado
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              setEnderecoRespondido(false);
                              setAtualizacaoEndereco({ houveAlteracao: false });
                            }}
                            className="text-green-600 hover:text-green-800 text-sm mt-2 underline"
                          >
                            Alterar resposta
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold text-primary-dark flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Registrar Comparecimento
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Tipo de Validação *
                        </label>
                        <select
                          value={formulario.tipoValidacao}
                          onChange={(e) => handleInputChange('tipoValidacao', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                          required
                        >
                          <option value={TipoValidacao.PRESENCIAL}>Presencial</option>
                          <option value={TipoValidacao.ONLINE}>Balcão Virtual</option>
                          <option value={TipoValidacao.CADASTRO_INICIAL}>Cadastro Inicial</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Validado por *
                        </label>
                        <input
                          type="text"
                          value={formulario.validadoPor}
                          onChange={(e) => handleInputChange('validadoPor', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                          placeholder="Nome do servidor responsável"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Data do Comparecimento *
                        </label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                          <input
                            type="date"
                            value={formulario.dataComparecimento}
                            onChange={(e) => handleInputChange('dataComparecimento', e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Horário do Comparecimento *
                        </label>
                        <div className="relative">
                          <Clock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                          <input
                            type="time"
                            value={formulario.horaComparecimento}
                            onChange={(e) => handleInputChange('horaComparecimento', e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Observações
                      </label>
                      <textarea
                        value={formulario.observacoes}
                        onChange={(e) => handleInputChange('observacoes', e.target.value)}
                        rows={4}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                        placeholder="Adicione observações sobre o comparecimento (opcional)..."
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
                    <button
                      onClick={() => router.back()}
                      className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all font-medium"
                    >
                      Cancelar
                    </button>

                    <button
                      onClick={confirmarComparecimento}
                      disabled={loadingComparecimento || !enderecoRespondido}
                      className="px-8 py-3 rounded-lg transition-all font-medium flex items-center gap-2 shadow-lg bg-green-500 text-white hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loadingComparecimento ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      ) : (
                        <Save className="w-5 h-5" />
                      )}
                      Confirmar Presença
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {estado === 'inicial' && !isMobile && (
          <div className="mt-6 bg-blue-50 rounded-xl p-6">
            <h3 className="font-semibold text-lg mb-3 text-blue-900 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Orientações Importantes
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ul className="space-y-2 text-blue-800">
                <li className="flex items-start">
                  <span className="mr-2">• Certifique-se de que a pessoa realmente compareceu</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">• Sempre pergunte sobre mudança de endereço</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">• Registre o horário exato do atendimento</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">• Adicione observações relevantes quando necessário</span>
                </li>
              </ul>
              <ul className="space-y-2 text-blue-800">
                <li className="flex items-start">
                  <span className="mr-2">• Esta ação atualiza automaticamente o status</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">• O próximo comparecimento será calculado automaticamente</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">• Todos os dados são sincronizados em tempo real</span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}