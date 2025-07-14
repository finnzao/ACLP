'use client';

import { useState } from 'react';
import { Download, FileSpreadsheet, Filter } from 'lucide-react';
import { Comparecimento } from '@/types';
import { exportFilteredData } from '@/lib/utils/excelExport';

interface ExportButtonProps {
  dados: Comparecimento[];
  dadosFiltrados: Comparecimento[];
  filterInfo?: {
    filtro?: string;
    status?: string;
    urgencia?: string;
    dataInicio?: string;
    dataFim?: string;
  };
  className?: string;
}

export default function ExportButton({ 
  dados, 
  dadosFiltrados, 
  filterInfo,
  className = ""
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const hasFilters = filterInfo && Object.values(filterInfo).some(value => 
    value && value !== 'todos' && value !== ''
  );

  const handleExport = async (exportType: 'all' | 'filtered') => {
    setIsExporting(true);
    setShowOptions(false);

    try {
      const dataToExport = exportType === 'filtered' ? dadosFiltrados : dados;
      const result = exportFilteredData(
        dados,
        dataToExport,
        exportType === 'filtered' ? filterInfo : undefined
      );

      if (result.success) {
        // Mostrar toast de sucesso (você pode implementar um sistema de notificações)
        console.log(`✅ ${result.message} (${result.count} registros)`);
      } else {
        // Mostrar toast de erro
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

  // Se não há filtros ativos, exportar diretamente todos os dados
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

  // Se há filtros, mostrar opções
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

      {/* Menu de opções */}
      {showOptions && !isExporting && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
          <div className="p-4">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4" />
              Opções de Exportação
            </h3>
            
            <div className="space-y-3">
              {/* Exportar dados filtrados */}
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

              {/* Exportar todos os dados */}
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

            {/* Informações dos filtros ativos */}
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
                      <span className="font-medium">Status:</span> {
                        filterInfo.status === 'em conformidade' ? 'Em Conformidade' : 'Inadimplente'
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

      {/* Overlay para fechar o menu */}
      {showOptions && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowOptions(false)}
        />
      )}
    </div>
  );
}

// Componente de exportação rápida para usar em outros lugares
export function QuickExportButton({ 
  dados, 
  label = "Exportar",
  className = ""
}: {
  dados: Comparecimento[];
  label?: string;
  className?: string;
}) {
  const [isExporting, setIsExporting] = useState(false);

  const handleQuickExport = async () => {
    setIsExporting(true);
    try {
      const result = exportFilteredData(dados, dados);
      if (result.success) {
        console.log(`✅ ${result.message}`);
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