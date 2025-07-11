import React from 'react';

interface AlertProps {
  type?: 'info' | 'warning' | 'error' | 'success';
  message: string | React.ReactNode;
  className?: string;
}

const icons: Record<string, string> = {
  info: 'ℹ️',
  warning: '⏰',
  error: '❗',
  success: '✅',
};

const bgColors: Record<string, string> = {
  info: 'bg-primary text-white',
  warning: 'bg-warning text-text-base',
  error: 'bg-danger text-white',
  success: 'bg-secondary text-white',
};

export const Alert: React.FC<AlertProps> = ({ type = 'info', message, className = '' }) => {
  return (
    <div className={`flex items-center gap-2 p-3 rounded-md ${bgColors[type]} ${className}`}>
      <span>{icons[type]}</span>
      <div className="flex-1">
        {typeof message === 'string' ? <span>{message}</span> : message}
      </div>
    </div>
  );
};