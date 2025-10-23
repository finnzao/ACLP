'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, ComponentType } from 'react';

/**
 * Hook seguro para usar searchParams
 * Use este hook ao invés de useSearchParams() diretamente
 */
export function useSearchParamsSafe() {
  return useSearchParams();
}

/**
 * HOC (Higher Order Component) que envolve um componente com Suspense
 * Use para componentes que utilizam useSearchParams
 * 
 * @example
 * function MyPage() {
 *   const searchParams = useSearchParamsSafe();
 *   // ...
 * }
 * export default withSearchParams(MyPage);
 */
export function withSearchParams<P extends object>(
  Component: ComponentType<P>
): ComponentType<P> {
  const WrappedComponent = (props: P) => {
    return (
      <Suspense
        fallback={
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-lg text-gray-600">Carregando página...</p>
              <p className="text-sm text-gray-500 mt-2">Aguarde um momento</p>
            </div>
          </div>
        }
      >
        <Component {...props} />
      </Suspense>
    );
  };

  // Define o displayName para facilitar debug
  WrappedComponent.displayName = `withSearchParams(${Component.displayName || Component.name || 'Component'})`;

  return WrappedComponent;
}

/**
 * Componente de Loading customizável
 * Use se quiser um loading diferente do padrão
 */
export function SearchParamsLoader({ message = 'Carregando...' }: { message?: string }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-lg text-gray-600">{message}</p>
      </div>
    </div>
  );
}

/**
 * HOC com loading customizado
 * 
 * @example
 * export default withSearchParamsCustom(MyPage, { message: 'Carregando dados...' });
 */
export function withSearchParamsCustom<P extends object>(
  Component: ComponentType<P>,
  loaderProps?: { message?: string }
): ComponentType<P> {
  const WrappedComponent = (props: P) => {
    return (
      <Suspense fallback={<SearchParamsLoader {...loaderProps} />}>
        <Component {...props} />
      </Suspense>
    );
  };

  WrappedComponent.displayName = `withSearchParamsCustom(${Component.displayName || Component.name || 'Component'})`;

  return WrappedComponent;
}