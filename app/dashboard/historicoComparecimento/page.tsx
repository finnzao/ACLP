/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { comparecimentosService } from '@/lib/api/services';
import type { ComparecimentoResponse } from '@/types/api';
import ExportButton from '@/components/ExportButton';
import { useToast } from '@/components/Toast';
import {
  Search,
  Filter,
  Calendar,
  ChevronLeft,
  ChevronRight,
  X,
  User,
  FileText,
  RefreshCw,
  MapPin,
} from 'lucide-react';

import { useSearchParamsSafe, withSearchParams } from '@/hooks/useSearchParamsSafe';


interface HistoricoFormatado extends ComparecimentoResponse {
  custodiadoNomeCompleto?: string;
  tipoValidacaoFormatado?: string;
  dataFormatada?: string;
  horaFormatada?: string;
}

const TipoValidacaoUtils = {
  // Normaliza para lowercase (formato do banco)
  normalize(tipo: string): string {
    return tipo.toLowerCase();
  },

  // Formata para exibição
  format(tipo: string): string {
    const tipoNormalizado = tipo.toLowerCase();
    const formatacao: Record<string, string> = {
      'presencial': 'Presencial',
      'online': 'Online',
      'cadastro_inicial': 'Cadastro Inicial'
    };
    return formatacao[tipoNormalizado] || tipo;
  },

  // Compara case-insensitive
  isEqual(tipo1: string, tipo2: string): boolean {
    return tipo1.toLowerCase() === tipo2.toLowerCase();
  }
};

function HistoricoPage() {
  const router = useRouter();
  const searchParams = useSearchParamsSafe();
  const { showToast } = useToast();

  const [historicos, setHistoricos] = useState<HistoricoFormatado[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filtro, setFiltro] = useState('');
  const [colunaOrdenacao] = useState<string>('dataComparecimento');
  const [ordem] = useState<'asc' | 'desc'>('desc');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [filtroTipoValidacao, setFiltroTipoValidacao] = useState<'todos' | string>('todos');
  const [showFilters, setShowFilters] = useState(false);
  const [showMobileExport, setShowMobileExport] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const carregarHistoricos = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('[HistoricoPage] Carregando históricos...');

      const response = await comparecimentosService.listarTodos({
        page: 0,
        size: 1000
      });

      console.log('[HistoricoPage] Resposta recebida:', response);

      if (response.success && response.data) {
        const historicosData = Array.isArray(response.data)
          ? response.data
          : response.data.comparecimentos || [];

        const historicosFormatados: HistoricoFormatado[] = historicosData.map((h: ComparecimentoResponse) => ({
          ...h,
          custodiadoNomeCompleto: h.custodiadoNome || 'Nome não informado',
          tipoValidacaoFormatado: TipoValidacaoUtils.format(h.tipoValidacao),
          dataFormatada: formatarData(h.dataComparecimento),
          horaFormatada: h.horaComparecimento || '00:00:00'
        }));

        setHistoricos(historicosFormatados);
        console.log('[HistoricoPage] Históricos carregados:', historicosFormatados.length);
      } else {
        throw new Error(response.message || 'Erro ao carregar históricos');
      }
    } catch (err: any) {
      console.error('[HistoricoPage] Erro ao carregar históricos:', err);
      setError(err.message || 'Erro ao carregar históricos');
      showToast({
        type: 'error',
        title: 'Erro ao carregar dados',
        message: err.message || 'Não foi possível carregar os históricos',
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    carregarHistoricos();
  }, [carregarHistoricos]);

  useEffect(() => {
    const busca = searchParams.get('busca');
    const tipo = searchParams.get('tipo');
    const dataI = searchParams.get('dataInicio');
    const dataF = searchParams.get('dataFim');

    if (busca) setFiltro(busca);
    if (tipo) setFiltroTipoValidacao(TipoValidacaoUtils.normalize(tipo));
    if (dataI) setDataInicio(dataI);
    if (dataF) setDataFim(dataF);
  }, [searchParams]);

  useEffect(() => {
    const params = new URLSearchParams();

    if (filtro) params.set('busca', filtro);
    if (filtroTipoValidacao !== 'todos') params.set('tipo', filtroTipoValidacao);
    if (dataInicio) params.set('dataInicio', dataInicio);
    if (dataFim) params.set('dataFim', dataFim);

    const queryString = params.toString();
    const newUrl = queryString ? `${window.location.pathname}?${queryString}` : window.location.pathname;

    window.history.replaceState({}, '', newUrl);
    setCurrentPage(1);
  }, [filtro, filtroTipoValidacao, dataInicio, dataFim]);

  const formatarData = (data: string): string => {
    if (!data) return '';
    try {
      return new Date(data).toLocaleDateString('pt-BR');
    } catch {
      return data;
    }
  };

  const normalizarTexto = useCallback((texto: string) => {
    return texto
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }, []);

  const filtrarDados = useCallback((data: HistoricoFormatado[]): HistoricoFormatado[] => {
    return data.filter((item) => {
      const termo = filtro.trim();
      let matchTexto = true;

      if (termo.length > 0) {
        const termoNormalizado = normalizarTexto(termo);
        const nomeNormalizado = normalizarTexto(item.custodiadoNomeCompleto || '');
        const validadorNormalizado = normalizarTexto(item.validadoPor || '');

        matchTexto = nomeNormalizado.includes(termoNormalizado) ||
          validadorNormalizado.includes(termoNormalizado);
      }

      const matchTipo = filtroTipoValidacao === 'todos' || 
        TipoValidacaoUtils.isEqual(item.tipoValidacao, filtroTipoValidacao);

      const dentroPeriodo = (!dataInicio || !dataFim) ||
        (new Date(item.dataComparecimento) >= new Date(dataInicio) &&
          new Date(item.dataComparecimento) <= new Date(dataFim));

      return matchTexto && matchTipo && dentroPeriodo;
    });
  }, [filtro, filtroTipoValidacao, dataInicio, dataFim, normalizarTexto]);

  const ordenarDados = useCallback((data: HistoricoFormatado[]): HistoricoFormatado[] => {
    return [...data].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (colunaOrdenacao) {
        case 'dataComparecimento':
          aValue = new Date(a.dataComparecimento).getTime();
          bValue = new Date(b.dataComparecimento).getTime();
          break;
        case 'custodiadoNome':
          aValue = a.custodiadoNomeCompleto || '';
          bValue = b.custodiadoNomeCompleto || '';
          break;
        case 'tipoValidacao':
          aValue = a.tipoValidacao || '';
          bValue = b.tipoValidacao || '';
          break;
        case 'validadoPor':
          aValue = a.validadoPor || '';
          bValue = b.validadoPor || '';
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return ordem === 'asc' ? -1 : 1;
      if (aValue > bValue) return ordem === 'asc' ? 1 : -1;
      return 0;
    });
  }, [colunaOrdenacao, ordem]);

  const dadosFiltrados = useMemo(() => {
    const filtrados = filtrarDados(historicos);
    return ordenarDados(filtrados);
  }, [historicos, filtrarDados, ordenarDados]);

  const totalFiltrados = dadosFiltrados.length;
  const totalPages = Math.ceil(totalFiltrados / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const dadosPaginados = dadosFiltrados.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const limparFiltros = () => {
    setFiltro('');
    setDataInicio('');
    setDataFim('');
    setFiltroTipoValidacao('todos');
    setCurrentPage(1);
  };

  const hasActiveFilters = filtro || dataInicio || dataFim || filtroTipoValidacao !== 'todos';

  const filterInfo = {
    filtro: filtro || undefined,
    status: filtroTipoValidacao !== 'todos' ? filtroTipoValidacao : undefined,
    dataInicio: dataInicio || undefined,
    dataFim: dataFim || undefined,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Carregando históricos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h3 className="text-red-800 font-semibold mb-2">Erro ao carregar históricos</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={carregarHistoricos}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" ref={containerRef}>
      {isMobile ? (
        <div className="p-4 space-y-4">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-bold text-gray-800">Histórico</h1>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="p-2 bg-primary text-white rounded-lg"
                >
                  <Filter className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setShowMobileExport(!showMobileExport)}
                  className="p-2 bg-green-600 text-white rounded-lg"
                >
                  <FileText className="w-5 h-5" />
                </button>
                <button
                  onClick={carregarHistoricos}
                  className="p-2 bg-gray-600 text-white rounded-lg"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>
            </div>

            {showMobileExport && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <ExportButton
                  dados={historicos}
                  dadosFiltrados={dadosFiltrados}
                  filterInfo={filterInfo}
                />
              </div>
            )}

            {showFilters && (
              <div className="space-y-3 mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar por nome ou validador..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
                    value={filtro}
                    onChange={(e) => setFiltro(e.target.value)}
                  />
                </div>

                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  value={filtroTipoValidacao}
                  onChange={(e) => setFiltroTipoValidacao(e.target.value)}
                >
                  <option value="todos">Todos os Tipos</option>
                  <option value="presencial">Presencial</option>
                  <option value="online">Online</option>
                  <option value="cadastro_inicial">Cadastro Inicial</option>
                </select>

                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  placeholder="Data Inicial"
                />

                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                  placeholder="Data Final"
                />

                {hasActiveFilters && (
                  <button
                    onClick={limparFiltros}
                    className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg flex items-center justify-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Limpar Filtros
                  </button>
                )}
              </div>
            )}

            <div className="text-sm text-gray-600">
              {totalFiltrados} {totalFiltrados === 1 ? 'registro' : 'registros'}
              {hasActiveFilters && ' (filtrado)'}
            </div>
          </div>

          <div className="space-y-3">
            {dadosPaginados.map((item, index) => (
              <div key={item.id || index} className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold text-gray-800">{item.custodiadoNomeCompleto}</h3>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    TipoValidacaoUtils.isEqual(item.tipoValidacao, 'presencial') ? 'bg-green-100 text-green-800' :
                    TipoValidacaoUtils.isEqual(item.tipoValidacao, 'online') ? 'bg-blue-100 text-blue-800' :
                    'bg-purple-100 text-purple-800'
                  }`}>
                    {item.tipoValidacaoFormatado}
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>{item.dataFormatada} às {item.horaFormatada}</span>
                  </div>

                  <div className="flex items-center gap-2 text-gray-600">
                    <User className="w-4 h-4" />
                    <span>Validado por: {item.validadoPor}</span>
                  </div>

                  {item.observacoes && (
                    <div className="flex items-start gap-2 text-gray-600">
                      <FileText className="w-4 h-4 mt-0.5" />
                      <span className="line-clamp-2">{item.observacoes}</span>
                    </div>
                  )}

                  {item.mudancaEndereco && (
                    <button
                      onClick={() => router.push(`/dashboard/historicoComparecimento/enderecos/${item.custodiadoId}`)}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs"
                    >
                      <MapPin className="w-3 h-3" />
                      Ver Mudança de Endereço
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <span className="text-sm text-gray-600">
                Página {currentPage} de {totalPages}
              </span>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Histórico de Comparecimentos</h1>
                <p className="text-gray-600">Visualize e exporte todos os registros de comparecimento</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={carregarHistoricos}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <RefreshCw className="w-5 h-5" />
                  Atualizar
                </button>

                <ExportButton
                  dados={historicos}
                  dadosFiltrados={dadosFiltrados}
                  filterInfo={filterInfo}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Nome do custodiado ou validador..."
                    className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    value={filtro}
                    onChange={(e) => setFiltro(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Validação</label>
                <select
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  value={filtroTipoValidacao}
                  onChange={(e) => setFiltroTipoValidacao(e.target.value)}
                >
                  <option value="todos">Todos os Tipos</option>
                  <option value="presencial">Presencial</option>
                  <option value="online">Online</option>
                  <option value="cadastro_inicial">Cadastro Inicial</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data Inicial</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data Final</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                />
              </div>

              {hasActiveFilters && (
                <div className="flex items-end">
                  <button
                    onClick={limparFiltros}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Limpar Filtros
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800">
                  Resultados ({totalFiltrados} {totalFiltrados === 1 ? 'registro' : 'registros'})
                  {totalFiltrados > 0 && (
                    <span className="text-sm text-gray-600 ml-2">
                      • Página {currentPage} de {totalPages} • Mostrando {startIndex + 1}-{Math.min(endIndex, totalFiltrados)} de {totalFiltrados}
                    </span>
                  )}
                </h3>
                {hasActiveFilters && (
                  <span className="text-sm text-gray-600">
                    <Filter className="w-4 h-4 inline mr-1" />
                    Filtros ativos
                  </span>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] table-auto">
                <thead className="bg-primary text-white">
                  <tr>
                    <th className="p-3 text-left">Custodiado</th>
                    <th className="p-3 text-center">Data</th>
                    <th className="p-3 text-center">Hora</th>
                    <th className="p-3 text-center">Tipo</th>
                    <th className="p-3 text-left">Validado Por</th>
                    <th className="p-3 text-left">Observações</th>
                    <th className="p-3 text-center">Detalhes</th>
                  </tr>
                </thead>
                <tbody>
                  {dadosPaginados.map((item, index) => (
                    <tr
                      key={item.id || index}
                      className="border-b border-border hover:bg-gray-50 transition-colors"
                    >
                      <td className="p-3">
                        <p className="font-medium text-text-base">{item.custodiadoNomeCompleto}</p>
                      </td>
                      <td className="p-3 text-center text-sm">{item.dataFormatada}</td>
                      <td className="p-3 text-center text-sm">{item.horaFormatada}</td>
                      <td className="p-3 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          TipoValidacaoUtils.isEqual(item.tipoValidacao, 'presencial') ? 'bg-green-100 text-green-800' :
                          TipoValidacaoUtils.isEqual(item.tipoValidacao, 'online') ? 'bg-blue-100 text-blue-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {item.tipoValidacaoFormatado}
                        </span>
                      </td>
                      <td className="p-3 text-sm">{item.validadoPor}</td>
                      <td className="p-3 text-sm">
                        {item.observacoes ? (
                          <span className="line-clamp-2">{item.observacoes}</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {item.mudancaEndereco && (
                            <button
                              onClick={() => router.push(`/dashboard/historicoComparecimento/enderecos/${item.custodiadoId}`)}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs hover:bg-green-200 transition-colors"
                              title="Ver histórico de endereços"
                            >
                              <MapPin className="w-3 h-3" />
                              Mudança
                            </button>
                          )}
                          {item.anexos && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                              <FileText className="w-3 h-3" />
                              Anexos
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Mostrando {startIndex + 1} a {Math.min(endIndex, totalFiltrados)} de {totalFiltrados} resultados
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="flex items-center gap-1 px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Anterior
                    </button>

                    <div className="flex gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }

                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`px-3 py-2 text-sm rounded-lg ${currentPage === pageNum ? 'bg-primary text-white' : 'bg-white border border-gray-300 hover:bg-gray-50'}`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="flex items-center gap-1 px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Próxima
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {dadosFiltrados.length === 0 && (
              <div className="p-8 text-center">
                <Search className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">Nenhum resultado encontrado</h3>
                <p className="text-gray-500 mb-4">
                  Tente ajustar os filtros ou termos de busca
                </p>
                <button onClick={limparFiltros} className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors">
                  Limpar Filtros
                </button>
              </div>
            )}
          </div>

          <div className="text-center text-xs text-gray-500 mt-4">
            Dados atualizados em: {new Date().toLocaleTimeString('pt-BR')}
          </div>
        </div>
      )}
    </div>
  );
}

export default withSearchParams(HistoricoPage);