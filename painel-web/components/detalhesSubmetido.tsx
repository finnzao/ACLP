'use client';

import { useState } from 'react';
import { X, UserCheck, Edit, FileText, AlertTriangle, Loader2, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { Comparecimento } from '@/types';
import { custodiadosService } from '@/lib/api/services';
import { STATUS_LABELS, STATUS_COLORS } from '@/constants/status';
import ConfirmDialog from '@/components/ConfirmDialog';

interface Props {
  dados: Comparecimento;
  onClose: () => void;
  onEditar: (dados: Comparecimento) => void;
  onExcluir?: (id: string | number) => void;
}

const dateUtils = {
  formatToBR: (date: string | Date): string => {
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

  const handleConfirmarPresenca = () => {
    router.push(`/dashboard/comparecimento/confirmar?processo=${encodeURIComponent(dados.processo)}`);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    setDeleteError(null);

    try {
      // Assumindo que dados tem um campo id do tipo number
      const custodiadoId = typeof dados.id === 'string' ? parseInt(dados.id) : dados.id;
      
      if (!custodiadoId || isNaN(custodiadoId)) {
        throw new Error('ID do custodiado inválido');
      }

      console.log('[DetalhesModal] Excluindo custodiado:', custodiadoId);
      
      // Chamar o serviço de exclusão
      const resultado = await custodiadosService.excluir(custodiadoId);
      
      if (resultado.success) {
        // Notificar sucesso (você pode adicionar um toast aqui)
        console.log('[DetalhesModal] Exclusão bem-sucedida');
        
        // Chamar callback se fornecido (para atualizar lista no componente pai)
        if (onExcluir) {
          onExcluir(custodiadoId);
        }
        
        // Pequeno delay para feedback visual
        setTimeout(() => {
          onClose();
          // Opcional: redirecionar para lista
          // router.push('/dashboard');
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
      
      // Limpar erro após 5 segundos
      setTimeout(() => setDeleteError(null), 5000);
    } finally {
      setIsDeleting(false);
    }
  };

  const isComparecimentoHoje = dateUtils.isToday(dados.proximoComparecimento);
  const isComparecimentoAtrasado = dateUtils.isOverdue(dados.proximoComparecimento);
  const diasRestantes = dateUtils.getDaysUntil(dados.proximoComparecimento);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
      <div className="relative bg-white p-6 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
          <div>
            <h3 className="text-2xl font-bold text-primary-dark">Detalhes da Pessoa</h3>
            <p className="text-text-muted mt-1">Informações completas do custodiado</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isDeleting}
          >
            <X size={24} />
          </button>
        </div>

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
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${STATUS_COLORS[dados.status].bg} ${STATUS_COLORS[dados.status].text}`}>
              {STATUS_LABELS[dados.status]}
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
            <div>
              <span className="font-medium text-gray-700">Nome:</span>
              <p className="text-gray-600 mt-1">{dados.nome}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">CPF:</span>
              <p className="text-gray-600 mt-1">{dados.cpf || 'Não informado'}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">RG:</span>
              <p className="text-gray-600 mt-1">{dados.rg || 'Não informado'}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Contato:</span>
              <p className="text-gray-600 mt-1">{dados.contato}</p>
            </div>
          </div>
        </div>

        {/* Informações Processuais */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Dados Processuais
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="md:col-span-2">
              <span className="font-medium text-blue-700">Processo:</span>
              <p className="text-blue-600 mt-1 font-mono">{dados.processo}</p>
            </div>
            <div>
              <span className="font-medium text-blue-700">Vara:</span>
              <p className="text-blue-600 mt-1">{dados.vara}</p>
            </div>
            <div>
              <span className="font-medium text-blue-700">Comarca:</span>
              <p className="text-blue-600 mt-1">{dados.comarca}</p>
            </div>
            <div>
              <span className="font-medium text-blue-700">Data da Decisão:</span>
              <p className="text-blue-600 mt-1">{dateUtils.formatToBR(dados.decisao)}</p>
            </div>
            <div>
              <span className="font-medium text-blue-700">Periodicidade:</span>
              <p className="text-blue-600 mt-1 capitalize">
                {typeof dados.periodicidade === 'number' 
                  ? `${dados.periodicidade} dias` 
                  : dados.periodicidade}
              </p>
            </div>
          </div>
        </div>

        {/* Informações de Comparecimento */}
        <div className="bg-green-50 rounded-lg p-4 mb-6">
          <h4 className="font-semibold text-green-800 mb-3">Histórico de Comparecimentos</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div>
              <span className="font-medium text-green-700">Primeiro Comparecimento:</span>
              <p className="text-green-600 mt-1">{dateUtils.formatToBR(dados.primeiroComparecimento)}</p>
            </div>
            <div>
              <span className="font-medium text-green-700">Último Comparecimento:</span>
              <p className="text-green-600 mt-1">{dateUtils.formatToBR(dados.ultimoComparecimento)}</p>
            </div>
            <div>
              <span className="font-medium text-green-700">Próximo Comparecimento:</span>
              <p className={`mt-1 font-medium ${
                isComparecimentoAtrasado ? 'text-red-600' : 
                isComparecimentoHoje ? 'text-yellow-600' : 
                'text-green-600'
              }`}>
                {dateUtils.formatToBR(dados.proximoComparecimento)}
              </p>
              {!isComparecimentoAtrasado && !isComparecimentoHoje && (
                <p className="text-green-500 text-xs mt-1">
                  Em {diasRestantes} dias
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Ações */}
        <div className="flex flex-wrap gap-3 justify-center pt-4 border-t border-gray-200">
          {/* Confirmar Presença - Destaque especial se for hoje ou estiver atrasado */}
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
            onClick={() => onEditar(dados)}
            disabled={isDeleting}
            className={`flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-dark font-medium transition-all ${
              isDeleting ? 'opacity-50 cursor-not-allowed' : ''
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
            Registro atualizado em: {new Date().toLocaleString('pt-BR')}
          </p>
          {dados.id && (
            <p className="text-xs text-gray-400 mt-1">
              ID: {dados.id}
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
        message={`Tem certeza que deseja excluir o registro de ${dados.nome}?`}
        details={[
          `Processo: ${dados.processo}`,
          `CPF: ${dados.cpf || 'Não informado'}`,
          `Status: ${STATUS_LABELS[dados.status]}`,
          'Esta ação não pode ser desfeita!'
        ]}
        confirmText="Sim, Excluir"
        cancelText="Cancelar"
      />
    </div>
  );
}