/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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

interface HistoricoFormatado extends ComparecimentoResponse {
  custodiadoNomeCompleto?: string;
  tipoValidacaoFormatado?: string;
  dataFormatada?: string;
  horaFormatada?: string;
}

export default function HistoricoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  const [historicos, setHistoricos] = useState<HistoricoFormatado[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filtro, setFiltro] = useState('');
  const [colunaOrdenacao, setColunaOrdenacao] = useState<string>('dataComparecimento');
  const [ordem, setOrdem] = useState<'asc' | 'desc'>('desc');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [filtroTipoValidacao, setFiltroTipoValidacao] = useState<'todos' | 'PRESENCIAL' | 'ONLINE' | 'CADASTRO_INICIAL'>('todos');
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

  // Carregar históricos do backend
  const carregarHistoricos = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('[HistoricoPage] Carregando históricos...');

      // Buscar todos os comparecimentos usando o endpoint com paginação
      const response = await comparecimentosService.listarTodos({
        page: 0,
        size: 1000 // Buscar muitos registros de uma vez
      });

      console.log('[HistoricoPage] Resposta recebida:', response);

      if (response.success && response.data) {
        const historicosData = Array.isArray(response.data)
          ? response.data
          : response.data.comparecimentos || [];

        // Formatar dados
        const historicosFormatados: HistoricoFormatado[] = historicosData.map((h: ComparecimentoResponse) => ({
          ...h,
          custodiadoNomeCompleto: h.custodiadoNome || 'Nome não informado',
          tipoValidacaoFormatado: formatarTipoValidacao(h.tipoValidacao),
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

  // Aplicar filtros da URL
  useEffect(() => {
    const busca = searchParams.get('busca');
    const tipo = searchParams.get('tipo') as 'todos' | 'PRESENCIAL' | 'ONLINE' | 'CADASTRO_INICIAL' | null;
    const dataI = searchParams.get('dataInicio');
    const dataF = searchParams.get('dataFim');

    if (busca) setFiltro(busca);
    if (tipo) setFiltroTipoValidacao(tipo);
    if (dataI) setDataInicio(dataI);
    if (dataF) setDataFim(dataF);
  }, [searchParams]);

  // Atualizar URL com filtros
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

  // Funções auxiliares
  const formatarTipoValidacao = (tipo: string): string => {
    const tipos: Record<string, string> = {
      'PRESENCIAL': 'Presencial',
      'ONLINE': 'Online',
      'CADASTRO_INICIAL': 'Cadastro Inicial'
    };
    return tipos[tipo] || tipo;
  };

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

  // Filtrar dados
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

      const matchTipo = filtroTipoValidacao === 'todos' || item.tipoValidacao === filtroTipoValidacao;

      const dentroPeriodo = (!dataInicio || !dataFim) ||
        (new Date(item.dataComparecimento) >= new Date(dataInicio) &&
          new Date(item.dataComparecimento) <= new Date(dataFim));

      return matchTexto && matchTipo && dentroPeriodo;
    });
  }, [filtro, filtroTipoValidacao, dataInicio, dataFim, normalizarTexto]);

  // Ordenar dados
  const ordenarDados = useCallback((data: HistoricoFormatado[]): HistoricoFormatado[] => {
    return [...data].sort((a, b) => {
      const valA = a[colunaOrdenacao as keyof HistoricoFormatado];
      const valB = b[colunaOrdenacao as keyof HistoricoFormatado];

      if (colunaOrdenacao === 'dataComparecimento') {
        const dateA = valA ? new Date(valA as string | number | Date) : undefined;
        const dateB = valB ? new Date(valB as string | number | Date) : undefined;
        if (!dateA || !dateB) return 0;
        return ordem === 'asc' ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
      }

      return ordem === 'asc'
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
  }, [colunaOrdenacao, ordem]);

  const limparFiltros = () => {
    setFiltro('');
    setFiltroTipoValidacao('todos');
    setDataInicio('');
    setDataFim('');
    setCurrentPage(1);
    router.push('/dashboard/historico');
  };

  const handleRefresh = async () => {
    await carregarHistoricos();
  };

  const dadosFiltrados = useMemo(() => {
    return ordenarDados(filtrarDados(historicos));
  }, [historicos, filtrarDados, ordenarDados]);

  const totalFiltrados = dadosFiltrados.length;

  const totalPages = Math.ceil(totalFiltrados / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const dadosPaginados = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return dadosFiltrados.slice(startIndex, startIndex + itemsPerPage);
  }, [dadosFiltrados, currentPage, itemsPerPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    containerRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const exportFilterInfo = {
    filtro: filtro || undefined,
    tipo: filtroTipoValidacao !== 'todos' ? filtroTipoValidacao : undefined,
    dataInicio: dataInicio || undefined,
    dataFim: dataFim || undefined
  };

  const hasActiveFilters = filtro || filtroTipoValidacao !== 'todos' || dataInicio || dataFim;

  if (loading) {
    return (
      <div className="p-4 sm:p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-lg text-gray-600">Carregando históricos...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto mt-8">
          <h3 className="text-red-800 font-semibold mb-2">Erro ao carregar dados</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  const MobileCard = ({ item }: { item: HistoricoFormatado }) => {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-l-primary">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 text-sm">{item.custodiadoNomeCompleto}</h3>
            </div>
          </div>
          <span className={`px-2 py-1 rounded text-xs font-medium ${item.tipoValidacao === 'PRESENCIAL' ? 'bg-green-100 text-green-800' :
            item.tipoValidacao === 'ONLINE' ? 'bg-blue-100 text-blue-800' :
              'bg-purple-100 text-purple-800'
            }`}>
            {item.tipoValidacaoFormatado}
          </span>
        </div>

        <div className="space-y-1.5 mb-3">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Calendar className="w-3.5 h-3.5" />
            <span>{item.dataFormatada} às {item.horaFormatada}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <User className="w-3.5 h-3.5" />
            <span>Validado por: {item.validadoPor}</span>
          </div>
          {item.observacoes && (
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <FileText className="w-3.5 h-3.5" />
              <span className="line-clamp-1">{item.observacoes}</span>
            </div>
          )}
          {item.mudancaEndereco && (
            <button
              onClick={() => router.push(`/dashboard/historicoComparecimento/enderecos/${item.custodiadoId}`)}
              className="flex items-center gap-2 text-xs text-green-600 hover:text-green-700 transition-colors"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Ver histórico de endereços</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50" ref={containerRef}>
      {isMobile ? (
        <>
          <div className="bg-white sticky top-0 z-20 shadow-sm">
            <div className="p-4 pb-2">
              <div className="flex items-center justify-between mb-3">
                <h1 className="text-xl font-bold text-primary-dark">Histórico de Comparecimentos</h1>
                <div className="flex gap-2">
                  <button onClick={handleRefresh} className="p-2 bg-gray-100 rounded-lg">
                    <RefreshCw className="w-5 h-5 text-gray-600" />
                  </button>
                  <button
                    onClick={() => setShowMobileExport(!showMobileExport)}
                    className="p-2 bg-gray-100 rounded-lg"
                  >
                    <FileText className="w-5 h-5 text-gray-600" />
                  </button>
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`p-2 rounded-lg ${hasActiveFilters ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'}`}
                  >
                    <Filter className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {showMobileExport && (
                <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                  <ExportButton
                    dados={historicos as any}
                    dadosFiltrados={dadosFiltrados as any}
                    filterInfo={exportFilterInfo}
                    className="w-full"
                  />
                </div>
              )}

              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar por nome ou validador..."
                  value={filtro}
                  onChange={(e) => setFiltro(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                />
                {filtro && (
                  <button
                    onClick={() => setFiltro('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                )}
              </div>



              {showFilters && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg space-y-3 animate-in slide-in-from-top-2">
                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 block">Tipo de Validação</label>
                    <div className="grid grid-cols-4 gap-1">
                      <button
                        onClick={() => setFiltroTipoValidacao('todos')}
                        className={`py-1.5 px-2 rounded text-xs font-medium ${filtroTipoValidacao === 'todos' ? 'bg-primary text-white' : 'bg-white text-gray-600'}`}
                      >
                        Todos
                      </button>
                      <button
                        onClick={() => setFiltroTipoValidacao('PRESENCIAL')}
                        className={`py-1.5 px-2 rounded text-xs font-medium ${filtroTipoValidacao === 'PRESENCIAL' ? 'bg-green-500 text-white' : 'bg-white text-gray-600'}`}
                      >
                        Presencial
                      </button>
                      <button
                        onClick={() => setFiltroTipoValidacao('ONLINE')}
                        className={`py-1.5 px-2 rounded text-xs font-medium ${filtroTipoValidacao === 'ONLINE' ? 'bg-blue-500 text-white' : 'bg-white text-gray-600'}`}
                      >
                        Online
                      </button>
                      <button
                        onClick={() => setFiltroTipoValidacao('CADASTRO_INICIAL')}
                        className={`py-1.5 px-2 rounded text-xs font-medium ${filtroTipoValidacao === 'CADASTRO_INICIAL' ? 'bg-purple-500 text-white' : 'bg-white text-gray-600'}`}
                      >
                        Cadastro
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-medium text-gray-700 mb-1 block">Data Início</label>
                      <input
                        type="date"
                        value={dataInicio}
                        onChange={(e) => setDataInicio(e.target.value)}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-700 mb-1 block">Data Fim</label>
                      <input
                        type="date"
                        value={dataFim}
                        onChange={(e) => setDataFim(e.target.value)}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs"
                      />
                    </div>
                  </div>

                  {hasActiveFilters && (
                    <button onClick={limparFiltros} className="w-full py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium">
                      Limpar Filtros
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="px-4 pb-2 flex items-center justify-between text-xs text-gray-600 border-t">
              <span>{totalFiltrados} resultados</span>
              {totalPages > 1 && <span>Página {currentPage} de {totalPages}</span>}
            </div>
          </div>

          <div className="p-4 pb-20 space-y-3">
            {dadosPaginados.map((item, index) => (
              <MobileCard key={item.id || index} item={item} />
            ))}

            {dadosFiltrados.length === 0 && (
              <div className="text-center py-12">
                <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">Nenhum resultado encontrado</h3>
                <p className="text-gray-500 text-sm mb-4">Tente ajustar os filtros ou termos de busca</p>
                <button onClick={limparFiltros} className="bg-primary text-white px-4 py-2 rounded-lg text-sm">
                  Limpar Filtros
                </button>
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1 px-3 py-2 text-sm bg-white border rounded-lg disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Anterior
                </button>
                <span className="text-sm text-gray-600">{currentPage} / {totalPages}</span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1 px-3 py-2 text-sm bg-white border rounded-lg disabled:opacity-50"
                >
                  Próxima
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="max-w-7xl mx-auto p-4 sm:p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-3xl font-bold text-primary mb-2">Histórico de Comparecimentos</h2>
              <p className="text-text-muted">Visualize todos os comparecimentos registrados no sistema</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleRefresh}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
              >
                <RefreshCw className="w-4 h-4" />
                Atualizar
              </button>
              <ExportButton dados={historicos as any} dadosFiltrados={dadosFiltrados as any} filterInfo={exportFilterInfo} />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Search className="w-4 h-4 inline mr-1" />
                  Buscar
                </label>
                <input
                  type="text"
                  placeholder="Nome do custodiado ou validador"
                  value={filtro}
                  onChange={(e) => setFiltro(e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Validação</label>
                <select
                  value={filtroTipoValidacao}
                  onChange={(e) => setFiltroTipoValidacao(e.target.value as any)}
                  className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="todos">Todos</option>
                  <option value="PRESENCIAL">Presencial</option>
                  <option value="ONLINE">Online</option>
                  <option value="CADASTRO_INICIAL">Cadastro Inicial</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ordenar por</label>
                <select
                  className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  value={colunaOrdenacao}
                  onChange={(e) => setColunaOrdenacao(e.target.value)}
                >
                  <option value="dataComparecimento">Data do Comparecimento</option>
                  <option value="custodiadoNome">Nome do Custodiado</option>
                  <option value="tipoValidacao">Tipo de Validação</option>
                  <option value="validadoPor">Validado Por</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ordem</label>
                <select
                  className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  value={ordem}
                  onChange={(e) => setOrdem(e.target.value as 'asc' | 'desc')}
                >
                  <option value="desc">Mais Recente</option>
                  <option value="asc">Mais Antigo</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data Inicial</label>
                <input
                  type="date"
                  className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data Final</label>
                <input
                  type="date"
                  className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
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
                        <div>
                          <p className="font-medium text-text-base">{item.custodiadoNomeCompleto}</p>
                        </div>
                      </td>
                      <td className="p-3 text-center text-sm">
                        {item.dataFormatada}
                      </td>
                      <td className="p-3 text-center text-sm">
                        {item.horaFormatada}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${item.tipoValidacao === 'PRESENCIAL' ? 'bg-green-100 text-green-800' :
                          item.tipoValidacao === 'ONLINE' ? 'bg-blue-100 text-blue-800' :
                            'bg-purple-100 text-purple-800'
                          }`}>
                          {item.tipoValidacaoFormatado}
                        </span>
                      </td>
                      <td className="p-3 text-sm">
                        {item.validadoPor}
                      </td>
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
                              className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs hover:bg-green-200 transition-colors cursor-pointer"
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
                <div className="text-gray-400 mb-4">
                  <Search className="w-12 h-12 mx-auto" />
                </div>
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