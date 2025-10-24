'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
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
  Search,
  type LucideIcon
} from 'lucide-react';

import { useCustodiados, useComparecimentos } from '@/hooks/useAPI';
import { CustodiadoData, ComparecimentoDTO, TipoValidacao } from '@/types/api';
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
  EstadoPagina,
  dateUtils,
  Endereco
} from '@/types/comparecimento';

import { useSearchParamsSafe, withSearchParams } from '@/hooks/useSearchParamsSafe';


declare global {
  interface Window {
    enderecoTimeout?: NodeJS.Timeout;
  }
}


interface MobileSectionProps {
  title: string;
  icon: LucideIcon;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function ConfirmarPresencaPage() {
  const router = useRouter();

  const searchParams = useSearchParamsSafe();
  const processo = searchParams.get('processo');

  const { success, error } = useToastHelpers();

  const { custodiados, loading: loadingCustodiados, error: errorCustodiados, refetch } = useCustodiados();
  const { registrarComparecimento, loading: loadingComparecimento } = useComparecimentos();

  const [custodiado, setCustodiado] = useState<CustodiadoData | null>(null);
  const [estado, setEstado] = useState<EstadoPagina>('inicial');
  const [mensagem, setMensagem] = useState('');
  const [buscaProcesso, setBuscaProcesso] = useState(processo || '');

  const [resultadosBusca, setResultadosBusca] = useState<CustodiadoData[]>([]);
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

  const normalizarTexto = useCallback((texto: string): string => {
    return texto
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }, []);

  const buscarPessoa = useCallback(async () => {
    const numeroProcesso = buscaProcesso.trim();

    if (!numeroProcesso) {
      error('Campo vazio', 'Digite um termo para buscar');
      return;
    }

    if (!custodiados || custodiados.length === 0) {
      error('Dados não carregados', 'Aguarde o carregamento dos dados');
      return;
    }

    setEstado('buscando');
    setMostrarResultados(false);
    setResultadosBusca([]);

    try {
      const termoNormalizado = normalizarTexto(numeroProcesso);

      const pessoasEncontradas = custodiados.filter(p => {
        const nomeNormalizado = normalizarTexto(p.nome);
        const processoNormalizado = normalizarTexto(p.processo);
        const cpfNormalizado = p.cpf ? normalizarTexto(p.cpf) : '';

        return nomeNormalizado.includes(termoNormalizado) ||
          processoNormalizado.includes(termoNormalizado) ||
          cpfNormalizado.includes(termoNormalizado);
      });

      setEstado('inicial');

      if (pessoasEncontradas.length > 0) {
        setResultadosBusca(pessoasEncontradas);
        setMostrarResultados(true);
        success('Resultados encontrados', `${pessoasEncontradas.length} pessoa(s) encontrada(s)`);
      } else {
        setResultadosBusca([]);
        setMostrarResultados(false);
        error('Pessoa não encontrada', 'Nenhuma pessoa encontrada para o termo de busca informado');
      }
    } catch (err) {
      console.error('Erro ao buscar pessoa:', err);
      setEstado('inicial');
      error('Erro na busca', 'Ocorreu um erro ao buscar a pessoa');
    }
  }, [buscaProcesso, custodiados, success, error, normalizarTexto]);

  const selecionarPessoa = useCallback((pessoaSelecionada: CustodiadoData) => {
    setCustodiado(pessoaSelecionada);
    setMostrarResultados(false);
    setExpandedSection('dados-pessoais');
    success('Pessoa selecionada', `${pessoaSelecionada.nome} - ${pessoaSelecionada.processo}`);
  }, [success]);

  const [buscaInicialFeita, setBuscaInicialFeita] = useState(false);

  useEffect(() => {
    if (processo && custodiados && custodiados.length > 0 && !custodiado && !buscaInicialFeita) {
      setBuscaInicialFeita(true);
      buscarPessoa();
    }
  }, [processo, custodiados, custodiado, buscaInicialFeita, buscarPessoa]);

  useEffect(() => {
    if (estado === 'sucesso' && custodiado && custodiado.periodicidade) {
      const proximaData = calcularProximoComparecimento(
        formulario.dataComparecimento,
        custodiado.periodicidade
      );
      setProximoComparecimento(dateUtils.formatToBR(proximaData));
    }
  }, [estado, custodiado, formulario.dataComparecimento]);

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

  const confirmarComparecimento = async () => {
    if (!custodiado) {
      error('Erro', 'Nenhuma pessoa selecionada');
      return;
    }

    if (!custodiado.id || custodiado.id === 0) {
      error('Erro', 'ID do custodiado inválido');
      return;
    }

    if (!enderecoRespondido) {
      error('Atenção', 'Você precisa responder se houve mudança de endereço');
      return;
    }

    if (atualizacaoEndereco.houveAlteracao) {
      if (!atualizacaoEndereco.endereco?.cep ||
        !atualizacaoEndereco.endereco?.logradouro ||
        !atualizacaoEndereco.endereco?.bairro ||
        !atualizacaoEndereco.endereco?.cidade ||
        !atualizacaoEndereco.endereco?.estado) {
        error('Endereço incompleto', 'Preencha todos os campos obrigatórios do endereço');
        return;
      }

      if (!atualizacaoEndereco.motivoAlteracao || atualizacaoEndereco.motivoAlteracao.trim().length < 10) {
        error('Motivo inválido', 'O motivo da alteração deve ter pelo menos 10 caracteres');
        return;
      }
    }

    setEstado('buscando');

    try {
      const horaFormatada = formatarHoraParaAPI(formulario.horaComparecimento);

      const dadosComparecimento: ComparecimentoDTO = {
        custodiadoId: custodiado.id,
        dataComparecimento: formulario.dataComparecimento,
        horaComparecimento: horaFormatada,
        tipoValidacao: formulario.tipoValidacao,
        validadoPor: formulario.validadoPor.trim() || 'Sistema',
        observacoes: formulario.observacoes?.trim() || undefined,
        motivoMudancaEndereco: atualizacaoEndereco.motivoAlteracao!,
        novoEndereco: atualizacaoEndereco.houveAlteracao ? {
          cep: atualizacaoEndereco.endereco!.cep,
          logradouro: atualizacaoEndereco.endereco!.logradouro,
          numero: atualizacaoEndereco.endereco!.numero,
          complemento: atualizacaoEndereco.endereco!.complemento,
          bairro: atualizacaoEndereco.endereco!.bairro,
          cidade: atualizacaoEndereco.endereco!.cidade,
          estado: atualizacaoEndereco.endereco!.estado,

        } : undefined
      };

      const dadosValidados = validateBeforeSend(dadosComparecimento);
      const dadosLimpos = sanitizeFormData(dadosValidados);

      logFormDataForDebug(dadosLimpos, 'Dados enviados para API');

      const result = await registrarComparecimento(dadosLimpos);

      if (result.success) {
        setMensagem(`Comparecimento registrado com sucesso para ${custodiado.nome}`);
        setEstado('sucesso');

        // Atualizar dados antes de redirecionar
        try {
          await refetch();
          console.log('[ConfirmarPresenca] Dados atualizados com sucesso');
        } catch (error) {
          console.error('[ConfirmarPresenca] Erro ao atualizar dados:', error);
        }

        // Marcar que precisa atualizar a lista geral
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('needsRefetch', 'true');
          sessionStorage.setItem('lastUpdate', Date.now().toString());
        }

        setTimeout(() => {
          // Redirecionar para a lista geral com parâmetro de atualização
          router.push(`/dashboard/geral?updated=${Date.now()}`);
        }, 2000);
      } else {
        throw new Error(result.message || 'Erro ao registrar comparecimento');
      }

    } catch (err) {
      console.error('Erro ao confirmar comparecimento:', err);
      setEstado('erro');
      setMensagem(err instanceof Error ? err.message : 'Erro desconhecido ao confirmar comparecimento');
      error('Erro', 'Não foi possível registrar o comparecimento');
    }
  };

  const handleInputChange = (campo: keyof FormularioComparecimento, valor: string) => {
    setFormulario(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  const handleEnderecoChange = (novoEndereco: Partial<Endereco>) => {
    setAtualizacaoEndereco(prev => ({
      ...prev,
      novoEndereco: {
        ...prev.endereco,
        ...novoEndereco
      } as Endereco
    }));
  };

  const MobileSection = ({ title, icon: Icon, isExpanded, onToggle, children }: MobileSectionProps) => (
    <div className="bg-white rounded-lg shadow-sm mb-3 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5 text-primary" />
          <span className="font-semibold text-gray-800">{title}</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>
      {isExpanded && (
        <div className="p-4 pt-0 border-t border-gray-100">
          {children}
        </div>
      )}
    </div>
  );

  if (loadingCustodiados) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Carregando dados...</p>
        </div>
      </div>
    );
  }

  if (errorCustodiados) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h3 className="text-red-800 font-semibold mb-2 flex items-center gap-2">
            <XCircle className="w-5 h-5" />
            Erro ao carregar dados
          </h3>
          <p className="text-red-600 mb-4">{errorCustodiados}</p>
          <button
            onClick={() => refetch()}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-4 md:p-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-2xl md:text-3xl font-bold text-primary-dark">
              Confirmar Comparecimento
            </h1>
          </div>
          <p className="text-gray-600 text-sm md:text-base ml-9 md:ml-0">
            Registre o comparecimento de forma rápida e eficiente
          </p>
        </div>

        {/* Estados de Feedback */}
        {estado === 'sucesso' && (
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 mb-6 animate-in fade-in slide-in-from-top-4">
            <div className="flex items-start gap-4">
              <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="text-green-800 font-semibold text-lg mb-2">Sucesso!</h3>
                <p className="text-green-700 mb-3">{mensagem}</p>
                {proximoComparecimento && (
                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <p className="text-sm text-gray-600 mb-1">Próximo comparecimento calculado:</p>
                    <p className="text-lg font-semibold text-primary">{proximoComparecimento}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Periodicidade: {custodiado && formatarPeriodicidade(custodiado.periodicidade)}
                    </p>
                  </div>
                )}
                <p className="text-sm text-green-600 mt-3">Redirecionando para o painel...</p>
              </div>
            </div>
          </div>
        )}

        {estado === 'erro' && (
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 mb-6 animate-in fade-in slide-in-from-top-4">
            <div className="flex items-start gap-4">
              <XCircle className="w-8 h-8 text-red-600 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="text-red-800 font-semibold text-lg mb-2">Erro ao Registrar</h3>
                <p className="text-red-700 mb-4">{mensagem}</p>
                <button
                  onClick={() => setEstado('inicial')}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Tentar Novamente
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Layout */}
        {isMobile && estado !== 'sucesso' && (
          <div className="space-y-3">
            {/* Busca */}
            <MobileSection
              title="Buscar Pessoa"
              icon={Search}
              isExpanded={expandedSection === 'busca'}
              onToggle={() => setExpandedSection(expandedSection === 'busca' ? null : 'busca')}
            >
              <div className="space-y-3">
                <div className="relative">
                  <input
                    type="text"
                    value={buscaProcesso}
                    onChange={(e) => setBuscaProcesso(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && buscarPessoa()}
                    placeholder="Nome, CPF ou processo..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-sm"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                </div>

                <button
                  onClick={buscarPessoa}
                  disabled={estado === 'buscando'}
                  className="w-full bg-primary text-white py-3 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
                >
                  {estado === 'buscando' ? 'Buscando...' : 'Buscar'}
                </button>

                {mostrarResultados && resultadosBusca.length > 0 && (
                  <div className="space-y-2 mt-4">
                    <p className="text-sm font-medium text-gray-700">
                      {resultadosBusca.length} resultado(s) encontrado(s):
                    </p>
                    {resultadosBusca.map((pessoa, idx) => (
                      <button
                        key={idx}
                        onClick={() => selecionarPessoa(pessoa)}
                        className="w-full p-3 border border-gray-200 rounded-lg hover:border-primary hover:bg-blue-50 transition-colors text-left"
                      >
                        <p className="font-medium text-gray-800">{pessoa.nome}</p>
                        <p className="text-sm text-gray-600">{pessoa.processo}</p>
                        <p className="text-xs text-gray-500">CPF: {pessoa.cpf}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </MobileSection>

            {/* Dados Pessoais */}
            {custodiado && (
              <>
                <MobileSection
                  title="Dados Pessoais"
                  icon={User}
                  isExpanded={expandedSection === 'dados-pessoais'}
                  onToggle={() => setExpandedSection(expandedSection === 'dados-pessoais' ? null : 'dados-pessoais')}
                >
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500">Nome</p>
                      <p className="font-medium text-gray-800">{custodiado.nome}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-gray-500">CPF</p>
                        <p className="font-medium text-gray-800">{custodiado.cpf}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">RG</p>
                        <p className="font-medium text-gray-800">{custodiado.rg || 'Não informado'}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Processo</p>
                      <p className="font-medium text-gray-800">{custodiado.processo}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Periodicidade</p>
                      <p className="font-medium text-gray-800">{formatarPeriodicidade(custodiado.periodicidade)}</p>
                    </div>
                  </div>
                </MobileSection>

                {/* Endereço */}
                <MobileSection
                  title="Verificação de Endereço"
                  icon={MapPin}
                  isExpanded={expandedSection === 'endereco'}
                  onToggle={() => setExpandedSection(expandedSection === 'endereco' ? null : 'endereco')}
                >
                  {!enderecoRespondido ? (
                    <div className="space-y-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-blue-800 mb-3 font-medium">
                          O endereço cadastrado está correto?
                        </p>
                        {custodiado.endereco && (
                          <div className="text-sm text-blue-700 space-y-1">
                            <p>{custodiado.endereco.logradouro}{custodiado.endereco.numero ? `, ${custodiado.endereco.numero}` : ''}</p>
                            <p>{custodiado.endereco.bairro}</p>
                            <p>{custodiado.endereco.cidade} - {custodiado.endereco.estado}</p>
                            <p>CEP: {custodiado.endereco.cep}</p>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => {
                            setEnderecoRespondido(true);
                            setAtualizacaoEndereco({ houveAlteracao: false });
                          }}
                          className="bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition-colors font-medium"
                        >
                          Sim, está correto
                        </button>
                        <button
                          onClick={() => {
                            setEnderecoRespondido(true);
                            setAtualizacaoEndereco({
                              houveAlteracao: true,
                              endereco: custodiado.endereco || {
                                cep: '',
                                logradouro: '',
                                numero: '',
                                complemento: '',
                                bairro: '',
                                cidade: '',
                                estado: ''
                              }
                            });
                          }}
                          className="bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 transition-colors font-medium"
                        >
                          Não, houve mudança
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {atualizacaoEndereco.houveAlteracao ? (
                        <div>
                          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
                            <p className="text-orange-800 font-medium text-sm">
                              ⚠️ Atualizando endereço
                            </p>
                          </div>

                          <EnderecoForm
                            endereco={atualizacaoEndereco.endereco!}
                            onEnderecoChange={handleEnderecoChange}
                          />

                          <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Motivo da alteração *
                            </label>
                            <textarea
                              value={atualizacaoEndereco.motivoAlteracao || ''}
                              onChange={(e) => {
                                const value = e.target.value;
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
                            className="text-orange-600 hover:text-orange-800 transition-colors underline text-sm mt-3"
                          >
                            Alterar resposta
                          </button>
                        </div>
                      ) : (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <p className="text-green-800 font-medium text-sm">
                              Endereço confirmado
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              setEnderecoRespondido(false);
                              setAtualizacaoEndereco({ houveAlteracao: false });
                            }}
                            className="text-green-600 hover:text-green-800 text-sm underline"
                          >
                            Alterar resposta
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </MobileSection>

                {/* Formulário de Comparecimento */}
                <MobileSection
                  title="Dados do Comparecimento"
                  icon={FileText}
                  isExpanded={expandedSection === 'comparecimento'}
                  onToggle={() => setExpandedSection(expandedSection === 'comparecimento' ? null : 'comparecimento')}
                >
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tipo de Validação *
                      </label>
                      <select
                        value={formulario.tipoValidacao}
                        onChange={(e) => handleInputChange('tipoValidacao', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        placeholder="Nome do servidor"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Data *
                      </label>
                      <input
                        type="date"
                        value={formulario.dataComparecimento}
                        onChange={(e) => handleInputChange('dataComparecimento', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Horário *
                      </label>
                      <input
                        type="time"
                        value={formulario.horaComparecimento}
                        onChange={(e) => handleInputChange('horaComparecimento', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Observações
                      </label>
                      <textarea
                        value={formulario.observacoes}
                        onChange={(e) => handleInputChange('observacoes', e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
                        placeholder="Adicione observações..."
                      />
                    </div>
                  </div>
                </MobileSection>

                {/* Botões de Ação Mobile */}
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 safe-area-bottom">
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => router.back()}
                      className="bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={confirmarComparecimento}
                      disabled={loadingComparecimento || !enderecoRespondido}
                      className="bg-green-500 text-white py-3 rounded-lg font-medium hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {loadingComparecimento ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      ) : (
                        <>
                          <Save className="w-5 h-5" />
                          Confirmar
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Desktop Layout */}
        {!isMobile && estado !== 'sucesso' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="space-y-8">
              {/* Busca Desktop */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-primary-dark flex items-center gap-2">
                  <Search className="w-5 h-5" />
                  Buscar Pessoa
                </h3>

                <div className="flex gap-3">
                  <input
                    type="text"
                    value={buscaProcesso}
                    onChange={(e) => setBuscaProcesso(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && buscarPessoa()}
                    placeholder="Digite o nome, CPF ou número do processo..."
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  <button
                    onClick={buscarPessoa}
                    disabled={estado === 'buscando'}
                    className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2"
                  >
                    <Search className="w-5 h-5" />
                    {estado === 'buscando' ? 'Buscando...' : 'Buscar'}
                  </button>
                </div>

                {mostrarResultados && resultadosBusca.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">
                      {resultadosBusca.length} resultado(s) encontrado(s):
                    </p>
                    <div className="grid gap-3">
                      {resultadosBusca.map((pessoa, idx) => (
                        <button
                          key={idx}
                          onClick={() => selecionarPessoa(pessoa)}
                          className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary hover:bg-blue-50 transition-all text-left"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-gray-800 text-lg">{pessoa.nome}</p>
                              <p className="text-gray-600">{pessoa.processo}</p>
                              <p className="text-sm text-gray-500">CPF: {pessoa.cpf}</p>
                            </div>
                            <UserCheck className="w-6 h-6 text-primary" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {custodiado && (
                <>
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-xl font-semibold text-primary-dark mb-4 flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Dados da Pessoa Selecionada
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-gray-50 p-6 rounded-lg">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Nome Completo</p>
                        <p className="font-semibold text-gray-800">{custodiado.nome}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">CPF</p>
                        <p className="font-semibold text-gray-800">{custodiado.cpf}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">RG</p>
                        <p className="font-semibold text-gray-800">{custodiado.rg || 'Não informado'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Processo</p>
                        <p className="font-semibold text-gray-800">{custodiado.processo}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Vara</p>
                        <p className="font-semibold text-gray-800">{custodiado.vara}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Periodicidade</p>
                        <p className="font-semibold text-gray-800">{formatarPeriodicidade(custodiado.periodicidade)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold text-primary-dark flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      Verificação de Endereço
                    </h3>

                    {!enderecoRespondido ? (
                      <div className="space-y-4">
                        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
                          <p className="text-blue-800 font-medium mb-4">
                            O endereço cadastrado está correto?
                          </p>
                          {custodiado.endereco && (
                            <div className="bg-white rounded-lg p-4 mb-4 border border-blue-100">
                              <p className="text-gray-800">{custodiado.endereco.logradouro}{custodiado.endereco.numero ? `, ${custodiado.endereco.numero}` : ''}</p>
                              <p className="text-gray-800">{custodiado.endereco.complemento}</p>
                              <p className="text-gray-800">{custodiado.endereco.bairro}</p>
                              <p className="text-gray-800">{custodiado.endereco.cidade} - {custodiado.endereco.estado}</p>
                              <p className="text-gray-600 text-sm mt-2">CEP: {custodiado.endereco.cep}</p>
                            </div>
                          )}

                          <div className="flex gap-4">
                            <button
                              onClick={() => {
                                setEnderecoRespondido(true);
                                setAtualizacaoEndereco({ houveAlteracao: false });
                              }}
                              className="flex-1 bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition-colors font-medium flex items-center justify-center gap-2"
                            >
                              <CheckCircle className="w-5 h-5" />
                              Sim, está correto
                            </button>
                            <button
                              onClick={() => {
                                setEnderecoRespondido(true);
                                setAtualizacaoEndereco({
                                  houveAlteracao: true,
                                  endereco: custodiado.endereco || {
                                    cep: '',
                                    logradouro: '',
                                    numero: '',
                                    complemento: '',
                                    bairro: '',
                                    cidade: '',
                                    estado: ''
                                  }
                                });
                              }}
                              className="flex-1 bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 transition-colors font-medium flex items-center justify-center gap-2"
                            >
                              <AlertCircle className="w-5 h-5" />
                              Não, houve mudança
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div>
                        {atualizacaoEndereco.houveAlteracao ? (
                          <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                            <div className="flex items-center gap-2 mb-4">
                              <AlertCircle className="w-5 h-5 text-orange-600" />
                              <p className="text-orange-800 font-medium">
                                Atualização de endereço necessária
                              </p>
                            </div>

                            <EnderecoForm
                              endereco={atualizacaoEndereco.endereco!}
                              onEnderecoChange={handleEnderecoChange}
                            />

                            <div className="mt-4">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Motivo da alteração *
                              </label>
                              <textarea
                                value={atualizacaoEndereco.motivoAlteracao || ''}
                                onChange={(e) => {
                                  const value = e.target.value;
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
                              className="text-orange-600 hover:text-orange-800 transition-colors underline mt-3"
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
                    )}
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

export default withSearchParams(ConfirmarPresencaPage);