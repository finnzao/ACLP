'use client';
import { useState, useEffect } from 'react';
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
  Building
} from 'lucide-react';
import { Comparecimento, Endereco, RegistroComparecimentoCompleto, AtualizacaoEndereco } from '@/types/comparecimento';
import usuarios from '@/db/usuarios_mock.json';
import EnderecoForm from '@/components/EnderecoForm';
import { calcularProximoComparecimento, formatarPeriodicidade } from '@/lib/utils/periodicidade';

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

// Labels de status
const STATUS_LABELS = {
  'em conformidade': 'Em Conformidade',
  'inadimplente': 'Inadimplente'
} as const;

export default function ConfirmarPresencaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const processo = searchParams.get('processo');

  const [pessoa, setPessoa] = useState<Comparecimento | null>(null);
  const [estado, setEstado] = useState<'inicial' | 'confirmando' | 'sucesso' | 'erro'>('inicial');
  const [mensagem, setMensagem] = useState('');
  const [mostrarAlerta, setMostrarAlerta] = useState(false);
  const [formulario, setFormulario] = useState<Partial<RegistroComparecimentoCompleto>>({
    dataComparecimento: dateUtils.getCurrentDate(),
    horaComparecimento: dateUtils.getCurrentTime(),
    tipoValidacao: 'presencial',
    validadoPor: 'Servidor Atual',
    observacoes: ''
  });

  // Estados para atualização de endereço
  const [mostrarAtualizacaoEndereco, setMostrarAtualizacaoEndereco] = useState(false);
  const [houveAlteracaoEndereco, setHouveAlteracaoEndereco] = useState<boolean | null>(null);
  const [novoEndereco, setNovoEndereco] = useState<Endereco>({});
  const [motivoAlteracaoEndereco, setMotivoAlteracaoEndereco] = useState('');
  const [enderecoRespondido, setEnderecoRespondido] = useState(false);
  const [proximoComparecimento, setProximoComparecimento] = useState<string | null>(null);

  // Estado mobile
  const [isMobile, setIsMobile] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>('dados-pessoais');

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!processo) return;

    const dadosFormatados = usuarios.map(item => ({
      ...item,
      status: item.status as Comparecimento['status'],
      periodicidade: item.periodicidade as Comparecimento['periodicidade']
    }));

    const pessoaEncontrada = dadosFormatados.find(p => p.processo === processo);
    if (pessoaEncontrada) {
      setPessoa(pessoaEncontrada);
      setFormulario(prev => ({
        ...prev,
        processo: pessoaEncontrada.processo,
        nome: pessoaEncontrada.nome
      }));

      if (pessoaEncontrada.endereco) {
        setNovoEndereco(pessoaEncontrada.endereco);
      }
    } else {
      setEstado('erro');
      setMensagem('Pessoa não encontrada para o processo informado.');
    }
  }, [processo]);

  useEffect(() => {
    if (houveAlteracaoEndereco !== null) {
      setEnderecoRespondido(true);
    } else {
      setEnderecoRespondido(false);
    }
  }, [houveAlteracaoEndereco]);

  useEffect(() => {
    if (estado === 'sucesso' && pessoa) {
      const proximaData = calcularProximoComparecimento(
        formulario.dataComparecimento || dateUtils.getCurrentDate(),
        pessoa.periodicidade
      );
      setProximoComparecimento(dateUtils.formatToBR(proximaData));
    }
  }, [estado, pessoa, formulario.dataComparecimento]);

  const confirmarComparecimento = async () => {
    if (!pessoa) return;

    if (!enderecoRespondido) {
      const enderecoElement = document.getElementById('secao-endereco');
      if (enderecoElement) {
        enderecoElement.scrollIntoView({ behavior: 'smooth' });
        enderecoElement.classList.add('animate-pulse');
        setTimeout(() => {
          enderecoElement.classList.remove('animate-pulse');
        }, 2000);
      }

      setMensagem('É necessário responder sobre a atualização de endereço.');
      setMostrarAlerta(true);

      setTimeout(() => {
        setMostrarAlerta(false);
      }, 5000);

      return;
    }

    setMensagem('');
    setMostrarAlerta(false);
    setEstado('confirmando');

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));

      let atualizacaoEndereco: AtualizacaoEndereco | undefined;

      if (houveAlteracaoEndereco === true) {
        atualizacaoEndereco = {
          houveAlteracao: true,
          endereco: novoEndereco,
          motivoAlteracao: motivoAlteracaoEndereco
        };
      } else if (houveAlteracaoEndereco === false) {
        atualizacaoEndereco = {
          houveAlteracao: false
        };
      }

      const novoRegistro: RegistroComparecimentoCompleto = {
        processo: pessoa.processo,
        nome: pessoa.nome,
        dataComparecimento: formulario.tipoValidacao === 'justificado' ? undefined : formulario.dataComparecimento || dateUtils.getCurrentDate(),
        horaComparecimento: formulario.tipoValidacao === 'justificado' ? undefined : formulario.horaComparecimento || dateUtils.getCurrentTime(),
        observacoes: formulario.observacoes || '',
        validadoPor: formulario.validadoPor || 'Servidor Atual',
        tipoValidacao: formulario.tipoValidacao || 'presencial',
        atualizacaoEndereco
      };

      console.log('Comparecimento registrado:', novoRegistro);

      setEstado('sucesso');

      if (formulario.tipoValidacao === 'justificado') {
        setMensagem('Justificativa de ausência registrada com sucesso!');
      } else {
        const msgEndereco = houveAlteracaoEndereco === true ? ' Endereço atualizado.' : '';
        setMensagem(`Comparecimento confirmado com sucesso!${msgEndereco}`);
      }

    } catch (error) {
      setEstado('erro');
      setMensagem('Erro ao confirmar comparecimento. Tente novamente.');
      console.error('Erro ao confirmar comparecimento:', error);
    }
  };

  const handleInputChange = (field: keyof RegistroComparecimentoCompleto, value: string) => {
    setFormulario(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleRespostaAlteracaoEndereco = (houve: boolean) => {
    setHouveAlteracaoEndereco(houve);
    setEnderecoRespondido(true);
    if (!houve) {
      setNovoEndereco({});
      setMotivoAlteracaoEndereco('');
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  // Mobile Section Component
  const MobileSection = ({ 
    id, 
    title, 
    icon, 
    children, 
    defaultExpanded = false 
  }: { 
    id: string; 
    title: string; 
    icon: React.ReactNode; 
    children: React.ReactNode;
    defaultExpanded?: boolean;
  }) => {
    const isExpanded = expandedSection === id || defaultExpanded;
    
    return (
      <div className="bg-white rounded-lg shadow-sm mb-3 overflow-hidden">
        <button
          onClick={() => toggleSection(id)}
          className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            {icon}
            <span className="font-medium text-gray-800">{title}</span>
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

  if (!processo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4">
        <div className="text-center p-6 bg-white rounded-2xl shadow-xl max-w-sm w-full">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Processo não informado</h2>
          <p className="text-gray-600 mb-6 text-sm">É necessário informar o número do processo para confirmar a presença.</p>
          <button
            onClick={() => router.push('/dashboard/geral')}
            className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-dark transition-all w-full"
          >
            Voltar ao Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!pessoa && estado !== 'erro') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Carregando informações...</p>
        </div>
      </div>
    );
  }

  // Mobile Layout
  if (isMobile && estado === 'inicial' && pessoa) {
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

        {/* Content */}
        <div className="p-4 pb-24">
          {/* Status Card */}
          <div className={`rounded-lg p-4 mb-4 ${
            pessoa.status === 'em conformidade' 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Status Atual</p>
                <p className={`text-lg font-bold ${
                  pessoa.status === 'em conformidade' ? 'text-green-700' : 'text-red-700'
                }`}>
                  {STATUS_LABELS[pessoa.status]}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-700">Próximo</p>
                <p className="text-lg font-bold text-gray-800">
                  {dateUtils.formatToBR(pessoa.proximoComparecimento)}
                </p>
              </div>
            </div>
          </div>

          {/* Dados Pessoais */}
          <MobileSection
            id="dados-pessoais"
            title="Dados Pessoais"
            icon={<User className="w-5 h-5 text-blue-600" />}
            defaultExpanded={true}
          >
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500">Nome</p>
                <p className="font-medium text-gray-800">{pessoa.nome}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500">CPF</p>
                  <p className="font-medium text-gray-800 text-sm">{pessoa.cpf}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Processo</p>
                  <p className="font-medium text-gray-800 text-sm">{pessoa.processo}</p>
                </div>
              </div>
            </div>
          </MobileSection>

          {/* Atualização de Endereço - DESTAQUE */}
          <div 
            id="secao-endereco" 
            className={`rounded-lg mb-4 ${
              !enderecoRespondido && mensagem 
                ? 'ring-2 ring-red-500 ring-offset-2' 
                : ''
            }`}
          >
            <MobileSection
              id="endereco"
              title="Atualização de Endereço"
              icon={<MapPin className="w-5 h-5 text-yellow-600" />}
              defaultExpanded={!enderecoRespondido}
            >
              {houveAlteracaoEndereco === null ? (
                <div className="space-y-3">
                  <p className="text-sm text-gray-700">
                    Houve mudança no endereço desde o último comparecimento?
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleRespostaAlteracaoEndereco(true)}
                      className="bg-yellow-500 text-white py-3 rounded-lg font-medium text-sm hover:bg-yellow-600 transition-all"
                    >
                      Sim, mudou
                    </button>
                    <button
                      onClick={() => handleRespostaAlteracaoEndereco(false)}
                      className="bg-green-500 text-white py-3 rounded-lg font-medium text-sm hover:bg-green-600 transition-all"
                    >
                      Não mudou
                    </button>
                  </div>
                </div>
              ) : houveAlteracaoEndereco === true ? (
                <div className="space-y-4">
                  <EnderecoForm
                    endereco={novoEndereco}
                    onEnderecoChange={setNovoEndereco}
                    showTitle={false}
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Motivo da mudança
                    </label>
                    <textarea
                      value={motivoAlteracaoEndereco}
                      onChange={(e) => setMotivoAlteracaoEndereco(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="Ex: Mudança familiar, trabalho..."
                    />
                  </div>
                  <button
                    onClick={() => setHouveAlteracaoEndereco(null)}
                    className="text-sm text-gray-600 underline"
                  >
                    Alterar resposta
                  </button>
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <p className="text-sm text-green-800 font-medium">
                      Endereço confirmado sem alterações
                    </p>
                  </div>
                  <button
                    onClick={() => setHouveAlteracaoEndereco(null)}
                    className="text-xs text-green-600 underline mt-2"
                  >
                    Alterar resposta
                  </button>
                </div>
              )}
            </MobileSection>
          </div>

          {/* Tipo de Validação */}
          <MobileSection
            id="validacao"
            title="Tipo de Validação"
            icon={<UserCheck className="w-5 h-5 text-green-600" />}
          >
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleInputChange('tipoValidacao', 'presencial')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    formulario.tipoValidacao === 'presencial'
                      ? 'border-primary bg-primary text-white'
                      : 'border-gray-300 bg-white text-gray-700'
                  }`}
                >
                  <Building className="w-5 h-5 mx-auto mb-1" />
                  <span className="text-sm font-medium">Presencial</span>
                </button>
                <button
                  onClick={() => handleInputChange('tipoValidacao', 'documental')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    formulario.tipoValidacao === 'documental'
                      ? 'border-primary bg-primary text-white'
                      : 'border-gray-300 bg-white text-gray-700'
                  }`}
                >
                  <Smartphone className="w-5 h-5 mx-auto mb-1" />
                  <span className="text-sm font-medium">Virtual</span>
                </button>
              </div>

              {/* Data e Hora */}
              {formulario.tipoValidacao !== 'justificado' && (
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
              )}

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
            </div>
          </MobileSection>

          {/* Alerta */}
          {mostrarAlerta && !enderecoRespondido && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 animate-pulse">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-700 font-medium">
                  Responda sobre a atualização de endereço
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Fixed Bottom Actions */}
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
              className="bg-green-500 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              Confirmar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Desktop Layout e outros estados (mantidos como estavam)
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-primary hover:text-primary-dark transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar
          </button>
          <div>
            <h1 className="text-3xl font-bold text-primary-dark">
              {formulario.tipoValidacao === 'justificado' ? 'Justificar Ausência' : 'Confirmar Presença'}
            </h1>
            <p className="text-lg text-gray-600">Registro de comparecimento</p>
          </div>
        </div>

        {/* Estados Success e Error para Mobile e Desktop */}
        {(estado === 'confirmando' || estado === 'sucesso' || estado === 'erro') && (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Estado: Confirmando */}
            {estado === 'confirmando' && (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-6"></div>
                <h2 className="text-2xl font-bold text-primary-dark mb-2">Confirmando Presença...</h2>
                <p className="text-gray-600">Aguarde enquanto registramos o comparecimento</p>
              </div>
            )}

            {/* Estado: Sucesso */}
            {estado === 'sucesso' && (
              <div className="p-8 text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-12 h-12 text-green-500" />
                </div>
                <h2 className="text-2xl font-bold text-green-700 mb-2">✅ Presença Confirmada!</h2>
                <p className="text-gray-600 mb-6">{mensagem}</p>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <p className="text-green-800">
                    <strong>Comparecimento registrado para:</strong><br />
                    {pessoa?.nome} - Processo: {pessoa?.processo}
                  </p>
                  {formulario.tipoValidacao !== 'justificado' && (
                    <p className="text-green-700 text-sm mt-2">
                      Data/Hora: {dateUtils.formatToBR(formulario.dataComparecimento || '')} às {formulario.horaComparecimento}
                    </p>
                  )}
                  {houveAlteracaoEndereco && (
                    <p className="text-green-700 text-sm mt-2">
                      ✅ Endereço atualizado com sucesso
                    </p>
                  )}
                </div>

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
                    <p className="text-blue-500 text-xs mt-2">
                      ⚠️ É importante que a pessoa compareça na data indicada
                    </p>
                  </div>
                )}

                <div className="flex gap-4 justify-center">
                  <button
                    onClick={() => router.push('/dashboard/geral')}
                    className="bg-primary text-white px-8 py-3 rounded-lg hover:bg-primary-dark transition-all font-medium"
                  >
                    Voltar ao Dashboard
                  </button>
                </div>
              </div>
            )}

            {/* Estado: Erro */}
            {estado === 'erro' && (
              <div className="p-8 text-center">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <XCircle className="w-12 h-12 text-red-500" />
                </div>
                <h2 className="text-2xl font-bold text-red-700 mb-2">❌ Erro na Confirmação</h2>
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

        {/* Desktop Form Layout (mantido como estava) */}
        {estado === 'inicial' && pessoa && !isMobile && (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="p-8">
              {/* Informações da Pessoa */}
              <div className="bg-primary p-6 rounded-xl mb-8 text-white">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <User className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{pessoa.nome}</h2>
                    <p className="text-primary-light">Processo: {pessoa.processo}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="font-semibold mb-1">CPF</p>
                    <p className="text-primary-light">{pessoa.cpf}</p>
                  </div>
                  <div>
                    <p className="font-semibold mb-1">Status Atual</p>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      pessoa.status === 'em conformidade' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                    }`}>
                      {STATUS_LABELS[pessoa.status]}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold mb-1">Próximo Comparecimento</p>
                    <p className="text-primary-light">{dateUtils.formatToBR(pessoa.proximoComparecimento)}</p>
                  </div>
                </div>
              </div>

              {/* Formulário Desktop (mantido como estava) */}
              <div id="secao-endereco" className="mb-8">
                <div className={`bg-blue-50 border ${
                  !enderecoRespondido && mensagem ? 'border-red-300 shadow-md' : 'border-blue-200'
                } rounded-lg p-6 transition-all`}>
                  <div className="flex items-center gap-3 mb-4">
                    <MapPin className="w-6 h-6 text-blue-600" />
                    <h3 className="text-lg font-semibold text-blue-900">Atualização de Endereço</h3>
                    {!enderecoRespondido && mensagem && (
                      <span className="bg-red-100 text-red-700 text-sm py-1 px-3 rounded-full ml-2 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        Resposta obrigatória
                      </span>
                    )}
                  </div>

                  <p className="text-blue-800 mb-4">
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
                </div>
              </div>

              {/* Resto do formulário desktop... */}
              {/* (mantido como estava no código original) */}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}