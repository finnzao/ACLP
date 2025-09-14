// contexts/ApiContext.tsx
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { testService, initializeBackendApi, configureAuthHeaders } from '@/lib/api/services';
import { HealthResponse, AppInfoResponse } from '@/types/api';

interface ApiContextType {
  isConnected: boolean;
  health: HealthResponse | null;
  appInfo: AppInfoResponse | null;
  lastCheck: Date | null;
  checkConnection: () => Promise<boolean>;
  setAuthToken: (token: string) => void;
  clearAuth: () => void;
}

const ApiContext = createContext<ApiContextType | undefined>(undefined);

interface ApiProviderProps {
  children: ReactNode;
  autoCheck?: boolean;
  checkInterval?: number; // em milissegundos
}

export function ApiProvider({ 
  children, 
  autoCheck = true, 
  checkInterval = 300000 // 5 minutos
}: ApiProviderProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [appInfo, setAppInfo] = useState<AppInfoResponse | null>(null);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const checkConnection = async (): Promise<boolean> => {
    try {
      console.log('[ApiProvider] Verificando conexão com o backend...');
      
      const [healthData, infoData] = await Promise.allSettled([
        testService.health(),
        testService.info()
      ]);

      // Processar resultado do health check
      let health: HealthResponse;
      if (healthData.status === 'fulfilled') {
        health = healthData.value;
      } else {
        console.error('[ApiProvider] Erro no health check:', healthData.reason);
        health = { status: 'DOWN', timestamp: new Date().toISOString() };
      }

      // Processar resultado do info
      let appInfo: AppInfoResponse;
      if (infoData.status === 'fulfilled') {
        appInfo = infoData.value;
      } else {
        console.error('[ApiProvider] Erro ao obter info da app:', infoData.reason);
        appInfo = {
          name: 'Unknown',
          version: '0.0.0',
          description: 'N/A',
          environment: 'unknown',
          buildTime: 'N/A',
          javaVersion: 'N/A',
          springBootVersion: 'N/A'
        };
      }

      // Determinar se está conectado
      // Consideramos conectado se pelo menos o health check funcionou E retornou UP
      const connected = health.status === 'UP';
      
      setIsConnected(connected);
      setHealth(health);
      setAppInfo(appInfo);
      setLastCheck(new Date());

      console.log('[ApiProvider] Resultado da verificação:', {
        connected,
        healthStatus: health.status,
        appName: appInfo.name,
        appVersion: appInfo.version,
        timestamp: new Date().toISOString()
      });

      return connected;
    } catch (error) {
      console.error('[ApiProvider] Erro ao verificar conexão:', error);
      
      setIsConnected(false);
      setHealth({ status: 'DOWN', timestamp: new Date().toISOString() });
      setAppInfo({
        name: 'Connection Error',
        version: '0.0.0',
        description: 'N/A',
        environment: 'unknown',
        buildTime: 'N/A',
        javaVersion: 'N/A',
        springBootVersion: 'N/A'
      });
      setLastCheck(new Date());
      
      return false;
    }
  };

  const setAuthToken = (token: string) => {
    console.log('[ApiProvider] Configurando token de autenticação');
    configureAuthHeaders(token);
    
    // Salvar no localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('api_auth_token', token);
    }
  };

  const clearAuth = () => {
    console.log('[ApiProvider] Removendo autenticação');
    // clearAuthHeaders(); // Implementar esta função no backend-api.ts
    
    // Remover do localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('api_auth_token');
    }
  };

  // Inicialização
  useEffect(() => {
    console.log('[ApiProvider] Inicializando API...');
    
    // Inicializar API
    initializeBackendApi();
    
    // Recuperar token do localStorage se existir
    if (typeof window !== 'undefined') {
      const savedToken = localStorage.getItem('api_auth_token');
      if (savedToken) {
        console.log('[ApiProvider] Token encontrado no localStorage, configurando...');
        configureAuthHeaders(savedToken);
      }
    }
    
    // Verificação inicial
    if (autoCheck) {
      checkConnection();
    }
  }, [autoCheck]);

  // Verificação periódica
  useEffect(() => {
    if (!autoCheck || !checkInterval) return;

    const interval = setInterval(() => {
      console.log('[ApiProvider] Verificação periódica da conexão...');
      checkConnection();
    }, checkInterval);

    return () => {
      clearInterval(interval);
    };
  }, [autoCheck, checkInterval]);

  // Log das mudanças de estado
  useEffect(() => {
    if (lastCheck) {
      console.log('[ApiProvider] Estado atualizado:', {
        isConnected,
        timestamp: lastCheck.toISOString(),
        healthStatus: health?.status,
        appName: appInfo?.name
      });
    }
  }, [isConnected, lastCheck, health, appInfo]);

  const value: ApiContextType = {
    isConnected,
    health,
    appInfo,
    lastCheck,
    checkConnection,
    setAuthToken,
    clearAuth
  };

  return <ApiContext.Provider value={value}>{children}</ApiContext.Provider>;
}

// Hook para usar o contexto
export function useApi(): ApiContextType {
  const context = useContext(ApiContext);
  if (context === undefined) {
    throw new Error('useApi deve ser usado dentro de um ApiProvider');
  }
  return context;
}

// Hook para verificar se a API está conectada
export function useApiConnection(): boolean {
  const { isConnected } = useApi();
  return isConnected;
}

// Hook para obter informações da aplicação
export function useAppInfo(): AppInfoResponse | null {
  const { appInfo } = useApi();
  return appInfo;
}

// Componente para exibir status da conexão (útil para debug)
export function ApiStatusIndicator() {
  const { isConnected, lastCheck, checkConnection } = useApi();

  if (process.env.NODE_ENV !== 'development') {
    return null; // Só mostrar em desenvolvimento
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-lg ${
        isConnected 
          ? 'bg-green-100 text-green-800 border border-green-200' 
          : 'bg-red-100 text-red-800 border border-red-200'
      }`}>
        <div className={`w-2 h-2 rounded-full ${
          isConnected ? 'bg-green-500' : 'bg-red-500'
        }`} />
        <span>
          API: {isConnected ? 'Conectada' : 'Desconectada'}
        </span>
        {lastCheck && (
          <span className="text-xs opacity-75">
            {lastCheck.toLocaleTimeString()}
          </span>
        )}
        <button
          onClick={checkConnection}
          className="ml-2 px-2 py-1 bg-white bg-opacity-50 rounded text-xs hover:bg-opacity-75 transition-colors"
        >
          ↻
        </button>
      </div>
    </div>
  );
}