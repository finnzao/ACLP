// painel-web/contexts/ApiContext.tsx
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react';
import { testService, initializeBackendApi, configureAuthHeaders } from '@/lib/api/services';
import { HealthResponse, AppInfoResponse } from '@/types/api';

// Interfaces e Tipos

interface ApiContextType {
  isConnected: boolean;
  health: HealthResponse | null;
  appInfo: AppInfoResponse | null;
  lastCheck: Date | null;
  isChecking: boolean;
  checkConnection: () => Promise<boolean>;
  setAuthToken: (token: string) => void;
  clearAuth: () => void;
  forceCheck: () => Promise<boolean>;
}

interface ApiProviderProps {
  children: ReactNode;
  autoCheck?: boolean;
  checkInterval?: number;
  enableCache?: boolean;
  cacheTimeout?: number;
}

interface CacheEntry {
  isConnected: boolean;
  health: HealthResponse | null;
  appInfo: AppInfoResponse | null;
  timestamp: number;
}

// Context

const ApiContext = createContext<ApiContextType | undefined>(undefined);

// Provider Component

export function ApiProvider({ 
  children, 
  autoCheck = false,
  checkInterval = 300000, // 5 minutos
  enableCache = true,
  cacheTimeout = 60000 // 1 minuto
}: ApiProviderProps) {
  // Estados
  const [isConnected, setIsConnected] = useState(false);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [appInfo, setAppInfo] = useState<AppInfoResponse | null>(null);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  // Refs para controle
  const checkTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const cacheRef = useRef<CacheEntry | null>(null);
  const isInitializedRef = useRef(false);

  /**
   * Verifica se o cache ainda é válido
   */
  const isCacheValid = useCallback((): boolean => {
    if (!enableCache || !cacheRef.current) return false;
    
    const now = Date.now();
    const cacheAge = now - cacheRef.current.timestamp;
    
    return cacheAge < cacheTimeout;
  }, [enableCache, cacheTimeout]);

  /**
   * Salva resultado no cache
   */
  const saveToCache = useCallback((
    connected: boolean,
    healthData: HealthResponse | null,
    infoData: AppInfoResponse | null
  ) => {
    if (enableCache) {
      cacheRef.current = {
        isConnected: connected,
        health: healthData,
        appInfo: infoData,
        timestamp: Date.now()
      };
    }
  }, [enableCache]);

  /**
   * Carrega dados do cache
   */
  const loadFromCache = useCallback((): boolean => {
    if (!isCacheValid() || !cacheRef.current) return false;

    console.log('[ApiProvider] Usando dados do cache');
    
    setIsConnected(cacheRef.current.isConnected);
    setHealth(cacheRef.current.health);
    setAppInfo(cacheRef.current.appInfo);
    
    return true;
  }, [isCacheValid]);

  /**
   * Limpa o cache
   */
  const clearCache = useCallback(() => {
    cacheRef.current = null;
  }, []);

  /**
   * Verifica conexão com o backend
   */
  const checkConnection = useCallback(async (): Promise<boolean> => {
    // Evitar múltiplas verificações simultâneas
    if (isChecking) {
      console.log('[ApiProvider] Verificação já em andamento, aguardando...');
      return isConnected;
    }

    // Verificar cache primeiro
    if (loadFromCache()) {
      return isConnected;
    }

    setIsChecking(true);

    try {
      console.log('[ApiProvider] Verificando conexão com o backend...');
      
      // Executar health check e info em paralelo com timeout
      const healthPromise = testService.health();
      const infoPromise = testService.info();

      const results = await Promise.allSettled([
        Promise.race([
          healthPromise,
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Health check timeout')), 10000)
          )
        ]),
        Promise.race([
          infoPromise,
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Info check timeout')), 10000)
          )
        ])
      ]);

      // Processar resultado do health check
      let healthData: HealthResponse;
      if (results[0].status === 'fulfilled') {
        healthData = results[0].value as HealthResponse;
      } else {
        console.error('[ApiProvider] Erro no health check:', results[0].reason);
        healthData = { 
          status: 'DOWN', 
          timestamp: new Date().toISOString(),
          details: { error: results[0].reason?.message || 'Health check failed' }
        };
      }

      // Processar resultado do info
      let infoData: AppInfoResponse;
      if (results[1].status === 'fulfilled') {
        infoData = results[1].value as AppInfoResponse;
      } else {
        console.error('[ApiProvider] Erro ao obter info da app:', results[1].reason);
        infoData = {
          name: 'Sistema de Controle de Comparecimento',
          version: '1.0.0',
          description: 'Sistema de Controle de Liberdade Provisória',
          environment: process.env.NODE_ENV || 'development',
          buildTime: new Date().toISOString(),
          javaVersion: 'N/A',
          springBootVersion: 'N/A'
        };
      }

      // Determinar se está conectado
      const connected = healthData.status === 'UP';
      
      // Atualizar estados
      setIsConnected(connected);
      setHealth(healthData);
      setAppInfo(infoData);
      setLastCheck(new Date());

      // Salvar no cache
      saveToCache(connected, healthData, infoData);

      console.log('[ApiProvider] Resultado da verificação:', {
        connected,
        healthStatus: healthData.status,
        appName: infoData.name,
        appVersion: infoData.version,
        timestamp: new Date().toISOString()
      });

      return connected;

    } catch (error) {
      console.error('[ApiProvider] Erro inesperado ao verificar conexão:', error);
      
      const errorHealth: HealthResponse = {
        status: 'DOWN',
        timestamp: new Date().toISOString(),
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      };

      const errorInfo: AppInfoResponse = {
        name: 'Sistema de Controle de Comparecimento',
        version: '1.0.0',
        description: 'Erro de conexão',
        environment: 'unknown',
        buildTime: 'N/A',
        javaVersion: 'N/A',
        springBootVersion: 'N/A'
      };

      setIsConnected(false);
      setHealth(errorHealth);
      setAppInfo(errorInfo);
      setLastCheck(new Date());

      // Salvar no cache mesmo em erro
      saveToCache(false, errorHealth, errorInfo);
      
      return false;

    } finally {
      setIsChecking(false);
    }
  }, [isChecking, isConnected, loadFromCache, saveToCache]);

  /**
   * Força uma nova verificação ignorando o cache
   */
  const forceCheck = useCallback(async (): Promise<boolean> => {
    console.log('[ApiProvider] Forçando nova verificação (ignorando cache)...');
    clearCache();
    return checkConnection();
  }, [checkConnection, clearCache]);

  /**
   * Configura token de autenticação
   */
  const setAuthToken = useCallback((token: string) => {
    console.log('[ApiProvider] Configurando token de autenticação');
    configureAuthHeaders(token);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('api_auth_token', token);
    }
  }, []);

  /**
   * Remove autenticação
   */
  const clearAuth = useCallback(() => {
    console.log('[ApiProvider] Removendo autenticação');
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('api_auth_token');
    }

    // Limpar cache ao fazer logout
    clearCache();
  }, [clearCache]);


  // Effects

  /**
   * Inicialização (executa apenas uma vez)
   */
  useEffect(() => {
    if (isInitializedRef.current) return;

    console.log('[ApiProvider] Inicializando API Provider...');
    console.log('[ApiProvider] Configurações:', {
      autoCheck,
      checkInterval,
      enableCache,
      cacheTimeout
    });

    // Inicializar API
    initializeBackendApi();
    
    // Recuperar token do localStorage se existir
    if (typeof window !== 'undefined') {
      const savedToken = localStorage.getItem('api_auth_token');
      if (savedToken) {
        console.log('[ApiProvider] Token encontrado no localStorage');
        configureAuthHeaders(savedToken);
      }
    }
    
    // Marcar como inicializado
    isInitializedRef.current = true;

    // Verificação inicial SOMENTE se autoCheck estiver habilitado
    if (autoCheck) {
      // Delay pequeno para evitar conflito com outras inicializações
      checkTimeoutRef.current = setTimeout(() => {
        console.log('[ApiProvider] Executando verificação inicial...');
        checkConnection();
      }, 1000);
    }

    return () => {
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }
    };
  }, []); // Executar apenas uma vez

  /**
   * Verificação periódica
   */
  useEffect(() => {
    // Só configurar interval se autoCheck estiver habilitado
    if (!autoCheck || !checkInterval || checkInterval <= 0) {
      return;
    }

    console.log('[ApiProvider] Configurando verificação periódica a cada', checkInterval, 'ms');

    intervalRef.current = setInterval(() => {
      console.log('[ApiProvider] Executando verificação periódica...');
      checkConnection();
    }, checkInterval);

    return () => {
      if (intervalRef.current) {
        console.log('[ApiProvider] Limpando verificação periódica');
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [autoCheck, checkInterval, checkConnection]);

  /**
   * Limpar cache quando componente desmontar
   */
  useEffect(() => {
    return () => {
      clearCache();
    };
  }, [clearCache]);

  /**
   * Log de mudanças de estado (apenas em desenvolvimento)
   */
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && lastCheck) {
      console.log('[ApiProvider] Estado atualizado:', {
        isConnected,
        isChecking,
        timestamp: lastCheck.toISOString(),
        healthStatus: health?.status,
        appName: appInfo?.name,
        appVersion: appInfo?.version,
        cacheValid: isCacheValid()
      });
    }
  }, [isConnected, isChecking, lastCheck, health, appInfo, isCacheValid]);


  // Context Value


  const value: ApiContextType = {
    isConnected,
    health,
    appInfo,
    lastCheck,
    isChecking,
    checkConnection,
    setAuthToken,
    clearAuth,
    forceCheck
  };

  return <ApiContext.Provider value={value}>{children}</ApiContext.Provider>;
}

// Hooks

/**
 * Hook principal para usar o contexto da API
 */
export function useApi(): ApiContextType {
  const context = useContext(ApiContext);
  if (context === undefined) {
    throw new Error('useApi deve ser usado dentro de um ApiProvider');
  }
  return context;
}

/**
 * Hook simplificado para verificar conexão
 */
export function useApiConnection(): boolean {
  const { isConnected } = useApi();
  return isConnected;
}

/**
 * Hook simplificado para obter informações da app
 */
export function useAppInfo(): AppInfoResponse | null {
  const { appInfo } = useApi();
  return appInfo;
}

/**
 * Hook para obter status de saúde
 */
export function useApiHealth(): HealthResponse | null {
  const { health } = useApi();
  return health;
}

// Componentes de UI

/**
 * Indicador visual de status da API (apenas em desenvolvimento)
 */
export function ApiStatusIndicator() {
  const { isConnected, lastCheck, isChecking, checkConnection, forceCheck } = useApi();
  const [showDetails, setShowDetails] = useState(false);

  //DEV
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`rounded-lg text-sm font-medium shadow-lg transition-all ${
        isConnected 
          ? 'bg-green-100 text-green-800 border border-green-200' 
          : 'bg-red-100 text-red-800 border border-red-200'
      }`}>
        {/* Header */}
        <div 
          className="px-3 py-2 flex items-center gap-2 cursor-pointer"
          onClick={() => setShowDetails(!showDetails)}
        >
          <div className={`w-2 h-2 rounded-full ${
            isChecking 
              ? 'bg-yellow-500 animate-pulse' 
              : isConnected 
                ? 'bg-green-500' 
                : 'bg-red-500'
          }`} />
          
          <span>
            API: {isChecking ? 'Verificando...' : isConnected ? 'Conectada' : 'Desconectada'}
          </span>
          
          {lastCheck && (
            <span className="text-xs opacity-75">
              {lastCheck.toLocaleTimeString('pt-BR')}
            </span>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              checkConnection();
            }}
            disabled={isChecking}
            className="ml-2 px-2 py-1 bg-white bg-opacity-50 rounded text-xs hover:bg-opacity-75 transition-colors disabled:opacity-50"
            title="Verificar novamente"
          >
            ↻
          </button>

          <span className="text-xs">
            {showDetails ? '▼' : '▶'}
          </span>
        </div>

        {/* Details */}
        {showDetails && (
          <div className="px-3 py-2 border-t border-current border-opacity-20 space-y-2 text-xs">
            <div>
              <strong>Status:</strong> {isConnected ? 'Online' : 'Offline'}
            </div>
            
            {lastCheck && (
              <div>
                <strong>Última verificação:</strong><br />
                {lastCheck.toLocaleString('pt-BR')}
              </div>
            )}

            <div className="flex gap-2 mt-2">
              <button
                onClick={forceCheck}
                disabled={isChecking}
                className="px-2 py-1 bg-white bg-opacity-70 rounded hover:bg-opacity-100 transition-colors disabled:opacity-50 text-xs"
              >
                Forçar Check
              </button>
              
              <button
                onClick={() => setShowDetails(false)}
                className="px-2 py-1 bg-white bg-opacity-70 rounded hover:bg-opacity-100 transition-colors text-xs"
              >
                Fechar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Componente de alerta quando API está offline
 */
export function ApiOfflineAlert() {
  const { isConnected, isChecking, checkConnection } = useApi();

  if (isConnected || isChecking) {
    return null;
  }

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-top-2">
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg max-w-md">
        <div className="flex items-start gap-3">
          <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-white text-xs">!</span>
          </div>
          
          <div className="flex-1">
            <h3 className="font-semibold text-red-800 mb-1">
              Sem conexão com o servidor
            </h3>
            <p className="text-sm text-red-700 mb-3">
              Não foi possível conectar ao servidor. Algumas funcionalidades podem estar limitadas.
            </p>
            
            <button
              onClick={checkConnection}
              className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700 transition-colors"
            >
              Tentar Novamente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * HOC para proteger componentes que precisam da API
 */
export function withApiConnection<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    fallback?: React.ReactNode;
    checkOnMount?: boolean;
  }
) {
  return function WithApiConnection(props: P) {
    const { isConnected, isChecking, checkConnection } = useApi();

    useEffect(() => {
      if (options?.checkOnMount && !isConnected && !isChecking) {
        checkConnection();
      }
    }, [isConnected, isChecking, checkConnection]);

    if (!isConnected && !isChecking) {
      return options?.fallback || (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-red-500 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Servidor indisponível
            </h3>
            <p className="text-gray-600 mb-4">
              Não foi possível conectar ao servidor
            </p>
            <button
              onClick={checkConnection}
              className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark transition-colors"
            >
              Tentar Novamente
            </button>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
}

export type { ApiContextType, ApiProviderProps };