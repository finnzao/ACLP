'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import usuarios from '@/db/usuarios_mock.json';
import type { Comparecimento } from '@/types';
import DetalhesAcusadoModal from '@/components/detalhesSubmetido';
import EditarAcusadoModal from '@/components/editarSubmetido';
import ExportButton from '@/components/ExportButton';
import { Search, Filter, AlertTriangle, CheckCircle, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

export default function GeralPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Estados principais
  const [filtro, setFiltro] = useState('');
  const [colunaOrdenacao, setColunaOrdenacao] = useState<keyof Comparecimento>('nome');
  const [ordem, setOrdem] = useState<'asc' | 'desc'>('asc');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'em conformidade' | 'inadimplente'>('todos');
  const [filtroUrgencia, setFiltroUrgencia] = useState<'todos' | 'hoje' | 'atrasados' | 'proximos'>('todos');

  // Estados de controle
  const [selecionado, setSelecionado] = useState<Comparecimento | null>(null);
  const [editando, setEditando] = useState<Comparecimento | null>(null);
  const [todosOsDados, setTodosOsDados] = useState<Comparecimento[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  // Estados de paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const containerRef = useRef<HTMLDivElement>(null);

  // Carregar dados iniciais
  useEffect(() => {
    if (!initialLoad) return;

    setLoading(true);

    // Simular carregamento do banco de dados
    const loadData = async () => {
      await new Promise(resolve => setTimeout(resolve, 800));

      const todosOsDados = usuarios.map((item) => ({
        ...item,
        periodicidade: item.periodicidade as Comparecimento['periodicidade'],
        status: item.status as Comparecimento['status'],
      }));

      setTodosOsDados(todosOsDados);
      setInitialLoad(false);
      setLoading(false);
    };

    loadData();
  }, [initialLoad]);

  // Configurar busca inicial a partir da URL
  useEffect(() => {
    const busca = searchParams.get('busca');
    const status = searchParams.get('status') as 'todos' | 'em conformidade' | 'inadimplente' | null;
    const urgencia = searchParams.get('urgencia') as 'todos' | 'hoje' | 'atrasados' | 'proximos' | null;
    const dataI = searchParams.get('dataInicio');
    const dataF = searchParams.get('dataFim');

    if (busca) setFiltro(busca);
    if (status) setFiltroStatus(status);
    if (urgencia) setFiltroUrgencia(urgencia);
    if (dataI) setDataInicio(dataI);
    if (dataF) setDataFim(dataF);
  }, [searchParams]);

  // Atualizar URL quando filtros mudarem
  useEffect(() => {
    const params = new URLSearchParams();

    if (filtro) params.set('busca', filtro);
    if (filtroStatus !== 'todos') params.set('status', filtroStatus);
    if (filtroUrgencia !== 'todos') params.set('urgencia', filtroUrgencia);
    if (dataInicio) params.set('dataInicio', dataInicio);
    if (dataFim) params.set('dataFim', dataFim);

    const queryString = params.toString();
    const newUrl = queryString ? `${window.location.pathname}?${queryString}` : window.location.pathname;

    // Atualizar URL sem recarregar a página
    window.history.replaceState({}, '', newUrl);

    // Reset pagination when filters change
    setCurrentPage(1);
  }, [filtro, filtroStatus, filtroUrgencia, dataInicio, dataFim]);

  // Utilitários
  const limparMascaraProcesso = useCallback((processo: string) => {
    return processo.replace(/\D/g, '');
  }, []);

  const normalizarTexto = useCallback((texto: string) => {
    return texto
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }, []);

  const getDaysUntil = useCallback((date: string): number => {
    const today = new Date();
    const targetDate = new Date(date);
    const diffTime = targetDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, []);

  const isToday = useCallback((date: string): boolean => {
    return date === new Date().toISOString().split('T')[0];
  }, []);

  const isOverdue = useCallback((date: string): boolean => {
    const today = new Date();
    const targetDate = new Date(date);
    const diffTime = targetDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) < 0;
  }, []);

  // Filtros
  const filtrarDados = useCallback((data: Comparecimento[]): Comparecimento[] => {
    return data.filter((item) => {
      const termo = filtro.trim();
      let matchTexto = true;

      if (termo.length > 0) {
        const primeiraLetra = termo[0];
        const buscandoProcesso = /\d/.test(primeiraLetra);
        const termoNormalizado = normalizarTexto(termo);
        const termoSomenteNumeros = limparMascaraProcesso(termo);
        const nomeNormalizado = normalizarTexto(item.nome);
        const processoSemMascara = limparMascaraProcesso(item.processo);

        const matchNome = nomeNormalizado.includes(termoNormalizado);
        const matchProcesso = item.processo.includes(termo) || processoSemMascara.includes(termoSomenteNumeros);

        matchTexto = buscandoProcesso ? matchProcesso : matchNome;
      }

      const matchStatus = filtroStatus === 'todos' || item.status === filtroStatus;

      let matchUrgencia = true;
      if (filtroUrgencia !== 'todos') {
        const hoje = isToday(item.proximoComparecimento);
        const atrasado = isOverdue(item.proximoComparecimento);
        const proximo = getDaysUntil(item.proximoComparecimento) <= 7 && !hoje && !atrasado;

        switch (filtroUrgencia) {
          case 'hoje': matchUrgencia = hoje; break;
          case 'atrasados': matchUrgencia = atrasado; break;
          case 'proximos': matchUrgencia = proximo; break;
        }
      }

      const dentroPeriodo = (!dataInicio || !dataFim) ||
        (new Date(item.proximoComparecimento) >= new Date(dataInicio) &&
          new Date(item.proximoComparecimento) <= new Date(dataFim));

      return matchTexto && matchStatus && matchUrgencia && dentroPeriodo;
    });
  }, [filtro, filtroStatus, filtroUrgencia, dataInicio, dataFim, normalizarTexto, limparMascaraProcesso, isToday, isOverdue, getDaysUntil]);


  const ordenarDados = useCallback((data: Comparecimento[]): Comparecimento[] => {
    return [...data].sort((a, b) => {
      const valA = a[colunaOrdenacao];
      const valB = b[colunaOrdenacao];

      if (colunaOrdenacao.includes('Comparecimento') || colunaOrdenacao === 'decisao') {
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



  // Função para criar links de filtro rápido
  const createFilterLink = (params: Record<string, string>) => {
    const currentParams = new URLSearchParams(window.location.search);
    Object.entries(params).forEach(([key, value]) => {
      if (value === 'todos' || value === '') {
        currentParams.delete(key);
      } else {
        currentParams.set(key, value);
      }
    });
    return `${window.location.pathname}?${currentParams.toString()}`;
  };

  // Limpar todos os filtros
  const limparFiltros = () => {
    setFiltro('');
    setFiltroStatus('todos');
    setFiltroUrgencia('todos');
    setDataInicio('');
    setDataFim('');
    setCurrentPage(1);
    router.push('/dashboard/geral');
  };

  const dadosFiltrados = useMemo(() => {
    return ordenarDados(filtrarDados(todosOsDados));
  }, [todosOsDados, filtrarDados, ordenarDados]);
  const totalFiltrados = dadosFiltrados.length;
  const totalEmConformidade = dadosFiltrados.filter(d => d.status === 'em conformidade').length;
  const totalInadimplentes = dadosFiltrados.filter(d => d.status === 'inadimplente').length;
  const totalHoje = dadosFiltrados.filter(d => isToday(d.proximoComparecimento)).length;
  const totalAtrasados = dadosFiltrados.filter(d => isOverdue(d.proximoComparecimento)).length;

  // Paginação
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

  // Informações para exportação
  const exportFilterInfo = {
    filtro: filtro || undefined,
    status: filtroStatus !== 'todos' ? filtroStatus : undefined,
    urgencia: filtroUrgencia !== 'todos' ? filtroUrgencia : undefined,
    dataInicio: dataInicio || undefined,
    dataFim: dataFim || undefined
  };

  // Mostrar loading apenas durante carregamento inicial
  if (initialLoad || loading) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-lg text-gray-600">Carregando dados...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6" ref={containerRef}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-primary mb-2">Painel Geral de Comparecimentos</h2>
          <p className="text-text-muted">Gerencie todos os comparecimentos em um só lugar</p>
        </div>

        <div className="flex gap-2">
          <ExportButton
            dados={todosOsDados}
            dadosFiltrados={dadosFiltrados}
            filterInfo={exportFilterInfo}
          />
        </div>
      </div>

      {/* Estatísticas Rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-l-primary">
          <p className="text-sm text-text-muted">Total</p>
          <p className="text-2xl font-bold text-primary">{totalFiltrados}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-l-secondary">
          <p className="text-sm text-text-muted">Em Conformidade</p>
          <p className="text-2xl font-bold text-secondary">{totalEmConformidade}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-l-danger">
          <p className="text-sm text-text-muted">Inadimplentes</p>
          <p className="text-2xl font-bold text-danger">{totalInadimplentes}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-l-warning">
          <p className="text-sm text-text-muted">Hoje</p>
          <p className="text-2xl font-bold text-warning">{totalHoje}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-l-red-500">
          <p className="text-sm text-text-muted">Atrasados</p>
          <p className="text-2xl font-bold text-red-500">{totalAtrasados}</p>
        </div>
      </div>

      {/* Filtros Rápidos */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="text-sm font-medium text-gray-700">Filtros Rápidos:</span>
          <button
            onClick={() => router.push(createFilterLink({ urgencia: 'hoje' }))}
            className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm hover:bg-yellow-200 transition-colors"
          >
            <Clock className="w-3 h-3 inline mr-1" />
            Comparecimentos Hoje ({totalHoje})
          </button>
          <button
            onClick={() => router.push(createFilterLink({ urgencia: 'atrasados' }))}
            className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm hover:bg-red-200 transition-colors"
          >
            <AlertTriangle className="w-3 h-3 inline mr-1" />
            Em Atraso ({totalAtrasados})
          </button>
          <button
            onClick={() => router.push(createFilterLink({ status: 'em conformidade' }))}
            className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm hover:bg-green-200 transition-colors"
          >
            <CheckCircle className="w-3 h-3 inline mr-1" />
            Em Conformidade ({totalEmConformidade})
          </button>
          <button
            onClick={() => router.push(createFilterLink({ status: 'inadimplente' }))}
            className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm hover:bg-red-200 transition-colors"
          >
            <AlertTriangle className="w-3 h-3 inline mr-1" />
            Inadimplentes ({totalInadimplentes})
          </button>
          {(filtro || filtroStatus !== 'todos' || filtroUrgencia !== 'todos' || dataInicio || dataFim) && (
            <button
              onClick={limparFiltros}
              className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors"
            >
              Limpar Filtros
            </button>
          )}
        </div>
      </div>

      {/* Filtros Principais */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          {/* Busca por texto */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Search className="w-4 h-4 inline mr-1" />
              Buscar
            </label>
            <input
              type="text"
              placeholder="Nome ou processo"
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* Filtro de Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value as 'todos' | 'em conformidade' | 'inadimplente')}
              className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="todos">Todos</option>
              <option value="em conformidade">Em Conformidade</option>
              <option value="inadimplente">Inadimplente</option>
            </select>
          </div>

          {/* Filtro de Urgência */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Urgência</label>
            <select
              value={filtroUrgencia}
              onChange={(e) => setFiltroUrgencia(e.target.value as 'todos' | 'hoje' | 'atrasados' | 'proximos')}
              className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="todos">Todos</option>
              <option value="hoje">Hoje</option>
              <option value="atrasados">Atrasados</option>
              <option value="proximos">Próximos 7 dias</option>
            </select>
          </div>

          {/* Ordenação */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ordenar por</label>
            <select
              className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              value={colunaOrdenacao}
              onChange={(e) => setColunaOrdenacao(e.target.value as keyof Comparecimento)}
            >
              <option value="nome">Nome</option>
              <option value="status">Status</option>
              <option value="proximoComparecimento">Próximo Comparecimento</option>
              <option value="ultimoComparecimento">Último Comparecimento</option>
              <option value="decisao">Data da Decisão</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ordem</label>
            <select
              className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              value={ordem}
              onChange={(e) => setOrdem(e.target.value as 'asc' | 'desc')}
            >
              <option value="asc">Crescente</option>
              <option value="desc">Decrescente</option>
            </select>
          </div>

          {/* Filtro de Data */}
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
        </div>
      </div>

      {/* Resultados */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-800">
              Resultados ({totalFiltrados} {totalFiltrados === 1 ? 'pessoa' : 'pessoas'})
              {totalFiltrados > 0 && (
                <span className="text-sm text-gray-600 ml-2">
                  • Página {currentPage} de {totalPages}
                  • Mostrando {startIndex + 1}-{Math.min(endIndex, totalFiltrados)} de {totalFiltrados}
                </span>
              )}
            </h3>
            {(filtro || filtroStatus !== 'todos' || filtroUrgencia !== 'todos' || dataInicio || dataFim) && (
              <span className="text-sm text-gray-600">
                <Filter className="w-4 h-4 inline mr-1" />
                Filtros ativos
              </span>
            )}
          </div>
        </div>

        {/* Tabela */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] table-auto">
            <thead className="bg-primary text-white">
              <tr>
                <th className="p-3 text-left">Nome</th>
                <th className="p-3 text-left">Processo</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Último</th>
                <th className="p-3 text-center">Próximo</th>
                <th className="p-3 text-center">Urgência</th>
                <th className="p-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {dadosPaginados.map((item, index) => {
                const hoje = isToday(item.proximoComparecimento);
                const atrasado = isOverdue(item.proximoComparecimento);
                const diasRestantes = getDaysUntil(item.proximoComparecimento);

                return (
                  <tr
                    key={index}
                    className={`border-b border-border hover:bg-gray-50 transition-colors ${atrasado ? 'bg-red-50' : hoje ? 'bg-yellow-50' : ''
                      }`}
                  >
                    <td className="p-3">
                      <div>
                        <p className="font-medium text-text-base">{item.nome}</p>
                        <p className="text-sm text-text-muted">{item.cpf}</p>
                      </div>
                    </td>
                    <td className="p-3">
                      <p className="text-sm font-mono text-text-muted">{item.processo}</p>
                      <p className="text-xs text-text-muted">{item.vara}</p>
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${item.status === 'inadimplente' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                        }`}>
                        {item.status === 'inadimplente' ? 'Inadimplente' : 'Em Conformidade'}
                      </span>
                    </td>
                    <td className="p-3 text-center text-sm">
                      {new Date(item.ultimoComparecimento).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="p-3 text-center">
                      <div className={`text-sm font-medium ${atrasado ? 'text-red-600' : hoje ? 'text-yellow-600' : 'text-text-base'
                        }`}>
                        {new Date(item.proximoComparecimento).toLocaleDateString('pt-BR')}
                      </div>
                      <div className="text-xs text-text-muted">
                        {atrasado ? `${Math.abs(diasRestantes)} dias atraso` :
                          hoje ? 'Hoje' :
                            diasRestantes > 0 ? `${diasRestantes} dias` : 'Vencido'}
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      {atrasado && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                          <AlertTriangle className="w-3 h-3" />
                          Urgente
                        </span>
                      )}
                      {hoje && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                          <Clock className="w-3 h-3" />
                          Hoje
                        </span>
                      )}
                      {!atrasado && !hoje && diasRestantes <= 7 && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                          <Clock className="w-3 h-3" />
                          Próximo
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => setSelecionado(item)}
                        className="bg-primary text-white px-3 py-1 rounded text-sm hover:bg-primary-dark transition-colors"
                      >
                        Visualizar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
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
                        className={`px-3 py-2 text-sm rounded-lg ${currentPage === pageNum
                          ? 'bg-primary text-white'
                          : 'bg-white border border-gray-300 hover:bg-gray-50'
                          }`}
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

        {/* Mensagem quando não há resultados */}
        {dadosFiltrados.length === 0 && (
          <div className="p-8 text-center">
            <div className="text-gray-400 mb-4">
              <Search className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-gray-600 mb-2">Nenhum resultado encontrado</h3>
            <p className="text-gray-500 mb-4">
              {filtroUrgencia === 'hoje' && totalHoje === 0 ?
                'Não há comparecimentos agendados para hoje.' :
                filtroUrgencia === 'atrasados' && totalAtrasados === 0 ?
                  'Não há comparecimentos em atraso.' :
                  'Tente ajustar os filtros ou termos de busca'
              }
            </p>
            <button
              onClick={limparFiltros}
              className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
            >
              Limpar Filtros
            </button>
          </div>
        )}
      </div>

      {/* Modais */}
      {selecionado && (
        <DetalhesAcusadoModal
          dados={selecionado}
          onClose={() => setSelecionado(null)}
          onEditar={(dados) => {
            setSelecionado(null);
            setEditando(dados);
          }}
        />
      )}

      {editando && (
        <EditarAcusadoModal
          dados={editando}
          onClose={() => setEditando(null)}
          onVoltar={() => {
            setSelecionado(editando);
            setEditando(null);
          }}
          onSave={(novo: Comparecimento) => {
            setTodosOsDados((prev) =>
              prev.map((item) => (item.processo === novo.processo ? novo : item))
            );
            setEditando(null);
          }}
        />
      )}
    </div>
  );
}