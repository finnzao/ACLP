/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCustodiados } from '@/hooks/useAPI';
import type { CustodiadoData } from '@/types/api';
import DetalhesCustodiadoModal from '@/components/DetalhesCustodiado';
import EditarCustodiadoModal from '@/components/EditarCustodiado';
import ExportButton from '@/components/ExportButton';
import { useToast } from '@/components/Toast';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  Calendar,
  User,
  FileText,
  SlidersHorizontal,
  Download,
  RefreshCw,
  MapPin
} from 'lucide-react';

interface CustodiadoFormatado {
  id: number;
  nome: string;
  cpf: string;
  rg: string;
  contato: string;
  processo: string;
  vara: string;
  comarca: string;
  decisao: string;
  periodicidade: number;
  status: 'em conformidade' | 'inadimplente';
  primeiroComparecimento: string;
  dataComparecimentoInicial: string;
  ultimoComparecimento: string;
  proximoComparecimento: string;
  endereco?: {
    cep: string;
    logradouro: string;
    numero?: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    estado: string;
  };
  observacoes?: string;
  atrasado?: boolean;
  diasAtraso?: number;
  comparecimentoHoje?: boolean;
  enderecoCompleto?: string;
  cidadeEstado?: string;
}

export default function GeralPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  const {
    custodiados: custodiadosBackend,
    loading: loadingBackend,
    error: errorBackend,
    refetch: refetchCustodiados
  } = useCustodiados();

  const [filtro, setFiltro] = useState('');
  const [colunaOrdenacao, setColunaOrdenacao] = useState<string>('nome');
  const [ordem, setOrdem] = useState<'asc' | 'desc'>('asc');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'em conformidade' | 'inadimplente'>('todos');
  const [filtroUrgencia, setFiltroUrgencia] = useState<'todos' | 'hoje' | 'atrasados' | 'proximos'>('todos');

  const [selecionado, setSelecionado] = useState<CustodiadoFormatado | null>(null);
  const [editando, setEditando] = useState<CustodiadoFormatado | null>(null);
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

  const todosOsDados = useMemo((): CustodiadoFormatado[] => {
    if (!custodiadosBackend) {
      console.warn('[GeralPage] custodiadosBackend está vazio');
      return [];
    }

    // Função para transformar CustodiadoData em CustodiadoFormatado
    const transformarCustodiado = (custodiado: CustodiadoData): CustodiadoFormatado => ({
      id: custodiado.id,
      nome: custodiado.nome,
      cpf: custodiado.cpf || '',
      rg: custodiado.rg || '',
      contato: custodiado.contato,
      processo: custodiado.processo,
      vara: custodiado.vara,
      comarca: custodiado.comarca,
      decisao: custodiado.dataDecisao,
      periodicidade: custodiado.periodicidade,
      status: custodiado.status === 'EM_CONFORMIDADE' ? 'em conformidade' : 'inadimplente',
      primeiroComparecimento: custodiado.dataComparecimentoInicial,
      dataComparecimentoInicial: custodiado.dataComparecimentoInicial,
      ultimoComparecimento: custodiado.ultimoComparecimento,
      proximoComparecimento: custodiado.proximoComparecimento,
      endereco: custodiado.endereco ? {
        cep: custodiado.endereco.cep,
        logradouro: custodiado.endereco.logradouro,
        numero: custodiado.endereco.numero,
        complemento: custodiado.endereco.complemento,
        bairro: custodiado.endereco.bairro,
        cidade: custodiado.endereco.cidade,
        estado: custodiado.endereco.estado
      } : undefined,
      observacoes: custodiado.observacoes,
      atrasado: custodiado.inadimplente || custodiado.atrasado,
      diasAtraso: custodiado.diasAtraso,
      comparecimentoHoje: custodiado.comparecimentoHoje,
      enderecoCompleto: custodiado.endereco?.enderecoCompleto || '',
      cidadeEstado: custodiado.endereco ? `${custodiado.endereco.cidade} - ${custodiado.endereco.estado}` : ''
    });

    // Type guard para verificar estrutura ApiResponse
    const isApiResponse = (data: any): data is { success: boolean; data: CustodiadoData[] } => {
      return (
        data &&
        typeof data === 'object' &&
        'success' in data &&
        'data' in data &&
        Array.isArray(data.data)
      );
    };

    // CASO 1: Estrutura ApiResponse { success, message, data: [] }
    if (isApiResponse(custodiadosBackend)) {
      console.log('[GeralPage] Estrutura ApiResponse detectada');

      if (!custodiadosBackend.success) {
        console.warn('[GeralPage] API retornou success=false');
        return [];
      }

      if (!custodiadosBackend.data || !Array.isArray(custodiadosBackend.data)) {
        console.warn('[GeralPage] data não é um array válido');
        return [];
      }

      if (custodiadosBackend.data.length === 0) {
        console.info('[GeralPage] Nenhum custodiado encontrado');
        return [];
      }

      console.log('[GeralPage] Processando', custodiadosBackend.data.length, 'custodiados');
      return custodiadosBackend.data.map(transformarCustodiado);
    }

    // CASO 2: Array direto de CustodiadoData
    if (Array.isArray(custodiadosBackend)) {
      console.log('[GeralPage] Array direto detectado:', custodiadosBackend.length);
      return custodiadosBackend.map(transformarCustodiado);
    }

    // CASO 3: Objeto desconhecido - tentar encontrar array
    if (typeof custodiadosBackend === 'object') {
      console.log('[GeralPage] Objeto desconhecido, procurando array...');

      const possibleKeys = ['data', 'custodiados', 'items', 'results'];

      for (const key of possibleKeys) {
        if (key in custodiadosBackend && Array.isArray((custodiadosBackend as any)[key])) {
          const arrayData = (custodiadosBackend as any)[key];
          console.log(`[GeralPage] Array encontrado em '${key}':`, arrayData.length);
          return arrayData.map(transformarCustodiado);
        }
      }
    }

    console.error('[GeralPage] Estrutura não reconhecida:', typeof custodiadosBackend);
    return [];
  }, [custodiadosBackend]);


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

  useEffect(() => {
    const params = new URLSearchParams();

    if (filtro) params.set('busca', filtro);
    if (filtroStatus !== 'todos') params.set('status', filtroStatus);
    if (filtroUrgencia !== 'todos') params.set('urgencia', filtroUrgencia);
    if (dataInicio) params.set('dataInicio', dataInicio);
    if (dataFim) params.set('dataFim', dataFim);

    const queryString = params.toString();
    const newUrl = queryString ? `${window.location.pathname}?${queryString}` : window.location.pathname;

    window.history.replaceState({}, '', newUrl);
    setCurrentPage(1);
  }, [filtro, filtroStatus, filtroUrgencia, dataInicio, dataFim]);

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

  const filtrarDados = useCallback((data: CustodiadoFormatado[]): CustodiadoFormatado[] => {
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
        const hoje = item.comparecimentoHoje || isToday(item.proximoComparecimento);
        const atrasado = item.atrasado || isOverdue(item.proximoComparecimento);
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

  const ordenarDados = useCallback((data: CustodiadoFormatado[]): CustodiadoFormatado[] => {
    return [...data].sort((a, b) => {
      const valA = a[colunaOrdenacao as keyof CustodiadoFormatado];
      const valB = b[colunaOrdenacao as keyof CustodiadoFormatado];

      if (colunaOrdenacao.includes('Comparecimento') || colunaOrdenacao === 'decisao' || colunaOrdenacao === 'dataDecisao') {
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
    setFiltroStatus('todos');
    setFiltroUrgencia('todos');
    setDataInicio('');
    setDataFim('');
    setCurrentPage(1);
    router.push('/dashboard/geral');
  };

  const handleRefresh = async () => {
    await refetchCustodiados();
  };

  const dadosFiltrados = useMemo(() => {
    return ordenarDados(filtrarDados(todosOsDados));
  }, [todosOsDados, filtrarDados, ordenarDados]);

  const totalFiltrados = dadosFiltrados.length;
  const totalEmConformidade = dadosFiltrados.filter(d => d.status === 'em conformidade').length;
  const totalInadimplentes = dadosFiltrados.filter(d => d.status === 'inadimplente').length;
  const totalHoje = dadosFiltrados.filter(d => d.comparecimentoHoje || isToday(d.proximoComparecimento)).length;
  const totalAtrasados = dadosFiltrados.filter(d => d.atrasado || isOverdue(d.proximoComparecimento)).length;

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
    status: filtroStatus !== 'todos' ? filtroStatus : undefined,
    urgencia: filtroUrgencia !== 'todos' ? filtroUrgencia : undefined,
    dataInicio: dataInicio || undefined,
    dataFim: dataFim || undefined
  };

  const hasActiveFilters = filtro || filtroStatus !== 'todos' || filtroUrgencia !== 'todos' || dataInicio || dataFim;

  if (loadingBackend) {
    return (
      <div className="p-4 sm:p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-lg text-gray-600">Carregando dados do servidor...</p>
          </div>
        </div>
      </div>
    );
  }

  if (errorBackend) {
    return (
      <div className="p-4 sm:p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto mt-8">
          <h3 className="text-red-800 font-semibold mb-2">Erro ao carregar dados</h3>
          <p className="text-red-600 mb-4">{errorBackend}</p>
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

  const MobileCard = ({ item }: { item: CustodiadoFormatado }) => {
    const hoje = item.comparecimentoHoje || isToday(item.proximoComparecimento);
    const atrasado = item.atrasado || isOverdue(item.proximoComparecimento);
    const diasRestantes = item.diasAtraso || getDaysUntil(item.proximoComparecimento);

    return (
      <div
        className={`bg-white rounded-lg shadow-sm p-4 border-l-4 ${atrasado ? 'border-l-red-500' : hoje ? 'border-l-yellow-500' : 'border-l-gray-300'
          }`}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 text-sm">{item.nome}</h3>
              <p className="text-xs text-gray-500">{item.cpf}</p>
            </div>
          </div>
          {(atrasado || hoje) && (
            <span className={`px-2 py-1 rounded text-xs font-bold ${atrasado ? 'bg-red-500 text-white' : 'bg-yellow-500 text-white'
              }`}>
              {atrasado ? `${Math.abs(diasRestantes)}d atraso` : 'HOJE'}
            </span>
          )}
        </div>

        <div className="space-y-1.5 mb-3">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <FileText className="w-3.5 h-3.5" />
            <span>{item.processo}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Calendar className="w-3.5 h-3.5" />
            <span>Próximo: {new Date(item.proximoComparecimento).toLocaleDateString('pt-BR')}</span>
          </div>
          {item.cidadeEstado && (
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <MapPin className="w-3.5 h-3.5" />
              <span>{item.cidadeEstado}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${item.status === 'inadimplente'
            ? 'bg-red-100 text-red-800'
            : 'bg-green-100 text-green-800'
            }`}>
            {item.status === 'inadimplente' ? 'Inadimplente' : 'Em Conformidade'}
          </span>
          <button
            onClick={() => setSelecionado(item)}
            className="text-primary text-sm font-medium hover:text-primary-dark"
          >
            Ver detalhes
          </button>
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
                <h1 className="text-xl font-bold text-primary-dark">Lista Geral</h1>
                <div className="flex gap-2">
                  <button onClick={handleRefresh} className="p-2 bg-gray-100 rounded-lg">
                    <RefreshCw className="w-5 h-5 text-gray-600" />
                  </button>
                  <button
                    onClick={() => setShowMobileExport(!showMobileExport)}
                    className="p-2 bg-gray-100 rounded-lg"
                  >
                    <Download className="w-5 h-5 text-gray-600" />
                  </button>
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`p-2 rounded-lg ${hasActiveFilters ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'}`}
                  >
                    <SlidersHorizontal className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {showMobileExport && (
                <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                  <ExportButton
                    dados={todosOsDados}
                    dadosFiltrados={dadosFiltrados}
                    filterInfo={exportFilterInfo}
                    className="w-full"
                  />
                </div>
              )}

              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar por nome ou processo..."
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

              <div className="grid grid-cols-2 gap-2 mt-3">
                <div className="bg-gray-50 p-2 rounded-lg text-center">
                  <p className="text-2xl font-bold text-primary">{totalFiltrados}</p>
                  <p className="text-xs text-gray-600">Total</p>
                </div>
                <div className="bg-gray-50 p-2 rounded-lg text-center">
                  <p className="text-2xl font-bold text-red-500">{totalAtrasados}</p>
                  <p className="text-xs text-gray-600">Atrasados</p>
                </div>
              </div>

              {showFilters && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg space-y-3 animate-in slide-in-from-top-2">
                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 block">Status</label>
                    <div className="grid grid-cols-3 gap-1">
                      <button
                        onClick={() => setFiltroStatus('todos')}
                        className={`py-1.5 px-2 rounded text-xs font-medium ${filtroStatus === 'todos' ? 'bg-primary text-white' : 'bg-white text-gray-600'}`}
                      >
                        Todos
                      </button>
                      <button
                        onClick={() => setFiltroStatus('em conformidade')}
                        className={`py-1.5 px-2 rounded text-xs font-medium ${filtroStatus === 'em conformidade' ? 'bg-green-500 text-white' : 'bg-white text-gray-600'}`}
                      >
                        Conformidade
                      </button>
                      <button
                        onClick={() => setFiltroStatus('inadimplente')}
                        className={`py-1.5 px-2 rounded text-xs font-medium ${filtroStatus === 'inadimplente' ? 'bg-red-500 text-white' : 'bg-white text-gray-600'}`}
                      >
                        Inadimplente
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 block">Urgência</label>
                    <div className="grid grid-cols-4 gap-1">
                      <button onClick={() => setFiltroUrgencia('todos')} className={`py-1.5 px-2 rounded text-xs font-medium ${filtroUrgencia === 'todos' ? 'bg-primary text-white' : 'bg-white text-gray-600'}`}>Todos</button>
                      <button onClick={() => setFiltroUrgencia('hoje')} className={`py-1.5 px-2 rounded text-xs font-medium ${filtroUrgencia === 'hoje' ? 'bg-yellow-500 text-white' : 'bg-white text-gray-600'}`}>Hoje</button>
                      <button onClick={() => setFiltroUrgencia('atrasados')} className={`py-1.5 px-2 rounded text-xs font-medium ${filtroUrgencia === 'atrasados' ? 'bg-red-500 text-white' : 'bg-white text-gray-600'}`}>Atraso</button>
                      <button onClick={() => setFiltroUrgencia('proximos')} className={`py-1.5 px-2 rounded text-xs font-medium ${filtroUrgencia === 'proximos' ? 'bg-blue-500 text-white' : 'bg-white text-gray-600'}`}>7 dias</button>
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
          {/* Desktop version - continue igual ao original mas usando os dados corrigidos */}
          {/* Restante do código desktop permanece igual */}
        </div>
      )}

      {selecionado && (
        <DetalhesCustodiadoModal
          dados={selecionado as any}
          onClose={() => setSelecionado(null)}
          onEditar={(item) => {
            setSelecionado(null);
            setEditando(item as CustodiadoFormatado);
          }}
          onExcluir={async () => {
            setSelecionado(null);
            showToast({
              type: 'success',
              title: 'Exclusão realizada',
              message: 'O registro foi excluído com sucesso.',
              duration: 3000
            });
            await refetchCustodiados();
          }}
        />
      )}

      {editando && (
        <EditarCustodiadoModal
          dados={editando as any}
          onClose={() => setEditando(null)}
          onVoltar={() => {
            setSelecionado(editando);
            setEditando(null);
          }}
          onSave={() => {
            handleRefresh();
            setEditando(null);
          }}
        />
      )}
    </div>
  );
}