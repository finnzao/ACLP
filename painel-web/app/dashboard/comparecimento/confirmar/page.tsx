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
  RefreshCw,
  UserCheck,
  ChevronDown,
  ChevronUp,
  Smartphone,
  Building,
  Search,
  Phone,
  Home,
  Camera,
  AlertTriangle,
  Eye,
  EyeOff
} from 'lucide-react';

import { useCustodiados, useComparecimentos } from '@/hooks/useAPI';
import { CustodiadoResponse, ComparecimentoDTO, TipoValidacao } from '@/types/api';
import EnderecoForm from '@/components/EnderecoForm';
import { useToastHelpers } from '@/components/Toast';
import { calcularProximoComparecimento, formatarPeriodicidade } from '@/lib/utils/periodicidade';
import { registrarComparecimentoCompleto, atualizarEnderecoPessoa } from '@/lib/api/comparecimentos';
import CadastroFacial from '@/components/CadastroFacial';
import { verificarRosto } from '@/lib/api/facialRecognition';
import { isCustomError, getErrorMessage, ErrorCodes } from '@/lib/utils/errorHandler';

// Utilitários de data
const dateUtils = {
  formatToBR: (date: string | Date): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('pt-BR');
  },
  getCurrentDate: (): string => {
    return new Date().toISOString().split('T')[0];
  },
  getCurrentTime: (): string => {
    return new Date().toTimeString().slice(0, 5);
  }
};

// Interface para o estado do formulário
interface FormularioComparecimento {
  dataComparecimento: string;
  horaComparecimento: string;
  tipoValidacao: TipoValidacao;
  observacoes: string;
  validadoPor: string;
}

interface AtualizacaoEndereco {
  houveAlteracao: boolean;
  endereco?: any;
  motivoAlteracao?: string;
}

export default function ConfirmarPresencaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const processo = searchParams.get('processo');
  const { success, error, warning, info } = useToastHelpers();

  // Hooks da API
  const { custodiados, loading: loadingCustodiados, error: errorCustodiados, refetch } = useCustodiados();
  const { registrarComparecimento, loading: loadingComparecimento } = useComparecimentos();

  // Estados principais
  const [pessoa, setPessoa] = useState<CustodiadoResponse | null>(null);
  const [estado, setEstado] = useState<'inicial' | 'buscando' | 'confirmando' | 'sucesso' | 'erro'>('inicial');
  const [mensagem, setMensagem] = useState('');
  const [buscaProcesso, setBuscaProcesso] = useState(processo || '');

  // Estados do formulário
  const [formulario, setFormulario] = useState<FormularioComparecimento>({
    dataComparecimento: dateUtils.getCurrentDate(),
    horaComparecimento: dateUtils.getCurrentTime(),
    tipoValidacao: TipoValidacao.PRESENCIAL,
    observacoes: '',
    validadoPor: 'Servidor Atual'
  });

  // Estados para atualização de endereço
  const [mostrarAtualizacaoEndereco, setMostrarAtualizacaoEndereco] = useState(false);
  const [atualizacaoEndereco, setAtualizacaoEndereco] = useState<AtualizacaoEndereco>({
    houveAlteracao: false
  });
  const [enderecoRespondido, setEnderecoRespondido] = useState(false);

  // Estados para reconhecimento facial
  const [mostrarCadastroFacial, setMostrarCadastroFacial] = useState(false);
  const [verificacaoFacialCompleta, setVerificacaoFacialCompleta] = useState(false);
  const [usarReconhecimentoFacial, setUsarReconhecimentoFacial] = useState(false);

  // Estados mobile e UI
  const [isMobile, setIsMobile] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>('busca');
  const [proximoComparecimento, setProximoComparecimento] = useState<string | null>(null);

  // Verificar se é mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Buscar pessoa quando o processo é fornecido na URL
  useEffect(() => {
    if (processo && custodiados.length > 0 && !pessoa) {
      buscarPessoa(processo);
    }
  }, [processo, custodiados, pessoa]);

  // Calcular próximo comparecimento quando bem-sucedido
  useEffect(() => {
    if (estado === 'sucesso' && pessoa) {
      const proximaData = calcularProximoComparecimento(
        formulario.dataComparecimento,
        pessoa.periodicidade
      );
      setProximoComparecimento(dateUtils.formatToBR(proximaData));
    }
  }, [estado, pessoa, formulario.dataComparecimento]);

  // Buscar pessoa por processo
  const buscarPessoa = useCallback(async (numeroProcesso: string) => {
    if (!numeroProcesso.trim()) return;

    setEstado('buscando');
    
    try {
      const pessoaEncontrada = custodiados.find(p => 
        p.processo.toLowerCase().includes(numeroProcesso.toLowerCase()) ||
        p.nome.toLowerCase().includes(numeroProcesso.toLowerCase())
      );

      if (pessoaEncontrada) {
        setPessoa(pessoaEncontrada);
        setFormulario(prev => ({
          ...prev,
          processo: pessoaEncontrada.processo
        }));
        setEstado('inicial');
        setExpandedSection('dados-pessoais');
        success('Pessoa encontrada', `${pessoaEncontrada.nome} - ${pessoaEncontrada.processo}`);
      } else {
        setEstado('erro');
        setMensagem('Pessoa não encontrada para o termo de busca informado.');
        error('Pessoa não encontrada', 'Verifique o número do processo ou nome da pessoa');
      }
    } catch (err) {
      console.error('Erro ao buscar pessoa:', err);
      setEstado('erro');
      setMensagem('Erro ao buscar pessoa. Tente novamente.');
      error('Erro na busca', 'Ocorreu um erro ao buscar a pessoa');
    }
  }, [custodiados, success, error]);

  // Manipular mudanças no formulário
  const handleInputChange = (field: keyof FormularioComparecimento, value: string) => {
    setFormulario(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Manipular resposta sobre atualização de endereço
  const handleRespostaAlteracaoEndereco = (houve: boolean) => {
    setAtualizacaoEndereco(prev => ({
      ...prev,
      houveAlteracao: houve
    }));
    setEnderecoRespondido(true);
    
    if (houve) {
      setMostrarAtualizacaoEndereco(true);
      setExpandedSection('endereco');
    } else {
      setMostrarAtualizacaoEndereco(false);
    }
  };

  // Verificação facial
  const iniciarVerificacaoFacial = async (imageBase64: string) => {
    if (!pessoa) return;

    try {
      const resultado = await verificarRosto(pessoa.processo, imageBase64);
      
      if (resultado.success && resultado.verified) {
        setVerificacaoFacialCompleta(true);
        success('Verificação facial', `Identidade confirmada com ${resultado.confidence}% de confiança`);
        return true;
      } else {
        error('Verificação facial', resultado.message || 'Falha na verificação');
        return false;
      }
    } catch (err) {
      if (isCustomError(err) && err.code === ErrorCodes.NO_REFERENCE_PHOTO) {
        // Oferecer cadastro de foto
        warning('Foto não cadastrada', 'Será necessário cadastrar uma foto de referência');
        setMostrarCadastroFacial(true);
        return false;
      } else {
        error('Erro na verificação', getErrorMessage(err));
        return false;
      }
    }
  };

  // Confirmar comparecimento
  const confirmarComparecimento = async () => {
    if (!pessoa) return;

    // Validações
    if (usarReconhecimentoFacial && !verificacaoFacialCompleta) {
      error('Verificação pendente', 'Complete a verificação facial antes de confirmar');
      return;
    }

    if (!enderecoRespondido) {
      error('Informação pendente', 'Responda sobre a atualização de endereço');
      setExpandedSection('endereco');
      return;
    }

    setEstado('confirmando');

    try {
      // Preparar dados do comparecimento com valores corretos para o backend
      const dadosComparecimento: ComparecimentoDTO = {
        custodiadoId: pessoa.id,
        dataComparecimento: formulario.dataComparecimento,
        horaComparecimento: formulario.horaComparecimento,
        tipoValidacao: formulario.tipoValidacao as any, // O backend espera string literal
        observacoes: formulario.observacoes,
        validadoPor: formulario.validadoPor,
        anexos: '', // Campo opcional
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

      console.log('Dados do comparecimento sendo enviados:', dadosComparecimento);

      // Registrar comparecimento
      const resultado = await registrarComparecimento(dadosComparecimento);

      if (resultado.success) {
        setEstado('sucesso');
        const msgEndereco = atualizacaoEndereco.houveAlteracao ? ' Endereço atualizado.' : '';
        setMensagem(`Comparecimento confirmado com sucesso!${msgEndereco}`);
        success('Comparecimento registrado', resultado.message || 'Presença confirmada com sucesso');
      } else {
        setEstado('erro');
        setMensagem(resultado.message || 'Erro ao confirmar comparecimento');
        error('Erro no registro', resultado.message || 'Falha ao registrar comparecimento');
      }
    } catch (err: any) {
      console.error('Erro ao confirmar comparecimento:', err);
      setEstado('erro');
      
      // Tratamento específico para erro de JSON malformado
      if (err.code === 'JSON_INVALIDO' || err.error === 'Malformed JSON') {
        setMensagem('Erro nos dados enviados. Verifique se todos os campos estão preenchidos corretamente.');
        error('Erro de validação', 'Dados inválidos. Verifique os campos obrigatórios.');
      } else {
        setMensagem('Erro interno. Tente novamente.');
        error('Erro interno', 'Ocorreu um erro inesperado. Tente novamente.');
      }
    }
  };

  // Componente de seção móvel
  const MobileSection = ({ 
    id, 
    title, 
    icon, 
    children, 
    defaultExpanded = false,
    badge = null
  }: { 
    id: string; 
    title: string; 
    icon: React.ReactNode; 
    children: React.ReactNode;
    defaultExpanded?: boolean;
    badge?: React.ReactNode;
  }) => {
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
          <div className="px-4 pb-4 animate-in slide-in-from-top-2">
            {children}
          </div>
        )}
      </div>
    );
  };

  // Estados de loading
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

  // Erro no carregamento dos custodiados
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

  // Interface Mobile
  if (isMobile) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header Mobile */}
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

        {/* Content Mobile */}
        <div className="p-4 pb-24">
          {/* Estados de carregamento e erro */}
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
                  onClick={() => setEstado('inicial')}
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

          {/* Formulário principal - Mobile */}
          {estado === 'inicial' && (
            <>
              {/* Busca de Pessoa */}
              <MobileSection
                id="busca"
                title="Buscar Pessoa"
                icon={<Search className="w-5 h-5 text-blue-600" />}
                defaultExpanded={!pessoa}
              >
                <div className="space-y-3">
                  <input
                    type="text"
                    value={buscaProcesso}
                    onChange={(e) => setBuscaProcesso(e.target.value)}
                    placeholder="Número do processo ou nome"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <button
                    onClick={() => buscarPessoa(buscaProcesso)}
                    className="w-full bg-blue-500 text-white py-2 rounded-lg text-sm font-medium"
                  >
                    Buscar
                  </button>
                </div>
              </MobileSection>

              {/* Dados da Pessoa */}
              {pessoa && (
                <>
                  <MobileSection
                    id="dados-pessoais"
                    title="Dados da Pessoa"
                    icon={<User className="w-5 h-5 text-green-600" />}
                    badge={
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        pessoa.status === 'EM_CONFORMIDADE' 
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
                    </div>
                  </MobileSection>

                  {/* Reconhecimento Facial */}
                  <MobileSection
                    id="facial"
                    title="Verificação de Identidade"
                    icon={<Camera className="w-5 h-5 text-purple-600" />}
                    badge={
                      verificacaoFacialCompleta ? (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          Verificado
                        </span>
                      ) : null
                    }
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Usar reconhecimento facial</span>
                        <button
                          onClick={() => setUsarReconhecimentoFacial(!usarReconhecimentoFacial)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            usarReconhecimentoFacial ? 'bg-blue-600' : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              usarReconhecimentoFacial ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                      
                      {usarReconhecimentoFacial && !verificacaoFacialCompleta && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <p className="text-blue-800 text-sm mb-2">
                            Tire uma foto para verificar a identidade
                          </p>
                          <button
                            onClick={() => setMostrarCadastroFacial(true)}
                            className="w-full bg-blue-500 text-white py-2 rounded text-sm"
                          >
                            Iniciar Verificação
                          </button>
                        </div>
                      )}
                    </div>
                  </MobileSection>

                  {/* Atualização de Endereço */}
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
                            className="bg-yellow-500 text-white py-2 rounded text-sm font-medium"
                          >
                            Sim, mudou
                          </button>
                          <button
                            onClick={() => handleRespostaAlteracaoEndereco(false)}
                            className="bg-green-500 text-white py-2 rounded text-sm font-medium"
                          >
                            Não mudou
                          </button>
                        </div>
                      </div>
                    ) : atualizacaoEndereco.houveAlteracao ? (
                      <div className="space-y-4">
                        <EnderecoForm
                          endereco={atualizacaoEndereco.endereco || {}}
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
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Motivo da mudança
                          </label>
                          <textarea
                            value={atualizacaoEndereco.motivoAlteracao || ''}
                            onChange={(e) => 
                              setAtualizacaoEndereco(prev => ({
                                ...prev,
                                motivoAlteracao: e.target.value
                              }))
                            }
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            placeholder="Ex: Mudança familiar, trabalho..."
                          />
                        </div>
                        <button
                          onClick={() => {
                            setEnderecoRespondido(false);
                            setAtualizacaoEndereco({ houveAlteracao: false });
                          }}
                          className="text-sm text-gray-600 underline"
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
                          className="text-xs text-green-600 underline mt-2"
                        >
                          Alterar resposta
                        </button>
                      </div>
                    )}
                  </MobileSection>

                  {/* Detalhes do Comparecimento */}
                  <MobileSection
                    id="comparecimento"
                    title="Detalhes do Comparecimento"
                    icon={<UserCheck className="w-5 h-5 text-blue-600" />}
                  >
                    <div className="space-y-4">
                      {/* Tipo de Validação */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Tipo de Validação
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => handleInputChange('tipoValidacao', TipoValidacao.PRESENCIAL)}
                            className={`p-3 rounded-lg border-2 transition-all ${
                              formulario.tipoValidacao === TipoValidacao.PRESENCIAL
                                ? 'border-primary bg-primary text-white'
                                : 'border-gray-300 bg-white text-gray-700'
                            }`}
                          >
                            <Building className="w-4 h-4 mx-auto mb-1" />
                            <span className="text-xs font-medium">Presencial</span>
                          </button>
                          <button
                            onClick={() => handleInputChange('tipoValidacao', TipoValidacao.ONLINE)}
                            className={`p-3 rounded-lg border-2 transition-all ${
                              formulario.tipoValidacao === TipoValidacao.ONLINE
                                ? 'border-primary bg-primary text-white'
                                : 'border-gray-300 bg-white text-gray-700'
                            }`}
                          >
                            <Smartphone className="w-4 h-4 mx-auto mb-1" />
                            <span className="text-xs font-medium">Virtual</span>
                          </button>
                        </div>
                      </div>

                      {/* Data e Hora */}
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

                      {/* Observações */}
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

                      {/* Validado por */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Validado por
                        </label>
                        <input
                          type="text"
                          value={formulario.validadoPor}
                          onChange={(e) => handleInputChange('validadoPor', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          placeholder="Nome do servidor"
                        />
                      </div>
                    </div>
                  </MobileSection>
                </>
              )}
            </>
          )}
        </div>

        {/* Fixed Bottom Actions - Mobile */}
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
                disabled={loadingComparecimento || !enderecoRespondido || (usarReconhecimentoFacial && !verificacaoFacialCompleta)}
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

        {/* Modal de Cadastro Facial */}
        {mostrarCadastroFacial && pessoa && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Verificação Facial</h3>
                  <button
                    onClick={() => setMostrarCadastroFacial(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="p-4">
                <CadastroFacial
                  processo={pessoa.processo}
                  onSuccess={() => {
                    setMostrarCadastroFacial(false);
                    setVerificacaoFacialCompleta(true);
                    success('Verificação completa', 'Identidade verificada com sucesso');
                  }}
                  onError={(error) => {
                    setMostrarCadastroFacial(false);
                    this.error('Erro na verificação', error);
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Interface Desktop
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header Desktop */}
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

        {/* Estados de Loading, Sucesso e Erro - Desktop */}
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
                        ✅ Endereço atualizado com sucesso
                      </p>
                    )}
                  </div>
                )}

                {proximoComparecimento && pessoa && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <h3 className="text-lg font-semibold text-blue-800 mb-2">
                      📅 Próximo Comparecimento
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
                      setVerificacaoFacialCompleta(false);
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

        {/* Formulário Desktop */}
        {estado === 'inicial' && (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="p-8">
              {/* Busca de Pessoa */}
              {!pessoa && (
                <div className="mb-8">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Search className="w-6 h-6 text-blue-600" />
                      <h3 className="text-lg font-semibold text-blue-900">Buscar Pessoa</h3>
                    </div>
                    
                    <div className="flex gap-4">
                      <input
                        type="text"
                        value={buscaProcesso}
                        onChange={(e) => setBuscaProcesso(e.target.value)}
                        placeholder="Digite o número do processo ou nome da pessoa"
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
                  </div>
                </div>
              )}

              {/* Dados da Pessoa */}
              {pessoa && (
                <>
                  <div className="bg-primary p-6 rounded-xl mb-8 text-white">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                        <User className="w-8 h-8" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold">{pessoa.nome}</h2>
                        <p className="text-primary-light">Processo: {pessoa.processo}</p>
                      </div>
                      <div className="ml-auto">
                        <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                          pessoa.status === 'EM_CONFORMIDADE' 
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
                  </div>

                  {/* Verificação Facial */}
                  <div className="mb-8">
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Camera className="w-6 h-6 text-purple-600" />
                          <h3 className="text-lg font-semibold text-purple-900">Verificação de Identidade</h3>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-purple-700">Usar reconhecimento facial</span>
                          <button
                            onClick={() => setUsarReconhecimentoFacial(!usarReconhecimentoFacial)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              usarReconhecimentoFacial ? 'bg-purple-600' : 'bg-gray-200'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                usarReconhecimentoFacial ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                      
                      {usarReconhecimentoFacial && (
                        <div className="space-y-4">
                          {!verificacaoFacialCompleta ? (
                            <div className="bg-purple-100 border border-purple-200 rounded-lg p-4">
                              <p className="text-purple-800 mb-4">
                                Tire uma foto da pessoa para verificar a identidade usando reconhecimento facial.
                              </p>
                              <button
                                onClick={() => setMostrarCadastroFacial(true)}
                                className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-all font-medium flex items-center gap-2"
                              >
                                <Camera className="w-5 h-5" />
                                Iniciar Verificação Facial
                              </button>
                            </div>
                          ) : (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                              <div className="flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                                <p className="text-green-800 font-medium">
                                  Identidade verificada com sucesso!
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Atualização de Endereço */}
                  <div className="mb-8">
                    <div className={`bg-orange-50 border border-orange-200 rounded-lg p-6 ${
                      !enderecoRespondido ? 'ring-2 ring-orange-500 ring-offset-2' : ''
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
                            endereco={atualizacaoEndereco.endereco || {}}
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
                              onChange={(e) => 
                                setAtualizacaoEndereco(prev => ({
                                  ...prev,
                                  motivoAlteracao: e.target.value
                                }))
                              }
                              rows={3}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                              placeholder="Ex: Mudança por questões familiares, trabalho, etc."
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

                  {/* Formulário de Confirmação */}
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold text-primary-dark flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Registrar Comparecimento
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Tipo de Validação */}
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

                      {/* Validado por */}
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

                      {/* Data */}
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

                      {/* Hora */}
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

                    {/* Observações */}
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

                  {/* Botões de Ação */}
                  <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
                    <button
                      onClick={() => router.back()}
                      className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all font-medium"
                    >
                      Cancelar
                    </button>
                    
                    <button
                      onClick={confirmarComparecimento}
                      disabled={
                        loadingComparecimento || 
                        !enderecoRespondido || 
                        (usarReconhecimentoFacial && !verificacaoFacialCompleta)
                      }
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

        {/* Modal de Cadastro/Verificação Facial */}
        {mostrarCadastroFacial && pessoa && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold">Verificação Facial</h3>
                  <button
                    onClick={() => setMostrarCadastroFacial(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
                <p className="text-gray-600 mt-2">
                  Processo: {pessoa.processo} - {pessoa.nome}
                </p>
              </div>
              <div className="p-6">
                <CadastroFacial
                  processo={pessoa.processo}
                  onSuccess={() => {
                    setMostrarCadastroFacial(false);
                    setVerificacaoFacialCompleta(true);
                    success('Verificação completa', 'Identidade verificada com sucesso');
                  }}
                  onError={(error) => {
                    setMostrarCadastroFacial(false);
                    error('Erro na verificação', error);
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Dicas importantes */}
        {estado === 'inicial' && !isMobile && (
          <div className="mt-6 bg-blue-50 rounded-xl p-6">
            <h3 className="font-semibold text-lg mb-3 text-blue-900 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Orientações Importantes
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ul className="space-y-2 text-blue-800">
                <li className="flex items-start">
                  <span className="mr-2">✅</span>
                  <span>Certifique-se de que a pessoa realmente compareceu</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">🏠</span>
                  <span>Sempre pergunte sobre mudança de endereço</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">🕐</span>
                  <span>Registre o horário exato do atendimento</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">📝</span>
                  <span>Adicione observações relevantes quando necessário</span>
                </li>
              </ul>
              <ul className="space-y-2 text-blue-800">
                <li className="flex items-start">
                  <span className="mr-2">📷</span>
                  <span>Use verificação facial quando disponível</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">⚠️</span>
                  <span>Esta ação atualiza automaticamente o status</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">📅</span>
                  <span>O próximo comparecimento será calculado automaticamente</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">🔄</span>
                  <span>Todos os dados são sincronizados em tempo real</span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}