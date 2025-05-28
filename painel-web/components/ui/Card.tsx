import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`bg-card-bg border border-border rounded-lg p-4 shadow-sm ${className}`}>
      {children}
    </div>
  );
};