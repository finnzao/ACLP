'use client';

import { X, UserCheck, Edit, FileText, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { Comparecimento } from '@/types';

interface Props {
  dados: Comparecimento;
  onClose: () => void;
  onEditar: (dados: Comparecimento) => void;
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

// Constantes de status
const STATUS_LABELS = {
  'em conformidade': 'Em Conformidade',
  'inadimplente': 'Inadimplente'
} as const;

const STATUS_COLORS = {
  'em conformidade': {
    bg: 'bg-secondary',
    text: 'text-white',
    border: 'border-secondary'
  },
  'inadimplente': {
    bg: 'bg-danger',
    text: 'text-white', 
    border: 'border-danger'
  }
} as const;

export default function DetalhesSubmetidoModal({ dados, onClose, onEditar }: Props) {
  const router = useRouter();

  const handleConfirmarPresenca = () => {
    router.push(`/dashboard/comparecimento/confirmar?processo=${encodeURIComponent(dados.processo)}`);
  };

  const handleJustificar = () => {
    router.push(`/dashboard/comparecimento/justificar?processo=${encodeURIComponent(dados.processo)}`);
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
          >
            <X size={24} />
          </button>
        </div>

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
              <p className="text-gray-600 mt-1">{dados.cpf}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">RG:</span>
              <p className="text-gray-600 mt-1">{dados.rg}</p>
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
              <p className="text-blue-600 mt-1 capitalize">{dados.periodicidade}</p>
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
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all transform hover:scale-105 shadow-lg ${
              isComparecimentoHoje || isComparecimentoAtrasado
                ? 'bg-green-500 text-white hover:bg-green-600 animate-pulse'
                : 'bg-secondary text-white hover:bg-green-600'
            }`}
          >
            <UserCheck className="w-5 h-5" />
            Confirmar Presença
          </button>

          {/* Editar */}
          <button
            onClick={() => onEditar(dados)}
            className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-dark font-medium transition-all"
          >
            <Edit className="w-5 h-5" />
            Editar Dados
          </button>

          {/* Justificar */}
          <button
            onClick={handleJustificar}
            className="flex items-center gap-2 bg-yellow-500 text-white px-6 py-3 rounded-lg hover:bg-yellow-600 font-medium transition-all"
          >
            <FileText className="w-5 h-5" />
            Justificar Ausência
          </button>

          {/* Excluir */}
          <button 
            onClick={() => {
              if (confirm('Tem certeza que deseja excluir este registro?')) {
                // Implementar exclusão
                console.log('Excluindo registro:', dados.processo);
                onClose();
              }
            }}
            className="flex items-center gap-2 bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 font-medium transition-all"
          >
            <X className="w-5 h-5" />
            Excluir
          </button>
        </div>

        {/* Informações Adicionais */}
        <div className="mt-6 pt-4 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-500">
            Registro atualizado em: {new Date().toLocaleString('pt-BR')}
          </p>
        </div>
      </div>
    </div>
  );
}