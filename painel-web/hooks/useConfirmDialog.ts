import { useState, useCallback } from 'react';

interface ConfirmDialogState {
  isOpen: boolean;
  title: string;
  message: string;
  details: string[];
  type: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
}

export function useConfirmDialog() {
  const [dialogState, setDialogState] = useState<ConfirmDialogState>({
    isOpen: false,
    title: '',
    message: '',
    details: [],
    type: 'danger',
    onConfirm: () => {}
  });

  const showConfirm = useCallback((
    title: string,
    message: string,
    onConfirm: () => void,
    options?: {
      details?: string[];
      type?: 'danger' | 'warning' | 'info';
    }
  ) => {
    setDialogState({
      isOpen: true,
      title,
      message,
      details: options?.details || [],
      type: options?.type || 'danger',
      onConfirm
    });
  }, []);

  const hideConfirm = useCallback(() => {
    setDialogState(prev => ({ ...prev, isOpen: false }));
  }, []);

  const confirmAndClose = useCallback(() => {
    dialogState.onConfirm();
    hideConfirm();
  }, [dialogState.onConfirm, hideConfirm]);

  return {
    dialogState,
    showConfirm,
    hideConfirm,
    confirmAndClose
  };
}