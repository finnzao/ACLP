// hooks/useBackendApi.ts
import { useState, useEffect, useCallback } from 'react';
import {
  pessoasService,
  comparecimentosService,
  historicoEnderecosService,
  usuariosService,
  setupService,
  verificacaoService,
  testService
} from '@/lib/api/backend-api';
import {
  PessoaResponse,
  ComparecimentoResponse,
  UsuarioResponse,
  PessoaDTO,
  ComparecimentoDTO,
  UsuarioDTO,
  StatusComparecimento,
  TipoUsuario,
  PeriodoParams,
  BuscarParams,
  EstatisticasComparecimentoResponse,
  SetupStatusResponse,
  HealthResponse,
  AppInfoResponse
} from '@/types/backend';

// =====================
// Hook para Pessoas
// =====================
export function usePessoas() {
  const [pessoas, setPessoas] = useState<PessoaResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const carregarPessoas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await pessoasService.listar();
      setPessoas(data);
    } catch (err) {
      setError('Erro ao carregar pessoas');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarPessoas();
  }, [carregarPessoas]);

  const criarPessoa = useCallback(async (data: PessoaDTO) => {
    try {
      console.log('[usePessoas] Enviando dados para o backend:', data);
      
      const result = await pessoasService.criar(data);
      
      console.log('[usePessoas] Resposta do backend:', result);
      
      if (result.success) {
        await carregarPessoas(); // Recarregar lista
        return { success: true, message: result.message || 'Pessoa criada com sucesso', data: result.data };
      }
      return { success: false, message: result.message || 'Erro ao criar pessoa' };
    } catch (error) {
      console.error('[usePessoas] Erro ao criar pessoa:', error);
      return { success: false, message: 'Erro interno do sistema' };
    }
  }, [carregarPessoas]);

  const atualizarPessoa = useCallback(async (id: number, data: Partial<PessoaDTO>) => {
    try {
      const result = await pessoasService.atualizar(id, data);
      if (result.success) {
        await carregarPessoas();
        return { success: true, message: 'Pessoa atualizada com sucesso' };
      }
      return { success: false, message: result.message || 'Erro ao atualizar pessoa' };
    } catch (error) {
      console.error('Erro ao atualizar pessoa:', error);
      return { success: false, message: 'Erro interno do sistema' };
    }
  }, [carregarPessoas]);

  const excluirPessoa = useCallback(async (id: number) => {
    try {
      const result = await pessoasService.excluir(id);
      if (result.success) {
        await carregarPessoas();
        return { success: true, message: 'Pessoa excluída com sucesso' };
      }
      return { success: false, message: result.message || 'Erro ao excluir pessoa' };
    } catch (error) {
      console.error('Erro ao excluir pessoa:', error);
      return { success: false, message: 'Erro interno do sistema' };
    }
  }, [carregarPessoas]);

  const buscarPorProcesso = useCallback(async (processo: string) => {
    try {
      return await pessoasService.buscarPorProcesso(processo);
    } catch (error) {
      console.error('Erro ao buscar por processo:', error);
      return null;
    }
  }, []);

  const buscarPorStatus = useCallback(async (status: StatusComparecimento) => {
    try {
      return await pessoasService.buscarPorStatus(status);
    } catch (error) {
      console.error('Erro ao buscar por status:', error);
      return [];
    }
  }, []);

  return {
    pessoas,
    loading,
    error,
    criarPessoa,
    atualizarPessoa,
    excluirPessoa,
    buscarPorProcesso,
    buscarPorStatus,
    refetch: carregarPessoas
  };
}

// =====================
// Hook para Comparecimentos
// =====================
export function useComparecimentos() {
  const [comparecimentos, setComparecimentos] = useState<ComparecimentoResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const registrarComparecimento = useCallback(async (data: ComparecimentoDTO) => {
    try {
      setLoading(true);
      const result = await comparecimentosService.registrar(data);
      if (result.success) {
        return { success: true, message: 'Comparecimento registrado com sucesso', data: result.data };
      }
      return { success: false, message: result.message || 'Erro ao registrar comparecimento' };
    } catch (error) {
      console.error('Erro ao registrar comparecimento:', error);
      return { success: false, message: 'Erro interno do sistema' };
    } finally {
      setLoading(false);
    }
  }, []);

  const buscarPorPessoa = useCallback(async (pessoaId: number) => {
    try {
      setLoading(true);
      const data = await comparecimentosService.buscarPorPessoa(pessoaId);
      setComparecimentos(data);
      return data;
    } catch (error) {
      console.error('Erro ao buscar comparecimentos:', error);
      setError('Erro ao buscar comparecimentos');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const buscarPorPeriodo = useCallback(async (params: PeriodoParams) => {
    try {
      setLoading(true);
      const data = await comparecimentosService.buscarPorPeriodo(params);
      setComparecimentos(data);
      return data;
    } catch (error) {
      console.error('Erro ao buscar por período:', error);
      setError('Erro ao buscar comparecimentos');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const comparecimentosHoje = useCallback(async () => {
    try {
      return await comparecimentosService.comparecimentosHoje();
    } catch (error) {
      console.error('Erro ao buscar comparecimentos de hoje:', error);
      return [];
    }
  }, []);

  return {
    comparecimentos,
    loading,
    error,
    registrarComparecimento,
    buscarPorPessoa,
    buscarPorPeriodo,
    comparecimentosHoje
  };
}

// =====================
// Hook para Usuários
// =====================
export function useUsuarios() {
  const [usuarios, setUsuarios] = useState<UsuarioResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const carregarUsuarios = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await usuariosService.listar();
      setUsuarios(data);
    } catch (err) {
      setError('Erro ao carregar usuários');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarUsuarios();
  }, [carregarUsuarios]);

  const criarUsuario = useCallback(async (data: UsuarioDTO) => {
    try {
      const result = await usuariosService.criar(data);
      if (result.success) {
        await carregarUsuarios();
        return { success: true, message: 'Usuário criado com sucesso' };
      }
      return { success: false, message: result.message || 'Erro ao criar usuário' };
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      return { success: false, message: 'Erro interno do sistema' };
    }
  }, [carregarUsuarios]);

  const atualizarUsuario = useCallback(async (id: number, data: Partial<UsuarioDTO>) => {
    try {
      const result = await usuariosService.atualizar(id, data);
      if (result.success) {
        await carregarUsuarios();
        return { success: true, message: 'Usuário atualizado com sucesso' };
      }
      return { success: false, message: result.message || 'Erro ao atualizar usuário' };
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      return { success: false, message: 'Erro interno do sistema' };
    }
  }, [carregarUsuarios]);

  return {
    usuarios,
    loading,
    error,
    criarUsuario,
    atualizarUsuario,
    refetch: carregarUsuarios
  };
}

// =====================
// Hook para Estatísticas
// =====================
export function useEstatisticas() {
  const [stats, setStats] = useState<EstatisticasComparecimentoResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const carregarEstatisticas = useCallback(async (params?: PeriodoParams) => {
    try {
      setLoading(true);
      setError(null);
      const data = await comparecimentosService.obterEstatisticas(params);
      setStats(data);
      return data;
    } catch (err) {
      setError('Erro ao carregar estatísticas');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarEstatisticas();
  }, [carregarEstatisticas]);

  return {
    stats,
    loading,
    error,
    refetch: carregarEstatisticas
  };
}

// =====================
// Hook para Setup
// =====================
export function useSetup() {
  const [setupStatus, setSetupStatus] = useState<SetupStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const verificarStatus = useCallback(async () => {
    try {
      setLoading(true);
      const status = await setupService.getStatus();
      setSetupStatus(status);
      return status;
    } catch (error) {
      console.error('Erro ao verificar status do setup:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    verificarStatus();
  }, [verificarStatus]);

  const criarAdmin = useCallback(async (data: any) => {
    try {
      const result = await setupService.createAdmin(data);
      if (result.success) {
        await verificarStatus(); // Reverificar status
      }
      return result;
    } catch (error) {
      console.error('Erro ao criar admin:', error);
      return { success: false, message: 'Erro interno', timestamp: new Date().toISOString() };
    }
  }, [verificarStatus]);

  return {
    setupStatus,
    loading,
    criarAdmin,
    verificarStatus
  };
}

// =====================
// Hook para Health Check
// =====================
export function useHealthCheck() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [appInfo, setAppInfo] = useState<AppInfoResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const verificarHealth = useCallback(async () => {
    try {
      setLoading(true);
      const [healthData, infoData] = await Promise.all([
        testService.health(),
        testService.info()
      ]);
      setHealth(healthData);
      setAppInfo(infoData);
      return { health: healthData, info: infoData };
    } catch (error) {
      console.error('Erro ao verificar health:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    health,
    appInfo,
    loading,
    verificarHealth
  };
}

// =====================
// Hook para Busca Geral
// =====================
export function useBusca() {
  const [resultados, setResultados] = useState<PessoaResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buscar = useCallback(async (params: BuscarParams) => {
    try {
      setLoading(true);
      setError(null);
      const data = await pessoasService.buscar(params);
      setResultados(data);
      return data;
    } catch (err) {
      setError('Erro ao realizar busca');
      console.error(err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const limparResultados = useCallback(() => {
    setResultados([]);
    setError(null);
  }, []);

  return {
    resultados,
    loading,
    error,
    buscar,
    limparResultados
  };
}