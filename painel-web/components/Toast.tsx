// painel-web/components/Toast.tsx
'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (toast: Omit<Toast, 'id'>) => void;
  hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast deve ser usado dentro de ToastProvider');
  }
  return context;
}

// Componente individual do Toast
function ToastItem({ toast, onClose }: { toast: Toast; onClose: (id: string) => void }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Animar entrada
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Auto-remover após duração especificada
    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, toast.duration);
      return () => clearTimeout(timer);
    }
  }, [toast.duration]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onClose(toast.id);
    }, 300);
  };

  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertCircle,
    info: Info
  };

  const colors = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  };

  const iconColors = {
    success: 'text-green-600',
    error: 'text-red-600',
    warning: 'text-yellow-600',
    info: 'text-blue-600'
  };

  const Icon = icons[toast.type];

  return (
    <div
      className={`
      transform transition-all duration-300 ease-in-out
      ${isVisible && !isLeaving ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      max-w-lg w-full bg-white border rounded-lg shadow-lg pointer-events-auto
      ${colors[toast.type]}
    `}
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <Icon className={`w-5 h-5 ${iconColors[toast.type]}`} />
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium">
              {toast.title}
            </p>
            <p className="mt-1 text-sm opacity-90">
              {toast.message}
            </p>
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              onClick={handleClose}
              className="rounded-md inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Container dos Toasts
function ToastContainer({ toasts, onClose }: { toasts: Toast[]; onClose: (id: string) => void }) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  );
}

// Provider do Toast
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: Toast = {
      ...toast,
      id,
      duration: toast.duration ?? 5000 // 5 segundos por padrão
    };

    setToasts(prev => [...prev, newToast]);
  };

  const hideToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      <ToastContainer toasts={toasts} onClose={hideToast} />
    </ToastContext.Provider>
  );
}

// Helpers para tipos específicos de toast
export const toast = {
  success: (title: string, message: string, duration?: number) => {
    const context = useContext(ToastContext);
    context?.showToast({ type: 'success', title, message, duration });
  },
  error: (title: string, message: string, duration?: number) => {
    const context = useContext(ToastContext);
    context?.showToast({ type: 'error', title, message, duration });
  },
  warning: (title: string, message: string, duration?: number) => {
    const context = useContext(ToastContext);
    context?.showToast({ type: 'warning', title, message, duration });
  },
  info: (title: string, message: string, duration?: number) => {
    const context = useContext(ToastContext);
    context?.showToast({ type: 'info', title, message, duration });
  }
};

// Hook personalizado para facilitar o uso
export function useToastHelpers() {
  const { showToast } = useToast();

  return {
    success: (title: string, message: string, duration?: number) =>
      showToast({ type: 'success', title, message, duration }),

    error: (title: string, message: string, duration?: number) =>
      showToast({ type: 'error', title, message, duration }),

    warning: (title: string, message: string, duration?: number) =>
      showToast({ type: 'warning', title, message, duration }),

    info: (title: string, message: string, duration?: number) =>
      showToast({ type: 'info', title, message, duration }),

    // Específicos para exportação
    exportSuccess: (count: number, filename?: string) =>
      showToast({
        type: 'success',
        title: 'Exportação Concluída',
        message: `${count} registros exportados com sucesso${filename ? ` em ${filename}` : ''}`,
        duration: 6000
      }),

    exportError: (error: string) =>
      showToast({
        type: 'error',
        title: 'Erro na Exportação',
        message: error,
        duration: 8000
      })
  };
}