'use client';

import { useState, useEffect } from 'react';
import { X, UserCheck, Edit, FileText, AlertTriangle, Loader2, Trash2, MapPin, Phone, Calendar, Hash, Clock, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { Comparecimento } from '@/types';
import { custodiadosService } from '@/lib/api/services';
import { STATUS_LABELS, STATUS_COLORS } from '@/constants/status';
import ConfirmDialog from '@/components/ConfirmDialog';
import { formatCPF, formatRG, formatContato, formatCEP } from '@/lib/utils/formatting';

// Estender tipo para incluir estrutura completa de endereço
interface EnderecoCompleto {
  id: number;
  cep: string;
  logradouro: string;
  numero?: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  nomeEstado?: string;
  regiaoEstado?: string;
  dataInicio?: string;
  dataFim?: string | null;
  ativo?: boolean;
  motivoAlteracao?: string;
  validadoPor?: string;
  enderecoCompleto?: string;
  enderecoResumido?: string;
  diasResidencia?: number;
  periodoResidencia?: string;
  criadoEm?: string;
  atualizadoEm?: string | null;
}

interface DadosCompletosType extends Comparecimento {
  endereco?: EnderecoCompleto;
}

interface Props {
  dados: Comparecimento;
  onClose: () => void;
  onEditar: (dados: Comparecimento) => void;
  onExcluir?: (id: string | number) => void;
}

const dateUtils = {
  formatToBR: (date: string | Date | null | undefined): string => {
    if (!date) return 'Não informado';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('pt-BR');
  },
  getCurrentDate: (): string => {
    return new Date().toISOString().split('T')[0];
  },
  getDaysUntil: (date: string): number => {
    const today = new Date();
    const targetDate = new Date(date);
    const diffTime = targetDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  },
  isToday: (date: string): boolean => {
    return date === dateUtils.getCurrentDate();
  },
  isOverdue: (date: string): boolean => {
    return dateUtils.getDaysUntil(date) < 0;
  }
};

export default function DetalhesSubmetidoModal({ dados, onClose, onEditar, onExcluir }: Props) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [dadosCompletos, setDadosCompletos] = useState<DadosCompletosType>(dados);

  // Carregar dados completos do custodiado incluindo endereço
  useEffect(() => {
    const carregarDadosCompletos = async () => {
      if (!dados.id) return;
      
      setLoadingDetails(true);
      try {
        const custodiadoId = typeof dados.id === 'string' ? parseInt(dados.id) : dados.id;
        const custodiado = await custodiadosService.buscarPorId(custodiadoId);
        
        if (custodiado) {
          // Dados já vêm com objeto endereco estruturado
          setDadosCompletos({
            ...dados,
            ...custodiado,
            endereco: custodiado.endereco || dados.endereco
          });
          
          console.log('[DetalhesModal] Dados completos carregados:', custodiado);
        }
      } catch (error) {
        console.error('[DetalhesModal] Erro ao buscar dados completos:', error);
        setDadosCompletos(dados);
      } finally {
        setLoadingDetails(false);
      }
    };
    
    carregarDadosCompletos();
  }, [dados]);

  const handleConfirmarPresenca = () => {
    router.push(`/dashboard/comparecimento/confirmar?processo=${encodeURIComponent(dadosCompletos.processo)}`);
  };

  const handleEditarClick = () => {
    // Passar os dados completos incluindo endereço estruturado para o modal de edição
    onEditar(dadosCompletos);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    setDeleteError(null);

    try {
      const custodiadoId = typeof dadosCompletos.id === 'string' ? parseInt(dadosCompletos.id) : dadosCompletos.id;
      
      if (!custodiadoId || isNaN(custodiadoId)) {
        throw new Error('ID do custodiado inválido');
      }

      console.log('[DetalhesModal] Excluindo custodiado:', custodiadoId);
      
      const resultado = await custodiadosService.excluir(custodiadoId);
      
      if (resultado.success) {
        console.log('[DetalhesModal] Exclusão bem-sucedida');
        
        if (onExcluir) {
          onExcluir(custodiadoId);
        }
        
        setTimeout(() => {
          onClose();
        }, 500);
        
      } else {
        throw new Error(resultado.message || 'Erro ao excluir registro');
      }
      
    } catch (error) {
      console.error('[DetalhesModal] Erro ao excluir:', error);
      
      let errorMessage = 'Erro ao excluir registro';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setDeleteError(errorMessage);
      setTimeout(() => setDeleteError(null), 5000);
    } finally {
      setIsDeleting(false);
    }
  };

  // Formatar periodicidade
  const formatarPeriodicidade = (periodicidade: number | string): string => {
    if (typeof periodicidade === 'number') {
      return `${periodicidade} dias`;
    }
    return periodicidade === 'mensal' ? 'Mensal (30 dias)' : 'Bimensal (60 dias)';
  };

  const isComparecimentoHoje = dateUtils.isToday(dadosCompletos.proximoComparecimento);
  const isComparecimentoAtrasado = dateUtils.isOverdue(dadosCompletos.proximoComparecimento);
  const diasRestantes = dateUtils.getDaysUntil(dadosCompletos.proximoComparecimento);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
      <div className="relative bg-white p-6 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
          <div>
            <h3 className="text-2xl font-bold text-primary-dark">Detalhes do Custodiado</h3>
            <p className="text-text-muted mt-1">Informações completas do registro</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isDeleting}
          >
            <X size={24} />
          </button>
        </div>

        {/* Indicador de carregamento */}
        {loadingDetails && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
              <p className="text-sm text-blue-700">Carregando dados completos...</p>
            </div>
          </div>
        )}

        {/* Mensagem de erro na exclusão */}
        {deleteError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <p className="text-sm text-red-700">{deleteError}</p>
            </div>
          </div>
        )}

        {/* Status e Alerta */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${STATUS_COLORS[dadosCompletos.status].bg} ${STATUS_COLORS[dadosCompletos.status].text}`}>
              {STATUS_LABELS[dadosCompletos.status]}
            </span>
            
            {isComparecimentoHoje && (
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" />
                Comparecimento Hoje
              </span>
            )}
            
            {isComparecimentoAtrasado && (
              <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" />
                Em Atraso
              </span>
            )}
          </div>

          {(isComparecimentoHoje || isComparecimentoAtrasado) && (
            <div className={`p-4 rounded-lg border ${
              isComparecimentoAtrasado ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'
            }`}>
              <p className={`text-sm font-medium ${
                isComparecimentoAtrasado ? 'text-red-800' : 'text-yellow-800'
              }`}>
                {isComparecimentoAtrasado 
                  ? `Comparecimento em atraso há ${Math.abs(diasRestantes)} dias`
                  : 'Esta pessoa deve comparecer hoje'
                }
              </p>
            </div>
          )}
        </div>

        {/* Informações Pessoais */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <UserCheck className="w-5 h-5" />
            Dados Pessoais
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="md:col-span-2">
              <span className="font-medium text-gray-700">Nome:</span>
              <p className="text-gray-600 mt-1">{dadosCompletos.nome}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">CPF:</span>
              <p className="text-gray-600 mt-1 font-mono">
                {dadosCompletos.cpf ? formatCPF(dadosCompletos.cpf) : 'Não informado'}
              </p>
            </div>
            <div>
              <span className="font-medium text-gray-700">RG:</span>
              <p className="text-gray-600 mt-1 font-mono">
                {dadosCompletos.rg ? formatRG(dadosCompletos.rg) : 'Não informado'}
              </p>
            </div>
            <div>
              <span className="font-medium text-gray-700 flex items-center gap-1">
                <Phone className="w-4 h-4" />
                Contato:
              </span>
              <p className="text-gray-600 mt-1">{formatContato(dadosCompletos.contato)}</p>
            </div>
            {dadosCompletos.observacoes && (
              <div className="md:col-span-2">
                <span className="font-medium text-gray-700">Observações:</span>
                <p className="text-gray-600 mt-1 italic">{dadosCompletos.observacoes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Informações de Endereço - Seção Aprimorada */}
        {dadosCompletos.endereco && (
          <div className="bg-green-50 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Endereço Residencial
            </h4>
            
            {/* Endereço completo formatado */}
            <div className="mb-4 p-3 bg-white rounded-lg border border-green-200">
              <p className="text-green-700 text-sm font-medium">
                {dadosCompletos.endereco.enderecoCompleto || 
                 `${dadosCompletos.endereco.logradouro}, ${dadosCompletos.endereco.numero}${dadosCompletos.endereco.complemento ? `, ${dadosCompletos.endereco.complemento}` : ''}, ${dadosCompletos.endereco.bairro}, ${dadosCompletos.endereco.cidade} - ${dadosCompletos.endereco.estado}, CEP: ${formatCEP(dadosCompletos.endereco.cep)}`}
              </p>
            </div>

            {/* Status do endereço */}
            {dadosCompletos.endereco.ativo && (
              <div className="mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-700">Endereço Ativo</span>
                {dadosCompletos.endereco.periodoResidencia && (
                  <span className="text-sm text-green-600 ml-2">
                    • {dadosCompletos.endereco.periodoResidencia}
                  </span>
                )}
              </div>
            )}

            {/* Grid de detalhes do endereço */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
              <div>
                <span className="font-medium text-green-700">CEP:</span>
                <p className="text-green-600">{formatCEP(dadosCompletos.endereco.cep)}</p>
              </div>
              
              <div className="md:col-span-2">
                <span className="font-medium text-green-700">Logradouro:</span>
                <p className="text-green-600">
                  {dadosCompletos.endereco.logradouro}
                  {dadosCompletos.endereco.numero && `, ${dadosCompletos.endereco.numero}`}
                  {dadosCompletos.endereco.complemento && ` - ${dadosCompletos.endereco.complemento}`}
                </p>
              </div>
              
              <div>
                <span className="font-medium text-green-700">Bairro:</span>
                <p className="text-green-600">{dadosCompletos.endereco.bairro}</p>
              </div>
              
              <div>
                <span className="font-medium text-green-700">Cidade:</span>
                <p className="text-green-600">{dadosCompletos.endereco.cidade}</p>
              </div>
              
              <div>
                <span className="font-medium text-green-700">Estado:</span>
                <p className="text-green-600">
                  {dadosCompletos.endereco.nomeEstado || dadosCompletos.endereco.estado}
                  {dadosCompletos.endereco.regiaoEstado && ` (${dadosCompletos.endereco.regiaoEstado})`}
                </p>
              </div>

              {/* Informações adicionais do endereço */}
              {dadosCompletos.endereco.diasResidencia !== undefined && (
                <div>
                  <span className="font-medium text-green-700 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Tempo de Residência:
                  </span>
                  <p className="text-green-600">{dadosCompletos.endereco.diasResidencia} dias</p>
                </div>
              )}
              
              {dadosCompletos.endereco.dataInicio && (
                <div>
                  <span className="font-medium text-green-700">Residente desde:</span>
                  <p className="text-green-600">{dateUtils.formatToBR(dadosCompletos.endereco.dataInicio)}</p>
                </div>
              )}
              
              {dadosCompletos.endereco.validadoPor && (
                <div>
                  <span className="font-medium text-green-700">Validado por:</span>
                  <p className="text-green-600">{dadosCompletos.endereco.validadoPor}</p>
                </div>
              )}
            </div>

            {/* Motivo da alteração se houver */}
            {dadosCompletos.endereco.motivoAlteracao && (
              <div className="mt-3 pt-3 border-t border-green-200">
                <span className="font-medium text-green-700 text-sm">Motivo do cadastro/alteração:</span>
                <p className="text-green-600 text-sm mt-1 italic">
                  {dadosCompletos.endereco.motivoAlteracao}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Caso não tenha endereço */}
        {!dadosCompletos.endereco && (
          <div className="bg-yellow-50 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <p className="text-yellow-700 font-medium">Endereço não cadastrado</p>
            </div>
          </div>
        )}

        {/* Informações Processuais */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Dados Processuais
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="md:col-span-2">
              <span className="font-medium text-blue-700">Processo:</span>
              <p className="text-blue-600 mt-1 font-mono">{dadosCompletos.processo}</p>
            </div>
            <div>
              <span className="font-medium text-blue-700">Vara:</span>
              <p className="text-blue-600 mt-1">{dadosCompletos.vara}</p>
            </div>
            <div>
              <span className="font-medium text-blue-700">Comarca:</span>
              <p className="text-blue-600 mt-1">{dadosCompletos.comarca}</p>
            </div>
            <div>
              <span className="font-medium text-blue-700">Data da Decisão:</span>
              <p className="text-blue-600 mt-1">{dateUtils.formatToBR(dadosCompletos.decisao)}</p>
            </div>
            <div>
              <span className="font-medium text-blue-700 flex items-center gap-1">
                <Hash className="w-4 h-4" />
                Periodicidade:
              </span>
              <p className="text-blue-600 mt-1 capitalize">
                {formatarPeriodicidade(dadosCompletos.periodicidade)}
              </p>
            </div>
          </div>
        </div>

        {/* Informações de Comparecimento */}
        <div className="bg-yellow-50 rounded-lg p-4 mb-6">
          <h4 className="font-semibold text-yellow-800 mb-3 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Histórico de Comparecimentos
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div>
              <span className="font-medium text-yellow-700">Primeiro Comparecimento:</span>
              <p className="text-yellow-600 mt-1">{dateUtils.formatToBR(dadosCompletos.primeiroComparecimento)}</p>
            </div>
            <div>
              <span className="font-medium text-yellow-700">Último Comparecimento:</span>
              <p className="text-yellow-600 mt-1">{dateUtils.formatToBR(dadosCompletos.ultimoComparecimento)}</p>
            </div>
            <div>
              <span className="font-medium text-yellow-700">Próximo Comparecimento:</span>
              <p className={`mt-1 font-medium ${
                isComparecimentoAtrasado ? 'text-red-600' : 
                isComparecimentoHoje ? 'text-yellow-600' : 
                'text-yellow-600'
              }`}>
                {dateUtils.formatToBR(dadosCompletos.proximoComparecimento)}
              </p>
              {!isComparecimentoAtrasado && !isComparecimentoHoje && (
                <p className="text-yellow-500 text-xs mt-1">
                  Em {diasRestantes} dias
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Ações */}
        <div className="flex flex-wrap gap-3 justify-center pt-4 border-t border-gray-200">
          {/* Confirmar Presença */}
          <button 
            onClick={handleConfirmarPresenca}
            disabled={isDeleting}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all transform hover:scale-105 shadow-lg ${
              isComparecimentoHoje || isComparecimentoAtrasado
                ? 'bg-green-500 text-white hover:bg-green-600 animate-pulse'
                : 'bg-secondary text-white hover:bg-green-600'
            } ${isDeleting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <UserCheck className="w-5 h-5" />
            Validar Comparecimento
          </button>

          {/* Editar */}
          <button
            onClick={handleEditarClick}
            disabled={isDeleting || loadingDetails}
            className={`flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-dark font-medium transition-all ${
              isDeleting || loadingDetails ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <Edit className="w-5 h-5" />
            Editar Dados
          </button>

          {/* Excluir */}
          <button 
            onClick={() => setShowConfirmDialog(true)}
            disabled={isDeleting}
            className={`flex items-center gap-2 bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 font-medium transition-all ${
              isDeleting ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Excluindo...
              </>
            ) : (
              <>
                <Trash2 className="w-5 h-5" />
                Excluir
              </>
            )}
          </button>
        </div>

        {/* Informações Adicionais */}
        <div className="mt-6 pt-4 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-500">
            Registro atualizado em: {dateUtils.formatToBR(dadosCompletos.atualizadoEm) || new Date().toLocaleString('pt-BR')}
          </p>
          {dadosCompletos.id && (
            <p className="text-xs text-gray-400 mt-1">
              ID: {dadosCompletos.id}
            </p>
          )}
        </div>
      </div>

      {/* Modal de Confirmação de Exclusão */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={handleConfirmDelete}
        type="danger"
        title="Confirmar Exclusão"
        message={`Tem certeza que deseja excluir o registro de ${dadosCompletos.nome}?`}
        details={[
          `Processo: ${dadosCompletos.processo}`,
          `CPF: ${dadosCompletos.cpf ? formatCPF(dadosCompletos.cpf) : 'Não informado'}`,
          `Status: ${STATUS_LABELS[dadosCompletos.status]}`,
          'Esta ação não pode ser desfeita!'
        ]}
        confirmText="Sim, Excluir"
        cancelText="Cancelar"
      />
    </div>
  );
}