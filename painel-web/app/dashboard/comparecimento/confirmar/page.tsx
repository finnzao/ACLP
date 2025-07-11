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
  ArrowLeft
} from 'lucide-react';
import { Comparecimento } from '@/types';
import usuarios from '@/db/usuarios_mock.json';

interface RegistroComparecimento {
  processo: string;
  nome: string;
  dataComparecimento: string;
  horaComparecimento: string;
  observacoes: string;
  validadoPor: string;
  tipoValidacao: 'presencial' | 'documental' | 'justificado';
}

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
  const [formulario, setFormulario] = useState<Partial<RegistroComparecimento>>({
    dataComparecimento: dateUtils.getCurrentDate(),
    horaComparecimento: dateUtils.getCurrentTime(),
    tipoValidacao: 'presencial',
    validadoPor: 'Servidor Atual',
    observacoes: ''
  });

  useEffect(() => {
    if (!processo) return;

    // Buscar dados da pessoa pelo processo
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
    } else {
      setEstado('erro');
      setMensagem('Pessoa não encontrada para o processo informado.');
    }
  }, [processo]);

  const confirmarComparecimento = async () => {
    if (!pessoa) return;

    setEstado('confirmando');

    try {
      // Simular salvamento no backend
      await new Promise(resolve => setTimeout(resolve, 1500));

      const novoRegistro: RegistroComparecimento = {
        processo: pessoa.processo,
        nome: pessoa.nome,
        dataComparecimento: formulario.dataComparecimento || dateUtils.getCurrentDate(),
        horaComparecimento: formulario.horaComparecimento || dateUtils.getCurrentTime(),
        observacoes: formulario.observacoes || '',
        validadoPor: formulario.validadoPor || 'Servidor Atual',
        tipoValidacao: formulario.tipoValidacao || 'presencial'
      };

      // Em produção, aqui seria uma chamada à API
      console.log('Comparecimento registrado:', novoRegistro);

      setEstado('sucesso');
      setMensagem('Comparecimento confirmado com sucesso!');

      // Redirecionar após 3 segundos
      setTimeout(() => {
        router.push('/dashboard/geral');
      }, 3000);

    } catch (error) {
      setEstado('erro');
      setMensagem('Erro ao confirmar comparecimento. Tente novamente.');
      console.error('Erro ao confirmar comparecimento:', error);
    }
  };

  const handleInputChange = (field: keyof RegistroComparecimento, value: string) => {
    setFormulario(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!processo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white">
        <div className="text-center p-8 bg-white rounded-2xl shadow-xl">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Processo não informado</h2>
          <p className="text-gray-600 mb-6">É necessário informar o número do processo para confirmar a presença.</p>
          <button
            onClick={() => router.push('/dashboard/geral')}
            className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-dark transition-all"
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
            <h1 className="text-3xl font-bold text-primary-dark">Confirmar Presença</h1>
            <p className="text-lg text-gray-600">Validação manual de comparecimento</p>
          </div>
        </div>

        {/* Conteúdo Principal */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Estado: Inicial - Mostrar formulário */}
          {estado === 'inicial' && pessoa && (
            <div className="p-8">
              {/* Informações da Pessoa */}
              <div className="bg-gradient-to-r from-primary-light to-primary p-6 rounded-xl mb-8 text-white">
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

              {/* Formulário de Confirmação */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-primary-dark flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Registrar Comparecimento
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    Tipo de Validação *
                  </label>
                  <select
                    value={formulario.tipoValidacao}
                    onChange={(e) => handleInputChange('tipoValidacao', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                  >
                    <option value="presencial">Presencial</option>
                    <option value="documental">Documental</option>
                    <option value="justificado">Justificado</option>
                  </select>
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Validado por
                  </label>
                  <input
                    type="text"
                    value={formulario.validadoPor}
                    onChange={(e) => handleInputChange('validadoPor', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-gray-50"
                    placeholder="Nome do servidor responsável"
                    required
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
                  className="px-8 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all font-medium flex items-center gap-2 shadow-lg"
                >
                  <Save className="w-5 h-5" />
                  Confirmar Presença
                </button>
              </div>
            </div>
          )}

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
                <p className="text-green-700 text-sm mt-2">
                  Data/Hora: {dateUtils.formatToBR(formulario.dataComparecimento || '')} às {formulario.horaComparecimento}
                </p>
              </div>
              <button
                onClick={() => router.push('/dashboard/geral')}
                className="bg-primary text-white px-8 py-3 rounded-lg hover:bg-primary-dark transition-all font-medium"
              >
                Voltar ao Dashboard
              </button>
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

        {/* Dicas */}
        {estado === 'inicial' && (
          <div className="mt-6 bg-blue-50 rounded-xl p-6">
            <h3 className="font-semibold text-lg mb-3 text-blue-900 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Importante
            </h3>
            <ul className="space-y-2 text-blue-800">
              <li className="flex items-start">
                <span className="mr-2">📝</span>
                <span>Certifique-se de que a pessoa realmente compareceu antes de confirmar</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">🕐</span>
                <span>Registre o horário exato do comparecimento</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">📋</span>
                <span>Adicione observações relevantes quando necessário</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✅</span>
                <span>Esta ação atualizará automaticamente o status da pessoa</span>
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}