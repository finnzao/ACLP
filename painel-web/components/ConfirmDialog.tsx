'use client';

import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  details?: string[];
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  type = 'danger',
  details = []
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const typeStyles = {
    danger: {
      icon: 'bg-red-100 text-red-600',
      confirmButton: 'bg-red-500 hover:bg-red-600',
      border: 'border-red-200'
    },
    warning: {
      icon: 'bg-yellow-100 text-yellow-600',
      confirmButton: 'bg-yellow-500 hover:bg-yellow-600',
      border: 'border-yellow-200'
    },
    info: {
      icon: 'bg-blue-100 text-blue-600',
      confirmButton: 'bg-blue-500 hover:bg-blue-600',
      border: 'border-blue-200'
    }
  };

  const styles = typeStyles[type];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] px-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className={`border-b ${styles.border} p-6`}>
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${styles.icon}`}>
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">
                {title}
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                {message}
              </p>
              
              {/* Detalhes adicionais */}
              {details.length > 0 && (
                <div className="mt-3 bg-gray-50 rounded-lg p-3">
                  {details.map((detail, index) => (
                    <div key={index} className="text-xs text-gray-600">
                      <span className="font-medium">{detail}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-2 text-white rounded-lg font-medium transition-colors ${styles.confirmButton}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}