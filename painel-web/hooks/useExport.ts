// painel-web/hooks/useExport.ts
import { useState, useCallback } from 'react';
import { Comparecimento } from '@/types';
import { exportFilteredData } from '@/lib/utils/excelExport';
import type { ExportFilterInfo, ExportResult } from '@/types/export';

interface UseExportOptions {
  onSuccess?: (result: ExportResult) => void;
  onError?: (error: string) => void;
}

export function useExport(options: UseExportOptions = {}) {
  const [isExporting, setIsExporting] = useState(false);
  const [lastExportResult, setLastExportResult] = useState<ExportResult | null>(null);

  const exportData = useCallback(async (
    allData: Comparecimento[],
    filteredData: Comparecimento[],
    filterInfo?: ExportFilterInfo,
    exportType: 'all' | 'filtered' = 'filtered'
  ): Promise<ExportResult> => {
    setIsExporting(true);
    setLastExportResult(null);

    try {
      const dataToExport = exportType === 'filtered' ? filteredData : allData;
      const result = exportFilteredData(
        allData,
        dataToExport,
        exportType === 'filtered' ? filterInfo : undefined
      );

      setLastExportResult(result);

      if (result.success) {
        options.onSuccess?.(result);
      } else {
        options.onError?.(result.message);
      }

      return result;
    } catch (error: any) {
      const errorResult: ExportResult = {
        success: false,
        message: error.message || 'Erro inesperado durante a exportação'
      };

      setLastExportResult(errorResult);
      options.onError?.(errorResult.message);
      return errorResult;
    } finally {
      setIsExporting(false);
    }
  }, [options]);

  const exportAll = useCallback(async (
    allData: Comparecimento[]
  ): Promise<ExportResult> => {
    return exportData(allData, allData, undefined, 'all');
  }, [exportData]);

  const exportFiltered = useCallback(async (
    allData: Comparecimento[],
    filteredData: Comparecimento[],
    filterInfo?: ExportFilterInfo
  ): Promise<ExportResult> => {
    return exportData(allData, filteredData, filterInfo, 'filtered');
  }, [exportData]);

  const reset = useCallback(() => {
    setLastExportResult(null);
  }, []);

  return {
    isExporting,
    lastExportResult,
    exportData,
    exportAll,
    exportFiltered,
    reset
  };
}