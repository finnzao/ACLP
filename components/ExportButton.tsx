/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { Download, FileSpreadsheet, Filter } from 'lucide-react';
import { exportFilteredData } from '@/lib/utils/excelExport';
import { exportFilteredHistorico } from '@/lib/utils/historicoExport';
import type { ComparecimentoResponse } from '@/types/api';

interface ExportButtonProps<T = any> {
  dados: T[];
  dadosFiltrados: T[];
  filterInfo?: {
    filtro?: string;
    status?: string;
    urgencia?: string;
    dataInicio?: string;
    dataFim?: string;
  };
  className?: string;
  exportType?: 'custodiados' | 'historico'; // Identificar tipo de exportação
}

export default function ExportButton<T = any>({ 
  dados, 
  dadosFiltrados, 
  filterInfo,
  className = "",
  exportType = 'custodiados'
}: ExportButtonProps<T>) {
  const [isExporting, setIsExporting] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const hasFilters = filterInfo && Object.values(filterInfo).some(value => 
    value && value !== 'todos' && value !== ''
  );

  const handleExport = async (exportMode: 'all' | 'filtered') => {
    setIsExporting(true);
    setShowOptions(false);

    try {
      const dataToExport = exportMode === 'filtered' ? dadosFiltrados : dados;
      let result;

      // Escolher função de exportação baseada no tipo
      if (exportType === 'historico') {
        result = exportFilteredHistorico(
          dados as any as ComparecimentoResponse[],
          dataToExport as any as ComparecimentoResponse[],
          exportMode === 'filtered' ? filterInfo : undefined
        );
      } else {
        result = exportFilteredData(
          dados as any,
          dataToExport as any,
          exportMode === 'filtered' ? filterInfo : undefined
        );
      }

      if (result.success) {
        console.log(`✅ ${result.message} (${result.count} registros)`);
      } else {
        console.error(`❌ ${result.message}`);
        alert(result.message);
      }
    } catch (error) {
      console.error('Erro durante exportação:', error);
      alert('Erro inesperado durante a exportação');
    } finally {
      setIsExporting(false);
    }
  };

  if (!hasFilters) {
    return (
      <button
        onClick={() => handleExport('all')}
        disabled={isExporting || dados.length === 0}
        className={`flex items-center gap-2 bg-secondary text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed ${className}`}
      >
        {isExporting ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            Exportando...
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            Exportar ({dados.length})
          </>
        )}
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowOptions(!showOptions)}
        disabled={isExporting}
        className={`flex items-center gap-2 bg-secondary text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed ${className}`}
      >
        {isExporting ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            Exportando...
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            Exportar
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </>
        )}
      </button>

      {showOptions && !isExporting && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
          <div className="p-4">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4" />
              Opções de Exportação
            </h3>
            
            <div className="space-y-3">
              <button
                onClick={() => handleExport('filtered')}
                className="w-full text-left p-3 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-blue-800 flex items-center gap-2">
                      <Filter className="w-4 h-4" />
                      Dados Filtrados
                    </div>
                    <div className="text-sm text-blue-600 mt-1">
                      Exportar apenas os {dadosFiltrados.length} registros que atendem aos filtros atuais
                    </div>
                  </div>
                  <div className="text-blue-600 font-bold">
                    {dadosFiltrados.length}
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleExport('all')}
                className="w-full text-left p-3 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-800">
                      Todos os Dados
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      Exportar todos os {dados.length} registros (ignorar filtros)
                    </div>
                  </div>
                  <div className="text-gray-600 font-bold">
                    {dados.length}
                  </div>
                </div>
              </button>
            </div>

            {hasFilters && (
              <div className="mt-4 pt-3 border-t border-gray-200">
                <h4 className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
                  Filtros Ativos
                </h4>
                <div className="space-y-1">
                  {filterInfo?.filtro && (
                    <div className="text-xs text-gray-600">
                      <span className="font-medium">Busca:</span> {filterInfo.filtro}
                    </div>
                  )}
                  {filterInfo?.status && filterInfo.status !== 'todos' && (
                    <div className="text-xs text-gray-600">
                      <span className="font-medium">
                        {exportType === 'historico' ? 'Tipo:' : 'Status:'}
                      </span> {
                        exportType === 'historico' 
                          ? formatarTipoValidacao(filterInfo.status)
                          : (filterInfo.status === 'em conformidade' ? 'Em Conformidade' : 'Inadimplente')
                      }
                    </div>
                  )}
                  {filterInfo?.urgencia && filterInfo.urgencia !== 'todos' && (
                    <div className="text-xs text-gray-600">
                      <span className="font-medium">Urgência:</span> {
                        filterInfo.urgencia === 'hoje' ? 'Hoje' :
                        filterInfo.urgencia === 'atrasados' ? 'Atrasados' :
                        filterInfo.urgencia === 'proximos' ? 'Próximos 7 dias' : filterInfo.urgencia
                      }
                    </div>
                  )}
                  {filterInfo?.dataInicio && filterInfo?.dataFim && (
                    <div className="text-xs text-gray-600">
                      <span className="font-medium">Período:</span> {
                        new Date(filterInfo.dataInicio).toLocaleDateString('pt-BR')
                      } até {
                        new Date(filterInfo.dataFim).toLocaleDateString('pt-BR')
                      }
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showOptions && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowOptions(false)}
        />
      )}
    </div>
  );
}

// Função auxiliar para formatar tipo de validação
function formatarTipoValidacao(tipo: string): string {
  const tipos: Record<string, string> = {
    'presencial': 'Presencial',
    'online': 'Online',
    'cadastro_inicial': 'Cadastro Inicial'
  };
  return tipos[tipo.toLowerCase()] || tipo;
}

export function QuickExportButton<T = any>({ 
  dados, 
  label = "Exportar",
  className = "",
  exportType = 'custodiados'
}: {
  dados: T[];
  label?: string;
  className?: string;
  exportType?: 'custodiados' | 'historico';
}) {
  const [isExporting, setIsExporting] = useState(false);

  const handleQuickExport = async () => {
    setIsExporting(true);
    try {
      let result;
      
      if (exportType === 'historico') {
        result = exportFilteredHistorico(
          dados as any as ComparecimentoResponse[],
          dados as any as ComparecimentoResponse[]
        );
      } else {
        result = exportFilteredData(dados as any, dados as any);
      }
      
      if (result.success) {
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('Erro na exportação:', error);
      alert('Erro durante a exportação');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      onClick={handleQuickExport}
      disabled={isExporting || dados.length === 0}
      className={`flex items-center gap-2 bg-secondary text-white px-3 py-2 rounded-lg hover:bg-green-600 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed ${className}`}
    >
      {isExporting ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          <span className="text-sm">Exportando...</span>
        </>
      ) : (
        <>
          <Download className="w-4 h-4" />
          <span className="text-sm">{label}</span>
        </>
      )}
    </button>
  );
}